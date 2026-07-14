from sqlalchemy import Column, Integer, String, Boolean, Enum, DateTime, Text
from sqlalchemy.sql import func
from database.db import Base
import enum

class UserRole(str, enum.Enum):
    admin = "admin"
    editor = "editor"
    viewer = "viewer"

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True)
    email = Column(String, unique=True, nullable=False)
    name = Column(String)
    google_id = Column(String, unique=True)
    avatar_url = Column(String)
    role = Column(Enum(UserRole), default=UserRole.viewer)
    active = Column(Boolean, default=False)
    created_at = Column(DateTime, server_default=func.now())

class Painting(Base):
    __tablename__ = "paintings"
    id = Column(Integer, primary_key=True)
    title = Column(String)
    year = Column(String)
    technique = Column(String)
    dimensions = Column(String)
    location = Column(String)
    description = Column(Text)
    image_filename = Column(String)
    image_width = Column(Integer)
    image_height = Column(Integer)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
