import { getDb } from "./mongo.js";

export async function nextSequence(name) {
  const db = await getDb();
  const res = await db.collection("counters").findOneAndUpdate(
    { _id: name },
    { $inc: { seq: 1 } },
    { upsert: true, returnDocument: "after" }
  );
  return res.value.seq;
}
