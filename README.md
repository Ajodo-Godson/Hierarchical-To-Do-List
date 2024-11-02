# Hierarchical To-Do List

 [Demo Link](https://www.loom.com/share/372c4d84f3e84d37b2d4ddf5e3f8a701?sid=42610339-75b6-4a84-8df5-89c31a539332)
## Overview

This project is a full-stack web application that provides users with the ability to manage their tasks in a hierarchical manner. 

Users can create to-do lists, add tasks and subtasks, and organize them in a nested structure. The application supports user authentication, allowing users to sign up, log in, and manage their own to-do lists.

### Features

- User authentication (sign up, log in, log out)
- Create, update, and delete to-do lists
- Add, update, and delete tasks and subtasks
- Nested task structure with up to 3 levels of depth
- Toggle task completion status
- Responsive user interface built with React


## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
- [API Endpoints](#api-endpoints)
  - [Authentication Endpoints](#authentication-endpoints)
  - [To-Do List Endpoints](#to-do-list-endpoints)
- [Models](#models)
- [Contributing](#contributing)
- [License](#license)

## Installation

1. Clone the repository:
    ```bash
    git clone "https://github.com/Ajodo-Godson/Hierarchical-To-Do-List"
    cd hierarchical-todo-list
    ```

2. Create and activate a virtual environment:
    ```bash
    python3 -m venv venv
    source venv/bin/activate
    ```

3. Install the dependencies:
    ```bash
    pip install -r requirements.txt
    ```

4. Set up the backend environment:
    ```bash
    export FLASK_APP=backend
    ```
5. Run the flask app from the virtual environment:
    ```bash
    python -m flask run 
    ```
6. Create a new terminal and navigate to frontend
    ```bash
    cd frontend
    ```
7. Run the following: 
    ```bash
    npm install
    npm start
    ```


## API Endpoints

### Authentication Endpoints

- **User Signup**:
    - `POST /auth/signup`
    - Request Body: `{ "email": "user@example.com", "name": "User Name", "password": "password" }`
    - Response: `{ "message": "Account created successfully" }`

- **User Login**:
    - `POST /auth/login`
    - Request Body: `{ "email": "user@example.com", "password": "password" }`
    - Response: `{ "success": True, "token": "JWT_TOKEN", "message": "Login successful" }`

- **User Logout**:
    - `GET /auth/logout`
    - Response: `{ "message": "Logged out successfully" }`

### To-Do List Endpoints

- **Add a New To-Do List**:
    - `POST /todo/list/add`
   

- **Retrieve All To-Do Lists**:
    - `GET /todo/list`
   

- **Add a New Item to a List**:
    - `POST /todo/list/<int:list_id>/add`
   

- **Move an Item**:
    - `POST /todo/item/move`
   

- **Update a To-Do List**:
    - `POST /todo/list/update`
   

- **Add a Subtask**:
    - `POST /todo/item/<int:parent_id>/add_subtask`
    

- **Toggle Item Completion**:
    - `POST /todo/item/toggle/<int:item_id>`
    

- **Delete a To-Do List**:
    - `POST /todo/list/delete/<int:list_id>`
    

- **Delete an Item**:
    - `POST /todo/item/delete/<int:item_id>`
    

- **Edit an Item**:
    - `POST /todo/item/edit/<int:item_id>`
    

## Models

### User

- `id`: Integer, primary key.
- `username`: String, unique, indexed.
- `hashed_password`: String.
- `lists`: Relationship to `TodoList`.

### TodoList

- `id`: Integer, primary key.
- `title`: String, indexed.
- `owner_id`: Integer, foreign key to `User`.
- `owner`: Relationship to `User`.
- `items`: Relationship to `TodoItem`.

### TodoItem

- `id`: Integer, primary key.
- `content`: String, indexed.
- `completed`: Boolean.
- `list_id`: Integer, foreign key to `TodoList`.
- `list`: Relationship to `TodoList`.
- `parent_id`: Integer, foreign key to `TodoItem` (self-referential).
- `children`: Self-referential relationship to `TodoItem`.

## Contributing

1. Fork the repository.
2. Create a new branch (`git checkout -b feature-branch`).
3. Make your changes.
4. Commit your changes (`git commit -am 'Add new feature'`).
5. Push to the branch (`git push origin feature-branch`).
6. Create a new Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.