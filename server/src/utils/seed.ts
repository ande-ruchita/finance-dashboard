import mongoose from "mongoose";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import Transaction from "../models/Transaction";

dotenv.config();

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI as string);
    console.log("Connected to MongoDB for seeding");

    const filePath = path.join(__dirname, "transactions.json");
    const rawData = fs.readFileSync(filePath, "utf-8");
    const transactions = JSON.parse(rawData);

    await Transaction.deleteMany({});
    console.log("Old transactions cleared");

    const formatted = transactions.map((t: any) => ({
      id: t.id,
      date: new Date(t.date),
      amount: t.amount,
      category: t.category,
      status: t.status,
      user_id: t.user_id,
      user_profile: t.user_profile,
    }));

    await Transaction.insertMany(formatted);
    console.log(`Seeded ${formatted.length} transactions`);

    process.exit(0);
  } catch (err) {
    console.error("Seed error:", err);
    process.exit(1);
  }
};

seed();