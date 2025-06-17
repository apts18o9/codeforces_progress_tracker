// client/src/components/HeatmapSquare.js

import React from 'react';


const HeatmapSquare = React.memo(({ count }) => {
    let colorClass = 'bg-gray-300 dark:bg-gray-600'; // No submissions
    if (count > 0 && count <= 2) colorClass = 'bg-green-300 dark:bg-green-700';
    else if (count > 2 && count <= 5) colorClass = 'bg-green-500 dark:bg-green-800';
    else if (count > 5) colorClass = 'bg-green-700 dark:bg-green-900';

    return (
        <div
            className={`w-4 h-4 rounded-sm transition-colors duration-200 cursor-pointer flex items-center justify-center text-xs text-white ${colorClass}`}
            title={`${count} problems solved`} // Tooltip on hover
        >
            
        </div>
    );
});

export default HeatmapSquare;

