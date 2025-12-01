import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useState, useRef, useEffect } from 'react';

function Navigation() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [showMobileMenu, setShowMobileMenu] = useState(false);
    const menuRef = useRef(null);
    const mobileMenuRef = useRef(null);
    const hamburgerButtonRef = useRef(null);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setShowUserMenu(false);
            }
            if (
                mobileMenuRef.current &&
                !mobileMenuRef.current.contains(event.target) &&
                hamburgerButtonRef.current &&
                !hamburgerButtonRef.current.contains(event.target)
            ) {
                setShowMobileMenu(false);
            }
        };

        if (showUserMenu || showMobileMenu) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showUserMenu, showMobileMenu]);

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/');
            setShowUserMenu(false);
            setShowMobileMenu(false);
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    return (
        <nav className="bg-white dark:bg-gray-800 shadow-md border-b border-gray-200 dark:border-gray-700">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-row items-center justify-between h-16">
                    {/* Logo/Name */}
                    <Link
                        to="/"
                        className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition cursor-pointer flex-shrink-0"
                    >
                        TopMeUp
                    </Link>

                    {/* Navigation links */}
                    <div className="hidden sm:flex items-center gap-4">
                        {/* Explore - available to all */}
                        <Link
                            to="/explore"
                            className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition"
                        >
                            Explore
                        </Link>

                        {/* For authenticated users */}
                        {user ? (
                            <>
                                {/* Dashboard */}
                                <Link
                                    to="/dashboard"
                                    className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition"
                                >
                                    Dashboard
                                </Link>

                                {/* User Menu */}
                                <div className="relative" ref={menuRef}>
                                    <button
                                        onClick={() => setShowUserMenu(!showUserMenu)}
                                        className="flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                                    >
                                        <span>{user.displayName || 'User'}</span>
                                        <svg
                                            className={`w-4 h-4 transition-transform ${showUserMenu ? 'rotate-180' : ''}`}
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </button>

                                    {/* Dropdown Menu */}
                                    {showUserMenu && (
                                        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50">
                                            <Link
                                                to="/profile"
                                                onClick={() => setTimeout(() => setShowUserMenu(false), 100)}
                                                className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                                            >
                                                My Profile
                                            </Link>
                                            <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
                                            <button
                                                onClick={handleLogout}
                                                className="block w-full text-center px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                                            >
                                                Logout
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            /* For unauthenticated users */
                            <>
                                <Link
                                    to="/login"
                                    className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition"
                                >
                                    Login
                                </Link>
                                <Link
                                    to="/register"
                                    className="bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded-lg transition"
                                >
                                    Register
                                </Link>
                            </>
                        )}
                    </div>

                    {/* Mobile Menu Button - visible only on mobile (sm:hidden) */}
                    <button
                        ref={hamburgerButtonRef}
                        onClick={(e) => {
                            // simply toggle the state, without stopPropagation
                            setShowMobileMenu(!showMobileMenu);
                        }}
                        className="sm:hidden p-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                        aria-label="Toggle menu"
                    >
                        {/* Cross icon (when menu is open) or hamburger icon (when menu is closed) */}
                        {showMobileMenu ? (
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        ) : (
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        )}
                    </button>
                </div>

                {/* Mobile Menu - dropdown menu for mobile (sm:hidden) */}
                {showMobileMenu && (
                    <div ref={mobileMenuRef} className="sm:hidden border-t border-gray-200 dark:border-gray-700 py-4">
                        <div className="flex flex-col gap-3">
                            {/* Explore - available to all */}
                            <Link
                                to="/explore"
                                onClick={() => setShowMobileMenu(false)}
                                className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition px-2 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                            >
                                Explore
                            </Link>

                            {/* For authenticated users */}
                            {user ? (
                                <>
                                    <Link
                                        to="/dashboard"
                                        onClick={() => setShowMobileMenu(false)}
                                        className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition px-2 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                                    >
                                        Dashboard
                                    </Link>
                                    <Link
                                        to="/profile"
                                        onClick={() => setShowMobileMenu(false)}
                                        className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition px-2 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                                    >
                                        My Profile
                                    </Link>
                                    <button
                                        onClick={() => {
                                            handleLogout();
                                            setShowMobileMenu(false);
                                        }}
                                        className="text-center text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 font-medium transition px-2 py-2 rounded-lg"
                                    >
                                        Logout
                                    </button>
                                </>
                            ) : (
                                /* For unauthenticated users */
                                <>
                                    <Link
                                        to="/login"
                                        onClick={() => setShowMobileMenu(false)}
                                        className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition px-2 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                                    >
                                        Login
                                    </Link>
                                    <Link
                                        to="/register"
                                        onClick={() => setShowMobileMenu(false)}
                                        className="bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded-lg transition text-center"
                                    >
                                        Register
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </nav>
    );
}

export default Navigation;