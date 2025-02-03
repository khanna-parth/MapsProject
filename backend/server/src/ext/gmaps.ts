import axios from "axios"
import {Client} from "@googlemaps/google-maps-services-js";
import { Coordinates, Directions, DirectionsResult, PlacesResult, Location } from "../models/geolocation";
import { DirectionsRequest } from "../models/connection/requests";
import { checkValidString } from "../util/util";

const client = new Client({});

const nearbyPlaces = async (coords: Coordinates): Promise<PlacesResult> => {
    if (!coords.lat || !coords.long) {
        return {code: 404, error: `Invalid coordinates: ${coords.lat}, ${coords.long}`}
    }

    try {
        const data = {
            // includedTypes: ["restaurant"],
            maxResultCount: 10,
            locationRestriction: {
                circle: {
                    center: {
                        latitude: coords.lat,
                        longitude: coords.long},
                        radius: 500.0
                }
            }
        }

        const headers = {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": process.env.GMAPS_API,
            "X-Goog-FieldMask": "places.displayName,places.location"
        }

        const response = await axios.post("https://places.googleapis.com/v1/places:searchNearby", data, {headers: headers});

        const placesData = response.data['places'];

        let places: PlacesResult = {data: {places: []}, code: response.status};

        placesData.map((place: any) => {
            let location: Location = {
                address: place['displayName']['text'],
                coordinates: new Coordinates(place['location']['latitude'], place['location']['longitude'])
            }
            places.data?.places.push(location);
        })

        return places
    } catch (error) {
        console.log(`Error: ${error}`);
        const err: PlacesResult = {code: 500, error: `${error}`};
        return err;
    }
}


const searchPlaces = async (query: string): Promise<PlacesResult> => {
    if (!checkValidString(query)) { return { code: 404, error: "Query cannot be empty"} }
    try {

        const data = { textQuery: query }
        const headers = {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": process.env.GMAPS_API,
            "X-Goog-FieldMask": "places.displayName,places.formattedAddress,places.priceLevel"
        }

        const response = await axios.post("https://places.googleapis.com/v1/places:searchText", data, {headers: headers});
        if (response.status === 200) {
            const placesData = response.data['places']
            let places: PlacesResult = {
                code: 200,
                data: {places: [],}
            }

            placesData.map((place: any) => {
                places.data?.places.push({
                    name: place['displayName']['text'],
                    address: place['formattedAddress']
                })
            })
            return places
        } else {
            return {code: response.status, error: "Request failed"}
        }
    } catch (error) {
        console.log(error)
        return { code: 500, error: `${error}`}
    }
}

const getDirections = async (directionsReq: DirectionsRequest): Promise<DirectionsResult> => {
    let origin: string
    let destination: string

    if (directionsReq.origin && directionsReq.destination) {
        origin = new Coordinates(directionsReq.origin.lat, directionsReq.origin.long).asString();
        destination = new Coordinates(directionsReq.destination.lat, directionsReq.destination.long).asString();
    } else if (directionsReq.originString && directionsReq.destinationString) {
        origin = directionsReq.originString;
        destination = directionsReq.destinationString;
    } else {
        return {code: 404, error: "Origin/Destination cannot be empty"}
    }

    if (!origin || !destination) { return {code: 404, error: "Origin/Destination cannot be empty"} }
    if ( !checkValidString(origin) || !checkValidString(destination)) { return {code: 404, error: "Origin/Destination cannot be empty"} }

    try {
        const response = await client.directions({
            params: {
              origin: origin,
              destination: destination,
              key: process.env.GMAPS_API || "",
            },
            timeout: 1000,
        })

        const base = response['data']['routes'][0]['legs'][0]
        const steps = response['data']['routes'][0]['legs'][0]['steps']

        let directions: DirectionsResult = {
            data: {
                distance: {
                    value: base.distance.value,
                    units: 'meters'
                },
                duration: {
                    value: base.duration.value,
                    units: 'seconds',
                },
                start: response['data']['routes'][0]['legs'][0].start_address,
                end: response['data']['routes'][0]['legs'][0].end_address,
                directions: [],
            },
            code: 200
        };

        steps.map((step) => {
            let direction: Directions = {
                distance: {
                    value: step.distance.value,
                    units: step.distance.text.split(" ")[-1]
                },
                duration: {
                    value: step.duration.value,
                    units: 'seconds',
                },
                origin: new Coordinates(step.start_location.lat, step.start_location.lng),
                point: new Coordinates(step.end_location.lat, step.end_location.lng),
                // GPT gave me this regex. works tho
                description: step.html_instructions.replace(/<\/?[^>]+(>|$)/g, "").trim(),
                action: step.maneuver,
                polyline: step.polyline.points,
                mode: step.travel_mode
            }

            directions.data?.directions.push(direction)
        })
            
        return directions
    } catch (error) {
        console.log(error)

        let erro: DirectionsResult = {
            error: `${error}`,
            code: 500
        }
        return erro
    }
}

export {getDirections, nearbyPlaces, searchPlaces}