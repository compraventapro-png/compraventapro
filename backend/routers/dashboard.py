# =============================================================
#  routers/dashboard.py — Resumen / KPIs + ventas por día
# =============================================================
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import datetime, timezone, timedelta

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


@router.get("/ventas-semana")
def ventas_por_semana(db: Session = Depends(get_db), _=Depends(get_current_user)):
    """Retorna ventas totales de los últimos 7 días para graficar."""
    hoy = datetime.now(timezone.utc).date()
    resultado = []
    for i in range(6, -1, -1):
        dia = hoy - timedelta(days=i)
        inicio = datetime(dia.year, dia.month, dia.day, tzinfo=timezone.utc)
        fin    = inicio + timedelta(days=1)
        ventas_dia = (
            db.query(models.Venta)
            .filter(models.Venta.creado_en >= inicio, models.Venta.creado_en < fin)
            .all()
        )
        resultado.append({
            "fecha": dia.strftime("%d/%m"),
            "total": round(sum(v.total for v in ventas_dia), 2),
            "cantidad": len(ventas_dia),
        })
    return resultado

