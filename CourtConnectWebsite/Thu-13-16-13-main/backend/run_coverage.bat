@echo off
REM Django Backend Test Coverage Script
REM Run this script from the backend directory

echo Running tests with coverage...
coverage run --source=app manage.py test --keepdb

if %ERRORLEVEL% NEQ 0 (
    echo Tests failed! Coverage report may be incomplete.
    exit /b %ERRORLEVEL%
)

echo.
echo ===================================
echo Generating coverage report...
echo ===================================
echo.
coverage report -m

echo.
echo ===================================
echo Generating HTML coverage report...
echo ===================================
echo.
coverage html

echo.
echo Coverage reports generated successfully!
echo - Terminal report: See above
echo - HTML report: Open htmlcov\index.html in your browser
echo.
