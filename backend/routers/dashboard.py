# =============================================================
#  routers/dashboard.py — Resumen / KPIs
# =============================================================
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import datetime, timezone

import models, schemas
from database import get_db
from auth.security import get_current_user

router = APIRouter(prefix="/api/v1/dashboard", tags=["Dashboard"])


@router.get("/resumen", response_model=schemas.ResumenDashboard)
def resumen(db: Session = Depends(get_db), _=Depends(get_current_user)):
    hoy = datetime.now(timezone.utc).date()

    total_productos      = db.query(models.Producto).filter(models.Producto.activo == True).count()
    productos_stock_bajo = (
        db.query(models.Producto)
        .filter(models.Producto.stock_actual <= models.Producto.stock_minimo)
        .filter(models.Producto.activo == True)
        .count()
    )

    ventas_hoy = (
        db.query(models.Venta)
        .filter(models.Venta.creado_en >= datetime(hoy.year, hoy.month, hoy.day, tzinfo=timezone.utc))
        .all()
    )
    compras_hoy = (
        db.query(models.Compra)
        .filter(models.Compra.creado_en >= datetime(hoy.year, hoy.month, hoy.day, tzinfo=timezone.utc))
        .all()
    )

    return {
        "total_productos":      total_productos,
        "productos_stock_bajo": productos_stock_bajo,
        "total_ventas_hoy":     sum(v.total for v in ventas_hoy),
        "total_compras_hoy":    sum(c.total for c in compras_hoy),
        "num_ventas_hoy":       len(ventas_hoy),
        "num_compras_hoy":      len(compras_hoy),
    }
