#!/usr/bin/env python
"""
Cross-platform database dump script for CourtConnect.

This script exports the PostgreSQL database to a SQL dump file.

Usage:
    python scripts/db_dump.py                        # Dump with timestamp
    python scripts/db_dump.py --output custom.sql    # Custom filename
    python scripts/db_dump.py --schema-only          # Schema only (no data)
    python scripts/db_dump.py --help                 # Show help
"""

import os
import sys
import subprocess
import argparse
from datetime import datetime
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


def check_pg_dump():
    """Check if pg_dump is installed."""
    try:
        result = subprocess.run(
            ['pg_dump', '--version'],
            capture_output=True,
            text=True,
            check=False
        )
        if result.returncode == 0:
            print(f"✓ pg_dump found: {result.stdout.strip()}")
            return True
        else:
            print("✗ pg_dump not found in PATH")
            return False
    except FileNotFoundError:
        print("✗ pg_dump not found in PATH")
        print("\nPlease install PostgreSQL client tools:")
        print("  - Windows: https://www.postgresql.org/download/windows/")
        print("  - Mac: brew install postgresql")
        print("  - Linux: sudo apt install postgresql-client")
        return False


def dump_database(output_path, schema_only=False):
    """Dump the database to a SQL file."""
    db_name = settings.DATABASES['default']['NAME']
    db_user = settings.DATABASES['default']['USER']
    db_password = settings.DATABASES['default']['PASSWORD']
    db_host = settings.DATABASES['default']['HOST']
    db_port = settings.DATABASES['default']['PORT']

    print(f"Dumping database '{db_name}' to: {output_path}")

    # Set PGPASSWORD environment variable for authentication
    env = os.environ.copy()
    env['PGPASSWORD'] = db_password

    # Build pg_dump command
    cmd = [
        'pg_dump',
        '-h', db_host,
        '-p', str(db_port),
        '-U', db_user,
        '-d', db_name,
        '--clean',  # Add DROP statements before CREATE
        '--if-exists',  # Use IF EXISTS with DROP statements
        '-f', str(output_path)
    ]

    # Add schema-only flag if requested
    if schema_only:
        cmd.append('--schema-only')
        print("Mode: Schema only (no data)")
    else:
        print("Mode: Full dump (schema + data)")

    try:
        result = subprocess.run(
            cmd,
            env=env,
            capture_output=True,
            text=True,
            check=False
        )

        if result.returncode == 0:
            # Get file size
            size = output_path.stat().st_size
            size_mb = size / (1024 * 1024)

            print(f"✓ Database dumped successfully")
            print(f"  File: {output_path}")
            print(f"  Size: {size_mb:.2f} MB ({size:,} bytes)")
            return True
        else:
            print(f"✗ pg_dump failed:")
            print(result.stderr)
            return False

    except Exception as e:
        print(f"✗ Error during dump: {e}")
        return False


def main():
    """Main dump function."""
    parser = argparse.ArgumentParser(
        description='Dump CourtConnect database to SQL file',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python scripts/db_dump.py                        # Timestamped dump
  python scripts/db_dump.py --output backup.sql    # Custom filename
  python scripts/db_dump.py --schema-only          # Schema without data

The dump file can be used to restore the database using db_restore.py
or shared with team members for reproducibility.
        """
    )
    parser.add_argument(
        '--output', '-o',
        type=str,
        help='Output file path (default: database/dumps/dump_TIMESTAMP.sql)'
    )
    parser.add_argument(
        '--schema-only',
        action='store_true',
        help='Dump schema only without data'
    )
    args = parser.parse_args()

    print_banner("CourtConnect Database Dump")

    # Check pg_dump is available
    if not check_pg_dump():
        return False

    # Determine output path
    if args.output:
        output_path = Path(args.output)
    else:
        # Default: timestamped file in dumps directory
        dumps_dir = BACKEND_DIR / 'database' / 'dumps'
        dumps_dir.mkdir(parents=True, exist_ok=True)

        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f"dump_{timestamp}.sql"
        output_path = dumps_dir / filename

    # Ensure parent directory exists
    output_path.parent.mkdir(parents=True, exist_ok=True)

    # Perform dump
    success = dump_database(output_path, schema_only=args.schema_only)

    if success:
        print("\n" + "=" * 70)
        print("  ✓ Dump Complete!")
        print("=" * 70)
        print(f"\nTo restore this dump, run:")
        print(f"  python scripts/db_restore.py --input {output_path}")
        print()
    else:
        print("\n✗ Dump failed. Please check the errors above.")

    return success


if __name__ == '__main__':
    success = main()
    sys.exit(0 if success else 1)
