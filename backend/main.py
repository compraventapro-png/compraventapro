# =============================================================
#  main.py — Punto de entrada FastAPI
# =============================================================
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

import models
from database import engine

# Importar routers
from routers import auth, productos, proveedores, clientes, compras, ventas, dashboard

load_dotenv()

# ─── Crear tablas en Supabase (solo si no existen) ───────────
models.Base.metadata.create_all(bind=engine)

# ─── App ─────────────────────────────────────────────────────
app = FastAPI(
    title       = "API Compra-Venta e Inventario",
    description = "Backend MVP con FastAPI + Supabase PostgreSQL",
    version     = "1.0.0",
    docs_url    = "/docs",
    redoc_url   = "/redoc",
)

# ─── CORS ────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Registrar routers ───────────────────────────────────────
app.include_router(auth.router)
app.include_router(productos.router)
app.include_router(proveedores.router)
app.include_router(clientes.router)
app.include_router(compras.router)
app.include_router(ventas.router)
app.include_router(dashboard.router)


# ─── Health check ────────────────────────────────────────────
@app.get("/", tags=["Health"])
def root():
    return {"status": "ok", "mensaje": "API Compra-Venta e Inventario activa ✅"}
