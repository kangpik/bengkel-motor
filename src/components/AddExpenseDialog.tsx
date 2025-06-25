import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Plus } from "lucide-react";
import { addExpense, EXPENSE_CATEGORIES } from "../lib/supabase";

interface AddExpenseDialogProps {
  onExpenseAdded?: () => void;
  open?: boolean;
}

const AddExpenseDialog: React.FC<AddExpenseDialogProps> = ({
  onExpenseAdded,
  open = false,
}) => {
  const [isOpen, setIsOpen] = useState(open);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    amount: "",
    category: "",
    description: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.amount || !formData.category) return;

    setLoading(true);
    try {
      await addExpense({
        amount: parseFloat(formData.amount),
        category: formData.category,
        description: formData.description || undefined,
      });

      // Reset form
      setFormData({
        amount: "",
        category: "",
        description: "",
      });

      setIsOpen(false);
      onExpenseAdded?.();
    } catch (error) {
      console.error("Error adding expense:", error);
      alert("Gagal menambahkan pengeluaran. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  const getAllCategories = () => {
    const categories: string[] = [];
    Object.values(EXPENSE_CATEGORIES).forEach((category) => {
      category.subcategories.forEach((subcategory) => {
        categories.push(subcategory);
      });
    });
    return categories;
  };

  return (
    <div className="bg-background">
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Tambah Pengeluaran
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Tambah Pengeluaran Baru</DialogTitle>
            <DialogDescription>
              Catat pengeluaran operasional dan biaya lainnya untuk bengkel.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Jumlah (Rp)</Label>
              <Input
                id="amount"
                type="number"
                placeholder="Masukkan jumlah pengeluaran"
                value={formData.amount}
                onChange={(e) =>
                  setFormData({ ...formData, amount: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Kategori</Label>
              <Select
                value={formData.category}
                onValueChange={(value) =>
                  setFormData({ ...formData, category: value })
                }
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih kategori pengeluaran" />
                </SelectTrigger>
                <SelectContent>
                  <div className="px-2 py-1 text-sm font-semibold text-muted-foreground">
                    {EXPENSE_CATEGORIES.OPERATIONAL.label}
                  </div>
                  {EXPENSE_CATEGORIES.OPERATIONAL.subcategories.map(
                    (subcategory) => (
                      <SelectItem key={subcategory} value={subcategory}>
                        {subcategory}
                      </SelectItem>
                    ),
                  )}
                  <div className="px-2 py-1 text-sm font-semibold text-muted-foreground mt-2">
                    {EXPENSE_CATEGORIES.OTHER.label}
                  </div>
                  {EXPENSE_CATEGORIES.OTHER.subcategories.map((subcategory) => (
                    <SelectItem key={subcategory} value={subcategory}>
                      {subcategory}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Keterangan (Opsional)</Label>
              <Textarea
                id="description"
                placeholder="Tambahkan keterangan pengeluaran"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={3}
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
                disabled={loading}
              >
                Batal
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Menyimpan..." : "Simpan"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AddExpenseDialog;
