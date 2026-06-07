"""
Compatibility scoring engine.

Score components (max 100 points):
- Religion match       : 20 pts
- Community match      : 20 pts
- Age within range     : 20 pts
- Height within range  : 10 pts
- Education match      : 15 pts
- Location match       : 15 pts
"""
from fastapi import APIRouter, Depends, Query
from datetime import date
from ..models.schemas import MatchOut, ProfileOut
from ..database import get_admin_supabase
from ..auth import get_current_user

router = APIRouter(prefix="/matches", tags=["matches"])


def _age(dob_str: str) -> int:
    dob = date.fromisoformat(str(dob_str))
    today = date.today()
    return today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))


def _compute_score(profile: dict, prefs: dict) -> tuple[float, dict]:
    breakdown: dict[str, float] = {}
    total = 0.0

    if prefs.get("religion") and profile.get("religion"):
        pts = 20.0 if prefs["religion"].lower() == profile["religion"].lower() else 0.0
        breakdown["religion"] = pts
        total += pts

    if prefs.get("community") and profile.get("community"):
        pts = 20.0 if prefs["community"].lower() == profile["community"].lower() else 0.0
        breakdown["community"] = pts
        total += pts

    if profile.get("date_of_birth"):
        age = _age(profile["date_of_birth"])
        min_age = prefs.get("min_age", 18)
        max_age = prefs.get("max_age", 60)
        if min_age <= age <= max_age:
            breakdown["age"] = 20.0
            total += 20.0
        else:
            over = max(0, age - max_age, min_age - age)
            pts = max(0.0, 20.0 - over * 2)
            breakdown["age"] = pts
            total += pts

    if prefs.get("min_height_cm") and prefs.get("max_height_cm") and profile.get("height_cm"):
        h = profile["height_cm"]
        if prefs["min_height_cm"] <= h <= prefs["max_height_cm"]:
            breakdown["height"] = 10.0
            total += 10.0
        else:
            breakdown["height"] = 0.0

    if prefs.get("education") and profile.get("qualification"):
        pts = 15.0 if prefs["education"].lower() in profile["qualification"].lower() else 0.0
        breakdown["education"] = pts
        total += pts

    if prefs.get("location") and profile.get("city"):
        pts = 15.0 if prefs["location"].lower() in profile["city"].lower() else 0.0
        breakdown["location"] = pts
        total += pts

    # Normalise to 0-100
    max_possible = (
        (20 if prefs.get("religion") else 0)
        + (20 if prefs.get("community") else 0)
        + 20  # age always scored
        + (10 if prefs.get("min_height_cm") and prefs.get("max_height_cm") else 0)
        + (15 if prefs.get("education") else 0)
        + (15 if prefs.get("location") else 0)
    ) or 20  # at least age

    normalised = round((total / max_possible) * 100, 1)
    return normalised, breakdown


@router.get("", response_model=list[MatchOut])
async def get_matches(
    limit: int = Query(20, ge=1, le=50),
    current_user: dict = Depends(get_current_user),
):
    db = get_admin_supabase()

    # Load my preferences
    prefs_res = (
        db.table("partner_preferences")
        .select("*")
        .eq("user_id", current_user["id"])
        .execute()
    )
    prefs = prefs_res.data[0] if prefs_res.data else {}

    # Get my profile to know my gender
    my_profile_res = (
        db.table("profiles")
        .select("gender")
        .eq("user_id", current_user["id"])
        .execute()
    )
    my_gender = my_profile_res.data[0]["gender"] if my_profile_res.data else None

    # Fetch approved candidates of opposite / any gender
    candidates_query = (
        db.table("profiles")
        .select("*")
        .eq("is_approved", True)
        .neq("user_id", current_user["id"])
    )
    if my_gender == "male":
        candidates_query = candidates_query.eq("gender", "female")
    elif my_gender == "female":
        candidates_query = candidates_query.eq("gender", "male")

    candidates_res = candidates_query.limit(200).execute()
    candidates = candidates_res.data or []

    # Filter out blocked
    blocked_res = (
        db.table("blocks")
        .select("blocked_id, user_id")
        .or_(f"user_id.eq.{current_user['id']},blocked_id.eq.{current_user['id']}")
        .execute()
    )
    excluded = set()
    for b in blocked_res.data or []:
        excluded.add(b["blocked_id"])
        excluded.add(b["user_id"])
    excluded.discard(current_user["id"])

    candidates = [c for c in candidates if c["user_id"] not in excluded]

    # Score and sort
    scored = []
    for c in candidates:
        score, breakdown = _compute_score(c, prefs)
        scored.append((score, breakdown, c))

    scored.sort(key=lambda x: x[0], reverse=True)
    top = scored[:limit]

    # Attach public photos
    user_ids = [c["user_id"] for _, _, c in top]
    if user_ids:
        photos_res = (
            db.table("photos")
            .select("*")
            .in_("user_id", user_ids)
            .eq("is_public", True)
            .execute()
        )
        photos_by_user: dict[str, list] = {}
        for ph in photos_res.data or []:
            photos_by_user.setdefault(ph["user_id"], []).append(ph)
        for _, _, c in top:
            c["photos"] = photos_by_user.get(c["user_id"], [])

    return [
        {"profile": c, "score": score, "score_breakdown": breakdown}
        for score, breakdown, c in top
    ]
