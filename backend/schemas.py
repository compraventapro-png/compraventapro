# =============================================================
#  schemas.py — Modelos Pydantic (validación entrada/salida)
# =============================================================
from pydantic import BaseModel, EmailStr, field_validator
from typing import List, Optional
from datetime import datetime
from enum import Enum


class RolUsuario(str, Enum):
    admin    = "admin"
    vendedor = "vendedor"


# ══════════════════════════════════════════════════════════════
#  USUARIOS
# ══════════════════════════════════════════════════════════════
class UsuarioCreate(BaseModel):
    nombre:   str
    email:    EmailStr
    password: str
    rol:      RolUsuario = RolUsuario.vendedor


class UsuarioOut(BaseModel):
    id:        int
    nombre:    str
    email:     str
    rol:       RolUsuario
    activo:    bool
    creado_en: datetime

    model_config = {"from_attributes": True}


class LoginRequest(BaseModel):
    email:    EmailStr
    password: str


class TokenOut(BaseModel):
    access_token: str
    token_type:   str = "bearer"
    usuario:      UsuarioOut


# ══════════════════════════════════════════════════════════════
#  PROVEEDORES
# ══════════════════════════════════════════════════════════════
class ProveedorBase(BaseModel):
    nombre_razon: str
    nit_ci:       Optional[str] = None
    telefono:     Optional[str] = None
    email:        Optional[str] = None
    direccion:    Optional[str] = None


class ProveedorCreate(ProveedorBase):
    pass


class ProveedorOut(ProveedorBase):
    id:        int
    creado_en: datetime

    model_config = {"from_attributes": True}


# ══════════════════════════════════════════════════════════════
#  CLIENTES
# ══════════════════════════════════════════════════════════════
class ClienteBase(BaseModel):
    nombre_razon: str
    nit_ci:       Optional[str] = None
    telefono:     Optional[str] = None
    email:        Optional[str] = None
    direccion:    Optional[str] = None


class ClienteCreate(ClienteBase):
    pass


class ClienteOut(ClienteBase):
    id:        int
    creado_en: datetime

    model_config = {"from_attributes": True}


# ══════════════════════════════════════════════════════════════
#  PRODUCTOS
# ══════════════════════════════════════════════════════════════
class ProductoBase(BaseModel):
    sku:           str
    nombre:        str
    descripcion:   Optional[str] = None
    imagen_url:    Optional[str] = None
    precio_compra: float
    precio_venta:  float
    stock_actual:  int   = 0
    stock_minimo:  int   = 5

    @field_validator("precio_venta", "precio_compra")
    @classmethod
    def precio_positivo(cls, v):
        if v < 0:
            raise ValueError("El precio no puede ser negativo")
        return v


class ProductoCreate(ProductoBase):
    pass


class ProductoUpdate(BaseModel):
    nombre:        Optional[str]   = None
    sku:           Optional[str]   = None
    descripcion:   Optional[str]   = None
    imagen_url:    Optional[str]   = None
    precio_compra: Optional[float] = None
    precio_venta:  Optional[float] = None
    stock_actual:  Optional[int]   = None
    stock_minimo:  Optional[int]   = None
    activo:        Optional[bool]  = None


class ProductoOut(ProductoBase):
    id:        int
    activo:    bool
    creado_en: datetime

    model_config = {"from_attributes": True}


# ══════════════════════════════════════════════════════════════
#  COMPRAS
# ══════════════════════════════════════════════════════════════
class DetalleCompraIn(BaseModel):
    producto_id: int
    cantidad:    int
    precio_unit: float

    @field_validator("cantidad")
    @classmethod
    def cantidad_positiva(cls, v):
        if v <= 0:
            raise ValueError("La cantidad debe ser mayor a 0")
        return v


class CompraCreate(BaseModel):
    proveedor_id: Optional[int] = None
    observacion:  Optional[str] = None
    items:        List[DetalleCompraIn]


class DetalleCompraOut(BaseModel):
    id:          int
    producto_id: int
    cantidad:    int
    precio_unit: float
    subtotal:    float

    model_config = {"from_attributes": True}


class CompraOut(BaseModel):
    id:           int
    proveedor_id: Optional[int]
    total:        float
    observacion:  Optional[str]
    creado_en:    datetime
    detalles:     List[DetalleCompraOut] = []

    model_config = {"from_attributes": True}


# ══════════════════════════════════════════════════════════════
#  VENTAS
# ══════════════════════════════════════════════════════════════
class DetalleVentaIn(BaseModel):
    producto_id: int
    cantidad:    int

    @field_validator("cantidad")
    @classmethod
    def cantidad_positiva(cls, v):
        if v <= 0:
            raise ValueError("La cantidad debe ser mayor a 0")
        return v


class VentaCreate(BaseModel):
    cliente_id:  Optional[int] = None
    observacion: Optional[str] = None
    items:       List[DetalleVentaIn]


class DetalleVentaOut(BaseModel):
    id:          int
    producto_id: int
    cantidad:    int
    precio_unit: float
    subtotal:    float

    model_config = {"from_attributes": True}


class VentaOut(BaseModel):
    id:          int
    cliente_id:  Optional[int]
    total:       float
    observacion: Optional[str]
    creado_en:   datetime
    detalles:    List[DetalleVentaOut] = []

    model_config = {"from_attributes": True}


# ══════════════════════════════════════════════════════════════
#  DASHBOARD / REPORTES
# ══════════════════════════════════════════════════════════════
class ResumenDashboard(BaseModel):
    total_productos:        int
    productos_stock_bajo:   int
    total_ventas_hoy:       float
    total_compras_hoy:      float
    num_ventas_hoy:         int
    num_compras_hoy:        int
