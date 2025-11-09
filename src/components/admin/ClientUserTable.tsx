"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Power, Ban, Eye, MoreHorizontal } from "lucide-react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDate } from "@/lib/utils";

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

  async function toggleDeactivate(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    const res = await fetch(`/api/admin/users/deactivate/${id}`, { method: "POST" });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      alert(`Failed to toggle deactivate${j?.error ? ": " + j.error : ""}`);
      return;
    }
    location.reload();
  }

  async function toggleBlock(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    const res = await fetch(`/api/admin/users/block/${id}`, { method: "POST" });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      alert(`Failed to toggle block${j?.error ? ": " + j.error : ""}`);
      return;
    }
    location.reload();
  }

  function viewDetails(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    router.push(`/admin/users/${id}`);
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap  items-center gap-3">
        <div className="w-full bg-white max-w-sm rounded-md overflow-hidden">
          <Input
            placeholder="Search users..."
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
        <div className="ml-auto flex items-center gap-2 text-sm">
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
      <div className="overflow-hidden rounded-xl border-transparent bg-custom-white text-black shadow-sm">
        <Table>
          <TableHeader className="text-black">
            <TableRow>
              <TableHead className="w-[56px] ">Avatar</TableHead>
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
              const isDeactivated = u.status === "DEACTIVATED";
              
              const statusBadge = blocked ? (
                <Badge variant="destructive">Blocked</Badge>
              ) : isDeactivated ? (
                <Badge variant="secondary">Deactivated</Badge>
              ) : (
                <Badge>Active</Badge>
              );

              return (
                <TableRow
                  key={u.id}
                  className="cursor-pointer hover:bg-gray-900/60"
                  onClick={() => router.push(`/admin/users/${u.id}`)}
                >
                  <TableCell>
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-custom-green text-white text-sm font-semibold uppercase">
                      {letter}
                    </div>
                  </TableCell>
                  <TableCell>{u.displayName ?? "–"}</TableCell>
                  <TableCell>{u.primaryEmail ?? "–"}</TableCell>
                  <TableCell>
                    {u.lastActiveAt ? formatDate(u.lastActiveAt) : "–"}
                  </TableCell>
                  <TableCell>{u.authMethod ?? "–"}</TableCell>
                  <TableCell>
                    {u.signedUpAt ? formatDate(u.signedUpAt as any) : "–"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {statusBadge}
                      
                      {/* Dropdown Menu with ... */}
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
                          <DropdownMenuItem
                            onClick={(e) => viewDetails(u.id, e)}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            View details
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={(e) => toggleDeactivate(u.id, e)}
                          >
                            <Power className="mr-2 h-4 w-4" />
                            {isDeactivated ? "Activate" : "Deactivate"}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => toggleBlock(u.id, e)}
                          >
                            <Ban className="mr-2 h-4 w-4" />
                            {blocked ? "Unblock" : "Block"}
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
                <TableCell colSpan={7} className="py-8 text-center text-gray-400">
                  No users found
                </TableCell>
              </TableRow>
            )}
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