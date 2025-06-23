import React, { useState, useEffect } from "react";
import { Search, Plus, Edit, Trash2, ChevronRight, User } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "./ui/alert-dialog";
import { Label } from "./ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { supabase, Customer, Vehicle, Service } from "../lib/supabase";

interface CustomerWithVehicles extends Customer {
  vehicles?: Vehicle[];
}

const CustomerDatabase = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCustomer, setSelectedCustomer] =
    useState<CustomerWithVehicles | null>(null);
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
  const [isEditCustomerOpen, setIsEditCustomerOpen] = useState(false);
  const [isViewDetailsOpen, setIsViewDetailsOpen] = useState(false);
  const [isAddVehicleOpen, setIsAddVehicleOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [customers, setCustomers] = useState<CustomerWithVehicles[]>([]);
  const [customerVehicles, setCustomerVehicles] = useState<Vehicle[]>([]);
  const [serviceHistory, setServiceHistory] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from("customers")
        .select(
          `
          *,
          vehicles(*)
        `,
        )
        .order("name");

      if (error) throw error;
      setCustomers(data || []);
    } catch (error) {
      console.error("Error fetching customers:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomerVehicles = async (customerId: string) => {
    try {
      const { data, error } = await supabase
        .from("vehicles")
        .select("*")
        .eq("customer_id", customerId)
        .order("plate_number");

      if (error) throw error;
      setCustomerVehicles(data || []);
    } catch (error) {
      console.error("Error fetching customer vehicles:", error);
    }
  };

  const fetchServiceHistory = async (customerId: string) => {
    try {
      const { data, error } = await supabase
        .from("services")
        .select(
          `
          *,
          vehicles(plate_number, brand, model)
        `,
        )
        .eq("customer_id", customerId)
        .order("service_date", { ascending: false });

      if (error) throw error;
      setServiceHistory(data || []);
    } catch (error) {
      console.error("Error fetching service history:", error);
    }
  };

  const filteredCustomers = customers.filter(
    (customer) =>
      customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.phone.includes(searchQuery) ||
      (customer.email &&
        customer.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (customer.vehicles &&
        customer.vehicles.some((vehicle) =>
          vehicle.plate_number
            .toLowerCase()
            .includes(searchQuery.toLowerCase()),
        )),
  );

  const handleViewDetails = async (customer: CustomerWithVehicles) => {
    setSelectedCustomer(customer);
    await fetchCustomerVehicles(customer.id);
    await fetchServiceHistory(customer.id);
    setIsViewDetailsOpen(true);
  };

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);

    try {
      // Add customer
      const { data: customerData, error: customerError } = await supabase
        .from("customers")
        .insert({
          name: formData.get("name") as string,
          phone: formData.get("phone") as string,
          email: formData.get("email") as string,
          address: formData.get("address") as string,
        })
        .select()
        .single();

      if (customerError) throw customerError;

      // Add vehicle if provided
      const plateNumber = formData.get("plateNumber") as string;
      if (plateNumber && customerData) {
        const { error: vehicleError } = await supabase.from("vehicles").insert({
          customer_id: customerData.id,
          plate_number: plateNumber,
          brand: formData.get("brand") as string,
          model: formData.get("model") as string,
          year: formData.get("year") as string,
        });

        if (vehicleError) throw vehicleError;
      }

      await fetchCustomers();
      setIsAddCustomerOpen(false);
    } catch (error) {
      console.error("Error adding customer:", error);
    }
  };

  const handleEditCustomer = (customer: Customer) => {
    setEditingCustomer(customer);
    setIsEditCustomerOpen(true);
  };

  const handleUpdateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCustomer) return;

    const formData = new FormData(e.target as HTMLFormElement);

    try {
      const { error } = await supabase
        .from("customers")
        .update({
          name: formData.get("name") as string,
          phone: formData.get("phone") as string,
          email: formData.get("email") as string,
          address: formData.get("address") as string,
        })
        .eq("id", editingCustomer.id);

      if (error) throw error;

      await fetchCustomers();
      setIsEditCustomerOpen(false);
      setEditingCustomer(null);
    } catch (error) {
      console.error("Error updating customer:", error);
    }
  };

  const handleDeleteCustomer = async (id: string) => {
    try {
      const { error } = await supabase.from("customers").delete().eq("id", id);

      if (error) throw error;

      await fetchCustomers();
    } catch (error) {
      console.error("Error deleting customer:", error);
    }
  };

  const handleAddVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;

    const formData = new FormData(e.target as HTMLFormElement);

    try {
      const { error } = await supabase.from("vehicles").insert({
        customer_id: selectedCustomer.id,
        plate_number: formData.get("plateNumber") as string,
        brand: formData.get("brand") as string,
        model: formData.get("model") as string,
        year: formData.get("year") as string,
      });

      if (error) throw error;

      await fetchCustomerVehicles(selectedCustomer.id);
      setIsAddVehicleOpen(false);
    } catch (error) {
      console.error("Error adding vehicle:", error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500";
      case "in-progress":
        return "bg-yellow-500";
      case "pending":
        return "bg-blue-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm w-full">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Database Pelanggan</h1>
        <Button onClick={() => setIsAddCustomerOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Tambah Pelanggan
        </Button>
      </div>

      <div className="relative mb-6">
        <Search
          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
          size={18}
        />
        <Input
          className="pl-10"
          placeholder="Cari pelanggan berdasarkan nama, nomor telepon, atau plat nomor..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Pelanggan</CardTitle>
          <CardDescription>
            Total {filteredCustomers.length} pelanggan terdaftar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead>Nomor Telepon</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Kendaraan</TableHead>
                <TableHead>Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10">
                    Memuat data...
                  </TableCell>
                </TableRow>
              ) : filteredCustomers.length > 0 ? (
                filteredCustomers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell className="font-medium">
                      {customer.name}
                    </TableCell>
                    <TableCell>{customer.phone}</TableCell>
                    <TableCell>{customer.email || "-"}</TableCell>
                    <TableCell>
                      {customer.vehicles?.length || 0} kendaraan
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDetails(customer)}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditCustomer(customer)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Hapus Pelanggan
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                Apakah Anda yakin ingin menghapus pelanggan{" "}
                                {customer.name}? Tindakan ini tidak dapat
                                dibatalkan dan akan menghapus semua data
                                kendaraan dan riwayat servis yang terkait.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Batal</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() =>
                                  handleDeleteCustomer(customer.id)
                                }
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Hapus
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10">
                    Tidak ada data pelanggan
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add Customer Dialog */}
      <Dialog open={isAddCustomerOpen} onOpenChange={setIsAddCustomerOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Tambah Pelanggan Baru</DialogTitle>
            <DialogDescription>
              Masukkan informasi pelanggan dan kendaraan di bawah ini.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddCustomer}>
            <div className="grid gap-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nama Lengkap</Label>
                  <Input
                    name="name"
                    placeholder="Masukkan nama lengkap"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Nomor Telepon</Label>
                  <Input
                    name="phone"
                    placeholder="Masukkan nomor telepon"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    name="email"
                    type="email"
                    placeholder="Masukkan email"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Alamat</Label>
                  <Input name="address" placeholder="Masukkan alamat" />
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-medium">
                  Informasi Kendaraan (Opsional)
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="plateNumber">Plat Nomor</Label>
                    <Input
                      name="plateNumber"
                      placeholder="Contoh: B 1234 ABC"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="brand">Merek</Label>
                    <Input name="brand" placeholder="Contoh: Honda, Yamaha" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="model">Model</Label>
                    <Input name="model" placeholder="Contoh: Beat, NMAX" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="year">Tahun</Label>
                    <Input name="year" placeholder="Contoh: 2020" />
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddCustomerOpen(false)}
              >
                Batal
              </Button>
              <Button type="submit">Simpan</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Customer Dialog */}
      <Dialog open={isEditCustomerOpen} onOpenChange={setIsEditCustomerOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Pelanggan</DialogTitle>
            <DialogDescription>
              Ubah informasi pelanggan di bawah ini.
            </DialogDescription>
          </DialogHeader>
          {editingCustomer && (
            <form onSubmit={handleUpdateCustomer}>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Nama Lengkap</Label>
                  <Input
                    name="name"
                    defaultValue={editingCustomer.name}
                    placeholder="Masukkan nama lengkap"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-phone">Nomor Telepon</Label>
                  <Input
                    name="phone"
                    defaultValue={editingCustomer.phone}
                    placeholder="Masukkan nomor telepon"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-email">Email</Label>
                  <Input
                    name="email"
                    type="email"
                    defaultValue={editingCustomer.email || ""}
                    placeholder="Masukkan email"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-address">Alamat</Label>
                  <Input
                    name="address"
                    defaultValue={editingCustomer.address || ""}
                    placeholder="Masukkan alamat"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsEditCustomerOpen(false);
                    setEditingCustomer(null);
                  }}
                >
                  Batal
                </Button>
                <Button type="submit">Simpan Perubahan</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* View Customer Details Dialog */}
      <Dialog open={isViewDetailsOpen} onOpenChange={setIsViewDetailsOpen}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>Detail Pelanggan</DialogTitle>
          </DialogHeader>
          {selectedCustomer && (
            <div className="py-4">
              <div className="flex items-center gap-4 mb-6">
                <Avatar className="h-16 w-16">
                  <AvatarImage src="" />
                  <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                    {selectedCustomer.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="text-xl font-bold">{selectedCustomer.name}</h2>
                  <div className="text-sm text-gray-500 flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span>📱 {selectedCustomer.phone}</span>
                      <span>✉️ {selectedCustomer.email}</span>
                    </div>
                    <div>🏠 {selectedCustomer.address}</div>
                  </div>
                </div>
              </div>

              <Tabs defaultValue="vehicles">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="vehicles">Kendaraan</TabsTrigger>
                  <TabsTrigger value="history">Riwayat Servis</TabsTrigger>
                </TabsList>
                <TabsContent value="vehicles" className="mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Daftar Kendaraan</CardTitle>
                      <CardDescription>
                        {customerVehicles.length} kendaraan terdaftar
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Plat Nomor</TableHead>
                            <TableHead>Merek</TableHead>
                            <TableHead>Model</TableHead>
                            <TableHead>Tahun</TableHead>
                            <TableHead>Servis Terakhir</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {customerVehicles.map((vehicle) => (
                            <TableRow key={vehicle.id}>
                              <TableCell className="font-medium">
                                {vehicle.plate_number}
                              </TableCell>
                              <TableCell>{vehicle.brand}</TableCell>
                              <TableCell>{vehicle.model}</TableCell>
                              <TableCell>{vehicle.year}</TableCell>
                              <TableCell>
                                {vehicle.last_service
                                  ? new Date(
                                      vehicle.last_service,
                                    ).toLocaleDateString("id-ID")
                                  : "-"}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                    <CardFooter>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsAddVehicleOpen(true)}
                      >
                        <Plus className="mr-2 h-4 w-4" /> Tambah Kendaraan
                      </Button>
                    </CardFooter>
                  </Card>
                </TabsContent>
                <TabsContent value="history" className="mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Riwayat Servis</CardTitle>
                      <CardDescription>
                        Semua riwayat servis untuk kendaraan pelanggan ini
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Tanggal</TableHead>
                            <TableHead>Kendaraan</TableHead>
                            <TableHead>Jenis Servis</TableHead>
                            <TableHead>Biaya</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {serviceHistory.length > 0 ? (
                            serviceHistory.map((service) => (
                              <TableRow key={service.id}>
                                <TableCell>
                                  {new Date(
                                    service.service_date,
                                  ).toLocaleDateString("id-ID")}
                                </TableCell>
                                <TableCell>
                                  {service.vehicles?.plate_number} (
                                  {service.vehicles?.brand}{" "}
                                  {service.vehicles?.model})
                                </TableCell>
                                <TableCell>{service.complaint}</TableCell>
                                <TableCell>
                                  Rp {service.cost.toLocaleString("id-ID")}
                                </TableCell>
                                <TableCell>
                                  <Badge
                                    variant="outline"
                                    className="capitalize"
                                  >
                                    <div
                                      className={`w-2 h-2 rounded-full mr-2 ${getStatusColor(service.status)}`}
                                    ></div>
                                    {service.status === "completed"
                                      ? "Selesai"
                                      : service.status === "in-progress"
                                        ? "Dalam Proses"
                                        : "Menunggu"}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell
                                colSpan={5}
                                className="text-center py-4"
                              >
                                Belum ada riwayat servis
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsViewDetailsOpen(false)}
            >
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Vehicle Dialog */}
      <Dialog open={isAddVehicleOpen} onOpenChange={setIsAddVehicleOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Tambah Kendaraan Baru</DialogTitle>
            <DialogDescription>
              Tambahkan kendaraan baru untuk {selectedCustomer?.name}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddVehicle}>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="vehicle-plateNumber">Plat Nomor</Label>
                <Input
                  name="plateNumber"
                  placeholder="Contoh: B 1234 ABC"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="vehicle-brand">Merek</Label>
                  <Input
                    name="brand"
                    placeholder="Contoh: Honda, Yamaha"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vehicle-model">Model</Label>
                  <Input
                    name="model"
                    placeholder="Contoh: Beat, NMAX"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="vehicle-year">Tahun</Label>
                <Input name="year" placeholder="Contoh: 2020" required />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddVehicleOpen(false)}
              >
                Batal
              </Button>
              <Button type="submit">Simpan</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CustomerDatabase;
