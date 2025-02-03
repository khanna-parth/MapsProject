import axios from "axios";
import { Coordinates, ReverseGeocodeResult } from "../models/geolocation";

const reverseGeocode = async (coords: Coordinates): Promise<ReverseGeocodeResult> => {
    const headers = {
        "Authorization": process.env.RADAR_API
    }
    try {
        const resp = await axios.get(`https://api.radar.io/v1/geocode/reverse?coordinates=${coords.lat},${coords.long}`, {headers: headers})
        
        const status = resp.data['meta']['code']
        let res: ReverseGeocodeResult;
        if (status === 200) {
            const data = resp.data['addresses']

            res = {
                data: {
                    address: data['formattedAddress'],
                    county: data['county'],
                    country: data['country'],
                },
                code: 200
            }
        } else {
            res = {
                error: "Radar reverse geolocation failed",
                code: 200
            }
        }

        return res
    } catch (erro) {
        console.log("Error:", erro)
        let err: ReverseGeocodeResult = {
            error: `${erro}`,
            code: 500
        }

        return err
    }
}

export { reverseGeocode }