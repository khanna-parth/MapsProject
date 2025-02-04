const generateUniqueId = () => {
    return Math.random().toString(36).substring(2, 9);
};

const generateUniqueIDNumber = (min: number, max: number) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

const checkValidString = (str: string): boolean => {
    if (typeof str !== 'string' || str.trim() === '') {
        return false;
    }

    return true;
}

export { generateUniqueId, checkValidString, generateUniqueIDNumber }