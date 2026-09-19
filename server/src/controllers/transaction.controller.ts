import { Request, Response } from "express";
import Transaction from "../models/Transaction";

const buildFilter = (query: any): any => {
  const {
    search, category, status, user_id,
    minAmount, maxAmount, startDate, endDate,
  } = query;

  const filter: any = {};
  if (category) filter.category = category;
  if (status) filter.status = status;
  if (user_id) filter.user_id = { $regex: user_id, $options: "i" };

  if (minAmount || maxAmount) {
    filter.amount = {};
    if (minAmount) filter.amount.$gte = Number(minAmount);
    if (maxAmount) filter.amount.$lte = Number(maxAmount);
  }

  if (startDate || endDate) {
    filter.date = {};
    if (startDate) filter.date.$gte = new Date(startDate as string);
    if (endDate) filter.date.$lte = new Date(endDate as string);
  }

  if (search) {
    filter.$or = [
      { user_id: { $regex: search, $options: "i" } },
      { category: { $regex: search, $options: "i" } },
      { status: { $regex: search, $options: "i" } },
      { $expr: { $regexMatch: { input: { $toString: "$id" }, regex: search, options: "i" } } },
      { $expr: { $regexMatch: { input: { $toString: "$amount" }, regex: search, options: "i" } } },
      { $expr: { $regexMatch: { input: { $toString: "$date" }, regex: search, options: "i" } } },
    ];
  }
  return filter;
};

const convertToCSV = (data: any[], columns: string[]): string => {
  const header = columns.join(",");
  const rows = data.map((row) =>
    columns
      .map((col) => {
        let val = row[col];
        if (val instanceof Date) val = val.toISOString();
        if (val === undefined || val === null) val = "";
        val = String(val).replace(/"/g, '""'); // escape quotes
        return `"${val}"`;
      })
      .join(",")
  );
  return [header, ...rows].join("\n");
};

export const getTransactions = async (req: Request, res: Response) => {
  try {
    const {
      search,
      category,
      status,
      user_id,
      minAmount,
      maxAmount,
      startDate,
      endDate,
      sortBy = "date",
      order = "desc",
      page = "1",
      limit = "10",
    } = req.query;

    const filter = buildFilter(req.query);

    const pageNum = Number(page);
    const limitNum = Number(limit);
    const skip = (pageNum - 1) * limitNum;

    const sortOrder = order === "asc" ? 1 : -1;

    const [transactions, total] = await Promise.all([
      Transaction.find(filter)
        .sort({ [sortBy as string]: sortOrder })
        .skip(skip)
        .limit(limitNum),
      Transaction.countDocuments(filter),
    ]);

    res.json({
      data: transactions,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const exportTransactions = async (req: Request, res: Response) => {
  try {
    const { columns, filters = {}, sortBy = "date", order = "desc" } = req.body;
    // columns e.g. ["id","date","amount","category","status","user_id"]

    if (!columns || !Array.isArray(columns) || columns.length === 0) {
      return res.status(400).json({ message: "Columns required for export" });
    }

    const filter = buildFilter(filters);
    const sortOrder = order === "asc" ? 1 : -1;

    const transactions = await Transaction.find(filter)
      .sort({ [sortBy]: sortOrder })
      .lean();

    const csv = convertToCSV(transactions, columns);

    res.header("Content-Type", "text/csv");
    res.attachment("transactions.csv");
    res.send(csv);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const getSummary = async (req: Request, res: Response) => {
  try {
    const revenue = await Transaction.aggregate([
      { $match: { category: "Revenue", status: "Paid" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);
    const expense = await Transaction.aggregate([
      { $match: { category: "Expense", status: "Paid" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    const totalRevenue = revenue[0]?.total || 0;
    const totalExpense = expense[0]?.total || 0;

    res.json({
      balance: totalRevenue - totalExpense,
      revenue: totalRevenue,
      expenses: totalExpense,
      savings: totalRevenue - totalExpense, // adjust logic if you want different meaning
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};