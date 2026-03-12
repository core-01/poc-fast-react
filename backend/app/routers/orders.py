from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.db.database import get_db
from app.models.models import Order, OrderItem, Item, User
from app.schemas.schemas import OrderCreate, OrderOut, OrderStatusEnum

router = APIRouter(prefix="/orders", tags=["Orders"])


@router.get("", response_model=List[OrderOut])
def get_orders(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Fetch all orders. Powers the Orders stat card."""
    return db.query(Order).order_by(Order.created_at.desc()).offset(skip).limit(limit).all()


@router.get("/{order_id}", response_model=OrderOut)
def get_order(order_id: int, db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order


@router.post("", response_model=OrderOut, status_code=status.HTTP_201_CREATED)
def create_order(payload: OrderCreate, db: Session = Depends(get_db)):
    """Create an order with one or more items. Auto-calculates total."""
    # Validate user
    user = db.query(User).filter(User.id == payload.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Build order
    order = Order(user_id=payload.user_id, status=payload.status, total=0.0)
    db.add(order)
    db.flush()  # get order.id before inserting items

    total = 0.0
    for oi in payload.items:
        item = db.query(Item).filter(Item.id == oi.item_id).first()
        if not item:
            raise HTTPException(status_code=404, detail=f"Item {oi.item_id} not found")
        line_total = item.price * oi.quantity
        total += line_total
        order_item = OrderItem(
            order_id   = order.id,
            item_id    = oi.item_id,
            quantity   = oi.quantity,
            unit_price = item.price,
        )
        db.add(order_item)

    order.total = round(total, 2)
    db.commit()
    db.refresh(order)
    return order


@router.put("/{order_id}/status")
def update_order_status(order_id: int, new_status: OrderStatusEnum, db: Session = Depends(get_db)):
    """Update order status: pending → completed / cancelled."""
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    order.status = new_status
    db.commit()
    db.refresh(order)
    return order


@router.delete("/{order_id}")
def delete_order(order_id: int, db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    db.delete(order)
    db.commit()
    return {"ok": True, "deleted_id": order_id}
