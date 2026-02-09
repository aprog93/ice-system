import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '@/app.module';
import { PrismaService } from '@/database/prisma.service';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { TipoPasaporte, Rol } from '@prisma/client';

/**
 * Integration Tests for PasaportesController
 *
 * Tests the complete HTTP layer including:
 * - Routing
 * - Request/Response validation
 * - Authentication/Authorization
 * - DTO validation
 * - Error handling
 */
describe('PasaportesController (e2e)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;

  // Test data
  const testUser = {
    userId: 'test-user-id',
    username: 'testuser',
    rol: Rol.ADMIN,
  };

  const mockJwtAuthGuard = {
    canActivate: jest.fn(() => true),
  };

  const mockRolesGuard = {
    canActivate: jest.fn(() => true),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtAuthGuard)
      .overrideGuard(RolesGuard)
      .useValue(mockRolesGuard)
      .compile();

    app = moduleFixture.createNestApplication();

    // Apply same validation as main app
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );

    await app.init();

    prismaService = moduleFixture.get<PrismaService>(PrismaService);

    // Clean up test data before starting
    await cleanupTestData();
  });

  afterAll(async () => {
    await cleanupTestData();
    await app.close();
  });

  async function cleanupTestData() {
    // Delete test data in correct order (respecting FK constraints)
    await prismaService.visa.deleteMany({
      where: { pasaporte: { numero: { startsWith: 'TEST' } } },
    });
    await prismaService.pasaporte.deleteMany({
      where: { numero: { startsWith: 'TEST' } },
    });
    await prismaService.profesor.deleteMany({
      where: { ci: { startsWith: 'TEST' } },
    });
  }

  async function createTestProfesor() {
    return prismaService.profesor.create({
      data: {
        ci: `TEST${Date.now()}`,
        nombre: 'Test',
        apellidos: 'Profesor',
        edad: 30,
        sexo: 'MASCULINO',
        estadoCivil: 'SOLTERO',
        cantidadHijos: 0,
        anosExperiencia: 5,
        nivelIngles: 'INTERMEDIO',
        estadoPotencial: 'ACTIVO',
        provinciaId: 'provincia-uuid',
        municipioId: 'municipio-uuid',
      },
    });
  }

  async function createTestPasaporte(profesorId: string, overrides = {}) {
    return prismaService.pasaporte.create({
      data: {
        profesorId,
        tipo: TipoPasaporte.ORDINARIO,
        numero: `TEST${Date.now()}`,
        fechaExpedicion: new Date('2023-01-15'),
        fechaVencimiento: new Date('2033-01-15'),
        activo: true,
        ...overrides,
      },
    });
  }

  describe('Authentication', () => {
    it('should return 401 when not authenticated', async () => {
      // Arrange
      mockJwtAuthGuard.canActivate.mockReturnValueOnce(false);

      // Act & Assert
      await request(app.getHttpServer()).get('/pasaportes').expect(401);
    });
  });

  describe('GET /pasaportes', () => {
    it('should return paginated list of pasaportes', async () => {
      // Act
      const response = await request(app.getHttpServer()).get('/pasaportes').expect(200);

      // Assert
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('meta');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.meta).toHaveProperty('total');
      expect(response.body.meta).toHaveProperty('page');
      expect(response.body.meta).toHaveProperty('limit');
      expect(response.body.meta).toHaveProperty('totalPages');
    });

    it('should filter by profesorId', async () => {
      // Arrange
      const profesor = await createTestProfesor();
      const pasaporte = await createTestPasaporte(profesor.id);

      // Act
      const response = await request(app.getHttpServer())
        .get(`/pasaportes?profesorId=${profesor.id}`)
        .expect(200);

      // Assert
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].profesorId).toBe(profesor.id);

      // Cleanup
      await prismaService.pasaporte.delete({ where: { id: pasaporte.id } });
      await prismaService.profesor.delete({ where: { id: profesor.id } });
    });

    it('should filter by numero', async () => {
      // Arrange
      const profesor = await createTestProfesor();
      const numero = `TEST${Date.now()}`;
      const pasaporte = await createTestPasaporte(profesor.id, { numero });

      // Act
      const response = await request(app.getHttpServer())
        .get(`/pasaportes?numero=${numero}`)
        .expect(200);

      // Assert
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].numero).toBe(numero);

      // Cleanup
      await prismaService.pasaporte.delete({ where: { id: pasaporte.id } });
      await prismaService.profesor.delete({ where: { id: profesor.id } });
    });

    it('should filter by estado=vencidos', async () => {
      // Act
      const response = await request(app.getHttpServer())
        .get('/pasaportes?estado=vencidos')
        .expect(200);

      // Assert
      expect(Array.isArray(response.body.data)).toBe(true);
      // All returned passports should have fechaVencimiento < today
      const today = new Date();
      response.body.data.forEach((p: any) => {
        expect(new Date(p.fechaVencimiento) < today).toBe(true);
      });
    });

    it('should filter by estado=proximos', async () => {
      // Act
      const response = await request(app.getHttpServer())
        .get('/pasaportes?estado=proximos')
        .expect(200);

      // Assert
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should apply pagination correctly', async () => {
      // Act
      const response = await request(app.getHttpServer())
        .get('/pasaportes?page=2&limit=5')
        .expect(200);

      // Assert
      expect(response.body.meta.page).toBe(2);
      expect(response.body.meta.limit).toBe(5);
    });

    it('should include profesor data in response', async () => {
      // Arrange
      const profesor = await createTestProfesor();
      const pasaporte = await createTestPasaporte(profesor.id);

      // Act
      const response = await request(app.getHttpServer()).get('/pasaportes').expect(200);

      // Assert
      if (response.body.data.length > 0) {
        const p = response.body.data[0];
        expect(p.profesor).toBeDefined();
        expect(p.profesor).toHaveProperty('id');
        expect(p.profesor).toHaveProperty('ci');
        expect(p.profesor).toHaveProperty('nombre');
        expect(p.profesor).toHaveProperty('apellidos');
      }

      // Cleanup
      await prismaService.pasaporte.delete({ where: { id: pasaporte.id } });
      await prismaService.profesor.delete({ where: { id: profesor.id } });
    });
  });

  describe('GET /pasaportes/:id', () => {
    it('should return a pasaporte by id', async () => {
      // Arrange
      const profesor = await createTestProfesor();
      const pasaporte = await createTestPasaporte(profesor.id);

      // Act
      const response = await request(app.getHttpServer())
        .get(`/pasaportes/${pasaporte.id}`)
        .expect(200);

      // Assert
      expect(response.body).toHaveProperty('id', pasaporte.id);
      expect(response.body).toHaveProperty('numero', pasaporte.numero);
      expect(response.body).toHaveProperty('profesor');
      expect(response.body).toHaveProperty('visas');
      expect(Array.isArray(response.body.visas)).toBe(true);

      // Cleanup
      await prismaService.pasaporte.delete({ where: { id: pasaporte.id } });
      await prismaService.profesor.delete({ where: { id: profesor.id } });
    });

    it('should return 404 when pasaporte not found', async () => {
      // Act & Assert
      const response = await request(app.getHttpServer())
        .get('/pasaportes/non-existent-uuid')
        .expect(404);

      expect(response.body.message).toContain('no encontrado');
    });

    it('should return 404 for inactive pasaporte', async () => {
      // Arrange
      const profesor = await createTestProfesor();
      const pasaporte = await createTestPasaporte(profesor.id, { activo: false });

      // Act & Assert
      await request(app.getHttpServer()).get(`/pasaportes/${pasaporte.id}`).expect(404);

      // Cleanup
      await prismaService.pasaporte.delete({ where: { id: pasaporte.id } });
      await prismaService.profesor.delete({ where: { id: profesor.id } });
    });

    it('should validate UUID format', async () => {
      // Act & Assert
      await request(app.getHttpServer()).get('/pasaportes/invalid-uuid').expect(400);
    });
  });

  describe('POST /pasaportes', () => {
    it('should create a new pasaporte', async () => {
      // Arrange
      const profesor = await createTestProfesor();
      const numero = `TEST${Date.now()}`;

      const createDto = {
        profesorId: profesor.id,
        tipo: TipoPasaporte.ORDINARIO,
        numero: numero,
        fechaExpedicion: '2023-01-15',
        fechaVencimiento: '2033-01-15',
        lugarExpedicion: 'Habana',
      };

      // Act
      const response = await request(app.getHttpServer())
        .post('/pasaportes')
        .set('X-User-Id', testUser.userId)
        .send(createDto)
        .expect(201);

      // Assert
      expect(response.body).toHaveProperty('id');
      expect(response.body.numero).toBe(numero.toUpperCase());
      expect(response.body.tipo).toBe(TipoPasaporte.ORDINARIO);
      expect(response.body.profesorId).toBe(profesor.id);

      // Cleanup
      await prismaService.pasaporte.delete({ where: { id: response.body.id } });
      await prismaService.profesor.delete({ where: { id: profesor.id } });
    });

    it('should return 400 when required fields are missing', async () => {
      // Arrange
      const invalidDto = {
        tipo: TipoPasaporte.ORDINARIO,
        // Missing profesorId, numero, fechas
      };

      // Act & Assert
      const response = await request(app.getHttpServer())
        .post('/pasaportes')
        .send(invalidDto)
        .expect(400);

      expect(response.body.message).toBeDefined();
    });

    it('should return 400 when numero format is invalid', async () => {
      // Arrange
      const profesor = await createTestProfesor();

      const invalidDto = {
        profesorId: profesor.id,
        tipo: TipoPasaporte.ORDINARIO,
        numero: 'INVALID',
        fechaExpedicion: '2023-01-15',
        fechaVencimiento: '2033-01-15',
      };

      // Act & Assert
      await request(app.getHttpServer()).post('/pasaportes').send(invalidDto).expect(400);

      // Cleanup
      await prismaService.profesor.delete({ where: { id: profesor.id } });
    });

    it('should return 404 when profesor not found', async () => {
      // Arrange
      const createDto = {
        profesorId: 'non-existent-profesor-id',
        tipo: TipoPasaporte.ORDINARIO,
        numero: `TEST${Date.now()}`,
        fechaExpedicion: '2023-01-15',
        fechaVencimiento: '2033-01-15',
      };

      // Act & Assert
      await request(app.getHttpServer()).post('/pasaportes').send(createDto).expect(404);
    });

    it('should return 409 when numero already exists', async () => {
      // Arrange
      const profesor = await createTestProfesor();
      const numero = `TEST${Date.now()}`;
      const pasaporte = await createTestPasaporte(profesor.id, { numero });

      const createDto = {
        profesorId: profesor.id,
        tipo: TipoPasaporte.ORDINARIO,
        numero: numero,
        fechaExpedicion: '2023-01-15',
        fechaVencimiento: '2033-01-15',
      };

      // Act & Assert
      await request(app.getHttpServer()).post('/pasaportes').send(createDto).expect(409);

      // Cleanup
      await prismaService.pasaporte.delete({ where: { id: pasaporte.id } });
      await prismaService.profesor.delete({ where: { id: profesor.id } });
    });

    it('should return 400 when fechaVencimiento is before fechaExpedicion', async () => {
      // Arrange
      const profesor = await createTestProfesor();

      const invalidDto = {
        profesorId: profesor.id,
        tipo: TipoPasaporte.ORDINARIO,
        numero: `TEST${Date.now()}`,
        fechaExpedicion: '2023-01-15',
        fechaVencimiento: '2022-01-15', // Before expedición
      };

      // Act & Assert
      await request(app.getHttpServer()).post('/pasaportes').send(invalidDto).expect(400);

      // Cleanup
      await prismaService.profesor.delete({ where: { id: profesor.id } });
    });

    it('should require authentication', async () => {
      // Arrange
      mockRolesGuard.canActivate.mockReturnValueOnce(false);

      // Act & Assert
      await request(app.getHttpServer()).post('/pasaportes').send({}).expect(403);
    });
  });

  describe('PUT /pasaportes/:id', () => {
    it('should update a pasaporte', async () => {
      // Arrange
      const profesor = await createTestProfesor();
      const pasaporte = await createTestPasaporte(profesor.id);

      const updateDto = {
        profesorId: profesor.id,
        tipo: TipoPasaporte.OFICIAL,
        numero: pasaporte.numero,
        fechaExpedicion: '2023-01-15',
        fechaVencimiento: '2033-01-15',
        lugarExpedicion: 'Santiago',
      };

      // Act
      const response = await request(app.getHttpServer())
        .put(`/pasaportes/${pasaporte.id}`)
        .set('X-User-Id', testUser.userId)
        .send(updateDto)
        .expect(200);

      // Assert
      expect(response.body.tipo).toBe(TipoPasaporte.OFICIAL);

      // Cleanup
      await prismaService.pasaporte.delete({ where: { id: pasaporte.id } });
      await prismaService.profesor.delete({ where: { id: profesor.id } });
    });

    it('should return 404 when pasaporte not found', async () => {
      // Arrange
      const profesor = await createTestProfesor();

      const updateDto = {
        profesorId: profesor.id,
        tipo: TipoPasaporte.ORDINARIO,
        numero: `TEST${Date.now()}`,
        fechaExpedicion: '2023-01-15',
        fechaVencimiento: '2033-01-15',
      };

      // Act & Assert
      await request(app.getHttpServer())
        .put('/pasaportes/non-existent-uuid')
        .send(updateDto)
        .expect(404);

      // Cleanup
      await prismaService.profesor.delete({ where: { id: profesor.id } });
    });

    it('should return 400 for invalid UUID', async () => {
      // Act & Assert
      await request(app.getHttpServer()).put('/pasaportes/invalid-uuid').send({}).expect(400);
    });
  });

  describe('DELETE /pasaportes/:id', () => {
    it('should soft delete a pasaporte', async () => {
      // Arrange
      const profesor = await createTestProfesor();
      const pasaporte = await createTestPasaporte(profesor.id);

      // Act
      await request(app.getHttpServer()).delete(`/pasaportes/${pasaporte.id}`).expect(204);

      // Assert - Verify it's soft deleted
      const deleted = await prismaService.pasaporte.findUnique({
        where: { id: pasaporte.id },
      });
      expect(deleted?.activo).toBe(false);

      // Cleanup
      await prismaService.pasaporte.delete({ where: { id: pasaporte.id } });
      await prismaService.profesor.delete({ where: { id: profesor.id } });
    });

    it('should return 404 when pasaporte not found', async () => {
      // Act & Assert
      await request(app.getHttpServer()).delete('/pasaportes/non-existent-uuid').expect(404);
    });

    it('should require ADMIN role', async () => {
      // Arrange
      mockRolesGuard.canActivate.mockReturnValueOnce(false);

      // Act & Assert
      await request(app.getHttpServer()).delete('/pasaportes/some-uuid').expect(403);
    });
  });

  describe('GET /pasaportes/alertas/vencimientos', () => {
    it('should return alerts summary', async () => {
      // Act
      const response = await request(app.getHttpServer())
        .get('/pasaportes/alertas/vencimientos')
        .expect(200);

      // Assert
      expect(response.body).toHaveProperty('vencidos');
      expect(response.body).toHaveProperty('proximos30');
      expect(response.body).toHaveProperty('proximos90');
      expect(response.body).toHaveProperty('resumen');
      expect(response.body.resumen).toHaveProperty('totalVencidos');
      expect(response.body.resumen).toHaveProperty('totalProximos30');
      expect(response.body.resumen).toHaveProperty('totalProximos90');
      expect(Array.isArray(response.body.vencidos)).toBe(true);
      expect(Array.isArray(response.body.proximos30)).toBe(true);
      expect(Array.isArray(response.body.proximos90)).toBe(true);
    });

    it('should include profesor contact info in alerts', async () => {
      // Arrange - Create a pasaporte that will be in alerts
      const profesor = await createTestProfesor();
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const pasaporte = await createTestPasaporte(profesor.id, {
        fechaVencimiento: yesterday,
      });

      // Act
      const response = await request(app.getHttpServer())
        .get('/pasaportes/alertas/vencimientos')
        .expect(200);

      // Assert
      if (response.body.vencidos.length > 0) {
        const p = response.body.vencidos[0];
        expect(p.profesor).toHaveProperty('telefonoMovil');
        expect(p.profesor).toHaveProperty('email');
      }

      // Cleanup
      await prismaService.pasaporte.delete({ where: { id: pasaporte.id } });
      await prismaService.profesor.delete({ where: { id: profesor.id } });
    });
  });
});
