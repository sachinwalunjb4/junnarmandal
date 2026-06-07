import smtplib
import asyncio
import logging
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from functools import partial
from .config import get_settings

logger = logging.getLogger(__name__)


def _send_smtp(to_email: str, subject: str, html_body: str) -> None:
    settings = get_settings()
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = settings.email_from or settings.email_user
    msg["To"] = to_email
    msg.attach(MIMEText(html_body, "html"))

    # Port 465 uses implicit SSL (SMTP_SSL); port 587 uses STARTTLS.
    # Windows firewalls often block 587 — try SSL first, fall back to STARTTLS.
    if settings.email_port == 465:
        with smtplib.SMTP_SSL(settings.email_host, settings.email_port) as server:
            server.login(settings.email_user, settings.email_password)
            server.sendmail(msg["From"], to_email, msg.as_string())
    else:
        with smtplib.SMTP(settings.email_host, settings.email_port) as server:
            server.ehlo()
            server.starttls()
            server.login(settings.email_user, settings.email_password)
            server.sendmail(msg["From"], to_email, msg.as_string())


async def send_verification_email(email: str, name: str, token: str) -> None:
    settings = get_settings()
    if not settings.email_user:
        logger.info("EMAIL_USER not set — skipping verification email for %s", email)
        return

    verify_url = f"{settings.frontend_url}/verify-email?token={token}"
    subject = "Verify your email – Junnar Lagna Mandal"
    html = f"""
    <html>
    <body style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:24px">
      <h2 style="color:#c0392b">Junnar Lagna Mandal</h2>
      <p>Hello <strong>{name}</strong>,</p>
      <p>Thank you for registering. Please verify your email address by clicking the button below:</p>
      <p style="margin:32px 0">
        <a href="{verify_url}"
           style="background:#c0392b;color:white;padding:12px 28px;text-decoration:none;border-radius:4px;font-weight:bold">
          Verify Email
        </a>
      </p>
      <p style="color:#666;font-size:13px">Or copy this link into your browser:<br>{verify_url}</p>
      <p style="color:#666;font-size:13px">This link expires in 24 hours.</p>
      <hr style="border:none;border-top:1px solid #eee;margin:24px 0">
      <p style="color:#999;font-size:12px">Junnar Lagna Mandal — Junnar Taluka Matrimony Platform</p>
    </body>
    </html>
    """

    try:
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(None, partial(_send_smtp, email, subject, html))
        logger.info("Verification email sent to %s", email)
    except Exception as exc:
        logger.error("Failed to send verification email to %s: %s", email, exc)
        raise
