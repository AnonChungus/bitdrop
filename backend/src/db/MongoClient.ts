import { MongoClient, type Db, type Collection } from 'mongodb';
import { Config } from '../config/Config.js';

let client: MongoClient | null = null;
let db: Db | null = null;

export async function connectMongo(): Promise<void> {
    if (client) return;
    client = new MongoClient(Config.mongoUrl);
    await client.connect();
    db = client.db();
    console.log('[Mongo] Connected to', Config.mongoUrl);
}

export function getDb(): Db {
    if (!db) throw new Error('MongoDB not connected — call connectMongo() first');
    return db;
}

export function getCollection<T extends object>(name: string): Collection<T> {
    return getDb().collection<T>(name);
}

export async function disconnectMongo(): Promise<void> {
    await client?.close();
    client = null;
    db = null;
}
