import { Sequelize, DataTypes } from 'sequelize';
import defineUserModel from './user';
import definePartyModel from './party';

const sequelize = new Sequelize({
  dialect: 'postgres',
  host: process.env.POSTGRES_HOST || 'localhost',
  port: Number(process.env.POSTGRES_PORT) || 5432,
  username: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'postgres',
  database: process.env.POSTGRES_DB || 'postgres',
  logging: false, // Optional: Disable logging
});

const User = defineUserModel(sequelize); // Initialize User model
const Party = definePartyModel(sequelize); // Initialize Party model

const db = {
  sequelize,
  Sequelize,
  User,
  Party,
};

// Define associations
User.belongsToMany(User, {
  through: 'UserFriends',
  as: 'friends',
  foreignKey: 'userID',
  otherKey: 'friendID',
});
Party.belongsTo(User, { foreignKey: 'userID', as: 'owner' });
User.hasMany(Party, { foreignKey: 'userID', as: 'ownedParties' });

export default db;
