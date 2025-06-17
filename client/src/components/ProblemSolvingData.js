

import React, { useState, useEffect, useCallback } from 'react';
import { Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import { getProblemData } from '../utils/api';

import HeatmapSquare from './HeatmapSquare'; 

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);


const ProblemSolvingData = ({ studentId }) => {
    const [filter, setFilter] = useState('30d'); // '7d', '30d', '90d'
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [metrics, setMetrics] = useState({
        mostDifficultProblem: 'N/A',
        totalProblemsSolved: 0,
        averageRating: 0,
        averageProblemsPerDay: 0,
    });
    const [ratingBucketData, setRatingBucketData] = useState({});
    const [heatmapData, setHeatmapData] = useState({});

    useEffect(() => {
        const fetchProblemData = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await getProblemData(studentId, filter);
                const data = response.data;

                setMetrics(data.metrics);
                setRatingBucketData(data.ratingBuckets);
                setHeatmapData(data.heatmapData); // This heatmapData is already pre-processed for 90 days from backend

            } catch (err) {
                console.error("Error fetching problem data:", err);
                setError("Failed to load problem solving data.");
            } finally {
                setLoading(false);
            }
        };

        fetchProblemData();
    }, [filter, studentId]);

    const barChartData = {
        labels: Object.keys(ratingBucketData),
        datasets: [
            {
                label: 'Problems Solved',
                data: Object.values(ratingBucketData),
                backgroundColor: 'rgba(54, 162, 235, 0.6)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1,
            },
        ],
    };

    const barChartOptions = {
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
                text: 'Problems Solved by Rating Bucket',
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
                beginAtZero: true,
                ticks: {
                    color: 'rgb(107 114 128)'
                },
                grid: {
                    color: 'rgba(107, 114, 128, 0.2)'
                }
            }
        }
    };

    // Helper to generate the last 90 days for the heatmap grid
    const getHeatmapWeeks = () => {
        const today = new Date();
        const days = [];
        for (let i = 0; i < 90; i++) {
            const d = new Date(today);
            d.setDate(today.getDate() - i);
            days.unshift(d); // Add to beginning to keep chronological order
        }

        const weeks = [];
        let currentWeek = [];
        let lastDayOfWeek = -1; // 0 for Sunday, 6 for Saturday

        days.forEach((day, index) => {
            const dayOfWeek = day.getDay(); // 0 for Sunday, 6 for Saturday

            
            if (dayOfWeek <= lastDayOfWeek || index === 0) {
                if (currentWeek.length > 0) {
                    // Fill the rest of the previous week with nulls if it wasn't full
                    while (currentWeek.length < 7) {
                        currentWeek.push(null);
                    }
                    weeks.push(currentWeek);
                }
                currentWeek = Array(7).fill(null); // Initialize a new week with nulls
            }
            currentWeek[dayOfWeek] = day; // Place the day in its correct day-of-week slot
            lastDayOfWeek = dayOfWeek;
        });

        // Add the last week
        if (currentWeek.length > 0) {
            while (currentWeek.length < 7) {
                currentWeek.push(null);
            }
            weeks.push(currentWeek);
        }
        return weeks;
    };

    const heatmapWeeks = getHeatmapWeeks();


    if (loading) return <div className="text-center py-4 text-gray-600 dark:text-gray-300">Loading problem data...</div>;
    if (error) return <div className="text-center py-4 text-red-600 dark:text-red-400">Error: {error}</div>;

    const hasNoData = metrics.totalProblemsSolved === 0 && Object.values(ratingBucketData).every(val => val === 0);

    return (
        <div className="mt-8 p-6 bg-gray-50 dark:bg-gray-700 rounded-lg shadow-md">
            <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4">Problem Solving Data</h3>
            <div className="mb-4 space-x-2">
                <button onClick={() => setFilter('7d')} className={`px-4 py-2 rounded-lg font-semibold ${filter === '7d' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500'}`}>Last 7 Days</button>
                <button onClick={() => setFilter('30d')} className={`px-4 py-2 rounded-lg font-semibold ${filter === '30d' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500'}`}>Last 30 Days</button>
                <button onClick={() => setFilter('90d')} className={`px-4 py-2 rounded-lg font-semibold ${filter === '90d' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500'}`}>Last 90 Days</button>
            </div>

            {hasNoData ? (
                <p className="text-gray-600 dark:text-gray-400 text-center py-4">No problem solving data available for the selected period.</p>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                            <p className="text-sm text-gray-500 dark:text-gray-300">Most Difficult Problem Solved</p>
                            <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{metrics.mostDifficultProblem}</p>
                        </div>
                        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                            <p className="text-sm text-gray-500 dark:text-gray-300">Total Problems Solved</p>
                            <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{metrics.totalProblemsSolved}</p>
                        </div>
                        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                            <p className="text-sm text-gray-500 dark:text-gray-300">Average Rating</p>
                            <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{metrics.averageRating}</p>
                        </div>
                        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                            <p className="text-sm text-gray-500 dark:text-gray-300">Avg. Problems per Day</p>
                            <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{metrics.averageProblemsPerDay}</p>
                        </div>
                    </div>

                    <div className="h-80 w-full mb-6">
                        <Bar data={barChartData} options={barChartOptions} />
                    </div>

                    <h4 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-3">Submission Heatmap (Last 90 Days)</h4>
                    <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-inner overflow-x-auto">
                        <div className="flex flex-col space-y-1">
                            <div className="flex justify-end pr-2 space-x-4 text-xs text-gray-500 dark:text-gray-400 min-w-[300px]">
                                {/* Month Labels - approximated, you could dynamically generate based on 90 days */}
                                <span className="flex-1 text-left">Jan</span><span className="flex-1 text-left">Feb</span><span className="flex-1 text-left">Mar</span>
                                <span className="flex-1 text-left">Apr</span><span className="flex-1 text-left">May</span><span className="flex-1 text-left">Jun</span>
                                <span className="flex-1 text-left">Jul</span><span className="flex-1 text-left">Aug</span><span className="flex-1 text-left">Sep</span>
                                <span className="flex-1 text-left">Oct</span><span className="flex-1 text-left">Nov</span><span className="flex-1 text-left">Dec</span>
                            </div>
                            <div className="flex space-x-1">
                                <div className="flex flex-col justify-start text-xs text-gray-500 dark:text-gray-400 space-y-0.5 mt-2">
                                    <span>Mon</span>
                                    <span>Tue</span>
                                    <span>Wed</span>
                                    <span>Thu</span>
                                    <span>Fri</span>
                                    <span>Sat</span>
                                    <span>Sun</span>
                                </div>
                                <div className="grid grid-flow-col auto-cols-min gap-1">
                                    {heatmapWeeks.map((week, weekIndex) => (
                                        <div key={weekIndex} className="flex flex-col gap-1">
                                            {week.map((day, dayIndex) => {
                                                const dateStr = day ? day.toISOString().split('T')[0] : null;
                                                const count = dateStr ? (heatmapData[dateStr] || 0) : 0;
                                                return (
                                                    <HeatmapSquare key={dayIndex} count={count} />
                                                );
                                            })}
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="flex justify-end mt-2">
                                <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                                    <span>Less</span>
                                    <HeatmapSquare count={0} />
                                    <HeatmapSquare count={1} />
                                    <HeatmapSquare count={3} />
                                    <HeatmapSquare count={6} />
                                    <span>More</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default ProblemSolvingData;

