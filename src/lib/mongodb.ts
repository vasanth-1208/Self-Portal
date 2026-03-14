import { MongoClient } from "mongodb";
import { env } from "@/lib/env";

declare global {
  // eslint-disable-next-line no-var
  var __mongoClientPromise__: Promise<MongoClient> | undefined;
}

const client = new MongoClient(env.mongodbUri);

export const mongoClientPromise =
  global.__mongoClientPromise__ || client.connect();

if (process.env.NODE_ENV !== "production") {
  global.__mongoClientPromise__ = mongoClientPromise;
}

export const getDatabase = async () => {
  const connection = await mongoClientPromise;
  return connection.db(env.mongodbDbName);
};
