'use server';

import { auth } from "@clerk/nextjs/server"
import { createSupaseClient } from "../supabase";

export const createPropertiesBulk = async (properties: CreateProperty[]) => {
  const { userId: username } = await auth();
  const supabase = createSupaseClient();

  const payload = properties.map((property) => ({
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
  };
};



export const getAllProperties = async ({
  limit = 10,
  page = 1,
  category,
}: GetAllProperties) => {
  const supabase = createSupaseClient();

  let query = supabase
    .from("property")
    .select("*", { count: "exact" }); // ✅ include count

  // Optional filter by category
  if (category) {
    query = query.eq("category", category);
  }

  // Pagination
  query = query.range((page - 1) * limit, page * limit - 1);

  const { data: property, count, error } = await query;

  if (error) throw new Error(error.message);

  return {
    property,
    total: count, // ✅ this is the total number of matching rows
  };
};

    
