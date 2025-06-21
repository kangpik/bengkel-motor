import React, { useState, useEffect } from "react";
import { CreditCard, Banknote, Smartphone, Receipt, Check } from "lucide-react";
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
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Badge } from "./ui/badge";
import { supabase } from "../lib/supabase";

interface Invoice {
  id: string;
  invoice_number: string;
  total_amount: number;
  status: string;
  customer_name?: string;
  vehicle_info?: string;
  issue_date: string;
  due_date: string;
  paid_amount?: number;
}

interface ProcessPaymentProps {
  isOpen: boolean;
  onClose: () => void;
  selectedInvoice?: Invoice | null;
  onPaymentProcessed?: () => void;
}

const ProcessPayment: React.FC<ProcessPaymentProps> = ({
  isOpen = false,
  onClose = () => {},
  selectedInvoice = null,
  onPaymentProcessed = () => {},
}) => {
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedInvoice && isOpen) {
      const remainingAmount =
        selectedInvoice.total_amount - (selectedInvoice.paid_amount || 0);
      setPaymentAmount(remainingAmount);
      setPaymentMethod("");
      setReferenceNumber("");
      setNotes("");
    }
  }, [selectedInvoice, isOpen]);

  const generatePaymentNumber = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const time = String(now.getTime()).slice(-4);
    return `PAY-${year}${month}${day}-${time}`;
  };

  const handleProcessPayment = async () => {
    if (!selectedInvoice || !paymentMethod || paymentAmount <= 0) {
      alert("Lengkapi semua data pembayaran");
      return;
    }

    const remainingAmount =
      selectedInvoice.total_amount - (selectedInvoice.paid_amount || 0);
    if (paymentAmount > remainingAmount) {
      alert("Jumlah pembayaran melebihi sisa tagihan");
      return;
    }

    setLoading(true);
    try {
      const paymentNumber = generatePaymentNumber();

      // Create payment record
      const { error: paymentError } = await supabase.from("payments").insert({
        invoice_id: selectedInvoice.id,
        payment_number: paymentNumber,
        amount: paymentAmount,
        payment_method: paymentMethod,
        reference_number: referenceNumber || null,
        notes: notes || null,
        status: "completed",
      });

      if (paymentError) throw paymentError;

      // Calculate new paid amount
      const newPaidAmount = (selectedInvoice.paid_amount || 0) + paymentAmount;
      const isFullyPaid = newPaidAmount >= selectedInvoice.total_amount;

      // Update invoice status if fully paid
      if (isFullyPaid) {
        const { error: invoiceError } = await supabase
          .from("invoices")
          .update({ status: "paid" })
          .eq("id", selectedInvoice.id);

        if (invoiceError) throw invoiceError;
      }

      // Create financial transaction
      await supabase.from("financial_transactions").insert({
        transaction_type: "income",
        amount: paymentAmount,
        category: "payment_received",
        description: `Pembayaran ${paymentNumber} - Invoice ${selectedInvoice.invoice_number}`,
      });

      onPaymentProcessed();
      onClose();
      alert(`Pembayaran ${paymentNumber} berhasil diproses!`);
    } catch (error) {
      console.error("Error processing payment:", error);
      alert("Gagal memproses pembayaran");
    } finally {
      setLoading(false);
    }
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case "cash":
        return <Banknote className="h-4 w-4" />;
      case "card":
        return <CreditCard className="h-4 w-4" />;
      case "transfer":
        return <Smartphone className="h-4 w-4" />;
      default:
        return <Receipt className="h-4 w-4" />;
    }
  };

  const remainingAmount = selectedInvoice
    ? selectedInvoice.total_amount - (selectedInvoice.paid_amount || 0)
    : 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] bg-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Proses Pembayaran
          </DialogTitle>
          <DialogDescription>
            {selectedInvoice
              ? `Proses pembayaran untuk Invoice ${selectedInvoice.invoice_number}`
              : "Proses pembayaran invoice"}
          </DialogDescription>
        </DialogHeader>

        {selectedInvoice && (
          <div className="space-y-6">
            {/* Invoice Information */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Informasi Invoice</CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Nomor Invoice:</span>
                  <span className="font-medium">
                    {selectedInvoice.invoice_number}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Total Invoice:</span>
                  <span className="font-medium">
                    Rp {selectedInvoice.total_amount.toLocaleString("id-ID")}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Sudah Dibayar:</span>
                  <span className="font-medium">
                    Rp{" "}
                    {(selectedInvoice.paid_amount || 0).toLocaleString("id-ID")}
                  </span>
                </div>
                <div className="flex justify-between text-sm border-t pt-2">
                  <span>Sisa Tagihan:</span>
                  <span className="font-bold text-red-600">
                    Rp {remainingAmount.toLocaleString("id-ID")}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Status:</span>
                  <Badge
                    variant="outline"
                    className={
                      selectedInvoice.status === "paid"
                        ? "bg-green-100 text-green-800"
                        : selectedInvoice.status === "partial"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                    }
                  >
                    {selectedInvoice.status === "paid"
                      ? "Lunas"
                      : selectedInvoice.status === "partial"
                        ? "Sebagian"
                        : "Belum Bayar"}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Payment Form */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="payment-amount">Jumlah Pembayaran</Label>
                <Input
                  id="payment-amount"
                  type="number"
                  min="1"
                  max={remainingAmount}
                  step="1000"
                  value={paymentAmount}
                  onChange={(e) =>
                    setPaymentAmount(parseFloat(e.target.value) || 0)
                  }
                  placeholder="Masukkan jumlah pembayaran"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Maksimal: Rp {remainingAmount.toLocaleString("id-ID")}
                </p>
              </div>

              <div>
                <Label htmlFor="payment-method">Metode Pembayaran</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih metode pembayaran" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">
                      <div className="flex items-center gap-2">
                        <Banknote className="h-4 w-4" />
                        Tunai
                      </div>
                    </SelectItem>
                    <SelectItem value="card">
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        Kartu Debit/Kredit
                      </div>
                    </SelectItem>
                    <SelectItem value="transfer">
                      <div className="flex items-center gap-2">
                        <Smartphone className="h-4 w-4" />
                        Transfer Bank
                      </div>
                    </SelectItem>
                    <SelectItem value="ewallet">
                      <div className="flex items-center gap-2">
                        <Smartphone className="h-4 w-4" />
                        E-Wallet
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {(paymentMethod === "transfer" ||
                paymentMethod === "ewallet" ||
                paymentMethod === "card") && (
                <div>
                  <Label htmlFor="reference-number">Nomor Referensi</Label>
                  <Input
                    id="reference-number"
                    value={referenceNumber}
                    onChange={(e) => setReferenceNumber(e.target.value)}
                    placeholder="Nomor transaksi/referensi"
                  />
                </div>
              )}

              <div>
                <Label htmlFor="payment-notes">Catatan</Label>
                <Textarea
                  id="payment-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Catatan pembayaran (opsional)"
                  rows={3}
                />
              </div>
            </div>

            {/* Payment Summary */}
            <Card className="bg-gray-50">
              <CardContent className="pt-4">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Jumlah yang akan dibayar:</span>
                  <span className="text-xl font-bold text-green-600">
                    Rp {paymentAmount.toLocaleString("id-ID")}
                  </span>
                </div>
                {paymentAmount === remainingAmount && (
                  <p className="text-sm text-green-600 mt-2 flex items-center gap-1">
                    <Check className="h-4 w-4" />
                    Invoice akan lunas setelah pembayaran ini
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Batal
          </Button>
          <Button
            onClick={handleProcessPayment}
            disabled={loading || !paymentMethod}
          >
            <CreditCard className="h-4 w-4 mr-2" />
            Proses Pembayaran
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ProcessPayment;
