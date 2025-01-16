
import { User } from '../models/user';
import 'reflect-metadata';
import { DataSource } from 'typeorm';

export const db = new DataSource({
    type: 'postgres',
    host: process.env.POSTGRES_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 5432,
    username: process.env.POSTGRES_USER || 'postgres',
    password: process.env.POSTGRES_PASSWORD || 'postgres',
    database: process.env.POSTGRES_DB || 'postgres',
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