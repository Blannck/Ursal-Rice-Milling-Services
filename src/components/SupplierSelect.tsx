"use client";

import { useEffect, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Supplier = {
  id: string;
  name: string;
  email?: string | null;
  isActive?: boolean | null;
};

export default function SupplierSelect({
  value,
  onChange,
  placeholder = "Select supplier",
  disabled = false,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
}) {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/admin/suppliers");
        const data = await res.json();
        // Accept either { ok, data } or { success, suppliers }
        const list: Supplier[] =
          data?.data?.filter?.((s: Supplier) => s.isActive !== false) ??
          data?.suppliers?.filter?.((s: Supplier) => s.isActive !== false) ??
          data?.data ??
          data?.suppliers ??
          [];
        if (active) setSuppliers(list);
      } catch (e) {
        console.error("Failed to load suppliers", e);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  return (
    <Select value={value} onValueChange={onChange} disabled={disabled || loading}>
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {suppliers.length === 0 && <div className="p-2 text-sm text-gray-500">No suppliers</div>}
        {suppliers.map((s) => (
          <SelectItem key={s.id} value={s.id}>
            <div className="flex flex-col">
              <span className="font-medium">{s.name}</span>
              {s.email ? <span className="text-xs text-gray-500">{s.email}</span> : null}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
