from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from starlette.middleware.sessions import SessionMiddleware
from database.db import init_db
from routers import auth, google_auth, galeria, admin
import os

app = FastAPI(title="Els Bosch", docs_url=None, redoc_url=None)

app.add_middleware(
    SessionMiddleware,
    secret_key=os.environ.get("SECRET_KEY", "dev-secret"),
)

app.mount("/static", StaticFiles(directory="static"), name="static")

app.include_router(auth.router)
app.include_router(google_auth.router)
app.include_router(galeria.router)
app.include_router(admin.router)

@app.on_event("startup")
async def startup():
    await init_db()
