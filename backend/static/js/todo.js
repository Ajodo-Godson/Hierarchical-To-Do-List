document.addEventListener("DOMContentLoaded", function () {
    const todoContainer = document.getElementById("todo-container");
    const addTodoButton = document.getElementById("add-todo-button");
    const newTodoText = document.getElementById("new-todo-text");

    addTodoButton.addEventListener("click", function () {
        const text = newTodoText.value.trim();
        if (text) {
            addTodoItem(text);
            newTodoText.value = "";
        }
    });

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
                addTodoItem(childText, childrenContainer);
            }
        });

        const childrenContainer = document.createElement("div");
        childrenContainer.className = "todo-children";

        todoItem.appendChild(todoText);
        todoItem.appendChild(addChildButton);
        todoItem.appendChild(childrenContainer);
        parentElement.appendChild(todoItem);
    }
});
