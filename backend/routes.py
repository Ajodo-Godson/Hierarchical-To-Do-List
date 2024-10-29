from flask import Blueprint, send_from_directory, current_app
from flask_login import login_required

main = Blueprint("main", __name__)


@main.route("/")
def index():
    return send_from_directory(current_app.static_folder, "index.html")


@main.route("/profile")
@login_required
def profile():
    return send_from_directory(current_app.static_folder, "index.html")


@main.route("/<path:path>")
def catch_all(path):
    return send_from_directory(current_app.static_folder, path)
