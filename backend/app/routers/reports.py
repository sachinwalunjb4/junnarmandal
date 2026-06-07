from fastapi import APIRouter, Depends, HTTPException, status
from ..models.schemas import ReportCreate, ReportOut
from ..database import get_admin_supabase
from ..auth import get_current_user

router = APIRouter(prefix="/reports", tags=["reports"])


@router.post("", status_code=status.HTTP_201_CREATED, response_model=ReportOut)
async def file_report(body: ReportCreate, current_user: dict = Depends(get_current_user)):
    db = get_admin_supabase()
    if body.reported_id == current_user["id"]:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot report yourself")

    res = db.table("reports").insert({
        "reporter_id": current_user["id"],
        "reported_id": body.reported_id,
        "reason": body.reason,
        "details": body.details,
    }).execute()
    return res.data[0]


@router.get("", response_model=list[ReportOut])
async def my_reports(current_user: dict = Depends(get_current_user)):
    db = get_admin_supabase()
    res = (
        db.table("reports")
        .select("*")
        .eq("reporter_id", current_user["id"])
        .execute()
    )
    return res.data or []
