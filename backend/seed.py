"""
Run once to seed the database with sample data:
    python seed.py
"""
import sys, os
sys.path.append(os.path.dirname(__file__))

from app.db.database import SessionLocal, engine, Base
import app.models.models as M   # registers all models
from app.models.models import User, Item, Order, OrderItem, StatusEnum, OrderStatusEnum

Base.metadata.create_all(bind=engine)

db = SessionLocal()

# ─── USERS ────────────────────────────────────────────────────────────────────
users = [
    User(name="Alice Johnson", email="alice@example.com", status=StatusEnum.active),
    User(name="Bob Smith",     email="bob@example.com",   status=StatusEnum.active),
    User(name="Carol White",   email="carol@example.com", status=StatusEnum.inactive),
]
db.add_all(users)
db.commit()
for u in users:
    db.refresh(u)

# ─── ITEMS ────────────────────────────────────────────────────────────────────
items = [
    Item(name="Product Alpha", description="Our flagship product",   price=29.99, status=StatusEnum.active),
    Item(name="Product Beta",  description="Premium tier offering",  price=49.99, status=StatusEnum.inactive),
    Item(name="Product Gamma", description="Entry-level option",     price=19.99, status=StatusEnum.active),
    Item(name="Product Delta", description="Enterprise solution",    price=99.99, status=StatusEnum.active),
]
db.add_all(items)
db.commit()
for i in items:
    db.refresh(i)

# ─── ORDERS ───────────────────────────────────────────────────────────────────
orders_data = [
    (users[0], [(items[0], 2), (items[2], 1)], OrderStatusEnum.completed),
    (users[1], [(items[1], 1)],                OrderStatusEnum.pending),
    (users[0], [(items[3], 1), (items[0], 1)], OrderStatusEnum.completed),
    (users[2], [(items[2], 3)],                OrderStatusEnum.cancelled),
]

for user, item_list, status in orders_data:
    total = sum(i.price * qty for i, qty in item_list)
    order = Order(user_id=user.id, status=status, total=round(total, 2))
    db.add(order)
    db.flush()
    for item, qty in item_list:
        db.add(OrderItem(order_id=order.id, item_id=item.id, quantity=qty, unit_price=item.price))

db.commit()
db.close()

print("✅ Database seeded successfully!")
print(f"   Users:  {len(users)}")
print(f"   Items:  {len(items)}")
print(f"   Orders: {len(orders_data)}")
