import { Model, DataTypes, Sequelize } from 'sequelize';

export class Party extends Model {
  public partyID!: string;
  public users!: { userID: string; username: string; coordinates: any; ws?: any }[];
  public lastEmpty!: number;
  public userID!: string; // Foreign key to User

  /**
   * Checks if a user exists in the party
   * @param userID - The ID of the user to check
   * @returns {boolean} True if the user exists, false otherwise
   */
  public userExists(userID: string): boolean {
    return this.users.some((user) => user.userID === userID);
  }

  /**
   * Broadcasts a message to all users in the party except the sender
   * @param message - The message to broadcast
   * @param senderID - The ID of the sender
   */
  public broadcast(message: string, senderID: string): void {
    this.users.forEach((user) => {
      if (user.userID !== senderID && user.ws) {
        user.ws.send(message);
      }
    });
  }

  static associate(models: any) {
    Party.belongsTo(models.User, { foreignKey: 'userID', as: 'owner' });
  }
}

export default (sequelize: Sequelize) => {
  Party.init(
    {
      partyID: {
        type: DataTypes.STRING,
        primaryKey: true,
        allowNull: false,
      },
      users: {
        type: DataTypes.JSONB, // Storing users as JSONB
        allowNull: false,
        defaultValue: [],
      },
      lastEmpty: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      userID: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: 'Party',
      tableName: 'parties',
      timestamps: false,
    }
  );

  return Party;
};
