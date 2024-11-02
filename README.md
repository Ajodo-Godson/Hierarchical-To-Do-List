# Hierarchical To-Do List

 
 
## Overview
#### [Demo Link](https://www.loom.com/share/372c4d84f3e84d37b2d4ddf5e3f8a701?sid=42610339-75b6-4a84-8df5-89c31a539332)

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
- [Frontend Routes](#frontend-routes)
- [Issues and Future Potential Plan](#issues-and-future-potential-plan)
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

### Frontend Routes
The frontend is built with React and uses React Router for navigation. Here are the main routes defined in `App.js`:

- `/signup`: Route for the Signup page
- `/login`: Route for the Login page
- `/dashboard`: Route for the Dashboard page
- `/`: Default route (homepage) displaying a welcome message

## Issues and Future Potential Plan

One of the main issues with the current project is the UI design. The user interface could be improved to enhance the overall user experience and make the application more visually appealing.

To address this issue, here are some potential plans for the future:


1. Redesign the UI: Based on the feedback received, work on redesigning the user interface to make it more intuitive, user-friendly, and visually appealing. Consider using modern design principles and best practices to create a clean and engaging UI.
2. Work around moving subsubtasks into subtasks, and increase the depth of tasks that can be added. 
3. Add forgotten password function incase users have issues logging in. 

By addressing the UI design issue and implementing these potential plans, the project can provide a more visually appealing and user-friendly experience for its users.


## Contributing

1. Fork the repository.
2. Create a new branch (`git checkout -b feature-branch`).
3. Make your changes.
4. Commit your changes (`git commit -am 'Add new feature'`).
5. Push to the branch (`git push origin feature-branch`).
6. Create a new Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.