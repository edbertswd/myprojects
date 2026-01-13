#!/usr/bin/env python
"""
Cross-platform database restore script for CourtConnect.

This script restores a PostgreSQL database from a SQL dump file.

Usage:
    python scripts/db_restore.py --input dump.sql       # Restore from dump
    python scripts/db_restore.py --sample-data          # Restore sample data
    python scripts/db_restore.py --schema-only          # Restore schema only
    python scripts/db_restore.py --help                 # Show help
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


def print_banner(text):
    """Print a formatted banner."""
    print("\n" + "=" * 70)
    print(f"  {text}")
    print("=" * 70 + "\n")


def check_psql():
    """Check if psql is installed."""
    try:
        result = subprocess.run(
            ['psql', '--version'],
            capture_output=True,
            text=True,
            check=False
        )
        if result.returncode == 0:
            print(f"✓ psql found: {result.stdout.strip()}")
            return True
        else:
            print("✗ psql not found in PATH")
            return False
    except FileNotFoundError:
        print("✗ psql not found in PATH")
        print("\nPlease install PostgreSQL client tools:")
        print("  - Windows: https://www.postgresql.org/download/windows/")
        print("  - Mac: brew install postgresql")
        print("  - Linux: sudo apt install postgresql-client")
        return False


def confirm_restore():
    """Ask user to confirm the restore operation."""
    print("\n⚠️  WARNING: This will DROP all existing tables and data!")
    print("This operation cannot be undone.\n")

    response = input("Are you sure you want to continue? (yes/no): ").strip().lower()

    if response in ['yes', 'y']:
        return True
    else:
        print("\n✗ Restore cancelled by user")
        return False


def restore_database(input_path):
    """Restore the database from a SQL file."""
    if not input_path.exists():
        print(f"✗ File not found: {input_path}")
        return False

    db_name = settings.DATABASES['default']['NAME']
    db_user = settings.DATABASES['default']['USER']
    db_password = settings.DATABASES['default']['PASSWORD']
    db_host = settings.DATABASES['default']['HOST']
    db_port = settings.DATABASES['default']['PORT']

    # Get file size
    size = input_path.stat().st_size
    size_mb = size / (1024 * 1024)

    print(f"Restoring database '{db_name}' from: {input_path}")
    print(f"File size: {size_mb:.2f} MB ({size:,} bytes)")

    # Set PGPASSWORD environment variable for authentication
    env = os.environ.copy()
    env['PGPASSWORD'] = db_password

    # Build psql command
    cmd = [
        'psql',
        '-h', db_host,
        '-p', str(db_port),
        '-U', db_user,
        '-d', db_name,
        '-f', str(input_path)
    ]

    try:
        print("\nRestoring... (this may take a moment)")

        result = subprocess.run(
            cmd,
            env=env,
            capture_output=True,
            text=True,
            check=False
        )

        # psql may output warnings to stderr even on success
        # Check for actual errors
        if result.returncode == 0:
            print(f"✓ Database restored successfully")

            # Show any warnings if present
            if result.stderr:
                warnings = [line for line in result.stderr.split('\n')
                           if line.strip() and not line.startswith('SET')]
                if warnings:
                    print("\nWarnings:")
                    for warning in warnings[:10]:  # Show first 10 warnings
                        print(f"  {warning}")

            return True
        else:
            print(f"✗ Restore failed:")
            print(result.stderr)
            return False

    except Exception as e:
        print(f"✗ Error during restore: {e}")
        return False


def main():
    """Main restore function."""
    parser = argparse.ArgumentParser(
        description='Restore CourtConnect database from SQL dump',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Restore from a specific dump file
  python scripts/db_restore.py --input database/dumps/dump_20240101.sql

  # Restore sample data
  python scripts/db_restore.py --sample-data

  # Restore schema only (no sample data)
  python scripts/db_restore.py --schema-only

WARNING: This will DROP all existing data in the database!
        """
    )

    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument(
        '--input', '-i',
        type=str,
        help='Path to SQL dump file to restore'
    )
    group.add_argument(
        '--sample-data',
        action='store_true',
        help='Restore from database/sample_data.sql'
    )
    group.add_argument(
        '--schema-only',
        action='store_true',
        help='Restore from database/schema_only.sql'
    )

    parser.add_argument(
        '--yes', '-y',
        action='store_true',
        help='Skip confirmation prompt'
    )

    args = parser.parse_args()

    print_banner("CourtConnect Database Restore")

    # Check psql is available
    if not check_psql():
        return False

    # Determine input path
    if args.input:
        input_path = Path(args.input)
    elif args.sample_data:
        input_path = BACKEND_DIR / 'database' / 'sample_data.sql'
    elif args.schema_only:
        input_path = BACKEND_DIR / 'database' / 'schema_only.sql'

    # Confirm restore operation
    if not args.yes:
        if not confirm_restore():
            return False

    # Perform restore
    success = restore_database(input_path)

    if success:
        print("\n" + "=" * 70)
        print("  ✓ Restore Complete!")
        print("=" * 70)
        print("\nNext steps:")
        print("  1. Verify the data: python manage.py dbshell")
        print("  2. Run migrations if needed: python manage.py migrate")
        print("  3. Start the server: python manage.py runserver")
        print()
    else:
        print("\n✗ Restore failed. Please check the errors above.")

    return success


if __name__ == '__main__':
    success = main()
    sys.exit(0 if success else 1)
