from __future__ import annotations
from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, field_validator, model_validator
import re


# ---------------------------------------------------------------------------
# Auth
# ---------------------------------------------------------------------------
class SignupRequest(BaseModel):
    email: EmailStr
    password: str
    name: str

    @field_validator("password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class PasswordResetRequest(BaseModel):
    email: EmailStr


class PasswordUpdateRequest(BaseModel):
    new_password: str

    @field_validator("new_password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v


# ---------------------------------------------------------------------------
# Profile
# ---------------------------------------------------------------------------
class ProfileCreate(BaseModel):
    name: str
    gender: str
    date_of_birth: date
    height_cm: Optional[int] = None
    marital_status: str = "never_married"
    mother_tongue: str = "Marathi"
    religion: str = "Hindu"
    community: Optional[str] = None
    city: Optional[str] = None
    about_me: Optional[str] = None
    qualification: Optional[str] = None
    profession: Optional[str] = None
    annual_income: Optional[str] = None
    family_type: Optional[str] = None
    father_occupation: Optional[str] = None
    mother_occupation: Optional[str] = None
    siblings_count: int = 0
    contact_name: Optional[str] = None
    contact_type: Optional[str] = None
    contact_mobile: Optional[str] = None

    @field_validator("gender")
    @classmethod
    def validate_gender(cls, v: str) -> str:
        if v not in ("male", "female", "other"):
            raise ValueError("gender must be male, female, or other")
        return v

    @field_validator("marital_status")
    @classmethod
    def validate_marital_status(cls, v: str) -> str:
        valid = {"never_married", "divorced", "widowed", "awaiting_divorce"}
        if v not in valid:
            raise ValueError(f"marital_status must be one of {valid}")
        return v

    @field_validator("height_cm")
    @classmethod
    def validate_height(cls, v: Optional[int]) -> Optional[int]:
        if v is not None and not (100 <= v <= 250):
            raise ValueError("height_cm must be between 100 and 250")
        return v


class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    height_cm: Optional[int] = None
    marital_status: Optional[str] = None
    mother_tongue: Optional[str] = None
    religion: Optional[str] = None
    community: Optional[str] = None
    city: Optional[str] = None
    about_me: Optional[str] = None
    qualification: Optional[str] = None
    profession: Optional[str] = None
    annual_income: Optional[str] = None
    family_type: Optional[str] = None
    father_occupation: Optional[str] = None
    mother_occupation: Optional[str] = None
    siblings_count: Optional[int] = None
    contact_name: Optional[str] = None
    contact_type: Optional[str] = None
    contact_mobile: Optional[str] = None


class ProfileOut(BaseModel):
    id: str
    user_id: str
    name: str
    gender: str
    date_of_birth: date
    height_cm: Optional[int]
    marital_status: str
    mother_tongue: str
    religion: str
    community: Optional[str]
    city: Optional[str]
    about_me: Optional[str]
    qualification: Optional[str]
    profession: Optional[str]
    annual_income: Optional[str]
    family_type: Optional[str]
    father_occupation: Optional[str]
    mother_occupation: Optional[str]
    siblings_count: int
    contact_name: Optional[str]
    contact_type: Optional[str]
    contact_mobile: Optional[str]
    is_approved: bool
    last_active: Optional[datetime]
    created_at: datetime
    photos: list[PhotoOut] = []

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Partner Preferences
# ---------------------------------------------------------------------------
class PreferenceCreate(BaseModel):
    min_age: int = 18
    max_age: int = 50
    min_height_cm: Optional[int] = None
    max_height_cm: Optional[int] = None
    religion: Optional[str] = None
    community: Optional[str] = None
    education: Optional[str] = None
    location: Optional[str] = None
    marital_status: Optional[list[str]] = None

    @model_validator(mode="after")
    def check_age_range(self) -> "PreferenceCreate":
        if self.min_age > self.max_age:
            raise ValueError("min_age cannot be greater than max_age")
        return self


class PreferenceOut(PreferenceCreate):
    id: str
    user_id: str
    created_at: datetime
    updated_at: datetime


# ---------------------------------------------------------------------------
# Photos
# ---------------------------------------------------------------------------
class PhotoOut(BaseModel):
    id: str
    user_id: str
    storage_path: str
    is_primary: bool
    is_public: bool
    created_at: datetime


class PhotoPrivacyUpdate(BaseModel):
    is_public: bool


# ---------------------------------------------------------------------------
# Interests
# ---------------------------------------------------------------------------
class InterestCreate(BaseModel):
    receiver_id: str


class InterestStatusUpdate(BaseModel):
    status: str

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: str) -> str:
        if v not in ("accepted", "declined"):
            raise ValueError("status must be accepted or declined")
        return v


class InterestOut(BaseModel):
    id: str
    sender_id: str
    receiver_id: str
    status: str
    created_at: datetime
    updated_at: datetime
    sender_profile: Optional[ProfileOut] = None
    receiver_profile: Optional[ProfileOut] = None


# ---------------------------------------------------------------------------
# Shortlists
# ---------------------------------------------------------------------------
class ShortlistCreate(BaseModel):
    target_id: str


class ShortlistOut(BaseModel):
    id: str
    user_id: str
    target_id: str
    created_at: datetime
    profile: Optional[ProfileOut] = None


# ---------------------------------------------------------------------------
# Blocks
# ---------------------------------------------------------------------------
class BlockCreate(BaseModel):
    blocked_id: str


class BlockOut(BaseModel):
    id: str
    user_id: str
    blocked_id: str
    created_at: datetime


# ---------------------------------------------------------------------------
# Reports
# ---------------------------------------------------------------------------
class ReportCreate(BaseModel):
    reported_id: str
    reason: str
    details: Optional[str] = None

    @field_validator("reason")
    @classmethod
    def reason_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("reason cannot be empty")
        return v.strip()


class ReportOut(BaseModel):
    id: str
    reporter_id: str
    reported_id: str
    reason: str
    details: Optional[str]
    status: str
    admin_note: Optional[str]
    created_at: datetime


class ReportResolve(BaseModel):
    status: str
    admin_note: Optional[str] = None

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: str) -> str:
        if v not in ("resolved", "dismissed"):
            raise ValueError("status must be resolved or dismissed")
        return v


# ---------------------------------------------------------------------------
# Messages
# ---------------------------------------------------------------------------
class MessageCreate(BaseModel):
    receiver_id: str
    body: str

    @field_validator("body")
    @classmethod
    def body_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("message body cannot be empty")
        return v.strip()


class MessageOut(BaseModel):
    id: str
    sender_id: str
    receiver_id: str
    body: str
    is_read: bool
    created_at: datetime


# ---------------------------------------------------------------------------
# Match score
# ---------------------------------------------------------------------------
class MatchOut(BaseModel):
    profile: ProfileOut
    score: float
    score_breakdown: dict[str, float]


# ---------------------------------------------------------------------------
# Pagination
# ---------------------------------------------------------------------------
class PaginatedProfiles(BaseModel):
    items: list[ProfileOut]
    total: int
    page: int
    page_size: int
    pages: int


# ---------------------------------------------------------------------------
# Admin
# ---------------------------------------------------------------------------
class AdminUserOut(BaseModel):
    id: str
    email: str
    phone: Optional[str]
    is_admin: bool
    is_active: bool
    created_at: datetime
    profile: Optional[ProfileOut] = None


class AdminProfileAction(BaseModel):
    is_approved: bool


class AdminUserAction(BaseModel):
    is_active: bool
