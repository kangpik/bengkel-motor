import React, { useState, useEffect } from "react";
import { Search, Plus, Edit, Trash2, AlertCircle } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { supabase, SparePart } from "../lib/supabase";

const InventoryManagement = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isUpdateStockDialogOpen, setIsUpdateStockDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<SparePart | null>(null);
  const [updateType, setUpdateType] = useState<"add" | "subtract">("add");
  const [spareParts, setSpareParts] = useState<SparePart[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSpareParts();
  }, []);

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
    } finally {
      setLoading(false);
    }
  };

  // Filter spare parts based on search query
  const filteredSpareParts = spareParts.filter(
    (part) =>
      part.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      part.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (part.supplier &&
        part.supplier.toLowerCase().includes(searchQuery.toLowerCase())),
  );

  // Get low stock items
  const lowStockItems = spareParts.filter(
    (part) => part.stock < part.min_stock,
  );

  const handleAddSparepart = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);

    try {
      const { error } = await supabase.from("spare_parts").insert({
        name: formData.get("name") as string,
        category: formData.get("category") as string,
        price: parseFloat(formData.get("price") as string),
        stock: parseInt(formData.get("stock") as string),
        min_stock: parseInt(formData.get("minStock") as string),
        supplier: formData.get("supplier") as string,
      });

      if (error) throw error;

      await fetchSpareParts();
      setIsAddDialogOpen(false);
    } catch (error) {
      console.error("Error adding spare part:", error);
    }
  };

  const handleUpdateStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;

    const formData = new FormData(e.target as HTMLFormElement);
    const quantity = parseInt(formData.get("stockAmount") as string);
    const notes = formData.get("notes") as string;

    try {
      const newStock =
        updateType === "add"
          ? selectedItem.stock + quantity
          : selectedItem.stock - quantity;

      if (newStock < 0) {
        alert("Stok tidak boleh kurang dari 0");
        return;
      }

      // Update stock in spare_parts table
      const { error: updateError } = await supabase
        .from("spare_parts")
        .update({ stock: newStock })
        .eq("id", selectedItem.id);

      if (updateError) throw updateError;

      // Record stock movement
      const { error: movementError } = await supabase
        .from("stock_movements")
        .insert({
          spare_part_id: selectedItem.id,
          movement_type: updateType === "add" ? "in" : "out",
          quantity: quantity,
          notes: notes,
        });

      if (movementError) throw movementError;

      await fetchSpareParts();
      setIsUpdateStockDialogOpen(false);
    } catch (error) {
      console.error("Error updating stock:", error);
    }
  };

  const handleDeleteSparepart = async (id: string) => {
    try {
      const { error } = await supabase
        .from("spare_parts")
        .delete()
        .eq("id", id);

      if (error) throw error;

      await fetchSpareParts();
    } catch (error) {
      console.error("Error deleting spare part:", error);
    }
  };

  const openUpdateStockDialog = (
    item: SparePartItem,
    type: "add" | "subtract",
  ) => {
    setSelectedItem(item);
    setUpdateType(type);
    setIsUpdateStockDialogOpen(true);
  };

  return (
    <div className="bg-background p-6 w-full">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Inventaris Sparepart</h1>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus size={16} />
              Tambah Sparepart
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tambah Sparepart Baru</DialogTitle>
              <DialogDescription>
                Masukkan informasi sparepart baru ke dalam sistem.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddSparepart}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    Nama
                  </Label>
                  <Input
                    name="name"
                    className="col-span-3"
                    placeholder="Nama sparepart"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="category" className="text-right">
                    Kategori
                  </Label>
                  <Select name="category" required>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Pilih kategori" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pelumas">Pelumas</SelectItem>
                      <SelectItem value="Filter">Filter</SelectItem>
                      <SelectItem value="Kelistrikan">Kelistrikan</SelectItem>
                      <SelectItem value="Rem">Rem</SelectItem>
                      <SelectItem value="Transmisi">Transmisi</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="price" className="text-right">
                    Harga
                  </Label>
                  <Input
                    name="price"
                    type="number"
                    className="col-span-3"
                    placeholder="Harga sparepart"
                    min="0"
                    step="1000"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="stock" className="text-right">
                    Stok
                  </Label>
                  <Input
                    name="stock"
                    type="number"
                    className="col-span-3"
                    placeholder="Jumlah stok"
                    min="0"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="minStock" className="text-right">
                    Stok Minimum
                  </Label>
                  <Input
                    name="minStock"
                    type="number"
                    className="col-span-3"
                    placeholder="Stok minimum"
                    min="0"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="supplier" className="text-right">
                    Supplier
                  </Label>
                  <Input
                    name="supplier"
                    className="col-span-3"
                    placeholder="Nama supplier"
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

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="all">Semua Sparepart</TabsTrigger>
          <TabsTrigger value="low-stock">
            Stok Menipis
            {lowStockItems.length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {lowStockItems.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Daftar Sparepart</CardTitle>
                <div className="relative w-64">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Cari sparepart..."
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              <CardDescription>
                Kelola inventaris sparepart bengkel Anda
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nama</TableHead>
                      <TableHead>Kategori</TableHead>
                      <TableHead>Harga</TableHead>
                      <TableHead>Stok</TableHead>
                      <TableHead>Supplier</TableHead>
                      <TableHead>Terakhir Diperbarui</TableHead>
                      <TableHead>Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-4">
                          Memuat data...
                        </TableCell>
                      </TableRow>
                    ) : filteredSpareParts.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-4">
                          Tidak ada data sparepart
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredSpareParts.map((part) => (
                        <TableRow key={part.id}>
                          <TableCell>{part.name}</TableCell>
                          <TableCell>{part.category}</TableCell>
                          <TableCell>
                            Rp {part.price.toLocaleString("id-ID")}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {part.stock < part.min_stock ? (
                                <Badge variant="destructive">
                                  {part.stock}
                                </Badge>
                              ) : (
                                <Badge variant="secondary">{part.stock}</Badge>
                              )}
                              {part.stock < part.min_stock && (
                                <AlertCircle
                                  size={16}
                                  className="text-destructive"
                                />
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{part.supplier || "-"}</TableCell>
                          <TableCell>
                            {new Date(part.updated_at).toLocaleDateString(
                              "id-ID",
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  openUpdateStockDialog(part, "add")
                                }
                              >
                                +
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  openUpdateStockDialog(part, "subtract")
                                }
                              >
                                -
                              </Button>
                              <Button variant="ghost" size="sm">
                                <Edit size={16} />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteSparepart(part.id)}
                              >
                                <Trash2
                                  size={16}
                                  className="text-destructive"
                                />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="low-stock">
          <Card>
            <CardHeader>
              <CardTitle>Sparepart dengan Stok Menipis</CardTitle>
              <CardDescription>
                Sparepart yang perlu segera ditambah stoknya
              </CardDescription>
            </CardHeader>
            <CardContent>
              {lowStockItems.length === 0 ? (
                <Alert>
                  <AlertTitle>Semua stok dalam kondisi baik</AlertTitle>
                  <AlertDescription>
                    Tidak ada sparepart yang stoknya di bawah batas minimum.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nama</TableHead>
                        <TableHead>Kategori</TableHead>
                        <TableHead>Stok Saat Ini</TableHead>
                        <TableHead>Stok Minimum</TableHead>
                        <TableHead>Supplier</TableHead>
                        <TableHead>Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {lowStockItems.map((part) => (
                        <TableRow key={part.id}>
                          <TableCell>{part.name}</TableCell>
                          <TableCell>{part.category}</TableCell>
                          <TableCell>
                            <Badge variant="destructive">{part.stock}</Badge>
                          </TableCell>
                          <TableCell>{part.min_stock}</TableCell>
                          <TableCell>{part.supplier || "-"}</TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openUpdateStockDialog(part, "add")}
                            >
                              Tambah Stok
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Update Stock Dialog */}
      <Dialog
        open={isUpdateStockDialogOpen}
        onOpenChange={setIsUpdateStockDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {updateType === "add" ? "Tambah Stok" : "Kurangi Stok"} -{" "}
              {selectedItem?.name}
            </DialogTitle>
            <DialogDescription>
              {updateType === "add"
                ? "Masukkan jumlah stok yang ingin ditambahkan."
                : "Masukkan jumlah stok yang ingin dikurangi."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateStock}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="stockAmount" className="text-right">
                  Jumlah
                </Label>
                <Input
                  id="stockAmount"
                  type="number"
                  min="1"
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="notes" className="text-right">
                  Catatan
                </Label>
                <Input
                  id="notes"
                  className="col-span-3"
                  placeholder="Alasan perubahan stok (opsional)"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">
                {updateType === "add" ? "Tambah" : "Kurangi"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InventoryManagement;
