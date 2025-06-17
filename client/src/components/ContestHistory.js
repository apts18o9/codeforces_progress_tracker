

import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import { getContestHistory } from '../utils/api';
import { getDaysAgo } from '../utils/dateUtils';


// Register Chart.js components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
);


const ContestHistory = ({ studentId }) => {
    const [filter, setFilter] = useState('365d'); // '30d', '90d', '365d'
    const [contests, setContests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchContestHistory = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await getContestHistory(studentId, filter);
                // Ensure data is sorted by date for accurate graph plotting
                const sortedContests = response.data.sort((a, b) => new Date(a.submissionTime).getTime() - new Date(b.submissionTime).getTime());
                setContests(sortedContests);
            } catch (err) {
                console.error("Error fetching contest history:", err);
                setError("Failed to load contest history.");
            } finally {
                setLoading(false);
            }
        };

        fetchContestHistory();
    }, [filter, studentId]);

    const chartData = {
        labels: contests.map(c => new Date(c.submissionTime).toLocaleDateString()),
        datasets: [
            {
                label: 'Rating',
                data: contests.map(c => c.newRating),
                borderColor: 'rgb(75, 192, 192)',
                backgroundColor: 'rgba(75, 192, 192, 0.5)',
                tension: 0.1,
                pointRadius: 5,
                pointBackgroundColor: 'rgb(75, 192, 192)',
                pointBorderColor: '#fff',
                pointHoverRadius: 7,
            },
        ],
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
                labels: {
                    color: 'rgb(107 114 128)' // Tailwind gray-500
                }
            },
            title: {
                display: true,
                text: 'Codeforces Rating Graph',
                color: 'rgb(107 114 128)'
            },
        },
        scales: {
            x: {
                ticks: {
                    color: 'rgb(107 114 128)'
                },
                grid: {
                    color: 'rgba(107, 114, 128, 0.2)'
                }
            },
            y: {
                ticks: {
                    color: 'rgb(107 114 128)'
                },
                grid: {
                    color: 'rgba(107, 114, 128, 0.2)'
                }
            }
        }
    };


    if (loading) return <div className="text-center py-4 text-gray-600 dark:text-gray-300">Loading contest history...</div>;
    if (error) return <div className="text-center py-4 text-red-600 dark:text-red-400">Error: {error}</div>;

    return (
        <div className="mt-8 p-6 bg-gray-50 dark:bg-gray-700 rounded-lg shadow-md">
            <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4">Contest History</h3>
            <div className="mb-4 space-x-2">
                <button onClick={() => setFilter('30d')} className={`px-4 py-2 rounded-lg font-semibold ${filter === '30d' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500'}`}>Last 30 Days</button>
                <button onClick={() => setFilter('90d')} className={`px-4 py-2 rounded-lg font-semibold ${filter === '90d' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500'}`}>Last 90 Days</button>
                <button onClick={() => setFilter('365d')} className={`px-4 py-2 rounded-lg font-semibold ${filter === '365d' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500'}`}>Last 365 Days</button>
            </div>

            {contests.length === 0 ? (
                <p className="text-gray-600 dark:text-gray-400 text-center py-4">No contest data available for the selected period.</p>
            ) : (
                <>
                    <div className="h-80 w-full mb-6">
                        <Line data={chartData} options={chartOptions} />
                    </div>

                    <div className="overflow-x-auto rounded-lg shadow-md border border-gray-200 dark:border-gray-600">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
                            <thead className="bg-gray-100 dark:bg-gray-600">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider rounded-tl-lg">Contest Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Rank</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Old Rating</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">New Rating</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider rounded-tr-lg">Rating Change</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                {contests.map(contest => (
                                    <tr key={contest.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition duration-150 ease-in-out">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">{contest.contestName}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{new Date(contest.submissionTime).toLocaleDateString()}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{contest.rank}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{contest.oldRating}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{contest.newRating}</td>
                                        <td className={`px-6 py-4 whitespace-nowrap text-sm font-semibold ${contest.ratingChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>{contest.ratingChange}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
        </div>
    );
};

export default ContestHistory;

