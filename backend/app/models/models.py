from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Enum, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.db.database import Base


# ─── ENUMS ────────────────────────────────────────────────────────────────────

class StatusEnum(str, enum.Enum):
    active   = "active"
    inactive = "inactive"

class OrderStatusEnum(str, enum.Enum):
    pending   = "pending"
    completed = "completed"
    cancelled = "cancelled"


# ─── USERS ────────────────────────────────────────────────────────────────────

class User(Base):
    __tablename__ = "users"

    id         = Column(Integer, primary_key=True, index=True)
    name       = Column(String(100), nullable=False)
    email      = Column(String(150), unique=True, nullable=False, index=True)
    status     = Column(Enum(StatusEnum), default=StatusEnum.active)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    orders = relationship("Order", back_populates="user")


# ─── ITEMS (Products) ─────────────────────────────────────────────────────────

class Item(Base):
    __tablename__ = "items"

    id          = Column(Integer, primary_key=True, index=True)
    name        = Column(String(150), nullable=False)
    description = Column(Text, nullable=True)
    price       = Column(Float, nullable=False)
    status      = Column(Enum(StatusEnum), default=StatusEnum.active)
    created_at  = Column(DateTime(timezone=True), server_default=func.now())
    updated_at  = Column(DateTime(timezone=True), onupdate=func.now())

    order_items = relationship("OrderItem", back_populates="item")


# ─── ORDERS ───────────────────────────────────────────────────────────────────

class Order(Base):
    __tablename__ = "orders"

    id         = Column(Integer, primary_key=True, index=True)
    user_id    = Column(Integer, ForeignKey("users.id"), nullable=False)
    total      = Column(Float, nullable=False, default=0.0)
    status     = Column(Enum(OrderStatusEnum), default=OrderStatusEnum.pending)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    user        = relationship("User", back_populates="orders")
    order_items = relationship("OrderItem", back_populates="order")


# ─── ORDER ITEMS (junction) ───────────────────────────────────────────────────

class OrderItem(Base):
    __tablename__ = "order_items"

    id         = Column(Integer, primary_key=True, index=True)
    order_id   = Column(Integer, ForeignKey("orders.id"), nullable=False)
    item_id    = Column(Integer, ForeignKey("items.id"),  nullable=False)
    quantity   = Column(Integer, nullable=False, default=1)
    unit_price = Column(Float,   nullable=False)

    order = relationship("Order", back_populates="order_items")
    item  = relationship("Item",  back_populates="order_items")
