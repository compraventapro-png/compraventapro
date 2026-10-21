# Compra-Venta e Inventario MVP

Full-stack MVP de sistema de Compra-Venta e Inventario construido con:
- **Backend**: FastAPI + SQLAlchemy + Supabase (PostgreSQL)
- **Frontend**: React + Vite + Tailwind CSS *(próximo paso)*

## Estructura del Proyecto

```
Compra venta-proyect/
├── backend/
│   ├── .env                  ← Variables de entorno (NO subir a Git)
│   ├── .env.example          ← Plantilla de variables
│   ├── requirements.txt
│   ├── main.py               ← Entrada FastAPI
│   ├── database.py           ← Conexión SQLAlchemy → Supabase
│   ├── models.py             ← Tablas ORM (7 tablas)
│   ├── schemas.py            ← Validación Pydantic
│   ├── auth/
│   │   └── security.py       ← JWT + bcrypt
│   └── routers/
│       ├── auth.py           ← /api/v1/auth/register, /login
│       ├── productos.py      ← /api/v1/productos  (CRUD)
│       ├── proveedores.py    ← /api/v1/proveedores (CRUD)
│       ├── clientes.py       ← /api/v1/clientes   (CRUD)
│       ├── compras.py        ← /api/v1/compras    (entrada stock)
│       ├── ventas.py         ← /api/v1/ventas/checkout (salida stock)
│       └── dashboard.py      ← /api/v1/dashboard/resumen
└── frontend/                 ← React + Vite (próximo paso)
```

## Instalación y ejecución local

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
pip install -r requirements.txt
# Copiar .env.example → .env y completar DATABASE_URL
uvicorn main:app --reload --port 8000
```

Swagger UI: [http://localhost:8000/docs](http://localhost:8000/docs)

## Endpoints principales

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/v1/auth/register` | Registro de usuario |
| POST | `/api/v1/auth/login` | Login → JWT |
| GET/POST | `/api/v1/productos` | Listado / Crear producto |
| GET | `/api/v1/productos/stock-bajo` | Alertas de stock mínimo |
| POST | `/api/v1/compras` | Registrar compra (suma stock) |
| POST | `/api/v1/ventas/checkout` | Registrar venta (resta stock atómico) |
| GET | `/api/v1/dashboard/resumen` | KPIs del día |
