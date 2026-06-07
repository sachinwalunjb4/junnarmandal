from supabase import create_client, Client
from functools import lru_cache
from .config import get_settings


@lru_cache
def get_supabase() -> Client:
    """Anon-key client – respects RLS."""
    s = get_settings()
    return create_client(s.supabase_url, s.supabase_anon_key)


@lru_cache
def get_admin_supabase() -> Client:
    """Service-role client – bypasses RLS (use only in admin/trusted paths)."""
    s = get_settings()
    return create_client(s.supabase_url, s.supabase_service_role_key)
