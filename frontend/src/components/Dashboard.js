// src/components/Dashboard.js

import React, { useState, useEffect } from 'react';
import '../styles/dashboard.css';
import { useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

const API_URL = 'http://127.0.0.1:5000'; // Ensure this matches your Flask server URL

const Dashboard = () => {
    const [todoLists, setTodoLists] = useState([]);
    const [newListTitle, setNewListTitle] = useState('');
    const [newItemContent, setNewItemContent] = useState('');
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
        if (!newItemContent) {
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
                body: JSON.stringify({ content: newItemContent, parent_id: parentId }),
            });
            if (response.status === 401) {
                setMessage("Unauthorized. Please log in again.");
                navigate('/login');
                return;
            }
            const data = await response.json();
            if (response.ok && data.success) {
                setMessage("Item added successfully!");
                setNewItemContent('');
                // Refresh the list
                setTodoLists((prev) => prev.map(list => {
                    if (list.id === listId) {
                        return { ...list, items: [...list.items, { id: data.item_id, content: newItemContent, parent_id: parentId }] };
                    }
                    return list;
                }));
            } else {
                setMessage(data.message || "Failed to add item.");
            }
        } catch (error) {
            console.error("Error adding item:", error);
            setMessage("An error occurred. Please try again later.");
        }
    };

    const handleDragEnd = (result) => {
        if (!result.destination) return;
        const { source, destination } = result;
        const sourceListId = source.droppableId;
        const destinationListId = destination.droppableId;

        if (sourceListId === destinationListId && source.index === destination.index) {
            return;
        }

        const sourceListIndex = todoLists.findIndex(list => list.id.toString() === sourceListId);
        const destinationListIndex = todoLists.findIndex(list => list.id.toString() === destinationListId);
        const sourceList = todoLists[sourceListIndex];
        const [movedItem] = sourceList.items.splice(source.index, 1);
        todoLists[destinationListIndex].items.splice(destination.index, 0, movedItem);

        setTodoLists([...todoLists]);

        try {
            handleMoveItem(movedItem.id, destinationListId);
        } catch (error) {
            console.error("Error during drag and drop update:", error);
        }
    };

    const handleMoveItem = async (itemId, newParentId) => {
        try {
            const response = await fetch(`${API_URL}/item/move`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                },
                body: JSON.stringify({ item_id: itemId, new_parent_id: newParentId }),
            });
            if (response.status === 401) {
                setMessage("Unauthorized. Please log in again.");
                navigate('/login');
                return;
            }
            const data = await response.json();
            if (response.ok && data.success) {
                setMessage("Item moved successfully!");
            } else {
                setMessage(data.message || "Failed to move item.");
            }
        } catch (error) {
            console.error("Error moving item:", error);
            setMessage("An error occurred. Please try again later.");
        }
    };

    const renderItems = (items, depth = 1) => {
        if (depth > 3) return null;
        return items.map((item, index) => (
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
                                    value={newItemContent}
                                    onChange={(e) => setNewItemContent(e.target.value)}
                                />
                                <button onClick={() => handleAddItem(item.list_id, item.id)}>Add Subtask</button>
                            </div>
                        )}
                        {depth < 3 && item.items && (
                            <ul>{renderItems(item.items, depth + 1)}</ul>
                        )}
                    </li>
                )}
            </Draggable>
        ));
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
            <DragDropContext onDragEnd={handleDragEnd}>
                <div className="todo-lists">
                    {todoLists.map((list) => (
                        <div key={list.id} className="todo-list">
                            <h3>{list.title}</h3>
                            <Droppable droppableId={list.id.toString()}>
                                {(provided) => (
                                    <ul
                                        {...provided.droppableProps}
                                        ref={provided.innerRef}
                                        className="todo-items"
                                    >
                                        {renderItems(list.items)}
                                        {provided.placeholder}
                                    </ul>
                                )}
                            </Droppable>
                            <input
                                type="text"
                                placeholder="New Item Content"
                                value={newItemContent}
                                onChange={(e) => setNewItemContent(e.target.value)}
                            />
                            <button onClick={() => handleAddItem(list.id)}>Add Item</button>
                        </div>
                    ))}
                </div>
            </DragDropContext>
        </div>
    );
};

export default Dashboard;
