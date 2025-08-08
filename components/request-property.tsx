"use client";

import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Trash2, Plus } from "lucide-react";
import { TextShimmer } from "./motion-primitives/text-shimmer";
import { toast } from "sonner";
import {
  getAllProperties,
  getDepartments,
  requestProperties as submitRequestProperty,
} from "@/lib/actions/property.action";
import { getUserProfile } from "@/lib/actions/user.action";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Textarea } from "./ui/textarea";
import { PhoneInput } from "./phone-input";
import { Calendar04 } from "./datepicker";
import { SingleDatePicker } from "./simpleDatePicker";
import { Badge } from "./ui/badge";

const requesterSchema = z.object({
  requestor_full_name: z.string().min(1, "Requestor full name is required"),
  department: z.string().min(1, "Department is required"),
  special_requirment: z.string().optional(),
  event_desc: z.string().min(1, "Event description is required"),
  phone_number: z.string().min(1, "Phone number is required"),
  return_date: z.string().min(1, "Phone number is required"),
  // start_time: z.string().min(1, "Start time is required"),
  // end_time: z.string().min(1, "End time is required"),
  start_date: z.string().min(1, "Start date is required"),
  // end_date: z.string().min(1, "End date is required"),
  event_type: z.string().min(1, "Event type is required"),
});

const propertySchema = z.object({
  property_name: z.string().min(1, "Property name is required"),
  quantity: z.string().min(1, "Quantity is required"),
});

type RequesterFormData = z.infer<typeof requesterSchema>;
type PropertyFormData = z.infer<typeof propertySchema>;

const RequestProperty = () => {
  const [open, setOpen] = useState(false);
  const [properties, setProperties] = useState<PropertyFormData[]>([]);
  const [propertyOptions, setPropertyOptions] = useState<string[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [formReady, setFormReady] = useState(false);

  const requesterForm = useForm<RequesterFormData>({
    resolver: zodResolver(requesterSchema),
    defaultValues: {
      requestor_full_name: "",
      department: "",
      special_requirment: "",
      event_desc: "",
      phone_number: "",
      return_date: "",
      start_date: "",
      event_type: "",
    },
  });

  const propertyForm = useForm<PropertyFormData>({
    resolver: zodResolver(propertySchema),
    defaultValues: {
      property_name: "",
      quantity: "",
    },
  });

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const profile = await getUserProfile();
        if (profile) {
          requesterForm.reset({
            requestor_full_name: profile.fullName,
            department: profile.department,
            special_requirment: "",
          });
          setFormReady(true);
        }

        const [departments, propertyResponse] = await Promise.all([
          getDepartments(),
          getAllProperties({
            limit: 100,
            page: 1,
            category: "",
            dept_user: "",
          }),
        ]);

        const propertyOptions = propertyResponse.property.map((p) => p.name);
        setDepartments(departments);
        setPropertyOptions(propertyOptions);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load user profile, departments, or properties");
      }
    };

    fetchAll();
  }, []);

  const addProperty = (data: PropertyFormData) => {
    if (!formReady) {
      toast.warning("Requester profile is still loading.");
      return;
    }

    if (
      !requesterForm.getValues("requestor_full_name") ||
      !requesterForm.getValues("event_desc")
    ) {
      toast.error("Please fill in Requester Full Name and Department first.");
      return;
    }

    setProperties((prev) => [data, ...prev]);
    propertyForm.reset();
    toast.success("Property added to list.");
  };

  const removeProperty = (index: number) => {
    setProperties((prev) => prev.filter((_, i) => i !== index));
  };

  const onSubmitAll = async () => {
    if (properties.length === 0) {
      toast.error("Add at least one property.");
      return;
    }

    const isRequesterValid = await requesterForm.trigger();
    if (!isRequesterValid) {
      const errors = requesterForm.formState.errors;
      console.log(errors);
      toast.error("Please fix requester information errors.");
      return;
    }

    setLoading(true);
    const batchId = uuidv4();

    try {
      const requesterData = requesterForm.getValues();

      const payload = properties.map((p) => ({
        ...p,
        special_requirment: requesterData.special_requirment ?? "",
        requestor_full_name: requesterData.requestor_full_name,
        department: requesterData.department,
        event_desc: requesterData.event_desc,
        phone_number: requesterData.phone_number,
        // start_time: requesterData.start_time,
        // end_time: requesterData.end_time,
        start_date: requesterData.start_date,
        request_batch_id: batchId,
        event_type: requesterData.event_type,
        return_date: requesterData.return_date,
      }));

      const result = await submitRequestProperty(payload);
      toast.success(`${result.inserted} properties submitted.`);
      setProperties([]);
      setOpen(false);
      requesterForm.reset();
      propertyForm.reset();
    } catch (error) {
      console.error(error);
      toast.error("Failed to submit properties.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="border-2" variant="outline">
          <Plus />
          Request Property
        </Button>
      </DialogTrigger>

      <DialogContent
        className="w-full max-w-[95vw] sm:max-w-3xl overflow-y-auto max-h-[90vh] sm:max-h-[95vh]  hide-scrollbar rounded-xl"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Request New Property</DialogTitle>
          <DialogDescription>
            Fill in requester information once, then add one or multiple
            properties.{" "}
            <Badge
              variant={"outline"}
              className="border-2 border-sky-500 bg-sky-200 drak:border-sky-500 dark:bg-sky-900  font-semibold"
            >
              {"< "}5 min
            </Badge>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Requester Info Form */}
          <section className="bg-card p-6 rounded-2xl border">
            <h2 className="text-xl font-semibold mb-4">
              Requester Information
            </h2>
            <Form {...requesterForm}>
              <form>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <FormField
                    control={requesterForm.control}
                    name="requestor_full_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Requestor Full Name</FormLabel>
                        <FormControl>
                          <Input
                            className="font-kefa text-xs"
                            {...field}
                            disabled
                          />
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
                                <p className="font-kefa text-xs">{dept}</p>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={requesterForm.control}
                    name="phone_number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <PhoneInput
                          defaultCountry="ET"
                          value={field.value}
                          onChange={field.onChange}
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* <EthiopianCalendarPicker/> */}
                </div>
              </form>
            </Form>
          </section>

          <section className="bg-card p-6 rounded-2xl border">
            <h2 className="text-xl font-semibold mb-4">Event Detail</h2>
            <Form {...requesterForm}>
              <form>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={requesterForm.control}
                    name="event_desc"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Purpose or event description</FormLabel>
                        <FormControl>
                          <Textarea
                            className="font-kefa text-[11px]"
                            placeholder="Eevent description"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={requesterForm.control}
                    name="special_requirment"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Special Requirement</FormLabel>
                        <FormControl>
                          <Textarea
                            className="font-kefa text-[11px]"
                            placeholder="Optional"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={requesterForm.control}
                    name="start_date"
                    render={({ field }) => {
                      const [open, setOpen] = useState(false);

                      return (
                        <FormItem className="flex flex-col">
                          <FormLabel>Event Date *</FormLabel>

                          <Popover open={open} onOpenChange={setOpen}>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className="justify-start text-left w-full"
                              >
                                {field.value
                                  ? new Date(field.value).toLocaleDateString()
                                  : "Pick a event date"}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                              <SingleDatePicker
                                selected={
                                  field.value
                                    ? new Date(field.value)
                                    : undefined
                                }
                                onChange={(date) => {
                                  field.onChange(date);
                                  setOpen(false);
                                }}
                              />
                            </PopoverContent>
                          </Popover>

                          <FormMessage />
                        </FormItem>
                      );
                    }}
                  />

                  <FormField
                    control={requesterForm.control}
                    name="return_date"
                    render={({ field }) => {
                      const [open, setOpen] = useState(false);

                      return (
                        <FormItem className="flex flex-col">
                          <FormLabel>Expected Return Date *</FormLabel>

                          <Popover open={open} onOpenChange={setOpen}>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className="justify-start text-left w-full"
                              >
                                {field.value
                                  ? new Date(field.value).toLocaleDateString()
                                  : "Pick a return date"}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                              <SingleDatePicker
                                selected={
                                  field.value
                                    ? new Date(field.value)
                                    : undefined
                                }
                                onChange={(date) => {
                                  field.onChange(date);
                                  setOpen(false);
                                }}
                              />
                            </PopoverContent>
                          </Popover>

                          <FormMessage />
                        </FormItem>
                      );
                    }}
                  />

                  <FormField
                    control={requesterForm.control}
                    name="event_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Event Location</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select event type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Inside the church">
                              Inside the church
                            </SelectItem>
                            <SelectItem value="Outside the church">
                              Outside the church
                            </SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
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
          <section className="bg-card p-4 rounded-2xl border-2 border-sky-900">
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
                  render={({ field }) => {
                    const [open, setOpen] = useState(false);

                    const [search, setSearch] = useState("");

                    const filteredOptions = propertyOptions
                      .filter((item) =>
                        item.toLowerCase().includes(search.toLowerCase())
                      )
                      .slice(0, 5);

                    return (
                      <FormItem className="flex flex-col">
                        <FormLabel>Property Name</FormLabel>
                        <Popover open={open} onOpenChange={setOpen}>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
                              className={cn(
                                "justify-between",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value || "Select a property"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent>
                            <Command>
                              <CommandInput
                                placeholder="Search property..."
                                value={search}
                                onValueChange={setSearch}
                              />
                              <CommandList>
                                <CommandEmpty>No property found.</CommandEmpty>
                                <CommandGroup>
                                  {filteredOptions.map((item) => (
                                    <CommandItem
                                      key={item}
                                      value={item}
                                      onSelect={() => {
                                        field.onChange(item);
                                        setOpen(false);
                                      }}
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
                    );
                  }}
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
                  <Button
                    type="submit"
                    disabled={loading || !formReady}
                    className="w-full cursor-pointer"
                  >
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
                      <th scope="col" className="p-2 text-center">
                        No
                      </th>
                      <th scope="col" className="p-2 text-left">
                        Property
                      </th>
                      <th scope="col" className="p-2 text-center">
                        Qty
                      </th>
                      <th scope="col" className="p-2 text-center">
                        Remove
                      </th>
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

        <DialogFooter className="flex justify-between pt-2">
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
  );
};

export default RequestProperty;
