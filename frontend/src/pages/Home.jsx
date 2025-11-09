import { useHealthCheck } from "../hooks/useApi";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import Layout from "../components/Layout/Layout";

function Home() {
    const { isLoading, error } = useHealthCheck();
    const { user, logout } = useAuth();

    const handleLogout = async () => {
        try {
            await logout();
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    if (isLoading) {
        return (
            <Layout>
                <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
                        <p className="text-gray-600 dark:text-gray-300">Loading...</p>
                    </div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4">
                <div className="text-center">
                    <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                        TopMeUp
                    </h1>
                    <p className="text-gray-600 dark:text-gray-300 mb-4">
                        Create and share your top-10 lists
                    </p>

                    {user ? (
                        <div className="space-y-4">
                            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-4">
                                <p className="text-green-600 dark:text-green-400 text-lg font-medium mb-2">
                                    Welcome, {user.displayName}!
                                </p>
                                <p className="text-gray-600 dark:text-gray-400 text-sm">
                                    {user.email}
                                </p>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <Link
                                    to="/dashboard"
                                    className="inline-block bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 px-6 rounded-lg transition duration-200 shadow-md hover:shadow-lg"
                                >
                                    Go to Dashboard
                                </Link>
                                <button
                                    onClick={handleLogout}
                                    className="inline-block bg-red-500 hover:bg-red-600 text-white font-medium py-3 px-6 rounded-lg transition duration-200 shadow-md hover:shadow-lg"
                                >
                                    Logout
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-x-4">
                            <Link
                                to="/login"
                                className="inline-block bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-md transition duration-200"
                            >
                                Login
                            </Link>
                            <Link
                                to="/register"
                                className="inline-block bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded-md transition duration-200"
                            >
                                Register
                            </Link>
                        </div>
                    )}

                    {error && (
                        <div className="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 px-4 py-2 rounded">
                            API Connection Error
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
}

export default Home;