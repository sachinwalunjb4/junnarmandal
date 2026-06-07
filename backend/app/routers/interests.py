from fastapi import APIRouter, Depends, HTTPException, status, Query
from ..models.schemas import InterestCreate, InterestStatusUpdate, InterestOut
from ..database import get_admin_supabase
from ..auth import get_current_user

router = APIRouter(prefix="/interests", tags=["interests"])


def _enrich_interest(interest: dict, db) -> dict:
    for side in [("sender_id", "sender_profile"), ("receiver_id", "receiver_profile")]:
        uid_key, profile_key = side
        uid = interest.get(uid_key)
        if uid:
            p_res = db.table("profiles").select("*").eq("user_id", uid).execute()
            if p_res.data:
                profile = p_res.data[0]
                photos = db.table("photos").select("*").eq("user_id", uid).eq("is_public", True).execute()
                profile["photos"] = photos.data or []
                interest[profile_key] = profile
            else:
                interest[profile_key] = None
    return interest


@router.post("", status_code=status.HTTP_201_CREATED, response_model=InterestOut)
async def send_interest(body: InterestCreate, current_user: dict = Depends(get_current_user)):
    db = get_admin_supabase()

    if body.receiver_id == current_user["id"]:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot send interest to yourself")

    # Check block
    block = (
        db.table("blocks")
        .select("id")
        .or_(
            f"and(user_id.eq.{current_user['id']},blocked_id.eq.{body.receiver_id}),"
            f"and(user_id.eq.{body.receiver_id},blocked_id.eq.{current_user['id']})"
        )
        .execute()
    )
    if block.data:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot interact with this user")

    existing = (
        db.table("interests")
        .select("id, status")
        .eq("sender_id", current_user["id"])
        .eq("receiver_id", body.receiver_id)
        .execute()
    )
    if existing.data:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Interest already sent (status: {existing.data[0]['status']})",
        )

    res = db.table("interests").insert({
        "sender_id": current_user["id"],
        "receiver_id": body.receiver_id,
        "status": "pending",
    }).execute()

    return _enrich_interest(res.data[0], db)


@router.get("/sent", response_model=list[InterestOut])
async def list_sent(current_user: dict = Depends(get_current_user)):
    db = get_admin_supabase()
    res = (
        db.table("interests")
        .select("*")
        .eq("sender_id", current_user["id"])
        .order("created_at", desc=True)
        .execute()
    )
    return [_enrich_interest(i, db) for i in (res.data or [])]


@router.get("/received", response_model=list[InterestOut])
async def list_received(current_user: dict = Depends(get_current_user)):
    db = get_admin_supabase()
    res = (
        db.table("interests")
        .select("*")
        .eq("receiver_id", current_user["id"])
        .order("created_at", desc=True)
        .execute()
    )
    return [_enrich_interest(i, db) for i in (res.data or [])]


@router.patch("/{interest_id}", response_model=InterestOut)
async def respond_to_interest(
    interest_id: str,
    body: InterestStatusUpdate,
    current_user: dict = Depends(get_current_user),
):
    db = get_admin_supabase()
    existing = (
        db.table("interests")
        .select("*")
        .eq("id", interest_id)
        .eq("receiver_id", current_user["id"])
        .execute()
    )
    if not existing.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Interest not found")

    if existing.data[0]["status"] != "pending":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Interest already responded to")

    res = (
        db.table("interests")
        .update({"status": body.status})
        .eq("id", interest_id)
        .execute()
    )
    return _enrich_interest(res.data[0], db)


@router.delete("/{interest_id}", status_code=status.HTTP_204_NO_CONTENT)
async def withdraw_interest(interest_id: str, current_user: dict = Depends(get_current_user)):
    db = get_admin_supabase()
    existing = (
        db.table("interests")
        .select("id, status")
        .eq("id", interest_id)
        .eq("sender_id", current_user["id"])
        .execute()
    )
    if not existing.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Interest not found")
    if existing.data[0]["status"] == "accepted":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot withdraw an accepted interest")

    db.table("interests").delete().eq("id", interest_id).execute()
