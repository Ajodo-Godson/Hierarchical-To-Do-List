from flask import Blueprint, request, jsonify
from .models import db, TodoList, TodoItem
from flask_jwt_extended import jwt_required, get_jwt_identity

# Create a Blueprint for grouping the todo-related routes
todo = Blueprint("todo", __name__)


# Function to recursively serialize items to build a nested structure
def serialize_items(items, depth=1):
    if depth > 3:  # Limit nesting to 3 levels to prevent infinite recursion
        return []
    serialized_items = []
    for item in items:
        serialized_items.append(
            {
                "id": item.id,
                "content": item.content,
                "parent_id": item.parent_id,
                "completed": item.completed,
                # Recursively serialize child items
                "items": serialize_items(
                    TodoItem.query.filter_by(parent_id=item.id).all(), depth + 1
                ),
            }
        )
    return serialized_items


# Route to add a new todo list
@todo.route("/list/add", methods=["POST"])
@jwt_required()  # Require JWT authentication
def add_list():
    current_user_id = get_jwt_identity()  # Get the ID of the current user from the JWT
    title = request.json.get("title")  # Extract the list title from the request body
    if not title:
        # Return an error response if the title is missing
        return jsonify({"success": False, "message": "Title is required"}), 400

    # Create a new TodoList instance and associate it with the current user
    new_list = TodoList(title=title, owner_id=current_user_id)
    db.session.add(new_list)  # Add the new list to the database session
    db.session.commit()  # Commit the session to save changes
    # Return a success response with the new list's ID
    return jsonify({"success": True, "list_id": new_list.id}), 200


# Route to retrieve all todo lists for the current user
@todo.route("/list", methods=["GET"])
@jwt_required()  # Require JWT authentication
def get_lists():
    current_user_id = get_jwt_identity()  # Get the current user's ID
    # Query all TodoList instances owned by the current user
    todo_lists = TodoList.query.filter_by(owner_id=current_user_id).all()

    # Serialize each TodoList, including its items and nested subtasks
    lists_data = [
        {
            "id": lst.id,
            "title": lst.title,
            # Serialize top-level items (those without a parent)
            "items": serialize_items(
                TodoItem.query.filter_by(list_id=lst.id, parent_id=None).all()
            ),
        }
        for lst in todo_lists
    ]

    # Return the serialized lists as a JSON response
    return jsonify({"lists": lists_data}), 200


# Route to add a new item to a specific list
@todo.route("/list/<int:list_id>/add", methods=["POST"])
@jwt_required()  # Require JWT authentication
def add_item(list_id):
    current_user_id = get_jwt_identity()  # Get the current user's ID
    # Retrieve the TodoList or return a 404 error if not found
    todo_list = TodoList.query.get_or_404(list_id)
    # Verify that the current user owns the list
    if todo_list.owner_id != current_user_id:
        # Return an unauthorized error if the user doesn't own the list
        return jsonify({"success": False, "message": "Unauthorized"}), 403

    data = request.json
    content = data.get("content")  # Get the item's content from the request body
    parent_id = data.get("parent_id")  # Get the parent item ID for subtasks (if any)
    if not content:
        # Return an error if the content is missing
        return jsonify({"success": False, "message": "Content is required"}), 400

    # Create a new TodoItem and associate it with the list and parent (if provided)
    new_item = TodoItem(content=content, list_id=list_id, parent_id=parent_id)
    db.session.add(new_item)  # Add the new item to the database session
    db.session.commit()  # Commit the session to save changes
    # Return a success response with the new item's ID
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


# Route to move an item to a different parent (change its position in the hierarchy)
@todo.route("/item/move", methods=["POST"])
@jwt_required()  # Require JWT authentication
def move_item():
    current_user_id = get_jwt_identity()  # Get the current user's ID
    data = request.json
    item_id = data.get("item_id")  # ID of the item to move
    new_parent_id = data.get("new_parent_id")  # ID of the new parent item

    # Retrieve the item to move or return a 404 error if not found
    item = TodoItem.query.get_or_404(item_id)
    # Verify that the current user owns the list containing the item
    if item.list.owner_id != current_user_id:
        # Return an unauthorized error if the user doesn't own the item
        return jsonify({"success": False, "message": "Unauthorized"}), 403

    # Update the item's parent ID to move it under a new parent
    item.parent_id = new_parent_id
    db.session.commit()  # Commit the session to save changes
    # Return a success response indicating the item was moved
    return jsonify({"success": True, "message": "Item moved successfully"}), 200


# Route to update a todo list's title and its items
@todo.route("/list/update", methods=["POST"])
@jwt_required()  # Require JWT authentication
def update_list():
    current_user_id = get_jwt_identity()  # Get the current user's ID
    data = request.json
    list_id = data.get("id")  # ID of the list to update
    new_title = data.get("title")  # New title for the list
    new_items = data.get("items")  # List of items to update

    # Retrieve the TodoList or return a 404 error if not found
    todo_list = TodoList.query.get_or_404(list_id)
    # Verify that the current user owns the list
    if todo_list.owner_id != current_user_id:
        # Return an unauthorized error if the user doesn't own the list
        return jsonify({"success": False, "message": "Unauthorized"}), 403

    # Update the list's title if a new one is provided
    if new_title:
        todo_list.title = new_title

    # Update the items if provided
    if new_items is not None:
        for item_data in new_items:
            item = TodoItem.query.get(item_data["id"])  # Get the item by ID
            if item and item.list_id == list_id:
                # Update item attributes with new values or keep existing ones
                item.content = item_data.get("content", item.content)
                item.completed = item_data.get("completed", item.completed)
                item.parent_id = item_data.get("parent_id", item.parent_id)

    db.session.commit()  # Commit the session to save changes
    # Return a success response indicating the list was updated
    return jsonify({"success": True, "message": "List updated successfully"}), 200


# Route to add a subtask to a parent item
@todo.route("/item/<int:parent_id>/add_subtask", methods=["POST"])
@jwt_required()  # Require JWT authentication
def add_subtask(parent_id):
    current_user_id = get_jwt_identity()  # Get the current user's ID
    # Retrieve the parent item or return a 404 error if not found
    parent_item = TodoItem.query.get_or_404(parent_id)

    # Verify that the current user owns the list containing the parent item
    if parent_item.list.owner_id != current_user_id:
        # Return an unauthorized error if the user doesn't own the parent item
        return jsonify({"success": False, "message": "Unauthorized"}), 403

    content = request.json.get("content")  # Get the subtask's content from the request
    if not content:
        # Return an error if the content is missing
        return jsonify({"success": False, "message": "Content is required"}), 400

    # Create a new TodoItem as a subtask under the parent item
    new_item = TodoItem(
        content=content, list_id=parent_item.list_id, parent_id=parent_id
    )
    db.session.add(new_item)  # Add the new subtask to the database session
    db.session.commit()  # Commit the session to save changes
    # Return a success response with the new subtask's ID
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
@jwt_required()  # Require JWT authentication
def toggle_item(item_id):
    current_user_id = get_jwt_identity()  # Get the current user's ID
    # Retrieve the item to toggle or return a 404 error if not found
    item = TodoItem.query.get_or_404(item_id)
    # Verify that the current user owns the list containing the item
    if item.list.owner_id != current_user_id:
        # Return an unauthorized error if the user doesn't own the item
        return jsonify({"success": False, "message": "Unauthorized"}), 403

    # Toggle the item's completion status
    item.completed = not item.completed
    db.session.commit()  # Commit the session to save changes
    # Return a success response indicating the item's status was toggled
    return jsonify({"success": True})


# Route to delete a todo list and all its associated items
@todo.route("/list/delete/<int:list_id>", methods=["POST"])
@jwt_required()  # Require JWT authentication
def delete_list(list_id):
    current_user_id = get_jwt_identity()  # Get the current user's ID
    # Retrieve the TodoList or return a 404 error if not found
    todo_list = TodoList.query.get_or_404(list_id)
    # Verify that the current user owns the list
    if todo_list.owner_id != current_user_id:
        # Return an unauthorized error if the user doesn't own the list
        return jsonify({"success": False, "message": "Unauthorized"}), 403

    # Delete all items associated with the list
    TodoItem.query.filter_by(list_id=list_id).delete()
    # Delete the list itself
    db.session.delete(todo_list)
    db.session.commit()  # Commit the session to save changes

    # Return a success response indicating the list was deleted
    return jsonify({"message": "List deleted successfully"}), 200


# Route to delete an item and all of its subtasks
@todo.route("/item/delete/<int:item_id>", methods=["POST"])
@jwt_required()  # Require JWT authentication
def delete_item(item_id):
    current_user_id = get_jwt_identity()  # Get the current user's ID
    # Retrieve the item to delete or return a 404 error if not found
    item = TodoItem.query.get_or_404(item_id)
    # Verify that the current user owns the list containing the item
    if item.list.owner_id != current_user_id:
        # Return an unauthorized error if the user doesn't own the item
        return jsonify({"success": False, "message": "Unauthorized"}), 403

    # Recursively delete all child items (subtasks)
    delete_children(item)
    # Delete the item itself
    db.session.delete(item)
    db.session.commit()  # Commit the session to save changes
    # Return a success response indicating the item was deleted
    return jsonify({"message": "Item deleted successfully"}), 200


def delete_children(item):
    """Recursively delete all children (subtasks) of an item."""
    # Get all direct children of the current item
    children = TodoItem.query.filter_by(parent_id=item.id).all()
    for child in children:
        # Recursively delete each child's subtasks
        delete_children(child)
        # Delete the child item
        db.session.delete(child)


# Route to edit an item's content
@todo.route("/item/edit/<int:item_id>", methods=["POST"])
@jwt_required()  # Require JWT authentication
def edit_item(item_id):
    current_user_id = get_jwt_identity()  # Get the current user's ID
    # Retrieve the item to edit or return a 404 error if not found
    item = TodoItem.query.get_or_404(item_id)
    # Verify that the current user owns the list containing the item
    if item.list.owner_id != current_user_id:
        # Return an unauthorized error if the user doesn't own the item
        return jsonify({"success": False, "message": "Unauthorized"}), 403

    content = request.json.get("content")  # Get the new content from the request body
    if not content:
        # Return an error if the new content is missing
        return jsonify({"success": False, "message": "Content is required"}), 400

    # Update the item's content
    item.content = content
    db.session.commit()  # Commit the session to save changes
    # Return a success response indicating the item was updated
    return jsonify({"success": True})


# Duplicate route to toggle the completion status of an item
@todo.route("/item/toggle_complete/<int:item_id>", methods=["POST"])
@jwt_required()  # Require JWT authentication
def toggle_complete(item_id):
    # This route appears to duplicate the functionality of /item/toggle/<int:item_id>
    current_user_id = get_jwt_identity()  # Get the current user's ID
    # Retrieve the item to toggle or return a 404 error if not found
    item = TodoItem.query.get_or_404(item_id)
    # Verify that the current user owns the list containing the item
    if item.list.owner_id != current_user_id:
        # Return an unauthorized error if the user doesn't own the item
        return jsonify({"success": False, "message": "Unauthorized"}), 403

    # Toggle the item's completion status
    item.completed = not item.completed
    db.session.commit()  # Commit the session to save changes
    # Return a success response indicating the item's status was toggled
    return jsonify({"success": True})
