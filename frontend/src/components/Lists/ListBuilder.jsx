import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useToast } from '../../contexts/ToastContext';

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
import ExportModal from './ExportModal';

function ListBuilder() {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEditMode = !!id;

    const { data: listData, isLoading: isLoadingList } = useList(id);
    const { showSuccess, showError, showWarning } = useToast();

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('movies');
    const [isPublic, setIsPublic] = useState(false);
    const [items, setItems] = useState([]);
    const [showExportModal, setShowExportModal] = useState(false);

    const createListMutation = useCreateList();
    const updateListMutation = useUpdateList();
    const deleteListMutation = useDeleteList();
    const addItemMutation = useAddListItem();
    const removeItemMutation = useRemoveListItem();
    const reorderListItemsMutation = useReorderListItems();

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
            setItems((list.items || []).map((it, idx) => ({
                ...it,
                id: `${it._id || it.externalId}-${idx}-${Date.now()}`
            })));
        }
    }, [listData]);

    const handleAddItem = async (item) => {
        if (items.length >= 10) {
            showWarning('Maximum 10 items allowed');
            return;
        }

        if (items.some(i => i.externalId === item.externalId)) {
            showWarning('This item is already in the list');
            return;
        }

        const newItem = {
            id: `${item.externalId}-${Date.now()}-${Math.random()}`,
            externalId: item.externalId,
            title: item.title,
            category,
            position: items.length + 1,
            cachedData: {
                posterUrl: item.posterUrl,
                year: item.year,
                ...(item.artist && { artist: item.artist }),
                ...(item.genres && { genres: item.genres }),
            },
        };

        setItems(prevItems => {
            const updatedItems = [...prevItems, newItem];
            return updatedItems.map((item, index) => ({ ...item, position: index + 1 }));
        });
    };

    const handleRemoveItem = async (itemId) => {
        setItems(prevItems => {
            const filtered = prevItems.filter(item => item.id !== itemId);
            return filtered.map((x, i) => ({ ...x, position: i + 1 }));
        });
    };

    const handleDragEnd = async (event) => {
        const { active, over } = event;

        if (!over || active.id === over.id) return;

        const oldIndex = items.findIndex(item => item.id === active.id);
        const newIndex = items.findIndex(item => item.id === over.id);

        const reorderedItems = arrayMove(items, oldIndex, newIndex).map((item, index) => ({
            ...item,
            position: index + 1
        }));

        setItems(reorderedItems);
    };

    const handleSave = async () => {
        if (!title.trim()) {
            showWarning('Please enter a title');
            return;
        }

        if (!category) {
            showWarning('Please select a category');
            return;
        }

        const sanitizeItems = (arr) =>
            (arr || []).map(({ externalId, title, category, position, cachedData }) => ({
                externalId,
                title,
                category,
                position,
                cachedData: cachedData ? {
                    posterUrl: cachedData.posterUrl,
                    year: cachedData.year,
                    artist: cachedData.artist,
                    genres: cachedData.genres,
                } : {},
            }));

        const listData = {
            title: title.trim(),
            description: description.trim(),
            category,
            isPublic,
            items: sanitizeItems(items),
        };

        try {
            if (isEditMode) {
                await updateListMutation.mutateAsync({
                    id,
                    data: listData,
                });
                showSuccess('List updated successfully');
                setShowExportModal(true);
            } else {
                const result = await createListMutation.mutateAsync(listData);
                showSuccess('List created successfully');
                navigate(`/builder/${result.data._id}`);
            }
        } catch (error) {
            console.error('Failed to save list:', error);
            showError('Failed to save list');
        }
    };

    const handleDelete = async () => {
        if (!window.confirm(`Are you sure you want to delete "${title}"?`)) return;

        try {
            await deleteListMutation.mutateAsync(id);
            showSuccess('List deleted successfully');
            navigate('/dashboard');
        } catch (error) {
            console.error('Failed to delete list:', error);
            showError('Failed to delete list');
        }
    };

    const exportListData = isEditMode && listData?.data ? {
        title: title || listData.data.title,
        description: description || listData.data.description,
        author: listData.data.user || listData.data.author || listData.data.owner || null,
        items: items.map(({ id, ...item }) => ({ ...item }))
    } : null;

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
                        {isEditMode && (
                            <button
                                onClick={() => setShowExportModal(true)}
                                disabled={!items.length}
                                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-md transition disabled:opacity-50"
                            >
                                Export
                            </button>
                        )}
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
                            onChange={(newCategory) => {
                                setCategory(newCategory);
                                setItems([]);
                            }}
                            disabled={false}
                            hasItems={items.length > 0}
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
                            items={items.map(item => item.id)}
                            strategy={verticalListSortingStrategy}
                        >
                            <div className="grid grid-cols-2 gap-6">
                                {items.map((item, index) => (
                                    <DraggableListItem
                                        key={item.id}
                                        item={item}
                                        rank={index + 1}
                                        onRemove={handleRemoveItem}
                                    />
                                ))}

                                {/* Empty slots */}
                                {Array(10 - items.length)
                                    .fill(null)
                                    .map((_, index) => (
                                        <EmptySlot key={`empty-${index}`} rank={items.length + index + 1} category={category} />
                                    ))}
                            </div>
                        </SortableContext>
                    </DndContext>
                </div>
            </div>
            {/* Export Modal */}
            {exportListData && (
                <ExportModal
                    isOpen={showExportModal}
                    onClose={() => setShowExportModal(false)}
                    listData={exportListData}
                />
            )}
        </div>
    );
}

export default ListBuilder;