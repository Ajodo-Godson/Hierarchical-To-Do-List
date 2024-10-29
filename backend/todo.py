from flask import Blueprint, render_template, request, redirect, url_for, jsonify
from flask_login import login_required, current_user
from .models import db, TodoList, TodoItem, Task
from datetime import datetime

todo = Blueprint("todo", __name__)


@todo.route("/")
@login_required
def index():
    todo_lists = TodoList.query.filter_by(owner_id=current_user.id).all()
    return render_template("todo.html", todo_lists=todo_lists)


@todo.route("/list/add", methods=["POST"])
@login_required
def add_list():
    title = request.form.get("title")
    new_list = TodoList(title=title, owner_id=current_user.id)
    # print(new_list, new_list.owner_id)
    db.session.add(new_list)
    db.session.commit()
    return redirect(url_for("todo.index"))


@todo.route("/list/<int:list_id>/add", methods=["POST"])
@login_required
def add_item(list_id):
    todo_list = TodoList.query.get_or_404(list_id)
    if todo_list.owner_id != current_user.id:
        return jsonify(success=False, message="Unauthorized"), 403
    content = request.form.get("content")
    parent_id = request.form.get("parent_id")
    new_item = TodoItem(content=content, list_id=list_id, parent_id=parent_id)
    db.session.add(new_item)
    db.session.commit()
    return redirect(url_for("todo.view_list", list_id=list_id))


@todo.route("/item/toggle/<int:item_id>", methods=["POST"])
@login_required
def toggle_item(item_id):
    item = TodoItem.query.get_or_404(item_id)
    if item.list.owner_id != current_user.id:
        return jsonify(success=False, message="Unauthorized"), 403
    item.completed = not item.completed
    db.session.commit()
    return jsonify(success=True)


@todo.route("/item/delete/<int:item_id>", methods=["POST"])
@login_required
def delete_item(item_id):
    item = TodoItem.query.get_or_404(item_id)
    if item.list.owner_id != current_user.id:
        return jsonify(success=False, message="Unauthorized"), 403
    db.session.delete(item)
    db.session.commit()
    return jsonify(success=True)


@todo.route("/item/edit/<int:item_id>", methods=["POST"])
@login_required
def edit_item(item_id):
    item = TodoItem.query.get_or_404(item_id)
    if item.list.owner_id != current_user.id:
        return jsonify(success=False, message="Unauthorized"), 403
    new_content = request.form.get("content")
    if new_content:
        item.content = new_content
        db.session.commit()
        return jsonify(success=True)
    return jsonify(success=False, message="No content provided"), 400


@todo.route("/item/move/<int:item_id>", methods=["POST"])
@login_required
def move_item(item_id):
    item = TodoItem.query.get_or_404(item_id)
    if item.list.owner_id != current_user.id:
        return jsonify(success=False, message="Unauthorized"), 403
    new_parent_id = request.form.get("parent_id")
    new_list_id = request.form.get("list_id")
    if new_parent_id:
        item.parent_id = int(new_parent_id)
    if new_list_id:
        item.list_id = int(new_list_id)
    db.session.commit()
    return jsonify(success=True)


@todo.route("/list/<int:list_id>")
@login_required
def view_list(list_id):
    todo_list = TodoList.query.get_or_404(list_id)
    if todo_list.owner_id != current_user.id:
        return jsonify(success=False, message="Unauthorized"), 403
    return render_template("todo.html", todo_list=todo_list)


@todo.route("/task/add", methods=["POST"])
@login_required
def add_task():
    title = request.form.get("title")
    description = request.form.get("description")
    new_task = Task(title=title, description=description)
    db.session.add(new_task)
    db.session.commit()
    return redirect(url_for("todo.tasks"))


@todo.route("/tasks")
@login_required
def tasks():
    tasks = Task.query.all()
    return render_template("tasks.html", tasks=tasks)


@todo.route("/task/toggle/<int:task_id>", methods=["POST"])
@login_required
def toggle_task(task_id):
    task = Task.query.get_or_404(task_id)
    task.completed = not task.completed
    task.updated_at = datetime.utcnow()
    db.session.commit()
    return jsonify(success=True)


@todo.route("/task/delete/<int:task_id>", methods=["POST"])
@login_required
def delete_task(task_id):
    task = Task.query.get_or_404(task_id)
    db.session.delete(task)
    db.session.commit()
    return jsonify(success=True)


@todo.route("/task/edit/<int:task_id>", methods=["POST"])
@login_required
def edit_task(task_id):
    task = Task.query.get_or_404(task_id)
    title = request.form.get("title")
    description = request.form.get("description")
    if title:
        task.title = title
    if description:
        task.description = description
    task.updated_at = datetime.utcnow()
    db.session.commit()
    return jsonify(success=True)
