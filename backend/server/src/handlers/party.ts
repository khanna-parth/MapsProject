import { pool } from "../models/pool";
import { Party } from "../models/party";
import { PartyCreationResult, PartyModificationResponse } from "../models/connection/responses";
import { checkValidString, generateUniqueId, generateUniqueIDNumber } from "../util/util";
import { User } from "../models/user";
import { PartyDB } from "../db/dbparty";
import { UserDB } from "../db/dbuser";
import { PartyModification, PartyModificationData } from "../models/deps/party-deps";

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
        let exists = await pool.partyExists(partyID.toString())
        while (exists) {
            console.log('Generating')
            partyID = generateUniqueIDNumber(100000, 999999);
            exists = await pool.partyExists(partyID.toString())
        }

        console.log('Generated')
        const partyIDString = partyID.toString();

        // Create database record
        console.log('Creating')
        const dbParty = await PartyDB.createParty(partyIDString, user);

        pool.registerParty(partyIDString, dbParty);

        return { 
            success: true, 
            code: 201, 
            partyID: partyIDString,
            host: user.username,
            participants: dbParty.participants.map((user) => user.username),
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

const modifyParty = async (userID: string, partyID: string, change: string, data: PartyModificationData): Promise<PartyModificationResponse> => {
    const party = await pool.partyExists(partyID)
    if (!party) {
        return {code: 400, error: "Invalid partyID provided"}
    }

    const user = party.connected.values().find((u) => u.userID == userID)
    if (!user) {
        return { code: 400, error: "Party modification access denied"}
    }
    const modifications = Object.values(PartyModification).map((mod) => mod.toString());

    console.log(modifications);
    console.log(change)
    console.log(data)
    if (modifications.includes(change)) {
        switch (change) {
            case PartyModification.DEINVITE:
                if (data.user) {
                    const deinvited = await party.deinvite(data.user)
                    if (!deinvited.removed) {
                        return {code: 500, error: `Could not deinvite`}
                    }
                    return { code: 200 }
                } else {
                    return {code: 400, error: `Users not provided for modification type ${change}`}
                }
            case PartyModification.INVITE:
                if (data.user) {
                    const foundUser = await UserDB.dbFindUsername(data.user);
                    if (!foundUser) {
                        return { code: 400, error: `User ${data.user} does not exist`}
                    }
                    const invitationResponse = await party.invite(foundUser)
                    if (!invitationResponse.invited) {
                        return { code: 400, error: invitationResponse.error }
                    }
                    return { code: 200}
                } else {
                    return {code: 400, error: `Users not provided for modification type ${change}`}
                }
            default:
                return { code: 400, error: `Invalid modification type '${change}. Supported: ${modifications.join(",")}'`}
        }
    }
    return { code: 400, error: `Invalid modification type '${change}. Supported: ${modifications.join(",")}'`}
}

// If looking for /party/join go to ws.ts

export { createParty, getParty, modifyParty };
