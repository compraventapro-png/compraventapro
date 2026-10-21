# =============================================================
#  routers/usuarios.py — Gestión de Usuarios (solo admin)
# =============================================================
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

import models, schemas
from database import get_db
from auth.security import get_current_user, hash_password

router = APIRouter(prefix="/api/v1/usuarios", tags=["Usuarios"])


def require_admin(current=Depends(get_current_user)):
    if current.rol != "admin":
        raise HTTPException(status_code=403, detail="Solo el administrador puede realizar esta acción")
    return current


@router.get("/", response_model=List[schemas.UsuarioOut])
def listar_usuarios(db: Session = Depends(get_db), _=Depends(require_admin)):
    return db.query(models.Usuario).order_by(models.Usuario.creado_en.desc()).all()


@router.post("/", response_model=schemas.UsuarioOut, status_code=status.HTTP_201_CREATED)
def crear_usuario(data: schemas.UsuarioCreate, db: Session = Depends(get_db), _=Depends(require_admin)):
    if db.query(models.Usuario).filter(models.Usuario.email == data.email).first():
        raise HTTPException(status_code=400, detail="El email ya está registrado")
    usuario = models.Usuario(
        nombre=data.nombre,
        email=data.email,
        password_hash=hash_password(data.password),
        rol=data.rol,
    )
    db.add(usuario)
    db.commit()
    db.refresh(usuario)
    return usuario


@router.patch("/{usuario_id}/toggle", response_model=schemas.UsuarioOut)
def toggle_usuario(usuario_id: int, db: Session = Depends(get_db), current=Depends(require_admin)):
    usuario = db.query(models.Usuario).filter(models.Usuario.id == usuario_id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    if usuario.id == current.id:
        raise HTTPException(status_code=400, detail="No puedes desactivarte a ti mismo")
    usuario.activo = not usuario.activo
    db.commit()
    db.refresh(usuario)
    return usuario
