"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { MoreHorizontal, Lock, Ban, UserX } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface UserRow {
  id: string;
  primaryEmail: string | null;
  displayName: string | null;
  signedUpAt: string | Date | null;
  lastActiveAt?: string | Date | null;
  authMethod?: string | null;
  status?: "ACTIVE" | "DEACTIVATED";
  blockedAt?: string | Date | null;
}

export default function ClientUserTable({ users }: { users: UserRow[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [authFilter, setAuthFilter] = useState<string>("all");
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const text = query.trim().toLowerCase();
    let out = users.filter((u) => {
      const hay = `${u.primaryEmail ?? ""} ${u.displayName ?? ""} ${
        u.id
      }`.toLowerCase();
      return !text || hay.includes(text);
    });
    if (status !== "all")
      out = out.filter((u) => (u.status ?? "ACTIVE").toLowerCase() === status);
    if (authFilter !== "all")
      out = out.filter(
        (u) => (u.authMethod ?? "").toLowerCase() === authFilter
      );
    return out.sort((a, b) => {
      const ad = new Date(a.signedUpAt ?? 0).getTime();
      const bd = new Date(b.signedUpAt ?? 0).getTime();
      return bd - ad;
    });
  }, [users, query, status, authFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
  const paged = filtered.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  async function toggleDeactivate(id: string) {
    const res = await fetch(`/api/admin/users/deactivate/${id}`, { method: "POST" });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      alert(`Failed to toggle deactivate${j?.error ? ": " + j.error : ""}`);
      return;
    }
    location.reload();
  }


  async function toggleBlock(id: string) {
  const res = await fetch(`/api/admin/users/block/${id}`, { method: "POST" });
  if (!res.ok) {
    const j = await res.json().catch(() => ({}));
    alert(`Failed to toggle block${j?.error ? ": " + j.error : ""}`);
    return;
  }
  location.reload();
}

async function deleteUser(id: string) {
  if (!confirm("Delete this user and their data? This cannot be undone.")) return;
  const res = await fetch(`/api/admin/users/delete/${id}`, { method: "DELETE" });
  if (!res.ok) {
    const j = await res.json().catch(() => ({}));
    alert(`Failed to delete user${j?.error ? ": " + j.error : ""}`);
    return;
  }
  location.reload();
}


  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="w-full max-w-sm">
          <Input
            placeholder="Search table"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <Select
          value={status}
          onValueChange={(v) => {
            setPage(1);
            setStatus(v);
          }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="deactivated">Deactivated</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={authFilter}
          onValueChange={(v) => {
            setPage(1);
            setAuthFilter(v);
          }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Auth" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Methods</SelectItem>
            <SelectItem value="password">Password</SelectItem>
            <SelectItem value="google">Google</SelectItem>
          </SelectContent>
        </Select>
        <div className="ml-auto flex items-center gap-2 text-sm text-white">
          <span>Rows per page</span>
          <Select
            value={String(rowsPerPage)}
            onValueChange={(v) => {
              setRowsPerPage(Number(v));
              setPage(1);
            }}
          >
            <SelectTrigger className="w-[90px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border bg-custom-white text-black shadow-sm">
        <Table>
          <TableHeader className="text-black">
            <TableRow>
              <TableHead className="w-[56px]">Avatar</TableHead>
              <TableHead>Display Name</TableHead>
              <TableHead>Primary Email</TableHead>
              <TableHead>Last Active</TableHead>
              <TableHead>Auth Method</TableHead>
              <TableHead>Signed Up At</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paged.map((u) => {
              const letter = (u.primaryEmail?.[0] ?? "?").toUpperCase();
              const blocked = !!u.blockedAt;
              const statusBadge = blocked ? (
                <Badge variant="destructive">Blocked</Badge>
              ) : u.status === "DEACTIVATED" ? (
                <Badge variant="secondary">Deactivated</Badge>
              ) : (
                <Badge>Active</Badge>
              );

              return (
                <TableRow
                  key={u.id}
                  className="cursor-pointer hover:bg-muted/40"
                  onClick={() => router.push(`/admin/users/${u.id}`)}
                >
                  <TableCell>
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-sm font-semibold uppercase">
                      {letter}
                    </div>
                  </TableCell>
                  <TableCell>{u.displayName ?? "–"}</TableCell>
                  <TableCell>{u.primaryEmail ?? "–"}</TableCell>
                  <TableCell>
                    {u.lastActiveAt
                      ? new Date(u.lastActiveAt).toLocaleString()
                      : "–"}
                  </TableCell>
                  <TableCell>{u.authMethod ?? "–"}</TableCell>
                  <TableCell>
                    {u.signedUpAt
                      ? new Date(u.signedUpAt as any).toLocaleString()
                      : "–"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {statusBadge}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Manage</DropdownMenuLabel>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleDeactivate(u.id);
                            }}
                          >
                            <Lock className="mr-2 h-4 w-4" />
                            {u.status === "DEACTIVATED"
                              ? "Activate"
                              : "Deactivate"}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleBlock(u.id);
                            }}
                          >
                            <Ban className="mr-2 h-4 w-4" />
                            {u.blockedAt ? "Unblock" : "Block"}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/admin/users/${u.id}`);
                            }}
                          >
                            <UserX className="mr-2 h-4 w-4" /> View details
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-end gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
        >
          Prev
        </Button>
        <span className="text-sm text-muted-foreground">
          {page} / {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={page >= totalPages}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
