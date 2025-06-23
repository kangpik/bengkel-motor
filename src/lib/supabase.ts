import { createClient } from "@supabase/supabase-js";
import { Database } from "../types/supabase";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables");
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Database types
export type Customer = Database["public"]["Tables"]["customers"]["Row"];
export type CustomerInsert =
  Database["public"]["Tables"]["customers"]["Insert"];
export type CustomerUpdate =
  Database["public"]["Tables"]["customers"]["Update"];

export type Vehicle = Database["public"]["Tables"]["vehicles"]["Row"];
export type VehicleInsert = Database["public"]["Tables"]["vehicles"]["Insert"];
export type VehicleUpdate = Database["public"]["Tables"]["vehicles"]["Update"];

export type SparePart = Database["public"]["Tables"]["spare_parts"]["Row"];
export type SparePartInsert =
  Database["public"]["Tables"]["spare_parts"]["Insert"];
export type SparePartUpdate =
  Database["public"]["Tables"]["spare_parts"]["Update"];

export type Service = Database["public"]["Tables"]["services"]["Row"];
export type ServiceInsert = Database["public"]["Tables"]["services"]["Insert"];
export type ServiceUpdate = Database["public"]["Tables"]["services"]["Update"];

export type FinancialTransaction =
  Database["public"]["Tables"]["financial_transactions"]["Row"];
export type FinancialTransactionInsert =
  Database["public"]["Tables"]["financial_transactions"]["Insert"];

export type StockMovement =
  Database["public"]["Tables"]["stock_movements"]["Row"];
export type StockMovementInsert =
  Database["public"]["Tables"]["stock_movements"]["Insert"];

export type Invoice = Database["public"]["Tables"]["invoices"]["Row"];
export type InvoiceInsert = Database["public"]["Tables"]["invoices"]["Insert"];
export type InvoiceUpdate = Database["public"]["Tables"]["invoices"]["Update"];

export type InvoiceItem = Database["public"]["Tables"]["invoice_items"]["Row"];
export type InvoiceItemInsert =
  Database["public"]["Tables"]["invoice_items"]["Insert"];

export type Payment = Database["public"]["Tables"]["payments"]["Row"];
export type PaymentInsert = Database["public"]["Tables"]["payments"]["Insert"];

// Financial data helper functions
export const getFinancialSummary = async (
  period: "daily" | "weekly" | "monthly" = "daily",
) => {
  const today = new Date();
  let startDate: Date;

  switch (period) {
    case "daily":
      startDate = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
      );
      break;
    case "weekly":
      startDate = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case "monthly":
      startDate = new Date(today.getFullYear(), today.getMonth(), 1);
      break;
  }

  try {
    // Get income from completed services with payments
    const { data: incomeData, error: incomeError } = await supabase
      .from("services")
      .select(
        `
        cost,
        service_date,
        invoices!inner(
          total_amount,
          payments(
            amount,
            payment_date
          )
        )
      `,
      )
      .eq("status", "completed")
      .gte("service_date", startDate.toISOString().split("T")[0]);

    if (incomeError) throw incomeError;

    // Calculate total income from payments
    let totalIncome = 0;
    let totalTransactions = 0;

    incomeData?.forEach((service) => {
      service.invoices?.forEach((invoice: any) => {
        invoice.payments?.forEach((payment: any) => {
          if (
            payment.payment_date &&
            new Date(payment.payment_date) >= startDate
          ) {
            totalIncome += payment.amount;
            totalTransactions++;
          }
        });
      });
    });

    // Get expenses from spare parts purchases and other costs
    const { data: expenseData, error: expenseError } = await supabase
      .from("financial_transactions")
      .select("amount")
      .eq("transaction_type", "expense")
      .gte("transaction_date", startDate.toISOString().split("T")[0]);

    if (expenseError) throw expenseError;

    const totalExpenses =
      expenseData?.reduce((sum, transaction) => sum + transaction.amount, 0) ||
      0;
    const totalProfit = totalIncome - totalExpenses;

    return {
      income: totalIncome,
      expenses: totalExpenses,
      profit: totalProfit,
      transactions: totalTransactions,
    };
  } catch (error) {
    console.error("Error fetching financial summary:", error);
    return {
      income: 0,
      expenses: 0,
      profit: 0,
      transactions: 0,
    };
  }
};

export const getFinancialTrends = async (days: number = 7) => {
  const endDate = new Date();
  const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);

  try {
    // Get daily income data
    const { data: incomeData, error: incomeError } = await supabase
      .from("payments")
      .select(
        `
        amount,
        payment_date,
        invoices!inner(
          services!inner(
            service_date
          )
        )
      `,
      )
      .gte("payment_date", startDate.toISOString().split("T")[0])
      .lte("payment_date", endDate.toISOString().split("T")[0])
      .order("payment_date");

    if (incomeError) throw incomeError;

    // Get daily expense data
    const { data: expenseData, error: expenseError } = await supabase
      .from("financial_transactions")
      .select("amount, transaction_date")
      .eq("transaction_type", "expense")
      .gte("transaction_date", startDate.toISOString().split("T")[0])
      .lte("transaction_date", endDate.toISOString().split("T")[0])
      .order("transaction_date");

    if (expenseError) throw expenseError;

    // Group by day
    const dailyData: { [key: string]: { income: number; expenses: number } } =
      {};

    // Initialize all days with zero values
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
      const dateKey = date.toISOString().split("T")[0];
      dailyData[dateKey] = { income: 0, expenses: 0 };
    }

    // Add income data
    incomeData?.forEach((payment) => {
      if (payment.payment_date) {
        const dateKey = payment.payment_date.split("T")[0];
        if (dailyData[dateKey]) {
          dailyData[dateKey].income += payment.amount;
        }
      }
    });

    // Add expense data
    expenseData?.forEach((transaction) => {
      const dateKey = transaction.transaction_date.split("T")[0];
      if (dailyData[dateKey]) {
        dailyData[dateKey].expenses += transaction.amount;
      }
    });

    // Convert to arrays
    const dates = Object.keys(dailyData).sort();
    const income = dates.map((date) => dailyData[date].income);
    const expenses = dates.map((date) => dailyData[date].expenses);
    const profit = income.map((inc, idx) => inc - expenses[idx]);
    const dayLabels = dates.map((date) => {
      const d = new Date(date);
      return d.toLocaleDateString("id-ID", { weekday: "short" });
    });

    return {
      income,
      expenses,
      profit,
      days: dayLabels,
    };
  } catch (error) {
    console.error("Error fetching financial trends:", error);
    return {
      income: [],
      expenses: [],
      profit: [],
      days: [],
    };
  }
};

export const getMonthlyFinancialData = async (months: number = 6) => {
  const endDate = new Date();
  const startDate = new Date(
    endDate.getFullYear(),
    endDate.getMonth() - months + 1,
    1,
  );

  try {
    // Get monthly income data
    const { data: incomeData, error: incomeError } = await supabase
      .from("payments")
      .select("amount, payment_date")
      .gte("payment_date", startDate.toISOString().split("T")[0])
      .lte("payment_date", endDate.toISOString().split("T")[0])
      .order("payment_date");

    if (incomeError) throw incomeError;

    // Get monthly expense data
    const { data: expenseData, error: expenseError } = await supabase
      .from("financial_transactions")
      .select("amount, transaction_date")
      .eq("transaction_type", "expense")
      .gte("transaction_date", startDate.toISOString().split("T")[0])
      .lte("transaction_date", endDate.toISOString().split("T")[0])
      .order("transaction_date");

    if (expenseError) throw expenseError;

    // Group by month
    const monthlyData: { [key: string]: { income: number; expenses: number } } =
      {};

    // Initialize all months with zero values
    for (let i = 0; i < months; i++) {
      const date = new Date(
        endDate.getFullYear(),
        endDate.getMonth() - months + 1 + i,
        1,
      );
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      monthlyData[monthKey] = { income: 0, expenses: 0 };
    }

    // Add income data
    incomeData?.forEach((payment) => {
      if (payment.payment_date) {
        const date = new Date(payment.payment_date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
        if (monthlyData[monthKey]) {
          monthlyData[monthKey].income += payment.amount;
        }
      }
    });

    // Add expense data
    expenseData?.forEach((transaction) => {
      const date = new Date(transaction.transaction_date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      if (monthlyData[monthKey]) {
        monthlyData[monthKey].expenses += transaction.amount;
      }
    });

    // Convert to arrays
    const monthKeys = Object.keys(monthlyData).sort();
    const income = monthKeys.map((month) => monthlyData[month].income);
    const expenses = monthKeys.map((month) => monthlyData[month].expenses);
    const profit = income.map((inc, idx) => inc - expenses[idx]);
    const monthLabels = monthKeys.map((monthKey) => {
      const [year, month] = monthKey.split("-");
      const date = new Date(parseInt(year), parseInt(month) - 1, 1);
      return date.toLocaleDateString("id-ID", { month: "short" });
    });

    return {
      income,
      expenses,
      profit,
      months: monthLabels,
    };
  } catch (error) {
    console.error("Error fetching monthly financial data:", error);
    return {
      income: [],
      expenses: [],
      profit: [],
      months: [],
    };
  }
};
