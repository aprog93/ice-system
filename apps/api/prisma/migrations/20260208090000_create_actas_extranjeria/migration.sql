-- CreateTable
CREATE TABLE "actas_extranjeria" (
    "id" TEXT NOT NULL,
    "numero_acta" TEXT NOT NULL,
    "ano" INTEGER NOT NULL,
    "profesor_id" TEXT NOT NULL,
    "fecha_acta" TIMESTAMP(3) NOT NULL,
    "funcion" TEXT NOT NULL,
    "pais_destino_id" TEXT NOT NULL,
    "observaciones" TEXT,
    "documento_url" TEXT,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "actas_extranjeria_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "actas_extranjeria_numero_acta_ano_key" ON "actas_extranjeria"("numero_acta", "ano");

-- CreateIndex
CREATE INDEX "actas_extranjeria_profesor_id_idx" ON "actas_extranjeria"("profesor_id");

-- CreateIndex
CREATE INDEX "actas_extranjeria_fecha_acta_idx" ON "actas_extranjeria"("fecha_acta");

-- AddForeignKey
ALTER TABLE "actas_extranjeria" ADD CONSTRAINT "actas_extranjeria_profesor_id_fkey" FOREIGN KEY ("profesor_id") REFERENCES "profesores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "actas_extranjeria" ADD CONSTRAINT "actas_extranjeria_pais_destino_id_fkey" FOREIGN KEY ("pais_destino_id") REFERENCES "paises"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
