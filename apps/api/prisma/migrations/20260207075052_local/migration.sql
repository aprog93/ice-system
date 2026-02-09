-- CreateEnum
CREATE TYPE "roles" AS ENUM ('ADMIN', 'OPERADOR', 'CONSULTA');

-- CreateEnum
CREATE TYPE "sexos" AS ENUM ('MASCULINO', 'FEMENINO');

-- CreateEnum
CREATE TYPE "estados_civiles" AS ENUM ('SOLTERO', 'CASADO', 'DIVORCIADO', 'VIUDO', 'UNION_ESTABLE');

-- CreateEnum
CREATE TYPE "niveles_ingles" AS ENUM ('BASICO', 'INTERMEDIO', 'AVANZADO', 'NATIVO');

-- CreateEnum
CREATE TYPE "estados_potencial" AS ENUM ('ACTIVO', 'EN_PROCESO', 'CONTRATADO', 'BAJA', 'SUSPENDIDO');

-- CreateEnum
CREATE TYPE "tipos_pasaporte" AS ENUM ('ORDINARIO', 'OFICIAL', 'DIPLOMATICO');

-- CreateEnum
CREATE TYPE "estados_contrato" AS ENUM ('ACTIVO', 'PRORROGADO', 'CERRADO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "operaciones_auditoria" AS ENUM ('CREATE', 'UPDATE', 'DELETE');

-- CreateTable
CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellidos" TEXT NOT NULL,
    "rol" "roles" NOT NULL DEFAULT 'OPERADOR',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "ultimo_acceso" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revoked_at" TIMESTAMP(3),

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "provincias" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "provincias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "municipios" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "provincia_id" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "municipios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "paises" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "nombre_es" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "paises_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cargos" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cargos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "especialidades" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "especialidades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categorias_docentes" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "categorias_docentes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profesores" (
    "id" TEXT NOT NULL,
    "ci" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellidos" TEXT NOT NULL,
    "edad" INTEGER NOT NULL,
    "sexo" "sexos" NOT NULL,
    "color_piel" TEXT,
    "color_ojos" TEXT,
    "color_pelo" TEXT,
    "estatura" DOUBLE PRECISION,
    "peso" DOUBLE PRECISION,
    "senas_particulares" TEXT,
    "direccion" TEXT,
    "provincia_id" TEXT NOT NULL,
    "municipio_id" TEXT NOT NULL,
    "cargo_id" TEXT,
    "especialidad_id" TEXT,
    "categoria_docente_id" TEXT,
    "anos_experiencia" INTEGER NOT NULL DEFAULT 0,
    "estado_civil" "estados_civiles" NOT NULL,
    "cantidad_hijos" INTEGER NOT NULL DEFAULT 0,
    "telefono_fijo" TEXT,
    "telefono_movil" TEXT,
    "email" TEXT,
    "nivel_ingles" "niveles_ingles" NOT NULL,
    "ano_graduado" INTEGER,
    "centro_graduacion" TEXT,
    "nota_promedio" DOUBLE PRECISION,
    "estado_potencial" "estados_potencial" NOT NULL DEFAULT 'ACTIVO',
    "observaciones" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT,
    "updated_by" TEXT,

    CONSTRAINT "profesores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pasaportes" (
    "id" TEXT NOT NULL,
    "profesor_id" TEXT NOT NULL,
    "tipo" "tipos_pasaporte" NOT NULL,
    "numero" TEXT NOT NULL,
    "fecha_expedicion" TIMESTAMP(3) NOT NULL,
    "fecha_vencimiento" TIMESTAMP(3) NOT NULL,
    "lugar_expedicion" TEXT,
    "observaciones" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pasaportes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "visas" (
    "id" TEXT NOT NULL,
    "pasaporte_id" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "numero" TEXT,
    "fecha_emision" TIMESTAMP(3) NOT NULL,
    "fecha_vencimiento" TIMESTAMP(3) NOT NULL,
    "pais_emision" TEXT NOT NULL,
    "numero_entradas" INTEGER NOT NULL DEFAULT 1,
    "duracion_dias" INTEGER NOT NULL,
    "observaciones" TEXT,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "visas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contratos" (
    "id" TEXT NOT NULL,
    "numero_consecutivo" INTEGER NOT NULL,
    "ano" INTEGER NOT NULL,
    "profesor_id" TEXT NOT NULL,
    "pais_id" TEXT NOT NULL,
    "fecha_inicio" TIMESTAMP(3) NOT NULL,
    "fecha_fin" TIMESTAMP(3) NOT NULL,
    "funcion" TEXT NOT NULL,
    "centro_trabajo" TEXT NOT NULL,
    "direccion_trabajo" TEXT,
    "salario_mensual" DECIMAL(12,2),
    "moneda" TEXT NOT NULL DEFAULT 'USD',
    "estado" "estados_contrato" NOT NULL DEFAULT 'ACTIVO',
    "fecha_firma" TIMESTAMP(3),
    "fecha_recepcion" TIMESTAMP(3),
    "fecha_cierre" TIMESTAMP(3),
    "motivo_cierre" TEXT,
    "documento_url" TEXT,
    "observaciones" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT,
    "updated_by" TEXT,

    CONSTRAINT "contratos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prorrogas" (
    "id" TEXT NOT NULL,
    "contrato_id" TEXT NOT NULL,
    "numero_prorroga" INTEGER NOT NULL,
    "fecha_desde" TIMESTAMP(3) NOT NULL,
    "fecha_hasta" TIMESTAMP(3) NOT NULL,
    "motivo" TEXT NOT NULL,
    "observaciones" TEXT,
    "documento_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT,

    CONSTRAINT "prorrogas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "configuraciones" (
    "id" TEXT NOT NULL,
    "clave" TEXT NOT NULL,
    "valor" TEXT NOT NULL,
    "descripcion" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by" TEXT,

    CONSTRAINT "configuraciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "logs_auditoria" (
    "id" TEXT NOT NULL,
    "tabla" TEXT NOT NULL,
    "operacion" "operaciones_auditoria" NOT NULL,
    "registro_id" TEXT NOT NULL,
    "datos_anteriores" JSONB,
    "datos_nuevos" JSONB,
    "usuario_id" TEXT,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "logs_auditoria_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_username_key" ON "usuarios"("username");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_key" ON "refresh_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "provincias_codigo_key" ON "provincias"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "municipios_codigo_provincia_id_key" ON "municipios"("codigo", "provincia_id");

-- CreateIndex
CREATE UNIQUE INDEX "paises_codigo_key" ON "paises"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "cargos_codigo_key" ON "cargos"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "especialidades_codigo_key" ON "especialidades"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "categorias_docentes_codigo_key" ON "categorias_docentes"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "profesores_ci_key" ON "profesores"("ci");

-- CreateIndex
CREATE INDEX "profesores_nombre_idx" ON "profesores"("nombre");

-- CreateIndex
CREATE INDEX "profesores_apellidos_idx" ON "profesores"("apellidos");

-- CreateIndex
CREATE INDEX "profesores_ci_idx" ON "profesores"("ci");

-- CreateIndex
CREATE INDEX "profesores_provincia_id_idx" ON "profesores"("provincia_id");

-- CreateIndex
CREATE INDEX "profesores_estado_potencial_idx" ON "profesores"("estado_potencial");

-- CreateIndex
CREATE INDEX "pasaportes_profesor_id_idx" ON "pasaportes"("profesor_id");

-- CreateIndex
CREATE INDEX "pasaportes_fecha_vencimiento_idx" ON "pasaportes"("fecha_vencimiento");

-- CreateIndex
CREATE UNIQUE INDEX "pasaportes_numero_key" ON "pasaportes"("numero");

-- CreateIndex
CREATE INDEX "visas_pasaporte_id_idx" ON "visas"("pasaporte_id");

-- CreateIndex
CREATE INDEX "visas_fecha_vencimiento_idx" ON "visas"("fecha_vencimiento");

-- CreateIndex
CREATE INDEX "contratos_profesor_id_idx" ON "contratos"("profesor_id");

-- CreateIndex
CREATE INDEX "contratos_fecha_inicio_fecha_fin_idx" ON "contratos"("fecha_inicio", "fecha_fin");

-- CreateIndex
CREATE INDEX "contratos_estado_idx" ON "contratos"("estado");

-- CreateIndex
CREATE UNIQUE INDEX "contratos_numero_consecutivo_ano_key" ON "contratos"("numero_consecutivo", "ano");

-- CreateIndex
CREATE INDEX "prorrogas_contrato_id_idx" ON "prorrogas"("contrato_id");

-- CreateIndex
CREATE UNIQUE INDEX "prorrogas_contrato_id_numero_prorroga_key" ON "prorrogas"("contrato_id", "numero_prorroga");

-- CreateIndex
CREATE UNIQUE INDEX "configuraciones_clave_key" ON "configuraciones"("clave");

-- CreateIndex
CREATE INDEX "logs_auditoria_tabla_registro_id_idx" ON "logs_auditoria"("tabla", "registro_id");

-- CreateIndex
CREATE INDEX "logs_auditoria_created_at_idx" ON "logs_auditoria"("created_at");

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "municipios" ADD CONSTRAINT "municipios_provincia_id_fkey" FOREIGN KEY ("provincia_id") REFERENCES "provincias"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profesores" ADD CONSTRAINT "profesores_provincia_id_fkey" FOREIGN KEY ("provincia_id") REFERENCES "provincias"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profesores" ADD CONSTRAINT "profesores_municipio_id_fkey" FOREIGN KEY ("municipio_id") REFERENCES "municipios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profesores" ADD CONSTRAINT "profesores_cargo_id_fkey" FOREIGN KEY ("cargo_id") REFERENCES "cargos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profesores" ADD CONSTRAINT "profesores_especialidad_id_fkey" FOREIGN KEY ("especialidad_id") REFERENCES "especialidades"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profesores" ADD CONSTRAINT "profesores_categoria_docente_id_fkey" FOREIGN KEY ("categoria_docente_id") REFERENCES "categorias_docentes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pasaportes" ADD CONSTRAINT "pasaportes_profesor_id_fkey" FOREIGN KEY ("profesor_id") REFERENCES "profesores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visas" ADD CONSTRAINT "visas_pasaporte_id_fkey" FOREIGN KEY ("pasaporte_id") REFERENCES "pasaportes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contratos" ADD CONSTRAINT "contratos_profesor_id_fkey" FOREIGN KEY ("profesor_id") REFERENCES "profesores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contratos" ADD CONSTRAINT "contratos_pais_id_fkey" FOREIGN KEY ("pais_id") REFERENCES "paises"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prorrogas" ADD CONSTRAINT "prorrogas_contrato_id_fkey" FOREIGN KEY ("contrato_id") REFERENCES "contratos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
