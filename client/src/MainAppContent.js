


import React, { useState, useEffect } from 'react';
// BrowserRouter, Routes, Route, useNavigate are imported by MainAppContent now
import { Routes, Route, useNavigate } from 'react-router-dom'; // Import hooks and components for routing
import { getStudents, deleteStudent, downloadStudentsCSV } from './utils/api'; // Import API functions
import StudentList from './components/StudentList';
import AddEditStudentModal from './components/AddEditStudentModal';
import DeleteConfirmationModal from './components/DeleteConfirmationModal';
import StudentProfile from './components/StudentProfile';

// // Assume a mock user ID for now as full authentication is not implemented
// const MOCK_USER_ID = 'mockUserId123';

export default function MainAppContent() { // <<< --- ENSURE THIS LINE IS CORRECT
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
    const [currentStudentData, setCurrentStudentData] = useState(null); // For edit
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [studentToDelete, setStudentToDelete] = useState(null);
    const [message, setMessage] = useState(''); // For success/error messages
    const navigate = useNavigate();

  
    const fetchAllStudents = async () => { //to fetch the list of students.
        setLoading(true);
        setError(null);
        try {
            const response = await getStudents();
            setStudents(response.data);
            setLoading(false);
        } catch (err) {
            console.error("Error fetching students:", err.response?.data?.message || err.message);
            setError("Failed to load students. Please ensure the backend is running and accessible.");
            setLoading(false);
        }
    };

    
    
    useEffect(() => { //can use this in future, just refershing the entire app every time interval
        fetchAllStudents();

        const intervalId = setInterval(fetchAllStudents, 90000); // Poll every 30 seconds
        return () => clearInterval(intervalId);

    }, []);

    const handleStudentSaved = (savedStudent) => {
        setIsAddEditModalOpen(false);

        if (savedStudent) {
            const existingStudentIndex = students.findIndex(s => s._id === savedStudent._id);

            setStudents(prevStudents => {
                if (existingStudentIndex > -1) {
                    return prevStudents.map((s, index) =>
                        index === existingStudentIndex ? savedStudent : s
                    );
                } else {
                    return [...prevStudents, savedStudent];
                }
            });
        }
    };

    const showMessage = (msg, isError = false) => {
        setMessage(msg);
        setTimeout(() => setMessage(''), 5000);
    };

    const handleAddStudent = () => {
        setCurrentStudentData(null);
        setIsAddEditModalOpen(true);
    };

    const handleEditStudent = (student) => {
        setCurrentStudentData(student);
        setIsAddEditModalOpen(true);
    };

    const handleDeleteStudent = (student) => {
        setStudentToDelete(student);
        setIsDeleteModalOpen(true);
    };

    const confirmDeleteStudent = async () => {
        if (!studentToDelete) return;

        setLoading(true);
        setError(null);
        setIsDeleteModalOpen(false);

        try {
            await deleteStudent(studentToDelete._id);
            showMessage(`Student ${studentToDelete.name} and all associated data deleted successfully!`);
            setStudents(prevStudents => prevStudents.filter(s => s._id !== studentToDelete._id));
            navigate('/'); // Navigate back to list view
        } catch (err) {
            console.error("Error deleting student:", err.response?.data?.message || err.message);
            setError("Failed to delete student and associated data. Please try again.");
        } finally {
            setLoading(false);
            setStudentToDelete(null);
        }
    };

    const handleStudentRowClick = (student) => {
        navigate(`/student/${student._id}`); // Navigate to the student profile route
    };

    const handleBackToList = () => {
        navigate('/'); // Navigate back to the home route
    };

    const handleDownloadCSV = async () => {
        try {
            const response = await downloadStudentsCSV();
            if (response.data.size === 0) {
                showMessage("No student data to download.", false);
                return;
            }

            const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.setAttribute("href", url);
            link.setAttribute("download", "students_data.csv");
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            showMessage("CSV downloaded successfully!");

        } catch (err) {
            console.error("Error downloading CSV:", err.response?.data?.message || err.message || err);
            if (err.response && err.response.data instanceof Blob) {
                const reader = new FileReader();
                reader.onload = function() {
                    try {
                        const errorData = JSON.parse(reader.result);
                        showMessage(`Failed to download CSV: ${errorData.message || 'Unknown error.'}`, true);
                    } catch (e) {
                        showMessage(`Failed to download CSV. Received unexpected data: ${reader.result.substring(0, 100)}...`, true);
                    }
                };
                reader.readAsText(err.response.data);
            } else {
                showMessage(`Failed to download CSV. ${err.message || 'Check console for details.'}`, true);
            }
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
                <div className="text-xl font-semibold">Loading Student Progress System...</div>
                <p className="mt-2 text-gray-600 dark:text-gray-400">Please ensure your Node.js backend is running (e.g., `npm run dev` in the `server/` directory).</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 text-red-600 dark:text-red-400 p-4 text-center">
                <div className="text-xl font-semibold">Error: {error}</div>
                <p className="mt-4 text-gray-700 dark:text-gray-300">
                    If you are running this locally, ensure your backend server is started.
                    Check the console for more details.
                </p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 text-gray-900 font-sans p-4 dark:bg-gray-900 dark:text-gray-100 rounded-lg shadow-lg">
            <header className="mb-6 text-center">
                <h1 className="text-4xl font-extrabold text-blue-700 dark:text-blue-400">Student Progress Management System</h1>
                {/* {MOCK_USER_ID && <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">User ID: <span className="font-mono bg-gray-200 dark:bg-gray-800 px-2 py-1 rounded text-xs">{MOCK_USER_ID}</span></p>} */}
            </header>

            {message && (
                <div className="bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-200 p-3 rounded-lg mb-4 text-center">
                    {message}
                </div>
            )}

            <Routes>
                <Route path="/" element={
                    <StudentList
                        students={students}
                        onAddStudent={handleAddStudent}
                        onEditStudent={handleEditStudent}
                        onDeleteStudent={handleDeleteStudent}
                        onViewDetails={handleStudentRowClick}
                        onDownloadCSV={handleDownloadCSV}
                    />
                } />
                <Route path="/student/:id" element={
                    <StudentProfile
                        onBack={handleBackToList}
                        showMessage={showMessage}
                    />
                } />
            </Routes>

            {isAddEditModalOpen && (
                <AddEditStudentModal
                    studentData={currentStudentData}
                    onClose={handleStudentSaved}
                    showMessage={showMessage}
                />
            )}

            {isDeleteModalOpen && (
                <DeleteConfirmationModal
                    student={studentToDelete}
                    onConfirm={confirmDeleteStudent}
                    onCancel={() => setIsDeleteModalOpen(false)}
                />
            )}
        </div>
    );
}
