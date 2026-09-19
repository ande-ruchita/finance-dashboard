export interface Transaction {
  _id: string;
  id: number;
  date: string;
  amount: number;
  category: "Revenue" | "Expense";
  status: "Paid" | "Pending";
  user_id: string;
  user_profile: string;
}

export interface Summary {
  balance: number;
  revenue: number;
  expenses: number;
  savings: number;
}