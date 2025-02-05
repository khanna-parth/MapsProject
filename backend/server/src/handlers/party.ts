import { pool } from "../models/pool";
import { Party } from "../models/party";
import { PartyCreationResult } from "../models/connection/responses";
import { checkValidString, generateUniqueId, generateUniqueIDNumber } from "../util/util";
import { User } from "../models/user";
import { PartyDB } from "../db/dbparty";
import { UserDB } from "../db/dbuser";

interface PartyDisplay {
    partyID: string;
    connected: Partial<User>[];
    lastEmpty: number;
    host?: string;
    participants?: string[];
}

const createParty = async (userID: string): Promise<PartyCreationResult> => {
    if (!checkValidString(userID)) {
        return { success: false, code: 400, error: "userID must be properly specified" };
    }

    try {
        const user = await UserDB.dbFindID(userID);
        if (!user) {
            return { success: false, code: 404, error: "User not found" };
        }

        let partyID = generateUniqueIDNumber(100000, 999999);
        while (pool.partyExists(partyID.toString())) {
            partyID = generateUniqueIDNumber(100000, 999999);
        }
        const partyIDString = partyID.toString();

        // Create database record
        const dbParty = await PartyDB.createParty(partyIDString, user);
        
        // Create in-memory party instance
        const memoryParty = Party.create({ partyID: partyIDString, host: user });
        memoryParty.participants = [user];
        await memoryParty.save();
        
        pool.registerParty(partyIDString, memoryParty);

        return { 
            success: true, 
            code: 201, 
            partyID: partyIDString,
            host: user.username,
            participants: [user.username]
        };
    } catch (error) {
        console.error("Party creation error:", error);
        return { 
            success: false, 
            code: 500, 
            error: error instanceof Error ? error.message : "Failed to create party" 
        };
    }
};

const getParty = (userID: string, partyID: string): { party?: PartyDisplay, code: number, error?: string } => {
    if (!checkValidString(partyID)) {
        return { code: 400, error: "partyID must be properly specified" };
    }

    if (!checkValidString(userID)) {
        return { code: 400, error: "userID must be properly specified" };
    }

    const existingParty = pool.listPool().find(party => party.partyID === partyID);
    if (existingParty) {
        if (!existingParty.userExists(userID)) {
            return { code: 403, error: `You do not have access to this party` };
        }

        const partyData = Array.from(existingParty.connected.values()).map((user: User) => user.toJSONShallow());
        const connectedUsers: Partial<User>[] = partyData.map((user: any): Partial<User> => ({ ...user }));

        const partyDisplay: PartyDisplay = {
            partyID: existingParty.partyID,
            connected: connectedUsers,
            lastEmpty: existingParty.lastEmpty,
            host: existingParty.host?.username,
            participants: existingParty.participants?.map(p => p.username)
        };

        return { party: partyDisplay, code: 200 };
    }
    return { code: 404, error: 'Cannot access non-existent party.' };
};

// If looking for /party/join go to ws.ts

export { createParty, getParty };
