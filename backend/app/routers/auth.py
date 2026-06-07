import secrets
import bcrypt
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, HTTPException, status, Depends
from ..models.schemas import SignupRequest, LoginRequest, PasswordResetRequest, PasswordUpdateRequest
from ..database import get_admin_supabase
from ..auth import get_current_user, create_access_token
from ..email import send_verification_email
from ..config import get_settings

router = APIRouter(prefix="/auth", tags=["auth"])


def _hash(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def _verify(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())


@router.post("/signup", status_code=status.HTTP_201_CREATED)
async def signup(body: SignupRequest):
    db = get_admin_supabase()
    settings = get_settings()

    existing = db.table("users").select("id").eq("email", body.email).execute()
    if existing.data:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")

    email_enabled = bool(settings.email_user)
    token = secrets.token_urlsafe(32) if email_enabled else None
    expires = (datetime.now(timezone.utc) + timedelta(hours=24)).isoformat() if email_enabled else None

    result = db.table("users").insert({
        "email": body.email,
        "name": body.name,
        "password_hash": _hash(body.password),
        "is_verified": not email_enabled,
        "verification_token": token,
        "verification_token_expires_at": expires,
    }).execute()

    if not result.data:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Signup failed")

    if email_enabled:
        try:
            await send_verification_email(body.email, body.name, token)
        except Exception:
            return {
                "message": "Account created but verification email could not be sent. Use /auth/resend-verification to try again.",
                "user_id": result.data[0]["id"],
            }
        return {
            "message": "Account created. Please check your email to verify your account.",
            "user_id": result.data[0]["id"],
        }

    return {"message": "Account created successfully", "user_id": result.data[0]["id"]}


@router.post("/login")
async def login(body: LoginRequest):
    db = get_admin_supabase()
    result = db.table("users").select("*").eq("email", body.email).execute()

    user = result.data[0] if result.data else None
    if not user or not _verify(body.password, user["password_hash"]):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    if not user.get("is_active", True):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account deactivated")

    if not user.get("is_verified", True):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Email not verified. Please check your inbox or use /auth/resend-verification.",
        )

    return {
        "access_token": create_access_token(user["id"], user["email"]),
        "refresh_token": "",
        "user": {"id": user["id"], "email": user["email"]},
    }


@router.get("/verify-email")
async def verify_email(token: str):
    """Frontend calls this with the token from the email link."""
    db = get_admin_supabase()

    result = db.table("users").select("id,is_verified,verification_token_expires_at").eq("verification_token", token).execute()

    if not result.data:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid verification link.")

    user = result.data[0]
    if user.get("is_verified"):
        return {"message": "Email already verified. You can log in."}

    expires_str = user.get("verification_token_expires_at")
    if expires_str:
        expires = datetime.fromisoformat(expires_str.replace("Z", "+00:00"))
        if datetime.now(timezone.utc) > expires:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Verification link has expired. Please request a new one.",
            )

    db.table("users").update({
        "is_verified": True,
        "verification_token": None,
        "verification_token_expires_at": None,
    }).eq("id", user["id"]).execute()

    return {"message": "Email verified successfully! You can now log in."}


@router.post("/resend-verification")
async def resend_verification(body: PasswordResetRequest):
    """Resend verification email. Body: { "email": "..." }"""
    db = get_admin_supabase()
    ok = {"message": "If that email is registered and unverified, a new link has been sent."}

    result = db.table("users").select("id,name,email,is_verified").eq("email", body.email).execute()
    if not result.data or result.data[0].get("is_verified"):
        return ok

    user = result.data[0]
    token = secrets.token_urlsafe(32)
    expires = (datetime.now(timezone.utc) + timedelta(hours=24)).isoformat()

    db.table("users").update({
        "verification_token": token,
        "verification_token_expires_at": expires,
    }).eq("id", user["id"]).execute()

    try:
        await send_verification_email(user["email"], user["name"], token)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Could not send email. Check server EMAIL_USER / EMAIL_PASSWORD config.",
        )

    return ok


@router.post("/logout")
async def logout(current_user: dict = Depends(get_current_user)):
    return {"message": "Logged out"}


@router.get("/me")
async def me(current_user: dict = Depends(get_current_user)):
    return current_user


@router.post("/password-change")
async def change_password(body: PasswordUpdateRequest, current_user: dict = Depends(get_current_user)):
    db = get_admin_supabase()
    db.table("users").update({"password_hash": _hash(body.new_password)}).eq("id", current_user["id"]).execute()
    return {"message": "Password updated"}
