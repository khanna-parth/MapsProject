import React, { createContext, useState, useContext, useEffect } from 'react';

const GlobalStateContext = createContext();

export const GlobalStateProvider = ({ children }) => {
    const [userLocation, setUserLocation] = useState(null);
    const [partySocket, setPartySocket] = useState();
    const [userSentLocation, setUserSentLocation] = useState();
    const [userPartyChange, setUserPartyChange] = useState(false);

    useEffect(() => {
        if (!partySocket) return;

        const handleLocationUpdate = (socketData) => {
            setUserSentLocation(socketData);
        };

        const handlePartyUpdate = (socketData) => {
            setUserPartyChange(true);
        };

        partySocket.off("location");
        partySocket.off("partyUpdate");

        partySocket.on("partyUpdate", handlePartyUpdate);
        partySocket.on("location", handleLocationUpdate);

        // Cleanup function to remove listeners when `partySocket` changes
        return () => {
            partySocket.off("location", handleLocationUpdate);
            partySocket.off("partyUpdate", handlePartyUpdate);
        };

    }, [partySocket]);

    return (
        <GlobalStateContext.Provider value={{ 
            userLocation, setUserLocation, 
            partySocket, setPartySocket,
            userSentLocation, setUserSentLocation,
            userPartyChange, setUserPartyChange
        }}>
            {children}
        </GlobalStateContext.Provider>
    );
};

export const useGlobalState = () => {
    return useContext(GlobalStateContext);
};
