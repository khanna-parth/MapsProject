import { User } from "../user";

enum PartyModification {
    INVITE = "invite",
    DEINVITE = "deinvite"
}

enum PartyPolicy {
    OPEN = "OPEN",
    CLOSED = "CLOSED"
}

interface PartyModificationData {
    user: string;
}

export { PartyModification, PartyModificationData, PartyPolicy }