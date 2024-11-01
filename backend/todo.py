from flask import Blueprint, request, jsonify
from .models import db, TodoList, TodoItem
from flask_jwt_extended import jwt_required, get_jwt_identity

# Create a Blueprint for the todo routes
todo = Blueprint("todo", __name__)


# Function to recursively serialize items to build a nested structure
def serialize_items(items, depth=1):
    if depth > 3:  # Limiting depth to 3 levels to prevent infinite recursion
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


# Route to add a new todo list
@todo.route("/list/add", methods=["POST"])
@jwt_required()
def add_list():
    current_user_id = get_jwt_identity()  # Get the ID of the current user
    title = request.json.get("title")  # Get the list title from the request
    if not title:
        return jsonify({"success": False, "message": "Title is required"}), 400

    # Create a new TodoList instance and save it to the database
    new_list = TodoList(title=title, owner_id=current_user_id)
    db.session.add(new_list)
    db.session.commit()
    return jsonify({"success": True, "list_id": new_list.id}), 200


# Route to get all todo lists for the current user
@todo.route("/list", methods=["GET"])
@jwt_required()
def get_lists():
    current_user_id = get_jwt_identity()
    # Query all TodoList instances owned by the current user
    todo_lists = TodoList.query.filter_by(owner_id=current_user_id).all()

    # Serialize each TodoList, including its items and nested subtasks
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


# Route to add a new item to a specific list
@todo.route("/list/<int:list_id>/add", methods=["POST"])
@jwt_required()
def add_item(list_id):
    current_user_id = get_jwt_identity()
    # Get the TodoList or return a 404 error if not found
    todo_list = TodoList.query.get_or_404(list_id)
    # Check if the current user owns the list
    if todo_list.owner_id != current_user_id:
        return jsonify({"success": False, "message": "Unauthorized"}), 403

    data = request.json
    content = data.get("content")
    parent_id = data.get("parent_id")  # For adding subtasks
    if not content:
        return jsonify({"success": False, "message": "Content is required"}), 400

    # Create a new TodoItem and associate it with the list (and parent item if any)
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


# Route to move an item to a different parent (re-parenting)
@todo.route("/item/move", methods=["POST"])
@jwt_required()
def move_item():
    current_user_id = get_jwt_identity()
    data = request.json
    item_id = data.get("item_id")
    new_parent_id = data.get("new_parent_id")

    # Get the item to move
    item = TodoItem.query.get_or_404(item_id)
    # Check if the current user owns the list containing the item
    if item.list.owner_id != current_user_id:
        return jsonify({"success": False, "message": "Unauthorized"}), 403

    # Update the item's parent ID to move it under a new parent
    item.parent_id = new_parent_id
    db.session.commit()
    return jsonify({"success": True, "message": "Item moved successfully"}), 200


# Route to update a todo list's title and items
@todo.route("/list/update", methods=["POST"])
@jwt_required()
def update_list():
    current_user_id = get_jwt_identity()
    data = request.json
    list_id = data.get("id")
    new_title = data.get("title")
    new_items = data.get("items")

    # Get the TodoList to update
    todo_list = TodoList.query.get_or_404(list_id)
    # Check if the current user owns the list
    if todo_list.owner_id != current_user_id:
        return jsonify({"success": False, "message": "Unauthorized"}), 403

    # Update the title if provided
    if new_title:
        todo_list.title = new_title

    # Update items if provided
    if new_items is not None:
        for item_data in new_items:
            item = TodoItem.query.get(item_data["id"])
            if item and item.list_id == list_id:
                # Update item attributes
                item.content = item_data.get("content", item.content)
                item.completed = item_data.get("completed", item.completed)
                item.parent_id = item_data.get("parent_id", item.parent_id)

    db.session.commit()
    return jsonify({"success": True, "message": "List updated successfully"}), 200


# Route to add a subtask to a parent item
@todo.route("/item/<int:parent_id>/add_subtask", methods=["POST"])
@jwt_required()
def add_subtask(parent_id):
    current_user_id = get_jwt_identity()
    # Get the parent item or return a 404 error if not found
    parent_item = TodoItem.query.get_or_404(parent_id)

    # Check if the current user owns the list containing the parent item
    if parent_item.list.owner_id != current_user_id:
        return jsonify({"success": False, "message": "Unauthorized"}), 403

    content = request.json.get("content")
    if not content:
        return jsonify({"success": False, "message": "Content is required"}), 400

    # Create a new TodoItem as a subtask of the parent item
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


# Route to toggle the completion status of an item
@todo.route("/item/toggle/<int:item_id>", methods=["POST"])
@jwt_required()
def toggle_item(item_id):
    current_user_id = get_jwt_identity()
    # Get the item to toggle
    item = TodoItem.query.get_or_404(item_id)
    # Check if the current user owns the list containing the item
    if item.list.owner_id != current_user_id:
        return jsonify({"success": False, "message": "Unauthorized"}), 403

    # Toggle the completion status
    item.completed = not item.completed
    db.session.commit()
    return jsonify({"success": True})


# Route to delete a todo list and all its items
@todo.route("/list/delete/<int:list_id>", methods=["POST"])
@jwt_required()
def delete_list(list_id):
    current_user_id = get_jwt_identity()
    # Get the TodoList to delete
    todo_list = TodoList.query.get_or_404(list_id)
    # Check if the current user owns the list
    if todo_list.owner_id != current_user_id:
        return jsonify({"success": False, "message": "Unauthorized"}), 403

    # Delete all items associated with the list
    TodoItem.query.filter_by(list_id=list_id).delete()
    # Delete the list itself
    db.session.delete(todo_list)
    db.session.commit()

    return jsonify({"message": "List deleted successfully"}), 200


# Route to delete an item and all its subtasks
@todo.route("/item/delete/<int:item_id>", methods=["POST"])
@jwt_required()
def delete_item(item_id):
    current_user_id = get_jwt_identity()
    # Get the item to delete
    item = TodoItem.query.get_or_404(item_id)
    # Check if the current user owns the list containing the item
    if item.list.owner_id != current_user_id:
        return jsonify({"success": False, "message": "Unauthorized"}), 403

    # Recursively delete all child items
    delete_children(item)
    # Delete the item itself
    db.session.delete(item)
    db.session.commit()
    return jsonify({"message": "Item deleted successfully"}), 200


def delete_children(item):
    """Recursively delete all children of an item"""
    # Get all children of the current item
    children = TodoItem.query.filter_by(parent_id=item.id).all()
    for child in children:
        # Recursively delete each child's children
        delete_children(child)
        # Delete the child item
        db.session.delete(child)


# Route to edit an item's content
@todo.route("/item/edit/<int:item_id>", methods=["POST"])
@jwt_required()
def edit_item(item_id):
    current_user_id = get_jwt_identity()
    # Get the item to edit
    item = TodoItem.query.get_or_404(item_id)
    # Check if the current user owns the list containing the item
    if item.list.owner_id != current_user_id:
        return jsonify({"success": False, "message": "Unauthorized"}), 403

    content = request.json.get("content")
    if not content:
        return jsonify({"success": False, "message": "Content is required"}), 400

    # Update the item's content
    item.content = content
    db.session.commit()
    return jsonify({"success": True})


# Route to toggle the completion status of an item (duplicate route)
@todo.route("/item/toggle_complete/<int:item_id>", methods=["POST"])
@jwt_required()
def toggle_complete(item_id):
    current_user_id = get_jwt_identity()
    # Get the item to toggle
    item = TodoItem.query.get_or_404(item_id)
    # Check if the current user owns the list containing the item
    if item.list.owner_id != current_user_id:
        return jsonify({"success": False, "message": "Unauthorized"}), 403

    # Toggle the completion status
    item.completed = not item.completed
    db.session.commit()
    return jsonify({"success": True})
