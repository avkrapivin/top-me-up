import PropTypes from 'prop-types';

function CategorySelector({ selected, onChange, disabled = false }) {
    const categories = [
        { id: 'movies', label: 'Movies' },
        { id: 'music', label: 'Music' },
        { id: 'games', label: 'Games' },
    ];

    return (
        <div className="flex gap-2">
            {categories.map((category) => (
                <button
                    key={category.id}
                    onClick={() => onChange(category.id)}
                    disabled={disabled}
                    className={`
                        px-4 py-2 rounded-md font-medium text-sm transition-all duration-200
                        ${selected === category.id
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                        }
                        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                    `}
                >
                    {category.label}
                </button>
            ))}
        </div>
    );
}

CategorySelector.propTypes = {
    selected: PropTypes.oneOf(['movies', 'music', 'games']).isRequired,
    onChange: PropTypes.func.isRequired,
    disabled: PropTypes.bool,
};

export default CategorySelector;