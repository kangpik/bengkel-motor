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
import {
  BarChart as BarChartIcon,
  LineChart as LineChartIcon,
  PieChart as PieChartIcon,
} from "lucide-react";
import {
  BarChart,
  LineChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Bar,
  Line,
} from "recharts";
import {
  getFinancialSummary,
  getFinancialTrends,
  getMonthlyFinancialData,
  getDetailedExpenseBreakdown,
} from "../lib/supabase";
import AddExpenseDialog from "./AddExpenseDialog";
import ExpenseList from "./ExpenseList";

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
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [expenseBreakdown, setExpenseBreakdown] = useState<any>(null);
  const [expenseLoading, setExpenseLoading] = useState(true);

  useEffect(() => {
    fetchFinancialData();
    fetchExpenseBreakdown();
  }, [period]);

  const fetchExpenseBreakdown = async () => {
    setExpenseLoading(true);
    try {
      const breakdown = await getDetailedExpenseBreakdown(
        period as "daily" | "weekly" | "monthly",
      );
      setExpenseBreakdown(breakdown);
    } catch (error) {
      console.error("Error fetching expense breakdown:", error);
    } finally {
      setExpenseLoading(false);
    }
  };

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

  const handleExpenseAdded = () => {
    fetchFinancialData();
    fetchExpenseBreakdown();
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div className="w-full p-6 bg-background">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Laporan Keuangan</h1>
        <div className="flex items-center gap-4">
          <AddExpenseDialog onExpenseAdded={handleExpenseAdded} />
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
                  icon={<BarChartIcon className="h-5 w-5 text-green-500" />}
                />
                <SummaryCard
                  title="Total Pengeluaran"
                  value={formatCurrency(getDailySummary(data).expenses)}
                  description={getPeriodDescription(period, "expenses")}
                  trend=""
                  trendUp={false}
                  icon={<LineChartIcon className="h-5 w-5 text-red-500" />}
                />
                <SummaryCard
                  title="Total Laba"
                  value={formatCurrency(getDailySummary(data).profit)}
                  description={getPeriodDescription(period, "profit")}
                  trend=""
                  trendUp={getDailySummary(data).profit >= 0}
                  icon={<PieChartIcon className="h-5 w-5 text-blue-500" />}
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
                  <ResponsiveContainer width="100%" height="100%">
                    {period === "daily" ? (
                      <BarChart
                        data={[
                          {
                            name: "Hari Ini",
                            Pendapatan: getDailySummary(data).income,
                            Pengeluaran: getDailySummary(data).expenses,
                            Laba: getDailySummary(data).profit,
                          },
                        ]}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis
                          tickFormatter={(value) =>
                            `${(value / 1000000).toFixed(1)}M`
                          }
                        />
                        <Tooltip
                          formatter={(value: number) => [
                            formatCurrency(value),
                            "",
                          ]}
                        />
                        <Legend />
                        <Bar dataKey="Pendapatan" fill="#22c55e" />
                        <Bar dataKey="Pengeluaran" fill="#ef4444" />
                        <Bar dataKey="Laba" fill="#3b82f6" />
                      </BarChart>
                    ) : period === "weekly" && data?.weekly ? (
                      <LineChart
                        data={data.weekly.days.map((day, index) => ({
                          name: day,
                          Pendapatan: data.weekly!.income[index] || 0,
                          Pengeluaran: data.weekly!.expenses[index] || 0,
                          Laba:
                            (data.weekly!.income[index] || 0) -
                            (data.weekly!.expenses[index] || 0),
                        }))}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis
                          tickFormatter={(value) =>
                            `${(value / 1000000).toFixed(1)}M`
                          }
                        />
                        <Tooltip
                          formatter={(value: number) => [
                            formatCurrency(value),
                            "",
                          ]}
                        />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="Pendapatan"
                          stroke="#22c55e"
                          strokeWidth={2}
                        />
                        <Line
                          type="monotone"
                          dataKey="Pengeluaran"
                          stroke="#ef4444"
                          strokeWidth={2}
                        />
                        <Line
                          type="monotone"
                          dataKey="Laba"
                          stroke="#3b82f6"
                          strokeWidth={2}
                        />
                      </LineChart>
                    ) : period === "monthly" && data?.monthly ? (
                      <LineChart
                        data={data.monthly.months.map((month, index) => ({
                          name: month,
                          Pendapatan: data.monthly!.income[index] || 0,
                          Pengeluaran: data.monthly!.expenses[index] || 0,
                          Laba:
                            (data.monthly!.income[index] || 0) -
                            (data.monthly!.expenses[index] || 0),
                        }))}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis
                          tickFormatter={(value) =>
                            `${(value / 1000000).toFixed(1)}M`
                          }
                        />
                        <Tooltip
                          formatter={(value: number) => [
                            formatCurrency(value),
                            "",
                          ]}
                        />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="Pendapatan"
                          stroke="#22c55e"
                          strokeWidth={2}
                        />
                        <Line
                          type="monotone"
                          dataKey="Pengeluaran"
                          stroke="#ef4444"
                          strokeWidth={2}
                        />
                        <Line
                          type="monotone"
                          dataKey="Laba"
                          stroke="#3b82f6"
                          strokeWidth={2}
                        />
                      </LineChart>
                    ) : (
                      <div className="h-full w-full flex items-center justify-center">
                        <p className="text-muted-foreground">
                          Data tidak tersedia
                        </p>
                      </div>
                    )}
                  </ResponsiveContainer>
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

              <ExpenseList refreshTrigger={refreshTrigger} />
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
                <div className="space-y-6">
                  {/* Total Pendapatan */}
                  <div className="text-center p-6 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-3xl font-bold text-green-600 mb-2">
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
                    <p className="text-lg font-medium text-green-700">
                      Total Pendapatan
                    </p>
                  </div>

                  {/* Grafik Pendapatan */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Grafik Pendapatan</CardTitle>
                    </CardHeader>
                    <CardContent className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        {period === "daily" ? (
                          <BarChart
                            data={[
                              {
                                name: "Hari Ini",
                                Pendapatan: getDailySummary(data).income,
                              },
                            ]}
                            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis
                              tickFormatter={(value) =>
                                `${(value / 1000000).toFixed(1)}M`
                              }
                            />
                            <Tooltip
                              formatter={(value: number) => [
                                formatCurrency(value),
                                "Pendapatan",
                              ]}
                            />
                            <Bar dataKey="Pendapatan" fill="#22c55e" />
                          </BarChart>
                        ) : period === "weekly" && data?.weekly ? (
                          <LineChart
                            data={data.weekly.days.map((day, index) => ({
                              name: day,
                              Pendapatan: data.weekly!.income[index] || 0,
                            }))}
                            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis
                              tickFormatter={(value) =>
                                `${(value / 1000000).toFixed(1)}M`
                              }
                            />
                            <Tooltip
                              formatter={(value: number) => [
                                formatCurrency(value),
                                "Pendapatan",
                              ]}
                            />
                            <Line
                              type="monotone"
                              dataKey="Pendapatan"
                              stroke="#22c55e"
                              strokeWidth={3}
                            />
                          </LineChart>
                        ) : period === "monthly" && data?.monthly ? (
                          <LineChart
                            data={data.monthly.months.map((month, index) => ({
                              name: month,
                              Pendapatan: data.monthly!.income[index] || 0,
                            }))}
                            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis
                              tickFormatter={(value) =>
                                `${(value / 1000000).toFixed(1)}M`
                              }
                            />
                            <Tooltip
                              formatter={(value: number) => [
                                formatCurrency(value),
                                "Pendapatan",
                              ]}
                            />
                            <Line
                              type="monotone"
                              dataKey="Pendapatan"
                              stroke="#22c55e"
                              strokeWidth={3}
                            />
                          </LineChart>
                        ) : (
                          <div className="h-full w-full flex items-center justify-center">
                            <p className="text-muted-foreground">
                              Data tidak tersedia
                            </p>
                          </div>
                        )}
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  {/* Detail Pendapatan */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Breakdown Harian/Mingguan/Bulanan */}
                    <Card>
                      <CardHeader>
                        <CardTitle>
                          {period === "daily"
                            ? "Detail Hari Ini"
                            : period === "weekly"
                              ? "Pendapatan Harian (7 Hari)"
                              : "Pendapatan Bulanan (6 Bulan)"}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {period === "weekly" &&
                            data?.weekly &&
                            data.weekly.days.length > 0 &&
                            data.weekly.days.map((day, index) => (
                              <div
                                key={index}
                                className="flex justify-between text-sm py-1 border-b border-gray-100"
                              >
                                <span className="font-medium">{day}</span>
                                <span className="text-green-600 font-medium">
                                  {formatCurrency(
                                    data.weekly!.income[index] || 0,
                                  )}
                                </span>
                              </div>
                            ))}
                          {period === "monthly" &&
                            data?.monthly &&
                            data.monthly.months.length > 0 &&
                            data.monthly.months.map((month, index) => (
                              <div
                                key={index}
                                className="flex justify-between text-sm py-1 border-b border-gray-100"
                              >
                                <span className="font-medium">{month}</span>
                                <span className="text-green-600 font-medium">
                                  {formatCurrency(
                                    data.monthly!.income[index] || 0,
                                  )}
                                </span>
                              </div>
                            ))}
                          {period === "daily" && (
                            <div className="text-center py-8">
                              <p className="text-2xl font-bold text-green-600 mb-2">
                                {formatCurrency(getDailySummary(data).income)}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Pendapatan Hari Ini
                              </p>
                              <p className="text-xs text-muted-foreground mt-2">
                                Dari {getDailySummary(data).transactions}{" "}
                                transaksi
                              </p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Statistik Pendapatan */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Statistik Pendapatan</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex justify-between items-center py-2 border-b">
                            <span className="text-sm font-medium">
                              Rata-rata per Hari
                            </span>
                            <span className="font-bold text-green-600">
                              {period === "weekly" && data?.weekly
                                ? formatCurrency(
                                    data.weekly.income.reduce(
                                      (a, b) => a + b,
                                      0,
                                    ) / 7,
                                  )
                                : period === "monthly" && data?.monthly
                                  ? formatCurrency(
                                      data.monthly.income.reduce(
                                        (a, b) => a + b,
                                        0,
                                      ) / 30,
                                    )
                                  : formatCurrency(
                                      getDailySummary(data).income,
                                    )}
                            </span>
                          </div>
                          <div className="flex justify-between items-center py-2 border-b">
                            <span className="text-sm font-medium">
                              Pendapatan Tertinggi
                            </span>
                            <span className="font-bold text-green-600">
                              {period === "weekly" && data?.weekly
                                ? formatCurrency(
                                    Math.max(...data.weekly.income),
                                  )
                                : period === "monthly" && data?.monthly
                                  ? formatCurrency(
                                      Math.max(...data.monthly.income),
                                    )
                                  : formatCurrency(
                                      getDailySummary(data).income,
                                    )}
                            </span>
                          </div>
                          <div className="flex justify-between items-center py-2 border-b">
                            <span className="text-sm font-medium">
                              Pendapatan Terendah
                            </span>
                            <span className="font-bold text-green-600">
                              {period === "weekly" && data?.weekly
                                ? formatCurrency(
                                    Math.min(...data.weekly.income),
                                  )
                                : period === "monthly" && data?.monthly
                                  ? formatCurrency(
                                      Math.min(...data.monthly.income),
                                    )
                                  : formatCurrency(
                                      getDailySummary(data).income,
                                    )}
                            </span>
                          </div>
                          <div className="flex justify-between items-center py-2">
                            <span className="text-sm font-medium">
                              Total Transaksi
                            </span>
                            <span className="font-bold text-blue-600">
                              {period === "daily"
                                ? getDailySummary(data).transactions
                                : period === "weekly"
                                  ? getDailySummary(data).transactions * 7
                                  : getDailySummary(data).transactions * 30}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expenses">
          <div className="space-y-6">
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
                {expenseLoading ? (
                  <div className="h-96 w-full flex items-center justify-center">
                    <p className="text-muted-foreground">
                      Memuat data pengeluaran...
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Total Pengeluaran */}
                    <div className="text-center p-6 bg-red-50 rounded-lg border border-red-200">
                      <p className="text-3xl font-bold text-red-600 mb-2">
                        {formatCurrency(expenseBreakdown?.grandTotal || 0)}
                      </p>
                      <p className="text-lg font-medium text-red-700">
                        Total Pengeluaran
                      </p>
                    </div>

                    {/* Expense Categories */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* Biaya Operasional */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg text-blue-600">
                            Biaya Operasional
                          </CardTitle>
                          <CardDescription className="text-xl font-bold text-blue-700">
                            {formatCurrency(
                              expenseBreakdown?.operational?.total || 0,
                            )}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            {expenseBreakdown?.operational?.byCategory &&
                              Object.entries(
                                expenseBreakdown.operational.byCategory,
                              ).map(([category, amount]) => (
                                <div
                                  key={category}
                                  className="flex justify-between text-sm"
                                >
                                  <span className="text-muted-foreground">
                                    {category}
                                  </span>
                                  <span className="font-medium">
                                    {formatCurrency(amount as number)}
                                  </span>
                                </div>
                              ))}
                          </div>
                        </CardContent>
                      </Card>

                      {/* Biaya Lainnya */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg text-orange-600">
                            Biaya Lainnya
                          </CardTitle>
                          <CardDescription className="text-xl font-bold text-orange-700">
                            {formatCurrency(
                              expenseBreakdown?.other?.total || 0,
                            )}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            {expenseBreakdown?.other?.byCategory &&
                              Object.entries(
                                expenseBreakdown.other.byCategory,
                              ).map(([category, amount]) => (
                                <div
                                  key={category}
                                  className="flex justify-between text-sm"
                                >
                                  <span className="text-muted-foreground">
                                    {category}
                                  </span>
                                  <span className="font-medium">
                                    {formatCurrency(amount as number)}
                                  </span>
                                </div>
                              ))}
                          </div>
                        </CardContent>
                      </Card>

                      {/* Biaya Sparepart */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg text-green-600">
                            Biaya Sparepart
                          </CardTitle>
                          <CardDescription className="text-xl font-bold text-green-700">
                            {formatCurrency(
                              expenseBreakdown?.spareParts?.total || 0,
                            )}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2 max-h-48 overflow-y-auto">
                            {expenseBreakdown?.spareParts?.byName &&
                              Object.entries(
                                expenseBreakdown.spareParts.byName,
                              ).map(([name, data]) => (
                                <div key={name} className="space-y-1">
                                  <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground font-medium">
                                      {name}
                                    </span>
                                    <span className="font-medium">
                                      {formatCurrency((data as any).cost)}
                                    </span>
                                  </div>
                                  <div className="text-xs text-muted-foreground pl-2">
                                    Qty: {(data as any).quantity}
                                  </div>
                                </div>
                              ))}
                            {(!expenseBreakdown?.spareParts?.byName ||
                              Object.keys(expenseBreakdown.spareParts.byName)
                                .length === 0) && (
                              <p className="text-sm text-muted-foreground text-center py-4">
                                Tidak ada sparepart yang digunakan
                              </p>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Summary Breakdown */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Ringkasan Pengeluaran</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center py-2 border-b">
                            <span className="font-medium text-blue-600">
                              Biaya Operasional
                            </span>
                            <span className="font-bold text-blue-700">
                              {formatCurrency(
                                expenseBreakdown?.operational?.total || 0,
                              )}
                            </span>
                          </div>
                          <div className="flex justify-between items-center py-2 border-b">
                            <span className="font-medium text-orange-600">
                              Biaya Lainnya
                            </span>
                            <span className="font-bold text-orange-700">
                              {formatCurrency(
                                expenseBreakdown?.other?.total || 0,
                              )}
                            </span>
                          </div>
                          <div className="flex justify-between items-center py-2 border-b">
                            <span className="font-medium text-green-600">
                              Biaya Sparepart
                            </span>
                            <span className="font-bold text-green-700">
                              {formatCurrency(
                                expenseBreakdown?.spareParts?.total || 0,
                              )}
                            </span>
                          </div>
                          <div className="flex justify-between items-center py-3 bg-red-50 px-4 rounded-lg border-2 border-red-200">
                            <span className="font-bold text-lg text-red-600">
                              Total Pengeluaran
                            </span>
                            <span className="font-bold text-xl text-red-700">
                              {formatCurrency(
                                expenseBreakdown?.grandTotal || 0,
                              )}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
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
                <div className="space-y-6">
                  {/* Total Laba */}
                  <div
                    className={`text-center p-6 rounded-lg border-2 ${
                      (period === "weekly" && data?.weekly
                        ? data.weekly.income.reduce((a, b) => a + b, 0) -
                          data.weekly.expenses.reduce((a, b) => a + b, 0)
                        : period === "monthly" && data?.monthly
                          ? data.monthly.income.reduce((a, b) => a + b, 0) -
                            data.monthly.expenses.reduce((a, b) => a + b, 0)
                          : getDailySummary(data).profit) >= 0
                        ? "bg-green-50 border-green-200"
                        : "bg-red-50 border-red-200"
                    }`}
                  >
                    <p
                      className={`text-3xl font-bold mb-2 ${
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
                    <p
                      className={`text-lg font-medium ${
                        (period === "weekly" && data?.weekly
                          ? data.weekly.income.reduce((a, b) => a + b, 0) -
                            data.weekly.expenses.reduce((a, b) => a + b, 0)
                          : period === "monthly" && data?.monthly
                            ? data.monthly.income.reduce((a, b) => a + b, 0) -
                              data.monthly.expenses.reduce((a, b) => a + b, 0)
                            : getDailySummary(data).profit) >= 0
                          ? "text-green-700"
                          : "text-red-700"
                      }`}
                    >
                      Total Laba Bersih
                    </p>
                  </div>

                  {/* Grafik Laba */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Grafik Laba</CardTitle>
                    </CardHeader>
                    <CardContent className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        {period === "daily" ? (
                          <BarChart
                            data={[
                              {
                                name: "Hari Ini",
                                Laba: getDailySummary(data).profit,
                              },
                            ]}
                            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis
                              tickFormatter={(value) =>
                                `${(value / 1000000).toFixed(1)}M`
                              }
                            />
                            <Tooltip
                              formatter={(value: number) => [
                                formatCurrency(value),
                                "Laba",
                              ]}
                            />
                            <Bar
                              dataKey="Laba"
                              fill={
                                getDailySummary(data).profit >= 0
                                  ? "#22c55e"
                                  : "#ef4444"
                              }
                            />
                          </BarChart>
                        ) : period === "weekly" && data?.weekly ? (
                          <LineChart
                            data={data.weekly.days.map((day, index) => {
                              const profit =
                                (data.weekly!.income[index] || 0) -
                                (data.weekly!.expenses[index] || 0);
                              return {
                                name: day,
                                Laba: profit,
                              };
                            })}
                            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis
                              tickFormatter={(value) =>
                                `${(value / 1000000).toFixed(1)}M`
                              }
                            />
                            <Tooltip
                              formatter={(value: number) => [
                                formatCurrency(value),
                                "Laba",
                              ]}
                            />
                            <Line
                              type="monotone"
                              dataKey="Laba"
                              stroke="#3b82f6"
                              strokeWidth={3}
                            />
                          </LineChart>
                        ) : period === "monthly" && data?.monthly ? (
                          <LineChart
                            data={data.monthly.months.map((month, index) => {
                              const profit =
                                (data.monthly!.income[index] || 0) -
                                (data.monthly!.expenses[index] || 0);
                              return {
                                name: month,
                                Laba: profit,
                              };
                            })}
                            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis
                              tickFormatter={(value) =>
                                `${(value / 1000000).toFixed(1)}M`
                              }
                            />
                            <Tooltip
                              formatter={(value: number) => [
                                formatCurrency(value),
                                "Laba",
                              ]}
                            />
                            <Line
                              type="monotone"
                              dataKey="Laba"
                              stroke="#3b82f6"
                              strokeWidth={3}
                            />
                          </LineChart>
                        ) : (
                          <div className="h-full w-full flex items-center justify-center">
                            <p className="text-muted-foreground">
                              Data tidak tersedia
                            </p>
                          </div>
                        )}
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  {/* Detail Laba */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Breakdown Laba */}
                    <Card>
                      <CardHeader>
                        <CardTitle>
                          {period === "daily"
                            ? "Detail Laba Hari Ini"
                            : period === "weekly"
                              ? "Laba Harian (7 Hari)"
                              : "Laba Bulanan (6 Bulan)"}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {period === "weekly" &&
                            data?.weekly &&
                            data.weekly.days.length > 0 &&
                            data.weekly.days.map((day, index) => {
                              const profit =
                                (data.weekly!.income[index] || 0) -
                                (data.weekly!.expenses[index] || 0);
                              return (
                                <div
                                  key={index}
                                  className="flex justify-between text-sm py-1 border-b border-gray-100"
                                >
                                  <span className="font-medium">{day}</span>
                                  <span
                                    className={`font-medium ${profit >= 0 ? "text-green-600" : "text-red-600"}`}
                                  >
                                    {formatCurrency(profit)}
                                  </span>
                                </div>
                              );
                            })}
                          {period === "monthly" &&
                            data?.monthly &&
                            data.monthly.months.length > 0 &&
                            data.monthly.months.map((month, index) => {
                              const profit =
                                (data.monthly!.income[index] || 0) -
                                (data.monthly!.expenses[index] || 0);
                              return (
                                <div
                                  key={index}
                                  className="flex justify-between text-sm py-1 border-b border-gray-100"
                                >
                                  <span className="font-medium">{month}</span>
                                  <span
                                    className={`font-medium ${profit >= 0 ? "text-green-600" : "text-red-600"}`}
                                  >
                                    {formatCurrency(profit)}
                                  </span>
                                </div>
                              );
                            })}
                          {period === "daily" && (
                            <div className="space-y-3">
                              <div className="flex justify-between py-2 border-b">
                                <span className="text-sm font-medium text-green-600">
                                  Pendapatan
                                </span>
                                <span className="font-bold text-green-600">
                                  {formatCurrency(getDailySummary(data).income)}
                                </span>
                              </div>
                              <div className="flex justify-between py-2 border-b">
                                <span className="text-sm font-medium text-red-600">
                                  Pengeluaran
                                </span>
                                <span className="font-bold text-red-600">
                                  {formatCurrency(
                                    getDailySummary(data).expenses,
                                  )}
                                </span>
                              </div>
                              <div
                                className={`flex justify-between py-2 border-t-2 ${getDailySummary(data).profit >= 0 ? "border-green-200" : "border-red-200"}`}
                              >
                                <span className="text-sm font-bold">
                                  Laba Bersih
                                </span>
                                <span
                                  className={`font-bold text-lg ${getDailySummary(data).profit >= 0 ? "text-green-600" : "text-red-600"}`}
                                >
                                  {formatCurrency(getDailySummary(data).profit)}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Analisis Laba */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Analisis Laba</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex justify-between items-center py-2 border-b">
                            <span className="text-sm font-medium">
                              Margin Laba
                            </span>
                            <span className="font-bold text-blue-600">
                              {period === "weekly" && data?.weekly
                                ? `${(((data.weekly.income.reduce((a, b) => a + b, 0) - data.weekly.expenses.reduce((a, b) => a + b, 0)) / data.weekly.income.reduce((a, b) => a + b, 0)) * 100).toFixed(1)}%`
                                : period === "monthly" && data?.monthly
                                  ? `${(((data.monthly.income.reduce((a, b) => a + b, 0) - data.monthly.expenses.reduce((a, b) => a + b, 0)) / data.monthly.income.reduce((a, b) => a + b, 0)) * 100).toFixed(1)}%`
                                  : `${((getDailySummary(data).profit / getDailySummary(data).income) * 100).toFixed(1)}%`}
                            </span>
                          </div>
                          <div className="flex justify-between items-center py-2 border-b">
                            <span className="text-sm font-medium">
                              Laba Tertinggi
                            </span>
                            <span className="font-bold text-green-600">
                              {period === "weekly" && data?.weekly
                                ? formatCurrency(
                                    Math.max(
                                      ...data.weekly.days.map(
                                        (_, index) =>
                                          (data.weekly!.income[index] || 0) -
                                          (data.weekly!.expenses[index] || 0),
                                      ),
                                    ),
                                  )
                                : period === "monthly" && data?.monthly
                                  ? formatCurrency(
                                      Math.max(
                                        ...data.monthly.months.map(
                                          (_, index) =>
                                            (data.monthly!.income[index] || 0) -
                                            (data.monthly!.expenses[index] ||
                                              0),
                                        ),
                                      ),
                                    )
                                  : formatCurrency(
                                      getDailySummary(data).profit,
                                    )}
                            </span>
                          </div>
                          <div className="flex justify-between items-center py-2 border-b">
                            <span className="text-sm font-medium">
                              Laba Terendah
                            </span>
                            <span className="font-bold text-red-600">
                              {period === "weekly" && data?.weekly
                                ? formatCurrency(
                                    Math.min(
                                      ...data.weekly.days.map(
                                        (_, index) =>
                                          (data.weekly!.income[index] || 0) -
                                          (data.weekly!.expenses[index] || 0),
                                      ),
                                    ),
                                  )
                                : period === "monthly" && data?.monthly
                                  ? formatCurrency(
                                      Math.min(
                                        ...data.monthly.months.map(
                                          (_, index) =>
                                            (data.monthly!.income[index] || 0) -
                                            (data.monthly!.expenses[index] ||
                                              0),
                                        ),
                                      ),
                                    )
                                  : formatCurrency(
                                      getDailySummary(data).profit,
                                    )}
                            </span>
                          </div>
                          <div className="flex justify-between items-center py-2">
                            <span className="text-sm font-medium">
                              Rata-rata Laba
                            </span>
                            <span className="font-bold text-blue-600">
                              {period === "weekly" && data?.weekly
                                ? formatCurrency(
                                    (data.weekly.income.reduce(
                                      (a, b) => a + b,
                                      0,
                                    ) -
                                      data.weekly.expenses.reduce(
                                        (a, b) => a + b,
                                        0,
                                      )) /
                                      7,
                                  )
                                : period === "monthly" && data?.monthly
                                  ? formatCurrency(
                                      (data.monthly.income.reduce(
                                        (a, b) => a + b,
                                        0,
                                      ) -
                                        data.monthly.expenses.reduce(
                                          (a, b) => a + b,
                                          0,
                                        )) /
                                        6,
                                    )
                                  : formatCurrency(
                                      getDailySummary(data).profit,
                                    )}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
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
