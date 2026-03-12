# ⚡ FastAPI Dashboard

A full-stack dashboard with React frontend, FastAPI backend, and PostgreSQL database — all running in Docker with a **single command**.

## 🚀 Quick Start

```bash
docker compose up --build
```

That's it! Then open:

| Service      | URL                          |
|--------------|------------------------------|
| **Frontend** | http://localhost             |
| **API Docs** | http://localhost:8000/docs   |
| **Backend**  | http://localhost:8000        |
| **Database** | localhost:5432               |

## 🛑 Stop Everything

```bash
docker compose down
```

To also delete the database volume:
```bash
docker compose down -v
```

## 🏗 Architecture

```
┌─────────────────────────────────────────┐
│  Browser → http://localhost (port 80)   │
│                                         │
│  ┌──────────┐    ┌──────────┐           │
│  │  React   │    │ FastAPI  │           │
│  │ (Nginx)  │───▶│ Backend  │           │
│  │  :80     │    │  :8000   │           │
│  └──────────┘    └────┬─────┘           │
│                       │                 │
│               ┌───────▼──────┐          │
│               │  PostgreSQL  │          │
│               │     :5432    │          │
│               └──────────────┘          │
└─────────────────────────────────────────┘
```

## 📁 Project Structure

```
fastapi-dashboard/
├── docker-compose.yml       ← Single command to run everything
├── .env                     ← Environment variables
├── backend/
│   ├── Dockerfile
│   ├── entrypoint.sh        ← Waits for DB, seeds, starts server
│   ├── main.py
│   ├── seed.py              ← Sample data (runs automatically if DB empty)
│   ├── requirements.txt
│   └── app/
│       ├── config.py
│       ├── db/database.py
│       ├── models/models.py
│       ├── schemas/schemas.py
│       └── routers/
│           ├── items.py
│           ├── users.py
│           ├── orders.py
│           └── stats.py
└── frontend/
    ├── Dockerfile           ← Multi-stage: build + nginx serve
    ├── nginx.conf
    └── src/
        ├── Dashboard.jsx    ← Main UI (Items, Users, Orders tabs)
        ├── App.jsx
        ├── main.jsx
        └── index.css
```

## 🗃 API Endpoints

| Method | Path              | Description                  |
|--------|-------------------|------------------------------|
| GET    | /stats            | Dashboard summary stats      |
| GET    | /items            | List all items               |
| POST   | /items            | Create item                  |
| DELETE | /items/{id}       | Delete item                  |
| GET    | /users            | List all users               |
| POST   | /users            | Create user                  |
| DELETE | /users/{id}       | Delete user                  |
| GET    | /orders           | List all orders              |
| POST   | /orders           | Create order                 |
| DELETE | /orders/{id}      | Delete order                 |
| GET    | /health           | Health check                 |

## 🔧 Development (without Docker)

```bash
# Backend
cd backend
pip install -r requirements.txt
uvicorn main:app --reload

# Frontend
cd frontend
npm install
npm run dev
```
