import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';

@Injectable()
export class ConfiguracionService {
  constructor(private prisma: PrismaService) {}

  async getValor(clave: string): Promise<string | null> {
    const config = await this.prisma.configuracion.findUnique({
      where: { clave },
    });
    return config?.valor || null;
  }

  async setValor(clave: string, valor: string, descripcion?: string, userId?: string) {
    return this.prisma.configuracion.upsert({
      where: { clave },
      update: {
        valor,
        updatedBy: userId,
      },
      create: {
        clave,
        valor,
        descripcion,
        updatedBy: userId,
      },
    });
  }

  async getConsecutivoContrato(ano: number): Promise<number> {
    const clave = `consecutivo_contrato_${ano}`;
    const valor = await this.getValor(clave);
    return valor ? parseInt(valor, 10) : 0;
  }

  async incrementarConsecutivoContrato(ano: number, userId?: string): Promise<number> {
    const clave = `consecutivo_contrato_${ano}`;
    const actual = await this.getConsecutivoContrato(ano);
    const nuevo = actual + 1;
    await this.setValor(clave, nuevo.toString(), `Consecutivo de contratos para el año ${ano}`, userId);
    return nuevo;
  }
}
