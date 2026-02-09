-- AlterTable
ALTER TABLE "firmas_autorizadas" ALTER COLUMN "apellidos" DROP DEFAULT;

-- AlterTable
ALTER TABLE "profesores" ADD COLUMN     "apto" TEXT,
ADD COLUMN     "calle" TEXT,
ADD COLUMN     "carretera" TEXT,
ADD COLUMN     "circunscripcion" TEXT,
ADD COLUMN     "ciudad_en_el_extranjero" TEXT,
ADD COLUMN     "cpa" TEXT,
ADD COLUMN     "entre_calles" TEXT,
ADD COLUMN     "fecha_nacimiento" TIMESTAMP(3),
ADD COLUMN     "finca" TEXT,
ADD COLUMN     "km" TEXT,
ADD COLUMN     "localidad" TEXT,
ADD COLUMN     "numero" TEXT,
ADD COLUMN     "pais_nacimiento_id" TEXT;

-- AddForeignKey
ALTER TABLE "profesores" ADD CONSTRAINT "profesores_pais_nacimiento_id_fkey" FOREIGN KEY ("pais_nacimiento_id") REFERENCES "paises"("id") ON DELETE SET NULL ON UPDATE CASCADE;
