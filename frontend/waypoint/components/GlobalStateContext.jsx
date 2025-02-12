import React, { createContext, useState, useContext } from 'react';

const GlobalStateContext = createContext();

export const GlobalStateProvider = ({ children }) => {
    const [userLocation, setUserLocation] = useState(null);
    const [partySocket, setPartySocket] = useState();

    return (
        <GlobalStateContext.Provider value={{ 
            userLocation, setUserLocation, 
            partySocket, setPartySocket
        }}>
            {children}
        </GlobalStateContext.Provider>
    );
};

export const useGlobalState = () => {
    return useContext(GlobalStateContext);
};
