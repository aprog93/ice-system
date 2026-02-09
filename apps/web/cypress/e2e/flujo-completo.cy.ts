/// <reference types="cypress" />

/**
 * E2E Test: Flujo Completo del Sistema ICE
 *
 * Este test verifica el flujo crítico:
 * Login → Crear Profesor → Crear Contrato → Agregar Prórroga
 */
describe("Flujo Completo - Sistema ICE", () => {
  const timestamp = Date.now();
  const testData = {
    profesor: {
      ci: `TEST${timestamp}`,
      nombre: "Juan",
      apellidos: "Pérez Test",
      edad: "35",
      direccion: "Calle Test 123",
      telefonoMovil: "5551234567",
      email: `test${timestamp}@example.com`,
    },
    contrato: {
      funcion: "Profesor de Matemática",
      centroTrabajo: "Universidad de La Habana",
      fechaInicio: "2024-01-01",
      fechaFin: "2024-12-31",
    },
    prorroga: {
      fechaDesde: "2025-01-01",
      fechaHasta: "2025-06-30",
      motivo: "Extensión de proyecto",
    },
  };

  beforeEach(() => {
    // Limpiar localStorage y cookies antes de cada test
    cy.clearLocalStorage();
    cy.clearCookies();
  });

  it("Debe completar el flujo completo: Login → Profesor → Contrato → Prórroga", () => {
    // ============================================
    // 1. LOGIN
    // ============================================
    cy.visit("/login");
    cy.contains("Iniciar Sesión").should("be.visible");

    cy.get('input[name="username"]').type("admin");
    cy.get('input[name="password"]').type("admin123");
    cy.get('button[type="submit"]').click();

    // Verificar que estamos en el dashboard
    cy.url().should("include", "/dashboard");
    cy.contains("Dashboard").should("be.visible");

    // ============================================
    // 2. CREAR PROFESOR
    // ============================================
    cy.visit("/dashboard/potencial/nuevo");
    cy.contains("Nuevo Profesor").should("be.visible");

    // Datos personales
    cy.get('input[name="ci"]').type(testData.profesor.ci);
    cy.get('input[name="nombre"]').type(testData.profesor.nombre);
    cy.get('input[name="apellidos"]').type(testData.profesor.apellidos);
    cy.get('input[name="edad"]').type(testData.profesor.edad);

    // Seleccionar sexo
    cy.get('select[name="sexo"]').select("MASCULINO");

    // Datos de contacto
    cy.get('input[name="telefonoMovil"]').type(testData.profesor.telefonoMovil);
    cy.get('input[name="email"]').type(testData.profesor.email);

    // Seleccionar provincia y municipio
    cy.get('select[name="provinciaId"]').select(1); // Primera opción
    cy.wait(500); // Esperar a que carguen los municipios
    cy.get('select[name="municipioId"]').select(1); // Primera opción

    // Otros datos
    cy.get('input[name="anosExperiencia"]').type("5");
    cy.get('select[name="nivelIngles"]').select("INTERMEDIO");
    cy.get('select[name="estadoCivil"]').select("SOLTERO");
    cy.get('input[name="cantidadHijos"]').type("0");

    // Guardar
    cy.get('button[type="submit"]').click();

    // Verificar que se guardó
    cy.url().should("include", "/dashboard/potencial");
    cy.contains(testData.profesor.apellidos).should("be.visible");

    // ============================================
    // 3. CREAR CONTRATO
    // ============================================
    // Buscar el profesor creado
    cy.get('input[placeholder*="Buscar"]').type(testData.profesor.ci);
    cy.wait(500);

    // Hacer clic en el botón de crear contrato
    cy.get("button").contains("Nuevo Contrato").first().click();

    cy.url().should("include", "/dashboard/contratos/nuevo");
    cy.contains("Nuevo Contrato").should("be.visible");

    // Verificar que el profesor está seleccionado
    cy.contains(testData.profesor.nombre).should("be.visible");

    // Completar datos del contrato
    cy.get('select[name="paisId"]').select(1); // Primer país
    cy.get('input[name="funcion"]').type(testData.contrato.funcion);
    cy.get('input[name="centroTrabajo"]').type(testData.contrato.centroTrabajo);
    cy.get('input[name="fechaInicio"]').type(testData.contrato.fechaInicio);
    cy.get('input[name="fechaFin"]').type(testData.contrato.fechaFin);

    // Guardar
    cy.get('button[type="submit"]').click();

    // Verificar que se guardó
    cy.url().should("include", "/dashboard/contratos");
    cy.contains(testData.contrato.funcion).should("be.visible");

    // ============================================
    // 4. AGREGAR PRÓRROGA
    // ============================================
    // Buscar el contrato
    cy.get('input[placeholder*="Buscar"]').type(testData.profesor.apellidos);
    cy.wait(500);

    // Ver detalle del contrato
    cy.get("button").first().click(); // Botón de ver detalle

    cy.url().should("include", "/dashboard/contratos/");
    cy.contains("Prórrogas").should("be.visible");

    // Abrir modal de nueva prórroga
    cy.get("button").contains("Agregar Prórroga").click();

    // Completar datos de la prórroga
    cy.get('input[name="fechaDesde"]').type(testData.prorroga.fechaDesde);
    cy.get('input[name="fechaHasta"]').type(testData.prorroga.fechaHasta);
    cy.get('input[name="motivo"]').type(testData.prorroga.motivo);

    // Guardar
    cy.get('button[type="submit"]').click();

    // Verificar que se creó la prórroga
    cy.contains(testData.prorroga.motivo.toUpperCase()).should("be.visible");
    cy.contains("PRORROGADO").should("be.visible"); // Estado del contrato

    // ============================================
    // 5. VERIFICAR INTEGRACIÓN
    // ============================================
    // La fecha de fin del contrato debe actualizarse
    cy.contains("2025-06-30").should("be.visible");

    cy.log("✅ Flujo completo exitoso");
  });
});
