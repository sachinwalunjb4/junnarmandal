from fastapi import APIRouter, Depends, HTTPException, status, Query
from ..models.schemas import (
    AdminUserOut, AdminProfileAction, AdminUserAction, ReportResolve, ReportOut
)
from ..database import get_admin_supabase
from ..auth import get_admin_user

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/dashboard")
async def dashboard(_admin=Depends(get_admin_user)):
    db = get_admin_supabase()
    users_count = db.table("users").select("id", count="exact").execute().count or 0
    pending_profiles = (
        db.table("profiles").select("id", count="exact").eq("is_approved", False).execute().count or 0
    )
    pending_reports = (
        db.table("reports").select("id", count="exact").eq("status", "pending").execute().count or 0
    )
    total_messages = db.table("messages").select("id", count="exact").execute().count or 0
    total_interests = db.table("interests").select("id", count="exact").execute().count or 0
    return {
        "total_users": users_count,
        "pending_profiles": pending_profiles,
        "pending_reports": pending_reports,
        "total_messages": total_messages,
        "total_interests": total_interests,
    }


# ---------------------------------------------------------------------------
# Users
# ---------------------------------------------------------------------------
@router.get("/users", response_model=list[AdminUserOut])
async def list_users(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    _admin=Depends(get_admin_user),
):
    db = get_admin_supabase()
    offset = (page - 1) * page_size
    res = (
        db.table("users")
        .select("*")
        .order("created_at", desc=True)
        .range(offset, offset + page_size - 1)
        .execute()
    )
    users = res.data or []
    for u in users:
        p_res = db.table("profiles").select("*").eq("user_id", u["id"]).execute()
        if p_res.data:
            profile = p_res.data[0]
            photos = db.table("photos").select("*").eq("user_id", u["id"]).execute()
            profile["photos"] = photos.data or []
            u["profile"] = profile
        else:
            u["profile"] = None
    return users


@router.patch("/users/{user_id}/status", response_model=AdminUserOut)
async def set_user_status(
    user_id: str,
    body: AdminUserAction,
    _admin=Depends(get_admin_user),
):
    db = get_admin_supabase()
    res = db.table("users").update({"is_active": body.is_active}).eq("id", user_id).execute()
    if not res.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    user = res.data[0]
    p_res = db.table("profiles").select("*").eq("user_id", user_id).execute()
    user["profile"] = p_res.data[0] if p_res.data else None
    return user


# ---------------------------------------------------------------------------
# Profiles – approval queue
# ---------------------------------------------------------------------------
@router.get("/profiles/pending")
async def pending_profiles(_admin=Depends(get_admin_user)):
    db = get_admin_supabase()
    res = (
        db.table("profiles")
        .select("*")
        .eq("is_approved", False)
        .order("created_at")
        .execute()
    )
    profiles = res.data or []
    for p in profiles:
        photos = db.table("photos").select("*").eq("user_id", p["user_id"]).execute()
        p["photos"] = photos.data or []
    return profiles


@router.patch("/profiles/{user_id}/approve")
async def approve_profile(
    user_id: str,
    body: AdminProfileAction,
    _admin=Depends(get_admin_user),
):
    db = get_admin_supabase()
    res = (
        db.table("profiles")
        .update({"is_approved": body.is_approved})
        .eq("user_id", user_id)
        .execute()
    )
    if not res.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found")
    return res.data[0]


# ---------------------------------------------------------------------------
# Reports
# ---------------------------------------------------------------------------
@router.get("/reports", response_model=list[ReportOut])
async def list_reports(
    report_status: str = Query("pending"),
    _admin=Depends(get_admin_user),
):
    db = get_admin_supabase()
    res = (
        db.table("reports")
        .select("*")
        .eq("status", report_status)
        .order("created_at", desc=True)
        .execute()
    )
    return res.data or []


@router.patch("/reports/{report_id}", response_model=ReportOut)
async def resolve_report(
    report_id: str,
    body: ReportResolve,
    _admin=Depends(get_admin_user),
):
    db = get_admin_supabase()
    res = (
        db.table("reports")
        .update({"status": body.status, "admin_note": body.admin_note})
        .eq("id", report_id)
        .execute()
    )
    if not res.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found")
    return res.data[0]
