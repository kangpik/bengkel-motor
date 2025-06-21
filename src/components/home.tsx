import React from "react";
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

const Home = () => {
  // Mock data for dashboard
  const serviceQueue = [
    {
      id: 1,
      customer: "Budi Santoso",
      vehicle: "Honda Beat",
      issue: "Ganti oli",
      status: "waiting",
      time: "09:00",
    },
    {
      id: 2,
      customer: "Dewi Lestari",
      vehicle: "Yamaha Nmax",
      issue: "Service rutin",
      status: "in-progress",
      time: "10:30",
    },
    {
      id: 3,
      customer: "Ahmad Rizki",
      vehicle: "Suzuki Satria",
      issue: "Rem blong",
      status: "waiting",
      time: "11:15",
    },
    {
      id: 4,
      customer: "Siti Nurhaliza",
      vehicle: "Honda Vario",
      issue: "Ganti ban",
      status: "completed",
      time: "08:45",
    },
  ];

  const lowStockItems = [
    { id: 1, name: "Oli Mesin", stock: 3, minimum: 5 },
    { id: 2, name: "Filter Udara", stock: 2, minimum: 10 },
    { id: 3, name: "Kampas Rem", stock: 4, minimum: 8 },
  ];

  const dailyTransactions = [
    { id: 1, type: "Service", amount: 150000, time: "09:30" },
    { id: 2, type: "Sparepart", amount: 75000, time: "10:45" },
    { id: 3, type: "Service", amount: 200000, time: "12:15" },
    { id: 4, type: "Sparepart", amount: 50000, time: "14:30" },
  ];

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
                {serviceQueue.map((service) => (
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
                ))}
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
                {dailyTransactions.map((transaction) => (
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
                ))}
              </div>
              <div className="mt-6 pt-4 border-t">
                <div className="flex justify-between">
                  <p className="font-medium">Total Hari Ini</p>
                  <p className="font-bold">
                    Rp{" "}
                    {dailyTransactions
                      .reduce((sum, item) => sum + item.amount, 0)
                      .toLocaleString("id-ID")}
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
                {lowStockItems.map((item) => (
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
                ))}
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
                  <div className="h-[200px] flex items-center justify-center bg-gray-50 rounded-lg">
                    <div className="text-center">
                      <BarChart className="h-16 w-16 text-gray-400 mx-auto" />
                      <p className="text-gray-500 mt-2">
                        Grafik pendapatan harian akan ditampilkan di sini
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
