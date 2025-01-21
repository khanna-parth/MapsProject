import { Model, DataTypes, Sequelize } from 'sequelize';
import { Party } from './party';

export class User extends Model {
  public userID!: string;
  public username!: string;
  public password!: string;
  public coordinates!: { long: number; lat: number };

  public readonly friends?: User[]; // Declare 'friends' for the association
  public addFriend!: (friend: User, options?: any) => Promise<void>;
  public removeFriend!: (friend: User, options?: any) => Promise<void>;
}

export default (sequelize: Sequelize) => {
  User.init(
    {
      userID: {
        type: DataTypes.STRING,
        primaryKey: true,
        allowNull: false,
      },
      username: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      coordinates: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: 'User',
      tableName: 'users',
      timestamps: false,
    }
  );

  return User;
};
