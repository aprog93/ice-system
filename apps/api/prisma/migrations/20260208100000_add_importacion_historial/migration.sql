-- CreateTable
CREATE TABLE "importaciones_historial" (
    "id" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "nombre_archivo" TEXT NOT NULL,
    "total_registros" INTEGER NOT NULL,
    "exitosos" INTEGER NOT NULL,
    "errores" INTEGER NOT NULL,
    "saltados" INTEGER NOT NULL,
    "detalle" JSONB NOT NULL,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "importaciones_historial_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "importaciones_historial_user_id_idx" ON "importaciones_historial"("user_id");

-- CreateIndex
CREATE INDEX "importaciones_historial_created_at_idx" ON "importaciones_historial"("created_at");
