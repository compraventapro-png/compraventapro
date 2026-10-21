# =============================================================
#  routers/compras.py — Registro de Compras (entrada stock)
# =============================================================
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

import models, schemas
from database import get_db
from auth.security import get_current_user

router = APIRouter(prefix="/api/v1/compras", tags=["Compras"])


@router.get("/", response_model=List[schemas.CompraOut])
def listar_compras(db: Session = Depends(get_db), _=Depends(get_current_user)):
    return (
        db.query(models.Compra)
        .order_by(models.Compra.creado_en.desc())
        .all()
    )


@router.get("/{compra_id}", response_model=schemas.CompraOut)
def obtener_compra(compra_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    compra = db.query(models.Compra).filter(models.Compra.id == compra_id).first()
    if not compra:
        raise HTTPException(status_code=404, detail="Compra no encontrada")
    return compra


@router.post("/", response_model=schemas.CompraOut, status_code=status.HTTP_201_CREATED)
def registrar_compra(data: schemas.CompraCreate, db: Session = Depends(get_db), _=Depends(get_current_user)):
    if not data.items:
        raise HTTPException(status_code=400, detail="La compra no tiene ítems")

    total = 0.0
    detalles = []

    try:
        for item in data.items:
            producto = db.query(models.Producto).filter(models.Producto.id == item.producto_id).first()
            if not producto:
                raise HTTPException(status_code=404, detail=f"Producto ID {item.producto_id} no encontrado")

            subtotal = item.precio_unit * item.cantidad
            total   += subtotal

            # Sumar al inventario
            producto.stock_actual += item.cantidad

            detalles.append({
                "producto_id": producto.id,
                "cantidad":    item.cantidad,
                "precio_unit": item.precio_unit,
                "subtotal":    subtotal,
            })

        # Cabecera de compra
        compra = models.Compra(
            proveedor_id = data.proveedor_id,
            total        = total,
            observacion  = data.observacion,
        )
        db.add(compra)
        db.flush()  # obtiene compra.id sin hacer commit aún

        for d in detalles:
            db.add(models.DetalleCompra(compra_id=compra.id, **d))

        db.commit()
        db.refresh(compra)
        return compra

    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error en la compra: {str(e)}")
