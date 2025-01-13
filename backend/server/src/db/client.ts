
import { User } from '../models/user';
import 'reflect-metadata';
import { DataSource } from 'typeorm';

export const db = new DataSource({
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  username: 'postgres',
  password: 'example',
  database: 'postgres',
  entities: [User],
  synchronize: true,
  logging: false,
});

export async function connectDB() {
    try {
        await db.initialize();
        console.log('Database connection established!');

    } catch (error) {
        console.error('Error during app initialization', error);
    }
}