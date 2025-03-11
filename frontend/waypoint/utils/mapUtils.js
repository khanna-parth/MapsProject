import * as utils from './utils.js';

// Yea thats right I used the haversine formula, in meters
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

export const getRoute = async (userLatitude, userLongitude, destLatitude, destLongitude) => {
    console.log("getRoute run");
    
    const destination = {
        lat: destLatitude,
        long: destLongitude
    };

    if (!userLatitude || !userLongitude) {
        return { error: true, message: "Origin coordinates must be provided." };
    }

    const requestData = {
        origin: {
            lat: userLatitude.toString(),
            long: userLongitude.toString()
        },
        destination: destination
    };

    try {
        //Comment out if testing
        const routeResponse = await utils.postRequest('routing/fetch', requestData);

        //console.log(requestData);
        //console.log("RouteResponse");
        //console.log(JSON.stringify(routeResponse, null, 2));
        //console.log(routeResponse.data.duration

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

export const getETA = async (userLatitude, userLongitude, destLatitude, destLongitude) => {
    console.log("Whats your eta");

    const destination = {
        lat: destLatitude,
        long: destLongitude
    };

    if (!userLatitude || !userLongitude) {
        return { error: true, message: "ETA: Origin coordinates must be provided." };
    }

    const requestData = {
        origin: {
            lat: userLatitude.toString(),
            long: userLongitude.toString()
        },
        destination: destination
    };

    try {
        //Comment out if testing
        const etaResponse = await utils.postRequest('routing/eta', requestData);

        //console.log(JSON.stringify(etaResponse, null, 2));

        if (etaResponse.error) {
            return { error: true, message: "Error obtaining ETA." };
        }

        return etaResponse.data

    } catch (error) {
        console.log(error);
        return { error: true, message: "An error occurred while getting the ETA." };
    }
}

export const decodePolyline = (encoded) => {
    let points = [];
    let index = 0;
    let lat = 0;
    let lng = 0;

    while (index < encoded.length) {
        let byte;
        let shift = 0;
        let result = 0;

        do {
            byte = encoded.charCodeAt(index++) - 63;
            result |= (byte & 0x1f) << shift;
            shift += 5;
        } while (byte >= 0x20);

        let deltaLat = (result & 1) ? ~(result >> 1) : (result >> 1);
        lat += deltaLat;

        shift = 0;
        result = 0;

        do {
            byte = encoded.charCodeAt(index++) - 63;
            result |= (byte & 0x1f) << shift;
            shift += 5;
        } while (byte >= 0x20);

        let deltaLng = (result & 1) ? ~(result >> 1) : (result >> 1);
        lng += deltaLng;

        points.push({
            latitude: lat / 1E5,
            longitude: lng / 1E5,
        });
    }

    return points;
};