#!/usr/bin/env python
"""
Cross-platform database setup script for CourtConnect.

This script:
1. Checks PostgreSQL connection
2. Creates the database if it doesn't exist
3. Runs Django migrations
4. Optionally loads sample data from SQL dump

Usage:
    python scripts/db_setup.py                    # Setup with empty database
    python scripts/db_setup.py --with-sample-data # Setup with sample data
    python scripts/db_setup.py --help             # Show help
"""

import os
import sys
import subprocess
import argparse
from pathlib import Path

# Add the backend directory to Python path
BACKEND_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND_DIR))

# Set up Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

import django
django.setup()

from django.conf import settings
from django.core.management import call_command
from django.db import connection
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT


def print_banner(text):
    """Print a formatted banner."""
    print("\n" + "=" * 70)
    print(f"  {text}")
    print("=" * 70 + "\n")


def check_postgresql_installed():
    """Check if PostgreSQL client tools are installed."""
    try:
        result = subprocess.run(
            ['psql', '--version'],
            capture_output=True,
            text=True,
            check=False
        )
        if result.returncode == 0:
            print(f"✓ PostgreSQL client found: {result.stdout.strip()}")
            return True
        else:
            print("✗ PostgreSQL client (psql) not found in PATH")
            return False
    except FileNotFoundError:
        print("✗ PostgreSQL client (psql) not found in PATH")
        print("\nPlease install PostgreSQL:")
        print("  - Windows: https://www.postgresql.org/download/windows/")
        print("  - Mac: brew install postgresql")
        print("  - Linux: sudo apt install postgresql-client")
        return False


def check_env_file():
    """Check if .env file exists."""
    env_path = BACKEND_DIR / '.env'
    if not env_path.exists():
        print("✗ .env file not found!")
        print(f"\nPlease create a .env file at: {env_path}")
        print("You can copy from .env.example:")
        print(f"  cp {BACKEND_DIR / '.env.example'} {env_path}")
        return False
    print(f"✓ .env file found at: {env_path}")
    return True


def create_database():
    """Create the PostgreSQL database if it doesn't exist."""
    db_name = settings.DATABASES['default']['NAME']
    db_user = settings.DATABASES['default']['USER']
    db_password = settings.DATABASES['default']['PASSWORD']
    db_host = settings.DATABASES['default']['HOST']
    db_port = settings.DATABASES['default']['PORT']

    print(f"Checking database '{db_name}'...")

    try:
        # Connect to PostgreSQL server (not to a specific database)
        conn = psycopg2.connect(
            dbname='postgres',
            user=db_user,
            password=db_password,
            host=db_host,
            port=db_port
        )
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cursor = conn.cursor()

        # Check if database exists
        cursor.execute(
            "SELECT 1 FROM pg_database WHERE datname = %s",
            (db_name,)
        )
        exists = cursor.fetchone()

        if exists:
            print(f"✓ Database '{db_name}' already exists")
        else:
            print(f"Creating database '{db_name}'...")
            cursor.execute(f'CREATE DATABASE {db_name}')
            print(f"✓ Database '{db_name}' created successfully")

        cursor.close()
        conn.close()
        return True

    except psycopg2.Error as e:
        print(f"✗ Database creation failed: {e}")
        print("\nPlease check:")
        print("  1. PostgreSQL server is running")
        print("  2. Database credentials in .env are correct")
        print("  3. User has permission to create databases")
        return False


def run_migrations():
    """Run Django migrations."""
    print("Running database migrations...")
    try:
        call_command('migrate', verbosity=1)
        print("✓ Migrations completed successfully")
        return True
    except Exception as e:
        print(f"✗ Migration failed: {e}")
        return False


def load_sample_data():
    """Load sample data from SQL dump."""
    sample_data_path = BACKEND_DIR / 'database' / 'sample_data.sql'

    if not sample_data_path.exists():
        print(f"✗ Sample data file not found at: {sample_data_path}")
        print("Skipping sample data load.")
        return False

    print(f"Loading sample data from: {sample_data_path}")

    db_name = settings.DATABASES['default']['NAME']
    db_user = settings.DATABASES['default']['USER']
    db_password = settings.DATABASES['default']['PASSWORD']
    db_host = settings.DATABASES['default']['HOST']
    db_port = settings.DATABASES['default']['PORT']

    # Set PGPASSWORD environment variable for authentication
    env = os.environ.copy()
    env['PGPASSWORD'] = db_password

    try:
        # Use psql to execute the SQL dump
        cmd = [
            'psql',
            '-h', db_host,
            '-p', str(db_port),
            '-U', db_user,
            '-d', db_name,
            '-f', str(sample_data_path)
        ]

        result = subprocess.run(
            cmd,
            env=env,
            capture_output=True,
            text=True,
            check=False
        )

        if result.returncode == 0:
            print("✓ Sample data loaded successfully")
            return True
        else:
            print(f"✗ Failed to load sample data:")
            print(result.stderr)
            return False

    except Exception as e:
        print(f"✗ Error loading sample data: {e}")
        return False


def main():
    """Main setup function."""
    parser = argparse.ArgumentParser(
        description='Initialize CourtConnect database',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python scripts/db_setup.py                    # Empty database
  python scripts/db_setup.py --with-sample-data # With sample data
        """
    )
    parser.add_argument(
        '--with-sample-data',
        action='store_true',
        help='Load sample data after running migrations'
    )
    args = parser.parse_args()

    print_banner("CourtConnect Database Setup")

    # Step 1: Check prerequisites
    print_banner("Step 1: Checking Prerequisites")
    if not check_postgresql_installed():
        return False
    if not check_env_file():
        return False

    # Step 2: Create database
    print_banner("Step 2: Database Creation")
    if not create_database():
        return False

    # Step 3: Run migrations
    print_banner("Step 3: Running Migrations")
    if not run_migrations():
        return False

    # Step 4: Load sample data (optional)
    if args.with_sample_data:
        print_banner("Step 4: Loading Sample Data")
        load_sample_data()

    # Success!
    print_banner("✓ Database Setup Complete!")
    print("Next steps:")
    print("  1. Start the Django server: python manage.py runserver")
    print("  2. Create a superuser: python manage.py createsuperuser")
    print("  3. Access admin panel: http://localhost:8000/admin")
    print()

    return True


if __name__ == '__main__':
    success = main()
    sys.exit(0 if success else 1)
