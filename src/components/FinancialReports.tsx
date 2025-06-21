import React, { useState } from "react";
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

const FinancialReports: React.FC<FinancialReportsProps> = ({
  data = defaultData,
}) => {
  const [period, setPeriod] = useState<string>("daily");

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

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="overview">Ringkasan</TabsTrigger>
          <TabsTrigger value="income">Pendapatan</TabsTrigger>
          <TabsTrigger value="expenses">Pengeluaran</TabsTrigger>
          <TabsTrigger value="profit">Laba</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <SummaryCard
              title="Total Pendapatan"
              value={formatCurrency(getDailySummary(data).income)}
              description="Pendapatan hari ini"
              trend="+5.2%"
              trendUp={true}
              icon={<BarChart className="h-5 w-5 text-green-500" />}
            />
            <SummaryCard
              title="Total Pengeluaran"
              value={formatCurrency(getDailySummary(data).expenses)}
              description="Pengeluaran hari ini"
              trend="-2.1%"
              trendUp={false}
              icon={<LineChart className="h-5 w-5 text-red-500" />}
            />
            <SummaryCard
              title="Total Laba"
              value={formatCurrency(getDailySummary(data).profit)}
              description="Laba hari ini"
              trend="+8.4%"
              trendUp={true}
              icon={<PieChart className="h-5 w-5 text-blue-500" />}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Tren Pendapatan vs Pengeluaran</CardTitle>
                <CardDescription>7 hari terakhir</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <div className="h-full w-full flex items-center justify-center bg-muted/20 rounded-md">
                  <p className="text-muted-foreground">
                    Grafik Pendapatan vs Pengeluaran
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Distribusi Pendapatan</CardTitle>
                <CardDescription>Berdasarkan kategori servis</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <div className="h-full w-full flex items-center justify-center bg-muted/20 rounded-md">
                  <p className="text-muted-foreground">
                    Grafik Distribusi Pendapatan
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
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
                    : "30 hari terakhir"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-96 w-full flex items-center justify-center bg-muted/20 rounded-md">
                <p className="text-muted-foreground">
                  Grafik Detail Pendapatan
                </p>
              </div>
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
                    : "30 hari terakhir"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-96 w-full flex items-center justify-center bg-muted/20 rounded-md">
                <p className="text-muted-foreground">
                  Grafik Detail Pengeluaran
                </p>
              </div>
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
                    : "30 hari terakhir"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-96 w-full flex items-center justify-center bg-muted/20 rounded-md">
                <p className="text-muted-foreground">Grafik Detail Laba</p>
              </div>
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
        <div
          className={`flex items-center mt-2 text-xs ${trendUp ? "text-green-500" : "text-red-500"}`}
        >
          {trendUp ? "↑" : "↓"} {trend}
        </div>
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
