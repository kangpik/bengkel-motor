import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { BarChart, LineChart, PieChart } from "lucide-react";
import {
  getFinancialSummary,
  getFinancialTrends,
  getMonthlyFinancialData,
} from "../lib/supabase";

interface FinancialReportsProps {
  data?: {
    daily?: {
      income: number;
      expenses: number;
      profit: number;
      transactions: number;
    };
    weekly?: {
      income: number[];
      expenses: number[];
      profit: number[];
      days: string[];
    };
    monthly?: {
      income: number[];
      expenses: number[];
      profit: number[];
      months: string[];
    };
  };
}

const FinancialReports: React.FC<FinancialReportsProps> = () => {
  const [period, setPeriod] = useState<string>("daily");
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [data, setData] = useState<FinancialReportsProps["data"]>(defaultData);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFinancialData();
  }, [period]);

  const fetchFinancialData = async () => {
    setLoading(true);
    try {
      const [dailySummary, weeklyTrends, monthlyData] = await Promise.all([
        getFinancialSummary("daily"),
        getFinancialTrends(7),
        getMonthlyFinancialData(6),
      ]);

      setData({
        daily: dailySummary,
        weekly: weeklyTrends,
        monthly: monthlyData,
      });
    } catch (error) {
      console.error("Error fetching financial data:", error);
      // Keep default data on error
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full p-6 bg-background">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Laporan Keuangan</h1>
        <div className="flex items-center gap-4">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Pilih Periode" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Harian</SelectItem>
              <SelectItem value="weekly">Mingguan</SelectItem>
              <SelectItem value="monthly">Bulanan</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="overview">Ringkasan</TabsTrigger>
          <TabsTrigger value="income">Pendapatan</TabsTrigger>
          <TabsTrigger value="expenses">Pengeluaran</TabsTrigger>
          <TabsTrigger value="profit">Laba</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <p className="text-muted-foreground">Memuat data keuangan...</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <SummaryCard
                  title="Total Pendapatan"
                  value={formatCurrency(getDailySummary(data).income)}
                  description={getPeriodDescription(period, "income")}
                  trend=""
                  trendUp={true}
                  icon={<BarChart className="h-5 w-5 text-green-500" />}
                />
                <SummaryCard
                  title="Total Pengeluaran"
                  value={formatCurrency(getDailySummary(data).expenses)}
                  description={getPeriodDescription(period, "expenses")}
                  trend=""
                  trendUp={false}
                  icon={<LineChart className="h-5 w-5 text-red-500" />}
                />
                <SummaryCard
                  title="Total Laba"
                  value={formatCurrency(getDailySummary(data).profit)}
                  description={getPeriodDescription(period, "profit")}
                  trend=""
                  trendUp={getDailySummary(data).profit >= 0}
                  icon={<PieChart className="h-5 w-5 text-blue-500" />}
                />
              </div>
            </>
          )}

          {!loading && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Tren Pendapatan vs Pengeluaran</CardTitle>
                  <CardDescription>
                    {period === "daily"
                      ? "Hari ini"
                      : period === "weekly"
                        ? "7 hari terakhir"
                        : "6 bulan terakhir"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-80">
                  <div className="h-full w-full flex flex-col justify-center bg-muted/20 rounded-md p-4">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-green-600">
                          Pendapatan:
                        </span>
                        <span className="font-medium text-green-600">
                          {period === "weekly" && data?.weekly
                            ? `Rp ${data.weekly.income.reduce((a, b) => a + b, 0).toLocaleString("id-ID")}`
                            : period === "monthly" && data?.monthly
                              ? `Rp ${data.monthly.income.reduce((a, b) => a + b, 0).toLocaleString("id-ID")}`
                              : formatCurrency(getDailySummary(data).income)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-red-600">
                          Pengeluaran:
                        </span>
                        <span className="font-medium text-red-600">
                          {period === "weekly" && data?.weekly
                            ? `Rp ${data.weekly.expenses.reduce((a, b) => a + b, 0).toLocaleString("id-ID")}`
                            : period === "monthly" && data?.monthly
                              ? `Rp ${data.monthly.expenses.reduce((a, b) => a + b, 0).toLocaleString("id-ID")}`
                              : formatCurrency(getDailySummary(data).expenses)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center border-t pt-2">
                        <span className="text-sm font-medium">
                          Laba Bersih:
                        </span>
                        <span className="font-bold">
                          {period === "weekly" && data?.weekly
                            ? `Rp ${(data.weekly.income.reduce((a, b) => a + b, 0) - data.weekly.expenses.reduce((a, b) => a + b, 0)).toLocaleString("id-ID")}`
                            : period === "monthly" && data?.monthly
                              ? `Rp ${(data.monthly.income.reduce((a, b) => a + b, 0) - data.monthly.expenses.reduce((a, b) => a + b, 0)).toLocaleString("id-ID")}`
                              : formatCurrency(getDailySummary(data).profit)}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Ringkasan Transaksi</CardTitle>
                  <CardDescription>Data transaksi terkini</CardDescription>
                </CardHeader>
                <CardContent className="h-80">
                  <div className="h-full w-full flex flex-col justify-center bg-muted/20 rounded-md p-4">
                    <div className="space-y-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-blue-600">
                          {getDailySummary(data).transactions}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Total Transaksi{" "}
                          {period === "daily"
                            ? "Hari Ini"
                            : period === "weekly"
                              ? "Minggu Ini"
                              : "Bulan Ini"}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm">
                            Rata-rata per transaksi:
                          </span>
                          <span className="text-sm font-medium">
                            {getDailySummary(data).transactions > 0
                              ? formatCurrency(
                                  getDailySummary(data).income /
                                    getDailySummary(data).transactions,
                                )
                              : "Rp 0"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="income">
          <Card>
            <CardHeader>
              <CardTitle>Detail Pendapatan</CardTitle>
              <CardDescription>
                {period === "daily"
                  ? "Hari ini"
                  : period === "weekly"
                    ? "7 hari terakhir"
                    : "6 bulan terakhir"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-96 w-full flex items-center justify-center">
                  <p className="text-muted-foreground">
                    Memuat data pendapatan...
                  </p>
                </div>
              ) : (
                <div className="h-96 w-full flex flex-col justify-center bg-muted/20 rounded-md p-6">
                  <div className="space-y-4">
                    <div className="text-center mb-6">
                      <p className="text-3xl font-bold text-green-600">
                        {period === "weekly" && data?.weekly
                          ? formatCurrency(
                              data.weekly.income.reduce((a, b) => a + b, 0),
                            )
                          : period === "monthly" && data?.monthly
                            ? formatCurrency(
                                data.monthly.income.reduce((a, b) => a + b, 0),
                              )
                            : formatCurrency(getDailySummary(data).income)}
                      </p>
                      <p className="text-muted-foreground">Total Pendapatan</p>
                    </div>
                    {period === "weekly" &&
                      data?.weekly &&
                      data.weekly.days.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="font-medium">Pendapatan Harian:</h4>
                          {data.weekly.days.map((day, index) => (
                            <div
                              key={index}
                              className="flex justify-between text-sm"
                            >
                              <span>{day}</span>
                              <span className="font-medium">
                                {formatCurrency(
                                  data.weekly!.income[index] || 0,
                                )}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    {period === "monthly" &&
                      data?.monthly &&
                      data.monthly.months.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="font-medium">Pendapatan Bulanan:</h4>
                          {data.monthly.months.map((month, index) => (
                            <div
                              key={index}
                              className="flex justify-between text-sm"
                            >
                              <span>{month}</span>
                              <span className="font-medium">
                                {formatCurrency(
                                  data.monthly!.income[index] || 0,
                                )}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expenses">
          <Card>
            <CardHeader>
              <CardTitle>Detail Pengeluaran</CardTitle>
              <CardDescription>
                {period === "daily"
                  ? "Hari ini"
                  : period === "weekly"
                    ? "7 hari terakhir"
                    : "6 bulan terakhir"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-96 w-full flex items-center justify-center">
                  <p className="text-muted-foreground">
                    Memuat data pengeluaran...
                  </p>
                </div>
              ) : (
                <div className="h-96 w-full flex flex-col justify-center bg-muted/20 rounded-md p-6">
                  <div className="space-y-4">
                    <div className="text-center mb-6">
                      <p className="text-3xl font-bold text-red-600">
                        {period === "weekly" && data?.weekly
                          ? formatCurrency(
                              data.weekly.expenses.reduce((a, b) => a + b, 0),
                            )
                          : period === "monthly" && data?.monthly
                            ? formatCurrency(
                                data.monthly.expenses.reduce(
                                  (a, b) => a + b,
                                  0,
                                ),
                              )
                            : formatCurrency(getDailySummary(data).expenses)}
                      </p>
                      <p className="text-muted-foreground">Total Pengeluaran</p>
                    </div>
                    {period === "weekly" &&
                      data?.weekly &&
                      data.weekly.days.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="font-medium">Pengeluaran Harian:</h4>
                          {data.weekly.days.map((day, index) => (
                            <div
                              key={index}
                              className="flex justify-between text-sm"
                            >
                              <span>{day}</span>
                              <span className="font-medium">
                                {formatCurrency(
                                  data.weekly!.expenses[index] || 0,
                                )}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    {period === "monthly" &&
                      data?.monthly &&
                      data.monthly.months.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="font-medium">Pengeluaran Bulanan:</h4>
                          {data.monthly.months.map((month, index) => (
                            <div
                              key={index}
                              className="flex justify-between text-sm"
                            >
                              <span>{month}</span>
                              <span className="font-medium">
                                {formatCurrency(
                                  data.monthly!.expenses[index] || 0,
                                )}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="profit">
          <Card>
            <CardHeader>
              <CardTitle>Detail Laba</CardTitle>
              <CardDescription>
                {period === "daily"
                  ? "Hari ini"
                  : period === "weekly"
                    ? "7 hari terakhir"
                    : "6 bulan terakhir"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-96 w-full flex items-center justify-center">
                  <p className="text-muted-foreground">Memuat data laba...</p>
                </div>
              ) : (
                <div className="h-96 w-full flex flex-col justify-center bg-muted/20 rounded-md p-6">
                  <div className="space-y-4">
                    <div className="text-center mb-6">
                      <p
                        className={`text-3xl font-bold ${
                          (period === "weekly" && data?.weekly
                            ? data.weekly.income.reduce((a, b) => a + b, 0) -
                              data.weekly.expenses.reduce((a, b) => a + b, 0)
                            : period === "monthly" && data?.monthly
                              ? data.monthly.income.reduce((a, b) => a + b, 0) -
                                data.monthly.expenses.reduce((a, b) => a + b, 0)
                              : getDailySummary(data).profit) >= 0
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {period === "weekly" && data?.weekly
                          ? formatCurrency(
                              data.weekly.income.reduce((a, b) => a + b, 0) -
                                data.weekly.expenses.reduce((a, b) => a + b, 0),
                            )
                          : period === "monthly" && data?.monthly
                            ? formatCurrency(
                                data.monthly.income.reduce((a, b) => a + b, 0) -
                                  data.monthly.expenses.reduce(
                                    (a, b) => a + b,
                                    0,
                                  ),
                              )
                            : formatCurrency(getDailySummary(data).profit)}
                      </p>
                      <p className="text-muted-foreground">Total Laba Bersih</p>
                    </div>
                    {period === "weekly" &&
                      data?.weekly &&
                      data.weekly.days.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="font-medium">Laba Harian:</h4>
                          {data.weekly.days.map((day, index) => {
                            const profit =
                              (data.weekly!.income[index] || 0) -
                              (data.weekly!.expenses[index] || 0);
                            return (
                              <div
                                key={index}
                                className="flex justify-between text-sm"
                              >
                                <span>{day}</span>
                                <span
                                  className={`font-medium ${profit >= 0 ? "text-green-600" : "text-red-600"}`}
                                >
                                  {formatCurrency(profit)}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    {period === "monthly" &&
                      data?.monthly &&
                      data.monthly.months.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="font-medium">Laba Bulanan:</h4>
                          {data.monthly.months.map((month, index) => {
                            const profit =
                              (data.monthly!.income[index] || 0) -
                              (data.monthly!.expenses[index] || 0);
                            return (
                              <div
                                key={index}
                                className="flex justify-between text-sm"
                              >
                                <span>{month}</span>
                                <span
                                  className={`font-medium ${profit >= 0 ? "text-green-600" : "text-red-600"}`}
                                >
                                  {formatCurrency(profit)}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

interface SummaryCardProps {
  title: string;
  value: string;
  description: string;
  trend: string;
  trendUp: boolean;
  icon: React.ReactNode;
}

const SummaryCard: React.FC<SummaryCardProps> = ({
  title,
  value,
  description,
  trend,
  trendUp,
  icon,
}) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
        {trend && (
          <div
            className={`flex items-center mt-2 text-xs ${trendUp ? "text-green-500" : "text-red-500"}`}
          >
            {trendUp ? "↑" : "↓"} {trend}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
  }).format(amount);
};

const getDailySummary = (data: FinancialReportsProps["data"]) => {
  return data?.daily || { income: 0, expenses: 0, profit: 0, transactions: 0 };
};

const getPeriodDescription = (
  period: string,
  type: "income" | "expenses" | "profit",
) => {
  const periodText =
    period === "daily"
      ? "hari ini"
      : period === "weekly"
        ? "minggu ini"
        : "bulan ini";
  const typeText =
    type === "income"
      ? "Pendapatan"
      : type === "expenses"
        ? "Pengeluaran"
        : "Laba";
  return `${typeText} ${periodText}`;
};

const defaultData = {
  daily: {
    income: 2500000,
    expenses: 1200000,
    profit: 1300000,
    transactions: 15,
  },
  weekly: {
    income: [1800000, 2100000, 1950000, 2300000, 2500000, 2200000, 2400000],
    expenses: [900000, 1100000, 950000, 1050000, 1200000, 1000000, 1150000],
    profit: [900000, 1000000, 1000000, 1250000, 1300000, 1200000, 1250000],
    days: ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"],
  },
  monthly: {
    income: [15000000, 16500000, 17200000, 18500000, 19000000, 20500000],
    expenses: [7500000, 8200000, 8500000, 9100000, 9500000, 10200000],
    profit: [7500000, 8300000, 8700000, 9400000, 9500000, 10300000],
    months: ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun"],
  },
};

export default FinancialReports;
