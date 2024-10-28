from .base import db
from datetime import datetime


class User(db.Model):
    __tablename__ = "users"
    id = db.Column(db.Integer, primary_key=True, index=True)
    email = db.Column(db.String, unique=True, index=True)
    name = db.Column(db.String)
    username = db.Column(db.String, unique=True, index=True)
    hashed_password = db.Column(db.String)
    lists = db.relationship("TodoList", back_populates="owner")


class TodoList(db.Model):
    __tablename__ = "todo_lists"
    id = db.Column(db.Integer, primary_key=True, index=True)
    title = db.Column(db.String, index=True)
    owner_id = db.Column(db.Integer, db.ForeignKey("users.id"))
    owner = db.relationship("User", back_populates="lists")
    items = db.relationship("TodoItem", back_populates="list")


class TodoItem(db.Model):
    __tablename__ = "todo_items"
    id = db.Column(db.Integer, primary_key=True, index=True)
    content = db.Column(db.String, index=True)
    completed = db.Column(db.Boolean, default=False)
    list_id = db.Column(db.Integer, db.ForeignKey("todo_lists.id"))
    list = db.relationship("TodoList", back_populates="items")
    parent_id = db.Column(db.Integer, db.ForeignKey("todo_items.id"))
    children = db.relationship("TodoItem")


class Task(db.Model):
    __tablename__ = "tasks"
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100))
    description = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(
        db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )
    completed = db.Column(db.Boolean, default=False)

    def __repr__(self):
        return self.title
