from fastapi import APIRouter, Request, Depends, UploadFile, File, Form
from fastapi.responses import RedirectResponse
from fastapi.templating import Jinja2Templates
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database.db import get_db
from database.models import Painting, User, UserRole
from routers.auth import get_current_user, require_editor, require_admin
import uuid, os, shutil

router = APIRouter()
templates = Jinja2Templates(directory="templates")
IMAGES_DIR = "/dsv/els-bosch/static/images"

@router.get("/admin")
async def admin_galeria(request: Request, db: AsyncSession = Depends(get_db)):
    user = require_editor(request)
    result = await db.execute(select(Painting).order_by(Painting.year))
    paintings = result.scalars().all()
    users_result = await db.execute(select(User).order_by(User.created_at))
    users = users_result.scalars().all() if user.get("role") == "admin" else []
    return templates.TemplateResponse("admin.html", {"request": request, "user": user, "paintings": paintings, "users": users})

@router.get("/admin/obra/nova")
async def nova_obra_form(request: Request):
    user = require_editor(request)
    return templates.TemplateResponse("admin_obra.html", {"request": request, "user": user, "p": None})

@router.post("/admin/obra/nova")
async def nova_obra(request: Request, db: AsyncSession = Depends(get_db),
    title: str = Form(...), year: str = Form(""), technique: str = Form(""),
    dimensions: str = Form(""), description: str = Form(""),
    image: UploadFile = File(None)):
    user = require_editor(request)
    filename = None
    if image and image.filename:
        ext = os.path.splitext(image.filename)[1].lower()
        filename = f"{uuid.uuid4().hex}{ext}"
        with open(os.path.join(IMAGES_DIR, filename), "wb") as f:
            shutil.copyfileobj(image.file, f)
    p = Painting(title=title, year=year or None, technique=technique or None,
                 dimensions=dimensions or None, description=description or None,
                 image_filename=filename)
    db.add(p)
    await db.commit()
    return RedirectResponse("/admin", status_code=302)

@router.get("/admin/obra/{id}/editar")
async def editar_obra_form(request: Request, id: int, db: AsyncSession = Depends(get_db)):
    user = require_editor(request)
    result = await db.execute(select(Painting).where(Painting.id == id))
    p = result.scalar_one_or_none()
    if not p:
        return RedirectResponse("/admin", status_code=302)
    return templates.TemplateResponse("admin_obra.html", {"request": request, "user": user, "p": p})

@router.post("/admin/obra/{id}/editar")
async def editar_obra(request: Request, id: int, db: AsyncSession = Depends(get_db),
    title: str = Form(...), year: str = Form(""), technique: str = Form(""),
    dimensions: str = Form(""), description: str = Form(""),
    image: UploadFile = File(None)):
    user = require_editor(request)
    result = await db.execute(select(Painting).where(Painting.id == id))
    p = result.scalar_one_or_none()
    if not p:
        return RedirectResponse("/admin", status_code=302)
    p.title = title
    p.year = year or None
    p.technique = technique or None
    p.dimensions = dimensions or None
    p.description = description or None
    if image and image.filename:
        ext = os.path.splitext(image.filename)[1].lower()
        filename = f"{uuid.uuid4().hex}{ext}"
        with open(os.path.join(IMAGES_DIR, filename), "wb") as f:
            shutil.copyfileobj(image.file, f)
        p.image_filename = filename
    await db.commit()
    return RedirectResponse("/admin", status_code=302)

@router.post("/admin/obra/{id}/eliminar")
async def eliminar_obra(request: Request, id: int, db: AsyncSession = Depends(get_db)):
    user = require_admin(request)
    result = await db.execute(select(Painting).where(Painting.id == id))
    p = result.scalar_one_or_none()
    if p:
        if p.image_filename:
            try: os.remove(os.path.join(IMAGES_DIR, p.image_filename))
            except: pass
        await db.delete(p)
        await db.commit()
    return RedirectResponse("/admin", status_code=302)

@router.post("/admin/usuari/{id}/aprovar")
async def aprovar_usuari(request: Request, id: int, db: AsyncSession = Depends(get_db)):
    user = require_admin(request)
    result = await db.execute(select(User).where(User.id == id))
    u = result.scalar_one_or_none()
    if u:
        u.active = True
        await db.commit()
    return RedirectResponse("/admin", status_code=302)

@router.post("/admin/usuari/{id}/rol")
async def canviar_rol(request: Request, id: int, db: AsyncSession = Depends(get_db),
    role: str = Form(...)):
    user = require_admin(request)
    result = await db.execute(select(User).where(User.id == id))
    u = result.scalar_one_or_none()
    if u and role in ["admin", "editor", "viewer"]:
        u.role = UserRole(role)
        await db.commit()
    return RedirectResponse("/admin", status_code=302)
