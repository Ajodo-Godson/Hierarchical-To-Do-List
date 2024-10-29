from flask import Blueprint, request, jsonify, redirect, url_for
from flask_login import login_required, current_user
from .models import db, TodoList, TodoItem

todo = Blueprint("todo", __name__)


@todo.route("/list/add", methods=["POST"])
@login_required
def add_list():
    title = request.json.get("title")
    if not title:
        return jsonify({"success": False, "message": "Title is required"}), 400

    new_list = TodoList(title=title, owner_id=current_user.id)
    db.session.add(new_list)
    db.session.commit()
    return jsonify({"success": True, "list_id": new_list.id}), 200


@todo.route("/list/<int:list_id>/add", methods=["POST"])
@login_required
def add_item(list_id):
    todo_list = TodoList.query.get_or_404(list_id)
    if todo_list.owner_id != current_user.id:
        return jsonify({"success": False, "message": "Unauthorized"}), 403

    data = request.json
    content = data.get("content")
    if not content:
        return jsonify({"success": False, "message": "Content is required"}), 400

    new_item = TodoItem(content=content, list_id=list_id)
    db.session.add(new_item)
    db.session.commit()
    return jsonify({"success": True, "message": "Item added successfully"}), 200


@todo.route("/item/toggle/<int:item_id>", methods=["POST"])
@login_required
def toggle_item(item_id):
    item = TodoItem.query.get_or_404(item_id)
    if item.list.owner_id != current_user.id:
        return jsonify({"success": False, "message": "Unauthorized"}), 403

    item.completed = not item.completed
    db.session.commit()
    return jsonify({"success": True})


@todo.route("/item/delete/<int:item_id>", methods=["POST"])
@login_required
def delete_item(item_id):
    item = TodoItem.query.get_or_404(item_id)
    if item.list.owner_id != current_user.id:
        return jsonify({"success": False, "message": "Unauthorized"}), 403

    db.session.delete(item)
    db.session.commit()
    return redirect(url_for("main.dashboard"))


@todo.route("/item/edit/<int:item_id>", methods=["POST"])
@login_required
def edit_item(item_id):
    item = TodoItem.query.get_or_404(item_id)
    if item.list.owner_id != current_user.id:
        return jsonify({"success": False, "message": "Unauthorized"}), 403

    content = request.form.get("content")
    if not content:
        return jsonify({"success": False, "message": "Content is required"}), 400

    item.content = content
    db.session.commit()
    return jsonify({"success": True})
