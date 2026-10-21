# =============================================================
#  routers/ventas.py — Transacción de Venta (salida stock)
# =============================================================
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

import models, schemas
from database import get_db
from auth.security import get_current_user

router = APIRouter(prefix="/api/v1/ventas", tags=["Ventas"])


@router.get("/", response_model=List[schemas.VentaOut])
def listar_ventas(db: Session = Depends(get_db), _=Depends(get_current_user)):
    return (
        db.query(models.Venta)
        .order_by(models.Venta.creado_en.desc())
        .all()
    )


@router.get("/{venta_id}", response_model=schemas.VentaOut)
def obtener_venta(venta_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    venta = db.query(models.Venta).filter(models.Venta.id == venta_id).first()
    if not venta:
        raise HTTPException(status_code=404, detail="Venta no encontrada")
    return venta


@router.post("/checkout", response_model=schemas.VentaOut, status_code=status.HTTP_201_CREATED)
def checkout_venta(data: schemas.VentaCreate, db: Session = Depends(get_db), _=Depends(get_current_user)):
    """
    Registra una venta de forma ATÓMICA:
    1. Valida stock de cada producto.
    2. Descuenta stock.
    3. Persiste cabecera + detalle.
    4. Hace rollback completo si algo falla.
    """
    if not data.items:
        raise HTTPException(status_code=400, detail="La venta no contiene productos")

    total    = 0.0
    detalles = []

    try:
        for item in data.items:
            producto = db.query(models.Producto).filter(models.Producto.id == item.producto_id).first()

            if not producto or not producto.activo:
                raise HTTPException(
                    status_code=404,
                    detail=f"Producto ID {item.producto_id} no encontrado o inactivo",
                )
            if producto.stock_actual < item.cantidad:
                raise HTTPException(
                    status_code=400,
                    detail=(
                        f"Stock insuficiente para '{producto.nombre}'. "
                        f"Solicitado: {item.cantidad}, Disponible: {producto.stock_actual}"
                    ),
                )

            subtotal = producto.precio_venta * item.cantidad
            total   += subtotal

            # Descontar stock
            producto.stock_actual -= item.cantidad

            detalles.append({
                "producto_id": producto.id,
                "cantidad":    item.cantidad,
                "precio_unit": producto.precio_venta,
                "subtotal":    subtotal,
            })

        # Cabecera de venta
        venta = models.Venta(
            cliente_id  = data.cliente_id,
            total       = total,
            observacion = data.observacion,
        )
        db.add(venta)
        db.flush()  # obtiene venta.id

        for d in detalles:
            db.add(models.DetalleVenta(venta_id=venta.id, **d))

        db.commit()
        db.refresh(venta)
        return venta

    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error en la transacción: {str(e)}")
