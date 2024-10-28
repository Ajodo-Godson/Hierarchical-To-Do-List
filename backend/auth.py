from flask import Blueprint, render_template, redirect, url_for, request, flash
from werkzeug.security import generate_password_hash, check_password_hash
from flask_login import login_user, login_required, logout_user, current_user
from .models import User
from .base import db

auth = Blueprint("auth", __name__)


@auth.route("/login")
def login():
    if current_user.is_authenticated:
        return redirect(url_for("main.profile"))
    return render_template("login.html")


@auth.route("/signup")
def signup():
    if current_user.is_authenticated:
        return redirect(url_for("main.profile"))
    return render_template("signup.html")


@auth.route("/logout")
@login_required
def logout():
    logout_user()
    return redirect(url_for("main.index"))


@auth.route("/signup", methods=["POST"])
def signup_post():
    email = request.form.get("email")
    name = request.form.get("name")
    password = request.form.get("password")

    print(email, name, password)

    user = User.query.filter_by(email=email).first()
    if user:
        flash("Email address already exists")
        return redirect(url_for("auth.signup"))

    username = create_username(email, name)
    new_user = User(
        email=email,
        name=name,
        username=username,
        hashed_password=generate_password_hash(password, method="pbkdf2:sha256"),
    )

    db.session.add(new_user)
    db.session.commit()
    flash("Account created successfully. Please log in.")
    return redirect(url_for("auth.login"))


@auth.route("/login", methods=["POST"])
def login_post():
    email = request.form.get("email")
    password = request.form.get("password")
    remember = True if request.form.get("remember") else False

    user = User.query.filter_by(email=email).first()

    if not user or not check_password_hash(user.hashed_password, password):
        flash("Please check your login details and try again.")
        return redirect(url_for("auth.login"))

    login_user(user, remember=remember)
    return redirect(url_for("main.profile"))


def create_username(email, name):
    username = email.split("@")[0]
    # username = name.lower()
    existing_user = User.query.filter_by(username=username).first()
    if existing_user:
        base_username = name.lower().replace(" ", "")
        counter = 1
        while User.query.filter_by(username=f"{base_username}{counter}").first():
            counter += 1
        username = f"{base_username}{counter}"
    return username
