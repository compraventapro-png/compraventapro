# =============================================================
#  models.py — Tablas relacionales (SQLAlchemy ORM)
# =============================================================
from datetime import datetime, timezone
from sqlalchemy import (
    Column, Integer, String, Float, ForeignKey,
    DateTime, Enum as SAEnum, Text, Boolean
)
from sqlalchemy.orm import relationship
import enum
from database import Base


# ─── Enumeraciones ───────────────────────────────────────────
class RolUsuario(str, enum.Enum):
    admin = "admin"
    vendedor = "vendedor"


class TipoMovimiento(str, enum.Enum):
    entrada = "entrada"   # compra
    salida = "salida"     # venta


# ─── Usuarios ────────────────────────────────────────────────
class Usuario(Base):
    __tablename__ = "usuarios"

    id            = Column(Integer, primary_key=True, index=True)
    nombre        = Column(String(100), nullable=False)
    email         = Column(String(150), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    rol           = Column(SAEnum(RolUsuario), default=RolUsuario.vendedor, nullable=False)
    activo        = Column(Boolean, default=True)
    creado_en     = Column(DateTime, default=lambda: datetime.now(timezone.utc))


# ─── Proveedores ─────────────────────────────────────────────
class Proveedor(Base):
    __tablename__ = "proveedores"

    id               = Column(Integer, primary_key=True, index=True)
    nombre_razon     = Column(String(150), nullable=False)
    nit_ci           = Column(String(20), unique=True, index=True)
    telefono         = Column(String(20))
    email            = Column(String(150))
    direccion        = Column(Text)
    creado_en        = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    compras          = relationship("Compra", back_populates="proveedor")


# ─── Clientes ────────────────────────────────────────────────
class Cliente(Base):
    __tablename__ = "clientes"

    id               = Column(Integer, primary_key=True, index=True)
    nombre_razon     = Column(String(150), nullable=False)
    nit_ci           = Column(String(20), unique=True, index=True)
    telefono         = Column(String(20))
    email            = Column(String(150))
    direccion        = Column(Text)
    creado_en        = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    ventas           = relationship("Venta", back_populates="cliente")


# ─── Productos ───────────────────────────────────────────────
class Producto(Base):
    __tablename__ = "productos"

    id             = Column(Integer, primary_key=True, index=True)
    sku            = Column(String(50), unique=True, index=True, nullable=False)
    nombre         = Column(String(150), nullable=False)
    descripcion    = Column(Text)
    precio_compra  = Column(Float, default=0.0, nullable=False)
    precio_venta   = Column(Float, nullable=False)
    stock_actual   = Column(Integer, default=0, nullable=False)
    stock_minimo   = Column(Integer, default=5, nullable=False)
    activo         = Column(Boolean, default=True)
    creado_en      = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    detalle_compras = relationship("DetalleCompra", back_populates="producto")
    detalle_ventas  = relationship("DetalleVenta",  back_populates="producto")


# ─── Compras (cabecera) ──────────────────────────────────────
class Compra(Base):
    __tablename__ = "compras"

    id            = Column(Integer, primary_key=True, index=True)
    proveedor_id  = Column(Integer, ForeignKey("proveedores.id"), nullable=True)
    total         = Column(Float, nullable=False)
    observacion   = Column(Text)
    creado_en     = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    proveedor     = relationship("Proveedor", back_populates="compras")
    detalles      = relationship("DetalleCompra", back_populates="compra")


# ─── Detalle de Compras ──────────────────────────────────────
class DetalleCompra(Base):
    __tablename__ = "detalle_compras"

    id           = Column(Integer, primary_key=True, index=True)
    compra_id    = Column(Integer, ForeignKey("compras.id"), nullable=False)
    producto_id  = Column(Integer, ForeignKey("productos.id"), nullable=False)
    cantidad     = Column(Integer, nullable=False)
    precio_unit  = Column(Float, nullable=False)
    subtotal     = Column(Float, nullable=False)

    compra       = relationship("Compra",   back_populates="detalles")
    producto     = relationship("Producto", back_populates="detalle_compras")


# ─── Ventas (cabecera) ───────────────────────────────────────
class Venta(Base):
    __tablename__ = "ventas"

    id           = Column(Integer, primary_key=True, index=True)
    cliente_id   = Column(Integer, ForeignKey("clientes.id"), nullable=True)
    total        = Column(Float, nullable=False)
    observacion  = Column(Text)
    creado_en    = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    cliente      = relationship("Cliente", back_populates="ventas")
    detalles     = relationship("DetalleVenta", back_populates="venta")


# ─── Detalle de Ventas ───────────────────────────────────────
class DetalleVenta(Base):
    __tablename__ = "detalle_ventas"

    id           = Column(Integer, primary_key=True, index=True)
    venta_id     = Column(Integer, ForeignKey("ventas.id"), nullable=False)
    producto_id  = Column(Integer, ForeignKey("productos.id"), nullable=False)
    cantidad     = Column(Integer, nullable=False)
    precio_unit  = Column(Float, nullable=False)
    subtotal     = Column(Float, nullable=False)

    venta        = relationship("Venta",    back_populates="detalles")
    producto     = relationship("Producto", back_populates="detalle_ventas")
