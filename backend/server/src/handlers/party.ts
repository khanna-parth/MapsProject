import pool from '../database/models/pool';
import db from '../database/models/index';
import { Party } from '../database/models/party';
import { PartyCreationResult } from '../types/responses';
import { checkValidString } from '../util/util';

interface PartyDisplay {
  partyID: string;
  connected: { userID: string; username: string; coordinates: { long: number; lat: number } }[];
  lastEmpty: number;
}

/**
 * Creates a new party and registers it in the pool.
 * @param partyID - The ID of the new party.
 * @param userID - The ID of the user creating the party.
 * @returns PartyCreationResult containing success status and error message if applicable.
 */
const createParty = async (partyID: string, userID: string): Promise<PartyCreationResult> => {
  if (!checkValidString(partyID)) {
    return { success: false, code: 400, error: 'partyID must be properly specified' };
  }

  if (!checkValidString(userID)) {
    return { success: false, code: 400, error: 'userID must be properly specified' };
  }

  try {
    const party = db.Party.build({
      partyID,
      users: [],
      lastEmpty: Date.now(),
      userID,
    });

    await party.save(); // Save party to the database
    pool.registerParty(partyID, party);

    return { success: true, code: 201 };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, code: 400, error: `Failed to create party. ${errorMessage}` };
  }
};

/**
 * Retrieves a party and its users.
 * @param userID - The ID of the user requesting the party.
 * @param partyID - The ID of the party to retrieve.
 * @returns The party information if accessible, or an error message.
 */
const getParty = async (
  userID: string,
  partyID: string
): Promise<{ party?: PartyDisplay; code: number; error?: string }> => {
  if (!checkValidString(partyID)) {
    return { code: 400, error: 'partyID must be properly specified' };
  }

  if (!checkValidString(userID)) {
    return { code: 400, error: 'userID must be properly specified' };
  }

  const existingParty = pool.partyExists(partyID);
  if (existingParty) {
    if (!existingParty.userExists(userID)) {
      return { code: 403, error: 'You do not have access to this party' };
    }

    const partyData = existingParty.getDataValue('users').map((user: any) => ({
      userID: user.userID,
      username: user.username,
      coordinates: user.coordinates,
    }));

    const partyDisplay: PartyDisplay = {
      partyID: existingParty.getDataValue('partyID'),
      connected: partyData,
      lastEmpty: existingParty.getDataValue('lastEmpty'),
    };

    return { party: partyDisplay, code: 200 };
  }

  return { code: 404, error: 'Cannot access non-existent party.' };
};

export { createParty, getParty };
