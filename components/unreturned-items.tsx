"use client";

import { useEffect, useState } from "react";
import { getUnreturnedItems, markRequestItemReturned } from "@/lib/actions/property.action";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface UnreturnedItem {
  id: string;
  request_batch_id: string;
  property_name: string;
  quantity: number;
  approved_quantity?: number | null;
  status?: string | null;
  requestor_full_name: string;
  department: string;
  phone_number: string;
  created_at: string;
  return_date: string;
}

export default function UnreturnedItemsTable() {
  const [items, setItems] = useState<UnreturnedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    (async () => {
      try {
        const data = await getUnreturnedItems();
        setItems(data);
      } catch (e: any) {
        toast.error(e.message || "Failed to load unreturned items");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const markReturned = async (id: string) => {
    setMarking(id);
    try {
      await markRequestItemReturned(id);
      setItems((prev) => prev.filter((i) => i.id !== id));
      toast.success("Marked as returned");
    } catch (e: any) {
      toast.error(e.message || "Failed to mark returned");
    } finally {
      setMarking(null);
    }
  };

  const markSelectedReturned = async () => {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    try {
      for (const id of ids) {
        await markRequestItemReturned(id);
      }
      setItems((prev) => prev.filter((i) => !selected.has(i.id)));
      setSelected(new Set());
      toast.success("Selected items marked as returned");
    } catch (e: any) {
      toast.error(e.message || "Failed to mark selected items");
    }
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString();

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Unreturned Items</CardTitle>
            <div className="text-xs text-muted-foreground flex gap-4">
              <span>Total: {items.length}</span>
              <span>
                Overdue: {
                  items.filter((i) => new Date(i.return_date).getTime() < Date.now()).length
                }
              </span>
              <span>Selected: {selected.size}</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-sm">Loading...</div>
          ) : items.length === 0 ? (
            <div className="text-sm text-muted-foreground">All items have been returned.</div>
          ) : (
            <div className="overflow-x-auto">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs text-muted-foreground">
                  Tip: select rows to enable bulk actions
                </div>
                <Button size="sm" variant="outline" onClick={markSelectedReturned} disabled={selected.size === 0}>
                  Mark Selected Returned
                </Button>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left">
                    <th className="p-2">
                      <input
                        type="checkbox"
                        checked={selected.size > 0 && selected.size === items.length}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelected(new Set(items.map((i) => i.id)));
                          } else {
                            setSelected(new Set());
                          }
                        }}
                      />
                    </th>
                    <th className="p-2">Requester</th>
                    <th className="p-2">Department</th>
                    <th className="p-2">Phone</th>
                    <th className="p-2">Property</th>
                    <th className="p-2">Qty</th>
                    <th className="p-2">Approved</th>
                    <th className="p-2">Requested</th>
                    <th className="p-2">Expected Return</th>
                    <th className="p-2">Batch</th>
                    <th className="p-2">Status</th>
                    <th className="p-2">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((i) => (
                    <tr key={i.id} className="border-t">
                      <td className="p-2">
                        <input
                          type="checkbox"
                          checked={selected.has(i.id)}
                          onChange={(e) => {
                            setSelected((prev) => {
                              const next = new Set(prev);
                              if (e.target.checked) next.add(i.id);
                              else next.delete(i.id);
                              return next;
                            });
                          }}
                        />
                      </td>
                      <td className="p-2">{i.requestor_full_name}</td>
                      <td className="p-2">{i.department}</td>
                      <td className="p-2">{i.phone_number}</td>
                      <td className="p-2">{i.property_name}</td>
                      <td className="p-2">{i.quantity}</td>
                      <td className="p-2">{i.approved_quantity ?? i.quantity}</td>
                      <td className="p-2">{formatDate(i.created_at)}</td>
                      <td className="p-2">{formatDate(i.return_date)}</td>
                      <td className="p-2 font-mono text-xs">{i.request_batch_id}</td>
                      <td className="p-2">
                        <Badge variant="outline">{i.status || "pending"}</Badge>
                      </td>
                      <td className="p-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => markReturned(i.id)}
                          disabled={marking === i.id}
                        >
                          {marking === i.id ? "Marking..." : "Mark Returned"}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


