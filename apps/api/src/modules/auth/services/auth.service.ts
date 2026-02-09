import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '@/database/prisma.service';
import { LoginDto } from '../dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async login(loginDto: LoginDto) {
    const { username, password } = loginDto;

    // Find user
    const usuario = await this.prisma.usuario.findUnique({
      where: { username },
    });

    if (!usuario || !usuario.activo) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, usuario.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // Update last access
    await this.prisma.usuario.update({
      where: { id: usuario.id },
      data: { ultimoAcceso: new Date() },
    });

    // Generate tokens
    const tokens = await this.generateTokens(usuario);

    return {
      ...tokens,
      user: {
        id: usuario.id,
        username: usuario.username,
        email: usuario.email,
        nombre: usuario.nombre,
        apellidos: usuario.apellidos,
        rol: usuario.rol,
      },
    };
  }

  async refreshTokens(refreshToken: string) {
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token requerido');
    }

    // Verify refresh token in database
    const tokenRecord = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { usuario: true },
    });

    if (!tokenRecord || tokenRecord.revokedAt || tokenRecord.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token inválido o expirado');
    }

    const usuario = tokenRecord.usuario;

    if (!usuario.activo) {
      throw new UnauthorizedException('Usuario inactivo');
    }

    // Revoke old refresh token
    await this.prisma.refreshToken.update({
      where: { id: tokenRecord.id },
      data: { revokedAt: new Date() },
    });

    // Generate new tokens
    const tokens = await this.generateTokens(usuario);

    return {
      ...tokens,
      user: {
        id: usuario.id,
        username: usuario.username,
        email: usuario.email,
        nombre: usuario.nombre,
        apellidos: usuario.apellidos,
        rol: usuario.rol,
      },
    };
  }

  async logout(userId: string, refreshToken: string) {
    if (!refreshToken) {
      throw new BadRequestException('Refresh token requerido');
    }

    // Revoke refresh token
    await this.prisma.refreshToken.updateMany({
      where: {
        token: refreshToken,
        usuarioId: userId,
      },
      data: { revokedAt: new Date() },
    });

    return { message: 'Sesión cerrada exitosamente' };
  }

  async getProfile(userId: string) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        nombre: true,
        apellidos: true,
        rol: true,
        ultimoAcceso: true,
        createdAt: true,
      },
    });

    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return usuario;
  }

  private async generateTokens(usuario: {
    id: string;
    username: string;
    rol: string;
    nombre?: string;
    apellidos?: string;
  }) {
    const payload = {
      sub: usuario.id,
      username: usuario.username,
      rol: usuario.rol,
      nombre: usuario.nombre || '',
      apellidos: usuario.apellidos || '',
    };

    const accessToken = this.jwtService.sign(payload);

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get('jwt.refreshSecret'),
      expiresIn: this.configService.get('jwt.refreshExpiration'),
    });

    // Store refresh token
    const refreshExpiresIn = 7 * 24 * 60 * 60 * 1000; // 7 days
    await this.prisma.refreshToken.create({
      data: {
        token: refreshToken,
        usuarioId: usuario.id,
        expiresAt: new Date(Date.now() + refreshExpiresIn),
      },
    });

    return {
      accessToken,
      refreshToken,
    };
  }

  async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
  }
}
