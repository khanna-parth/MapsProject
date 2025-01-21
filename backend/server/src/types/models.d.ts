declare module '../database/models/index' {
  import { Sequelize, Model, DataTypes, Optional } from 'sequelize';

  export interface UserAttributes {
    userID: string;
    username: string;
    password: string;
    coordinates: { long: number; lat: number };
  }

  export interface UserCreationAttributes extends Optional<UserAttributes, 'userID'> {}

  export class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
    public userID!: string;
    public username!: string;
    public password!: string;
    public coordinates!: { long: number; lat: number };

    public readonly friends?: User[];

    public addFriend(friend: User, options?: any): Promise<void>;
    public removeFriend(friend: User, options?: any): Promise<void>;
  }

  export interface PartyAttributes {
    partyID: string;
    users: { userID: string; username: string; coordinates: { long: number; lat: number } }[];
    lastEmpty: number;
    userID: string;
  }

  export class Party extends Model<PartyAttributes> implements PartyAttributes {
    public partyID!: string;
    public users!: { userID: string; username: string; coordinates: { long: number; lat: number } }[];
    public lastEmpty!: number;
    public userID!: string;

    public userExists(userID: string): boolean;
    public broadcast(message: string, senderID: string): void;
  }

  export const sequelize: Sequelize;
  export const Sequelize: typeof Sequelize;
  export function initModels(sequelize: Sequelize, DataTypes: typeof DataTypes): {
    User: typeof User;
    Party: typeof Party;
  };
}

export interface AccessUserRequest {
  username: string;
  password: string;
}

export interface AddFriendsRequest {
  username: string;
  friendUsername: string;
}

export interface CreatePartyRequest {
  partyID: string;
  userID: string;
}

export interface GetFriendsRequest {
  username: string;
}

export {};
