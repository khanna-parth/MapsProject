type PartyCreationResult = {
    success: boolean;
    code: number;
    partyID?: string
    host?: string
    participants?: string[]
    error?: string;
};

interface PartyModificationResponse {
    code: number;
    error?: string;
}

export { PartyCreationResult, PartyModificationResponse };