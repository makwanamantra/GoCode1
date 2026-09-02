# Role-wise execution flows (frontend → backend)

## Roles identified in code

- **Visitor** (anonymous, not signed in)
- **CLIENT**
- **EMPLOYEE**
- **OWNER** (admin)

## Functionalities by role

### Visitor
- Browse landing/templates
- Auto visitor tracking (`track-visit`)
- Sign up / sign in

### CLIENT
- Submit custom request
- Accept owner offer (creates project)
- Request resume download access
- Download approved resume

### EMPLOYEE
- View assigned tasks
- Update task status
- Submit deliverables

### OWNER
- Review/respond to custom requests
- Approve project completion
- Review user/visitor logs
- Approve/reject resume download requests
- Update site/email settings

---

## Flow 1: Visitor tracking

1. `AppShell` mounts and runs `useVisitorTracking(user)`.
2. Hook builds payload (`visitor_id`, path, user agent context) and calls `apiPost('track-visit/')`.
3. Frontend `apiService` sends `POST /api/track-visit/`.
4. Backend `track_visit` (`backend/api/views.py`) upserts `VisitorLog`, appends `VisitorEvent`, optionally sends admin alert.
5. Serializer response returns visitor snapshot to frontend.

```mermaid
sequenceDiagram
  participant U as Visitor Browser
  participant FE as React useVisitorTracking
  participant API as apiService
  participant BE as Django track_visit
  participant DB as VisitorLog/VisitorEvent
  U->>FE: Open app/page
  FE->>API: apiPost("track-visit/", payload)
  API->>BE: POST /api/track-visit/
  BE->>DB: get_or_create visitor + create event
  DB-->>BE: persisted rows
  BE-->>API: 201/200 VisitorLog JSON
  API-->>FE: parsed response
```

## Flow 2: Sign up / login

1. `AuthPanel` submits credentials via `AuthContext.register/login`.
2. `apiPostStrict` calls `POST /api/auth/register/` or `POST /api/auth/login/`.
3. Backend creates/authenticates user, ensures `UserProfile`, records `LoginHistory`.
4. Frontend persists user session in local storage and routes by role.

```mermaid
sequenceDiagram
  participant U as User
  participant FE as AuthPanel/AuthContext
  participant API as apiPostStrict
  participant BE as auth_register/auth_login
  participant DB as User/UserProfile/LoginHistory
  U->>FE: Submit signup/login form
  FE->>API: POST auth endpoint
  API->>BE: /api/auth/register or /api/auth/login
  BE->>DB: create/authenticate + profile + login history
  DB-->>BE: user context
  BE-->>API: user payload
  API-->>FE: success response
  FE->>FE: persist session + role routing
```

## Flow 3: CLIENT request accepted into project

1. Client clicks “Accept Offer & Initialize Project”.
2. `App` calls `POST /api/custom-requests/{id}/client_accept/`.
3. Backend `client_accept` changes request to `APPROVED`, creates `Project`, computes `advance_amount`.
4. UI updates custom request + prepends created project.

```mermaid
sequenceDiagram
  participant C as Client UI
  participant FE as App handler
  participant API as apiPostStrict
  participant BE as CustomRequestViewSet.client_accept
  participant DB as CustomRequest/Project
  C->>FE: Accept offer
  FE->>API: POST custom-requests/{id}/client_accept/
  API->>BE: request
  BE->>DB: set APPROVED + create Project
  DB-->>BE: project row
  BE-->>API: {project, status}
  API-->>FE: response
  FE->>C: render new project
```

## Flow 4: Resume access request and download

1. Client requests access in `ResumeDownloadCard`.
2. Frontend posts `POST /api/resume-requests/`.
3. Owner approves from dashboard (`POST /api/resume-requests/{id}/approve/`).
4. Client downloads through `GET /api/resume-download/{request_id}/` after approval.

```mermaid
sequenceDiagram
  participant C as Client
  participant FE as ResumeDownloadCard
  participant BE as ResumeDownloadRequestViewSet
  participant DL as download_resume
  participant DB as ResumeRequest/Resume
  C->>FE: Request access
  FE->>BE: POST /api/resume-requests/
  BE->>DB: create PENDING request
  Note over FE,BE: Owner approves later
  FE->>BE: POST /api/resume-requests/{id}/approve/
  BE->>DB: mark APPROVED
  C->>DL: GET /api/resume-download/{id}/
  DL->>DB: validate APPROVED + load resume
  DL-->>C: FileResponse or external URL
```

## Flow 5: EMPLOYEE task pipeline

1. Employee changes task status in dashboard.
2. Frontend calls task status endpoint.
3. Backend validates status and updates task.
4. Updated task state reflects in UI and analytics.

```mermaid
flowchart LR
  A[Employee clicks status chip] --> B[React handler]
  B --> C[POST /api/tasks/{id}/update_status/]
  C --> D[Django TaskViewSet.update_status]
  D --> E[(Task table)]
  E --> D
  D --> F[JSON response]
  F --> G[Dashboard state updated]
```

---

## Troubleshooting notes

- If frontend `npm run build` / `npm run lint` fail with `Permission denied`, run through Node-backed scripts (already configured in `frontend/package.json`).
- If backend tests run against unexpected external DB, set `DATABASE_URL`; fallback now defaults to local SQLite.
- Visitor tracking requires `visitor_id`; missing value returns HTTP 400 by design.

## Test mapping

- `backend/api/tests.py::AuthFlowTests` validates register/login behavior.
- `backend/api/tests.py::VisitorTrackingTests` validates visitor upsert/event creation.
- `backend/api/tests.py::RequestToProjectFlowTests.test_client_accept_offer_creates_project` validates client offer acceptance → project creation.
- `backend/api/tests.py::RequestToProjectFlowTests.test_resume_request_approval_enables_download` validates request/approve/download resume path.
