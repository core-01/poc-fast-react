#!/bin/bash
set -e

echo "🚀 Starting FastAPI Dashboard Backend..."
echo "📡 Database: $DATABASE_URL"

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for database connection..."
python -c "
import time, sys
from sqlalchemy import create_engine, text
import os

url = os.environ.get('DATABASE_URL', '')
for i in range(30):
    try:
        engine = create_engine(url)
        with engine.connect() as conn:
            conn.execute(text('SELECT 1'))
        print('✅ Database is ready!')
        sys.exit(0)
    except Exception as e:
        print(f'   Attempt {i+1}/30 failed: {e}')
        time.sleep(2)
print('❌ Database not ready after 30 attempts')
sys.exit(1)
"

# Run seed if DB is empty
echo "🌱 Checking if seeding is needed..."
python -c "
from app.db.database import SessionLocal, engine, Base
import app.models.models as M
from app.models.models import User

Base.metadata.create_all(bind=engine)

db = SessionLocal()
count = db.query(User).count()
db.close()

if count == 0:
    print('📦 Database is empty — running seed...')
    import subprocess, sys
    result = subprocess.run([sys.executable, 'seed.py'], capture_output=True, text=True)
    print(result.stdout)
    if result.returncode != 0:
        print('Seed error:', result.stderr)
else:
    print(f'✅ Database already has {count} users — skipping seed.')
"

echo "🌐 Starting Uvicorn server on port 8000..."
exec uvicorn main:app --host 0.0.0.0 --port 8000 --reload
