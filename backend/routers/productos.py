# =============================================================
#  routers/productos.py — CRUD Inventario
# =============================================================
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

import models, schemas
from database import get_db
from auth.security import get_current_user

router = APIRouter(prefix="/api/v1/productos", tags=["Inventario / Productos"])


@router.get("/", response_model=List[schemas.ProductoOut])
def listar_productos(
    solo_activos: bool = True,
    db: Session = Depends(get_db),
):
    """Listado público de productos (permite consultar catálogo sin token en Swagger y tienda)."""
    q = db.query(models.Producto)
    if solo_activos:
        q = q.filter(models.Producto.activo == True)
    return q.order_by(models.Producto.nombre).all()



@router.get("/stock-bajo", response_model=List[schemas.ProductoOut])
def productos_stock_bajo(db: Session = Depends(get_db), _=Depends(get_current_user)):
    """Retorna productos cuyo stock_actual <= stock_minimo."""
    return (
        db.query(models.Producto)
        .filter(models.Producto.stock_actual <= models.Producto.stock_minimo)
        .filter(models.Producto.activo == True)
        .all()
    )


@router.get("/{producto_id}", response_model=schemas.ProductoOut)
def obtener_producto(producto_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    p = db.query(models.Producto).filter(models.Producto.id == producto_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    return p


@router.post("/", response_model=schemas.ProductoOut, status_code=status.HTTP_201_CREATED)
def crear_producto(data: schemas.ProductoCreate, db: Session = Depends(get_db), _=Depends(get_current_user)):
    if db.query(models.Producto).filter(models.Producto.sku == data.sku).first():
        raise HTTPException(status_code=400, detail="El SKU ya existe")
    producto = models.Producto(**data.model_dump())
    db.add(producto)
    db.commit()
    db.refresh(producto)
    return producto


@router.put("/{producto_id}", response_model=schemas.ProductoOut)
def actualizar_producto(
    producto_id: int,
    data: schemas.ProductoUpdate,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    producto = db.query(models.Producto).filter(models.Producto.id == producto_id).first()
    if not producto:
        raise HTTPException(status_code=404, detail="Producto no encontrado")

    for campo, valor in data.model_dump(exclude_unset=True).items():
        setattr(producto, campo, valor)

    db.commit()
    db.refresh(producto)
    return producto


@router.delete("/{producto_id}", status_code=status.HTTP_204_NO_CONTENT)
def desactivar_producto(producto_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    producto = db.query(models.Producto).filter(models.Producto.id == producto_id).first()
    if not producto:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    producto.activo = False
    db.commit()
