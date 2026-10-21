# =============================================================
#  routers/auth.py — Registro y Login
# =============================================================
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

import models, schemas
from database import get_db
from auth.security import hash_password, verify_password, create_access_token

router = APIRouter(prefix="/api/v1/auth", tags=["Autenticación"])


@router.post("/register", response_model=schemas.UsuarioOut, status_code=status.HTTP_201_CREATED)
def registrar_usuario(data: schemas.UsuarioCreate, db: Session = Depends(get_db)):
    if db.query(models.Usuario).filter(models.Usuario.email == data.email).first():
        raise HTTPException(status_code=400, detail="El email ya está registrado")

    usuario = models.Usuario(
        nombre        = data.nombre,
        email         = data.email,
        password_hash = hash_password(data.password),
        rol           = data.rol,
    )
    db.add(usuario)
    db.commit()
    db.refresh(usuario)
    return usuario


@router.post("/login", response_model=schemas.TokenOut)
def login(data: schemas.LoginRequest, db: Session = Depends(get_db)):
    usuario = db.query(models.Usuario).filter(models.Usuario.email == data.email).first()
    if not usuario or not verify_password(data.password, usuario.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales incorrectas",
        )
    if not usuario.activo:
        raise HTTPException(status_code=403, detail="Cuenta desactivada")

    token = create_access_token({"sub": usuario.email, "rol": usuario.rol})
    return {"access_token": token, "token_type": "bearer", "usuario": usuario}
