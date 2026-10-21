# =============================================================
#  database.py — Conexión SQLAlchemy → Supabase PostgreSQL
# =============================================================
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise ValueError("DATABASE_URL no está definida en el archivo .env")

# Supabase requiere SSL; pool_pre_ping detecta conexiones caídas
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    connect_args={"sslmode": "require"},
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


# Dependencia de inyección para los endpoints
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
