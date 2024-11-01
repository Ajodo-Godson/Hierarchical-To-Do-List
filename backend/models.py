from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from flask_login import UserMixin
from . import db, login_manager


# User loader callback for Flask-Login
@login_manager.user_loader
def load_user(user):
    # Load the user from the database by ID
    return User.query.get(int(user))


# User model representing the 'users' table
class User(UserMixin, db.Model):
    __tablename__ = "users"
    id = Column(
        Integer, primary_key=True, index=True
    )  # Unique identifier for each user
    email = Column(
        String, unique=True, index=True
    )  # User's email address (must be unique)
    name = Column(String)  # User's full name
    username = Column(
        String, unique=True, index=True
    )  # Username for login (must be unique)
    password = Column(String)  # Hashed password for security
    is_active = Column(
        Boolean, default=True
    )  # Indicates if the user's account is active
    lists = relationship(
        "TodoList", back_populates="owner"
    )  # One-to-many relationship to TodoList

    def get_id(self):
        # Return the user's ID as a string (required by Flask-Login)
        return str(self.id)


# TodoList model representing the 'todo_lists' table
class TodoList(db.Model):
    __tablename__ = "todo_lists"
    id = Column(
        Integer, primary_key=True, index=True
    )  # Unique identifier for each todo list
    title = Column(String, index=True, nullable=False)  # Title of the todo list
    owner_id = Column(
        Integer, ForeignKey("users.id")
    )  # Foreign key linking to the User table
    owner = relationship(
        "User", back_populates="lists"
    )  # Many-to-one relationship to User
    items = relationship(
        "TodoItem", back_populates="list"
    )  # One-to-many relationship to TodoItem


# TodoItem model representing the 'todo_items' table
class TodoItem(db.Model):
    __tablename__ = "todo_items"
    id = Column(
        Integer, primary_key=True, index=True
    )  # Unique identifier for each todo item
    content = Column(String, index=True)  # Description or content of the todo item
    completed = Column(
        Boolean, default=False
    )  # Status indicating if the item is completed
    list_id = Column(
        Integer, ForeignKey("todo_lists.id")
    )  # Foreign key linking to the TodoList table
    list = relationship(
        "TodoList", back_populates="items"
    )  # Many-to-one relationship to TodoList
    parent_id = Column(
        Integer, ForeignKey("todo_items.id")
    )  # Self-referential foreign key for subtasks
    children = relationship("TodoItem")  # One-to-many relationship to subtasks
