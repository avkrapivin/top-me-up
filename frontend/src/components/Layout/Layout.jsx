import Navigation from '../Navigation/Navigation';

function Layout({ children, showNavigation = true, className = '' }) {
    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex flex-col">
            {showNavigation && <Navigation />}
            <main className={`flex-1 ${className}`}>
                {children}
            </main>
            <footer className="py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                © {new Date().getFullYear()} TopMeUp
            </footer>
        </div>
    );
}

export default Layout;