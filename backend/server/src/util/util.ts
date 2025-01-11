const generateUniqueId = () => {
    return Math.random().toString(36).substring(2, 9);
};

const checkValidString = (str: string): boolean => {
    if (typeof str !== 'string' || str.trim() === '') {
        return false;
    }

    return true;
}

export { generateUniqueId, checkValidString }