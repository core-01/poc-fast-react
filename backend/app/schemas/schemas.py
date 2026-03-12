from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
from enum import Enum


# ─── ENUMS ────────────────────────────────────────────────────────────────────

class StatusEnum(str, Enum):
    active   = "active"
    inactive = "inactive"

class OrderStatusEnum(str, Enum):
    pending   = "pending"
    completed = "completed"
    cancelled = "cancelled"


# ─── USER SCHEMAS ─────────────────────────────────────────────────────────────

class UserCreate(BaseModel):
    name:   str
    email:  EmailStr
    status: StatusEnum = StatusEnum.active

class UserUpdate(BaseModel):
    name:   Optional[str]        = None
    email:  Optional[EmailStr]   = None
    status: Optional[StatusEnum] = None

class UserOut(BaseModel):
    id:         int
    name:       str
    email:      str
    status:     StatusEnum
    created_at: datetime

    class Config:
        from_attributes = True


# ─── ITEM SCHEMAS ─────────────────────────────────────────────────────────────

class ItemCreate(BaseModel):
    name:        str
    description: Optional[str] = None
    price:       float
    status:      StatusEnum    = StatusEnum.active

class ItemUpdate(BaseModel):
    name:        Optional[str]        = None
    description: Optional[str]        = None
    price:       Optional[float]      = None
    status:      Optional[StatusEnum] = None

class ItemOut(BaseModel):
    id:          int
    name:        str
    description: Optional[str]
    price:       float
    status:      StatusEnum
    created_at:  datetime

    class Config:
        from_attributes = True


# ─── ORDER SCHEMAS ────────────────────────────────────────────────────────────

class OrderItemCreate(BaseModel):
    item_id:  int
    quantity: int = 1

class OrderCreate(BaseModel):
    user_id: int
    items:   List[OrderItemCreate]
    status:  OrderStatusEnum = OrderStatusEnum.pending

class OrderItemOut(BaseModel):
    id:         int
    item_id:    int
    quantity:   int
    unit_price: float

    class Config:
        from_attributes = True

class OrderOut(BaseModel):
    id:          int
    user_id:     int
    total:       float
    status:      OrderStatusEnum
    created_at:  datetime
    order_items: List[OrderItemOut] = []

    class Config:
        from_attributes = True


# ─── STATS SCHEMA ─────────────────────────────────────────────────────────────

class StatsOut(BaseModel):
    users:   int
    revenue: float
    orders:  int
    growth:  float
