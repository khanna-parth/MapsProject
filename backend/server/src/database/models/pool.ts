import db from './index';

class Pool {
  private connectionPool: Map<string, InstanceType<typeof db.Party>>;

  constructor() {
    this.connectionPool = new Map();
    this.monitor();
  }

  registerParty(partyID: string, party: InstanceType<typeof db.Party>): void {
    if (this.connectionPool.has(partyID)) {
      throw new Error('Cannot create party. Already exists.');
    }
    this.connectionPool.set(partyID, party);
  }

  removeParty(partyID: string): void {
    this.connectionPool.delete(partyID);
  }

  partyExists(partyID: string): InstanceType<typeof db.Party> | null {
    return this.connectionPool.get(partyID) || null;
  }

  listPool(): InstanceType<typeof db.Party>[] {
    return Array.from(this.connectionPool.values());
  }

  async registerUser(user: { userID: string; username: string; coordinates: { long: number; lat: number }; partyID?: string }) {
    const partyID = user.partyID || 'default';
    let party = this.partyExists(partyID);

    if (party) {
      if (!party.getDataValue('users').some((u: any) => u.userID === user.userID)) {
        const users = party.getDataValue('users');
        users.push(user);
        party.setDataValue('users', users);
        await party.save();
      }
    } else {
      // Create a new Party instance
      party = db.Party.build({
        partyID,
        users: [user],
        lastEmpty: Date.now(),
        userID: user.userID,
      });
      await party.save(); // Save to the database
      this.registerParty(partyID, party);
    }
  }

  private hasElapsedCheck(lastEmptyTime: number, intervalSeconds: number): boolean {
    const currentTime = Date.now();
    return currentTime - lastEmptyTime > intervalSeconds * 1000;
  }

  private monitor(): void {
    setInterval(async () => {
      for (const party of this.connectionPool.values()) {
        if (
          party.getDataValue('users').length === 0 &&
          this.hasElapsedCheck(party.getDataValue('lastEmpty'), 30)
        ) {
          await db.Party.destroy({ where: { partyID: party.getDataValue('partyID') } });
          this.removeParty(party.getDataValue('partyID'));
          console.log(`Party ${party.getDataValue('partyID')} was deleted for inactivity.`);
        }
      }
    }, 3000);
  }
}

export default new Pool();
