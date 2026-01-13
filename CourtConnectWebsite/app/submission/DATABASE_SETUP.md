# CourtConnect Database Setup Guide

This guide will help you restore the CourtConnect database locally for testing.

## Prerequisites

1. **PostgreSQL 14+** - [Download here](https://www.postgresql.org/download/)
2. **Python 3.11+** - [Download here](https://www.python.org/downloads/)
3. **Node.js 18+** - [Download here](https://nodejs.org/)

---

## Quick Setup

### 1. Create PostgreSQL Database

```bash
# Open PostgreSQL command line
psql -U postgres

# Create database and user
CREATE DATABASE courtconnect;
CREATE USER courtconnect_user WITH PASSWORD 'courtconnect_password';
GRANT ALL PRIVILEGES ON DATABASE courtconnect TO courtconnect_user;
\q
```

### 2. Restore Database from Dump

**Windows:**
```bash
cd backend
set PGPASSWORD=courtconnect_password
psql -h localhost -U courtconnect_user -d courtconnect -f ..\submission\database_dump.sql
```

**Mac/Linux:**
```bash
cd backend
export PGPASSWORD=courtconnect_password
psql -h localhost -U courtconnect_user -d courtconnect -f ../submission/database_dump.sql
```

### 3. Set Up Backend

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file with these contents:
```

**backend/.env:**
```env
DB_NAME=courtconnect
DB_USER=courtconnect_user
DB_PASSWORD=courtconnect_password
DB_HOST=localhost
DB_PORT=5432
SECRET_KEY=django-insecure-test-key-change-in-production
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
```

```bash
# Run migrations
python manage.py migrate

# Start backend server
python manage.py runserver
```

Backend will run at: `http://localhost:8000`

### 4. Set Up Frontend

Open a new terminal:

```bash
cd frontend

# Install dependencies
npm install

# Create .env file with:
```

**frontend/.env:**
```env
VITE_API_BASE_URL=http://localhost:8000
```

```bash
# Start frontend
npm run dev
```

Frontend will run at: `http://localhost:5173`

---

## Login Credentials

See `CREDENTIALS.md` for test account logins.

---

## Troubleshooting

**Database connection fails:**
- Verify PostgreSQL is running
- Check credentials in `.env` match the database user you created

**Module not found errors:**
- Make sure virtual environment is activated
- Run `pip install -r requirements.txt` again

**Port already in use:**
- Backend: `python manage.py runserver 8001`
- Frontend: Vite will suggest an alternate port

---

## Testing

1. Open browser to `http://localhost:5173`
2. Login with credentials from `CREDENTIALS.md`
3. Test features as different user roles (admin, manager, user)
