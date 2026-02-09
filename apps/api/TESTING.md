# 🧪 Testing Guide - ICE System Backend

## Overview

Este proyecto sigue **Test Driven Development (TDD)** y tiene una suite de tests exhaustiva para garantizar la calidad del código.

## 📊 Cobertura de Tests

### Tests Unitarios (Jest)

- **Servicios**: Lógica de negocio, validaciones, manejo de errores
- **DTOs**: Validación de esquemas, transformación de datos
- **Utils**: Funciones auxiliares puras

### Tests de Integración/E2E (Jest + Supertest)

- **Controllers**: Routing, HTTP requests/responses
- **Middleware**: Guards, pipes, interceptors
- **Base de datos**: Interacciones reales con Prisma

## 🏃 Cómo Ejecutar Tests

### Todos los tests

```bash
# Desde la carpeta apps/api
pnpm test

# O desde root con filtro
pnpm test --filter=api
```

### Tests Unitarios solo

```bash
pnpm test -- --testPathPattern=".spec.ts" --testPathIgnorePatterns="e2e"
```

### Tests E2E solo

```bash
pnpm test:e2e

# O específicamente
pnpm test -- pasaportes.e2e-spec.ts
```

### Tests en modo watch (desarrollo)

```bash
pnpm test:watch
```

### Tests con coverage

```bash
pnpm test:cov
```

### Un archivo específico

```bash
pnpm test -- pasaportes.service.spec.ts
```

### Un test específico (por nombre)

```bash
pnpm test -- --testNamePattern="should create a new pasaporte"
```

## 📁 Estructura de Tests

```
apps/api/
├── src/
│   └── modules/
│       └── tramites/
│           ├── services/
│           │   ├── pasaportes.service.ts
│           │   └── pasaportes.service.spec.ts      ✅ Tests Unitarios
│           ├── controllers/
│           │   └── pasaportes.controller.ts
│           └── dto/
│               └── pasaporte.dto.ts
├── test/
│   └── pasaportes.e2e-spec.ts                      ✅ Tests E2E
└── jest.config.js
```

## ✅ Convenciones de Testing

### Nomenclatura

```typescript
// Archivos de test
*.service.spec.ts     // Tests unitarios de servicios
*.controller.spec.ts  // Tests unitarios de controllers
*.e2e-spec.ts         // Tests de integración/E2E
```

### Estructura de Tests

```typescript
describe('PasaportesService', () => {
  // Suite principal

  describe('findAll', () => {
    // Suite por método

    it('should return paginated list without filters', () => {
      // Test específico
    });

    it('should filter by profesorId', () => {
      // Test específico
    });
  });
});
```

### AAA Pattern (Arrange-Act-Assert)

```typescript
it('should create a new pasaporte', async () => {
  // Arrange
  const createDto = {
    /* ... */
  };
  mockPrismaService.pasaporte.create.mockResolvedValue(mockPasaporte);

  // Act
  const result = await service.create(createDto, 'user-id');

  // Assert
  expect(result).toEqual(mockPasaporte);
  expect(mockPrismaService.pasaporte.create).toHaveBeenCalledWith(expectedData);
});
```

## 🎯 Qué Testear

### ✅ Debes testear:

1. **Happy path**: El flujo principal funciona
2. **Errores**: Todos los casos de error (404, 400, 409, etc.)
3. **Edge cases**: Nulls, strings vacíos, límites numéricos
4. **Branches**: Todas las ramas de if/else
5. **Validaciones**: Todos los decoradores de DTOs
6. **Relaciones**: Datos relacionados se cargan correctamente

### ❌ No necesitas testear:

1. **Prisma ORM**: Ya está testeado
2. **NestJS framework**: Ya está testeado
3. **Getters/setters simples**: Sin lógica
4. **Decoradores**: Son metadatos

## 🔧 Mocks

### Mock de PrismaService

```typescript
const mockPrismaService = {
  pasaporte: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
};
```

### Mock de Guards (E2E)

```typescript
.beforeAll(async () => {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideGuard(JwtAuthGuard)
    .useValue({ canActivate: () => true })
    .overrideGuard(RolesGuard)
    .useValue({ canActivate: () => true })
    .compile();
})
```

## 🧪 Fixtures (Datos de Prueba)

### Factory Functions

```typescript
const createMockPasaporte = (overrides = {}) => ({
  id: 'uuid-1',
  numero: 'A123456',
  tipo: TipoPasaporte.ORDINARIO,
  // ... defaults
  ...overrides,
});
```

### Uso

```typescript
const pasaporte = createMockPasaporte({ numero: 'B654321' });
```

## 📈 Métricas de Calidad

### Cobertura Mínima Requerida

- **Statements**: 80%
- **Branches**: 75%
- **Functions**: 80%
- **Lines**: 80%

### Ver cobertura

```bash
pnpm test:cov
# Abrir coverage/lcov-report/index.html
```

## 🚀 CI/CD Integration

Los tests se ejecutan automáticamente en:

1. **Pre-commit**: Tests rápidos (unitarios)
2. **Pull Request**: Todos los tests + coverage
3. **Deploy**: Solo tests E2E en staging

## 🐛 Debugging Tests

### VS Code launch.json

```json
{
  "type": "node",
  "request": "launch",
  "name": "Jest Current File",
  "program": "${workspaceFolder}/node_modules/.bin/jest",
  "args": ["${relativeFile}"],
  "console": "integratedTerminal",
  "internalConsoleOptions": "neverOpen"
}
```

### Console logs en tests

```typescript
it('should debug', async () => {
  const result = await service.findAll();
  console.log('DEBUG:', JSON.stringify(result, null, 2));
  expect(result).toBeDefined();
});
```

## 📝 Checklist antes de commitear

- [ ] Todos los tests pasan
- [ ] Cobertura no bajó
- [ ] Tests E2E pasan contra base de datos real
- [ ] No hay `console.log` o `debugger`
- [ ] Código limpio y legible

## 🎓 Recursos

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [NestJS Testing](https://docs.nestjs.com/fundamentals/testing)
- [Testing Node.js with Jest](https://www.valentinog.com/blog/jest/)

## 🤝 Convención de Commits

```
test(pasaportes): add unit tests for create method
test(pasaportes): add E2E tests for filter by estado
test(contratos): fix failing test after schema change
```
