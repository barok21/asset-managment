"use server";

import { auth } from "@clerk/nextjs/server";
import { createSupaseClient } from "../supabase";
import { UserProfileStatus } from "@/types/constants";

export type UserRole =
  | "department_user"
  | "finance_manager"
  | "property_manager"
  | "higher_manager"
  | "admin";

export interface UserProfile {
  userId: string;
  fullName: string;
  username: string;
  email: string;
  department: string;
  phoneNumber?: string;
  position: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
  status: string;
}

export interface CreateUserProfileData {
  userId: string;
  fullName: string;
  username: string;
  email: string;
  department: string;
  phoneNumber?: string;
  position: string;
}

// Create user profile during onboarding
export const createUserProfile = async (data: CreateUserProfileData) => {
  const supabase = createSupaseClient();

  const profileData = {
    user_id: data.userId,
    full_name: data.fullName,
    username: data.username,
    email: data.email,
    department: data.department,
    phone_number: data.phoneNumber,
    position: data.position,
    role: "department_user" as UserRole, // Default role
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { data: profile, error } = await supabase
    .from("user_profiles")
    .insert(profileData)
    .select()
    .single();

  if (error) {
    throw new Error(error.message || "Failed to create user profile");
  }

  return profile;
};

// Get user profile
export const getUserProfile = async (
  userId?: string
): Promise<UserProfile | null> => {
  const { userId: currentUserId } = await auth();
  const targetUserId = userId || currentUserId;

  if (!targetUserId) return null;

  const supabase = createSupaseClient();

  const { data: profile, error } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("user_id", targetUserId)
    .single();

  if (error || !profile) return null;

  return {
    userId: profile.user_id,
    fullName: profile.full_name,
    username: profile.username,
    email: profile.email,
    department: profile.department,
    phoneNumber: profile.phone_number,
    position: profile.position,
    role: profile.role,
    createdAt: profile.created_at,
    updatedAt: profile.updated_at,
    status: profile.status,
  };
};

// Get all users (for management)
export const getAllUsers = async (): Promise<UserProfile[]> => {
  const supabase = createSupaseClient();

  const { data: profiles, error } = await supabase
    .from("user_profiles")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message || "Failed to fetch users");
  }

  return profiles.map((profile: any) => ({
    userId: profile.user_id,
    fullName: profile.full_name,
    username: profile.username,
    email: profile.email,
    department: profile.department,
    phoneNumber: profile.phone_number,
    position: profile.position,
    role: profile.role,
    createdAt: profile.created_at,
    updatedAt: profile.updated_at,
    status: profile.status,
  }));
};

export async function checkUserProfileStatus(
  userId: string
): Promise<"not_exists" | "pending_approval" | "approved" | "rejected"> {
  const supabase = createSupaseClient();
  const { data, error } = await supabase
    .from("user_profiles")
    .select("status")
    .eq("user_id", userId)
    .single();

  if (error || !data) return "not_exists";

  switch (data.status) {
    case "approved":
      return "approved";
    case "rejected":
      return "rejected";
    case "pending":
    default:
      return "pending_approval";
  }
}

// Update user status to approval
export async function approveUser(userId: string) {
  const supabase = createSupaseClient();
  const { error } = await supabase
    .from("user_profiles")
    .update({ status: "approved" })
    .eq("user_id", userId);
  if (error) throw new Error(error.message);
}

// Update user status to rejection
export async function rejectUser(userId: string) {
  const supabase = createSupaseClient();
  const { error } = await supabase
    .from("user_profiles")
    .update({ status: "rejected" })
    .eq("user_id", userId);
  if (error) throw new Error(error.message);
}

// Update user role
export const updateUserRole = async (userId: string, newRole: UserRole) => {
  const { userId: currentUserId } = await auth();
  const currentUserProfile = await getUserProfile(currentUserId!);

  if (!currentUserProfile) {
    throw new Error("Current user profile not found");
  }

  // Check permissions
  const roleHierarchy: Record<UserRole, number> = {
    department_user: 1,
    finance_manager: 2,
    property_manager: 2,
    admin: 4,
    higher_manager: 3,
  };

  const currentUserLevel = roleHierarchy[currentUserProfile.role];
  const targetRoleLevel = roleHierarchy[newRole];

  if (targetRoleLevel >= currentUserLevel) {
    throw new Error(
      "You cannot promote users to a role equal or higher than yours"
    );
  }

  const supabase = createSupaseClient();

  const { error } = await supabase
    .from("user_profiles")
    .update({
      role: newRole,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId);

  if (error) {
    throw new Error(error.message || "Failed to update user role");
    console.log(error);
  }
};

// Get user role
export const getUserRole = async (): Promise<UserRole> => {
  const profile = await getUserProfile();
  return profile?.role || "admin";
};

// Check if user can approve/reject requests
export const canApproveRejects = async (): Promise<boolean> => {
  const role = await getUserRole();
  return [
    "finance_manager",
    "property_manager",
    "higher_manager",
    "admin",
  ].includes(role);
};

// Check if user profile exists
export const checkUserProfileExists = async (
  userId?: string
): Promise<boolean> => {
  const profile = await getUserProfile(userId);
  return profile !== null;
};
