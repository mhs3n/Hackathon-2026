# Zenveo Curation Plan For UCAR Insight

## Goal

Use `zenveo` as the starting shell for `UCAR Insight`, but only keep the parts that accelerate delivery of the role structure below:

1. `Login`
2. `Role resolution`
3. `UCAR Admin dashboard`
4. `Institution Admin dashboard`
5. `Student dashboard`

This document defines what to keep, what to replace, and the minimal first slice to curate.

## Target Role Structure

The product flow we are preserving is:

1. `Login`
2. `User Role`
3. Route to one of:
   - `UCAR Admin`
   - `Institution Admin`
   - `Student`

Then:

### UCAR Admin

- `University Dashboard`
- `View all institutions`
- `Compare KPIs`
- `Detect risky institution`
- `Generate UCAR Report`

### Institution Admin

- `Institution Dashboard`
- `View local KPIs`
- `View student risk list`
- `Generate Institution Report`

### Student

- `Student Dashboard`
- `View grades and attendance`
- `AI Risk Explanation`
- `Recommendations`

## What Zenveo Already Gives Us

Zenveo already contains the right platform skeleton:

- auth endpoints
- role and entitlement checks
- protected frontend routes
- admin console shell
- portal shell
- dashboard page patterns
- user/scope/function/feature RBAC structure

That means we should reuse platform mechanics and replace business domain mechanics.

## Execution Path To Reuse

The main Zenveo execution path we should adapt is:

1. Backend auth and session setup
   - [auth_views.py](/home/rayen/work/zenveo/web-app-backend/rest_app/rest_api/views/auth_views.py:1)
   - [urls.py](/home/rayen/work/zenveo/web-app-backend/rest_app/rest_api/urls.py:1)

2. Backend role and entitlement resolution
   - [access.py](/home/rayen/work/zenveo/web-app-backend/rest_app/rest_api/access.py:1)
   - [models.py](/home/rayen/work/zenveo/web-app-backend/rest_app/rest_api/models.py:1)

3. Frontend admin authentication and protected routing
   - [AuthProvider.tsx](/home/rayen/work/zenveo/web-app-frontend/frontend-admin/src/features/auth/AuthProvider.tsx:1)
   - [RequireAdmin.tsx](/home/rayen/work/zenveo/web-app-frontend/frontend-admin/src/features/auth/RequireAdmin.tsx:1)
   - [routes/index.tsx](/home/rayen/work/zenveo/web-app-frontend/frontend-admin/src/app/routes/index.tsx:1)

4. Frontend portal protected routing
   - [guards.tsx](/home/rayen/work/zenveo/web-app-frontend/frontend-portal/src/features/auth/guards.tsx:1)
   - [App.tsx](/home/rayen/work/zenveo/web-app-frontend/frontend-portal/src/App.tsx:1)

5. Dashboard UI composition patterns
   - [frontend-admin Dashboard](/home/rayen/work/zenveo/web-app-frontend/frontend-admin/src/pages/Dashboard/index.tsx:1)
   - [PortalHomePage.tsx](/home/rayen/work/zenveo/web-app-frontend/frontend-portal/src/pages/PortalHomePage.tsx:1)

## Keep / Replace Matrix

### Keep As-Is Or Nearly As-Is

- JWT/session/cookie auth flow
- login page structure
- auth provider pattern
- protected route pattern
- admin shell layout
- portal shell layout
- RBAC tables:
  - `Scope`
  - `AppFunction`
  - `FunctionFeature`
  - `ScopeFunction`
  - `ScopeFunctionFeature`
  - `UserScope`
- page composition patterns for dashboards, cards, sections, alerts

### Keep But Rename

- `Company` -> `Institution`
- `portal_access` -> `primary_role`
- `admin_access` -> `ucar_admin_access` or a clearer top-level admin flag
- `AppFunction` entries -> UCAR modules such as `kpi-overview`, `risk-monitoring`, `reporting`, `student-insights`

### Replace Early

- property-related models and APIs
- landlord/tenant/property-owner semantics
- company/property-user mapping assumptions
- Facilioo/Impower integrations
- property dashboard metrics
- property documents and finance vocabulary
- owner reports and property activity wording

### Borrow As References Only

- `predictores` for AI workflows, background jobs, and analytics ideas
- `quality_gate` for document ingestion and validation flow

## Minimal Curated Slice

The first curated version should only include:

### Backend

- auth endpoints
- current-user endpoint
- entitlements endpoint
- role resolution helpers
- a lightweight institution-aware user model
- dashboard summary endpoints for:
  - UCAR admin
  - institution admin
  - student

### Frontend

- login page
- role-based redirect after login
- admin shell
- portal shell
- 3 dashboard entry pages:
  - UCAR Admin dashboard
  - Institution Admin dashboard
  - Student dashboard

### Excluded For First Pass

- most property CRUD
- current external workflow modules
- property document flows
- property finance exports
- activity analytics not needed for the demo

## Recommended Role Mapping

Zenveo currently mixes admin access and portal personas. For UCAR Insight, simplify that into 3 explicit roles.

### Proposed Roles

- `ucar_admin`
- `institution_admin`
- `student`

### Proposed Behavior

- `ucar_admin` can access cross-institution dashboards and reports
- `institution_admin` can access only institution-level dashboards and risk views
- `student` can access only student-level indicators, explanations, and recommendations

This is much cleaner than inheriting Zenveo's `admin`, `intern`, `extern`, and `property-owner` role semantics.

## Proposed Initial Data Model

Replace Zenveo business entities with these early:

- `Institution`
- `User`
- `StudentProfile`
- `KpiSnapshot`
- `RiskAlert`
- `GeneratedReport`

Optional next:

- `ReportingPeriod`
- `EnrollmentMetric`
- `FinanceMetric`
- `HrMetric`
- `AttendanceRecord`
- `GradeRecord`

## Frontend Route Mapping

### Current Zenveo Pattern

- admin routes live in the admin app
- portal routes live in the portal app
- role guards control access

### UCAR Mapping

#### Admin App

- `/login`
- `/dashboard`
- `/institutions`
- `/compare-kpis`
- `/risk-monitoring`
- `/reports`

This app is mainly for `UCAR Admin`.

#### Portal App

- `/login`
- `/`
- `/kpis`
- `/risk-list`
- `/report`
- `/student`

The portal should host both:

- `Institution Admin` pages
- `Student` pages

with guard-based routing inside it.

## Suggested First Redirect Logic

After login:

- if role is `ucar_admin` -> send to admin app `/dashboard`
- if role is `institution_admin` -> send to portal app `/`
- if role is `student` -> send to portal app `/student`

This exactly matches the structure you want.

## Dashboard Mapping

### UCAR Admin Dashboard

Derived from Zenveo admin dashboard shell, but replace metrics with:

- total institutions
- total students
- institutions at risk
- average KPI score

Actions:

- view all institutions
- compare KPIs
- generate UCAR report

### Institution Admin Dashboard

Derived from Zenveo portal home shell, but replace tiles/cards with:

- local attendance trend
- local performance trend
- number of at-risk students
- report generation shortcut

### Student Dashboard

A new lightweight dashboard page with:

- grades summary
- attendance summary
- student risk status
- AI explanation
- recommendations

## Phase Plan

## Phase 1: Curate The Shell

- isolate auth and guarded routing
- identify reusable shared UI components
- remove property-only navigation branches
- define UCAR roles

## Phase 2: Replace The Domain

- introduce institution and student entities
- remove or ignore property/landlord entities
- create new KPI and alert endpoints

## Phase 3: Build The Three Dashboards

- UCAR admin dashboard
- institution admin dashboard
- student dashboard

## Phase 4: Add AI Layer

- risk detection for institutions
- student risk explanation
- recommendations
- report generation

## Risks

### Risk: Dragging too much Zenveo domain logic

Mitigation:

- keep auth, routing, and layout
- drop property workflows early

### Risk: Keeping old role semantics too long

Mitigation:

- introduce explicit UCAR roles immediately

### Risk: Trying to adapt every Zenveo screen

Mitigation:

- curate only the login flow, route guards, shells, and dashboards first

## Immediate Next Step

The next practical step is to create a `migration keep/replace checklist` directly against the Zenveo file tree, then scaffold the first curated app surface around:

- `login`
- `role redirect`
- `UCAR Admin dashboard`
- `Institution Admin dashboard`
- `Student dashboard`
