"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { getRequestItemsByBatch, markRequestItemReturned, markRequestItemsReturned, markBatchReturned } from "@/lib/actions/property.action";

interface Item {
  id: string;
  property_name: string;
  quantity: number;
  approved_quantity?: number | null;
  status?: string | null;
}

export default function RequestedPropertyReturns() {
  const [batchId, setBatchId] = useState("");
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [marking, setMarking] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);

  const loadBatch = async () => {
    if (!batchId.trim()) {
      toast.error("Enter a batch ID");
      return;
    }
    setLoading(true);
    try {
      const data = await getRequestItemsByBatch(batchId.trim());
      setItems(data);
      if (!data || data.length === 0) {
        toast.warning("No items found for this batch");
      }
    } catch (e: any) {
      toast.error(e.message || "Failed to load items");
    } finally {
      setLoading(false);
    }
  };

  const markReturned = async (id: string) => {
    setMarking(id);
    try {
      await markRequestItemReturned(id);
      setItems((prev) => prev.map((i) => (i.id === id ? { ...i, status: "returned" } : i)));
      toast.success("Marked as returned");
    } catch (e: any) {
      toast.error(e.message || "Failed to mark returned");
    } finally {
      setMarking(null);
    }
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    setSelected(new Set(items.filter((i) => i.status !== "returned").map((i) => i.id)));
  };

  const clearSelection = () => setSelected(new Set());

  const bulkReturnSelected = async () => {
    const ids = Array.from(selected).filter((id) => {
      const item = items.find((i) => i.id === id);
      return item && item.status !== "returned";
    });
    if (ids.length === 0) {
      toast.error("No selectable items");
      return;
    }
    setBulkLoading(true);
    try {
      const { updated } = await markRequestItemsReturned(ids);
      setItems((prev) => prev.map((i) => (ids.includes(i.id) ? { ...i, status: "returned" } : i)));
      clearSelection();
      toast.success(`Returned ${updated} item(s)`);
    } catch (e: any) {
      toast.error(e.message || "Bulk return failed");
    } finally {
      setBulkLoading(false);
    }
  };

  const bulkReturnAllInBatch = async () => {
    if (!batchId.trim()) return;
    setBulkLoading(true);
    try {
      const { updated } = await markBatchReturned(batchId.trim());
      setItems((prev) => prev.map((i) => ({ ...i, status: "returned" })));
      clearSelection();
      toast.success(`Returned ${updated} item(s) in batch`);
    } catch (e: any) {
      toast.error(e.message || "Batch return failed");
    } finally {
      setBulkLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Property Returns</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input
              placeholder="Enter request batch ID"
              value={batchId}
              onChange={(e) => setBatchId(e.target.value)}
            />
            <Button onClick={loadBatch} disabled={loading}>
              {loading ? "Loading..." : "Load"}
            </Button>
          </div>

          {items.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={selectAll} disabled={bulkLoading}>
                  Select all
                </Button>
                <Button variant="outline" size="sm" onClick={clearSelection} disabled={selected.size === 0 || bulkLoading}>
                  Clear
                </Button>
                <Button size="sm" onClick={bulkReturnSelected} disabled={selected.size === 0 || bulkLoading}>
                  {bulkLoading ? "Returning..." : `Return selected (${selected.size})`}
                </Button>
                <Button size="sm" variant="secondary" onClick={bulkReturnAllInBatch} disabled={bulkLoading}>
                  {bulkLoading ? "Returning..." : "Return entire batch"}
                </Button>
              </div>
              {items.map((item, idx) => (
                <div key={item.id} className="flex items-center justify-between border rounded p-3">
                  <div>
                    <div className="text-sm font-medium">
                      #{idx + 1} {item.property_name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Qty: {item.quantity} | Approved: {item.approved_quantity ?? item.quantity}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selected.has(item.id)}
                      onChange={() => toggleSelect(item.id)}
                      disabled={item.status === "returned" || bulkLoading}
                    />
                    <Badge variant={item.status === "returned" ? "default" : "outline"}>
                      {item.status || "pending"}
                    </Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => markReturned(item.id)}
                      disabled={item.status === "returned" || marking === item.id}
                    >
                      {marking === item.id ? "Marking..." : "Mark Returned"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


