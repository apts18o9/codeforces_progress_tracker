


const DeleteConfirmationModal = ({ student, onConfirm, onCancel }) => {
    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-2xl w-full max-w-sm transform transition-all duration-300 scale-100">
                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4">Confirm Deletion</h2>
                <p className="text-gray-600 dark:text-gray-300 mb-6">Are you sure you want to delete <span className="font-semibold text-red-600 dark:text-red-400">{student?.name}</span>? This action cannot be undone and will delete all associated Codeforces data.</p>
                <div className="flex justify-end space-x-4">
                    <button
                        onClick={onCancel}
                        className="px-5 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 font-medium shadow-sm transition duration-150 ease-in-out"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-md shadow-md transition duration-300 ease-in-out transform hover:scale-105"
                    >
                        Delete
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DeleteConfirmationModal;

