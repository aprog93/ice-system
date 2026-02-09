-- AlterTable
ALTER TABLE "pasaportes" ADD COLUMN     "numero_archivo" TEXT;

-- AlterTable
ALTER TABLE "profesores" ADD COLUMN     "accion_colaboracion" TEXT,
ADD COLUMN     "conyuge" TEXT,
ADD COLUMN     "familiar_aviso_nombre" TEXT,
ADD COLUMN     "familiar_aviso_telefono" TEXT,
ADD COLUMN     "militancia_pcc" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "militancia_ujc" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "nombre_madre" TEXT,
ADD COLUMN     "nombre_padre" TEXT;

-- CreateTable
CREATE TABLE "firmas_autorizadas" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "cargo" TEXT NOT NULL,
    "orden" INTEGER NOT NULL DEFAULT 1,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "firmas_autorizadas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "firmas_autorizadas_orden_key" ON "firmas_autorizadas"("orden");
