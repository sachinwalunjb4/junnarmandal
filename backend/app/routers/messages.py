from fastapi import APIRouter, Depends, HTTPException, status, Query
from ..models.schemas import MessageCreate, MessageOut
from ..database import get_admin_supabase
from ..auth import get_current_user

router = APIRouter(prefix="/messages", tags=["messages"])


def _assert_matched(user_a: str, user_b: str, db) -> None:
    """Raise 403 unless both users have accepted each other's interest (mutual match)."""
    mutual = (
        db.table("interests")
        .select("id")
        .or_(
            f"and(sender_id.eq.{user_a},receiver_id.eq.{user_b},status.eq.accepted),"
            f"and(sender_id.eq.{user_b},receiver_id.eq.{user_a},status.eq.accepted)"
        )
        .execute()
    )
    if not mutual.data:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Messaging is only available after mutual interest is accepted",
        )


@router.post("", status_code=status.HTTP_201_CREATED, response_model=MessageOut)
async def send_message(body: MessageCreate, current_user: dict = Depends(get_current_user)):
    db = get_admin_supabase()
    if body.receiver_id == current_user["id"]:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot message yourself")

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
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cannot message this user")

    _assert_matched(current_user["id"], body.receiver_id, db)

    res = db.table("messages").insert({
        "sender_id": current_user["id"],
        "receiver_id": body.receiver_id,
        "body": body.body,
    }).execute()
    return res.data[0]


@router.get("/conversations")
async def list_conversations(current_user: dict = Depends(get_current_user)):
    """Return a list of unique conversation partners with their latest message."""
    db = get_admin_supabase()
    uid = current_user["id"]

    res = (
        db.table("messages")
        .select("*")
        .or_(f"sender_id.eq.{uid},receiver_id.eq.{uid}")
        .order("created_at", desc=True)
        .execute()
    )
    messages = res.data or []

    seen: dict[str, dict] = {}
    for msg in messages:
        other = msg["receiver_id"] if msg["sender_id"] == uid else msg["sender_id"]
        if other not in seen:
            # Attach profile
            p_res = db.table("profiles").select("name, city").eq("user_id", other).execute()
            photos_res = (
                db.table("photos")
                .select("storage_path")
                .eq("user_id", other)
                .eq("is_primary", True)
                .limit(1)
                .execute()
            )
            seen[other] = {
                "partner_id": other,
                "partner_name": p_res.data[0]["name"] if p_res.data else "Unknown",
                "last_message": msg["body"],
                "last_message_at": msg["created_at"],
                "primary_photo": photos_res.data[0]["storage_path"] if photos_res.data else None,
                "unread_count": 0,
            }

    # Count unread
    unread_res = (
        db.table("messages")
        .select("sender_id")
        .eq("receiver_id", uid)
        .eq("is_read", False)
        .execute()
    )
    for msg in unread_res.data or []:
        if msg["sender_id"] in seen:
            seen[msg["sender_id"]]["unread_count"] += 1

    return list(seen.values())


@router.get("/{partner_id}", response_model=list[MessageOut])
async def get_conversation(
    partner_id: str,
    page: int = Query(1, ge=1),
    page_size: int = Query(30, ge=1, le=100),
    current_user: dict = Depends(get_current_user),
):
    db = get_admin_supabase()
    uid = current_user["id"]

    _assert_matched(uid, partner_id, db)

    offset = (page - 1) * page_size
    res = (
        db.table("messages")
        .select("*")
        .or_(
            f"and(sender_id.eq.{uid},receiver_id.eq.{partner_id}),"
            f"and(sender_id.eq.{partner_id},receiver_id.eq.{uid})"
        )
        .order("created_at", desc=False)
        .range(offset, offset + page_size - 1)
        .execute()
    )

    # Mark received messages as read
    db.table("messages").update({"is_read": True}).eq(
        "sender_id", partner_id
    ).eq("receiver_id", uid).eq("is_read", False).execute()

    return res.data or []


@router.patch("/{message_id}/read", response_model=MessageOut)
async def mark_read(message_id: str, current_user: dict = Depends(get_current_user)):
    db = get_admin_supabase()
    res = (
        db.table("messages")
        .update({"is_read": True})
        .eq("id", message_id)
        .eq("receiver_id", current_user["id"])
        .execute()
    )
    if not res.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Message not found")
    return res.data[0]
