# Test Coverage Guide

This document explains how to run and generate test coverage reports for the Django backend.

## Prerequisites

- Python virtual environment activated
- All dependencies installed: `pip install -r requirements.txt`
- Coverage.py is already included in requirements.txt (v7.11.0)

## Quick Start

### Option 1: Using the Script (Windows)

Simply run the batch script from the backend directory:

```bash
run_coverage.bat
```

This will:
1. Run all tests with coverage tracking
2. Generate a terminal coverage report
3. Generate an HTML coverage report in `htmlcov/`

### Option 2: Manual Commands

#### Run tests with coverage:
coverage run --source=app manage.py test
```

#### View coverage report in terminal:
```bash
coverage report -m
```

The `-m` flag shows which lines are missing coverage.

#### Generate HTML coverage report:
```bash
coverage html
```

Then open `htmlcov/index.html` in your browser for an interactive report.

## Coverage Configuration

Coverage settings are configured in `.coveragerc`:

- **Source**: Only tracks coverage for the `app/` directory
- **Omitted files**:
  - Migrations (`*/migrations/*`)
  - Test files (`*/tests/*`, `*/tests.py`)
  - Init files (`*/__init__.py`)
  - Virtual environment files
  - Django config files (ASGI, WSGI, manage.py)

## Understanding Coverage Reports

### Terminal Report Format:
```
Name                                    Stmts   Miss  Cover   Missing
---------------------------------------------------------------------
app/auth/models.py                        45      5    89%   23-27
app/bookings/views.py                    120     15    87%   45, 67-81
---------------------------------------------------------------------
TOTAL                                   1250    125    90%
```

- **Stmts**: Total number of statements
- **Miss**: Number of statements not covered by tests
- **Cover**: Percentage of code covered
- **Missing**: Line numbers of uncovered code

### HTML Report:
- Green highlighting: Covered lines
- Red highlighting: Uncovered lines
- Click on filenames to see detailed line-by-line coverage

## Running Specific Tests

To get coverage for a specific app:
```bash
coverage run --source=app manage.py test app.auth
```

To get coverage for a specific test file:
```bash
coverage run --source=app manage.py test app.admindashboard.tests.test_analytics_dashboard
```

## Coverage Best Practices

1. **Run coverage before committing** to ensure new code is tested
2. **Aim for 80%+ coverage** for critical business logic
3. **Focus on testing**:
   - API endpoints (all views)
   - Business logic (models, utilities)
   - Permission checks
   - Data validation

4. **Lower priority for coverage**:
   - Django migrations
   - Configuration files
   - Simple getters/setters

## Cleaning Up Coverage Data

To remove old coverage data and start fresh:
```bash
coverage erase
```

## Troubleshooting

**Issue**: "coverage: command not found"
- **Solution**: Ensure your virtual environment is activated: `venv\Scripts\activate` (Windows) or `source venv/bin/activate` (Unix)

**Issue**: Coverage shows 0% for everything
- **Solution**: Make sure you're running tests with `coverage run` not just `python manage.py test`

**Issue**: htmlcov folder not created
- **Solution**: Run `coverage html` after running tests with `coverage run`

## CI/CD Integration

To integrate with CI/CD pipelines, you can generate XML reports:
```bash
coverage xml
```

This creates `coverage.xml` which can be used with tools like CodeCov, Coveralls, or SonarQube.

## Current Test Coverage

The backend currently has tests for:
- Admin Dashboard (analytics, moderation, refunds)
- Authentication
- Bookings
- Facilities
- Managers
- Payments
- Users

Run coverage to see the current coverage percentage for each module!
