-- DropForeignKey
ALTER TABLE "profesores" DROP CONSTRAINT "profesores_municipio_id_fkey";

-- DropForeignKey
ALTER TABLE "profesores" DROP CONSTRAINT "profesores_provincia_id_fkey";

-- AlterTable
ALTER TABLE "pasaportes" ALTER COLUMN "fecha_expedicion" DROP NOT NULL;

-- AlterTable
ALTER TABLE "profesores" ALTER COLUMN "edad" DROP NOT NULL,
ALTER COLUMN "sexo" DROP NOT NULL,
ALTER COLUMN "provincia_id" DROP NOT NULL,
ALTER COLUMN "municipio_id" DROP NOT NULL,
ALTER COLUMN "estado_civil" DROP NOT NULL,
ALTER COLUMN "nivel_ingles" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "profesores" ADD CONSTRAINT "profesores_provincia_id_fkey" FOREIGN KEY ("provincia_id") REFERENCES "provincias"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profesores" ADD CONSTRAINT "profesores_municipio_id_fkey" FOREIGN KEY ("municipio_id") REFERENCES "municipios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
