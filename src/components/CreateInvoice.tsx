import React, { useState, useEffect } from "react";
import { FileText, Plus, Trash2, Calculator, Save, Send } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
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
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Badge } from "./ui/badge";
import {
  supabase,
  Service,
  SparePart,
  ServicePartInsert,
} from "../lib/supabase";

interface ServiceWithDetails extends Service {
  customer_name?: string;
  vehicle_brand?: string;
  vehicle_model?: string;
  plate_number?: string;
}

interface InvoiceItem {
  id: string;
  item_type: "service" | "sparepart";
  item_id?: string;
  description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface CreateInvoiceProps {
  isOpen: boolean;
  onClose: () => void;
  selectedService?: ServiceWithDetails | null;
  onInvoiceCreated?: () => void;
}

const CreateInvoice: React.FC<CreateInvoiceProps> = ({
  isOpen = false,
  onClose = () => {},
  selectedService = null,
  onInvoiceCreated = () => {},
}) => {
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([]);
  const [spareParts, setSpareParts] = useState<SparePart[]>([]);
  const [loading, setLoading] = useState(false);
  const [subtotal, setSubtotal] = useState(0);
  const [taxRate, setTaxRate] = useState(10); // 10% tax
  const [discountAmount, setDiscountAmount] = useState(0);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (isOpen) {
      fetchSpareParts();
      initializeInvoiceItems();
    }
  }, [isOpen, selectedService]);

  useEffect(() => {
    calculateSubtotal();
  }, [invoiceItems]);

  const fetchSpareParts = async () => {
    try {
      const { data, error } = await supabase
        .from("spare_parts")
        .select("*")
        .order("name");

      if (error) throw error;
      setSpareParts(data || []);
    } catch (error) {
      console.error("Error fetching spare parts:", error);
    }
  };

  const initializeInvoiceItems = () => {
    if (selectedService) {
      const serviceItem: InvoiceItem = {
        id: "service-" + Date.now(),
        item_type: "service",
        item_id: selectedService.id,
        description: `Servis ${selectedService.vehicle_brand} ${selectedService.vehicle_model} - ${selectedService.complaint}`,
        quantity: 1,
        unit_price: selectedService.cost,
        total_price: selectedService.cost,
      };
      setInvoiceItems([serviceItem]);
    } else {
      setInvoiceItems([]);
    }
  };

  const calculateSubtotal = () => {
    const total = invoiceItems.reduce((sum, item) => sum + item.total_price, 0);
    setSubtotal(total);
  };

  const addInvoiceItem = () => {
    const newItem: InvoiceItem = {
      id: "item-" + Date.now(),
      item_type: "sparepart",
      description: "",
      quantity: 1,
      unit_price: 0,
      total_price: 0,
    };
    setInvoiceItems([...invoiceItems, newItem]);
  };

  const updateInvoiceItem = (
    id: string,
    field: keyof InvoiceItem,
    value: any,
  ) => {
    setInvoiceItems((items) =>
      items.map((item) => {
        if (item.id === id) {
          const updatedItem = { ...item, [field]: value };
          if (field === "quantity" || field === "unit_price") {
            updatedItem.total_price =
              updatedItem.quantity * updatedItem.unit_price;
          }
          return updatedItem;
        }
        return item;
      }),
    );
  };

  const removeInvoiceItem = (id: string) => {
    setInvoiceItems((items) => items.filter((item) => item.id !== id));
  };

  const selectSparePart = (itemId: string, sparePartId: string) => {
    const sparePart = spareParts.find((sp) => sp.id === sparePartId);
    if (sparePart) {
      updateInvoiceItem(itemId, "item_id", sparePartId);
      updateInvoiceItem(itemId, "description", sparePart.name);
      updateInvoiceItem(
        itemId,
        "unit_price",
        sparePart.sale_price || sparePart.price || 0,
      );
    }
  };

  const calculateTax = () => {
    return (subtotal * taxRate) / 100;
  };

  const calculateTotal = () => {
    return subtotal + calculateTax() - discountAmount;
  };

  const generateInvoiceNumber = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const time = String(now.getTime()).slice(-4);
    return `INV-${year}${month}${day}-${time}`;
  };

  const handleSaveInvoice = async (status: "draft" | "issued") => {
    if (!selectedService || invoiceItems.length === 0) {
      alert("Pilih servis dan tambahkan minimal satu item");
      return;
    }

    setLoading(true);
    try {
      const invoiceNumber = generateInvoiceNumber();
      const totalAmount = calculateTotal();

      // Create invoice
      const { data: invoice, error: invoiceError } = await supabase
        .from("invoices")
        .insert({
          invoice_number: invoiceNumber,
          service_id: selectedService.id,
          customer_id: selectedService.customer_id,
          vehicle_id: selectedService.vehicle_id,
          subtotal,
          tax_amount: calculateTax(),
          discount_amount: discountAmount,
          total_amount: totalAmount,
          status,
          due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split("T")[0], // 30 days from now
          notes,
        })
        .select()
        .single();

      if (invoiceError) throw invoiceError;

      // Create invoice items
      const invoiceItemsData = invoiceItems.map((item) => ({
        invoice_id: invoice.id,
        item_type: item.item_type,
        item_id: item.item_id,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price,
      }));

      const { error: itemsError } = await supabase
        .from("invoice_items")
        .insert(invoiceItemsData);

      if (itemsError) throw itemsError;

      // Insert spare parts into service_parts table
      const sparePartItems = invoiceItems.filter(
        (item) => item.item_type === "sparepart" && item.item_id,
      );

      if (sparePartItems.length > 0) {
        const servicePartsData: ServicePartInsert[] = sparePartItems.map(
          (item) => ({
            service_id: selectedService.id,
            spare_part_id: item.item_id!,
            quantity: item.quantity,
            unit_price: item.unit_price,
          }),
        );

        const { error: servicePartsError } = await supabase
          .from("service_parts")
          .insert(servicePartsData);

        if (servicePartsError) throw servicePartsError;

        // Update spare parts stock (reduce stock for used parts)
        for (const item of sparePartItems) {
          const { error: stockError } = await supabase.rpc(
            "update_spare_part_stock",
            {
              spare_part_id: item.item_id!,
              quantity_used: item.quantity,
            },
          );

          // If RPC doesn't exist, update manually
          if (stockError) {
            const { data: currentStock } = await supabase
              .from("spare_parts")
              .select("stock")
              .eq("id", item.item_id!)
              .single();

            if (currentStock) {
              await supabase
                .from("spare_parts")
                .update({ stock: currentStock.stock - item.quantity })
                .eq("id", item.item_id!);
            }
          }

          // Create stock movement record
          await supabase.from("stock_movements").insert({
            spare_part_id: item.item_id!,
            movement_type: "out",
            quantity: item.quantity,
            notes: `Digunakan untuk servis ${selectedService.customer_name} - Invoice ${invoiceNumber}`,
          });
        }
      }

      // Create financial transaction
      await supabase.from("financial_transactions").insert({
        service_id: selectedService.id,
        transaction_type: "income",
        amount: totalAmount,
        category: "service_payment",
        description: `Invoice ${invoiceNumber} - ${selectedService.customer_name}`,
      });

      onInvoiceCreated();
      onClose();
      alert(
        `Invoice ${invoiceNumber} berhasil ${status === "draft" ? "disimpan" : "diterbitkan"}!`,
      );
    } catch (error) {
      console.error("Error creating invoice:", error);
      alert("Gagal membuat invoice");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto bg-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Buat Invoice
          </DialogTitle>
          <DialogDescription>
            {selectedService
              ? `Buat invoice untuk servis ${selectedService.customer_name} - ${selectedService.plate_number}`
              : "Buat invoice baru"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Service Information */}
          {selectedService && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Informasi Servis</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p>
                      <strong>Pelanggan:</strong>{" "}
                      {selectedService.customer_name}
                    </p>
                    <p>
                      <strong>Kendaraan:</strong>{" "}
                      {selectedService.vehicle_brand}{" "}
                      {selectedService.vehicle_model}
                    </p>
                  </div>
                  <div>
                    <p>
                      <strong>Plat Nomor:</strong>{" "}
                      {selectedService.plate_number}
                    </p>
                    <p>
                      <strong>Keluhan:</strong> {selectedService.complaint}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Invoice Items */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <CardTitle className="text-sm">Item Invoice</CardTitle>
                <Button size="sm" onClick={addInvoiceItem}>
                  <Plus className="h-4 w-4 mr-1" />
                  Tambah Item
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Deskripsi</TableHead>
                    <TableHead className="w-20">Qty</TableHead>
                    <TableHead className="w-32">Harga Satuan</TableHead>
                    <TableHead className="w-32">Total</TableHead>
                    <TableHead className="w-16">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoiceItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        {item.item_type === "sparepart" ? (
                          <Select
                            value={item.item_id || ""}
                            onValueChange={(value) =>
                              selectSparePart(item.id, value)
                            }
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Pilih sparepart" />
                            </SelectTrigger>
                            <SelectContent>
                              {spareParts.map((part) => (
                                <SelectItem key={part.id} value={part.id}>
                                  {part.name} - Rp{" "}
                                  {(
                                    part.sale_price ||
                                    part.price ||
                                    0
                                  ).toLocaleString("id-ID")}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <span className="text-sm">{item.description}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) =>
                            updateInvoiceItem(
                              item.id,
                              "quantity",
                              parseInt(e.target.value) || 1,
                            )
                          }
                          className="w-full"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="0"
                          step="1000"
                          value={item.unit_price}
                          onChange={(e) =>
                            updateInvoiceItem(
                              item.id,
                              "unit_price",
                              parseFloat(e.target.value) || 0,
                            )
                          }
                          className="w-full"
                          disabled={item.item_type === "service"}
                        />
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">
                          Rp {item.total_price.toLocaleString("id-ID")}
                        </span>
                      </TableCell>
                      <TableCell>
                        {item.item_type !== "service" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeInvoiceItem(item.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Invoice Summary */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Ringkasan Invoice</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="tax-rate">Pajak (%)</Label>
                    <Input
                      id="tax-rate"
                      type="number"
                      min="0"
                      max="100"
                      value={taxRate}
                      onChange={(e) =>
                        setTaxRate(parseFloat(e.target.value) || 0)
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="discount">Diskon (Rp)</Label>
                    <Input
                      id="discount"
                      type="number"
                      min="0"
                      step="1000"
                      value={discountAmount}
                      onChange={(e) =>
                        setDiscountAmount(parseFloat(e.target.value) || 0)
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="notes">Catatan</Label>
                    <Textarea
                      id="notes"
                      placeholder="Catatan tambahan..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>Rp {subtotal.toLocaleString("id-ID")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Pajak ({taxRate}%):</span>
                    <span>Rp {calculateTax().toLocaleString("id-ID")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Diskon:</span>
                    <span>- Rp {discountAmount.toLocaleString("id-ID")}</span>
                  </div>
                  <div className="border-t pt-2">
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total:</span>
                      <span>Rp {calculateTotal().toLocaleString("id-ID")}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Batal
          </Button>
          <Button
            variant="outline"
            onClick={() => handleSaveInvoice("draft")}
            disabled={loading}
          >
            <Save className="h-4 w-4 mr-2" />
            Simpan Draft
          </Button>
          <Button
            onClick={() => handleSaveInvoice("issued")}
            disabled={loading}
          >
            <Send className="h-4 w-4 mr-2" />
            Terbitkan Invoice
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateInvoice;
