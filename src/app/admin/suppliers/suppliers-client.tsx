"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Search, Edit, Power, MoreHorizontal, Eye } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Supplier = {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  note?: string | null;
  isActive: boolean;
  createdAt: string;
};

type Category = {
  id: string;
  name: string;
  price: number;
  supplierId?: string | null;
  supplier?: {
    name: string;
  } | null;
};

export default function SuppliersClient({ initialData }: { initialData: Supplier[] }) {
  const router = useRouter();

  // table state
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [page, setPage] = useState(1);

  // form state (create + edit)
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);

  // category selection state
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [categorySearch, setProductSearch] = useState("");
  const [loadingCategories, setLoadingCategories] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let out = initialData.filter((s) => {
      const hay = `${s.name} ${s.email ?? ""} ${s.phone ?? ""}`.toLowerCase();
      return !q || hay.includes(q);
    });
    if (status !== "all") out = out.filter((s) => (status === "active" ? s.isActive : !s.isActive));
    return out.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [initialData, query, status]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
  const paged = filtered.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  // Filter categories based on search
  const filteredCategories = useMemo(() => {
    const searchTerm = categorySearch.toLowerCase();
    return categories.filter(category => 
      category.name.toLowerCase().includes(searchTerm)
    );
  }, [categories, categorySearch]);

  // Fetch categories when modal opens
  useEffect(() => {
    if (open && categories.length === 0) {
      fetchCategories();
    }
  }, [open]);

  async function fetchCategories() {
    setLoadingCategories(true);
    try {
      const res = await fetch("/api/admin/products");
      const data = await res.json();
      if (res.ok && data.success) {
        setCategories(data.categories);
      }
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    } finally {
      setLoadingCategories(false);
    }
  }

  // actions
  function startCreate() {
    setEditing({
      id: "",
      name: "",
      email: "",
      phone: "",
      address: "",
      note: "",
      isActive: true,
      createdAt: new Date().toISOString(),
    });
    setSelectedCategories([]);
    setProductSearch("");
    setOpen(true);
  }

  async function startEdit(s: Supplier, e: React.MouseEvent) {
    e.stopPropagation();
    setEditing(s);
    setSelectedCategories([]);
    setProductSearch("");
    
    // Fetch current supplier details including associated categories
    try {
      const res = await fetch(`/api/admin/suppliers/${s.id}`);
      const data = await res.json();
      if (res.ok && data.ok && data.data.categories) {
        // Set currently associated categories as selected
        const currentProductIds = data.data.categories.map((p: Category) => p.id);
        setSelectedCategories(currentProductIds);
      }
    } catch (error) {
      console.error("Failed to fetch supplier details:", error);
    }
    
    setOpen(true);
  }

  function toggleProduct(categoryId: string) {
    setSelectedCategories(prev => 
      prev.includes(categoryId) 
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  }

  async function save() {
    if (!editing) return;
    const payload = {
      name: editing.name,
      email: editing.email,
      phone: editing.phone,
      address: editing.address,
      note: editing.note,
      isActive: editing.isActive,
      categoryIds: selectedCategories,
    };

    if (!editing.id) {
      const res = await fetch("/api/admin/suppliers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const j = await res.json();
      if (!res.ok || !j.ok) {
        toast.error(j.error || "Create failed");
        return;
      }
      
      toast.success("Supplier created successfully!", {
        duration: 3000,
        position: "top-center",
      });
      setOpen(false);
      router.refresh();
    } else {
      const res = await fetch(`/api/admin/suppliers/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const j = await res.json();
      if (!res.ok || !j.ok) {
        toast.error(j.error || "Update failed");
        return;
      }
      
      // Show success message
      if (selectedCategories.length > 0) {
        toast.success(
          `${selectedCategories.length} category${selectedCategories.length > 1 ? 's' : ''} successfully associated with ${editing.name}!`,
          {
            duration: 3000,
            position: "top-center",
            icon: "✅",
          }
        );
      } else {
        toast.success("Supplier updated successfully!", {
          duration: 3000,
          position: "top-center",
        });
      }
      
      setOpen(false);
      // Navigate to supplier details page
      router.push(`/admin/suppliers/${editing.id}`);
    }
  }

  async function toggleActive(id: string, currentStatus: boolean, e: React.MouseEvent) {
    e.stopPropagation();
    const res = await fetch(`/api/admin/suppliers/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !currentStatus }),
    });
    const j = await res.json();
    if (!res.ok || !j.ok) {
      toast.error(j.error || "Failed to toggle status");
      return;
    }
    toast.success("Supplier status updated successfully");
    router.refresh();
  }

  function viewDetails(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    router.push(`/admin/suppliers/${id}`);
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="w-full max-w-sm">
          <Input placeholder="Search suppliers" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <Select value={status} onValueChange={(v) => { setPage(1); setStatus(v); }}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>

        <div className="ml-auto flex items-center gap-2">
          <Button onClick={startCreate}>
            <Plus className="h-4 w-4 mr-2" />
            New Supplier
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border-transparent bg-custom-white text-black shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-custom-white">
              <TableHead >Name</TableHead>
              <TableHead >Email</TableHead>
              <TableHead >Phone</TableHead>
              <TableHead >Status</TableHead>
              <TableHead className="text-right  ">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paged.map((s) => {
              const statusBadge = s.isActive ? <Badge>Active</Badge> : <Badge variant="secondary">Inactive</Badge>;
              return (
                <TableRow
                  key={s.id}
                  className="cursor-pointer hover:bg-gray-900/60"
                  onClick={() => router.push(`/admin/suppliers/${s.id}`)}
                >
                  <TableCell>{s.name}</TableCell>
                  <TableCell>{s.email || "—"}</TableCell>
                  <TableCell>{s.phone || "—"}</TableCell>
                  <TableCell>{statusBadge}</TableCell>
                  <TableCell className="items-end justify-end flex">
                    <div className="flex gap-2">
                      {/* Dropdown Menu with ... */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            className="w-24 "
                            variant="ghost"
                            size="icon"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem
                            onClick={(e) => viewDetails(s.id, e)}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            View details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => startEdit(s, e)}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={(e) => toggleActive(s.id, s.isActive, e)}
                          >
                            <Power className="mr-2 h-4 w-4" />
                            {s.isActive ? "Deactivate" : "Activate"}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
            {paged.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-gray-400">
                  No suppliers found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-end gap-2">
        <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
          Prev
        </Button>
        <span className="text-sm text-muted-foreground">{page} / {totalPages}</span>
        <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>
          Next
        </Button>
      </div>

      {/* Modal Form — create + edit */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing?.id ? "Edit Supplier" : "New Supplier"}</DialogTitle>
          </DialogHeader>

          {editing && (
            <div className="space-y-4">
              <div>
                <Label>Name</Label>
                <Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label>Email</Label>
                  <Input value={editing.email || ""} onChange={(e) => setEditing({ ...editing, email: e.target.value })} />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input 
                    type="tel"
                    value={editing.phone || ""} 
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9\s\-\(\)\+]/g, '');
                      setEditing({ ...editing, phone: value });
                    }}
                  />
                </div>
              </div>
              <div>
                <Label>Address</Label>
                <Input value={editing.address || ""} onChange={(e) => setEditing({ ...editing, address: e.target.value })} />
              </div>
              <div >
                <Label>Note</Label>
                <Textarea className="bg-white" value={editing.note || ""} onChange={(e) => setEditing({ ...editing, note: e.target.value })} />
              </div>
              <div className="flex items-center gap-2 pt-1">
                <Switch checked={!!editing.isActive} onCheckedChange={(v) => setEditing({ ...editing, isActive: v })} />
                <Label>Active</Label>
              </div>

              {/* Category Selection Section */}
              <div className="space-y-3 border-t pt-4">
                <div>
                  <Label className="text-base font-medium">Associate Products</Label>
                  <p className="text-sm text-black">Select products to associate with this supplier</p>
                </div>
                
                {/* Category Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search products..."
                    value={categorySearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Category List */}
                <div className="max-h-40 overflow-y-auto bg-white border rounded-md">
                  {loadingCategories ? (
                    <div className="p-4 text-center text-sm text-black">
                      Loading products...
                    </div>
                  ) : filteredCategories.length === 0 ? (
                    <div className="p-4 text-center text-sm text-black">
                      {categorySearch ? "No categories found" : "No categories available"}
                    </div>
                  ) : (
                    filteredCategories.map((category) => {
                      const isSelected = selectedCategories.includes(category.id);
                      
                      return (
                        <div key={category.id} className="flex items-center space-x-3 p-3 hover:bg-custom-orange hover:text-white border-b last:border-b-0">
                          <Checkbox

                            id={`category-${category.id}`}
                            checked={isSelected}
                            onCheckedChange={() => toggleProduct(category.id)}
                          />
                          <div className="flex-1">
                            <div className="font-medium text-sm">{category.name}</div>
                            <div className="text-xs  ">
                              ₱{category.price.toFixed(2)}
                              {isSelected && editing?.id && (
                                <span className="ml-2 text-green-600">
                                  • Will be associated
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Selected Categories Summary */}
                {selectedCategories.length > 0 && (
                  <div className="text-sm">
                    <div className="font-medium text-black mb-2">
                      {selectedCategories.length} product{selectedCategories.length === 1 ? '' : 's'} selected
                    </div>
                    {editing?.id && (
                      <div className="text-xs text-muted-foreground">
                        Changes will be saved when you click "Save changes"
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save}>{editing?.id ? "Save changes" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}