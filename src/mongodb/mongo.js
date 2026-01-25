import { MongoClient, Db } from "mongodb";

const uri = process.env.MONGO_URI;
if (!uri) {
  throw new Error("MONGO_URI is not defined");
}

const client = new MongoClient(uri);

let cachedDb = null;

export async function getDb() {
  if (cachedDb) return cachedDb;

  await client.connect();
  cachedDb = client.db(); // db par défaut (appdb depuis l'URI)
  console.log("[mongo] connected");

  return cachedDb;
}
