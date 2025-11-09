import Navigation from '../Navigation/Navigation';

function Layout({ children, showNavigation = true, className = '' }) {
    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex flex-col">
            {showNavigation && <Navigation />}
            <main className={`flex-1 ${className}`}>
                {children}
            </main>
        </div>
    );
}

export default Layout;