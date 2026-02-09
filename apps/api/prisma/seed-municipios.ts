import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Datos de todos los municipios de Cuba por provincia
const municipiosData: Record<string, string[]> = {
  '01': [
    // PINAR DEL RIO
    'PINAR DEL RIO',
    'SAN LUIS',
    'SAN JUAN Y MARTINEZ',
    'GUANE',
    'MANTUA',
    'LOS PALACIOS',
    'CONSOLACION DEL SUR',
    'LA PALMA',
    'VIÑALES',
    'SANDINO',
    'MINAS DE MATAHAMBRE',
    'GUANAHACABIBES',
  ],
  '02': [
    // ARTEMISA
    'ARTEMISA',
    'BAUTA',
    'GUANAJAY',
    'CAIMITO',
    'GUIRA DE MELENA',
    'ALQUIZAR',
    'SAN ANTONIO DE LOS BAÑOS',
    'MARIEL',
    'SAN CRISTOBAL',
    'CANDELARIA',
    'SANTA CRUZ DEL NORTE',
    'PLAYA BARACOA',
  ],
  '03': [
    // LA HABANA
    'PLAZA DE LA REVOLUCION',
    'LA HABANA VIEJA',
    'CENTRO HABANA',
    'LA HABANA DEL ESTE',
    'GUANABACOA',
    'REGLA',
    'LA HABANA DEL CERRO',
    'PLAYA',
    'MARIANAO',
    'LA LISA',
    'BOYEROS',
    'ARROYO NARANJO',
    '10 DE OCTUBRE',
    'SAN MIGUEL DEL PADRON',
    'COTORRO',
  ],
  '04': [
    // MAYABEQUE
    'SAN JOSE DE LAS LAJAS',
    'NUEVA PAZ',
    'SANTA CRUZ DEL SUR',
    'JARUCO',
    'MADRUGA',
    'MELENA DEL SUR',
    'GUINES',
    'QUIVICAN',
    'BATAABANO',
    'BEJUCAL',
    'SAN NICOLAS DE BARI',
  ],
  '05': [
    // MATANZAS
    'MATANZAS',
    'CARDENAS',
    'VARADERO',
    'COLON',
    'JAGUEY GRANDE',
    'JOVELLANOS',
    'PEDRO BETANCOURT',
    'PERICO',
    'UNION DE REYES',
    'CALIMETE',
    'CIENAGA DE ZAPATA',
    'LIMONAR',
    'LOS ARABOS',
    'MARTI',
  ],
  '06': [
    // CIENFUEGOS
    'CIENFUEGOS',
    'AGUADA DE PASAJEROS',
    'ABREUS',
    'CUMANAYAGUA',
    'RODAS',
    'CRUCES',
    'PALMIRA',
    'LAJITAS',
    'PURISIMA',
  ],
  '07': [
    // VILLA CLARA
    'SANTA CLARA',
    'SAGUA LA GRANDE',
    'MANICARAGUA',
    'REMEDIOS',
    'CAMAJUANI',
    'CAIBARIEN',
    'PLacetas',
    'RANCHUELO',
    'SANTO DOMINGO',
    'CIFUENTES',
    'SAGUA LA GRANDE',
    'ENCrucijada',
    'QUEMADO DE GUINES',
  ],
  '08': [
    // SANCTI SPIRITUS
    'SANCTI SPIRITUS',
    'TRINIDAD',
    'CABAIGUAN',
    'YAGUAJAY',
    'JATIBONICO',
    'TAGUASCO',
    'FOMENTO',
    'LA SIERPE',
    'CEPEDA',
  ],
  '09': [
    // CIEGO DE AVILA
    'CIEGO DE AVILA',
    'MORON',
    'CHAMBAS',
    'CIRO REDONDO',
    'MAJAGUA',
    'VENEZUELA',
    'BOLIVIA',
    'PRIMERO DE ENERO',
    'BARAGUA',
  ],
  '10': [
    // CAMAGUEY
    'CAMAGUEY',
    'FLORIDA',
    'GUAIMARO',
    'VERTIENTES',
    'MINAS',
    'NUEVITAS',
    'SIBANICU',
    'SANTA CRUZ DEL SUR',
    'JIMAGUAYU',
    'ESMERALDA',
    'SIERRA DE CUBITAS',
    'BOLIVIA',
    'BRAZIL',
    'CASCABEL',
  ],
  '11': [
    // LAS TUNAS
    'LAS TUNAS',
    'PUERTO PADRE',
    'MANATI',
    'COLOMBIA',
    'AMANCIO',
    'MAJIBACOA',
    'JOBABO',
    'GUAIMARO',
  ],
  '12': [
    // HOLGUIN
    'HOLGUIN',
    'GUARDALAVACA',
    'BAES',
    'BANES',
    'RAFAEL FREYRE',
    'BAGUANOS',
    'CACOCUM',
    'CALIXTO GARCIA',
    'COLUMBUS',
    'FRANK PAIS',
    'GIBARA',
    'JIGUANI',
    'MAYARI',
    'MOA',
    'SAGUA DE TANAMO',
    'URBANO NORIS',
  ],
  '13': [
    // GRANMA
    'BAYAMO',
    'MANZANILLO',
    'CAMPECHUELA',
    'MEDIA LUNA',
    'NAIRO BI',
    'JIGUANI',
    'GUISA',
    'BARTOLOME MASO',
    'BUEY ARRIBA',
    'YARA',
    'RIO CAUTO',
    'CAUTO CRISTO',
    'PILON',
  ],
  '14': [
    // SANTIAGO DE CUBA
    'SANTIAGO DE CUBA',
    'PALMA SORIANO',
    'CONTRAMAESTRE',
    'SAN LUIS',
    'SANTIAGO DE CUBA',
    'Tercer Frente',
    'GUAMA',
    'SEGUNDO FRENTE',
    'Songo-La Maya',
    'MELLA',
    'MONTE CRISTO',
    'CRUCE DE LOS BANOS',
  ],
  '15': [
    // GUANTANAMO
    'GUANTANAMO',
    'BARACOA',
    'IMIAS',
    'YATERAS',
    'EL SALVADOR',
    'MAISI',
    'COTORRO',
    'NICETO PEREZ',
    'SAN ANTONIO DEL SUR',
    'MANUEL TAMES',
  ],
  '16': [
    // ISLA DE LA JUVENTUD
    'NUEVA GERONA',
    'SANTA FE',
  ],
};

async function main() {
  console.log('🏛️ Poblando todos los municipios de Cuba...');

  const provincias = await prisma.provincia.findMany();

  let totalMunicipios = 0;

  for (const provincia of provincias) {
    const municipiosList = municipiosData[provincia.codigo];

    if (municipiosList) {
      console.log(`📍 ${provincia.nombre}: ${municipiosList.length} municipios`);

      for (let i = 0; i < municipiosList.length; i++) {
        const codigo = `${provincia.codigo}${String(i + 1).padStart(2, '0')}`;

        await prisma.municipio.upsert({
          where: {
            codigo_provinciaId: {
              codigo,
              provinciaId: provincia.id,
            },
          },
          update: {},
          create: {
            codigo,
            nombre: municipiosList[i],
            provinciaId: provincia.id,
          },
        });

        totalMunicipios++;
      }
    }
  }

  console.log(`✅ ${totalMunicipios} municipios creados/actualizados`);

  const total = await prisma.municipio.count();
  console.log(`📊 Total de municipios en la BD: ${total}`);
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
