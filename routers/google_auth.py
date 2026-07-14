from fastapi import APIRouter, Request, Depends
from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from authlib.integrations.starlette_client import OAuth
from database.db import get_db
from database.models import User, UserRole
from routers.auth import create_token, TOKEN_EXPIRE_HOURS
import os

router = APIRouter()

oauth = OAuth()
oauth.register(
    name="google",
    client_id=os.environ.get("GOOGLE_CLIENT_ID", ""),
    client_secret=os.environ.get("GOOGLE_CLIENT_SECRET", ""),
    server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
    client_kwargs={"scope": "openid email profile"},
)

@router.get("/auth/google")
async def google_login(request: Request):
    redirect_uri = str(request.url_for("google_callback"))
    return await oauth.google.authorize_redirect(request, redirect_uri)

@router.get("/auth/google/callback", name="google_callback")
async def google_callback(request: Request, db: AsyncSession = Depends(get_db)):
    token = await oauth.google.authorize_access_token(request)
    userinfo = token.get("userinfo")
    if not userinfo:
        return RedirectResponse("/login?error=google", status_code=302)

    email = userinfo["email"]
    google_id = userinfo["sub"]
    name = userinfo.get("name", email)
    avatar = userinfo.get("picture", "")

    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()

    if not user:
        user = User(email=email, name=name, google_id=google_id, avatar_url=avatar,
                    role=UserRole.viewer, active=False)
        db.add(user)
        await db.commit()
        await db.refresh(user)
        return RedirectResponse("/login?error=pending", status_code=302)

    if not user.active:
        return RedirectResponse("/login?error=pending", status_code=302)

    if not user.google_id:
        user.google_id = google_id
        user.avatar_url = avatar
        await db.commit()

    token_str = create_token(user.id, user.role.value, user.name or "")
    response = RedirectResponse("/", status_code=302)
    response.set_cookie("access_token", token_str, httponly=True, max_age=TOKEN_EXPIRE_HOURS * 3600)
    return response
