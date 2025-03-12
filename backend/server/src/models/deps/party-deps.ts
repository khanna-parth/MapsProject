import { User } from "../user";

enum PartyModification {
    INVITE = "invite",
    DEINVITE = "deinvite",
    POLICY = "policy"
}

enum PartyPolicy {
    OPEN = "OPEN",
    CLOSED = "CLOSED"
}

interface PartyModificationData {
    user: string;
    policy: string;
}

export { PartyModification, PartyModificationData, PartyPolicy }