import * as utils from './utils.js';

// Yea thats right I used the haversine formula, in meters 8==D - - - 
export const getDistance = (latitude1, longitude1, latitude2, longitude2) => {
    const earthRadius = 6371000;
    const latitude1Radians = (latitude1 * Math.PI) / 180;
    const latitude2Radians = (latitude2 * Math.PI) / 180;
    const latitudeDifference = ((latitude2 - latitude1) * Math.PI) / 180;
    const longitudeDifference = ((longitude2 - longitude1) * Math.PI) / 180;

    const calculation = 
        Math.sin(latitudeDifference / 2) * Math.sin(latitudeDifference / 2) + 
        Math.cos(latitude1Radians) * Math.cos(latitude2Radians) * 
        Math.sin(longitudeDifference / 2) * Math.sin(longitudeDifference / 2);

    const centralAngle = 2 * Math.atan2(Math.sqrt(calculation), Math.sqrt(1 - calculation));

    const distance = earthRadius * centralAngle;
    return distance;
};

export const getNearbyPlaces = async (latitude, longitude, preferences=['restaurant', 'parking', 'park', 'beach']) => {
    console.log(latitude, longitude);
    
    const nearbyPlaces = await utils.postRequest('routing/feed', {lat: latitude, long: longitude, preferences: preferences});

    if (nearbyPlaces.error) {
        return {error: true, message: 'Error retrieving nearby places.'};
    }

    return {error: false, data: nearbyPlaces.data.places, message: "Retrieved places successfully."};
}

export const getRoute = async (latitude, longitude) => {
    //Temp Hard Code 
    const destination = {
        lat: "37.76741612078479",
        long: "-122.23997872905375"
    };

    if (!latitude || !longitude) {
        return { error: true, message: "Origin coordinates must be provided." };
    }

    const requestData = {
        origin: {
            lat: latitude.toString(),
            long: longitude.toString()
        },
        destination: destination
    };

    try {
        const routeResponse = await utils.postRequest('routing/fetch', requestData);

        // console.log("RouteResponse");
        // console.log(JSON.stringify(routeResponse, null, 2));

        if (routeResponse.error) {
            return { error: true, message: "Error retrieving route." };
        }

        return {
            error: false,
            data: routeResponse.data,
            message: "Got Route."
        };
    } catch (error) {
        return { error: true, message: "An error occurred while fetching the route." };
    }
};