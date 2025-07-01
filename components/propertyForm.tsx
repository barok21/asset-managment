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

// Zod Schema
const propertySchema = z.object({
  name: z.string().min(1),
  quantity: z.coerce.number().min(1),
  initial_price: z.coerce.number().min(0),
  category: z.string().min(1),
});

type PropertyFormData = z.infer<typeof propertySchema>;

export default function BulkPropertyForm() {
  const [properties, setProperties] = useState<PropertyFormData[]>([]);
  const [loading, setLoading] = useState(false); // 👈 Loading state

  const form = useForm<PropertyFormData>({
    resolver: zodResolver(propertySchema),
    defaultValues: {
      name: "",
      quantity: 1,
      initial_price: 0,
      category: "",
    },
  });

  const addProperty = (data: PropertyFormData) => {
    setProperties((prev) => [data, ...prev]);
    form.reset();
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

    setLoading(true); // 👈 Start loading
    try {
      const result = await createPropertiesBulk(properties);

      if (result?.success) {
        toast.success("Bulk property creation successful!");
        setProperties([]);
      } else {
        toast.error("Failed to create properties.");
      }
    } catch (error) {
      console.error(error);
      toast.error("An error occurred.");
    } finally {
      setLoading(false); // 👈 End loading
    }
  };

  return (
    <div className="flex gap-4">
      <div className="bg-card p-5 rounded-2xl space-y-5 border-1 ">
        <p className="text-2xl">Property Registration</p>
      <Separator/>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(addProperty)}
          className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end"
        >

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
            name="quantity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Quantity</FormLabel>
                <FormControl>
                  <Input type="number" min={1} {...field} />
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
                <FormControl>
                  <Input placeholder="e.g. Furniture" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="md:col-span-4">
            <Button variant={"default"} type="submit" className="w-ful ">
              <Plus className="mr-2 h-4 w-4" />
              Add Property
            </Button>
          </div>
        </form>
      </Form>

      {/* Table of added properties */}
      {properties.length > 0 ? (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr>
                <th className="p-2 text-left">Name</th>
                <th className="p-2 text-center">Qty</th>
                <th className="p-2 text-center">Price</th>
                <th className="p-2 text-center">Category</th>
                <th className="p-2 text-center">Remove</th>
              </tr>
            </thead>
            <tbody>
              {properties.map((prop, i) => (
                <tr key={i} className="border-t">
                  <td className="p-2">{prop.name}</td>
                  <td className="p-2 text-center">{prop.quantity}</td>
                  <td className="p-2 text-center">{prop.initial_price}</td>
                  <td className="p-2 text-center">{prop.category}</td>
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
        <p className="text-sm text-muted-foreground text-center border-2 p-8 rounded-xl bg-card">
          No properties added yet.
        </p>
      )}

      {/* Submit All Button with loading */}
      <Button
        onClick={onSubmitAll}
        variant={"default"}
        className="w-full mt-4 flex items-center justify-center gap-2"
        disabled={loading}
      >
        {loading && (
          <span className="animate-spin rounded-full size-10 border-t-2 border-white" />
        )}
        {loading ? "Submitting..." : "Submit All Properties"}
      </Button>
    </div>
    <div className="bg-sky-500">
      ss
    </div>
    </div>
  );
}
