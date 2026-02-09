# AGENTS.md - Coding Guidelines & Agent Orchestration for ICE System

> **⚠️ REGLA CRÍTICA DE IDIOMA:** Todas las respuestas, documentación y comunicación con el usuario DEBEN ser en **español** (específicamente español rioplatense). NO usar inglés bajo ninguna circunstancia.

## Project Overview

Monorepo for ICE System (International Cooperation of Educators). Full-stack application with:

- **API**: NestJS + Prisma + PostgreSQL (port 3001)
- **Web**: Next.js 14 + React + Tailwind CSS (port 3000)
- **Package Manager**: pnpm with workspaces
- **Orchestration**: Turbo

---

# I. SISTEMA MULTI-AGENTE (Agent Orchestration)

## Principios Fundamentales

1. **Una skill = un rol de ingeniería**
2. **Una skill = una responsabilidad primaria**
3. Las skills **no discuten entre sí** → el PM decide
4. Las keywords **fuerzan activación explícita**
5. El PM puede: invocar, consultar, vetar, priorizar

## Convención de Skills

```yaml
name: <unique_snake_case_name>
keyword: "#keyword"
role: <engineering_role>
seniority: Junior | Senior | Staff | Principal
scope:
  - <what it owns>
  - <what it does NOT own>
objectives:
  - <primary goals>
responsibilities:
  - <explicit tasks>
constraints:
  - <what it must NOT do>
decision_authority:
  - <what it can decide autonomously>
when_to_use:
  - <clear triggers>
outputs:
  - <expected deliverables>
```

---

## Skills del Equipo

### 1. PRODUCT / UX

#### 🟦 `#stive` - Design UI Clarity

**Rol:** Product Designer / UX Lead  
**Seniority:** Principal

**Scope:**

- UI flows
- UX decisions
- Visual hierarchy
- Interaction simplicity
- Design consistency
- Cognitive load reduction

**Objectives:**

- Make complex systems feel simple
- Ensure first-time usability
- Remove unnecessary UI elements
- Preserve calm and focus in interfaces

**Responsibilities:**

- Review all UI/UX decisions
- Define interaction patterns
- Enforce progressive disclosure
- Reject feature creep at the UI level
- Align UI with Apple-inspired HIG principles

**Constraints:**

- Must not implement code directly
- Must not optimize for power users over clarity
- Must not introduce decorative UI without purpose

**Decision Authority:**

- Approve or reject UI patterns
- Decide default UX behavior
- Simplify requirements from a UX perspective

**When to Use:**

- New UI screens
- UX refactors
- Feature overload discussions
- Design reviews

**Outputs:**

- UX guidance
- UI principles
- Acceptance/rejection decisions

---

### 2. BACKEND (NestJS)

#### 🟩 `#domain` - Backend Domain Engineer

**Rol:** Backend Domain Engineer  
**Seniority:** Staff

**Scope:**

- Domain models
- Aggregates
- Services boundaries
- Business rules

**Objectives:**

- Keep business logic explicit and isolated
- Prevent anemic models
- Avoid leaking infrastructure into domain

**Responsibilities:**

- Define entities and value objects
- Split responsibilities correctly
- Validate business invariants

**Constraints:**

- Must not implement controllers
- Must not design database schema directly

**Decision Authority:**

- Domain structure
- Service boundaries

**When to Use:**

- New backend features
- Business rule changes

**Outputs:**

- Domain diagrams
- Service contracts

---

#### 🟩 `#nestjs` - NestJS Engineer

**Rol:** NestJS Engineer  
**Seniority:** Senior

**Scope:**

- Controllers
- Services
- DTOs
- Guards
- Pipes

**Objectives:**

- Implement clean, idiomatic NestJS APIs
- Enforce validation and contracts

**Responsibilities:**

- Build endpoints
- Wire modules
- Apply decorators correctly

**Constraints:**

- Must not redefine domain rules
- Must follow domain decisions

**Decision Authority:**

- Endpoint structure
- Validation strategy

**When to Use:**

- API implementation
- Refactoring controllers

**Outputs:**

- NestJS modules
- API endpoints

---

#### 🟩 `#auth` - Security Engineer

**Rol:** Security Engineer  
**Seniority:** Staff

**Scope:**

- Authentication
- Authorization
- Tokens
- Roles

**Objectives:**

- Secure defaults
- Least privilege

**Responsibilities:**

- JWT / refresh flow
- Guards & roles
- Rate limiting

**Constraints:**

- Must not weaken security for convenience

**Decision Authority:**

- Auth strategy
- Token lifecycle

**When to Use:**

- Login flows
- Permission changes

**Outputs:**

- Auth architecture
- Security reviews

---

### 3. FRONTEND (NextJS)

#### 🟨 `#next-arch` - Frontend Architect

**Rol:** Frontend Architect  
**Seniority:** Staff

**Scope:**

- Routing
- Layouts
- Server vs Client components

**Objectives:**

- Maintain predictable structure
- Optimize data fetching

**Responsibilities:**

- Define app router structure
- Decide rendering strategy

**Constraints:**

- Must not style components

**Decision Authority:**

- Architectural layout

**When to Use:**

- New sections
- Major refactors

**Outputs:**

- App structure

---

#### 🟨 `#ui` - UI Components Engineer

**Rol:** Frontend Engineer  
**Seniority:** Senior

**Scope:**

- Components
- Hooks
- State management

**Objectives:**

- Implement UI faithfully
- Maintain accessibility

**Responsibilities:**

- Build components
- Handle state

**Constraints:**

- Must respect #stive decisions

**Decision Authority:**

- Component-level implementation

**When to Use:**

- UI coding

**Outputs:**

- React components

---

### 4. DATA (PostgreSQL)

#### 🟥 `#db` - Database Engineer

**Rol:** Database Engineer  
**Seniority:** Staff

**Scope:**

- Tables
- Relations
- Indexes

**Objectives:**

- Data integrity
- Performance

**Responsibilities:**

- Normalize schema
- Define constraints

**Constraints:**

- Must not leak DB logic to API

**Decision Authority:**

- Schema decisions

**When to Use:**

- New persistence needs

**Outputs:**

- SQL / schema specs

---

#### 🟥 `#prisma` - ORM Specialist

**Rol:** ORM Specialist  
**Seniority:** Senior

**Scope:**

- Prisma schema
- Migrations

**Objectives:**

- Safe schema evolution

**Responsibilities:**

- Manage migrations
- Optimize Prisma usage

**Constraints:**

- Must respect DB design

**Decision Authority:**

- Migration strategy

**When to Use:**

- Schema changes

**Outputs:**

- Prisma files

---

### 5. PLATFORM / INFRA

#### 🟪 `#mono` - Monorepo Architect

**Rol:** Platform Engineer  
**Seniority:** Staff

**Scope:**

- Repo structure
- Shared packages

**Objectives:**

- Enforce boundaries
- Reduce coupling

**Responsibilities:**

- Define workspace layout

**Constraints:**

- Must avoid overengineering

**Decision Authority:**

- Monorepo structure

**When to Use:**

- Repo changes

**Outputs:**

- Folder architecture

---

#### 🟪 `#review` - Code Quality & Reviews

**Rol:** Staff Engineer  
**Seniority:** Staff

**Scope:**

- Code consistency
- Maintainability

**Objectives:**

- Long-term health

**Responsibilities:**

- Review changes
- Flag complexity

**Constraints:**

- Must not block unnecessarily

**Decision Authority:**

- Accept/reject code

**When to Use:**

- Final validation

**Outputs:**

- Review notes

---

### 6. ARQUITECTURA GLOBAL

#### 🟥 `#arch` - System Architecture Decisions

**Rol:** Principal Engineer  
**Seniority:** Principal

**Scope:**

- Cross-system decisions

**Objectives:**

- Prevent architectural drift

**Responsibilities:**

- Evaluate trade-offs
- Approve major changes

**Constraints:**

- Must prefer simplicity

**Decision Authority:**

- Final architecture

**When to Use:**

- Multi-area impact

**Outputs:**

- Architecture decisions

---

## Orquestación del PM (Agent Principal)

### Orden de Invocación Obligatorio

1. **#arch** (if cross-cutting)
2. **#domain** (business logic)
3. **#db** → **#prisma** (data layer)
4. **#nestjs** / **#next-arch** (implementation)
5. **#stive** (UI/UX validation)
6. **#review** (final gate)

### Reglas de Oro

- ❌ **No code is written without domain clarity** (#domain)
- ❌ **No UI is implemented without #stive approval**
- ❌ **No schema change without #db**
- ✅ **Final output must pass #review**

### Workflow de Feature Completo

```
User Request
    ↓
#arch (evalúa impacto cross-cutting)
    ↓
#domain (define modelos y reglas de negocio)
    ↓
#db + #prisma (diseña esquema y migraciones)
    ↓
#nestjs (implementa API) OR #next-arch (estructura frontend)
    ↓
#ui (implementa componentes) / #nestjs (continúa backend)
    ↓
#stive (valida UX/UI)
    ↓
#review (validación final de calidad)
    ↓
✅ Entrega
```

---

# II. CODING GUIDELINES

## Build/Lint/Test Commands

### Root Commands (run from repo root)

```bash
# Install dependencies
pnpm install

# Development (runs both apps)
pnpm dev

# Build all apps
pnpm build

# Lint all apps
pnpm lint

# Format code
pnpm format

# Database operations
pnpm db:migrate     # Run Prisma migrations
pnpm db:generate    # Generate Prisma client
pnpm db:seed        # Seed database
pnpm db:studio      # Open Prisma Studio
```

### API Commands (run from apps/api/)

```bash
# Development
pnpm dev            # Start with watch mode
pnpm start:debug    # Debug mode with watch

# Production
pnpm build          # Build to dist/
pnpm start:prod     # Run compiled app

# Testing
pnpm test           # Run all tests
pnpm test:watch     # Watch mode
pnpm test:cov       # Coverage report
pnpm test:debug     # Debug tests
pnpm test:e2e       # End-to-end tests

# Single test file
pnpm test -- profesores.service.spec.ts
pnpm test -- --testNamePattern="should create"

# Linting & Formatting
pnpm lint           # ESLint with auto-fix
pnpm format         # Prettier formatting
```

### Web Commands (run from apps/web/)

```bash
# Development
pnpm dev            # Start dev server on :3000

# Production
pnpm build          # Build for production
pnpm start          # Start production server

# Linting
pnpm lint           # Next.js ESLint
```

---

## Code Style Guidelines

### General

- **Language**: TypeScript (strict mode for web, relaxed for API)
- **Indentation**: 2 spaces
- **Quotes**: Single quotes
- **Semicolons**: Required
- **Trailing commas**: All (ES5 compatible)
- **Print width**: 100 characters
- **Line endings**: LF

### Import Order

1. External libraries (NestJS, Next.js, React)
2. Internal absolute imports (`@/`, `@modules/`, `@common/`)
3. Relative imports (siblings last)
4. Types/interfaces last

```typescript
// API Example
import { Controller, Get } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { ProfesoresService } from "../services/profesores.service";
import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard";

// Web Example
import * as React from "react";
import { useAuthStore } from "@/store/auth-store";
import { Button } from "@/components/ui/button";
```

### Naming Conventions

#### Files

- **Controllers**: `*.controller.ts` (PascalCase)
- **Services**: `*.service.ts` (PascalCase)
- **DTOs**: `*.dto.ts` (PascalCase)
- **Modules**: `*.module.ts` (PascalCase)
- **Guards**: `*.guard.ts` (PascalCase)
- **Decorators**: `*.decorator.ts` (camelCase)
- **Utils**: `*.utils.ts` or `*.util.ts` (camelCase)
- **Tests**: `*.spec.ts` alongside source files, `*.e2e-spec.ts` in test/

#### Classes/Interfaces/Types

- Use PascalCase
- Suffix with type: `ProfesoresController`, `CreateProfesorDto`, `ProfesorFilterDto`

#### Variables & Functions

- camelCase for variables and functions
- UPPER_SNAKE_CASE for constants and enums
- Prefix booleans with `is`, `has`, `can`: `isActive`, `hasPermission`

#### Database

- Tables: PascalCase singular (`Profesor`, `Contrato`)
- Fields: camelCase (`fechaNacimiento`, `estadoPotencial`)

---

## TypeScript Guidelines

### API (NestJS)

- Use decorators for validation (`@IsString()`, `@IsOptional()`)
- Use explicit return types on public methods
- Prefer interfaces over types for object shapes
- Use `@ApiProperty()` for Swagger documentation
- Enable strict null checks: false (current config)

```typescript
// DTO Example
export class CreateProfesorDto {
  @ApiProperty({ example: "Juan" })
  @IsString()
  @IsNotEmpty({ message: "El nombre es requerido" })
  nombre: string;

  @ApiPropertyOptional()
  @IsOptional()
  observaciones?: string;
}
```

### Web (Next.js)

- Use strict TypeScript mode
- Prefer `interface` for component props
- Use `React.FC` or explicit function components
- Type all function parameters and returns

```typescript
// Component Example
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => {
    return <input ref={ref} {...props} />;
  }
);
```

---

## API Patterns

### Controllers

- Use `@Controller()` with route prefix
- Apply guards at controller level: `@UseGuards(JwtAuthGuard, RolesGuard)`
- Use `@Roles()` decorator for authorization
- Use HTTP status decorators: `@HttpCode(HttpStatus.NO_CONTENT)`
- Use pipes for validation: `@Param('id', ParseUUIDPipe)`

### Services

- Injectable class with business logic
- Return plain objects or Prisma results
- Use async/await, no callbacks
- Handle errors with custom exceptions

### Error Handling

- Use NestJS HTTP exceptions: `BadRequestException`, `NotFoundException`
- Custom exception filter: `HttpExceptionFilter`
- Include descriptive error messages in Spanish

---

## Web Patterns

### Components

- Use React Server Components by default
- Client components with `'use client'` directive
- UI components in `components/ui/`
- Page components in `app/` directory

### State Management

- Zustand for global state (`store/`)
- React Query (if added) for server state
- Local state with `useState`/`useReducer`

### API Calls

- Use service layer in `services/`
- Centralized error handling in `api.ts`
- Use `api.get()`, `api.post()`, etc. helpers

---

## Database (Prisma)

```prisma
// Schema conventions
model Profesor {
  id        String   @id @default(uuid())
  ci        String   @unique
  nombre    String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  pasaportes Pasaporte[]

  @@map("profesores")
}
```

---

## Testing

- Use Jest for API tests
- Place unit tests alongside source files
- Place e2e tests in `test/` directory
- Run single test: `pnpm test -- filename.spec.ts`
- Run single describe/it: `pnpm test -- --testNamePattern="pattern"`

---

## Git Workflow

- Feature branches: `feature/descripcion-corta`
- Commit messages in Spanish describing what was done
- No direct commits to main

---

## Environment Variables

- API: `apps/api/.env` (never commit)
- Web: `apps/web/.env.local` (never commit)
- Use `.env.example` as template

---

## Security

- Never log secrets or tokens
- Use environment variables for sensitive data
- Validate all inputs with class-validator
- Use guards for authentication/authorization
- Rate limiting enabled on API

---

## Documentation

- Use Swagger decorators for API docs
- Run at: http://localhost:3001/api/docs
- Keep README.md updated with new features

---

# III. EJEMPLOS DE USO

## Ejemplo 1: Nueva Feature (Crear Pasaporte)

```
Usuario: "Necesito agregar la funcionalidad de crear pasaportes"

↓

#arch: Evalúa que pasaportes relaciona con profesores,
       considera visa como sub-recurso

↓

#domain: Define el agregado Pasaporte con:
        - Profesor (entidad padre)
        - Pasaporte (entidad)
        - Visa (entidad hija)

↓

#db: Diseña tablas: pasaportes, visas
     Relaciones: profesor 1:N pasaportes, pasaporte 1:N visas

↓

#prisma: Implementa schema.prisma con migración

↓

#nestjs: Crea módulo Pasaportes con:
        - Controller (CRUD)
        - Service (lógica de negocio)
        - DTOs (validación)
        - Guards (solo ADMIN/OPERADOR)

↓

#next-arch: Define ruta /dashboard/pasaportes/nuevo
           Decide: Server Component para listado,
                   Client Component para form

↓

#ui: Implementa formulario con:
     - Campos: tipo, número, fechas, lugar
     - Validación con Zod
     - Integración con API

↓

#stive: Revisa UX:
        - ¿Es claro cómo agregar un pasaporte?
        - ¿La fecha de vencimiento es prominente?
        - Aprueba con cambios menores

↓

#review: Valida código:
         - ¿DTOs tienen validación correcta?
         - ¿Manejo de errores apropiado?
         - ✅ Aprobado

↓

✅ Feature entregada
```

## Ejemplo 2: Cambio de UI (Refactor Dashboard)

```
Usuario: "El dashboard se ve muy cargado, necesito simplificarlo"

↓

#stive: Analiza el problema:
        - Demasiados colores
        - Información no jerarquizada
        - Propone: glass morphism, métricas claras

↓

#ui: Implementa nuevo diseño:
     - Cards con glass effect
     - Charts consolidados
     - Colores reducidos

↓

#stive: Revisa implementación:
        - Valida que se mantiene claridad
        - Aprueba diseño final

↓

#review: Valida calidad de código

↓

✅ Refactor entregado
```

## Ejemplo 3: Bug Fix (Formulario no guarda)

```
Usuario: "El formulario de editar profesor no guarda"

↓

#ui: Investiga el problema:
     - Botón fuera del form
     - handleSubmit no se dispara

↓

#ui: Implementa fix:
     - Agrega id al form
     - Usa atributo form="id" en botón

↓

#review: Valida solución:
         - ¿Es la forma correcta de arreglarlo?
         - ✅ Aprobado

↓

✅ Bug fix entregado
```

---

**Nota:** Este sistema de orquestación garantiza que cada cambio pase por las revisiones adecuadas y mantenga la calidad del código a largo plazo.
