from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.db.database import get_db
from app.models.models import User, Order, Item
from app.schemas.schemas import StatsOut

router = APIRouter(prefix="/stats", tags=["Stats"])


@router.get("", response_model=StatsOut)
def get_stats(db: Session = Depends(get_db)):
    """Returns summary stats for the dashboard header cards."""

    total_users  = db.query(func.count(User.id)).scalar() or 0
    total_orders = db.query(func.count(Order.id)).scalar() or 0
    total_revenue = db.query(func.coalesce(func.sum(Order.total), 0)).scalar() or 0.0

    # Growth: compare orders this month vs last month
    from sqlalchemy import extract
    from datetime import datetime
    now = datetime.utcnow()

    this_month = db.query(func.count(Order.id)).filter(
        extract("month", Order.created_at) == now.month,
        extract("year",  Order.created_at) == now.year,
    ).scalar() or 0

    last_month = db.query(func.count(Order.id)).filter(
        extract("month", Order.created_at) == (now.month - 1 if now.month > 1 else 12),
        extract("year",  Order.created_at) == (now.year if now.month > 1 else now.year - 1),
    ).scalar() or 0

    growth = round(((this_month - last_month) / last_month * 100) if last_month > 0 else 0.0, 1)

    return StatsOut(
        users=total_users,
        revenue=round(float(total_revenue), 2),
        orders=total_orders,
        growth=growth,
    )
