import * as utils from './utils.js';

export const getNearbyPlaces = async (latitude, longitude) => {
    const nearbyPlaces = await utils.postRequest('routing/feed', {lat: latitude, long: longitude});

    if (nearbyPlaces.error) {
        return {error: true, message: 'Error retrieving nearby places.'};
    }

    return {error: false, data: nearbyPlaces.data.places, message: "Retrieved places successfully."};
}