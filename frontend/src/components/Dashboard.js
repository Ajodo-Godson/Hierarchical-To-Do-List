import React, { useState, useEffect } from 'react';
import '../styles/dashboard.css';
import { useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

const API_URL = 'http://127.0.0.1:5000';

const Dashboard = () => {
    // State variables for managing the dashboard's data and UI states
    const [todoLists, setTodoLists] = useState([]);                // List of to-do lists
    const [newListTitle, setNewListTitle] = useState('');          // Title for a new list
    const [listItemContent, setListItemContent] = useState({});    // Content for new items in lists
    const [subtaskContent, setSubtaskContent] = useState({});      // Content for new subtasks
    const [collapsedItems, setCollapsedItems] = useState({});      // Tracks collapsed items
    const [message, setMessage] = useState(null);                  // Messages to display to the user
    const [editingItem, setEditingItem] = useState(null);          // ID of the item being edited
    const [editingContent, setEditingContent] = useState('');      // Content of the item being edited
    const [showCompleted, setShowCompleted] = useState(false);     // Toggle to show/hide completed items

    const navigate = useNavigate();                                // Hook for navigation

    // Fetch to-do lists when the component mounts
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

    // Helper function to reorder items within a list
    const reorderItems = (list, startIndex, endIndex) => {
        const result = Array.from(list);
        const [removed] = result.splice(startIndex, 1);
        result.splice(endIndex, 0, removed);
        return result;
    };

    // Handler for when a drag-and-drop action ends
    const onDragEnd = (result) => {
        const { source, destination } = result;

        // If dropped outside the list, do nothing
        if (!destination) return;

        const sourceListId = parseInt(source.droppableId.split('-')[1], 10);
        const destinationListId = parseInt(destination.droppableId.split('-')[1], 10);

        // Check if moving within the same list or to a different list
        if (sourceListId === destinationListId) {
            // Reorder items within the same list
            const listIndex = todoLists.findIndex(list => list.id === sourceListId);
            const list = todoLists[listIndex];
            const updatedItems = reorderItems(list.items, source.index, destination.index);
            const updatedList = { ...list, items: updatedItems };
            const updatedTodoLists = [...todoLists];
            updatedTodoLists[listIndex] = updatedList;
            setTodoLists(updatedTodoLists);
        } else {
            // Move item to a different list
            const sourceListIndex = todoLists.findIndex(list => list.id === sourceListId);
            const destinationListIndex = todoLists.findIndex(list => list.id === destinationListId);

            if (sourceListIndex === -1 || destinationListIndex === -1) return;

            const sourceList = todoLists[sourceListIndex];
            const destinationList = todoLists[destinationListIndex];

            // Remove item from source list and add to destination list
            const itemToMove = sourceList.items[source.index];
            const newSourceItems = Array.from(sourceList.items);
            newSourceItems.splice(source.index, 1);
            const newDestinationItems = Array.from(destinationList.items);
            newDestinationItems.splice(destination.index, 0, itemToMove);

            const updatedSourceList = { ...sourceList, items: newSourceItems };
            const updatedDestinationList = { ...destinationList, items: newDestinationItems };

            const updatedTodoLists = [...todoLists];
            updatedTodoLists[sourceListIndex] = updatedSourceList;
            updatedTodoLists[destinationListIndex] = updatedDestinationList;

            setTodoLists(updatedTodoLists);
        }
    };

    // Handler to add a new list
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
                // Update the list of todoLists with the new list
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

    // Handler to edit an existing item
    const handleEditItem = async (itemId) => {
        if (!editingContent) {
            setMessage("Content is required.");
            return;
        }

        try {
            const response = await fetch(`${API_URL}/item/edit/${itemId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                },
                body: JSON.stringify({ content: editingContent }),
            });

            if (response.status === 401) {
                setMessage("Unauthorized. Please log in again.");
                navigate('/login');
                return;
            }

            const data = await response.json();

            if (response.ok && data.success) {
                setMessage("Item updated successfully!");
                // Update the item in the state
                setTodoLists((prev) =>
                    prev.map((list) => {
                        const updateItemRecursively = (items) => {
                            return items.map(item => {
                                if (item.id === itemId) {
                                    return { ...item, content: editingContent };
                                } else if (item.items && item.items.length > 0) {
                                    return { ...item, items: updateItemRecursively(item.items) };
                                }
                                return item;
                            });
                        };
                        return { ...list, items: updateItemRecursively(list.items) };
                    })
                );
                setEditingItem(null);
            } else {
                setMessage(data.message || "Failed to update item.");
            }
        } catch (error) {
            console.error("Error editing item:", error);
            setMessage("An error occurred. Please try again later.");
        }
    };

    // Handler to delete a list
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
                // Remove the list from the state
                setTodoLists((prev) => prev.filter((list) => list.id !== listId));
            } else {
                setMessage(data.message || "Failed to delete list.");
            }
        } catch (error) {
            console.error("Error deleting list:", error);
            setMessage("An error occurred. Please try again later.");
        }
    };

    // Handler to add a new item or subtask
    const handleAddItem = async (listId, parentId = null) => {
        // Determine content based on whether it's a subtask or a main task
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
                // Update the list of items
                setTodoLists((prev) =>
                    prev.map((list) => {
                        if (list.id === listId) {
                            if (parentId) {
                                // Add subtask to the parent item
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
                                // Add new item to the list
                                return {
                                    ...list,
                                    items: [...list.items, { id: data.item_id, content, parent_id: parentId, items: [], completed: false }],
                                };
                            }
                        }
                        return list;
                    })
                );
                // Reset input fields
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

    // Recursive function to add a subitem to its parent
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

    // Handler to delete an item or subtask
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
                // Remove the item from the state
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

    // Handler to toggle the completion status of an item
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
                // Update the item's completion status
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

    // Handler for input changes in dynamically generated input fields
    const handleInputChange = (setter, id, value) => {
        setter((prev) => ({ ...prev, [id]: value }));
    };

    // Handler to toggle the collapse state of an item with subtasks
    const toggleCollapse = (itemId) => {
        setCollapsedItems((prev) => ({
            ...prev,
            [itemId]: !prev[itemId],
        }));
    };

    // Recursive function to render items and their subtasks
    const renderItems = (items, listId, depth = 1) => {
        if (!items) return null;
        if (depth > 3) return null; // Limit nesting to 3 levels

        return items
            .filter(item => showCompleted || !item.completed) // Filter out completed items if needed
            .map((item, index) => {
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
                                    {/* Button to collapse/expand subtasks */}
                                    {item.items && item.items.length > 0 && (
                                        <button onClick={() => toggleCollapse(item.id)}>
                                            {isCollapsed ? '+' : '-'}
                                        </button>
                                    )}
                                    {/* Editing mode */}
                                    {editingItem === item.id ? (
                                        <>
                                            <input
                                                type="text"
                                                value={editingContent}
                                                onChange={(e) => setEditingContent(e.target.value)}
                                            />
                                            <button onClick={() => handleEditItem(item.id)}>Save</button>
                                            <button onClick={() => setEditingItem(null)}>Cancel</button>
                                        </>
                                    ) : (
                                        <span>{item.content}</span>
                                    )}
                                    {/* Action buttons */}
                                    <button onClick={() => handleToggleItem(item.id)}>
                                        {item.completed ? 'Mark Incomplete' : 'Mark Complete'}
                                    </button>
                                    <button onClick={() => handleDeleteItem(item.id)}>Delete</button>
                                    <button
                                        onClick={() => {
                                            setEditingItem(item.id);
                                            setEditingContent(item.content);
                                        }}
                                    >
                                        Edit
                                    </button>
                                </div>
                                {/* Subtask input and list */}
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
                                            <button onClick={() => handleAddItem(listId, item.id)}>
                                                Add Subtask
                                            </button>
                                        </div>
                                        {item.items && (
                                            <ul className="subtask">
                                                {renderItems(item.items, listId, depth + 1)}
                                            </ul>
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
            {/* Display messages to the user */}
            {message && <p className="message">{message}</p>}
            {/* Toggle to show/hide completed items */}
            <button onClick={() => setShowCompleted(!showCompleted)}>
                {showCompleted ? 'Hide Completed Items' : 'Show Completed Items'}
            </button>
            {/* Input to add a new list */}
            <div className="add-list">
                <input
                    type="text"
                    placeholder="New List Title"
                    value={newListTitle}
                    onChange={(e) => setNewListTitle(e.target.value)}
                />
                <button onClick={handleAddList}>Add List</button>
            </div>
            {/* Drag and drop context */}
            <DragDropContext onDragEnd={onDragEnd}>
                <div className="todo-lists">
                    {todoLists.map((list) => (
                        <div key={list.id} className="todo-list">
                            <div className="list-header">
                                <h3>{list.title}</h3>
                                <button onClick={() => handleDeleteList(list.id)}>Delete List</button>
                            </div>
                            {/* Droppable area for items */}
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
                            {/* Input to add a new item to the list */}
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
