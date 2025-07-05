"use server";

import { auth } from "@clerk/nextjs/server";
import { createSupaseClient } from "../supabase";

export const createPropertiesBulk = async (properties: CreateProperty[]) => {
  const { userId: username } = await auth();
  const supabase = createSupaseClient();

  // Step 1: Collect property names to check for duplicates
  const names = properties.map((p) => p.name);

  // Step 2: Check existing names in the database
  const { data: existing, error: fetchError } = await supabase
    .from("property")
    .select("name")
    .in("name", names);

  if (fetchError) {
    throw new Error(fetchError.message || "Error checking for duplicates.");
  }

  const existingNames = new Set(existing?.map((item) => item.name));
  const filtered = properties.filter((p) => !existingNames.has(p.name));

  if (filtered.length === 0) {
    return {
      success: false,
      message: "All provided property names already exist.",
      skipped: names.length,
      duplicates: Array.from(existingNames),
    };
  }

  // Step 3: Insert only unique ones
  const payload = filtered.map((property) => ({
    ...property,
    username,
  }));

  const { data, error } = await supabase
    .from("property")
    .insert(payload)
    .select();

  if (error || !data) {
    throw new Error(error?.message || "Failed to create properties in bulk");
  }

  return {
    success: true,
    data,
    inserted: data.length,
    skipped: properties.length - data.length,
    duplicates: Array.from(existingNames),
  };
};

export const getAllProperties = async ({
  limit = 10,
  page = 1,
  category,
  dept_user,
}: GetAllProperties) => {
  const supabase = createSupaseClient();

  let query = supabase
    .from("property")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false }); // ✅ Fetch recent items

  // Optional filter by category
  if (category) {
    query = query.eq("category", category);
  }

  if (dept_user) {
    query = query.eq("dept_user", dept_user);
  }

  // Pagination
  query = query.range((page - 1) * limit, page * limit - 1);

  const { data: property, count, error } = await query;

  if (error) throw new Error(error.message);

  return {
    property,
    total: count,
  };
};

export const createDepartment = async (properties: CreateDept[]) => {
  const { userId: username } = await auth();
  const supabase = createSupaseClient();

  // Step 1: Collect property names to check for duplicates
  const names = properties.map((p) => p.name);

  // Step 2: Check existing names in the database
  const { data: existing, error: fetchError } = await supabase
    .from("departments")
    .select("name");

  if (fetchError) {
    throw new Error(fetchError.message || "Error checking for duplicates.");
  }

  const existingNames = new Set(existing?.map((item) => item.name));
  const filtered = properties.filter((p) => !existingNames.has(p.name));

  if (filtered.length === 0) {
    return {
      success: false,
      message: "All provided property names already exist.",
      skipped: names.length,
      duplicates: Array.from(existingNames),
    };
  }

  // Step 3: Insert only unique ones
  const payload = filtered.map((property) => ({
    ...property,
    username,
  }));

  const { data, error } = await supabase
    .from("departments")
    .insert(payload)
    .select();

  if (error || !data) {
    throw new Error(error?.message || "Failed to create properties in bulk");
  }

  return {
    success: true,
    data,
    inserted: data.length,
    skipped: properties.length - data.length,
    duplicates: Array.from(existingNames),
  };
};

export const getDepartments = async () => {
  const supabase = createSupaseClient();
  const { data, error } = await supabase.from("departments").select("name");

  if (error) throw new Error(error.message);
  return data.map((d) => d.name);
};

export const getAllDepartment = async ({
  limit = 10,
  page = 1,
}: GetAllDepartment) => {
  const supabase = createSupaseClient();

  let query = supabase
    .from("departments")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false }); // ✅ Fetch recent items

  // Optional filter by category

  // Pagination
  query = query.range((page - 1) * limit, page * limit - 1);

  const { data: property, count, error } = await query;

  if (error) throw new Error(error.message);

  return {
    property,
    total: count,
  };
};

export const requestProperty = async (properties: requestProperty[]) => {
  const { userId: username } = await auth()
  const supabase = createSupaseClient()

  const payload = properties.map((property) => ({
    ...property,
    username,
  }))

  const { data, error } = await supabase
    .from("request_property")
    .insert(payload)
    .select()

  if (error || !data) {
    throw new Error(error?.message || "Failed to insert request properties")
  }

  return {
    success: true,
    data,
    inserted: data.length,
  }
}

export async function getRequestedProperties() {
  const supabase = createSupaseClient()

  const { data, error } = await supabase
    .from("request_property")
    .select("*")
    .order("created_at", { ascending: false }) // optional: latest first

  if (error) {
    console.error("Error fetching requested properties:", error)
    throw new Error(error.message)
  }

  return data
}

// Update request status
export const updateRequestStatus = async (batchId: string, status: "approved" | "rejected") => {
  const supabase = createSupaseClient()
  
  const { error } = await supabase
    .from("request_property")
    .update({ status })
    .eq("request_batch_id", batchId)

  if (error) throw error
}

// ✅ Admin updates the approved quantity (called onBlur)
export const updateApprovedQuantity = async (
  id: string,
  approved_quantity: number
) => {
  const supabase = createSupaseClient()

  const { error } = await supabase
    .from("request_property")
    .update({ approved_quantity })
    .eq("id", id)

  if (error) throw new Error(error.message)
}

// ✅ Check if a property is used in other departments
export const checkPropertyUsage = async (
  property_name: string,
  currentDepartment: string
) => {
  const supabase = createSupaseClient()

  const { data, error } = await supabase
    .from("request_property")
    .select("department")
    .eq("property_name", property_name)
    .neq("department", currentDepartment)

  if (error) throw new Error(error.message)

  return [...new Set(data.map((d) => d.department))] // unique depts
}