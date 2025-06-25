import React, { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { BarChart, LineChart, PieChart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link } from "react-router-dom";
import { supabase, getFinancialSummary } from "@/lib/supabase";

const Home = () => {
  const [serviceQueue, setServiceQueue] = useState([]);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [dailyTransactions, setDailyTransactions] = useState([]);
  const [financialSummary, setFinancialSummary] = useState({
    income: 0,
    expenses: 0,
    profit: 0,
    transactions: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch service queue (services from today and recent days)
      const { data: servicesData, error: servicesError } = await supabase
        .from("services")
        .select(
          `
          id,
          complaint,
          status,
          service_date,
          customers!inner(name),
          vehicles!inner(brand, model, plate_number)
        `,
        )
        .gte(
          "service_date",
          new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split("T")[0],
        )
        .order("service_date", { ascending: false })
        .limit(10);

      if (servicesError) throw servicesError;

      const formattedServices =
        servicesData?.map((service) => ({
          id: service.id,
          customer: service.customers?.name || "Unknown",
          vehicle:
            `${service.vehicles?.brand || ""} ${service.vehicles?.model || ""}`.trim() ||
            service.vehicles?.plate_number ||
            "Unknown",
          issue: service.complaint,
          status: service.status,
          time: new Date(service.service_date).toLocaleTimeString("id-ID", {
            hour: "2-digit",
            minute: "2-digit",
          }),
        })) || [];

      setServiceQueue(formattedServices);

      // Fetch low stock items
      const { data: sparePartsData, error: sparePartsError } = await supabase
        .from("spare_parts")
        .select("id, name, stock, min_stock")
        .order("stock", { ascending: true });

      if (sparePartsError) throw sparePartsError;

      const formattedLowStock =
        sparePartsData
          ?.filter((item) => item.stock < item.min_stock)
          ?.map((item) => ({
            id: item.id,
            name: item.name,
            stock: item.stock,
            minimum: item.min_stock,
          }))
          ?.slice(0, 10) || [];

      setLowStockItems(formattedLowStock);

      // Fetch today's transactions (payments)
      const today = new Date().toISOString().split("T")[0];
      const { data: paymentsData, error: paymentsError } = await supabase
        .from("payments")
        .select(
          `
          id,
          amount,
          payment_date,
          payment_method,
          invoices!inner(
            invoice_items(
              item_type
            )
          )
        `,
        )
        .gte("payment_date", today)
        .lte("payment_date", today + "T23:59:59")
        .eq("status", "completed")
        .order("payment_date", { ascending: false });

      if (paymentsError) throw paymentsError;

      const formattedTransactions =
        paymentsData?.map((payment) => {
          const hasService = payment.invoices?.invoice_items?.some(
            (item) => item.item_type === "service",
          );
          const hasSparepart = payment.invoices?.invoice_items?.some(
            (item) => item.item_type === "sparepart",
          );

          let type = "Payment";
          if (hasService && hasSparepart) {
            type = "Service + Sparepart";
          } else if (hasService) {
            type = "Service";
          } else if (hasSparepart) {
            type = "Sparepart";
          }

          return {
            id: payment.id,
            type,
            amount: payment.amount,
            time: payment.payment_date
              ? new Date(payment.payment_date).toLocaleTimeString("id-ID", {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "--:--",
          };
        }) || [];

      setDailyTransactions(formattedTransactions);

      // Fetch financial summary
      const summary = await getFinancialSummary("daily");
      setFinancialSummary(summary);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      // Set empty arrays on error to prevent crashes
      setServiceQueue([]);
      setLowStockItems([]);
      setDailyTransactions([]);
      setFinancialSummary({
        income: 0,
        expenses: 0,
        profit: 0,
        transactions: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "waiting":
        return "bg-yellow-100 text-yellow-800";
      case "in-progress":
        return "bg-blue-100 text-blue-800";
      case "completed":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "waiting":
        return (
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
            Menunggu
          </Badge>
        );
      case "in-progress":
        return (
          <Badge variant="outline" className="bg-blue-100 text-blue-800">
            Dikerjakan
          </Badge>
        );
      case "completed":
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800">
            Selesai
          </Badge>
        );
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">
            Bengkel Motor Dashboard
          </h1>
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="sm">
              Notifikasi
            </Button>
            <Avatar>
              <AvatarImage
                src="https://api.dicebear.com/7.x/avataaars/svg?seed=owner"
                alt="Avatar"
              />
              <AvatarFallback>OM</AvatarFallback>
            </Avatar>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Link to="/service" className="no-underline">
            <Card className="hover:shadow-md transition-shadow cursor-pointer bg-white">
              <CardContent className="flex flex-col items-center justify-center p-6">
                <div className="rounded-full bg-blue-100 p-3 mb-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-blue-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-center">
                  Manajemen Servis
                </h3>
              </CardContent>
            </Card>
          </Link>

          <Link to="/inventory" className="no-underline">
            <Card className="hover:shadow-md transition-shadow cursor-pointer bg-white">
              <CardContent className="flex flex-col items-center justify-center p-6">
                <div className="rounded-full bg-green-100 p-3 mb-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-green-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-center">
                  Inventaris Sparepart
                </h3>
              </CardContent>
            </Card>
          </Link>

          <Link to="/customers" className="no-underline">
            <Card className="hover:shadow-md transition-shadow cursor-pointer bg-white">
              <CardContent className="flex flex-col items-center justify-center p-6">
                <div className="rounded-full bg-purple-100 p-3 mb-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-purple-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-center">
                  Database Pelanggan
                </h3>
              </CardContent>
            </Card>
          </Link>

          <Link to="/finance" className="no-underline">
            <Card className="hover:shadow-md transition-shadow cursor-pointer bg-white">
              <CardContent className="flex flex-col items-center justify-center p-6">
                <div className="rounded-full bg-yellow-100 p-3 mb-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-yellow-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-center">
                  Laporan Keuangan
                </h3>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Dashboard Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Service Queue */}
          <Card className="bg-white">
            <CardHeader>
              <CardTitle>Antrian Servis</CardTitle>
              <CardDescription>
                Daftar kendaraan yang sedang menunggu atau dalam proses servis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {loading ? (
                  <div className="text-center py-4">
                    <p className="text-gray-500">Memuat data...</p>
                  </div>
                ) : serviceQueue.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-gray-500">Tidak ada antrian servis</p>
                  </div>
                ) : (
                  serviceQueue.map((service) => (
                    <div
                      key={service.id}
                      className="flex justify-between items-center p-3 border rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{service.customer}</p>
                        <p className="text-sm text-gray-500">
                          {service.vehicle} - {service.issue}
                        </p>
                      </div>
                      <div className="flex flex-col items-end">
                        {getStatusBadge(service.status)}
                        <span className="text-xs text-gray-500 mt-1">
                          {service.time}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="mt-4">
                <Button variant="outline" className="w-full">
                  Lihat Semua Antrian
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Daily Transactions */}
          <Card className="bg-white">
            <CardHeader>
              <CardTitle>Transaksi Hari Ini</CardTitle>
              <CardDescription>
                Ringkasan transaksi yang terjadi hari ini
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {loading ? (
                  <div className="text-center py-4">
                    <p className="text-gray-500">Memuat data...</p>
                  </div>
                ) : dailyTransactions.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-gray-500">
                      Belum ada transaksi hari ini
                    </p>
                  </div>
                ) : (
                  dailyTransactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      className="flex justify-between items-center p-3 border rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{transaction.type}</p>
                        <p className="text-xs text-gray-500">
                          {transaction.time}
                        </p>
                      </div>
                      <div>
                        <p className="font-semibold text-right">
                          Rp {transaction.amount.toLocaleString("id-ID")}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="mt-6 pt-4 border-t">
                <div className="flex justify-between">
                  <p className="font-medium">Total Hari Ini</p>
                  <p className="font-bold">
                    Rp{" "}
                    {loading
                      ? "0"
                      : financialSummary.income.toLocaleString("id-ID")}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Low Stock Alert */}
          <Card className="bg-white">
            <CardHeader>
              <CardTitle>Stok Hampir Habis</CardTitle>
              <CardDescription>
                Sparepart yang perlu segera ditambah stoknya
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {loading ? (
                  <div className="text-center py-4">
                    <p className="text-gray-500">Memuat data...</p>
                  </div>
                ) : lowStockItems.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-gray-500">Semua stok aman</p>
                  </div>
                ) : (
                  lowStockItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex justify-between items-center p-3 border rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-xs text-gray-500">
                          Minimum: {item.minimum}
                        </p>
                      </div>
                      <div>
                        <Badge
                          variant="outline"
                          className="bg-red-100 text-red-800"
                        >
                          Stok: {item.stock}
                        </Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="mt-4">
                <Button variant="outline" className="w-full">
                  Kelola Inventaris
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Financial Summary */}
        <div className="mt-8">
          <Card className="bg-white">
            <CardHeader>
              <CardTitle>Ringkasan Keuangan</CardTitle>
              <CardDescription>
                Grafik pendapatan dan pengeluaran
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="daily">
                <TabsList className="mb-4">
                  <TabsTrigger value="daily">Harian</TabsTrigger>
                  <TabsTrigger value="weekly">Mingguan</TabsTrigger>
                  <TabsTrigger value="monthly">Bulanan</TabsTrigger>
                </TabsList>
                <TabsContent value="daily" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="bg-green-50 p-4 rounded-lg">
                      <h4 className="text-sm font-medium text-green-800">
                        Pendapatan
                      </h4>
                      <p className="text-2xl font-bold text-green-900">
                        Rp{" "}
                        {loading
                          ? "0"
                          : financialSummary.income.toLocaleString("id-ID")}
                      </p>
                    </div>
                    <div className="bg-red-50 p-4 rounded-lg">
                      <h4 className="text-sm font-medium text-red-800">
                        Pengeluaran
                      </h4>
                      <p className="text-2xl font-bold text-red-900">
                        Rp{" "}
                        {loading
                          ? "0"
                          : financialSummary.expenses.toLocaleString("id-ID")}
                      </p>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h4 className="text-sm font-medium text-blue-800">
                        Laba
                      </h4>
                      <p className="text-2xl font-bold text-blue-900">
                        Rp{" "}
                        {loading
                          ? "0"
                          : financialSummary.profit.toLocaleString("id-ID")}
                      </p>
                    </div>
                  </div>
                  <div className="h-[120px] flex items-center justify-center bg-gray-50 rounded-lg">
                    <div className="text-center">
                      <BarChart className="h-12 w-12 text-gray-400 mx-auto" />
                      <p className="text-gray-500 mt-2 text-sm">
                        Grafik detail tersedia di halaman Laporan Keuangan
                      </p>
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="weekly" className="space-y-4">
                  <div className="h-[200px] flex items-center justify-center bg-gray-50 rounded-lg">
                    <div className="text-center">
                      <LineChart className="h-16 w-16 text-gray-400 mx-auto" />
                      <p className="text-gray-500 mt-2">
                        Grafik pendapatan mingguan akan ditampilkan di sini
                      </p>
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="monthly" className="space-y-4">
                  <div className="h-[200px] flex items-center justify-center bg-gray-50 rounded-lg">
                    <div className="text-center">
                      <PieChart className="h-16 w-16 text-gray-400 mx-auto" />
                      <p className="text-gray-500 mt-2">
                        Grafik pendapatan bulanan akan ditampilkan di sini
                      </p>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Home;
