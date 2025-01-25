import AsyncStorage from '@react-native-async-storage/async-storage';

export const storeData = async (key, value) => {
    try {
        await AsyncStorage.setItem(String(key), value);
        return { error: false, message: "Created successfully." }
    } catch (e) {
        return { error: true, value: e, message: "Error writing to key." }
    }
  };

export const getData = async (key) => {
    try {
        
        const value = await AsyncStorage.getItem(String(key));
        if (value !== null) {
            return { error: false, data: value, message: "Success." }
        } else {
            return { error: true, message: "No data for that key." }
        }
    } catch (e) {
        return { error: true, data: e, message: "Error reading key." }
    }
};

export const removeData = async (key) => {
    try {
        await AsyncStorage.removeItem(String(key));
        return { error: false, message: "Deleted successfully." };
    } catch (e) {
        return { error: true, data: e, message: "Error deleting key." };
    }
};

export const getRequest = async (address, data={}) => {
    try {
        const res = await fetch(`http://192.168.1.20:3010/${address}`, {
            method: 'get',
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(
                data
            )
        })
        const reqData = await res.json();
    
        if (res.status === 200) {
            return {error: false, data: reqData, message: "Request successful."};
        } else {
            return {error: true, data: reqData, message: `Returned with error code: ${res.status}`};
        }
        
    } catch (error) {
        return {error: true, message: `Returned with error: ${error}`};
    }
};

export const postRequest = async (address, data={}) => {
    try {
        const res = await fetch(`http://192.168.1.20:3010/${address}`, {
            method: 'post',
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(
                data
            )
        })
        const reqData = await res.json();
    
        if (res.status === 200) {
            return {error: false, data: reqData, message: "Request successful."};
        } else {
            return {error: true, data: reqData, message: `Returned with error code: ${res.status}`};
        }
        
    } catch (error) {
        return {error: true, message: `Returned with error: ${error}`};
    }
};

let partyID = 0
export const getPartyID = () => {
    partyID += 1;
    return partyID;
}

