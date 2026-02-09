import {
  PrismaClient,
  Rol,
  Sexo,
  EstadoCivil,
  NivelIngles,
  EstadoPotencial,
  EstadoContrato,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

/**
 * Script de seed para datos de DEMO
 *
 * Ejecutar: pnpm prisma:seed-demo
 *
 * Este script crea:
 * - Usuarios de demo
 * - Profesores de ejemplo
 * - Contratos de ejemplo
 * - Pasaportes de ejemplo
 */
async function main() {
  console.log('🌱 Creando datos de DEMO...\n');

  // ============================================
  // 1. USUARIOS
  // ============================================
  console.log('👤 Creando usuarios demo...');

  const adminPassword = await bcrypt.hash('demo123', 10);

  const admin = await prisma.usuario.upsert({
    where: { username: 'demo' },
    update: {},
    create: {
      username: 'demo',
      email: 'demo@ice.cu',
      passwordHash: adminPassword,
      nombre: 'Usuario',
      apellidos: 'Demo',
      rol: Rol.ADMIN,
    },
  });
  console.log('✅ Usuario demo:', admin.username, '(pass: demo123)');

  // ============================================
  // 2. PROFESORES
  // ============================================
  console.log('\n👨‍🏫 Creando profesores demo...');

  const provincias = await prisma.provincia.findMany({ take: 3 });
  const municipios = await prisma.municipio.findMany({ take: 3 });
  const paises = await prisma.pais.findMany({ take: 5 });

  const profesoresData = [
    {
      ci: '86051212345',
      nombre: 'Juan',
      apellidos: 'Pérez García',
      edad: 38,
      sexo: Sexo.MASCULINO,
      direccion: 'Calle 23 #456, Vedado',
      telefonoMovil: '5551234567',
      email: 'juan.perez@example.com',
      anosExperiencia: 10,
      nivelIngles: NivelIngles.AVANZADO,
      estadoCivil: EstadoCivil.CASADO,
      cantidadHijos: 2,
      estadoPotencial: EstadoPotencial.CONTRATADO,
    },
    {
      ci: '90082323456',
      nombre: 'María',
      apellidos: 'López Hernández',
      edad: 34,
      sexo: Sexo.FEMENINO,
      direccion: 'Ave. 26 #789, Nuevo Vedado',
      telefonoMovil: '5559876543',
      email: 'maria.lopez@example.com',
      anosExperiencia: 8,
      nivelIngles: NivelIngles.INTERMEDIO,
      estadoCivil: EstadoCivil.SOLTERO,
      cantidadHijos: 0,
      estadoPotencial: EstadoPotencial.ACTIVO,
    },
    {
      ci: '85101234567',
      nombre: 'Carlos',
      apellidos: 'Rodríguez Silva',
      edad: 39,
      sexo: Sexo.MASCULINO,
      direccion: 'Calle 15 #234, Miramar',
      telefonoMovil: '5554567890',
      email: 'carlos.rodriguez@example.com',
      anosExperiencia: 12,
      nivelIngles: NivelIngles.BASICO,
      estadoCivil: EstadoCivil.DIVORCIADO,
      cantidadHijos: 1,
      estadoPotencial: EstadoPotencial.EN_PROCESO,
    },
  ];

  const profesores = [];
  for (let i = 0; i < profesoresData.length; i++) {
    const profesor = await prisma.profesor.upsert({
      where: { ci: profesoresData[i].ci },
      update: {},
      create: {
        ...profesoresData[i],
        provinciaId: provincias[i % provincias.length].id,
        municipioId: municipios[i % municipios.length].id,
      },
    });
    profesores.push(profesor);
    console.log(`✅ Profesor: ${profesor.nombre} ${profesor.apellidos}`);
  }

  // ============================================
  // 3. CONTRATOS
  // ============================================
  console.log('\n📄 Creando contratos demo...');

  const contratosData = [
    {
      numeroConsecutivo: 1,
      ano: 2024,
      profesorId: profesores[0].id,
      paisId: paises[0].id,
      fechaInicio: new Date('2024-01-01'),
      fechaFin: new Date('2024-12-31'),
      funcion: 'Profesor de Matemática',
      centroTrabajo: 'Universidad de La Habana',
      estado: EstadoContrato.ACTIVO,
    },
    {
      numeroConsecutivo: 2,
      ano: 2024,
      profesorId: profesores[1].id,
      paisId: paises[1].id,
      fechaInicio: new Date('2024-03-01'),
      fechaFin: new Date('2025-02-28'),
      funcion: 'Profesora de Física',
      centroTrabajo: 'Universidad de Camagüey',
      estado: EstadoContrato.PRORROGADO,
    },
    {
      numeroConsecutivo: 3,
      ano: 2023,
      profesorId: profesores[2].id,
      paisId: paises[2].id,
      fechaInicio: new Date('2023-06-01'),
      fechaFin: new Date('2024-05-31'),
      funcion: 'Profesor de Química',
      centroTrabajo: 'Universidad de Santiago',
      estado: EstadoContrato.CERRADO,
    },
  ];

  const contratos = [];
  for (const contratoData of contratosData) {
    const contrato = await prisma.contrato.upsert({
      where: {
        numeroConsecutivo_ano: {
          numeroConsecutivo: contratoData.numeroConsecutivo,
          ano: contratoData.ano,
        },
      },
      update: {},
      create: contratoData,
    });
    contratos.push(contrato);
    console.log(`✅ Contrato #${contrato.numeroConsecutivo}/${contrato.ano} - ${contrato.funcion}`);
  }

  // ============================================
  // 4. PRÓRROGAS
  // ============================================
  console.log('\n📝 Creando prórrogas demo...');

  // Prórroga para el contrato #2 (María López)
  const prorroga1 = await prisma.prorroga.upsert({
    where: {
      id: 'prorroga-demo-1',
    },
    update: {},
    create: {
      contratoId: contratos[1].id,
      numeroProrroga: 1,
      fechaDesde: new Date('2025-03-01'),
      fechaHasta: new Date('2025-08-31'),
      motivo: 'EXTENSIÓN DE PROYECTO DE INVESTIGACIÓN',
    },
  });
  console.log('✅ Prórroga #1 - María López (extensión hasta agosto 2025)');

  // Actualizar fecha fin del contrato prorrogado
  await prisma.contrato.update({
    where: { id: contratos[1].id },
    data: { fechaFin: new Date('2025-08-31') },
  });

  // ============================================
  // 5. PASAPORTES
  // ============================================
  console.log('\n🛂 Creando pasaportes demo...');

  const pasaporte1 = await prisma.pasaporte.upsert({
    where: { numero: 'A123456' },
    update: {},
    create: {
      profesorId: profesores[0].id,
      tipo: 'ORDINARIO',
      numero: 'A123456',
      fechaExpedicion: new Date('2023-01-15'),
      fechaVencimiento: new Date('2033-01-15'),
      lugarExpedicion: 'HABANA',
      activo: true,
    },
  });
  console.log(`✅ Pasaporte: ${pasaporte1.numero} - Vence: 2033-01-15`);

  const pasaporte2 = await prisma.pasaporte.upsert({
    where: { numero: 'B234567' },
    update: {},
    create: {
      profesorId: profesores[1].id,
      tipo: 'ORDINARIO',
      numero: 'B234567',
      fechaExpedicion: new Date('2022-06-20'),
      fechaVencimiento: new Date('2032-06-20'),
      lugarExpedicion: 'HABANA',
      activo: true,
    },
  });
  console.log(`✅ Pasaporte: ${pasaporte2.numero} - Vence: 2032-06-20`);

  // Pasaporte próximo a vencer
  const pasaporte3 = await prisma.pasaporte.upsert({
    where: { numero: 'C345678' },
    update: {},
    create: {
      profesorId: profesores[2].id,
      tipo: 'ORDINARIO',
      numero: 'C345678',
      fechaExpedicion: new Date('2015-02-10'),
      fechaVencimiento: new Date('2025-02-10'), // Próximo a vencer
      lugarExpedicion: 'HABANA',
      activo: true,
    },
  });
  console.log(`✅ Pasaporte: ${pasaporte3.numero} - Vence: 2025-02-10 (⚠️ Próximo a vencer)`);

  // ============================================
  // RESUMEN
  // ============================================
  console.log('\n' + '='.repeat(50));
  console.log('✅ DATOS DE DEMO CREADOS EXITOSAMENTE');
  console.log('='.repeat(50));
  console.log('\n📊 Resumen:');
  console.log('  • 1 Usuario: demo / demo123');
  console.log(`  • ${profesores.length} Profesores`);
  console.log(`  • ${contratos.length} Contratos`);
  console.log('  • 1 Prórroga');
  console.log('  • 3 Pasaportes');
  console.log('\n🚀 El sistema está listo para la demo!');
  console.log('\n💡 Accesos rápidos:');
  console.log('  • Login: http://localhost:3000/login');
  console.log('  • Usuario: demo');
  console.log('  • Contraseña: demo123');
  console.log('');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
