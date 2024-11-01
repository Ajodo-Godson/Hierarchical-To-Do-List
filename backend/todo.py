from flask import Blueprint, request, jsonify
from .models import db, TodoList, TodoItem
from flask_jwt_extended import jwt_required, get_jwt_identity

todo = Blueprint("todo", __name__)


# Recursively serialize items to build a nested structure
def serialize_items(items, depth=1):
    if depth > 3:  # Limiting depth to 3 levels as per your requirement
        return []
    serialized_items = []
    for item in items:
        serialized_items.append(
            {
                "id": item.id,
                "content": item.content,
                "parent_id": item.parent_id,
                "completed": item.completed,
                "items": serialize_items(
                    TodoItem.query.filter_by(parent_id=item.id).all(), depth + 1
                ),
            }
        )
    return serialized_items


@todo.route("/list/add", methods=["POST"])
@jwt_required()
def add_list():
    current_user_id = get_jwt_identity()
    title = request.json.get("title")
    if not title:
        return jsonify({"success": False, "message": "Title is required"}), 400

    new_list = TodoList(title=title, owner_id=current_user_id)
    db.session.add(new_list)
    db.session.commit()
    return jsonify({"success": True, "list_id": new_list.id}), 200


@todo.route("/list", methods=["GET"])
@jwt_required()
def get_lists():
    current_user_id = get_jwt_identity()
    todo_lists = TodoList.query.filter_by(owner_id=current_user_id).all()

    # Serialize the TodoList objects, with a recursive call to serialize nested items
    lists_data = [
        {
            "id": lst.id,
            "title": lst.title,
            "items": serialize_items(
                TodoItem.query.filter_by(list_id=lst.id, parent_id=None).all()
            ),
        }
        for lst in todo_lists
    ]

    return jsonify({"lists": lists_data}), 200


@todo.route("/list/<int:list_id>/add", methods=["POST"])
@jwt_required()
def add_item(list_id):
    current_user_id = get_jwt_identity()
    todo_list = TodoList.query.get_or_404(list_id)
    if todo_list.owner_id != current_user_id:
        return jsonify({"success": False, "message": "Unauthorized"}), 403

    data = request.json
    content = data.get("content")
    parent_id = data.get("parent_id")
    if not content:
        return jsonify({"success": False, "message": "Content is required"}), 400

    new_item = TodoItem(content=content, list_id=list_id, parent_id=parent_id)
    db.session.add(new_item)
    db.session.commit()
    return (
        jsonify(
            {
                "success": True,
                "item_id": new_item.id,
                "message": "Item added successfully",
            }
        ),
        200,
    )


@todo.route("/item/move", methods=["POST"])
@jwt_required()
def move_item():
    current_user_id = get_jwt_identity()
    data = request.json
    item_id = data.get("item_id")
    new_parent_id = data.get("new_parent_id")

    item = TodoItem.query.get_or_404(item_id)
    if item.list.owner_id != current_user_id:
        return jsonify({"success": False, "message": "Unauthorized"}), 403

    # Update the item's parent ID
    item.parent_id = new_parent_id
    db.session.commit()
    return jsonify({"success": True, "message": "Item moved successfully"}), 200


@todo.route("/item/<int:parent_id>/add_subtask", methods=["POST"])
@jwt_required()
def add_subtask(parent_id):
    current_user_id = get_jwt_identity()
    parent_item = TodoItem.query.get_or_404(parent_id)

    if parent_item.list.owner_id != current_user_id:
        return jsonify({"success": False, "message": "Unauthorized"}), 403

    content = request.json.get("content")
    if not content:
        return jsonify({"success": False, "message": "Content is required"}), 400

    new_item = TodoItem(
        content=content, list_id=parent_item.list_id, parent_id=parent_id
    )
    db.session.add(new_item)
    db.session.commit()
    return (
        jsonify(
            {
                "success": True,
                "item_id": new_item.id,
                "message": "Subtask added successfully",
            }
        ),
        200,
    )


@todo.route("/item/toggle/<int:item_id>", methods=["POST"])
@jwt_required()
def toggle_item(item_id):
    current_user_id = get_jwt_identity()
    item = TodoItem.query.get_or_404(item_id)
    if item.list.owner_id != current_user_id:
        return jsonify({"success": False, "message": "Unauthorized"}), 403

    item.completed = not item.completed
    db.session.commit()
    return jsonify({"success": True})


@todo.route("/item/delete/<int:item_id>", methods=["POST"])
@jwt_required()
def delete_item(item_id):
    current_user_id = get_jwt_identity()
    item = TodoItem.query.get_or_404(item_id)
    if item.list.owner_id != current_user_id:
        return jsonify({"success": False, "message": "Unauthorized"}), 403

    # Delete all child items first to maintain consistency
    delete_children(item)
    db.session.delete(item)
    db.session.commit()
    return jsonify({"message": "Item deleted successfully"}), 200


def delete_children(item):
    """Recursively delete all children of an item"""
    children = TodoItem.query.filter_by(parent_id=item.id).all()
    for child in children:
        delete_children(child)
        db.session.delete(child)


@todo.route("/item/edit/<int:item_id>", methods=["POST"])
@jwt_required()
def edit_item(item_id):
    current_user_id = get_jwt_identity()
    item = TodoItem.query.get_or_404(item_id)
    if item.list.owner_id != current_user_id:
        return jsonify({"success": False, "message": "Unauthorized"}), 403

    content = request.json.get("content")
    if not content:
        return jsonify({"success": False, "message": "Content is required"}), 400

    item.content = content
    db.session.commit()
    return jsonify({"success": True})


@todo.route("/item/toggle_complete/<int:item_id>", methods=["POST"])
@jwt_required()
def toggle_complete(item_id):
    current_user_id = get_jwt_identity()
    item = TodoItem.query.get_or_404(item_id)
    if item.list.owner_id != current_user_id:
        return jsonify({"success": False, "message": "Unauthorized"}), 403

    item.completed = not item.completed
    db.session.commit()
    return jsonify({"success": True})
