from fastapi import APIRouter, Depends, Query
from typing import Optional
from ..models.schemas import PaginatedProfiles, ProfileOut
from ..database import get_admin_supabase
from ..auth import get_current_user
import math

router = APIRouter(prefix="/search", tags=["search"])


def _enrich_profiles(profiles: list, db) -> list:
    if not profiles:
        return []
    user_ids = [p["user_id"] for p in profiles]
    photos_res = (
        db.table("photos")
        .select("*")
        .in_("user_id", user_ids)
        .eq("is_public", True)
        .execute()
    )
    photos_by_user: dict[str, list] = {}
    for photo in photos_res.data or []:
        photos_by_user.setdefault(photo["user_id"], []).append(photo)

    for p in profiles:
        p["photos"] = photos_by_user.get(p["user_id"], [])
    return profiles


@router.get("", response_model=PaginatedProfiles)
async def search_profiles(
    gender: Optional[str] = Query(None),
    min_age: Optional[int] = Query(None, ge=18),
    max_age: Optional[int] = Query(None, le=80),
    religion: Optional[str] = Query(None),
    community: Optional[str] = Query(None),
    city: Optional[str] = Query(None),
    qualification: Optional[str] = Query(None),
    marital_status: Optional[str] = Query(None),
    sort_by: str = Query("last_active", pattern="^(last_active|created_at)$"),
    page: int = Query(1, ge=1),
    page_size: int = Query(12, ge=1, le=50),
    current_user: dict = Depends(get_current_user),
):
    db = get_admin_supabase()

    # Get blocked user IDs to exclude
    blocked_res = (
        db.table("blocks")
        .select("blocked_id, user_id")
        .or_(f"user_id.eq.{current_user['id']},blocked_id.eq.{current_user['id']}")
        .execute()
    )
    excluded_ids = set()
    for b in blocked_res.data or []:
        excluded_ids.add(b["blocked_id"])
        excluded_ids.add(b["user_id"])
    excluded_ids.discard(current_user["id"])

    query = (
        db.table("profiles")
        .select("*", count="exact")
        .eq("is_approved", True)
        .neq("user_id", current_user["id"])
    )

    if gender:
        query = query.eq("gender", gender)
    if religion:
        query = query.ilike("religion", f"%{religion}%")
    if community:
        query = query.ilike("community", f"%{community}%")
    if city:
        query = query.ilike("city", f"%{city}%")
    if qualification:
        query = query.ilike("qualification", f"%{qualification}%")
    if marital_status:
        query = query.eq("marital_status", marital_status)

    if min_age or max_age:
        from datetime import date, timedelta
        today = date.today()
        if max_age:
            min_dob = today - timedelta(days=max_age * 365 + 1)
            query = query.gte("date_of_birth", str(min_dob))
        if min_age:
            max_dob = today - timedelta(days=min_age * 365)
            query = query.lte("date_of_birth", str(max_dob))

    query = query.order(sort_by, desc=True)

    offset = (page - 1) * page_size
    query = query.range(offset, offset + page_size - 1)

    res = query.execute()
    all_items = res.data or []

    # Filter out blocked users
    items = [p for p in all_items if p["user_id"] not in excluded_ids]
    total = (res.count or 0)

    items = _enrich_profiles(items, db)
    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "pages": max(1, math.ceil(total / page_size)),
    }
