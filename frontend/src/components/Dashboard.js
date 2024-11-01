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
    const [collapsedItems, setCollapsedItems] = useState({});
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

    const reorderItems = (list, startIndex, endIndex) => {
        const result = Array.from(list);
        const [removed] = result.splice(startIndex, 1);
        result.splice(endIndex, 0, removed);
        return result;
    };

    const onDragEnd = (result) => {
        const { source, destination } = result;

        // If there's no destination (dropped outside any droppable area), exit
        if (!destination) {
            return;
        }

        // If the item was dropped in the same position, do nothing
        if (source.droppableId === destination.droppableId && source.index === destination.index) {
            return;
        }

        // Get the list where the item was dragged from
        const sourceList = todoLists.find(list => `list-${list.id}` === source.droppableId);
        const destinationList = todoLists.find(list => `list-${list.id}` === destination.droppableId);

        // Move within the same list
        if (sourceList === destinationList) {
            const updatedItems = reorderItems(sourceList.items, source.index, destination.index);
            setTodoLists(todoLists.map(list =>
                list.id === sourceList.id ? { ...list, items: updatedItems } : list
            ));
        } else {
            // Moving between different lists
            const sourceItems = Array.from(sourceList.items);
            const [movedItem] = sourceItems.splice(source.index, 1);
            const destinationItems = Array.from(destinationList.items);
            destinationItems.splice(destination.index, 0, movedItem);

            setTodoLists(todoLists.map(list => {
                if (list.id === sourceList.id) {
                    return { ...list, items: sourceItems };
                } else if (list.id === destinationList.id) {
                    return { ...list, items: destinationItems };
                } else {
                    return list;
                }
            }));
        }
    };

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

    const handleDeleteList = async (listId) => {
        try {
            const response = await fetch(`${API_URL}/list/delete/${listId}`, {
                method: 'POST',
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
                setMessage("List deleted successfully!");
                setTodoLists((prev) => prev.filter((list) => list.id !== listId));
            } else {
                setMessage(data.message || "Failed to delete list.");
            }
        } catch (error) {
            console.error("Error deleting list:", error);
            setMessage("An error occurred. Please try again later.");
        }
    };

    const addSubItemToParent = (items, parentId, newItem) => {
        return items.map(item => {
            if (item.id === parentId) {
                return {
                    ...item,
                    items: [...(item.items || []), newItem],
                };
            } else if (item.items && item.items.length > 0) {
                return {
                    ...item,
                    items: addSubItemToParent(item.items, parentId, newItem),
                };
            } else {
                return item;
            }
        });
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
                setTodoLists((prev) =>
                    prev.map((list) => {
                        if (list.id === listId) {
                            if (parentId) {
                                const updatedItems = addSubItemToParent(list.items, parentId, {
                                    id: data.item_id,
                                    content,
                                    parent_id: parentId,
                                    items: [],
                                    completed: false,
                                });
                                return {
                                    ...list,
                                    items: updatedItems,
                                };
                            } else {
                                return {
                                    ...list,
                                    items: [...list.items, { id: data.item_id, content, parent_id: parentId, items: [], completed: false }],
                                };
                            }
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

    const handleDeleteItem = async (itemId) => {
        try {
            const response = await fetch(`${API_URL}/item/delete/${itemId}`, {
                method: 'POST',
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
                setMessage("Item deleted successfully!");
                setTodoLists((prev) =>
                    prev.map((list) => {
                        const deleteItemRecursively = (items) =>
                            items.filter((item) => {
                                if (item.id === itemId) {
                                    return false;
                                }
                                if (item.items && item.items.length > 0) {
                                    item.items = deleteItemRecursively(item.items);
                                }
                                return true;
                            });

                        return {
                            ...list,
                            items: deleteItemRecursively(list.items),
                        };
                    })
                );
            } else {
                setMessage(data.message || "Failed to delete item.");
            }
        } catch (error) {
            console.error("Error deleting item:", error);
            setMessage("An error occurred. Please try again later.");
        }
    };

    const handleToggleItem = async (itemId) => {
        try {
            const response = await fetch(`${API_URL}/item/toggle/${itemId}`, {
                method: 'POST',
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
                setMessage("Item toggled successfully!");
                setTodoLists((prev) =>
                    prev.map((list) => {
                        const toggleItemRecursively = (items) =>
                            items.map((item) => {
                                if (item.id === itemId) {
                                    return { ...item, completed: !item.completed };
                                }
                                if (item.items && item.items.length > 0) {
                                    return { ...item, items: toggleItemRecursively(item.items) };
                                }
                                return item;
                            });

                        return {
                            ...list,
                            items: toggleItemRecursively(list.items),
                        };
                    })
                );
            } else {
                setMessage(data.message || "Failed to toggle item.");
            }
        } catch (error) {
            console.error("Error toggling item:", error);
            setMessage("An error occurred. Please try again later.");
        }
    };

    const handleInputChange = (setter, id, value) => {
        setter((prev) => ({ ...prev, [id]: value }));
    };

    const toggleCollapse = (itemId) => {
        setCollapsedItems((prev) => ({
            ...prev,
            [itemId]: !prev[itemId],
        }));
    };

    const renderItems = (items, listId, depth = 1) => {
        if (!items) return null;
        if (depth > 3) return null;

        return items.map((item, index) => {
            if (!item.id) return null;

            const subtaskValue = subtaskContent[item.id] || '';
            const isCollapsed = collapsedItems[item.id];

            return (
                <Draggable key={item.id} draggableId={`item-${listId}-${item.id}`} index={index}>
                    {(provided) => (
                        <li
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`todo-item item-depth-${depth}`}
                        >
                            <div className="item-header">
                                {item.items && item.items.length > 0 && (
                                    <button onClick={() => toggleCollapse(item.id)}>
                                        {isCollapsed ? '+' : '-'}
                                    </button>
                                )}
                                <span>{item.content}</span>
                                <button onClick={() => handleToggleItem(item.id)}>
                                    {item.completed ? 'Mark Incomplete' : 'Mark Complete'}
                                </button>
                                <button onClick={() => handleDeleteItem(item.id)}>Delete</button>
                            </div>
                            {!isCollapsed && depth < 3 && (
                                <>
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
                                    {item.items && (
                                        <ul className="subtask">{renderItems(item.items, listId, depth + 1)}</ul>
                                    )}
                                </>
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
            {message && <p className="message">{message}</p>}
            <div className="add-list">
                <input
                    type="text"
                    placeholder="New List Title"
                    value={newListTitle}
                    onChange={(e) => setNewListTitle(e.target.value)}
                />
                <button onClick={handleAddList}>Add List</button>
            </div>
            <DragDropContext onDragEnd={onDragEnd}>
                <div className="todo-lists">
                    {todoLists.map((list) => (
                        <div key={list.id} className="todo-list">
                            <div className="list-header">
                                <h3>{list.title}</h3>
                                <button onClick={() => handleDeleteList(list.id)}>Delete List</button>
                            </div>
                            <Droppable droppableId={`list-${list.id}`}>
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
                            <div className="item-actions">
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
                        </div>
                    ))}
                </div>
            </DragDropContext>
        </div>
    );
};

export default Dashboard;
