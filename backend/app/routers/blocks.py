from fastapi import APIRouter, Depends, HTTPException, status
from ..models.schemas import BlockCreate, BlockOut
from ..database import get_admin_supabase
from ..auth import get_current_user

router = APIRouter(prefix="/blocks", tags=["blocks"])


@router.post("", status_code=status.HTTP_201_CREATED, response_model=BlockOut)
async def block_user(body: BlockCreate, current_user: dict = Depends(get_current_user)):
    db = get_admin_supabase()
    if body.blocked_id == current_user["id"]:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot block yourself")

    existing = (
        db.table("blocks")
        .select("id")
        .eq("user_id", current_user["id"])
        .eq("blocked_id", body.blocked_id)
        .execute()
    )
    if existing.data:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="User already blocked")

    res = db.table("blocks").insert({
        "user_id": current_user["id"],
        "blocked_id": body.blocked_id,
    }).execute()
    return res.data[0]


@router.get("", response_model=list[BlockOut])
async def list_blocks(current_user: dict = Depends(get_current_user)):
    db = get_admin_supabase()
    res = (
        db.table("blocks")
        .select("*")
        .eq("user_id", current_user["id"])
        .execute()
    )
    return res.data or []


@router.delete("/{block_id}", status_code=status.HTTP_204_NO_CONTENT)
async def unblock_user(block_id: str, current_user: dict = Depends(get_current_user)):
    db = get_admin_supabase()
    existing = (
        db.table("blocks")
        .select("id")
        .eq("id", block_id)
        .eq("user_id", current_user["id"])
        .execute()
    )
    if not existing.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Block entry not found")
    db.table("blocks").delete().eq("id", block_id).execute()
