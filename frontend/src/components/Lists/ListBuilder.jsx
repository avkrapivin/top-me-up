import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

import {
    useList,
    useCreateList,
    useUpdateList,
    useAddListItem,
    useRemoveListItem,
    useDeleteList,
    useReorderListItems
} from '../../hooks/useListApi';
import CategorySelector from './CategorySelector';
import SearchBox from '../Search/SearchBox';
import DraggableListItem from './DraggableListItem';
import EmptySlot from './EmptySlot';

function ListBuilder() {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEditMode = !!id;

    const { data: listData, isLoading: isLoadingList } = useList(id);

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('movies');
    const [isPublic, setIsPublic] = useState(false);
    const [items, setItems] = useState([]);

    const createListMutation = useCreateList();
    const updateListMutation = useUpdateList();
    const deleteListMutation = useDeleteList();
    const addItemMutation = useAddListItem();
    const removeItemMutation = useRemoveListItem();
    const reorderItemsMutation = useReorderListItems();

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        })
    );

    useEffect(() => {
        if (listData?.data) {
            const list = listData.data;
            setTitle(list.title);
            setDescription(list.description || '');
            setCategory(list.category);
            setIsPublic(list.isPublic);
            setItems(list.items || []);
        }
    }, [listData]);

    const handleAddItem = async (item) => {
        if (items.length >= 10) {
            alert('Maximum 10 items allowed');
            return;
        }

        if (items.some(i => i.externalId === item.externalId)) {
            alert('This item is already in the list');
            return;
        }

        const newItem = {
            externalId: item.externalId,
            title: item.title,
            position: items.length + 1,
            cachedData: {
                posterUrl: item.posterUrl,
                year: item.year,
                ...(item.artist && { artist: item.artist }),
                ...(item.genres && { genres: item.genres }),
            },
        };

        if (isEditMode) {
            try {
                await addItemMutation.mutateAsync({
                    listId: id,
                    itemData: newItem,
                });
            } catch (error) {
                console.error('Failed to add item:', error);
                alert('Failed to add item');
            }
        } else {
            setItems([...items, newItem]);
        }
    };

    const handleRemoveItem = async (externalId) => {
        if (isEditMode) {
            try {
                await removeItemMutation.mutateAsync({
                    listId: id,
                    itemId: externalId,
                });
            } catch (error) {
                console.error('Failed to remove item:', error);
                alert('Failed to remove item');
            }
        } else {
            setItems(items.filter(item => item.externalId !== externalId));
        }
    };

    const handleDragEnd = async (event) => {
        const { active, over } = event;

        if (!over || active.id === over.id) return;

        const oldIndex = items.findIndex(item => item.externalId === active.id);
        const newIndex = items.findIndex(item => item.externalId === over.id);

        const reorderedItems = arrayMove(items, oldIndex, newIndex);
        setItems(reorderedItems);

        if (isEditMode) {
            try {
                const itemsWithPositions = reorderedItems.map((item, index) => ({
                    externalId: item.externalId,
                    position: index,
                }));

                await reorderItemsMutation.mutateAsync({
                    listId: id,
                    items: itemsWithPositions,
                });
            } catch (error) {
                console.error('Failed to reorder items:', error);
                alert('Failed to reorder items');
            }
        }
    };

    const handleSave = async () => {
        if (!title.trim()) {
            alert('Please enter a title');
            return;
        }

        if (!category) {
            alert('Please select a category');
            return;
        }

        const listData = {
            title: title.trim(),
            description: description.trim(),
            category,
            isPublic,
            items,
        };

        try {
            if (isEditMode) {
                await updateListMutation.mutateAsync({
                    id,
                    data: listData,
                });
                alert('List updated successfully');
            } else {
                const result = await createListMutation.mutateAsync(listData);
                alert('List created successfully');
                navigate(`/builder/${result.data._id}`);
            }
        } catch (error) {
            console.error('Failed to save list:', error);
            alert('Failed to save list');
        }
    };

    const handleDelete = async () => {
        if (!window.confirm(`Are you sure you want to delete "${title}"?`)) return;

        try {
            await deleteListMutation.mutateAsync(id);
            alert('List deleted successfully');
            navigate('/dashboard');
        } catch (error) {
            console.error('Failed to delete list:', error);
            alert('Failed to delete list');
        }
    };

    if (isEditMode && isLoadingList) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
            <div className="max-w-4xl mx-auto px-4">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                    >
                        ← Back to Dashboard
                    </button>
                    <div className="flex gap-2">
                        <button
                            onClick={handleSave}
                            disabled={createListMutation.isPending || updateListMutation.isPending}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition disabled:opacity-50"
                        >
                            {isEditMode ? 'Save Changes' : 'Save List'}
                        </button>
                        {isEditMode && (
                            <button
                                onClick={handleDelete}
                                disabled={deleteListMutation.isPending}
                                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-md transition disabled:opacity-50"
                            >
                                Delete
                            </button>
                        )}
                    </div>
                </div>

                {/* Settings Panel */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                        {isEditMode ? 'Edit List' : 'Create New List'}
                    </h2>

                    {/* Title */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Title
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="My Top 10"
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                        />
                    </div>

                    {/* Category */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Category
                        </label>
                        <CategorySelector
                            selected={category}
                            onChange={setCategory}
                            disabled={isEditMode} // Cannot change category in edit mode
                        />
                    </div>

                    {/* Description */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Description (optional)
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Describe your list..."
                            rows={3}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                        />
                    </div>

                    {/* Public checkbox */}
                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            id="isPublic"
                            checked={isPublic}
                            onChange={(e) => setIsPublic(e.target.checked)}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <label htmlFor="isPublic" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                            Make this list public
                        </label>
                    </div>
                </div>

                {/* Search Panel */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                        Search & Add Content
                    </h3>
                    <SearchBox
                        category={category}
                        onSelectItem={handleAddItem}
                        placeholder={`Search ${category}...`}
                    />
                </div>

                {/* List Items */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 max-w-xl mx-auto">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                        Your Top 10 ({items.length}/10)
                    </h3>

                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                    >
                        <SortableContext
                            items={items.map(item => item.externalId)}
                            strategy={verticalListSortingStrategy}
                        >
                            <div className="grid grid-cols-2 gap-6">
                                {items.map((item, index) => (
                                    <DraggableListItem
                                        key={item.externalId}
                                        item={item}
                                        rank={index + 1}
                                        onRemove={handleRemoveItem}
                                    />
                                ))}

                                {/* Empty slots */}
                                {Array(10 - items.length)
                                    .fill(null)
                                    .map((_, index) => (
                                        <EmptySlot key={`empty-${index}`} rank={items.length + index + 1} />
                                    ))}
                            </div>
                        </SortableContext>
                    </DndContext>
                </div>
            </div>
        </div>
    );
}

export default ListBuilder;