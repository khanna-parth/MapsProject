import { pool } from "../models/pool";
import { Party } from "../models/party";
import { PartyCreationResult } from "../models/connection/responses";
import { checkValidString } from "../util/util";
import { User } from "../models/user";


const createParty = (partyID: string, userID: string) : PartyCreationResult => {
    if (!checkValidString(partyID)) {
        return {success: false, code: 400, error: "partyID must be properly specified"}
    }

    if (!checkValidString) {
        return {success: false, code: 400, error: "userID must be properly specified"}
    }
    const party = new Party(partyID);
    try {
        pool.registerParty(partyID, party);

        return {success: true, code: 201};

    } catch (error) {
        return {success: false, code: 400, error: `Failed to create existing party.`}
    }
};

const getParty = (userID: string, partyID: string): {party?: PartyDisplay, code: number, error?: string} => {
    if (!checkValidString(partyID)) {
        return {code: 400, error: "partyID must be properly specified"}
    }

    if (!checkValidString(userID)) {
        return {code: 400, error: "userID must be properly specified"}
    }

    const existingParty = pool.listPool().find(party => party.partyID === partyID);
    if (existingParty) {
        // console.log(existingParty);
        if (!existingParty.userExists(userID)) {
            return {code: 403, error: `You do not have access to this party`};
        }
        const partyData = existingParty.connected.map(user => user.toJSONShallow());

        const connectedUsers: Partial<User>[] = partyData.map(user => ({
            ...user
        }));

        const partyDisplay: PartyDisplay = {
            partyID: existingParty.partyID,
            connected: connectedUsers,
            lastEmpty: existingParty.lastEmpty
        };

        return {party: partyDisplay, code: 200};
    }
    return {code: 404, error: 'Cannot access non-existent party.'};
}

interface PartyDisplay {
    partyID: string;
    connected: Partial<User>[];
    lastEmpty: number;
}

// If looking for /party/join go to ws.ts

export { createParty, getParty };