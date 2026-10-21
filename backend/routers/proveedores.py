# =============================================================
#  routers/proveedores.py — CRUD Proveedores
# =============================================================
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

import models, schemas
from database import get_db
from auth.security import get_current_user

router = APIRouter(prefix="/api/v1/proveedores", tags=["Proveedores"])


@router.get("/", response_model=List[schemas.ProveedorOut])
def listar_proveedores(db: Session = Depends(get_db), _=Depends(get_current_user)):
    return db.query(models.Proveedor).order_by(models.Proveedor.nombre_razon).all()


@router.get("/{proveedor_id}", response_model=schemas.ProveedorOut)
def obtener_proveedor(proveedor_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    p = db.query(models.Proveedor).filter(models.Proveedor.id == proveedor_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Proveedor no encontrado")
    return p


@router.post("/", response_model=schemas.ProveedorOut, status_code=status.HTTP_201_CREATED)
def crear_proveedor(data: schemas.ProveedorCreate, db: Session = Depends(get_db), _=Depends(get_current_user)):
    proveedor = models.Proveedor(**data.model_dump())
    db.add(proveedor)
    db.commit()
    db.refresh(proveedor)
    return proveedor


@router.put("/{proveedor_id}", response_model=schemas.ProveedorOut)
def actualizar_proveedor(
    proveedor_id: int,
    data: schemas.ProveedorCreate,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    proveedor = db.query(models.Proveedor).filter(models.Proveedor.id == proveedor_id).first()
    if not proveedor:
        raise HTTPException(status_code=404, detail="Proveedor no encontrado")
    for campo, valor in data.model_dump(exclude_unset=True).items():
        setattr(proveedor, campo, valor)
    db.commit()
    db.refresh(proveedor)
    return proveedor


@router.delete("/{proveedor_id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_proveedor(proveedor_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    proveedor = db.query(models.Proveedor).filter(models.Proveedor.id == proveedor_id).first()
    if not proveedor:
        raise HTTPException(status_code=404, detail="Proveedor no encontrado")
    db.delete(proveedor)
    db.commit()
