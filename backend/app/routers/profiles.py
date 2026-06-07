from fastapi import APIRouter, HTTPException, status, Depends, UploadFile, File
from ..models.schemas import ProfileCreate, ProfileUpdate, ProfileOut, PreferenceCreate, PreferenceOut, PhotoOut, PhotoPrivacyUpdate
from ..database import get_admin_supabase
from ..auth import get_current_user
from ..config import get_settings
import uuid
import io
from PIL import Image

router = APIRouter(prefix="/profiles", tags=["profiles"])

BUCKET = "profile-photos"
MAX_IMAGE_SIZE = 5 * 1024 * 1024  # 5 MB


def _enrich_profile(profile: dict, db) -> dict:
    """Attach public photos to a profile dict."""
    photos_res = db.table("photos").select("*").eq("user_id", profile["user_id"]).execute()
    profile["photos"] = photos_res.data or []
    return profile


@router.post("", status_code=status.HTTP_201_CREATED, response_model=ProfileOut)
async def create_profile(body: ProfileCreate, current_user: dict = Depends(get_current_user)):
    db = get_admin_supabase()
    existing = db.table("profiles").select("id").eq("user_id", current_user["id"]).execute()
    if existing.data:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Profile already exists")

    data = body.model_dump()
    data["user_id"] = current_user["id"]
    data["date_of_birth"] = str(data["date_of_birth"])
    res = db.table("profiles").insert(data).execute()
    profile = res.data[0]
    return _enrich_profile(profile, db)


@router.get("/me", response_model=ProfileOut)
async def get_my_profile(current_user: dict = Depends(get_current_user)):
    db = get_admin_supabase()
    res = db.table("profiles").select("*").eq("user_id", current_user["id"]).execute()
    if not res.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found")
    return _enrich_profile(res.data[0], db)


@router.put("/me", response_model=ProfileOut)
async def update_my_profile(body: ProfileUpdate, current_user: dict = Depends(get_current_user)):
    db = get_admin_supabase()
    data = {k: v for k, v in body.model_dump().items() if v is not None}
    if not data:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No fields to update")

    res = db.table("profiles").update(data).eq("user_id", current_user["id"]).execute()
    if not res.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found")
    return _enrich_profile(res.data[0], db)


@router.get("/{user_id}", response_model=ProfileOut)
async def get_profile(user_id: str, current_user: dict = Depends(get_current_user)):
    db = get_admin_supabase()

    # Check if blocked
    block = (
        db.table("blocks")
        .select("id")
        .or_(f"user_id.eq.{current_user['id']},blocked_id.eq.{user_id}")
        .execute()
    )
    if block.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found")

    res = (
        db.table("profiles")
        .select("*")
        .eq("user_id", user_id)
        .eq("is_approved", True)
        .execute()
    )
    if not res.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found")

    profile = res.data[0]

    # Only include public photos unless there's mutual interest
    mutual = (
        db.table("interests")
        .select("id")
        .or_(
            f"and(sender_id.eq.{current_user['id']},receiver_id.eq.{user_id},status.eq.accepted),"
            f"and(sender_id.eq.{user_id},receiver_id.eq.{current_user['id']},status.eq.accepted)"
        )
        .execute()
    )
    is_matched = bool(mutual.data)

    photos_query = db.table("photos").select("*").eq("user_id", user_id)
    if not is_matched:
        photos_query = photos_query.eq("is_public", True)
    photos_res = photos_query.execute()
    profile["photos"] = photos_res.data or []
    return profile


# ---------------------------------------------------------------------------
# Partner Preferences
# ---------------------------------------------------------------------------
@router.post("/me/preferences", response_model=PreferenceOut, status_code=status.HTTP_201_CREATED)
async def upsert_preferences(body: PreferenceCreate, current_user: dict = Depends(get_current_user)):
    db = get_admin_supabase()
    data = body.model_dump()
    data["user_id"] = current_user["id"]

    existing = db.table("partner_preferences").select("id").eq("user_id", current_user["id"]).execute()
    if existing.data:
        res = db.table("partner_preferences").update(data).eq("user_id", current_user["id"]).execute()
    else:
        res = db.table("partner_preferences").insert(data).execute()
    return res.data[0]


@router.get("/me/preferences", response_model=PreferenceOut)
async def get_preferences(current_user: dict = Depends(get_current_user)):
    db = get_admin_supabase()
    res = db.table("partner_preferences").select("*").eq("user_id", current_user["id"]).execute()
    if not res.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Preferences not set")
    return res.data[0]


# ---------------------------------------------------------------------------
# Photos
# ---------------------------------------------------------------------------
@router.post("/me/photos", response_model=PhotoOut, status_code=status.HTTP_201_CREATED)
async def upload_photo(
    file: UploadFile = File(...),
    is_public: bool = True,
    current_user: dict = Depends(get_current_user),
):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="File must be an image")

    content = await file.read()
    if len(content) > MAX_IMAGE_SIZE:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Image must be under 5 MB")

    # Validate & convert to JPEG
    try:
        img = Image.open(io.BytesIO(content))
        img.verify()
        img = Image.open(io.BytesIO(content)).convert("RGB")
        buf = io.BytesIO()
        img.save(buf, format="JPEG", quality=85)
        content = buf.getvalue()
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid image file")

    db = get_admin_supabase()
    storage_path = f"{current_user['id']}/{uuid.uuid4()}.jpg"

    db.storage.from_(BUCKET).upload(storage_path, content, {"content-type": "image/jpeg"})

    # Check if first photo – make it primary
    existing_count = db.table("photos").select("id").eq("user_id", current_user["id"]).execute()
    is_primary = len(existing_count.data) == 0

    res = db.table("photos").insert({
        "user_id": current_user["id"],
        "storage_path": storage_path,
        "is_primary": is_primary,
        "is_public": is_public,
    }).execute()
    return res.data[0]


@router.patch("/me/photos/{photo_id}/privacy", response_model=PhotoOut)
async def update_photo_privacy(
    photo_id: str,
    body: PhotoPrivacyUpdate,
    current_user: dict = Depends(get_current_user),
):
    db = get_admin_supabase()
    res = (
        db.table("photos")
        .update({"is_public": body.is_public})
        .eq("id", photo_id)
        .eq("user_id", current_user["id"])
        .execute()
    )
    if not res.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Photo not found")
    return res.data[0]


@router.patch("/me/photos/{photo_id}/primary", response_model=PhotoOut)
async def set_primary_photo(photo_id: str, current_user: dict = Depends(get_current_user)):
    db = get_admin_supabase()
    # Clear existing primary
    db.table("photos").update({"is_primary": False}).eq("user_id", current_user["id"]).execute()
    res = (
        db.table("photos")
        .update({"is_primary": True})
        .eq("id", photo_id)
        .eq("user_id", current_user["id"])
        .execute()
    )
    if not res.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Photo not found")
    return res.data[0]


@router.delete("/me/photos/{photo_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_photo(photo_id: str, current_user: dict = Depends(get_current_user)):
    db = get_admin_supabase()
    photo_res = (
        db.table("photos")
        .select("storage_path")
        .eq("id", photo_id)
        .eq("user_id", current_user["id"])
        .execute()
    )
    if not photo_res.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Photo not found")

    storage_path = photo_res.data[0]["storage_path"]
    try:
        db.storage.from_(BUCKET).remove([storage_path])
    except Exception:
        pass

    db.table("photos").delete().eq("id", photo_id).execute()


@router.get("/me/photos/signed-url/{photo_id}")
async def get_signed_url(photo_id: str, current_user: dict = Depends(get_current_user)):
    """Generate a short-lived signed URL for private photo access."""
    db = get_admin_supabase()
    photo_res = (
        db.table("photos")
        .select("storage_path, is_public, user_id")
        .eq("id", photo_id)
        .execute()
    )
    if not photo_res.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Photo not found")

    photo = photo_res.data[0]
    if not photo["is_public"] and photo["user_id"] != current_user["id"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Photo is private")

    signed = db.storage.from_(BUCKET).create_signed_url(photo["storage_path"], 3600)
    return {"signed_url": signed["signedURL"]}
