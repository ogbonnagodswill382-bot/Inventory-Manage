# StockFlow — Inventory Suite & Stock Management System

A full-stack, real-time inventory management monorepo built with a **Next.js JavaScript (`.jsx`)** frontend and a **Python & Django REST Framework** backend.

---

## 📁 Monorepo Structure

```
stock-savvy/
├── frontend/          # Next.js App Router (JavaScript / Tailwind CSS)
│   ├── app/           # App Router routes & pages
│   ├── components/    # UI & layout components
│   ├── hooks/         # React custom hooks
│   ├── lib/           # API fetch helpers & utilities
│   ├── public/        # Static assets
│   └── package.json   # Frontend scripts & dependencies
│
└── backend/           # Python & Django REST Framework API
    ├── inventory/     # Models, serializers, views, seed command
    ├── stockflow_backend/ # Django settings, URLs, WSGI configuration
    ├── manage.py      # Django management CLI
    ├── requirements.txt # Python dependencies
    └── db.sqlite3     # SQLite database
```

---

## 🚀 How to Run Locally

### 1. Run the Python & Django Backend

Navigate to the `backend/` directory and start the Django API server:

```bash
cd backend
python manage.py runserver 127.0.0.1:8000
```

The Django REST API will be running at `http://127.0.0.1:8000/api/`.

> **Note**: To re-seed initial data at any time, run: `python manage.py seed_data`.

---

### 2. Run the Next.js Frontend

Navigate to the `frontend/` directory and start the Next.js development server:

```bash
cd frontend
npm run dev
```

The Next.js application will be running at `http://localhost:3000`.

---

## ⚙️ Tech Stack Summary

- **Frontend**: Next.js 15 (App Router), React 19, JavaScript (`.jsx`), Tailwind CSS v4, Lucide React, Recharts.
- **Backend**: Python 3.14, Django 5, Django REST Framework, `django-cors-headers`, SQLite.
