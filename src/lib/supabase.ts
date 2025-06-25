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

export type ServicePart = Database["public"]["Tables"]["service_parts"]["Row"];
export type ServicePartInsert =
  Database["public"]["Tables"]["service_parts"]["Insert"];

// Expense categories
export const EXPENSE_CATEGORIES = {
  OPERATIONAL: {
    label: "Biaya Operasional",
    subcategories: [
      "Gaji Mekanik",
      "Listrik",
      "Air",
      "Internet",
      "Sewa Tempat",
      "Biaya Operasional Lainnya",
    ],
  },
  OTHER: {
    label: "Biaya Lainnya",
    subcategories: ["Maintenance Alat", "Marketing", "Lain-lain"],
  },
} as const;

// Function to add expense
export const addExpense = async (expense: {
  amount: number;
  category: string;
  description?: string;
}) => {
  try {
    const { data, error } = await supabase
      .from("financial_transactions")
      .insert({
        amount: expense.amount,
        transaction_type: "expense",
        category: expense.category,
        description: expense.description,
        transaction_date: new Date().toISOString().split("T")[0],
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error adding expense:", error);
    throw error;
  }
};

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
    // Get income from payments (actual money received)
    const { data: paymentsData, error: paymentsError } = await supabase
      .from("payments")
      .select("amount, payment_date")
      .gte("payment_date", startDate.toISOString().split("T")[0])
      .eq("status", "completed");

    if (paymentsError) throw paymentsError;

    // Calculate total income from actual payments received
    const totalIncome =
      paymentsData?.reduce((sum, payment) => sum + payment.amount, 0) || 0;
    const totalTransactions = paymentsData?.length || 0;

    // Get operational and other expenses from financial_transactions
    const { data: expenseData, error: expenseError } = await supabase
      .from("financial_transactions")
      .select("amount")
      .eq("transaction_type", "expense")
      .gte("transaction_date", startDate.toISOString().split("T")[0]);

    if (expenseError) throw expenseError;

    const operationalExpenses =
      expenseData?.reduce((sum, transaction) => sum + transaction.amount, 0) ||
      0;

    // Get spare parts costs used in services within the period
    const { data: servicePartsData, error: servicePartsError } = await supabase
      .from("service_parts")
      .select(
        `
        quantity,
        unit_price,
        spare_part_id,
        services!inner(
          service_date
        ),
        spare_parts!inner(
          purchase_price
        )
      `,
      )
      .gte("services.service_date", startDate.toISOString().split("T")[0]);

    if (servicePartsError) throw servicePartsError;

    // Calculate spare parts costs (using purchase_price, not unit_price which is selling price)
    const sparePartsCosts =
      servicePartsData?.reduce((sum, servicePart) => {
        const purchasePrice = servicePart.spare_parts?.purchase_price || 0;
        return sum + servicePart.quantity * purchasePrice;
      }, 0) || 0;

    // Total expenses = operational expenses + spare parts costs
    const totalExpenses = operationalExpenses + sparePartsCosts;
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
    // Get daily income data from actual payments
    const { data: incomeData, error: incomeError } = await supabase
      .from("payments")
      .select("amount, payment_date")
      .gte("payment_date", startDate.toISOString().split("T")[0])
      .lte("payment_date", endDate.toISOString().split("T")[0])
      .eq("status", "completed")
      .order("payment_date");

    if (incomeError) throw incomeError;

    // Get daily operational expense data
    const { data: expenseData, error: expenseError } = await supabase
      .from("financial_transactions")
      .select("amount, transaction_date")
      .eq("transaction_type", "expense")
      .gte("transaction_date", startDate.toISOString().split("T")[0])
      .lte("transaction_date", endDate.toISOString().split("T")[0])
      .order("transaction_date");

    if (expenseError) throw expenseError;

    // Get spare parts costs used in services within the period
    const { data: servicePartsData, error: servicePartsError } = await supabase
      .from("service_parts")
      .select(
        `
        quantity,
        services!inner(
          service_date
        ),
        spare_parts!inner(
          purchase_price
        )
      `,
      )
      .gte("services.service_date", startDate.toISOString().split("T")[0])
      .lte("services.service_date", endDate.toISOString().split("T")[0]);

    if (servicePartsError) throw servicePartsError;

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

    // Add operational expense data
    expenseData?.forEach((transaction) => {
      const dateKey = transaction.transaction_date.split("T")[0];
      if (dailyData[dateKey]) {
        dailyData[dateKey].expenses += transaction.amount;
      }
    });

    // Add spare parts costs by service date
    servicePartsData?.forEach((servicePart) => {
      if (servicePart.services?.service_date) {
        const dateKey = servicePart.services.service_date.split("T")[0];
        if (dailyData[dateKey]) {
          const purchasePrice = servicePart.spare_parts?.purchase_price || 0;
          dailyData[dateKey].expenses += servicePart.quantity * purchasePrice;
        }
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

// Function to get detailed expense breakdown
export const getDetailedExpenseBreakdown = async (
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
    // Get operational expenses
    const { data: operationalExpenses, error: operationalError } =
      await supabase
        .from("financial_transactions")
        .select("amount, category")
        .eq("transaction_type", "expense")
        .gte("transaction_date", startDate.toISOString().split("T")[0])
        .in("category", EXPENSE_CATEGORIES.OPERATIONAL.subcategories);

    if (operationalError) throw operationalError;

    // Get other expenses
    const { data: otherExpenses, error: otherError } = await supabase
      .from("financial_transactions")
      .select("amount, category")
      .eq("transaction_type", "expense")
      .gte("transaction_date", startDate.toISOString().split("T")[0])
      .in("category", EXPENSE_CATEGORIES.OTHER.subcategories);

    if (otherError) throw otherError;

    // Get spare parts costs used in services within the period
    const { data: servicePartsData, error: servicePartsError } = await supabase
      .from("service_parts")
      .select(
        `
        quantity,
        services!inner(
          service_date
        ),
        spare_parts!inner(
          purchase_price,
          name
        )
      `,
      )
      .gte("services.service_date", startDate.toISOString().split("T")[0]);

    if (servicePartsError) throw servicePartsError;

    // Calculate totals
    const operationalTotal =
      operationalExpenses?.reduce((sum, expense) => sum + expense.amount, 0) ||
      0;

    const otherTotal =
      otherExpenses?.reduce((sum, expense) => sum + expense.amount, 0) || 0;

    const sparePartsTotal =
      servicePartsData?.reduce((sum, servicePart) => {
        const purchasePrice = servicePart.spare_parts?.purchase_price || 0;
        return sum + servicePart.quantity * purchasePrice;
      }, 0) || 0;

    // Group operational expenses by category
    const operationalByCategory: { [key: string]: number } = {};
    EXPENSE_CATEGORIES.OPERATIONAL.subcategories.forEach((category) => {
      operationalByCategory[category] = 0;
    });
    operationalExpenses?.forEach((expense) => {
      if (expense.category) {
        operationalByCategory[expense.category] += expense.amount;
      }
    });

    // Group other expenses by category
    const otherByCategory: { [key: string]: number } = {};
    EXPENSE_CATEGORIES.OTHER.subcategories.forEach((category) => {
      otherByCategory[category] = 0;
    });
    otherExpenses?.forEach((expense) => {
      if (expense.category) {
        otherByCategory[expense.category] += expense.amount;
      }
    });

    // Group spare parts by name
    const sparePartsByName: {
      [key: string]: { quantity: number; cost: number };
    } = {};
    servicePartsData?.forEach((servicePart) => {
      const name = servicePart.spare_parts?.name || "Unknown";
      const purchasePrice = servicePart.spare_parts?.purchase_price || 0;
      const cost = servicePart.quantity * purchasePrice;

      if (sparePartsByName[name]) {
        sparePartsByName[name].quantity += servicePart.quantity;
        sparePartsByName[name].cost += cost;
      } else {
        sparePartsByName[name] = {
          quantity: servicePart.quantity,
          cost: cost,
        };
      }
    });

    return {
      operational: {
        total: operationalTotal,
        byCategory: operationalByCategory,
      },
      other: {
        total: otherTotal,
        byCategory: otherByCategory,
      },
      spareParts: {
        total: sparePartsTotal,
        byName: sparePartsByName,
      },
      grandTotal: operationalTotal + otherTotal + sparePartsTotal,
    };
  } catch (error) {
    console.error("Error fetching detailed expense breakdown:", error);
    return {
      operational: {
        total: 0,
        byCategory: {},
      },
      other: {
        total: 0,
        byCategory: {},
      },
      spareParts: {
        total: 0,
        byName: {},
      },
      grandTotal: 0,
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
    // Get monthly income data from actual payments
    const { data: incomeData, error: incomeError } = await supabase
      .from("payments")
      .select("amount, payment_date")
      .gte("payment_date", startDate.toISOString().split("T")[0])
      .lte("payment_date", endDate.toISOString().split("T")[0])
      .eq("status", "completed")
      .order("payment_date");

    if (incomeError) throw incomeError;

    // Get monthly operational expense data
    const { data: expenseData, error: expenseError } = await supabase
      .from("financial_transactions")
      .select("amount, transaction_date")
      .eq("transaction_type", "expense")
      .gte("transaction_date", startDate.toISOString().split("T")[0])
      .lte("transaction_date", endDate.toISOString().split("T")[0])
      .order("transaction_date");

    if (expenseError) throw expenseError;

    // Get spare parts costs used in services within the period
    const { data: servicePartsData, error: servicePartsError } = await supabase
      .from("service_parts")
      .select(
        `
        quantity,
        services!inner(
          service_date
        ),
        spare_parts!inner(
          purchase_price
        )
      `,
      )
      .gte("services.service_date", startDate.toISOString().split("T")[0])
      .lte("services.service_date", endDate.toISOString().split("T")[0]);

    if (servicePartsError) throw servicePartsError;

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

    // Add operational expense data
    expenseData?.forEach((transaction) => {
      const date = new Date(transaction.transaction_date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      if (monthlyData[monthKey]) {
        monthlyData[monthKey].expenses += transaction.amount;
      }
    });

    // Add spare parts costs by service date
    servicePartsData?.forEach((servicePart) => {
      if (servicePart.services?.service_date) {
        const date = new Date(servicePart.services.service_date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
        if (monthlyData[monthKey]) {
          const purchasePrice = servicePart.spare_parts?.purchase_price || 0;
          monthlyData[monthKey].expenses +=
            servicePart.quantity * purchasePrice;
        }
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
