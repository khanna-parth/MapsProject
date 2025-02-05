import { Party } from "../models/party";
import { User } from "../models/user";
import { Mutex, withTimeout } from 'async-mutex';

class PartyDB {
    private static partyMutex = withTimeout(new Mutex(), 500);

    static async createParty(partyID: string, host: User): Promise<Party> {
        const release = await this.partyMutex.acquire();
        try {
            const party = Party.create({ partyID, host });
            party.participants = [host];
            await party.save();
            return party;
        } finally {
            release();
        }
    }

    static async joinParty(partyID: string, user: User): Promise<{ success: boolean, error?: string }> {
        const release = await this.partyMutex.acquire();
        try {
            const party = await Party.findOne({
                where: { partyID },
                relations: ['participants']
            });
    
            if (!party) return { success: false, error: 'Party not found' };
            if (party.participants.some(p => p.userID === user.userID)) {
                return { success: true };
            }
    
            party.participants.push(user);
            await party.save();
            return { success: true };
        } catch (error: unknown) {
            return { success: false, error: error instanceof Error ? error.message : 'Error not known' };
        } finally {
            release();
        }
    }
    
    static async leaveParty(partyID: string, user: User): Promise<{ success: boolean, error?: string }> {
        const release = await this.partyMutex.acquire();
        try {
            const party = await Party.findOne({
                where: { partyID },
                relations: ['participants']
            });
    
            if (!party) return { success: false, error: 'Party not found' };
            
            party.participants = party.participants.filter(p => p.userID !== user.userID);
            await party.save();
            
            if (party.participants.length === 0) {
                await party.remove();
            }
            
            return { success: true };
        } catch (error) {
            return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
        } finally {
            release();
        }
    }

    static async getParty(partyID: string): Promise<Party | null> {
        return Party.findOne({
            where: { partyID },
            relations: ['host', 'participants']
        });
    }
}

export { PartyDB };