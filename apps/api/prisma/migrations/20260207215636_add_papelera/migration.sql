-- CreateEnum
CREATE TYPE "tipos_registro_papelera" AS ENUM ('PROFESOR', 'CONTRATO', 'PASAPORTE', 'VISA', 'PRORROGA', 'USUARIO');

-- CreateTable
CREATE TABLE "papelera" (
    "id" TEXT NOT NULL,
    "tipo" "tipos_registro_papelera" NOT NULL,
    "registro_id" TEXT NOT NULL,
    "datos" JSONB NOT NULL,
    "relacionados" JSONB,
    "eliminado_por" TEXT NOT NULL,
    "nombre_usuario" TEXT,
    "motivo" TEXT,
    "restored_at" TIMESTAMP(3),
    "restored_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "papelera_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "papelera_tipo_idx" ON "papelera"("tipo");

-- CreateIndex
CREATE INDEX "papelera_registro_id_idx" ON "papelera"("registro_id");

-- CreateIndex
CREATE INDEX "papelera_eliminado_por_idx" ON "papelera"("eliminado_por");

-- CreateIndex
CREATE INDEX "papelera_created_at_idx" ON "papelera"("created_at");

-- CreateIndex
CREATE INDEX "papelera_restored_at_idx" ON "papelera"("restored_at");
