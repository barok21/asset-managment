"use client"
import {
  useState
} from "react"
import {
  toast
} from "sonner"
import {
  useForm
} from "react-hook-form"
import {
  zodResolver
} from "@hookform/resolvers/zod"
import {
  z
} from "zod"
import {
  cn
} from "@/lib/utils"
import {
  Button
} from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Input
} from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { createPropert } from "@/lib/actions/property.action"
import { redirect } from "next/navigation"
import { Label } from "./ui/label"
import { Plus, Trash2 } from "lucide-react"

const formSchema = z.object({
  name: z.string().min(1),
  quantity: z.coerce.number(),
  initial_price: z.coerce.number(),
  category: z.string()
});

const resourceTypes = [
  { id: "sound_system", name: "Sound System", category: "Audio/Visual" },
  { id: "projector", name: "Projector", category: "Audio/Visual" },
  { id: "microphone", name: "Microphone", category: "Audio/Visual" },
  { id: "chairs", name: "Chairs", category: "Furniture" },
  { id: "tables", name: "Tables", category: "Furniture" },
  { id: "classroom", name: "Classroom", category: "Space" },
  { id: "hall", name: "Main Hall", category: "Space" },
  { id: "kitchen", name: "Kitchen Facilities", category: "Space" },
  { id: "books", name: "Books/Materials", category: "Educational" },
  { id: "markers", name: "Markers/Supplies", category: "Educational" },
  { id: "decorations", name: "Decorations", category: "Event" },
  { id: "candles", name: "Candles", category: "Liturgical" },
]



  
export default function MyForm() {

  const [selectedResources, setSelectedResources] = useState<
    Array<{
      id: string
      type: string
      quantity: number
      notes: string
      status: "pending"
    }>
  >([])

 const [newResource, setNewResource] = useState({
    type: "",
    quantity: 1,
    notes: "",
  })

 const addResource = () => {
    if (!newResource.type) {
      alert("Please select a resource type")
      return
    }

    const resource = {
      id: Date.now().toString(),
      ...newResource,
      status: "pending" as const,
    }

    // Add new resource at the beginning of the array
    setSelectedResources([resource, ...selectedResources])

    // Reset the form
    setNewResource({
      type: "",
      quantity: 1,
      notes: "",
    })
  }

 const removeResource = (id: string) => {
     setSelectedResources(selectedResources.filter((resource) => resource.id !== id))
   }
 
   const updateResource = (id: string, field: string, value: string | number) => {
     const updated = selectedResources.map((resource) =>
       resource.id === id ? { ...resource, [field]: value } : resource,
     )
     setSelectedResources(updated)
   }
 
   const getResourceName = (resourceId: string) => {
     const resource = resourceTypes.find((r) => r.id === resourceId)
     return resource ? `${resource.name} (${resource.category})` : resourceId
   }
 
   const handleSubmit = (e: React.FormEvent) => {
     e.preventDefault()
 
     if (selectedResources.length === 0) {
       alert("Please add at least one resource to your request")
       return
     }
 
     const request = {
       id: Date.now().toString(),
       ...formData,
       resources: selectedResources,
       status: "pending",
       submittedAt: new Date().toISOString(),
       // requesterId: user?.id,
       priority: "normal",
     }
 
     // Save to localStorage (in a real app, this would be sent to a database)
     const existingRequests = JSON.parse(localStorage.getItem("resource_requests") || "[]")
     existingRequests.push(request)
     localStorage.setItem("resource_requests", JSON.stringify(existingRequests))
 
     // Download as JSON file for record keeping
     const dataStr = JSON.stringify(request, null, 2)
     const dataUri = "data:application/json;charset=utf-8," + encodeURIComponent(dataStr)
     // const exportFileDefaultName = `resource_request_${formData.department}_${formData.requestDate}.json`
 
     const linkElement = document.createElement("a")
     linkElement.setAttribute("href", dataUri)
     // linkElement.setAttribute("download", exportFileDefaultName)
     linkElement.click()
 
     alert("Resource request submitted successfully!")
     
   }


  
   const [formData, setFormData] = useState({
    // requesterName: user?.name || "",
    // department: user?.department || "",
    contactInfo: "",
    requestDate: new Date().toISOString().split("T")[0],
    eventDate: "",
    eventTime: "",
    duration: "",
    purpose: "",
    specialRequirements: "",
    setupRequirements: "",
    returnDate: "",
    alternativeDate: "",
  })

  const form = useForm < z.infer < typeof formSchema >> ({
    resolver: zodResolver(formSchema),

  })

  
const onSubmit = async (values: z.infer<typeof formSchema>) => {
  try {
    const property = await createPropert(values);

    if (property) {
      toast.success(`Successfully added: ${values.name}`);
    } else {
      toast.error("Failed to create the property.");
    }
  } catch (error) {
    toast.error("Something went wrong.");
    console.error(error);
  }
};

  return (
    <div className="aspect-video w-full flex-1 rounded-lg border border-dashed p-5">
    
    <div className="space-y-4">
                    <h3 className="text-lg font-semibold border-b pb-2">Add Resources</h3>
    
                    {/* Add New Resource Form */}
                    <div className="border rounded-lg p-4 bg-muted/30">
                      <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
                        <div className="md:col-span-2">
                          <Label className="text-sm">Resource Type *</Label>
                          <Select
                            value={newResource.type}
                            onValueChange={(value) => setNewResource((prev) => ({ ...prev, type: value }))}
                          >
                            <SelectTrigger className="h-9">
                              <SelectValue placeholder="Select resource" />
                            </SelectTrigger>
                            <SelectContent>
                              {resourceTypes.map((resourceType) => (
                                <SelectItem key={resourceType.id} value={resourceType.id}>
                                  {resourceType.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
    
                        <div>
                          <Label className="text-sm">Quantity *</Label>
                          <Input
                            type="number"
                            min="1"
                            value={newResource.quantity}
                            onChange={(e) =>
                              setNewResource((prev) => ({ ...prev, quantity: Number.parseInt(e.target.value) || 1 }))
                            }
                            className="h-9"
                          />
                        </div>
    
                        <div>
                          <Label className="text-sm">Notes</Label>
                          <Input
                            value={newResource.notes}
                            onChange={(e) => setNewResource((prev) => ({ ...prev, notes: e.target.value }))}
                            placeholder="Optional..."
                            className="h-9"
                          />
                        </div>
    
                        <div>
                          <Button type="button" onClick={addResource} className="h-9 w-full">
                            <Plus className="w-4 h-4 mr-1" />
                            Add
                          </Button>
                        </div>
                      </div>
                    </div>
    
                    {/* Resources Table */}
                    {selectedResources.length > 0 && (
                      <div className="border rounded-lg overflow-hidden">
                        <table className="w-full">
                          <thead className="bg-muted/50">
                            <tr>
                              <th className="text-left p-3 font-medium text-sm">Resource</th>
                              <th className="text-left p-3 font-medium text-sm w-24">Qty</th>
                              <th className="text-left p-3 font-medium text-sm">Notes</th>
                              <th className="text-left p-3 font-medium text-sm w-20">Remove</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedResources.map((resource) => (
                              <tr key={resource.id} className="border-t hover:bg-muted/30">
                                <td className="p-3">
                                  <div className="font-medium text-sm">{getResourceName(resource.type)}</div>
                                </td>
                                <td className="p-3">
                                  <Input
                                    type="number"
                                    min="1"
                                    value={resource.quantity}
                                    onChange={(e) =>
                                      updateResource(resource.id, "quantity", Number.parseInt(e.target.value) || 1)
                                    }
                                    className="w-16 h-8 text-center text-sm"
                                  />
                                </td>
                                <td className="p-3">
                                  <Input
                                    value={resource.notes}
                                    onChange={(e) => updateResource(resource.id, "notes", e.target.value)}
                                    placeholder="Optional notes..."
                                    className="h-8 text-sm"
                                  />
                                </td>
                                <td className="p-3">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => removeResource(resource.id)}
                                    className="h-8 w-8 p-0 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
    
                    {selectedResources.length === 0 && (
                      <div className="text-center py-6 text-muted-foreground border rounded-lg bg-muted/20">
                        <p className="text-sm">No resources added yet. Use the form above to add resources.</p>
                      </div>
                    )}
                  </div>
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 max-w-3xl mx-auto py-10">
        
        <div className="grid grid-cols-12 gap-4">
          
          <div className="col-span-6">
            
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Property Name</FormLabel>
              <FormControl>
                <Input 
                placeholder="Property name"
                {...field} />
              </FormControl>
              
              <FormMessage />
            </FormItem>
          )}
        />
          </div>
          
          <div className="col-span-6">
            
        <FormField
          control={form.control}
          name="quantity"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Quantity</FormLabel>
              <FormControl>
                <Input 
                placeholder="Write an number"
                {...field} />
              </FormControl>
              
              <FormMessage />
            </FormItem>
          )}
        />
          </div>
          
        </div>
        
        <FormField
          control={form.control}
          name="initial_price"
          render={({ field }) => (
            <FormItem>
              <FormLabel>initial price</FormLabel>
              <FormControl>
                <Input 
                placeholder="price"
                {...field}
                 />
              </FormControl>
              
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="selcet a category" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="m@example.com">m@example.com</SelectItem>
                  <SelectItem value="m@google.com">m@google.com</SelectItem>
                  <SelectItem value="m@support.com">m@support.com</SelectItem>
                </SelectContent>
              </Select>
                
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Submit</Button>
      </form>
    </Form>
    </div>
  )
}


      <ContextMenu>
              <ContextMenuTrigger asChild>
                <div className="border rounded-md p-2 cursor-context-menu">
                  {field.value || "Right click to select..."}
                </div>
              </ContextMenuTrigger>

              <ContextMenuContent className="w-[300px] p-2">
                <Command>
                  <CommandInput placeholder="Search property..." />
                  <CommandList>
                    <CommandEmpty>No property found.</CommandEmpty>
                    <CommandGroup>
                      {propertyOptions.map((item) => (
                        <CommandItem
                          key={item}
                          value={item}
                          onSelect={() => field.onChange(item)}
                        >
                          {item}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </ContextMenuContent>
            </ContextMenu>

            <FormMessage />
          </FormItem>
        )}
      />



      "use client"
      
      import { useEffect, useState } from "react"
      import {
        updateApprovedQuantity,
        fetchGroupedRequestedPropertiesWithUsage,
        updateRequestItemStatus,
      } from "@/lib/actions/property.action"
      import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
      import { Button } from "@/components/ui/button"
      import { Input } from "@/components/ui/input"
      import { toast } from "sonner"
      import { Badge } from "@/components/ui/badge"
      import { Separator } from "@/components/ui/separator"
      import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
      import {
        CheckCircle,
        XCircle,
        Clock,
        User,
        Building,
        AlertTriangle,
        Loader2,
        Package,
        Eye,
        Calendar,
      } from "lucide-react"
      import { cn } from "@/lib/utils"
      
      interface PropertyItem {
        id: string
        property_name: string
        quantity: number
        approved_quantity?: number
        status?: "approved" | "rejected" | "pending"
        usedInOtherDept: string[]
      }
      
      interface RequestGroup {
        request_batch_id: string
        requestor_full_name: string
        department: string
        special_requirment?: string
        status?: "approved" | "rejected" | "pending" | "partial"
        created_at: string
        properties: PropertyItem[]
      }
      
      export default function RequestedPropertyAdminCards() {
        const [requests, setRequests] = useState<RequestGroup[]>([])
        const [loading, setLoading] = useState(true)
        const [processingItems, setProcessingItems] = useState<Set<string>>(new Set())
        const [selectedRequest, setSelectedRequest] = useState<RequestGroup | null>(null)
        const [isDialogOpen, setIsDialogOpen] = useState(false)
      
        useEffect(() => {
          const load = async () => {
            try {
              setLoading(true)
              const data = await fetchGroupedRequestedPropertiesWithUsage()
              data.sort(
                (a: RequestGroup, b: RequestGroup) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
              )
              // Calculate overall status for each request
              const processedData = data.map((request: RequestGroup) => ({
                ...request,
                status: calculateOverallStatus(request.properties),
              }))
              setRequests(processedData)
            } catch (error) {
              toast.error("Failed to load property requests")
              console.error(error)
            } finally {
              setLoading(false)
            }
          }
          load()
        }, [])
      
        const calculateOverallStatus = (properties: PropertyItem[]): "approved" | "rejected" | "pending" | "partial" => {
          const approvedCount = properties.filter((p) => p.status === "approved").length
          const rejectedCount = properties.filter((p) => p.status === "rejected").length
          const pendingCount = properties.filter((p) => !p.status || p.status === "pending").length
      
          if (pendingCount > 0) return "pending"
          if (approvedCount > 0 && rejectedCount > 0) return "partial"
          if (approvedCount === properties.length) return "approved"
          if (rejectedCount === properties.length) return "rejected"
          return "pending"
        }
      
        const updateRequestStatus = (requestId: string, newStatus: string) => {
          setRequests((prev) => prev.map((r) => (r.request_batch_id === requestId ? { ...r, status: newStatus as any } : r)))
        }
      
        const handleQuantityChange = async (id: string, quantity: number, requestId: string) => {
          if (quantity < 0) {
            toast.error("Quantity cannot be negative")
            return
          }
      
          try {
            await updateApprovedQuantity(id, quantity)
            toast.success("Approved quantity updated")
          } catch (err) {
            toast.error("Failed to update quantity")
            console.error(err)
          }
        }
      
        const handleItemStatusChange = async (itemId: string, status: "approved" | "rejected", groupId: string) => {
          setProcessingItems((prev) => new Set(prev).add(itemId))
      
          try {
            await updateRequestItemStatus(itemId, status)
            toast.success(`Property ${status}`)
      
            setRequests((prev) =>
              prev.map((g) => {
                if (g.request_batch_id === groupId) {
                  const updatedProperties = g.properties.map((p) => (p.id === itemId ? { ...p, status } : p))
                  const newOverallStatus = calculateOverallStatus(updatedProperties)
                  return {
                    ...g,
                    properties: updatedProperties,
                    status: newOverallStatus,
                  }
                }
                return g
              }),
            )
      
            // Update selected request if it's the same one
            if (selectedRequest?.request_batch_id === groupId) {
              setSelectedRequest((prev) => {
                if (!prev) return null
                const updatedProperties = prev.properties.map((p) => (p.id === itemId ? { ...p, status } : p))
                return {
                  ...prev,
                  properties: updatedProperties,
                  status: calculateOverallStatus(updatedProperties),
                }
              })
            }
          } catch (err) {
            toast.error(`Failed to ${status} item`)
            console.error(err)
          } finally {
            setProcessingItems((prev) => {
              const newSet = new Set(prev)
              newSet.delete(itemId)
              return newSet
            })
          }
        }
      
        const handleBatchStatusChange = async (batchId: string, status: "approved" | "rejected") => {
          try {
            await updateRequestStatus(batchId, status)
            toast.success(`Request batch ${status}`)
            setRequests((prev) => prev.map((r) => (r.request_batch_id === batchId ? { ...r, status } : r)))
          } catch (err) {
            toast.error("Failed to update request status")
            console.error(err)
          }
        }
      
        const getStatusIcon = (status?: string) => {
          switch (status) {
            case "approved":
              return <CheckCircle className="h-4 w-4 text-green-600" />
            case "rejected":
              return <XCircle className="h-4 w-4 text-red-600" />
            case "partial":
              return <AlertTriangle className="h-4 w-4 text-orange-600" />
            default:
              return <Clock className="h-4 w-4 text-yellow-600" />
          }
        }
      
        const getStatusVariant = (status?: string) => {
          switch (status) {
            case "approved":
              return "default" as const
            case "rejected":
              return "destructive" as const
            case "partial":
              return "secondary" as const
            default:
              return "outline" as const
          }
        }
      
        const getStatusColor = (status?: string) => {
          switch (status) {
            case "approved":
              return "text-green-600 bg-green-50 border-green-200"
            case "rejected":
              return "text-red-600 bg-red-50 border-red-200"
            case "partial":
              return "text-orange-600 bg-orange-50 border-orange-200"
            default:
              return "text-yellow-600 bg-yellow-50 border-yellow-200"
          }
        }
      
        const formatDate = (dateString: string) => {
          return new Date(dateString).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })
        }
      
        if (loading) {
          return (
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="flex items-center gap-2">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span>Loading property requests...</span>
              </div>
            </div>
          )
        }
      
        if (requests.length === 0) {
          return (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
              <Package className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Property Requests</h3>
              <p className="text-muted-foreground">There are no property requests to review at this time.</p>
            </div>
          )
        }
      
        const [latestRequest, ...otherRequests] = requests
      
        const PropertyDetailView = ({ request }: { request: RequestGroup }) => (
          <div className="space-y-4">
            {request.special_requirment && (
              <div className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">Special Requirement</p>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">{request.special_requirment}</p>
                </div>
              </div>
            )}
      
            <div className="space-y-3">
              {request.properties.map((item, idx) => (
                <div
                  key={item.id}
                  className={cn(
                    "border rounded-lg p-4 space-y-3 transition-colors",
                    item.status === "approved" && "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800",
                    item.status === "rejected" && "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800",
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <p className="font-medium text-sm">
                        #{idx + 1} {item.property_name}
                      </p>
                      <p className="text-xs text-muted-foreground">Requested: {item.quantity} units</p>
                      {item.usedInOtherDept.length > 0 && (
                        <div className="flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3 text-amber-500" />
                          <p className="text-xs text-amber-600 dark:text-amber-400">
                            Used in: {item.usedInOtherDept.join(", ")}
                          </p>
                        </div>
                      )}
                    </div>
                    <Badge variant={getStatusVariant(item.status)} className="text-xs">
                      {item.status || "pending"}
                    </Badge>
                  </div>
      
                  <div className="flex items-end gap-2">
                    <div className="flex-1">
                      <label className="text-xs text-muted-foreground block mb-1">Approved Quantity</label>
                      <Input
                        type="number"
                        min="0"
                        defaultValue={item.approved_quantity ?? item.quantity}
                        className="h-8 text-sm"
                        onBlur={(e) => {
                          const value = Number.parseInt(e.target.value)
                          if (!isNaN(value)) {
                            handleQuantityChange(item.id, value, request.request_batch_id)
                          }
                        }}
                        disabled={item.status === "rejected"}
                      />
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 px-2 text-xs bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
                        disabled={item.status === "approved" || processingItems.has(item.id)}
                        onClick={() => handleItemStatusChange(item.id, "approved", request.request_batch_id)}
                      >
                        {processingItems.has(item.id) ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <CheckCircle className="h-3 w-3" />
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 px-2 text-xs bg-red-50 hover:bg-red-100 text-red-700 border-red-200"
                        disabled={item.status === "rejected" || processingItems.has(item.id)}
                        onClick={() => handleItemStatusChange(item.id, "rejected", request.request_batch_id)}
                      >
                        {processingItems.has(item.id) ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <XCircle className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
      
            <Separator />
      
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                size="sm"
                disabled={request.status === "rejected"}
                onClick={() => handleBatchStatusChange(request.request_batch_id, "rejected")}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <XCircle className="h-4 w-4 mr-1" />
                Reject All
              </Button>
              <Button
                size="sm"
                disabled={request.status === "approved"}
                onClick={() => handleBatchStatusChange(request.request_batch_id, "approved")}
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Approve All
              </Button>
            </div>
          </div>
        )
      
        return (
          <div className="space-y-6 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold">Property Requests</h1>
                <p className="text-muted-foreground">Review and manage property requests from departments</p>
              </div>
              <Badge variant="outline" className="text-sm">
                {requests.length} request{requests.length !== 1 ? "s" : ""}
              </Badge>
            </div>
      
            {/* Latest Request - Large Card */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Latest Request
              </h2>
              <Card className={cn("shadow-lg border-2", getStatusColor(latestRequest.status))}>
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <CardTitle className="text-xl flex items-center gap-2">
                        <User className="h-5 w-5" />
                        {latestRequest.requestor_full_name}
                      </CardTitle>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Building className="h-4 w-4" />
                          {latestRequest.department}
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          {formatDate(latestRequest.created_at)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(latestRequest.status)}
                      <Badge variant={getStatusVariant(latestRequest.status)} className="text-sm">
                        {latestRequest.status || "pending"}
                      </Badge>
                    </div>
                  </div>
      
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                      {latestRequest.properties.filter((p) => p.status === "approved").length} approved
                    </span>
                    <span className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-red-500 rounded-full" />
                      {latestRequest.properties.filter((p) => p.status === "rejected").length} rejected
                    </span>
                    <span className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                      {latestRequest.properties.filter((p) => !p.status || p.status === "pending").length} pending
                    </span>
                  </div>
                </CardHeader>
      
                <CardContent>
                  <PropertyDetailView request={latestRequest} />
                </CardContent>
              </Card>
            </div>
      
            {/* Other Requests - Mini Cards */}
            {otherRequests.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold mb-4">Previous Requests</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {otherRequests.map((request) => (
                    <Dialog
                      key={request.request_batch_id}
                      open={isDialogOpen && selectedRequest?.request_batch_id === request.request_batch_id}
                      onOpenChange={(open) => {
                        setIsDialogOpen(open)
                        if (!open) setSelectedRequest(null)
                      }}
                    >
                      <DialogTrigger asChild>
                        <Card
                          className={cn(
                            "cursor-pointer hover:shadow-md transition-all duration-200 hover:scale-[1.02] border",
                            getStatusColor(request.status),
                          )}
                          onClick={() => {
                            setSelectedRequest(request)
                            setIsDialogOpen(true)
                          }}
                        >
                          <CardHeader className="pb-2">
                            <div className="flex items-start justify-between">
                              <div className="space-y-1">
                                <CardTitle className="text-sm font-medium truncate">{request.requestor_full_name}</CardTitle>
                                <p className="text-xs text-muted-foreground truncate">{request.department}</p>
                              </div>
                              <div className="flex items-center gap-1">{getStatusIcon(request.status)}</div>
                            </div>
                          </CardHeader>
      
                          <CardContent className="pt-0">
                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-muted-foreground">Items:</span>
                                <span className="font-medium">{request.properties.length}</span>
                              </div>
      
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-muted-foreground">Status:</span>
                                <Badge variant={getStatusVariant(request.status)} className="text-xs h-5">
                                  {request.status || "pending"}
                                </Badge>
                              </div>
      
                              <div className="text-xs text-muted-foreground">{formatDate(request.created_at)}</div>
      
                              <div className="flex items-center gap-1 pt-1">
                                <Eye className="h-3 w-3 text-muted-foreground" />
                                <span className="text-xs text-muted-foreground">Click to view details</span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </DialogTrigger>
      
                      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2">
                            <User className="h-5 w-5" />
                            {selectedRequest?.requestor_full_name} - {selectedRequest?.department}
                            <div className="flex items-center gap-1 ml-auto">
                              {getStatusIcon(selectedRequest?.status)}
                              <Badge variant={getStatusVariant(selectedRequest?.status)}>
                                {selectedRequest?.status || "pending"}
                              </Badge>
                            </div>
                          </DialogTitle>
                          <p className="text-sm text-muted-foreground">
                            Submitted on {selectedRequest && formatDate(selectedRequest.created_at)}
                          </p>
                        </DialogHeader>
      
                        {selectedRequest && <PropertyDetailView request={selectedRequest} />}
                      </DialogContent>
                    </Dialog>
                  ))}
                </div>
              </div>
            )}
          </div>
        )
      }
      