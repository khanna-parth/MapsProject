import { pool } from "../models/pool";
import { Party } from "../models/party";

type PartyCreationResult = {
    success: boolean;
    error?: string;
};

const createParty = (partyID: string) : PartyCreationResult => {
    const party = new Party(partyID);
    try {
    pool.register(partyID, party);
    return {success: true};
    } catch (error) {
        return {success: false, error: `Failed to create existing party.`}
    }
};

const getParties = (): Party[] => {
    return pool.listPool()
}

export { createParty, getParties };