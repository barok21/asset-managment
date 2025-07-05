"use client"

import { useEffect, useState } from "react"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import {
  getRequestedProperties,
  updateRequestStatus,
} from "@/lib/actions/property.action"

interface RequestedProperty {
  id: string
  requestor_full_name: string
  department: string
  property_name: string
  quantity: number
  special_requirment?: string
  request_batch_id: string
  status: "pending" | "approved" | "rejected"
}

// Grouped format
type GroupedRequest = {
  batchId: string
  requestor_full_name: string
  department: string
  special_requirment?: string
  status: "pending" | "approved" | "rejected"
  properties: {
    id: string
    property_name: string
    quantity: number
    status: "pending" | "approved" | "rejected"
  }[]
}

export default function RequestedPropertyList() {
  const [groupedRequests, setGroupedRequests] = useState<GroupedRequest[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const all = await getRequestedProperties()

        // Group by request_batch_id
        const grouped = all.reduce((acc, item: RequestedProperty) => {
          const key = item.request_batch_id
          if (!acc[key]) {
            acc[key] = {
              batchId: key,
              requestor_full_name: item.requestor_full_name,
              department: item.department,
              special_requirment: item.special_requirment,
              status: item.status,
              properties: [],
            }
          }

          acc[key].properties.push({
            id: item.id,
            property_name: item.property_name,
            quantity: item.quantity,
            status: item.status,
          })

          return acc
        }, {} as Record<string, GroupedRequest>)

        setGroupedRequests(Object.values(grouped))
      } catch (error) {
        console.error(error)
        toast.error("Failed to fetch requests.")
      }
    }

    fetchData()
  }, [])

  const handleBatchStatusUpdate = async (batchId: string, status: "approved" | "rejected") => {
    try {
      await updateRequestStatus(batchId, status)
      setGroupedRequests((prev) =>
        prev.map((r) =>
          r.batchId === batchId ? { ...r, status, properties: r.properties.map(p => ({ ...p, status })) } : r
        )
      )
      toast.success(`Batch ${status}.`)
    } catch (error) {
      console.error(error)
      toast.error("Failed to update batch status.")
    }
  }

  return (
    <div className="grid gap-6">
      {groupedRequests.map((group) => (
        <Card key={group.batchId} className="shadow-xl border">
          <CardHeader>
            <CardTitle>
              {group.requestor_full_name} ({group.department})
            </CardTitle>
            <CardDescription>
              Batch ID: <span className="text-xs font-mono">{group.batchId}</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {group.special_requirment && (
              <p><strong>Special Requirement:</strong> {group.special_requirment}</p>
            )}

            <div className="overflow-x-auto border rounded-md">
              <table className="w-full text-sm">
                <thead className="bg-muted/40">
                  <tr>
                    <th className="px-3 py-2 text-left">Property</th>
                    <th className="px-3 py-2 text-center">Quantity</th>
                    <th className="px-3 py-2 text-center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {group.properties.map((p) => (
                    <tr key={p.id} className="border-t">
                      <td className="px-3 py-2">{p.property_name}</td>
                      <td className="px-3 py-2 text-center">{p.quantity}</td>
                      <td className="px-3 py-2 text-center capitalize">{p.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end gap-4 mt-4">
              <Button
                variant="success"
                disabled={group.status === "approved"}
                onClick={() => handleBatchStatusUpdate(group.batchId, "approved")}
              >
                Approve All
              </Button>
              <Button
                variant="destructive"
                disabled={group.status === "rejected"}
                onClick={() => handleBatchStatusUpdate(group.batchId, "rejected")}
              >
                Reject All
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
