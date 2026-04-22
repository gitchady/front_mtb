# Railway deploy guide

This repository is a monorepo. Deploy it to Railway as three services in one project:

- `Postgres` database
- `Backend` from `/apps/api`
- `Frontend` from `/`

## 1. Push the repository

Commit and push the project to GitHub. Railway deploys most smoothly from a GitHub repository.

## 2. Create the Railway project

1. Open Railway.
2. Create `New Project`.
3. Choose `Empty Project`.
4. Add a database: `+ Create` -> `Database` -> `PostgreSQL`.

Railway exposes the database connection as `DATABASE_URL` on the Postgres service.

## 3. Deploy Backend

Create a new service from the same GitHub repository.

Set:

```text
Service name: Backend
Root Directory: /apps/api
```

The service uses `apps/api/railway.json`:

```text
Builder: Dockerfile
Dockerfile Path: Dockerfile
Start Command: uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

The backend Docker image installs dependencies from `apps/api/requirements.txt`.

Add variables to the Backend service:

```text
MTB_DATABASE_URL=${{Postgres.DATABASE_URL}}
MTB_QUEUE_MODE=sync
MTB_DEMO_USER_ID=u_demo
MTB_CORS_ORIGIN=https://YOUR_FRONTEND_DOMAIN
```

Then open `Settings` -> `Networking` -> `Generate Domain`.

Check the API:

```text
https://YOUR_BACKEND_DOMAIN/docs
```

## 4. Deploy Frontend

Create another service from the same GitHub repository.

Set:

```text
Service name: Frontend
Root Directory: /
```

The service uses the root `railway.json`:

```text
Build Command: npm run build:web
Start Command: npm run start:web
```

Add variables to the Frontend service:

```text
VITE_API_URL=https://YOUR_BACKEND_DOMAIN
VITE_FEATURE_HALVA_SNAKE=true
```

Then open `Settings` -> `Networking` -> `Generate Domain`.

## 5. Update CORS

After Railway gives you the frontend domain, go back to the Backend service and set:

```text
MTB_CORS_ORIGIN=https://YOUR_FRONTEND_DOMAIN
```

Redeploy Backend.

## 6. Final checks

Open:

```text
https://YOUR_FRONTEND_DOMAIN
https://YOUR_BACKEND_DOMAIN/docs
```

If the frontend opens but API calls fail, check:

- `VITE_API_URL` points to the backend public domain.
- `MTB_CORS_ORIGIN` exactly matches the frontend public domain.
- Backend was redeployed after changing `MTB_CORS_ORIGIN`.
- `MTB_DATABASE_URL` references `${{Postgres.DATABASE_URL}}`.
