'use server';

import { auth } from "@clerk/nextjs/server"
import { createSupaseClient } from "../supabase";

export const createPropert = async (formData: CreateProperty) => {
    const { userId: username } = await auth();
    const supabase = createSupaseClient();

    const {data, error} = await supabase
        .from('property')
        .insert({...formData, username})
        .select();

        if (error || !data) {
            throw new Error(error?.message || 'Failed to create a propert')
        }

        return data[0];
    }

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

    
