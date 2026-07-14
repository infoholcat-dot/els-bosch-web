from fastapi import APIRouter, Request, Depends
from fastapi.responses import RedirectResponse
from fastapi.templating import Jinja2Templates
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, asc
from database.db import get_db
from database.models import Painting
from routers.auth import get_current_user

router = APIRouter()
templates = Jinja2Templates(directory="templates")

@router.get("/")
async def galeria(request: Request, db: AsyncSession = Depends(get_db)):
    user = get_current_user(request)
    if not user:
        return RedirectResponse("/login", status_code=302)
    result = await db.execute(select(Painting).order_by(asc(Painting.year)))
    paintings = result.scalars().all()
    return templates.TemplateResponse("galeria.html", {"request": request, "user": user, "paintings": paintings})

@router.get("/obra/{id}")
async def obra(request: Request, id: int, db: AsyncSession = Depends(get_db)):
    user = get_current_user(request)
    if not user:
        return RedirectResponse("/login", status_code=302)
    result = await db.execute(select(Painting).where(Painting.id == id))
    painting = result.scalar_one_or_none()
    if not painting:
        return RedirectResponse("/", status_code=302)

    all_result = await db.execute(select(Painting).order_by(asc(Painting.year)))
    all_paintings = all_result.scalars().all()
    ids = [p.id for p in all_paintings]
    idx = ids.index(id) if id in ids else 0
    prev_id = ids[idx - 1] if idx > 0 else None
    next_id = ids[idx + 1] if idx < len(ids) - 1 else None

    return templates.TemplateResponse("obra.html", {
        "request": request, "user": user, "p": painting,
        "prev_id": prev_id, "next_id": next_id
    })
