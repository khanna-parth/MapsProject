type PartyCreationResult = {
    success: boolean;
    code: number;
    partyID?: string
    host?: string
    participants?: string[]
    error?: string;
};

export { PartyCreationResult };