# routes.py
from flask import Blueprint, render_template, current_app
from flask_login import login_required, current_user
from .models import TodoList

main = Blueprint("main", __name__)


@main.route("/")
def index():
    return render_template("index.html")


@main.route("/dashboard")
@login_required
def dashboard():
    return render_template("dashboard.html")
