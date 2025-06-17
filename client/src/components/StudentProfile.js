

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom'; // Import useParams hook
import ContestHistory from './ContestHistory';
import ProblemSolvingData from './ProblemSolvingData';
import { getStudentProfile, updateStudent } from '../utils/api';



const StudentProfile = ({ onBack, showMessage }) => {
    // Get the student ID directly from the URL parameters
    const { id: studentId } = useParams();

    const [currentStudentDetails, setCurrentStudentDetails] = useState(null);
    const [loadingDetails, setLoadingDetails] = useState(true);
    const [errorDetails, setErrorDetails] = useState(null);
    const [isEmailReminderDisabled, setIsEmailReminderDisabled] = useState(false);
    const [loadingToggle, setLoadingToggle] = useState(false); // Loading state for toggle


    useEffect(() => {
        const fetchCurrentStudentDetails = async () => {
            if (!studentId) { // Check if ID is available from URL params
                setErrorDetails("No student ID provided for profile.");
                setLoadingDetails(false);
                return;
            }
            setLoadingDetails(true);
            setErrorDetails(null);
            try {
                const response = await getStudentProfile(studentId); // Use ID from URL
                const fetchedStudent = response.data;
                setCurrentStudentDetails(fetchedStudent);
                setIsEmailReminderDisabled(fetchedStudent.disableEmailReminders);
            } catch (err) {
                console.error("Error fetching current student details:", err.response?.data?.message || err.message);
                setErrorDetails("Failed to load student details for profile.");
            } finally {
                setLoadingDetails(false);
            }
        };

        fetchCurrentStudentDetails();

        // Set up a polling mechanism to ensure student details are fresh,
        // especially after background syncs. In a real-time app, websockets would be better.
        const pollInterval = setInterval(fetchCurrentStudentDetails, 30000); // Poll every 30 seconds

        return () => clearInterval(pollInterval); // Cleanup on unmount

    }, [studentId]); // Re-fetch if the student ID from URL changes


    const toggleEmailReminders = async () => {
        if (!currentStudentDetails || !currentStudentDetails._id) return;

        setLoadingToggle(true);
        setErrorDetails(null);
        const newState = !isEmailReminderDisabled;

        try {
            const response = await updateStudent(currentStudentDetails._id, { disableEmailReminders: newState });
            setCurrentStudentDetails(response.data.student); // Update with the latest student data from backend
            setIsEmailReminderDisabled(newState);
            showMessage(`Email reminders ${newState ? 'disabled' : 'enabled'} for ${currentStudentDetails.name}.`);
        } catch (err) {
            console.error("Error toggling email reminders:", err.response?.data?.message || err.message);
            setErrorDetails("Failed to toggle email reminders.");
            showMessage("Failed to toggle email reminders.", true);
        } finally {
            setLoadingToggle(false);
        }
    };

    if (loadingDetails) {
        return <div className="text-center py-8 text-gray-600 dark:text-gray-300">Loading student profile...</div>;
    }

    if (errorDetails) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 text-center">
                <p className="text-xl text-red-600 dark:text-red-400 mb-4">Error: {errorDetails}</p>
                <button
                    onClick={onBack}
                    className="flex items-center text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition duration-150 ease-in-out mx-auto"
                >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                    Back to Student List
                </button>
            </div>
        );
    }

    // If currentStudentDetails is null after loading (e.g., student was deleted while on profile)
    if (!currentStudentDetails) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 text-center">
                <p className="text-xl text-gray-600 dark:text-gray-400 mb-4">Student profile not found or has been deleted.</p>
                <button
                    onClick={onBack}
                    className="flex items-center text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition duration-150 ease-in-out mx-auto"
                >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                    Back to Student List
                </button>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6">
            <button
                onClick={onBack}
                className="mb-6 flex items-center text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition duration-150 ease-in-out"
            >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                Back to Student List
            </button>

            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 pb-4 border-b border-gray-200 dark:border-gray-700">
                <div>
                    <h2 className="text-4xl font-extrabold text-gray-800 dark:text-gray-200">{currentStudentDetails.name}'s Profile</h2>
                    <p className="text-lg text-gray-600 dark:text-gray-400 mt-2">
                        Codeforces Handle:{" "}
                        <a href={`https://codeforces.com/profile/${currentStudentDetails.codeforcesHandle}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 font-semibold hover:underline">
                            {currentStudentDetails.codeforcesHandle}
                        </a>
                    </p>
                    <p className="text-md text-gray-600 dark:text-gray-400">Current Rating: <span className="font-semibold">{currentStudentDetails.currentRating || 'N/A'}</span>, Max Rating: <span className="font-semibold">{currentStudentDetails.maxRating || 'N/A'}</span></p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Last Synced: {currentStudentDetails.lastSyncDate ? new Date(currentStudentDetails.lastSyncDate).toLocaleString() : 'Never'}</p>
                </div>
                <div className="flex flex-col items-start md:items-end space-y-2 mt-4 md:mt-0">
                    <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-700 dark:text-gray-300">Disable Email Reminders:</span>
                        <label htmlFor="toggle-email" className="flex items-center cursor-pointer">
                            <div className="relative">
                                <input
                                    type="checkbox"
                                    id="toggle-email"
                                    className="sr-only"
                                    checked={isEmailReminderDisabled}
                                    onChange={toggleEmailReminders}
                                    disabled={loadingToggle}
                                />
                                <div className="block bg-gray-600 dark:bg-gray-500 w-14 h-8 rounded-full"></div>
                                <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition ${isEmailReminderDisabled ? 'translate-x-full bg-blue-600' : ''}`}></div>
                            </div>
                        </label>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Reminder Emails Sent: <span className="font-semibold">{currentStudentDetails.reminderEmailsSent || 0}</span></p>
                </div>
            </div>

            {/* Pass student ID to children components */}
            <ContestHistory studentId={currentStudentDetails._id} />
            <ProblemSolvingData studentId={currentStudentDetails._id} />
        </div>
    );
};

export default StudentProfile;

