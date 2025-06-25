import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Badge } from "./ui/badge";
import { supabase, FinancialTransaction } from "../lib/supabase";

interface ExpenseListProps {
  refreshTrigger?: number;
}

const ExpenseList: React.FC<ExpenseListProps> = ({ refreshTrigger }) => {
  const [expenses, setExpenses] = useState<FinancialTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchExpenses();
  }, [refreshTrigger]);

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("financial_transactions")
        .select("*")
        .eq("transaction_type", "expense")
        .order("transaction_date", { ascending: false })
        .limit(10);

      if (error) throw error;
      setExpenses(data || []);
    } catch (error) {
      console.error("Error fetching expenses:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
    }).format(amount);
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getCategoryColor = (category: string | null): string => {
    if (!category) return "bg-gray-100 text-gray-800";

    const operationalCategories = [
      "Gaji Mekanik",
      "Listrik",
      "Air",
      "Internet",
      "Sewa Tempat",
      "Biaya Operasional Lainnya",
    ];

    if (operationalCategories.includes(category)) {
      return "bg-blue-100 text-blue-800";
    }

    return "bg-orange-100 text-orange-800";
  };

  return (
    <div className="bg-background">
      <Card>
        <CardHeader>
          <CardTitle>Pengeluaran Terbaru</CardTitle>
          <CardDescription>
            10 pengeluaran terakhir yang dicatat
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <p className="text-muted-foreground">
                Memuat data pengeluaran...
              </p>
            </div>
          ) : expenses.length === 0 ? (
            <div className="flex justify-center items-center h-32">
              <p className="text-muted-foreground">
                Belum ada pengeluaran yang dicatat
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {expenses.map((expense) => (
                <div
                  key={expense.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge
                        className={getCategoryColor(expense.category)}
                        variant="secondary"
                      >
                        {expense.category || "Tidak Dikategorikan"}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {formatDate(expense.transaction_date)}
                      </span>
                    </div>
                    {expense.description && (
                      <p className="text-sm text-muted-foreground">
                        {expense.description}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-red-600">
                      {formatCurrency(expense.amount)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ExpenseList;
