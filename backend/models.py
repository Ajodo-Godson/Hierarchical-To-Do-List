from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from flask_login import UserMixin
from . import db, login_manager


@login_manager.user_loader
def load_user(user):
    return User.query.get(int(user))


class User(UserMixin, db.Model):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    name = Column(String)
    username = Column(String, unique=True, index=True)
    password = Column(String)
    is_active = Column(Boolean, default=True)
    lists = relationship("TodoList", back_populates="owner")

    def get_id(self):
        return str(self.id)


class TodoList(db.Model):
    __tablename__ = "todo_lists"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True, nullable=False)
    owner_id = Column(Integer, ForeignKey("users.id"))
    owner = relationship("User", back_populates="lists")
    items = relationship("TodoItem", back_populates="list")


class TodoItem(db.Model):
    __tablename__ = "todo_items"
    id = Column(Integer, primary_key=True, index=True)
    content = Column(String, index=True)
    completed = Column(Boolean, default=False)
    list_id = Column(Integer, ForeignKey("todo_lists.id"))
    list = relationship("TodoList", back_populates="items")
    parent_id = Column(Integer, ForeignKey("todo_items.id"))
    children = relationship("TodoItem")


class Task(db.Model):
    __tablename__ = "tasks"
    id = Column(Integer, primary_key=True)
    title = Column(String(100))
    description = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    completed = Column(Boolean, default=False)

    def __repr__(self):
        return self.title
