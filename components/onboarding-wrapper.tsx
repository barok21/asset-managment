"use client";
import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { checkUserProfileStatus } from "@/lib/actions/user.action";
import { getDepartments } from "@/lib/actions/property.action";
import { AlertTriangle, LoaderIcon } from "lucide-react";
import UserOnboardingForm from "./user-onboarding-form/user-onboarding-form";
import Image from "next/image";

type UserProfileStatus =
  | "loading"
  | "not_exists"
  | "pending_approval"
  | "approved"
  | "rejected";

export default function OnboardingWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoaded, isSignedIn } = useUser();
  const [profileStatus, setProfileStatus] =
    useState<UserProfileStatus>("loading");
  const [departments, setDepartments] = useState<string[]>([]);
  const router = useRouter();

  useEffect(() => {
    console.log("Auth state:", { isLoaded, isSignedIn, userId: user?.id });

    if (!isLoaded) return;
    if (!isSignedIn) {
      router.replace("/sign-in");
    }
  }, [isLoaded, isSignedIn, router]);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !user?.id) return;
    console.log(
      "User loaded:",
      isLoaded,
      "Signed in:",
      isSignedIn,
      "User:",
      user?.id
    );
    console.log("Profile status:", profileStatus);

    const fetchData = async () => {
      try {
        const [status, depts] = await Promise.all([
          checkUserProfileStatus(user.id),
          getDepartments(),
        ]);
        setProfileStatus(status);
        setDepartments(depts);
      } catch (err) {
        console.error(err);
        setProfileStatus("not_exists");
      }
    };

    fetchData();
  }, [isLoaded, isSignedIn, user]);

  if (!isLoaded || profileStatus === "loading" || !user?.id) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoaderIcon className="w-5 h-5 animate-spin mr-2" />
        <span>Loading...</span>
      </div>
    );
  }

  if (profileStatus === "not_exists") {
    router.replace("/onboarding");
    return null;
  }

  if (profileStatus === "pending_approval") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
        <Image
          src="/images/review.png"
          alt="under review"
          width={80}
          height={80}
        />
        <p className="text-lg font-medium">Your account is under review.</p>
        <p className="text-sm text-muted-foreground mt-1">
          Please wait for approval.
        </p>
        <div className="pt-2">
          <LoaderIcon className="w-4 h-4 animate-spin text-green-600 mb-4" />
        </div>
      </div>
    );
  }

  if (profileStatus === "rejected") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
        <div className="text-orange-400 mb-4">
          <AlertTriangle />
        </div>
        <p className="text-lg font-semibold text-red-600">
          Your account was Rejected.
        </p>
        <p className="text-sm text-muted-foreground mt-1 max-w-md">
          Unfortunately, your profile suspended. Please contact the
          administrator.
        </p>
        <div className="text-red-500 mb-4 pt-4">
          <LoaderIcon className="w-6 h-6 animate-pulse" />
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
