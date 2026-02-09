-- AlterTable
ALTER TABLE "firmas_autorizadas" DROP CONSTRAINT IF EXISTS "FirmaAutorizada_orden_key";

-- AlterTable
ALTER TABLE "firmas_autorizadas" DROP COLUMN IF EXISTS "orden";

-- AlterTable
ALTER TABLE "firmas_autorizadas" RENAME COLUMN "activo" TO "activa";

-- AlterTable
ALTER TABLE "firmas_autorizadas" ADD COLUMN IF NOT EXISTS "apellidos" TEXT NOT NULL DEFAULT '';

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "firmas_autorizadas_nombre_apellidos_key" ON "firmas_autorizadas"("nombre", "apellidos");
