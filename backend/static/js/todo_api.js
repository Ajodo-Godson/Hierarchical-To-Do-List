document.addEventListener("DOMContentLoaded", function () {
    const todoContainer = document.getElementById("todo-container");
    const addTodoButton = document.getElementById("add-todo-button");
    const newTodoText = document.getElementById("new-todo-text");

    // Event listener for adding a new to-do list
    addTodoButton.addEventListener("click", function () {
        const text = newTodoText.value.trim();
        if (text) {
            createTodoList(text);
            newTodoText.value = "";
        }
    });

    function createTodoList(title) {
        fetch("/list/add", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ title })
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    // Render the new list on the dashboard
                    addTodoItem(title);
                } else {
                    console.error("Error creating to-do list:", data.message);
                }
            })
            .catch(error => {
                console.error("Error:", error);
            });
    }


    function addTodoItem(text, parentElement = todoContainer) {
        const todoItem = document.createElement("div");
        todoItem.className = "todo-item";

        const todoText = document.createElement("span");
        todoText.textContent = text;

        const addChildButton = document.createElement("button");
        addChildButton.textContent = "+";
        addChildButton.addEventListener("click", function () {
            const childText = prompt("Enter sub-task:");
            if (childText) {
                createTodoItem(childText, todoItem.dataset.listId);
            }
        });

        const childrenContainer = document.createElement("div");
        childrenContainer.className = "todo-children";

        todoItem.appendChild(todoText);
        todoItem.appendChild(addChildButton);
        todoItem.appendChild(childrenContainer);
        parentElement.appendChild(todoItem);
    }

    function createTodoItem(content, listId) {
        fetch(`/list/${listId}/add`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ content })
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    addTodoItem(content);
                } else {
                    console.error("Error creating to-do item:", data.message);
                }
            });
    }

    function toggleTodoItem(itemId) {
        fetch(`/item/toggle/${itemId}`, {
            method: "POST"
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    console.log("Item toggled successfully");
                } else {
                    console.error("Error toggling item:", data.message);
                }
            });
    }

    function deleteTodoItem(itemId) {
        fetch(`/item/delete/${itemId}`, {
            method: "POST"
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    console.log("Item deleted successfully");
                } else {
                    console.error("Error deleting item:", data.message);
                }
            });
    }

    function editTodoItem(itemId, content) {
        fetch(`/item/edit/${itemId}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ content })
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    console.log("Item edited successfully");
                } else {
                    console.error("Error editing item:", data.message);
                }
            });
    }
});
