import React, { useState, useEffect } from "react";
import {
  Search,
  Plus,
  Filter,
  Edit,
  Trash2,
  CheckCircle,
  Clock,
  AlertCircle,
  FileText,
  CreditCard,
  Receipt,
} from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
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
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Badge } from "./ui/badge";
import { supabase, Service, Customer, Vehicle } from "../lib/supabase";
import CreateInvoice from "./CreateInvoice";
import ProcessPayment from "./ProcessPayment";

interface ServiceWithDetails extends Service {
  customer_name?: string;
  vehicle_brand?: string;
  vehicle_model?: string;
  plate_number?: string;
  has_invoice?: boolean;
  invoice_status?: string;
  invoice_total?: number;
  paid_amount?: number;
}

const ServiceManagement = () => {
  const [activeTab, setActiveTab] = useState("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedService, setSelectedService] =
    useState<ServiceWithDetails | null>(null);
  const [services, setServices] = useState<ServiceWithDetails[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateInvoiceOpen, setIsCreateInvoiceOpen] = useState(false);
  const [isProcessPaymentOpen, setIsProcessPaymentOpen] = useState(false);
  const [selectedServiceForInvoice, setSelectedServiceForInvoice] =
    useState<ServiceWithDetails | null>(null);
  const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] =
    useState<any>(null);

  useEffect(() => {
    fetchServices();
    fetchCustomers();
    fetchVehicles();
  }, []);

  const fetchServices = async () => {
    try {
      const { data, error } = await supabase
        .from("services")
        .select(
          `
          *,
          customers(name),
          vehicles(plate_number, brand, model),
          invoices(id, status, total_amount, payments(amount))
        `,
        )
        .order("created_at", { ascending: false });

      if (error) throw error;

      const servicesWithDetails =
        data?.map((service) => {
          const invoice = service.invoices?.[0];
          const paidAmount =
            invoice?.payments?.reduce(
              (sum: number, payment: any) => sum + payment.amount,
              0,
            ) || 0;

          return {
            ...service,
            customer_name: service.customers?.name,
            vehicle_brand: service.vehicles?.brand,
            vehicle_model: service.vehicles?.model,
            plate_number: service.vehicles?.plate_number,
            has_invoice: !!invoice,
            invoice_status: invoice?.status,
            invoice_total: invoice?.total_amount,
            paid_amount: paidAmount,
          };
        }) || [];

      setServices(servicesWithDetails);
    } catch (error) {
      console.error("Error fetching services:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateInvoice = (service: ServiceWithDetails) => {
    setSelectedServiceForInvoice(service);
    setIsCreateInvoiceOpen(true);
  };

  const handleProcessPayment = async (service: ServiceWithDetails) => {
    if (!service.has_invoice) {
      alert("Buat invoice terlebih dahulu");
      return;
    }

    try {
      const { data: invoice, error } = await supabase
        .from("invoices")
        .select(
          `
          *,
          customers(name),
          vehicles(plate_number, brand, model),
          payments(amount)
        `,
        )
        .eq("service_id", service.id)
        .single();

      if (error) throw error;

      const paidAmount =
        invoice.payments?.reduce(
          (sum: number, payment: any) => sum + payment.amount,
          0,
        ) || 0;

      setSelectedInvoiceForPayment({
        ...invoice,
        customer_name: invoice.customers?.name,
        vehicle_info: `${invoice.vehicles?.brand} ${invoice.vehicles?.model} - ${invoice.vehicles?.plate_number}`,
        paid_amount: paidAmount,
      });
      setIsProcessPaymentOpen(true);
    } catch (error) {
      console.error("Error fetching invoice:", error);
      alert("Gagal memuat data invoice");
    }
  };

  const getInvoiceStatusBadge = (service: ServiceWithDetails) => {
    if (!service.has_invoice) {
      return (
        <Badge variant="outline" className="bg-gray-100 text-gray-800">
          Belum Ada Invoice
        </Badge>
      );
    }

    const remainingAmount =
      (service.invoice_total || 0) - (service.paid_amount || 0);

    if (remainingAmount <= 0) {
      return (
        <Badge variant="outline" className="bg-green-100 text-green-800">
          Lunas
        </Badge>
      );
    } else if (service.paid_amount && service.paid_amount > 0) {
      return (
        <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
          Sebagian
        </Badge>
      );
    } else {
      return (
        <Badge variant="outline" className="bg-red-100 text-red-800">
          Belum Bayar
        </Badge>
      );
    }
  };

  const fetchCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .order("name");

      if (error) throw error;
      setCustomers(data || []);
    } catch (error) {
      console.error("Error fetching customers:", error);
    }
  };

  const fetchVehicles = async () => {
    try {
      const { data, error } = await supabase
        .from("vehicles")
        .select("*")
        .order("plate_number");

      if (error) throw error;
      setVehicles(data || []);
    } catch (error) {
      console.error("Error fetching vehicles:", error);
    }
  };

  const filteredServices = services.filter((service) => {
    const matchesTab = activeTab === "all" || service.status === activeTab;
    const matchesSearch =
      searchQuery === "" ||
      service.customer_name
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      service.plate_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.complaint?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);

    try {
      const { error } = await supabase.from("services").insert({
        customer_id: formData.get("customer_id") as string,
        vehicle_id: formData.get("vehicle_id") as string,
        complaint: formData.get("complaint") as string,
        cost: parseFloat(formData.get("cost") as string) || 0,
        mechanic: formData.get("mechanic") as string,
        status: formData.get("status") as
          | "pending"
          | "in-progress"
          | "completed",
      });

      if (error) throw error;

      await fetchServices();
      setIsAddDialogOpen(false);
    } catch (error) {
      console.error("Error adding service:", error);
    }
  };

  const handleEditService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedService) return;

    const formData = new FormData(e.target as HTMLFormElement);

    try {
      const { error } = await supabase
        .from("services")
        .update({
          customer_id: formData.get("customer_id") as string,
          vehicle_id: formData.get("vehicle_id") as string,
          complaint: formData.get("complaint") as string,
          cost: parseFloat(formData.get("cost") as string) || 0,
          mechanic: formData.get("mechanic") as string,
          status: formData.get("status") as
            | "pending"
            | "in-progress"
            | "completed",
        })
        .eq("id", selectedService.id);

      if (error) throw error;

      await fetchServices();
      setIsEditDialogOpen(false);
    } catch (error) {
      console.error("Error updating service:", error);
    }
  };

  const handleDeleteService = async (id: string) => {
    try {
      const { error } = await supabase.from("services").delete().eq("id", id);

      if (error) throw error;

      await fetchServices();
    } catch (error) {
      console.error("Error deleting service:", error);
    }
  };

  const handleStatusChange = async (
    id: string,
    status: "pending" | "in-progress" | "completed",
  ) => {
    try {
      const { error } = await supabase
        .from("services")
        .update({ status })
        .eq("id", id);

      if (error) throw error;

      await fetchServices();
    } catch (error) {
      console.error("Error updating service status:", error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
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
    <div className="bg-white p-6 rounded-lg shadow-sm w-full">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Manajemen Servis</h1>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              type="search"
              placeholder="Cari servis..."
              className="pl-8 w-[250px]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Tambah Servis
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Tambah Servis Baru</DialogTitle>
                <DialogDescription>
                  Masukkan detail servis kendaraan baru di bawah ini.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddService}>
                <div className="grid grid-cols-2 gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="customer_id">Pelanggan</Label>
                    <Select name="customer_id" required>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih pelanggan" />
                      </SelectTrigger>
                      <SelectContent>
                        {customers.map((customer) => (
                          <SelectItem key={customer.id} value={customer.id}>
                            {customer.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="vehicle_id">Kendaraan</Label>
                    <Select name="vehicle_id" required>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih kendaraan" />
                      </SelectTrigger>
                      <SelectContent>
                        {vehicles.map((vehicle) => (
                          <SelectItem key={vehicle.id} value={vehicle.id}>
                            {vehicle.plate_number} - {vehicle.brand}{" "}
                            {vehicle.model}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="mechanic">Mekanik</Label>
                    <Input
                      name="mechanic"
                      placeholder="Nama mekanik"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select name="status" defaultValue="pending">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Menunggu</SelectItem>
                        <SelectItem value="in-progress">Dikerjakan</SelectItem>
                        <SelectItem value="completed">Selesai</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="complaint">Keluhan</Label>
                    <Textarea
                      name="complaint"
                      placeholder="Deskripsi keluhan kendaraan"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cost">Biaya Estimasi</Label>
                    <Input
                      name="cost"
                      type="number"
                      placeholder="0"
                      min="0"
                      step="1000"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit">Simpan</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="all">Semua</TabsTrigger>
          <TabsTrigger value="pending">Menunggu</TabsTrigger>
          <TabsTrigger value="in-progress">Dikerjakan</TabsTrigger>
          <TabsTrigger value="completed">Selesai</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-0">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Pelanggan</TableHead>
                    <TableHead>Kendaraan</TableHead>
                    <TableHead>Plat Nomor</TableHead>
                    <TableHead>Keluhan</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Biaya</TableHead>
                    <TableHead>Mekanik</TableHead>
                    <TableHead>Invoice</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center py-10">
                        Memuat data...
                      </TableCell>
                    </TableRow>
                  ) : filteredServices.length > 0 ? (
                    filteredServices.map((service) => (
                      <TableRow key={service.id}>
                        <TableCell>
                          {new Date(service.service_date).toLocaleDateString(
                            "id-ID",
                          )}
                        </TableCell>
                        <TableCell>{service.customer_name}</TableCell>
                        <TableCell>
                          {service.vehicle_brand} {service.vehicle_model}
                        </TableCell>
                        <TableCell>{service.plate_number}</TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {service.complaint}
                        </TableCell>
                        <TableCell>{getStatusBadge(service.status)}</TableCell>
                        <TableCell>
                          Rp {service.cost.toLocaleString("id-ID")}
                        </TableCell>
                        <TableCell>{service.mechanic}</TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {getInvoiceStatusBadge(service)}
                            {service.has_invoice && service.invoice_total && (
                              <div className="text-xs text-gray-500">
                                Rp{" "}
                                {(service.paid_amount || 0).toLocaleString(
                                  "id-ID",
                                )}{" "}
                                / Rp{" "}
                                {service.invoice_total.toLocaleString("id-ID")}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1 flex-wrap">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedService(service);
                                setIsEditDialogOpen(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteService(service.id)}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                            {service.status === "completed" && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleCreateInvoice(service)}
                                  disabled={service.has_invoice}
                                  title={
                                    service.has_invoice
                                      ? "Invoice sudah dibuat"
                                      : "Buat Invoice"
                                  }
                                >
                                  <FileText className="h-4 w-4 text-blue-500" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleProcessPayment(service)}
                                  disabled={
                                    !service.has_invoice ||
                                    (service.paid_amount || 0) >=
                                      (service.invoice_total || 0)
                                  }
                                  title={
                                    !service.has_invoice
                                      ? "Buat invoice terlebih dahulu"
                                      : "Proses Pembayaran"
                                  }
                                >
                                  <CreditCard className="h-4 w-4 text-green-500" />
                                </Button>
                              </>
                            )}
                            <Select
                              value={service.status}
                              onValueChange={(value) =>
                                handleStatusChange(service.id, value as any)
                              }
                            >
                              <SelectTrigger className="w-[130px] h-8">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">
                                  Menunggu
                                </SelectItem>
                                <SelectItem value="in-progress">
                                  Dikerjakan
                                </SelectItem>
                                <SelectItem value="completed">
                                  Selesai
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center py-10">
                        Tidak ada data servis yang ditemukan
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Service Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Servis</DialogTitle>
            <DialogDescription>Ubah detail servis kendaraan.</DialogDescription>
          </DialogHeader>
          {selectedService && (
            <form onSubmit={handleEditService}>
              <div className="grid grid-cols-2 gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-customer_id">Pelanggan</Label>
                  <Select
                    name="customer_id"
                    defaultValue={selectedService.customer_id || ""}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-vehicle_id">Kendaraan</Label>
                  <Select
                    name="vehicle_id"
                    defaultValue={selectedService.vehicle_id || ""}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {vehicles.map((vehicle) => (
                        <SelectItem key={vehicle.id} value={vehicle.id}>
                          {vehicle.plate_number} - {vehicle.brand}{" "}
                          {vehicle.model}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-mechanic">Mekanik</Label>
                  <Input
                    name="mechanic"
                    defaultValue={selectedService.mechanic || ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-status">Status</Label>
                  <Select name="status" defaultValue={selectedService.status}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Menunggu</SelectItem>
                      <SelectItem value="in-progress">Dikerjakan</SelectItem>
                      <SelectItem value="completed">Selesai</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="edit-complaint">Keluhan</Label>
                  <Textarea
                    name="complaint"
                    defaultValue={selectedService.complaint}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-cost">Biaya</Label>
                  <Input
                    name="cost"
                    type="number"
                    defaultValue={selectedService.cost}
                    min="0"
                    step="1000"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">Simpan Perubahan</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Service Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Menunggu
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Clock className="h-5 w-5 text-yellow-500 mr-2" />
              <p className="text-2xl font-bold">
                {services.filter((s) => s.status === "pending").length}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Sedang Dikerjakan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-blue-500 mr-2" />
              <p className="text-2xl font-bold">
                {services.filter((s) => s.status === "in-progress").length}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Selesai
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
              <p className="text-2xl font-bold">
                {services.filter((s) => s.status === "completed").length}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Create Invoice Dialog */}
      <CreateInvoice
        isOpen={isCreateInvoiceOpen}
        onClose={() => {
          setIsCreateInvoiceOpen(false);
          setSelectedServiceForInvoice(null);
        }}
        selectedService={selectedServiceForInvoice}
        onInvoiceCreated={() => {
          fetchServices();
        }}
      />

      {/* Process Payment Dialog */}
      <ProcessPayment
        isOpen={isProcessPaymentOpen}
        onClose={() => {
          setIsProcessPaymentOpen(false);
          setSelectedInvoiceForPayment(null);
        }}
        selectedInvoice={selectedInvoiceForPayment}
        onPaymentProcessed={() => {
          fetchServices();
        }}
      />
    </div>
  );
};

export default ServiceManagement;
