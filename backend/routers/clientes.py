# =============================================================
#  routers/clientes.py — CRUD Clientes
# =============================================================
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

import models, schemas
from database import get_db
from auth.security import get_current_user

router = APIRouter(prefix="/api/v1/clientes", tags=["Clientes"])


@router.get("/", response_model=List[schemas.ClienteOut])
def listar_clientes(db: Session = Depends(get_db), _=Depends(get_current_user)):
    return db.query(models.Cliente).order_by(models.Cliente.nombre_razon).all()


@router.get("/{cliente_id}", response_model=schemas.ClienteOut)
def obtener_cliente(cliente_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    c = db.query(models.Cliente).filter(models.Cliente.id == cliente_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    return c


@router.post("/", response_model=schemas.ClienteOut, status_code=status.HTTP_201_CREATED)
def crear_cliente(data: schemas.ClienteCreate, db: Session = Depends(get_db), _=Depends(get_current_user)):
    cliente = models.Cliente(**data.model_dump())
    db.add(cliente)
    db.commit()
    db.refresh(cliente)
    return cliente


@router.put("/{cliente_id}", response_model=schemas.ClienteOut)
def actualizar_cliente(
    cliente_id: int,
    data: schemas.ClienteCreate,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    cliente = db.query(models.Cliente).filter(models.Cliente.id == cliente_id).first()
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    for campo, valor in data.model_dump(exclude_unset=True).items():
        setattr(cliente, campo, valor)
    db.commit()
    db.refresh(cliente)
    return cliente


@router.delete("/{cliente_id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_cliente(cliente_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    cliente = db.query(models.Cliente).filter(models.Cliente.id == cliente_id).first()
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    db.delete(cliente)
    db.commit()
