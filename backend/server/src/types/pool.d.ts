declare module '../database/models/pool' {
    import { Party, User } from '../database/models/index';
  
    export interface Pool {
      registerUser(user: User): void;
      registerParty(partyID: string, party: Party): void;
      listPool(): Party[];
      partyExists(partyID: string): Party | undefined;
    }
  
    const pool: Pool;
    export default pool;
  }
  