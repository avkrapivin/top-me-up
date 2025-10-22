import { useAuth } from "../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useUserLists } from "../hooks/useListApi";
import ListCard from "../components/Lists/ListCard";

function Dashboard() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const { data: listsData, isLoading, error } = useUserLists();

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/');
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-8">
            <div className="max-w-4xl mx-auto">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                                Dashboard
                            </h1>
                            <p className="text-gray-600 dark:text-gray-300">
                                Welcome, {user?.displayName || 'User'}!
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                {user?.email}
                            </p>
                        </div>

                        <button
                            onClick={handleLogout}
                            className="bg-red-500 hover:bg-red-600 !text-white font-medium py-2 px-6 rounded-lg transition duration-200 shadow-md hover:shadow-lg"
                        >
                            Logout
                        </button>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                            Your Lists
                        </h2>
                        <button
                            onClick={() => navigate('/builder')}
                            className="bg-blue-500 hover:bg-blue-600 !text-white font-medium py-2 px-4 rounded-lg transition duration-200"
                        >
                            Create New List
                        </button>
                    </div>

                    {isLoading && (
                        <p className="text-gray-600 dark:text-gray-300">Loading your lists...</p>
                    )}

                    {error && (
                        <p className="text-red-600 dark:text-red-400">Error loading lists: {error.message}</p>
                    )}

                    {!isLoading && !error && listsData?.data?.length === 0 && (
                        <p className="text-gray-600 dark:text-gray-300">
                            You haven't created any lists yet. Click "Create New List" to get started!
                        </p>
                    )}

                    {!isLoading && !error && listsData?.data?.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {listsData.data.map((list) => (
                                <ListCard key={list._id} list={list} />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Dashboard;