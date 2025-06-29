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
import { Plus, Send, Trash2 } from "lucide-react"
import { ChartLineDotsCustom } from "./chart"

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
      notes: string
      status: "pending";
      name: string;
      quantity: number;
      initial_price: number;
      category: string;
    }>
  >([])

 const [newResource, setNewResource] = useState({
    type: "",
    name:'',
    quantity: 1,
    initial_price: 1,
    notes: "",
    category: ''
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
    name:'',
    quantity: 1,
    initial_price:1,
    notes: "",
    category: ''
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
    <Form {...form}>
      
      <form onSubmit={form.handleSubmit(onSubmit)} className="">
      <div className="aspect-video w-full flex-1 rounded-lg border border-dashed p-5">
    
      <div className="space-y-4">
        <div className="size-90">
              <ChartLineDotsCustom/>
              </div>
                    <h3 className="text-lg font-semibold border-b pb-2">Add Resources</h3>
    
                    {/* Add New Resource Form */}
                    <div className="border rounded-lg p-4 bg-muted/30">
                      <div className="grid grid-co md:grid-cols-6 gap-3 items-end">

                        <FormItem>
                          <FormLabel>የንብረቱ ስም</FormLabel>
                            <FormControl>
                              <Input
                                value={newResource.name}
                                onChange={(e) => setNewResource((prev) => ({ ...prev, name: e.target.value }))}
                                placeholder="Enter name..."
                              />
                          </FormControl>
                        </FormItem>

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
                         
                          {/* <div>
                          <Label className="text-sm py-2">የንብረቱ ስም ዝርዝር</Label>
                          <Input
                            value={newResource.name}
                            onChange={(e) => setNewResource((prev) => ({ ...prev, name: e.target.value }))}
                            placeholder="Optional..."
                            className="h-9"
                          />
                        </div> */}

                         <div className="md:col-span-1">
                          <Label className="text-sm py-2">መለኪያ(UoM) *</Label>
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
                      

                        
                        
                       
{/* 
                        <div className="md:col-span-1">
                          <Label className="text-sm py-2">Resource Type *</Label>
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
                          <Label className="text-sm py-2">Notes</Label>
                          <Input
                            value={newResource.notes}
                            onChange={(e) => setNewResource((prev) => ({ ...prev, notes: e.target.value }))}
                            placeholder="Optional..."
                            className="h-9"
                          />
                        </div> */}
    
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
                              <th className="text-left p-3 font-medium text-sm">የንብረቱ ስም ዝርዝር</th>
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
                                  <Input
                                    value={resource.name}
                                    onChange={(e) => updateResource(resource.id, "name", e.target.value)}
                                    placeholder="Optional notes..."
                                    className="h-8 text-sm"
                                  />
                                </td>
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
                      <div className="text-center py-6 text-muted-foreground border-2 rounded-lg bg-muted/20">
                        <p className="text-sm">No resources added yet. Use the form above to add resources.</p>
                      </div>
                    )}
                  </div>
                   <div className="flex justify-end gap-3 pt-4 border-">
                <Button type="button" variant="outline">
                  Cancel
                </Button>
                <Button type="submit">Submit</Button>
              </div>
              
    </div>
              </form>
    </Form>

    //     <Form {...form}>
    //   <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 max-w-3xl mx-auto py-10">
        
    //     <div className="grid grid-cols-12 gap-4">
          
    //       <div className="col-span-6">
            
    //     <FormField
    //       control={form.control}
    //       name="name"
    //       render={({ field }) => (
    //         <FormItem>
    //           <FormLabel>Property Name</FormLabel>
    //           <FormControl>
    //             <Input 
    //             placeholder="Property name"
    //             {...field} />
    //           </FormControl>
              
    //           <FormMessage />
    //         </FormItem>
    //       )}
    //     />
    //       </div>
          
    //       <div className="col-span-6">
            
    //     <FormField
    //       control={form.control}
    //       name="quantity"
    //       render={({ field }) => (
    //         <FormItem>
    //           <FormLabel>Quantity</FormLabel>
    //           <FormControl>
    //             <Input 
    //             placeholder="Write an number"
    //             {...field} />
    //           </FormControl>
              
    //           <FormMessage />
    //         </FormItem>
    //       )}
    //     />
    //       </div>
          
    //     </div>
        
    //     <FormField
    //       control={form.control}
    //       name="initial_price"
    //       render={({ field }) => (
    //         <FormItem>
    //           <FormLabel>initial price</FormLabel>
    //           <FormControl>
    //             <Input 
    //             placeholder="price"
    //             {...field}
    //              />
    //           </FormControl>
              
    //           <FormMessage />
    //         </FormItem>
    //       )}
    //     />
        
    //     <FormField
    //       control={form.control}
    //       name="category"
    //       render={({ field }) => (
    //         <FormItem>
    //           <FormLabel>Email</FormLabel>
    //           <Select onValueChange={field.onChange} defaultValue={field.value}>
    //             <FormControl>
    //               <SelectTrigger>
    //                 <SelectValue placeholder="selcet a category" />
    //               </SelectTrigger>
    //             </FormControl>
    //             <SelectContent>
    //               <SelectItem value="m@example.com">m@example.com</SelectItem>
    //               <SelectItem value="m@google.com">m@google.com</SelectItem>
    //               <SelectItem value="m@support.com">m@support.com</SelectItem>
    //             </SelectContent>
    //           </Select>
                
    //           <FormMessage />
    //         </FormItem>
    //       )}
    //     />
    //     <Button type="submit">Submit</Button>
    //   </form>
    // </Form>
  )
}