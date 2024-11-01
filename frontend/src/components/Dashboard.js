import React, { useState, useEffect } from 'react';
import '../styles/dashboard.css';
import { useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

const API_URL = 'http://127.0.0.1:5000';

const Dashboard = () => {
    const [todoLists, setTodoLists] = useState([]);
    const [newListTitle, setNewListTitle] = useState('');
    const [listItemContent, setListItemContent] = useState({});
    const [subtaskContent, setSubtaskContent] = useState({});
    const [message, setMessage] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchTodoLists = async () => {
            try {
                const response = await fetch(`${API_URL}/list`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    },
                });
                if (response.status === 401) {
                    setMessage("Unauthorized. Please log in again.");
                    navigate('/login');
                    return;
                }
                const data = await response.json();
                if (response.ok) {
                    setTodoLists(data.lists);
                } else {
                    setMessage(data.message || "Failed to fetch todo lists.");
                }
            } catch (error) {
                console.error("Error fetching todo lists:", error);
                setMessage("An error occurred. Please try again later.");
            }
        };
        fetchTodoLists();
    }, [navigate]);

    const handleAddList = async () => {
        if (!newListTitle) {
            setMessage("Title is required.");
            return;
        }
        try {
            const response = await fetch(`${API_URL}/list/add`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                },
                body: JSON.stringify({ title: newListTitle }),
            });
            if (response.status === 401) {
                setMessage("Unauthorized. Please log in again.");
                navigate('/login');
                return;
            }
            const data = await response.json();
            if (response.ok && data.success) {
                setTodoLists([...todoLists, { id: data.list_id, title: newListTitle, items: [] }]);
                setNewListTitle('');
                setMessage("List added successfully!");
            } else {
                setMessage(data.message || "Failed to add list.");
            }
        } catch (error) {
            console.error("Error adding list:", error);
            setMessage("An error occurred. Please try again later.");
        }
    };

    const handleAddItem = async (listId, parentId = null) => {
        const content = parentId ? subtaskContent[parentId] : listItemContent[listId];
        if (!content) {
            setMessage("Content is required.");
            return;
        }
        try {
            const response = await fetch(`${API_URL}/list/${listId}/add`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                },
                body: JSON.stringify({ content, parent_id: parentId }),
            });
            if (response.status === 401) {
                setMessage("Unauthorized. Please log in again.");
                navigate('/login');
                return;
            }
            const data = await response.json();
            if (response.ok && data.success) {
                setMessage("Item added successfully!");
                // Refresh the list with new item
                setTodoLists((prev) =>
                    prev.map((list) => {
                        if (list.id === listId) {
                            return {
                                ...list,
                                items: [...list.items, { id: data.item_id, content, parent_id: parentId, items: [] }],
                            };
                        }
                        return list;
                    })
                );
                if (parentId) {
                    setSubtaskContent((prev) => ({ ...prev, [parentId]: '' }));
                } else {
                    setListItemContent((prev) => ({ ...prev, [listId]: '' }));
                }
            } else {
                setMessage(data.message || "Failed to add item.");
            }
        } catch (error) {
            console.error("Error adding item:", error);
            setMessage("An error occurred. Please try again later.");
        }
    };

    const handleInputChange = (setter, id, value) => {
        setter((prev) => ({ ...prev, [id]: value }));
    };

    const renderItems = (items, listId, depth = 1) => {
        if (!items) return null; // Add a check for items being undefined
        if (depth > 3) return null;

        return items.map((item, index) => {
            if (!item.id) return null; // Add a check to ensure item has an id

            const subtaskValue = subtaskContent[item.id] || '';

            return (
                <Draggable key={item.id} draggableId={item.id.toString()} index={index}>
                    {(provided) => (
                        <li
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`todo-item item-depth-${depth}`}
                        >
                            {item.content}
                            {depth < 3 && (
                                <div className="item-actions">
                                    <input
                                        type="text"
                                        placeholder="New Subtask Content"
                                        value={subtaskValue}
                                        onChange={(e) =>
                                            handleInputChange(setSubtaskContent, item.id, e.target.value)
                                        }
                                    />
                                    <button onClick={() => handleAddItem(listId, item.id)}>Add Subtask</button>
                                </div>
                            )}
                            {depth < 3 && item.items && (
                                <ul>{renderItems(item.items, listId, depth + 1)}</ul>
                            )}
                        </li>
                    )}
                </Draggable>
            );
        });
    };

    return (
        <div className="dashboard-container">
            <h2>Dashboard</h2>
            {message && <p>{message}</p>}
            <div className="add-list">
                <input
                    type="text"
                    placeholder="New List Title"
                    value={newListTitle}
                    onChange={(e) => setNewListTitle(e.target.value)}
                />
                <button onClick={handleAddList}>Add List</button>
            </div>
            <DragDropContext onDragEnd={() => { }}>
                <div className="todo-lists">
                    {todoLists.map((list) => {
                        if (!list.id) return null; // Add a check to ensure list has an id

                        return (
                            <div key={list.id} className="todo-list">
                                <h3>{list.title}</h3>
                                <Droppable droppableId={list.id.toString()}>
                                    {(provided) => (
                                        <ul
                                            {...provided.droppableProps}
                                            ref={provided.innerRef}
                                            className="todo-items"
                                        >
                                            {renderItems(list.items, list.id)}
                                            {provided.placeholder}
                                        </ul>
                                    )}
                                </Droppable>
                                <input
                                    type="text"
                                    placeholder="New Item Content"
                                    value={listItemContent[list.id] || ''}
                                    onChange={(e) =>
                                        handleInputChange(setListItemContent, list.id, e.target.value)
                                    }
                                />
                                <button onClick={() => handleAddItem(list.id)}>Add Item</button>
                            </div>
                        );
                    })}
                </div>
            </DragDropContext>
        </div>
    );
};

export default Dashboard;
