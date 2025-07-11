"use client"

import { useEffect, useState } from "react"
import { useForm, Controller } from "react-hook-form"
import { z } from "zod"
import { v4 as uuidv4 } from "uuid"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Input } from "@/components/ui/input"
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form"
import { Trash2, Plus } from "lucide-react"
import { TextShimmer } from "./motion-primitives/text-shimmer"
import { toast } from "sonner"
import {
  getAllProperties,
  getDepartments,
  requestProperties as submitRequestProperty,
} from "@/lib/actions/property.action"
import { getUserProfile } from "@/lib/actions/user.action"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select"

const requesterSchema = z.object({
  requestor_full_name: z.string().min(1, "Requestor full name is required"),
  department: z.string().min(1, "Department is required"),
  special_requirment: z.string().optional(),
})

const propertySchema = z.object({
  property_name: z.string().min(1, "Property name is required"),
  quantity: z.string().min(1, "Quantity is required"),
})

type RequesterFormData = z.infer<typeof requesterSchema>
type PropertyFormData = z.infer<typeof propertySchema>

const RequestProperty = () => {
  const [open, setOpen] = useState(false)
  const [properties, setProperties] = useState<PropertyFormData[]>([])
  const [propertyOptions, setPropertyOptions] = useState<string[]>([])
  const [departments, setDepartments] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [formReady, setFormReady] = useState(false)

  const requesterForm = useForm<RequesterFormData>({
    resolver: zodResolver(requesterSchema),
    defaultValues: {
      requestor_full_name: "",
      department: "",
      special_requirment: "",
    },
  })

  const propertyForm = useForm<PropertyFormData>({
    resolver: zodResolver(propertySchema),
    defaultValues: {
      property_name: "",
      quantity: "",
    },
  })

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const profile = await getUserProfile()
        if (profile) {
          requesterForm.reset({
            requestor_full_name: profile.fullName,
            department: profile.department,
            special_requirment: "",
          })
          setFormReady(true)
        }

        const [departments, propertyResponse] = await Promise.all([
          getDepartments(),
          getAllProperties({ limit: 100, page: 1, category: "", dept_user: "" }),
        ])

        const propertyOptions = propertyResponse.property.map((p) => p.name)
        setDepartments(departments)
        setPropertyOptions(propertyOptions)
      } catch (err) {
        console.error(err)
        toast.error("Failed to load user profile, departments, or properties")
      }
    }

    fetchAll()
  }, [])

  const addProperty = (data: PropertyFormData) => {
    if (!formReady) {
      toast.warning("Requester profile is still loading.")
      return
    }

    if (!requesterForm.getValues("requestor_full_name") || !requesterForm.getValues("department")) {
      toast.error("Please fill in Requester Full Name and Department first.")
      return
    }

    setProperties((prev) => [data, ...prev])
    propertyForm.reset()
    toast.success("Property added to list.")
  }

  const removeProperty = (index: number) => {
    setProperties((prev) => prev.filter((_, i) => i !== index))
  }

  const onSubmitAll = async () => {
    if (properties.length === 0) {
      toast.error("Add at least one property.")
      return
    }

    const isRequesterValid = await requesterForm.trigger()
    if (!isRequesterValid) {
      toast.error("Please fix requester information errors.")
      return
    }

    setLoading(true)
    const batchId = uuidv4()

    try {
      const requesterData = requesterForm.getValues()

      const payload = properties.map((p) => ({
        ...p,
        special_requirment: requesterData.special_requirment ?? "",
        requestor_full_name: requesterData.requestor_full_name,
        department: requesterData.department,
        request_batch_id: batchId,
      }))

      const result = await submitRequestProperty(payload)
      toast.success(`${result.inserted} properties submitted.`)
      setProperties([])
      setOpen(false)
      requesterForm.reset()
      propertyForm.reset()
    } catch (error) {
      console.error(error)
      toast.error("Failed to submit properties.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="border-2" variant="outline">
        <Plus/>
          Request Property</Button>
      </DialogTrigger>

      <DialogContent
        className="max-w-[1100px] overflow-y-auto max-h-[90vh] hide-scrollbar"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Request New Property</DialogTitle>
          <DialogDescription>
            Fill in requester information once, then add one or multiple properties.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Requester Info Form */}
          <section className="bg-card p-6 rounded-2xl border">
            <h2 className="text-xl font-semibold mb-4">Requester Information</h2>
            <Form {...requesterForm}>
              <form>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <FormField
                    control={requesterForm.control}
                    name="requestor_full_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Requestor Full Name</FormLabel>
                        <FormControl>
                          <Input {...field} disabled />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={requesterForm.control}
                    name="department"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Department</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          disabled
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select department" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {departments.map((dept) => (
                              <SelectItem key={dept} value={dept}>
                                {dept}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </form>
            </Form>
          </section>

          {/* Property Adding Form */}
          <section className="bg-card p-4 rounded-2xl border">
            <h2 className="text-xl font-semibold mb-4 flex items-center justify-between">
              <span>Add Property</span>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => propertyForm.reset()}
              >
                Clear
              </Button>
            </h2>
            <Form {...propertyForm}>
              <form
                onSubmit={propertyForm.handleSubmit(addProperty)}
                className="grid grid-cols-1 md:grid-cols-2 gap-6"
              >
                <FormField
                  control={propertyForm.control}
                  name="property_name"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Property Name</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            className={cn("justify-between", !field.value && "text-muted-foreground")}
                          >
                            {field.value || "Select a property"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="p-0 w-[var(--radix-popover-trigger-width)]">
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
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={propertyForm.control}
                  name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quantity</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. 5" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex items-end">
                  <Button type="submit" disabled={loading || !formReady} className="w-full cursor-pointer">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Property
                  </Button>
                </div>
              </form>
            </Form>

            {/* Property List Table */}
            {properties.length > 0 ? (
              <div className="border rounded-lg overflow-x-auto mt-6">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40">
                    <tr>
                      <th scope="col" className="p-2 text-center">No</th>
                      <th scope="col" className="p-2 text-left">Property</th>
                      <th scope="col" className="p-2 text-center">Qty</th>
                      <th scope="col" className="p-2 text-center">Remove</th>
                    </tr>
                  </thead>
                  <tbody>
                    {properties.map((prop, i) => (
                      <tr key={i} className="border-t">
                        <td className="p-2 text-center">{i + 1}</td>
                        <td className="p-2">{prop.property_name}</td>
                        <td className="p-2 text-center">{prop.quantity}</td>
                        <td className="p-2 text-center">
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="text-red-500 h-6 w-6"
                            onClick={() => removeProperty(i)}
                            aria-label={`Remove property ${prop.property_name}`}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-muted-foreground text-center border-2 border-dashed p-5 rounded-xl mt-6 bg-muted/10">
                <TextShimmer className="font-mono text-sm" duration={1}>
                  No property added yet ...
                </TextShimmer>
              </div>
            )}

            <Button
              onClick={onSubmitAll}
              disabled={loading}
              className="w-full mt-6 bg-gradient-to-tr from-indigo-600 to-purple-500 text-white rounded-2xl cursor-pointer"
            >
              {loading ? "Submitting..." : "Submit All Properties"}
            </Button>
          </section>
        </div>

        <DialogFooter className="flex justify-between pt-6">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={loading}
            className="w-full rounded-full cursor-pointer"
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default RequestProperty
