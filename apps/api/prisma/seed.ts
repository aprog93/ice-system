import {
  PrismaClient,
  Rol,
  Sexo,
  EstadoCivil,
  NivelIngles,
  EstadoPotencial,
  TipoPasaporte,
  EstadoContrato,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed de la base de datos...');

  // ============================================
  // 1. CREAR USUARIOS
  // ============================================
  console.log('👤 Creando usuarios...');

  const adminPassword = await bcrypt.hash('admin123', 10);
  const operadorPassword = await bcrypt.hash('operador123', 10);
  const consultaPassword = await bcrypt.hash('consulta123', 10);

  const admin = await prisma.usuario.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      email: 'admin@ice.cu',
      passwordHash: adminPassword,
      nombre: 'Administrador',
      apellidos: 'Sistema',
      rol: Rol.ADMIN,
    },
  });

  const operador = await prisma.usuario.upsert({
    where: { username: 'operador' },
    update: {},
    create: {
      username: 'operador',
      email: 'operador@ice.cu',
      passwordHash: operadorPassword,
      nombre: 'Operador',
      apellidos: 'Principal',
      rol: Rol.OPERADOR,
    },
  });

  const consulta = await prisma.usuario.upsert({
    where: { username: 'consulta' },
    update: {},
    create: {
      username: 'consulta',
      email: 'consulta@ice.cu',
      passwordHash: consultaPassword,
      nombre: 'Usuario',
      apellidos: 'Consulta',
      rol: Rol.CONSULTA,
    },
  });

  console.log('✅ Usuarios creados:', {
    admin: admin.username,
    operador: operador.username,
    consulta: consulta.username,
  });

  // ============================================
  // 2. CREAR PROVINCIAS
  // ============================================
  console.log('🏛️ Creando provincias...');

  const provinciasData = [
    { codigo: '01', nombre: 'PINAR DEL RIO' },
    { codigo: '02', nombre: 'ARTEMISA' },
    { codigo: '03', nombre: 'LA HABANA' },
    { codigo: '04', nombre: 'MAYABEQUE' },
    { codigo: '05', nombre: 'MATANZAS' },
    { codigo: '06', nombre: 'CIENFUEGOS' },
    { codigo: '07', nombre: 'VILLA CLARA' },
    { codigo: '08', nombre: 'SANCTI SPIRITUS' },
    { codigo: '09', nombre: 'CIEGO DE AVILA' },
    { codigo: '10', nombre: 'CAMAGUEY' },
    { codigo: '11', nombre: 'LAS TUNAS' },
    { codigo: '12', nombre: 'HOLGUIN' },
    { codigo: '13', nombre: 'GRANMA' },
    { codigo: '14', nombre: 'SANTIAGO DE CUBA' },
    { codigo: '15', nombre: 'GUANTANAMO' },
    { codigo: '16', nombre: 'ISLA DE LA JUVENTUD' },
  ];

  for (const prov of provinciasData) {
    await prisma.provincia.upsert({
      where: { codigo: prov.codigo },
      update: {},
      create: prov,
    });
  }

  const provincias = await prisma.provincia.findMany();
  console.log(`✅ ${provincias.length} provincias creadas`);

  // ============================================
  // 3. CREAR MUNICIPIOS (ejemplo con La Habana)
  // ============================================
  console.log('🏘️ Creando municipios...');

  const laHabana = provincias.find((p) => p.codigo === '03');

  if (laHabana) {
    const municipiosHabana = [
      { codigo: '0301', nombre: 'PLAZA DE LA REVOLUCION' },
      { codigo: '0302', nombre: 'LA HABANA VIEJA' },
      { codigo: '0303', nombre: 'CENTRO HABANA' },
      { codigo: '0304', nombre: 'LA HABANA DEL ESTE' },
      { codigo: '0305', nombre: 'GUANABACOA' },
      { codigo: '0306', nombre: 'REGLA' },
      { codigo: '0307', nombre: 'LA HABANA DEL CERRO' },
      { codigo: '0308', nombre: 'PLAYA' },
      { codigo: '0309', nombre: 'MARIANAO' },
      { codigo: '0310', nombre: 'LA LISA' },
      { codigo: '0311', nombre: 'BOYEROS' },
      { codigo: '0312', nombre: 'ARROYO NARANJO' },
      { codigo: '0313', nombre: '10 DE OCTUBRE' },
      { codigo: '0314', nombre: 'SAN MIGUEL DEL PADRON' },
      { codigo: '0315', nombre: 'COTORRO' },
    ];

    for (const mun of municipiosHabana) {
      await prisma.municipio.upsert({
        where: {
          codigo_provinciaId: {
            codigo: mun.codigo,
            provinciaId: laHabana.id,
          },
        },
        update: {},
        create: {
          ...mun,
          provinciaId: laHabana.id,
        },
      });
    }
  }

  const municipios = await prisma.municipio.findMany();
  console.log(`✅ ${municipios.length} municipios creados`);

  // ============================================
  // 4. CREAR PAÍSES
  // ============================================
  console.log('🌍 Creando países...');

  const paisesData = [
    { codigo: 'CU', nombre: 'Cuba', nombreEs: 'Cuba' },
    { codigo: 'ES', nombre: 'Spain', nombreEs: 'España' },
    { codigo: 'MX', nombre: 'Mexico', nombreEs: 'México' },
    { codigo: 'AR', nombre: 'Argentina', nombreEs: 'Argentina' },
    { codigo: 'CO', nombre: 'Colombia', nombreEs: 'Colombia' },
    { codigo: 'PE', nombre: 'Peru', nombreEs: 'Perú' },
    { codigo: 'VE', nombre: 'Venezuela', nombreEs: 'Venezuela' },
    { codigo: 'CL', nombre: 'Chile', nombreEs: 'Chile' },
    { codigo: 'EC', nombre: 'Ecuador', nombreEs: 'Ecuador' },
    { codigo: 'BO', nombre: 'Bolivia', nombreEs: 'Bolivia' },
    { codigo: 'PY', nombre: 'Paraguay', nombreEs: 'Paraguay' },
    { codigo: 'UY', nombre: 'Uruguay', nombreEs: 'Uruguay' },
    { codigo: 'BR', nombre: 'Brazil', nombreEs: 'Brasil' },
    { codigo: 'CN', nombre: 'China', nombreEs: 'China' },
    { codigo: 'RU', nombre: 'Russia', nombreEs: 'Rusia' },
    { codigo: 'AO', nombre: 'Angola', nombreEs: 'Angola' },
    { codigo: 'DZ', nombre: 'Algeria', nombreEs: 'Argelia' },
    { codigo: 'GT', nombre: 'Guatemala', nombreEs: 'Guatemala' },
    { codigo: 'HN', nombre: 'Honduras', nombreEs: 'Honduras' },
    { codigo: 'SV', nombre: 'El Salvador', nombreEs: 'El Salvador' },
    { codigo: 'NI', nombre: 'Nicaragua', nombreEs: 'Nicaragua' },
    { codigo: 'CR', nombre: 'Costa Rica', nombreEs: 'Costa Rica' },
    { codigo: 'PA', nombre: 'Panama', nombreEs: 'Panamá' },
    { codigo: 'DO', nombre: 'Dominican Republic', nombreEs: 'República Dominicana' },
    { codigo: 'HT', nombre: 'Haiti', nombreEs: 'Haití' },
    { codigo: 'JM', nombre: 'Jamaica', nombreEs: 'Jamaica' },
    { codigo: 'TT', nombre: 'Trinidad and Tobago', nombreEs: 'Trinidad y Tobago' },
    { codigo: 'BB', nombre: 'Barbados', nombreEs: 'Barbados' },
    { codigo: 'GD', nombre: 'Grenada', nombreEs: 'Granada' },
    { codigo: 'LC', nombre: 'Saint Lucia', nombreEs: 'Santa Lucía' },
    {
      codigo: 'VC',
      nombre: 'Saint Vincent and the Grenadines',
      nombreEs: 'San Vicente y las Granadinas',
    },
    { codigo: 'AG', nombre: 'Antigua and Barbuda', nombreEs: 'Antigua y Barbuda' },
    { codigo: 'DM', nombre: 'Dominica', nombreEs: 'Dominica' },
    { codigo: 'KN', nombre: 'Saint Kitts and Nevis', nombreEs: 'San Cristóbal y Nieves' },
    { codigo: 'BS', nombre: 'Bahamas', nombreEs: 'Bahamas' },
    { codigo: 'BZ', nombre: 'Belize', nombreEs: 'Belice' },
    { codigo: 'GY', nombre: 'Guyana', nombreEs: 'Guyana' },
    { codigo: 'SR', nombre: 'Suriname', nombreEs: 'Surinam' },
    { codigo: 'GF', nombre: 'French Guiana', nombreEs: 'Guayana Francesa' },
    { codigo: 'FK', nombre: 'Falkland Islands', nombreEs: 'Islas Malvinas' },
    {
      codigo: 'GS',
      nombre: 'South Georgia and the South Sandwich Islands',
      nombreEs: 'Islas Georgias del Sur y Sandwich del Sur',
    },
    { codigo: 'TC', nombre: 'Turks and Caicos Islands', nombreEs: 'Islas Turcas y Caicos' },
    { codigo: 'KY', nombre: 'Cayman Islands', nombreEs: 'Islas Caimán' },
    { codigo: 'VG', nombre: 'British Virgin Islands', nombreEs: 'Islas Vírgenes Británicas' },
    {
      codigo: 'VI',
      nombre: 'U.S. Virgin Islands',
      nombreEs: 'Islas Vírgenes de los Estados Unidos',
    },
    { codigo: 'PR', nombre: 'Puerto Rico', nombreEs: 'Puerto Rico' },
    { codigo: 'MS', nombre: 'Montserrat', nombreEs: 'Montserrat' },
    { codigo: 'AI', nombre: 'Anguilla', nombreEs: 'Anguila' },
    { codigo: 'BL', nombre: 'Saint Barthelemy', nombreEs: 'San Bartolomé' },
    { codigo: 'MF', nombre: 'Saint Martin', nombreEs: 'San Martín' },
    { codigo: 'SX', nombre: 'Sint Maarten', nombreEs: 'Sint Maarten' },
    { codigo: 'CW', nombre: 'Curacao', nombreEs: 'Curazao' },
    { codigo: 'AW', nombre: 'Aruba', nombreEs: 'Aruba' },
    {
      codigo: 'BQ',
      nombre: 'Bonaire, Sint Eustatius and Saba',
      nombreEs: 'Bonaire, San Eustaquio y Saba',
    },
  ];

  for (const pais of paisesData) {
    await prisma.pais.upsert({
      where: { codigo: pais.codigo },
      update: {},
      create: pais,
    });
  }

  const paises = await prisma.pais.findMany();
  console.log(`✅ ${paises.length} países creados`);

  // ============================================
  // 5. CREAR CARGOS
  // ============================================
  console.log('💼 Creando cargos...');

  const cargosData = [
    { codigo: 'PROF', nombre: 'Profesor', descripcion: 'Profesor de aula' },
    { codigo: 'DIREC', nombre: 'Director', descripcion: 'Director de centro educativo' },
    { codigo: 'SUBDIR', nombre: 'Subdirector', descripcion: 'Subdirector de centro educativo' },
    { codigo: 'METOD', nombre: 'Metodologo', descripcion: 'Metodólogo' },
    { codigo: 'INSPEC', nombre: 'Inspector', descripcion: 'Inspector educacional' },
    { codigo: 'ASESOR', nombre: 'Asesor', descripcion: 'Asesor pedagógico' },
    { codigo: 'COORD', nombre: 'Coordinador', descripcion: 'Coordinador de programa' },
  ];

  for (const cargo of cargosData) {
    await prisma.cargo.upsert({
      where: { codigo: cargo.codigo },
      update: {},
      create: cargo,
    });
  }

  const cargos = await prisma.cargo.findMany();
  console.log(`✅ ${cargos.length} cargos creados`);

  // ============================================
  // 6. CREAR ESPECIALIDADES
  // ============================================
  console.log('📚 Creando especialidades...');

  const especialidadesData = [
    { codigo: 'MAT', nombre: 'Matematicas', descripcion: 'Matemática' },
    { codigo: 'FIS', nombre: 'Fisica', descripcion: 'Física' },
    { codigo: 'QUIM', nombre: 'Quimica', descripcion: 'Química' },
    { codigo: 'BIO', nombre: 'Biologia', descripcion: 'Biología' },
    { codigo: 'HIST', nombre: 'Historia', descripcion: 'Historia' },
    { codigo: 'GEO', nombre: 'Geografia', descripcion: 'Geografía' },
    { codigo: 'ESP', nombre: 'Espanol', descripcion: 'Lengua Española y Literatura' },
    { codigo: 'ING', nombre: 'Ingles', descripcion: 'Lengua Inglesa' },
    { codigo: 'FRAN', nombre: 'Frances', descripcion: 'Lengua Francesa' },
    { codigo: 'EDFIS', nombre: 'Educacion Fisica', descripcion: 'Educación Física' },
    { codigo: 'ART', nombre: 'Artes Plasticas', descripcion: 'Artes Plásticas' },
    { codigo: 'MUS', nombre: 'Musica', descripcion: 'Música' },
    { codigo: 'INF', nombre: 'Informatica', descripcion: 'Informática' },
    { codigo: 'ECON', nombre: 'Economia', descripcion: 'Economía' },
    { codigo: 'FILO', nombre: 'Filosofia', descripcion: 'Filosofía' },
    { codigo: 'CIV', nombre: 'Educacion Civica', descripcion: 'Educación Cívica' },
    { codigo: 'PSIC', nombre: 'Psicologia', descripcion: 'Psicología' },
    { codigo: 'PEDA', nombre: 'Pedagogia', descripcion: 'Pedagogía' },
    {
      codigo: 'TIC',
      nombre: 'Tecnologias de la Informacion',
      descripcion: 'Tecnologías de la Información y las Comunicaciones',
    },
    { codigo: 'ELEC', nombre: 'Electronica', descripcion: 'Electrónica' },
    { codigo: 'MEC', nombre: 'Mecanica', descripcion: 'Mecánica' },
    { codigo: 'CONT', nombre: 'Contabilidad', descripcion: 'Contabilidad y Finanzas' },
    { codigo: 'ADM', nombre: 'Administracion', descripcion: 'Administración' },
    { codigo: 'ENF', nombre: 'Enfermeria', descripcion: 'Enfermería' },
    { codigo: 'MED', nombre: 'Medicina', descripcion: 'Medicina' },
  ];

  for (const esp of especialidadesData) {
    await prisma.especialidad.upsert({
      where: { codigo: esp.codigo },
      update: {},
      create: esp,
    });
  }

  const especialidades = await prisma.especialidad.findMany();
  console.log(`✅ ${especialidades.length} especialidades creadas`);

  // ============================================
  // 7. CREAR CATEGORÍAS DOCENTES
  // ============================================
  console.log('🏅 Creando categorías docentes...');

  const categoriasData = [
    { codigo: 'NOV', nombre: 'Novato', descripcion: 'Profesor novato' },
    { codigo: 'CONF', nombre: 'Confirmado', descripcion: 'Profesor confirmado' },
    { codigo: 'UTIL', nombre: 'Util', descripcion: 'Profesor útil' },
    { codigo: 'ESPE', nombre: 'Especialista', descripcion: 'Especialista' },
    { codigo: 'MAES', nombre: 'Maestro', descripcion: 'Maestro' },
    { codigo: 'PROF_TIT', nombre: 'Profesor Titular', descripcion: 'Profesor Titular' },
    { codigo: 'INVEST', nombre: 'Investigador', descripcion: 'Investigador' },
    { codigo: 'AUX', nombre: 'Auxiliar', descripcion: 'Profesor Auxiliar' },
    { codigo: 'ASIS', nombre: 'Asistente', descripcion: 'Profesor Asistente' },
  ];

  for (const cat of categoriasData) {
    await prisma.categoriaDocente.upsert({
      where: { codigo: cat.codigo },
      update: {},
      create: cat,
    });
  }

  const categorias = await prisma.categoriaDocente.findMany();
  console.log(`✅ ${categorias.length} categorías docentes creadas`);

  // ============================================
  // 8. CREAR FIRMAS AUTORIZADAS
  // ============================================
  console.log('✍️ Creando firmas autorizadas...');

  const firmasData = [
    {
      nombre: 'MARIA TERESA',
      apellidos: 'GONZALEZ HERNANDEZ',
      cargo: 'DIRECTORA GENERAL',
      activa: true,
    },
    {
      nombre: 'CARLOS ALBERTO',
      apellidos: 'FERNANDEZ RUIZ',
      cargo: 'SUBDIRECTOR DE RECURSOS HUMANOS',
      activa: true,
    },
  ];

  for (const firma of firmasData) {
    await prisma.firmaAutorizada.upsert({
      where: {
        nombre_apellidos: {
          nombre: firma.nombre,
          apellidos: firma.apellidos,
        },
      },
      update: {},
      create: firma,
    });
  }

  const firmas = await prisma.firmaAutorizada.findMany();
  console.log(`✅ ${firmas.length} firmas autorizadas creadas`);

  // ============================================
  // 9. CREAR PROFESORES DE EJEMPLO
  // ============================================
  console.log('👨‍🏫 Creando profesores de ejemplo...');

  const habana = provincias.find((p) => p.codigo === '03');
  const plaza = municipios.find((m) => m.codigo === '0301');
  const profesorCargo = cargos.find((c) => c.codigo === 'PROF');
  const matEsp = especialidades.find((e) => e.codigo === 'MAT');
  const confirmado = categorias.find((c) => c.codigo === 'CONF');

  if (habana && plaza && profesorCargo && matEsp && confirmado) {
    const profesoresData = [
      {
        ci: '86051212345',
        nombre: 'JUAN CARLOS',
        apellidos: 'RODRIGUEZ PEREZ',
        edad: 38,
        sexo: Sexo.MASCULINO,
        colorOjos: 'MARRONES',
        colorPelo: 'NEGRO',
        estatura: 1.75,
        peso: 75,
        provinciaId: habana.id,
        municipioId: plaza.id,
        cargoId: profesorCargo.id,
        especialidadId: matEsp.id,
        categoriaDocenteId: confirmado.id,
        estadoCivil: EstadoCivil.CASADO,
        cantidadHijos: 2,
        telefonoMovil: '52812345',
        email: 'juan.rodriguez@edu.cu',
        nivelIngles: NivelIngles.INTERMEDIO,
        estadoPotencial: EstadoPotencial.ACTIVO,
      },
      {
        ci: '90082323456',
        nombre: 'MARIA ELENA',
        apellidos: 'GARCIA LOPEZ',
        edad: 34,
        sexo: Sexo.FEMENINO,
        colorOjos: 'AZULES',
        colorPelo: 'CASTAÑO',
        estatura: 1.65,
        peso: 60,
        provinciaId: habana.id,
        municipioId: plaza.id,
        cargoId: profesorCargo.id,
        especialidadId: matEsp.id,
        categoriaDocenteId: confirmado.id,
        estadoCivil: EstadoCivil.SOLTERO,
        cantidadHijos: 0,
        telefonoMovil: '52823456',
        email: 'maria.garcia@edu.cu',
        nivelIngles: NivelIngles.AVANZADO,
        estadoPotencial: EstadoPotencial.ACTIVO,
      },
      {
        ci: '78041534567',
        nombre: 'PEDRO ANTONIO',
        apellidos: 'MARTINEZ SANCHEZ',
        edad: 46,
        sexo: Sexo.MASCULINO,
        colorOjos: 'VERDES',
        colorPelo: 'CANOSO',
        estatura: 1.8,
        peso: 80,
        provinciaId: habana.id,
        municipioId: plaza.id,
        cargoId: profesorCargo.id,
        especialidadId: matEsp.id,
        categoriaDocenteId: confirmado.id,
        estadoCivil: EstadoCivil.CASADO,
        cantidadHijos: 1,
        telefonoMovil: '52834567',
        email: 'pedro.martinez@edu.cu',
        nivelIngles: NivelIngles.BASICO,
        estadoPotencial: EstadoPotencial.ACTIVO,
      },
    ];

    for (const prof of profesoresData) {
      await prisma.profesor.upsert({
        where: { ci: prof.ci },
        update: {},
        create: {
          ...prof,
          createdBy: admin.id,
        },
      });
    }
  }

  const profesores = await prisma.profesor.findMany();
  console.log(`✅ ${profesores.length} profesores creados`);

  // ============================================
  // 9. CREAR PASAPORTES DE EJEMPLO
  // ============================================
  console.log('🛂 Creando pasaportes de ejemplo...');

  if (profesores.length > 0) {
    const pasaportesData = [
      {
        profesorId: profesores[0].id,
        tipo: TipoPasaporte.ORDINARIO,
        numero: 'A123456',
        fechaExpedicion: new Date('2020-01-15'),
        fechaVencimiento: new Date('2030-01-15'),
        lugarExpedicion: 'HABANA',
      },
      {
        profesorId: profesores[1].id,
        tipo: TipoPasaporte.ORDINARIO,
        numero: 'B234567',
        fechaExpedicion: new Date('2021-06-20'),
        fechaVencimiento: new Date('2031-06-20'),
        lugarExpedicion: 'HABANA',
      },
      {
        profesorId: profesores[2].id,
        tipo: TipoPasaporte.ORDINARIO,
        numero: 'C345678',
        fechaExpedicion: new Date('2019-03-10'),
        fechaVencimiento: new Date('2029-03-10'),
        lugarExpedicion: 'HABANA',
      },
    ];

    for (const pas of pasaportesData) {
      await prisma.pasaporte.upsert({
        where: { numero: pas.numero },
        update: {},
        create: pas,
      });
    }
  }

  const pasaportes = await prisma.pasaporte.findMany();
  console.log(`✅ ${pasaportes.length} pasaportes creados`);

  // ============================================
  // 10. CREAR CONTRATOS DE EJEMPLO
  // ============================================
  console.log('📄 Creando contratos de ejemplo...');

  const espana = paises.find((p) => p.codigo === 'ES');
  const mexico = paises.find((p) => p.codigo === 'MX');

  if (profesores.length >= 2 && espana && mexico) {
    const contratosData = [
      {
        numeroConsecutivo: 1,
        ano: 2024,
        profesorId: profesores[0].id,
        paisId: espana.id,
        fechaInicio: new Date('2024-01-15'),
        fechaFin: new Date('2024-12-15'),
        funcion: 'PROFESOR DE MATEMATICAS',
        centroTrabajo: 'COLEGIO INTERNACIONAL DE MADRID',
        salarioMensual: 2500.0,
        moneda: 'EUR',
        estado: EstadoContrato.ACTIVO,
        createdBy: admin.id,
      },
      {
        numeroConsecutivo: 2,
        ano: 2024,
        profesorId: profesores[1].id,
        paisId: mexico.id,
        fechaInicio: new Date('2024-03-01'),
        fechaFin: new Date('2024-12-01'),
        funcion: 'PROFESORA DE CIENCIAS',
        centroTrabajo: 'ESCUELA PRIMARIA FEDERAL',
        salarioMensual: 1800.0,
        moneda: 'USD',
        estado: EstadoContrato.ACTIVO,
        createdBy: admin.id,
      },
    ];

    for (const cont of contratosData) {
      await prisma.contrato.create({
        data: cont,
      });
    }
  }

  const contratos = await prisma.contrato.findMany();
  console.log(`✅ ${contratos.length} contratos creados`);

  console.log('\n🎉 Seed completado exitosamente!');
  console.log('\n📋 Credenciales de acceso:');
  console.log('  - Admin: username=admin, password=admin123');
  console.log('  - Operador: username=operador, password=operador123');
  console.log('  - Consulta: username=consulta, password=consulta123');
}

main()
  .catch((e) => {
    console.error('❌ Error en el seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
