import { pool } from "../models/pool";
import { Party } from "../models/party";
import { PartyCreationResult } from "../models/connection/responses";
import { checkValidString, generateUniqueId, generateUniqueIDNumber } from "../util/util";
import { User } from "../models/user";


const createParty = (userID: string) : PartyCreationResult => {
    if (!checkValidString(userID)) {
        return {success: false, code: 400, error: "userID must be properly specified"}
    }

    let partyID = generateUniqueIDNumber(100000, 999999)

    while (pool.partyExists(partyID.toString())) {
        partyID = generateUniqueIDNumber(100000, 999999);
    }

    const partyIDString = partyID.toString()

    const party = new Party(partyIDString);

    const creator = pool.userExistsByID(userID);
    if (creator) {
        party.addUser(creator);
    } else {
        console.warn(`Creator with userID ${userID} not found in pool. Ensure the user is registered.`);
        return { success: false, code: 400, error: "Creator not registered. Please register the user before creating a party." };
    }
    try {
        pool.registerParty(partyIDString, party);
        return { success: true, code: 201, partyID: partyIDString };
    } catch (error) {
        return { success: false, code: 400, error: `Failed to create party.` };
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