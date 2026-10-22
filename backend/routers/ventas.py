# =============================================================
#  routers/ventas.py — Transacción de Venta (salida stock)
# =============================================================
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

import models, schemas
from database import get_db
from auth.security import get_current_user, require_admin

router = APIRouter(prefix="/api/v1/ventas", tags=["Ventas"])


@router.get("/", response_model=List[schemas.VentaOut])
def listar_ventas(db: Session = Depends(get_db), _=Depends(get_current_user)):
    return (
        db.query(models.Venta)
        .order_by(models.Venta.creado_en.desc())
        .all()
    )


@router.delete("/{venta_id}", status_code=status.HTTP_204_NO_CONTENT)
def anular_o_eliminar_venta(
    venta_id: int, 
    db: Session = Depends(get_db), 
    _=Depends(require_admin)
):
    """
    Anula/elimina una venta y reingresa el stock de los productos vendidos.
    """
    venta = db.query(models.Venta).filter(models.Venta.id == venta_id).first()
    if not venta:
        raise HTTPException(status_code=404, detail="Venta no encontrada")
    
    # Reponer stock de los productos asociados
    for det in venta.detalles:
        prod = db.query(models.Producto).filter(models.Producto.id == det.producto_id).first()
        if prod:
            prod.stock_actual += det.cantidad

    # Eliminar detalles y la venta
    db.query(models.DetalleVenta).filter(models.DetalleVenta.venta_id == venta_id).delete()
    db.delete(venta)
    db.commit()
    return None


@router.get("/{venta_id}", response_model=schemas.VentaOut)
def obtener_venta(venta_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    venta = db.query(models.Venta).filter(models.Venta.id == venta_id).first()
    if not venta:
        raise HTTPException(status_code=404, detail="Venta no encontrada")
    return venta


@router.post("/checkout", response_model=schemas.VentaOut, status_code=status.HTTP_201_CREATED)
def checkout_venta(
    data: schemas.VentaCreate, 
    db: Session = Depends(get_db), 
    current_user: models.Usuario = Depends(get_current_user)
):
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

        # Obtener rol como string limpio
        rol_str = current_user.rol.value if hasattr(current_user.rol, 'value') else str(current_user.rol)

        # Cabecera de venta
        venta = models.Venta(
            cliente_id     = data.cliente_id,
            usuario_id     = current_user.id,
            usuario_nombre = current_user.nombre or current_user.email,
            usuario_rol    = rol_str,
            total          = total,
            observacion    = data.observacion,
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
