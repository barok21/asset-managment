"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClientSupabaseClient } from "@/lib/supabase/client";
import { useUser } from "@clerk/nextjs";

interface DebugInfo {
  user: {
    id?: string;
    email?: string;
  };
  tests: {
    healthCheck: {
      success: boolean;
      error: any;
      data: any;
    };
    tableAccess: {
      success: boolean;
      error: any;
      data: any;
    };
    userNotifications: {
      success: boolean;
      error: any;
      data: any;
    };
  };
  environment: {
    supabaseUrl?: string;
    hasAnonKey: boolean;
  };
}

export function NotificationDebugPanel() {
  const { user } = useUser();
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const testSupabaseConnection = async () => {
    setIsLoading(true);
    try {
      const supabase = createClientSupabaseClient();

      console.log("Testing Supabase connection...");

      // Test 1: Basic connection
      const { data: healthCheck, error: healthError } = await supabase
        .from("notifications")
        .select("count", { count: "exact" })
        .limit(1);

      // Test 2: Check if table exists and user can access it
      const { data: tableData, error: tableError } = await supabase
        .from("notifications")
        .select("*")
        .limit(1);

      // Test 3: Try to fetch user's notifications
      const { data: userNotifications, error: userError } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user?.id || "test")
        .limit(5);

      const debugData: DebugInfo = {
        user: {
          id: user?.id,
          email: user?.emailAddresses?.[0]?.emailAddress,
        },
        tests: {
          healthCheck: {
            success: !healthError,
            error: healthError,
            data: healthCheck,
          },
          tableAccess: {
            success: !tableError,
            error: tableError,
            data: tableData,
          },
          userNotifications: {
            success: !userError,
            error: userError,
            data: userNotifications,
          },
        },
        environment: {
          supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
          hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        },
      };

      setDebugInfo(debugData);
      console.log("Debug info:", debugData);
    } catch (error) {
      console.error("Debug test failed:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      setDebugInfo({
        user: { id: user?.id },
        tests: {
          healthCheck: { success: false, error: errorMessage, data: null },
          tableAccess: { success: false, error: errorMessage, data: null },
          userNotifications: {
            success: false,
            error: errorMessage,
            data: null,
          },
        },
        environment: {
          supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
          hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        },
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createTestNotification = async () => {
    if (!user?.id) return;

    try {
      const supabase = createClientSupabaseClient();

      const { data, error } = await supabase
        .from("notifications")
        .insert({
          user_id: user.id,
          title: "Test Notification",
          message: "This is a test notification created from the debug panel",
          priority: "low",
          is_read: false,
        })
        .select();

      if (error) {
        console.error("Failed to create test notification:", error);
        alert(`Failed to create test notification: ${error.message}`);
      } else {
        console.log("Test notification created:", data);
        alert("Test notification created successfully!");
      }
    } catch (error) {
      console.error("Error creating test notification:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      alert(`Error: ${errorMessage}`);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Debug Panel</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button onClick={testSupabaseConnection} disabled={isLoading}>
            {isLoading ? "Testing..." : "Test Connection"}
          </Button>
          <Button onClick={createTestNotification} variant="outline">
            Create Test Notification
          </Button>
        </div>

        {debugInfo && (
          <div className="mt-4">
            <h4 className="font-semibold mb-2">Debug Results:</h4>
            <pre className="bg-muted p-4 rounded text-xs overflow-auto max-h-96">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
