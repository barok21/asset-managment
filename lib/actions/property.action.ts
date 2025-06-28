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
    
