export const dateFormat = (date) => {
    return new Date(date).toLocaleDateString('en-Us', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
};

export default dateFormat;