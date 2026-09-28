# CourtConnect - Sports Facility Booking Platform

A full-stack sports facility booking platform with court search, real-time availability, bookings, payments, and an admin dashboard.

## Prerequisites

Before setting up the project, ensure you have the following installed:

- **Python 3.11+** - [Download](https://www.python.org/downloads/)
- **Node.js 18+** - [Download](https://nodejs.org/)
- **PostgreSQL 14+** - [Download](https://www.postgresql.org/download/)
- **Git** - [Download](https://git-scm.com/downloads)

## Project Structure

```
.
├── backend/           # Django REST API
│   ├── app/          # Django apps
│   ├── config/       # Django settings
│   ├── scripts/      # Database management scripts
│   ├── database/     # SQL dumps and database files
│   └── media/        # User-uploaded files
├── frontend/         # React frontend (Vite)
└── README.md
```

## Initial Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd CourtConnectWebsite/app
```

### 2. Backend Setup

#### 2.1. Create Virtual Environment (Recommended)

**Windows:**
```bash
cd backend
python -m venv venv
venv\Scripts\activate
```

**Mac/Linux:**
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
```

#### 2.2. Install Python Dependencies

```bash
pip install -r requirements.txt
```

#### 2.3. Configure Environment Variables

```bash
# Copy the example environment file
cp .env.example .env

# Edit .env with your database credentials
# Update DB_PASSWORD with your PostgreSQL password
```

Required `.env` variables:
- `DB_NAME` - Database name (default: courtconnect_db)
- `DB_USER` - PostgreSQL username (default: postgres)
- `DB_PASSWORD` - Your PostgreSQL password
- `DB_HOST` - Database host (default: localhost)
- `DB_PORT` - Database port (default: 5432)

#### 2.4. Database Setup

**Option A: Setup with Sample Data **

```bash
python scripts/db_setup.py --with-sample-data
```

This will:
- Create the PostgreSQL database
- Run all migrations
- Load sample facilities, courts, and users

**Option B: Setup Empty Database**

```bash
python scripts/db_setup.py
```

**Option C: Restore from Specific Dump**

```bash
# Restore sample data
python scripts/db_restore.py --sample-data

# Restore from custom dump file
python scripts/db_restore.py --input path/to/dump.sql
```

#### 2.5. Create Superuser (Optional)

```bash
python manage.py createsuperuser
```

#### 2.6. Run Development Server

```bash
python manage.py runserver
```

Backend API will be available at: `http://localhost:8000`
Admin panel: `http://localhost:8000/admin`
API documentation: `http://localhost:8000/api/schema/swagger-ui/`

### 3. Frontend Setup

#### 3.1. Install Dependencies

```bash
cd frontend
npm install
```

#### 3.2. Run Development Server

```bash
npm run dev
```

Frontend will be available at: `http://localhost:5173`

## Database Management

### Creating Database Dumps

**Full dump (schema + data):**
```bash
cd backend
python scripts/db_dump.py
```

**Schema only (no data):**
```bash
python scripts/db_dump.py --schema-only
```

**Custom output file:**
```bash
python scripts/db_dump.py --output my_backup.sql
```

Dumps are saved to `backend/database/dumps/` by default.

### Restoring Database

**From sample data:**
```bash
cd backend
python scripts/db_restore.py --sample-data
```

**From specific file:**
```bash
python scripts/db_restore.py --input database/dumps/dump_20240101.sql
```

**Skip confirmation prompt:**
```bash
python scripts/db_restore.py --sample-data --yes
```

### Running Migrations

```bash
cd backend
python manage.py makemigrations  # Create new migrations
python manage.py migrate         # Apply migrations
```

## Development Workflow

1. **Pull latest changes:**
   ```bash
   git pull origin main
   ```

2. **Update dependencies:**
   ```bash
   # Backend
   cd backend
   pip install -r requirements.txt

   # Frontend
   cd frontend
   npm install
   ```

3. **Run migrations:**
   ```bash
   cd backend
   python manage.py migrate
   ```

4. **Start development servers:**
   ```bash
   # Terminal 1 - Backend
   cd backend
   python manage.py runserver

   # Terminal 2 - Frontend
   cd frontend
   npm run dev
   ```

## Troubleshooting

### Database Connection Issues

**PostgreSQL not running:**
- **Windows:** Check Services for "postgresql-x64-XX"
- **Mac:** `brew services start postgresql`
- **Linux:** `sudo systemctl start postgresql`

**Authentication failed:**
- Verify credentials in `.env` file
- Check PostgreSQL `pg_hba.conf` for authentication settings

**Database doesn't exist:**
```bash
python scripts/db_setup.py
```

### Port Already in Use

**Backend (8000):**
```bash
# Find and kill process on port 8000
# Windows: netstat -ano | findstr :8000
# Mac/Linux: lsof -i :8000
```

**Frontend (5173):**
```bash
# Change port in vite.config.js or kill existing process
```

### Missing Dependencies

```bash
# Backend
pip install -r requirements.txt

# Frontend
rm -rf node_modules package-lock.json
npm install
```

## Project Features

- **User Management:** Customer, Manager, and Admin roles
- **Facility Management:** Create and manage sports facilities
- **Court Booking:** Real-time availability and booking system
- **Payment Integration:** PayPal payment processing
- **Reviews & Ratings:** Facility review system
- **Admin Dashboard:** Facility suspension, commission adjustments
- **Email MFA:** Mailtrap integration for development
- **Session Authentication:** Secure session-based auth with django-axes

## Tech Stack

### Backend
- Django 5.2.6
- Django REST Framework
- PostgreSQL
- PayPal SDK
- django-axes (login attempt tracking)

### Frontend
- React 18
- Vite
- React Router
- Axios
- Tailwind CSS (if applicable)

## Contributing

1. Create a feature branch: `git checkout -b feature/my-feature`
2. Make your changes
3. Run tests: `python manage.py test`
4. Commit changes: `git commit -m "Add my feature"`
5. Push to branch: `git push origin feature/my-feature`
6. Create a Pull Request
