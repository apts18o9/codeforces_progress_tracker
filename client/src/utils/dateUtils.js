
 
export const getDaysAgo = (days) => {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date;
};

