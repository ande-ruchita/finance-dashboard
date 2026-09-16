import mongoose, { Schema, Document } from "mongoose";

export interface ITransaction extends Document {
  id: number;
  date: Date;
  amount: number;
  category: "Revenue" | "Expense";
  status: "Paid" | "Pending";
  user_id: string;
  user_profile: string;
}

const TransactionSchema = new Schema<ITransaction>({
  id: { type: Number, required: true, unique: true },
  date: { type: Date, required: true },
  amount: { type: Number, required: true },
  category: { type: String, enum: ["Revenue", "Expense"], required: true },
  status: { type: String, enum: ["Paid", "Pending"], required: true },
  user_id: { type: String, required: true },
  user_profile: { type: String },
});

export default mongoose.model<ITransaction>("Transaction", TransactionSchema);