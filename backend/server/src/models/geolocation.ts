
interface BaseCoordinates {
    lat: number
    long: number
    asString(): string;
}

class Coordinates implements BaseCoordinates {
    lat: number
    long: number

    constructor(lat: number, long: number) {
        this.lat = lat;
        this.long = long;
    }

    asString(): string {
        return `${this.lat},${this.long}`
    }
}

interface ReverseGeocodeResult {
    data?: {
        address: string
        county: string
        country: string
    }
    error?: string
    code: number
}

interface DirectionsDistance {
    value: number
    units: string
}

interface DirectionsDuration {
    value: number
    units: string
}

interface LocationDetails {
    photos?: string[]
    formattedAddress: string
    types: string[]
    primaryType: string
}

interface Location {
    name?: string
    address: string
    coordinates?: Coordinates
    details?: LocationDetails
}

interface Directions {
    distance: DirectionsDistance
    duration: DirectionsDuration
    origin: Coordinates
    point: Coordinates
    description: string
    action: string
    polyline: string
    mode: string
}

interface DirectionsResult {
    data?: {
    distance: DirectionsDistance
    duration: DirectionsDuration
    start: string
    end: string
    directions: Directions[]
    },
    error?: string
    code: number
}

interface PlacesResult {
    data?: {
        places: Location[]
    }
    code: number
    error?: string
}

export { Coordinates, ReverseGeocodeResult, DirectionsDistance, DirectionsDuration, DirectionsResult, Directions, PlacesResult, Location }