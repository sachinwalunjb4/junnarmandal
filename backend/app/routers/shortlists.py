from fastapi import APIRouter, Depends, HTTPException, status
from ..models.schemas import ShortlistCreate, ShortlistOut
from ..database import get_admin_supabase
from ..auth import get_current_user

router = APIRouter(prefix="/shortlists", tags=["shortlists"])


def _enrich(item: dict, db) -> dict:
    uid = item["target_id"]
    p_res = db.table("profiles").select("*").eq("user_id", uid).execute()
    if p_res.data:
        profile = p_res.data[0]
        photos = db.table("photos").select("*").eq("user_id", uid).eq("is_public", True).execute()
        profile["photos"] = photos.data or []
        item["profile"] = profile
    else:
        item["profile"] = None
    return item


@router.post("", status_code=status.HTTP_201_CREATED, response_model=ShortlistOut)
async def add_to_shortlist(body: ShortlistCreate, current_user: dict = Depends(get_current_user)):
    db = get_admin_supabase()
    if body.target_id == current_user["id"]:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot shortlist yourself")

    existing = (
        db.table("shortlists")
        .select("id")
        .eq("user_id", current_user["id"])
        .eq("target_id", body.target_id)
        .execute()
    )
    if existing.data:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Already shortlisted")

    res = db.table("shortlists").insert({
        "user_id": current_user["id"],
        "target_id": body.target_id,
    }).execute()
    return _enrich(res.data[0], db)


@router.get("", response_model=list[ShortlistOut])
async def list_shortlists(current_user: dict = Depends(get_current_user)):
    db = get_admin_supabase()
    res = (
        db.table("shortlists")
        .select("*")
        .eq("user_id", current_user["id"])
        .order("created_at", desc=True)
        .execute()
    )
    return [_enrich(item, db) for item in (res.data or [])]


@router.delete("/{shortlist_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_from_shortlist(shortlist_id: str, current_user: dict = Depends(get_current_user)):
    db = get_admin_supabase()
    existing = (
        db.table("shortlists")
        .select("id")
        .eq("id", shortlist_id)
        .eq("user_id", current_user["id"])
        .execute()
    )
    if not existing.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Shortlist entry not found")
    db.table("shortlists").delete().eq("id", shortlist_id).execute()
