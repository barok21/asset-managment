"use client";

import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { createPropertiesBulk } from "@/lib/actions/property.action";
import { Separator } from "./ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Badge } from "./ui/badge";
import { UOM_OPTIONS } from "@/types/constants";
import { TextShimmerWave } from "./motion-primitives/text-shimmer-wave";
import { TextShimmer } from "./motion-primitives/text-shimmer";

// Zod Schema
const propertySchema = z.object({
  name: z.string().min(1),
  quantity: z.coerce.number().min(1),
  initial_price: z.coerce.number().min(0),
  category: z.string().min(1),
  dept_user: z.string().min(1),
  UoM: z.string().min(1), // or z.enum(["pc", "set", ...]) for stronger typing
});

type PropertyFormData = z.infer<typeof propertySchema>;

export default function BulkPropertyForm() {
  const [properties, setProperties] = useState<PropertyFormData[]>([]);
  const [loading, setLoading] = useState(false);

  const form = useForm<PropertyFormData>({
    resolver: zodResolver(propertySchema),
    defaultValues: {
      name: "",
      quantity: 1,
      initial_price: 0,
      category: "",
      dept_user: "",
    },
  });

  const addProperty = (data: PropertyFormData) => {
    setProperties((prev) => [data, ...prev]);

    // ✅ Reset form including dept_user
    form.reset({
      name: "",
      quantity: 1,
      initial_price: 0,
      category: "",
      dept_user: "",
    });

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

    setLoading(true);
    try {
      const result = await createPropertiesBulk(properties);

      if (result?.success) {
        toast.success(`${result.inserted} properties added.`);

        if (result.skipped > 0) {
          toast.warning(
            `${result.skipped} skipped: ${result.duplicates.join(
              ", "
            )} already exist.`
          );
        }

        setProperties([]);
      } else {
        toast.error(result.message || "Failed to insert properties.");
      }
    } catch (error) {
      console.error(error);
      toast.error("An error occurred during submission.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="bg-card p-6 rounded-2xl border">
        <p className="text-2xl font-semibold mb-2 font-kefa">
          የሕፃናትና አዳጊ ነጭ ልብሰ ስብሐት
        </p>
        <Separator className="mb-6" />

        <Form {...form}>
          <form onSubmit={form.handleSubmit(addProperty)}>
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Projector" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="UoM"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>UoM</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select UoM" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {UOM_OPTIONS.map((item) => (
                          <SelectItem key={item.label} value={item.label}>
                            {item.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantity</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        {...field}
                        className="h- px-2 text-sm"
                      />
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
                    <FormLabel>Initial Price</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} {...field} />
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
                    <FormLabel>Category</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Furniture">Furniture</SelectItem>
                        <SelectItem value="Electronics">Electronics</SelectItem>
                        <SelectItem value="Stationery">Stationery</SelectItem>
                        <SelectItem value="IT Equipment">
                          IT Equipment
                        </SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dept_user"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Department User</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a user" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="m@example.com">
                          m@example.com
                        </SelectItem>
                        <SelectItem value="m@google.com">
                          m@google.com
                        </SelectItem>
                        <SelectItem value="m@support.com">
                          m@support.com
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-en mt-3   ">
              <Button type="submit" variant="default">
                <Plus className="mr-2 h-4 w-4" />
                Add Property
              </Button>
            </div>
          </form>
        </Form>

        {/* Editable table of added properties */}
        {properties.length > 0 ? (
          <div className="border rounded-lg overflow-x-auto mt-6">
            <table className="w-full text-sm">
              <thead className="bg-muted/40">
                <tr>
                  <th className="p-2 text-left">Name</th>
                  <th className="p-2 text-center">UoM</th>
                  <th className="p-2 text-center">Qty</th>
                  <th className="p-2 text-center">Price</th>
                  <th className="p-2 text-center">Category</th>
                  <th className="p-2 text-center">Department</th>
                  <th className="p-2 text-center">Remove</th>
                </tr>
              </thead>
              <tbody>
                {properties.map((prop, i) => (
                  <tr key={i} className="border-t">
                    {/* Editable Name */}
                    <td className="p-2">
                      <Input
                        value={prop.name}
                        onChange={(e) =>
                          setProperties((prev) =>
                            prev.map((p, idx) =>
                              idx === i ? { ...p, name: e.target.value } : p
                            )
                          )
                        }
                      />
                    </td>

                    <td className="p-2 text-center">
                      <Select
                        value={prop.UoM}
                        onValueChange={(val) =>
                          setProperties((prev) =>
                            prev.map((p, idx) =>
                              idx === i ? { ...p, UoM: val } : p
                            )
                          )
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select UoM" />
                        </SelectTrigger>
                        <SelectContent>
                          {UOM_OPTIONS.map((item) => (
                            <SelectItem key={item.label} value={item.label}>
                              {item.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>

                    {/* Editable Quantity */}
                    <td className="p-2 text-center">
                      <Input
                        type="number"
                        min={1}
                        className="text-center h-8 px-2 text-sm"
                        value={prop.quantity}
                        onChange={(e) =>
                          setProperties((prev) =>
                            prev.map((p, idx) =>
                              idx === i
                                ? {
                                    ...p,
                                    quantity: parseInt(e.target.value) || 1,
                                  }
                                : p
                            )
                          )
                        }
                      />
                    </td>

                    {/* Editable Price */}
                    <td className="p-2 text-center">
                      <Input
                        type="number"
                        min={0}
                        className="text-center h-8 px-2 text-sm"
                        value={prop.initial_price}
                        onChange={(e) =>
                          setProperties((prev) =>
                            prev.map((p, idx) =>
                              idx === i
                                ? {
                                    ...p,
                                    initial_price:
                                      parseFloat(e.target.value) || 0,
                                  }
                                : p
                            )
                          )
                        }
                      />
                    </td>

                    {/* Editable Category via Select */}
                    <td className="p-2 text-center">
                      <Select
                        value={prop.category}
                        onValueChange={(val) =>
                          setProperties((prev) =>
                            prev.map((p, idx) =>
                              idx === i ? { ...p, category: val } : p
                            )
                          )
                        }
                      >
                        <SelectTrigger className="w-full h-8 text-xs">
                          <SelectValue placeholder="Category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Furniture">Furniture</SelectItem>
                          <SelectItem value="Electronics">
                            Electronics
                          </SelectItem>
                          <SelectItem value="Stationery">Stationery</SelectItem>
                          <SelectItem value="IT Equipment">
                            IT Equipment
                          </SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>

                    {/* Editable Department User */}
                    <td className="p-2 text-center">
                      <Select
                        value={prop.dept_user}
                        onValueChange={(val) =>
                          setProperties((prev) =>
                            prev.map((p, idx) =>
                              idx === i ? { ...p, dept_user: val } : p
                            )
                          )
                        }
                      >
                        <SelectTrigger className="w-full h-8 text-xs">
                          <SelectValue placeholder="Department" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="m@example.com">
                            m@example.com
                          </SelectItem>
                          <SelectItem value="m@google.com">
                            m@google.com
                          </SelectItem>
                          <SelectItem value="m@support.com">
                            m@support.com
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </td>

                    {/* Remove */}
                    <td className="p-2 text-center">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-6 w-6 text-red-500"
                        onClick={() => removeProperty(i)}
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
          <div className="text-lg text-muted-foreground text-center border-2 border-dashed p-10  rounded-xl mt-6">
            {/* <TextShimmerWave
              className="[--base-color:#0D74CE] [--base-gradient-color:#5EB1EF]"
              duration={1}
              spread={1}
              zDistance={1}
              scaleDistance={1.1}
              rotateYDistance={20}
            >
              No property added yet ...
            </TextShimmerWave> */}
            <TextShimmer className="font-mono text-sm" duration={1}>
              No property added yet ...
            </TextShimmer>
          </div>
        )}

        {/* Submit All Button */}
        <Button
          onClick={onSubmitAll}
          disabled={loading}
          className="w-full mt-6 flex items-center justify-center gap-2 bg-gradient-to-tr from-indigo-600 to-purple-500 text-white font-medium py-2 px-4 rounded-2xl shadow hover:shadow-lg transition-all"
        >
          {loading && (
            <span className="animate-spin inline-block h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
          )}
          {loading ? "Submitting..." : "Submit All Properties"}
        </Button>
      </div>
    </div>
  );
}
