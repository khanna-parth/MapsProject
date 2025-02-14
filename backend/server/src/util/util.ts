import { AxiosError } from "axios";
import { Coordinates } from "../models/geolocation";

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

function isAxiosError(error: unknown): error is AxiosError {
    return (error as AxiosError).isAxiosError !== undefined;
}

function VerifyLocationData(locationData: any): Coordinates | null {
    if (isValidLocation(locationData)) {
        return locationData;
    }
    return null;
}

function isValidLocation(locationData: any): locationData is Coordinates {
    return typeof locationData === "object" &&
    locationData !== null &&
           typeof locationData.lat === "number" &&
           typeof locationData.long === "number";
  }

export { generateUniqueId, checkValidString, generateUniqueIDNumber, isAxiosError, VerifyLocationData }