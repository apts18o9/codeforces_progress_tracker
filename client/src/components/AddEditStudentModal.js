

import React, { useState, useEffect } from 'react';
import { createStudent, updateStudent, triggerCodeforcesSync } from '../utils/api';


const AddEditStudentModal = ({ studentData, onClose, showMessage }) => {
    const [name, setName] = useState(studentData?.name || '');
    const [email, setEmail] = useState(studentData?.email || '');
    const [phoneNumber, setPhoneNumber] = useState(studentData?.phoneNumber || '');
    const [codeforcesHandle, setCodeforcesHandle] = useState(studentData?.codeforcesHandle || '');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const isEditMode = !!studentData;

    // Helper to clean the Codeforces handle before sending to backend
    const cleanCodeforcesHandle = (handle) => {
        if (!handle) return '';
        // Remove common Codeforces profile URL prefixes
        const urlPrefixes = [
            'https://codeforces.com/profile/',
            'http://codeforces.com/profile/',
            'codeforces.com/profile/'
        ];
        let cleanedHandle = handle.trim();
        for (const prefix of urlPrefixes) {
            if (cleanedHandle.startsWith(prefix)) {
                cleanedHandle = cleanedHandle.substring(prefix.length);
                break;
            }
        }
        return cleanedHandle.trim(); // Trim again to catch any new whitespace
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        // Clean the handle right before submission
        const cleanedHandle = cleanCodeforcesHandle(codeforcesHandle);

        // Basic client-side validation
        if (!name || !email || !cleanedHandle) { // Use cleanedHandle for validation
            setError("All required fields (Name, Email, Codeforces Handle) must be filled.");
            setLoading(false);
            return;
        }

        const studentPayload = {
            name,
            email,
            phoneNumber,
            codeforcesHandle: cleanedHandle, // Send the cleaned handle to the backend
        };

        try {
            let response;
            let currentStudentId = studentData?._id; // Use _id from MongoDB
            let successMessage = '';

            if (isEditMode) {
                // Check if handle changed (compare cleaned handle)
                const handleChanged = cleanCodeforcesHandle(studentData.codeforcesHandle) !== cleanedHandle;
                response = await updateStudent(currentStudentId, studentPayload);
                successMessage = `Student ${name} updated successfully!`;

                if (handleChanged) {
                    // Trigger Codeforces sync immediately if handle changed
                    showMessage(`Codeforces handle updated, fetching new data for ${cleanedHandle}...`);
                    // Backend handles the actual sync, which also includes inactivity check
                    await triggerCodeforcesSync(currentStudentId);
                    successMessage += ` Codeforces data synced for ${cleanedHandle}!`;
                }
            } else {
                response = await createStudent(studentPayload); // Backend handles initial sync and inactivity check
                currentStudentId = response.data.student._id; // Get the ID of the newly created student
                successMessage = `Student ${name} added successfully! Initial Codeforces data sync started.`;
            }

           
            const finalStudentData = response.data.student;

            // If backend indicates a partial sync failure, show warning
            if (response.data.message && response.data.message.includes('failed partially')) {
                showMessage(response.data.message, true); // Show as error/warning
            } else {
                showMessage(successMessage);
            }

            onClose(finalStudentData); // Pass the updated student object to the parent
        } catch (err) {
            console.error("Error saving student:", err.response?.data?.message || err.message);
            setError(err.response?.data?.message || "Failed to save student. Please try again.");
            showMessage("Failed to save student.", true);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-2xl w-full max-w-md transform transition-all duration-300 scale-100">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-6 border-b pb-3">{isEditMode ? 'Edit Student' : 'Add New Student'}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
                        <input
                            type="text"
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone Number</label>
                        <input
                            type="tel"
                            id="phoneNumber"
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        />
                    </div>
                    <div>
                        <label htmlFor="codeforcesHandle" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Codeforces Handle</label>
                        <input
                            type="text"
                            id="codeforcesHandle"
                            value={codeforcesHandle}
                            onChange={(e) => setCodeforcesHandle(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                            placeholder="e.g., tourist, neal, Benq"
                            required
                        />
                    </div>

                    {error && <p className="text-red-500 text-sm mt-2">{error}</p>}

                    <div className="flex justify-end space-x-4 pt-4">
                        <button
                            type="button"
                            onClick={() => onClose(null)} // Pass null if canceling
                            className="px-5 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 font-medium shadow-sm transition duration-150 ease-in-out"
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className={`px-5 py-2 rounded-md font-semibold shadow-md transition duration-300 ease-in-out ${
                                loading ? 'bg-blue-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white transform hover:scale-105'
                            }`}
                            disabled={loading}
                        >
                            {loading ? (
                                <svg className="animate-spin h-5 w-5 text-white mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            ) : isEditMode ? 'Update Student' : 'Add Student'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddEditStudentModal;

