#!/bin/sh

# Wait for Postgres to be ready
echo "Waiting for Postgres at $DB_HOST:$DB_PORT..."
while ! nc -z "$DB_HOST" "$DB_PORT"; do
  sleep 1
done
echo "Postgres is ready."

# Start FastAPI
exec uvicorn main:app --host 0.0.0.0 --port 8000