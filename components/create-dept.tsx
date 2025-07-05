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
import {
  createDepartment,
  createPropertiesBulk,
} from "@/lib/actions/property.action";
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
const departmentSchema = z.object({
  name: z.string().min(1),
  dept_id: z.string().min(1),
});

type DepartmentFormData = z.infer<typeof departmentSchema>;

export default function CreateDept() {
  const [properties, setProperties] = useState<DepartmentFormData[]>([]);
  const [loading, setLoading] = useState(false);

  const form = useForm<DepartmentFormData>({
    resolver: zodResolver(departmentSchema),
    defaultValues: {
      name: "",
      dept_id: "",
    },
  });

  const addProperty = (data: DepartmentFormData) => {
    setProperties((prev) => [data, ...prev]);

    // ✅ Reset form including dept_user
    form.reset({
      name: "",
      dept_id: "",
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
      const result = await createDepartment(properties);

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
          Register Department
        </p>
        <Separator className="mb-6" />

        <Form {...form}>
          <form onSubmit={form.handleSubmit(addProperty)}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Department name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. enter Department name "
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dept_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dept. CODE</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Ed-001" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-en mt-3   ">
              <Button type="submit" variant="default">
                <Plus className="mr-2 h-4 w-4" />
                Add Department
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
                  <th className="p-2 text-center">NO</th>
                  <th className="p-2 text-left"> Department name</th>
                  <th className="p-2 text-center">Department code</th>
                </tr>
              </thead>
              <tbody>
                {properties.map((prop, i) => (
                  <tr key={i} className="border-t">
                    {/* Editable Name */}
                    <td className="p-2 items-center font-kefa">{i + 1}</td>
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

                    <td className="p-2 font-kefa text-xs">
                      <Input
                        value={prop.dept_id}
                        onChange={(e) =>
                          setProperties((prev) =>
                            prev.map((p, idx) =>
                              idx === i ? { ...p, dept_id: e.target.value } : p
                            )
                          )
                        }
                      />
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
              No department added yet ...
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
