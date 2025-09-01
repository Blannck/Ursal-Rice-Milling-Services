"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"; // + modal
import { Label } from "@/components/ui/label"; // + labels
import { Textarea } from "@/components/ui/textarea"; // + textarea
import { Switch } from "@/components/ui/switch"; // + switch (or swap for a checkbox if you don't have it)
import { MoreHorizontal, Edit3, Trash2, Plus } from "lucide-react";

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

export default function SuppliersClient({ initialData }: { initialData: Supplier[] }) {
  const router = useRouter();

  // table state
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [page, setPage] = useState(1);

  // form state (create + edit)
  const [open, setOpen] = useState(false);            // + modal open
  const [editing, setEditing] = useState<Supplier | null>(null); // + current row

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
    setOpen(true);
  }

  function startEdit(s: Supplier) {
    setEditing(s);
    setOpen(true);
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
    };

    if (!editing.id) {
      const res = await fetch("/api/admin/suppliers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const j = await res.json();
      if (!res.ok || !j.ok) return alert(j.error || "Create failed");
    } else {
      const res = await fetch(`/api/admin/suppliers/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const j = await res.json();
      if (!res.ok || !j.ok) return alert(j.error || "Update failed");
    }
    setOpen(false);
    router.refresh(); // quick refetch
  }

  async function remove(id: string) {
    if (!confirm("Delete this supplier?")) return;
    const res = await fetch(`/api/admin/suppliers/${id}`, { method: "DELETE" });
    const j = await res.json().catch(() => ({}));
    if (!res.ok || !j.ok) return alert(j.error || "Delete failed");
    router.refresh();
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
            <SelectItem value="all">Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>

        <div className="ml-auto flex items-center gap-2">
          {/* + New Supplier button */}
          <Button onClick={startCreate}>
            <Plus className="h-4 w-4 mr-2" />
            New Supplier
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border bg-black text-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-900">
              <TableHead className="text-white">Name</TableHead>
              <TableHead className="text-white">Email</TableHead>
              <TableHead className="text-white">Phone</TableHead>
              <TableHead className="text-white">Status</TableHead>
              <TableHead className="text-white text-right">Actions</TableHead>
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
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Manage</DropdownMenuLabel>
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); startEdit(s); }}>
                            <Edit3 className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); remove(s.id); }}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
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
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle>{editing?.id ? "Edit Supplier" : "New Supplier"}</DialogTitle>
          </DialogHeader>

          {editing && (
            <div className="space-y-3">
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
                  <Input value={editing.phone || ""} onChange={(e) => setEditing({ ...editing, phone: e.target.value })} />
                </div>
              </div>
              <div>
                <Label>Address</Label>
                <Input value={editing.address || ""} onChange={(e) => setEditing({ ...editing, address: e.target.value })} />
              </div>
              <div>
                <Label>Note</Label>
                <Textarea value={editing.note || ""} onChange={(e) => setEditing({ ...editing, note: e.target.value })} />
              </div>
              <div className="flex items-center gap-2 pt-1">
                <Switch checked={!!editing.isActive} onCheckedChange={(v) => setEditing({ ...editing, isActive: v })} />
                <Label>Active</Label>
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
