"use client";

import { useEffect, useState } from "react";
import {
  updateApprovedQuantity,
  fetchGroupedRequestedPropertiesWithUsage,
  updateRequestItemStatus,
  updateRequestStatus,
  getDashboardStatistics,
  type DashboardStatistics,
} from "@/lib/actions/property.action";
import { markRequestItemReturned } from "@/lib/actions/property.action";
import {
  canApproveRejects,
  getUserRole,
  type UserRole,
} from "@/lib/actions/user.action";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  CheckCircle,
  XCircle,
  Clock,
  User,
  Building,
  AlertTriangle,
  Loader2,
  Package,
  Eye,
  Calendar,
  TrendingUp,
  FileText,
  ChevronRight,
  Shield,
  MessageSquare,
  LoaderIcon,
  InfoIcon,
  BadgeInfoIcon,
  Star,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { COMMON_REJECTION_REASONS } from "@/types/constants";
import RequestProperty from "./request-property";
import RequestEvaluationForm from "./request-evaluation-form";
import { Skeleton } from "./ui/skeleton";
import { TextShimmer } from "./motion-primitives/text-shimmer";

interface PropertyItem {
  id: string;
  property_name: string;
  quantity: number;
  approved_quantity?: number;
  status?: "approved" | "rejected" | "pending" | "returned";
  rejection_reason?: string;
  usedInOtherDept: string[];
  event_desc: string;
  phone_number: string;
  start_date: string;
  end_date: string;
  start_time: string;
  end_time: string;
}

interface RequestGroup {
  request_batch_id: string;
  requestor_full_name: string;
  department: string;
  special_requirment?: string;
  status?: "approved" | "rejected" | "pending" | "partial" | "returned";
  overall_rejection_reason?: string;
  created_at: string;
  properties: PropertyItem[];
  return_date: string;
  event_desc: string;
  phone_number: string;
  start_date: string;
  end_date: string;
  start_time: string;
  end_time: string;
  event_type: string;
  approved_by: string;
}

interface RejectionDialogState {
  isOpen: boolean;
  type: "item" | "batch";
  itemId?: string;
  batchId?: string;
  itemName?: string;
}

export default function RequestedPropertyAdminCards() {
  const [requests, setRequests] = useState<RequestGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingItems, setProcessingItems] = useState<Set<string>>(
    new Set()
  );
  const [selectedRequest, setSelectedRequest] = useState<RequestGroup | null>(
    null
  );
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEvalOpen, setIsEvalOpen] = useState(false);
  const [userRole, setUserRole] = useState<UserRole>("higher_manager");
  const [canApprove, setCanApprove] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const itemsPerPage = 5;

  // Rejection dialog state
  const [rejectionDialog, setRejectionDialog] = useState<RejectionDialogState>({
    isOpen: false,
    type: "item",
  });
  const [rejectionReason, setRejectionReason] = useState("");
  const [selectedCommonReason, setSelectedCommonReason] = useState("");
  const [useCustomReason, setUseCustomReason] = useState(false);

  // Dashboard statistics
  const [dashboardStats, setDashboardStats] = useState<DashboardStatistics>({
    totalRequests: 0,
    totalApproved: 0,
    totalRejected: 0,
    totalPartial: 0,
    totalPending: 0,
    totalItems: 0,
    approvalRate: 0,
    rejectionRate: 0,
    pendingRate: 0,
    commonResources: [],
    departmentStats: [],
    recentActivity: [],
  });

  useEffect(() => {
    const initializeUser = async () => {
      try {
        const role = await getUserRole();
        const canApproveReqs = await canApproveRejects();
        setUserRole(role);
        setCanApprove(canApproveReqs);
      } catch (error) {
        console.error("Error getting user role:", error);
      }
    };
    initializeUser();
  }, []);

  useEffect(() => {
    loadRequests(1);
    loadDashboardStats();
  }, []);

  const loadDashboardStats = async () => {
    try {
      const stats = await getDashboardStatistics();
      setDashboardStats(stats);
    } catch (error) {
      console.error("Error loading dashboard stats:", error);
    }
  };

  const loadRequests = async (page: number) => {
    try {
      if (page === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const result = await fetchGroupedRequestedPropertiesWithUsage(
        page,
        itemsPerPage
      );

      const processedData: RequestGroup[] = result.data.map((request: any) => ({
        ...request,
        status: calculateOverallStatus(request.properties),
      }));

      if (page === 1) {
        setRequests(processedData);
      } else {
        setRequests((prev) => [...prev, ...processedData]);
      }

      setCurrentPage(page);
      setTotalPages(Math.ceil(result.total / itemsPerPage));
      setHasMore(result.hasMore);
    } catch (error) {
      toast.error("Failed to load property requests");
      console.error(error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const calculateOverallStatus = (
    properties: PropertyItem[]
  ): "approved" | "rejected" | "pending" | "partial" | "returned" => {
    const hasReturned = properties.some((p) => p.status === "returned");
    if (hasReturned) return "returned";
    const approvedCount = properties.filter(
      (p) => p.status === "approved"
    ).length;
    const rejectedCount = properties.filter(
      (p) => p.status === "rejected"
    ).length;
    const pendingCount = properties.filter(
      (p) => !p.status || p.status === "pending"
    ).length;

    if (pendingCount > 0) return "pending";
    if (approvedCount > 0 && rejectedCount > 0) return "partial";
    if (approvedCount === properties.length) return "approved";
    if (rejectedCount === properties.length) return "rejected";
    return "pending";
  };

  const handleQuantityChange = async (
    id: string,
    quantity: number,
    requestId: string
  ) => {
    if (!canApprove) {
      toast.error("You don't have permission to modify quantities");
      return;
    }

    if (quantity < 0) {
      toast.error("Quantity cannot be negative");
      return;
    }

    try {
      await updateApprovedQuantity(id, quantity);
      toast.success("Approved quantity updated");
    } catch (err: any) {
      toast.error(err.message || "Failed to update quantity");
      console.error(err);
    }
  };

  const handleItemStatusChange = async (
    itemId: string,
    status: "approved" | "rejected" | "returned",
    groupId: string,
    reason?: string
  ) => {
    if (!canApprove) {
      toast.error("You don't have permission to approve/reject items");
      return;
    }

    setProcessingItems((prev) => new Set(prev).add(itemId));

    try {
      if (status === "returned") {
        const { batchId } = await markRequestItemReturned(itemId);
        // Optimistically mark item returned and update overall status to returned
        setRequests((prev) => {
          const updated = prev.map((g) => {
            if (g.request_batch_id === groupId) {
              const updatedProperties = g.properties.map((p) =>
                p.id === itemId ? { ...p, status: "returned" } : p
              );
              return {
                ...g,
                properties: updatedProperties,
                status: "returned",
              } as RequestGroup;
            }
            return g;
          });
          return updated;
        });
      } else {
        await updateRequestItemStatus(itemId, status, reason);
      }
      toast.success(`Property ${status}`);

      setRequests((prev) => {
        const updatedRequests = prev.map((g) => {
          if (g.request_batch_id === groupId) {
            const updatedProperties = g.properties.map((p) =>
              p.id === itemId ? { ...p, status, rejection_reason: reason } : p
            );
            const newOverallStatus =
              status === "returned"
                ? "returned"
                : calculateOverallStatus(updatedProperties);
            return {
              ...g,
              properties: updatedProperties,
              status: newOverallStatus,
            } as RequestGroup;
          }
          return g;
        });

        return updatedRequests;
      });

      if (selectedRequest?.request_batch_id === groupId) {
        setSelectedRequest((prev) => {
          if (!prev) return null;
          const updatedProperties = prev.properties.map((p) =>
            p.id === itemId ? { ...p, status, rejection_reason: reason } : p
          );
          return {
            ...prev,
            properties: updatedProperties,
            status: status === "returned" ? "returned" : calculateOverallStatus(updatedProperties),
          } as RequestGroup;
        });
      }

      // Reload dashboard stats
      loadDashboardStats();
    } catch (err: any) {
      toast.error(err.message || `Failed to ${status} item`);
      console.error(err);
    } finally {
      setProcessingItems((prev) => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
      });
    }
  };

  const handleBatchStatusChange = async (
    batchId: string,
    status: "approved" | "rejected",
    reason?: string
  ) => {
    if (!canApprove) {
      toast.error("You don't have permission to approve/reject requests");
      return;
    }

    try {
      await updateRequestStatus(batchId, status, reason);
      toast.success(`Request batch ${status}`);
      setRequests((prev) => {
        const updatedRequests = prev.map((r) =>
          r.request_batch_id === batchId
            ? { ...r, status, overall_rejection_reason: reason }
            : r
        );
        return updatedRequests;
      });

      // Reload dashboard stats
      loadDashboardStats();
    } catch (err: any) {
      toast.error(err.message || "Failed to update request status");
      console.error(err);
    }
  };

  const openRejectionDialog = (
    type: "item" | "batch",
    itemId?: string,
    batchId?: string,
    itemName?: string
  ) => {
    setRejectionDialog({
      isOpen: true,
      type,
      itemId,
      batchId,
      itemName,
    });
    setRejectionReason("");
    setSelectedCommonReason("");
    setUseCustomReason(false);
  };

  const handleRejectionConfirm = async () => {
    const finalReason = useCustomReason
      ? rejectionReason
      : selectedCommonReason;

    if (!finalReason.trim()) {
      toast.error("Please provide a reason for rejection");
      return;
    }

    if (rejectionDialog.type === "item" && rejectionDialog.itemId) {
      const request = requests.find((r) =>
        r.properties.some((p) => p.id === rejectionDialog.itemId)
      );
      if (request) {
        await handleItemStatusChange(
          rejectionDialog.itemId,
          "rejected",
          request.request_batch_id,
          finalReason
        );
      }
    } else if (rejectionDialog.type === "batch" && rejectionDialog.batchId) {
      await handleBatchStatusChange(
        rejectionDialog.batchId,
        "rejected",
        finalReason
      );
    }

    setRejectionDialog({ isOpen: false, type: "item" });
    setRejectionReason("");
    setSelectedCommonReason("");
    setUseCustomReason(false);
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "rejected":
        return <XCircle className="h-4 w-4 text-red-600" />;
      case "returned":
        return <CheckCircle className="h-4 w-4 text-emerald-700" />;
      case "partial":
        return <AlertTriangle className="h-4 w-4 text-orange-600" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getStatusVariant = (status?: string) => {
    switch (status) {
      case "approved":
        return "default" as const;
      case "rejected":
        return "destructive" as const;
      case "returned":
        return "default" as const;
      case "partial":
        return "secondary" as const;
      default:
        return "outline" as const;
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "approved":
        return "text-green-600 bg-green-50 border-green-200";
      case "rejected":
        return "text-red-600 bg-red-50 border-red-200";
      case "returned":
        return "text-emerald-700 bg-emerald-50 border-emerald-200";
      case "partial":
        return "text-orange-600 bg-orange-50 border-orange-200";
      default:
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-Us", {
      month: "short",
      day: "numeric",
      year: "numeric",
      // hour: "2-digit",
      // minute: "2-digit",
    });
  };

  const getRoleDisplay = (role: UserRole) => {
    const roleMap = {
      department_user: "Department User",
      finance_manager: "Finance Manager",
      property_manager: "Property Manager",
      higher_manager: "Higher Manager",
      admin: "Administrator",
    };
    return roleMap[role] || role;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-2">
          <LoaderIcon className="h-5 w-5 animate-spin" />
            <TextShimmer className="font-mono text-sm" duration={1}>
              Loading property requests...
            </TextShimmer>
        </div>
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <Package className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">No Property Requests</h3>
        <p className="text-muted-foreground">
          There are no property requests to review at this time.
        </p>
        <RequestProperty />
      </div>
    );
  }

  const [latestRequest, ...otherRequests] = requests;

  const PropertyDetailView = ({ request }: { request: RequestGroup }) => (
    <div className="space-y-4">
      {request.special_requirment && (
        <div className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-300 dark:border-yellow-800">
          <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
              Special Requirement
            </p>
            <p className="text-[11px] font-kefa text-yellow-700 dark:text-yellow-300">
              {request.special_requirment}
            </p>
          </div>
        </div>
      )}
      <div className="flex sm:flex-row items-start gap-2 p-3 bg-sky-50 dark:bg-sky-950/20 rounded-lg border border-sky-200 dark:border-sky-800">
        <BadgeInfoIcon className="h-4 w-4 text-sky-600 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-medium text-sky-800 dark:text-sky-200">
            Event Description
          </p>
          <p className="text-[11px] text-sky-700 dark:text-sky-300 font-kefa">
            {request.event_desc}
          </p>

          <div className="flex flex-col xs:flex-row flex-wrap items-start gap-2 pt-2">
            <Badge variant="outline" className="p-1.5 pr-3">
              starts{" - "}
              <Badge
                variant="outline"
                className="text-sky-600 font-semibold ml-1"
              >
                {formatDate(request.start_date)}
              </Badge>
            </Badge>
            <Badge variant="outline" className="p-1.5 pr-3">
              ends{" - "}
              <Badge
                variant="outline"
                className="text-sky-600 font-semibold ml-1"
              >
                {formatDate(request.return_date)}
              </Badge>
            </Badge>
          </div>
        </div>
      </div>

      {request.overall_rejection_reason && (
        <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800">
          <MessageSquare className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-red-800 dark:text-red-200">
              Overall Rejection Reason
            </p>
            <p className="text-sm text-red-700 dark:text-red-300">
              {request.overall_rejection_reason}
            </p>
          </div>
        </div>
      )}
      <div className="space-y-3">
        {request.properties.map((item, idx) => (
          <div
            key={item.id}
            className={cn(
              "border rounded-lg p-4 space-y-3 transition-colors",
              item.status === "approved" &&
                "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800",
              item.status === "rejected" &&
                "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800"
            )}
          >
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="font-medium text-sm">
                  #{idx + 1} {item.property_name}
                </p>
                <p className="text-xs text-muted-foreground">
                  Requested: {item.quantity} units
                </p>
                {Array.isArray(item.usedInOtherDept) &&
                  item.usedInOtherDept.length > 0 && (
                    <div className="flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3 text-amber-500" />
                      <p className="text-xs text-amber-600 dark:text-amber-400">
                        Used in other departments:{" "}
                        {item.usedInOtherDept.join(", ")}
                      </p>
                    </div>
                  )}

                {item.rejection_reason && (
                  <div className="flex items-start gap-1 mt-2">
                    <MessageSquare className="h-3 w-3 text-red-500 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-red-600 dark:text-red-400">
                      <span className="font-medium">Rejection reason:</span>{" "}
                      {item.rejection_reason}
                    </p>
                  </div>
                )}
              </div>
              <Badge
                variant={getStatusVariant(item.status)}
                className="text-xs"
              >
                {item.status || "pending"}
              </Badge>
            </div>

            {canApprove && (
            <div className="flex items-end gap-2">
                <div className="flex-1">
                  <label className="text-xs text-muted-foreground block mb-1">
                    Approved Quantity
                  </label>
                  <Input
                    type="number"
                    min="0"
                    defaultValue={item.approved_quantity ?? item.quantity}
                    className="h-8 text-sm"
                    onBlur={(e) => {
                      const value = Number.parseInt(e.target.value);
                      if (!isNaN(value)) {
                        handleQuantityChange(
                          item.id,
                          value,
                          request.request_batch_id
                        );
                      }
                    }}
                    disabled={item.status === "rejected" || request.status === "returned"}
                  />
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 px-2 text-xs bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
                    disabled={
                      item.status === "approved" || processingItems.has(item.id) || request.status === "returned"
                    }
                    onClick={() =>
                      handleItemStatusChange(
                        item.id,
                        "approved",
                        request.request_batch_id
                      )
                    }
                  >
                    {processingItems.has(item.id) ? (
                      <LoaderIcon className="h-3 w-3 animate-spin" />
                    ) : (
                      <CheckCircle className="h-3 w-3" />
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 px-2 text-xs bg-red-50 hover:bg-red-100 text-red-700 border-red-200"
                    disabled={
                      item.status === "rejected" || processingItems.has(item.id) || request.status === "returned"
                    }
                    onClick={() =>
                      openRejectionDialog(
                        "item",
                        item.id,
                        undefined,
                        item.property_name
                      )
                    }
                  >
                    {processingItems.has(item.id) ? (
                      <LoaderIcon className="h-3 w-3 animate-spin" />
                    ) : (
                      <XCircle className="h-3 w-3" />
                    )}
                  </Button>
                  {item.status === "approved" && request.status !== ("pending" as any) && request.status !== ("returned" as any) && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 px-2 text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200"
                      disabled={processingItems.has(item.id) || request.status === "returned"}
                      onClick={() =>
                        handleItemStatusChange(
                          item.id,
                          "returned",
                          request.request_batch_id
                        )
                      }
                    >
                      {processingItems.has(item.id) ? (
                        <LoaderIcon className="h-3 w-3 animate-spin" />
                      ) : (
                        <>Return</>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {canApprove && (
        <>
          <Separator />
          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              size="sm"
              disabled={request.status === "rejected"}
              onClick={() =>
                openRejectionDialog(
                  "batch",
                  undefined,
                  request.request_batch_id
                )
              }
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <XCircle className="h-4 w-4 mr-1" />
              Reject All
            </Button>
            <Button
              size="sm"
              disabled={request.status === "approved"}
              onClick={() =>
                handleBatchStatusChange(request.request_batch_id, "approved")
              }
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Approve All
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                setSelectedRequest(request);
                setIsEvalOpen(true);
              }}
            >
              <FileText className="h-4 w-4 mr-1" />
              Evaluate Request
            </Button>
          </div>
        </>
      )}
    </div>
  );

  return (
    <div className="space-y-6 p-1">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Property Requests Dashboard</h1>
          <p className="text-muted-foreground">
            Review and manage property requests from departments
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-sky-500" />
            <Badge variant="outline" className="text-sm">
              {getRoleDisplay(userRole)}
            </Badge>
          </div>
          <Badge variant="outline" className="text-sm">
            {dashboardStats.totalRequests} request
            {dashboardStats.totalRequests !== 1 ? "s" : ""}
          </Badge>
        </div>
      </div>

      {/* Enhanced Dashboard Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <Card className="bg-gradient-to-r from-sky-900 to-emerald-900 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-2xl font-bold">Total Requests</CardTitle>
            <FileText className="h-4 w-4 text-white/70" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboardStats.totalRequests}
            </div>
            <p className="text-xs text-white/70">
              {dashboardStats.totalItems} total items
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {dashboardStats.totalPending}
            </div>
            <p className="text-xs text-muted-foreground">
              {dashboardStats.pendingRate.toFixed(1)}% pending rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {dashboardStats.totalApproved}
            </div>
            <p className="text-xs text-muted-foreground">
              {dashboardStats.approvalRate.toFixed(1)}% approval rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {dashboardStats.totalRejected}
            </div>
            <p className="text-xs text-muted-foreground">
              {dashboardStats.rejectionRate.toFixed(1)}% rejection rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Partial</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {dashboardStats.totalPartial}
            </div>
            <p className="text-xs text-muted-foreground">
              Mixed approval status
            </p>
          </CardContent>
        </Card>
      </div>
      <div className="flex justify-end">
        <RequestProperty />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Latest Request - Large Card */}
        <div className="mb-4">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Latest Request
          </h2>
          <Card className={cn("shadow-lg border-2 border-sky-900")}>
            <CardHeader className="pb-2">
              <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:mt-0 mt-2 self-start sm:self-auto">
                {/* Left section: User Info */}
                <div className="space-y-2">
                  {/* Name + Phone */}
                  <div className="flex items-start gap-2">
                    <User className="h-6 w-6 text-primary" />
                    <div className="flex flex-col">
                      <p className="font-medium text-base leading-tight">
                        {latestRequest.requestor_full_name}
                      </p>
                      <p className="text-xs text-sky-500">
                        {latestRequest.phone_number}
                      </p>
                    </div>
                  </div>

                  {/* Department + Date */}
                  <div className="fle flex-col sm:flex-row space-y-2 sm:items-center sm:gap-6 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4" />
                      <span className="truncate font-kefa text-xs">
                        {latestRequest.department}
                      </span>
                    </div>
                    <div className="flex flex-col md:flex-row items-start md:items-center gap-2 text-green-500 font-semibold">
                      <Badge
                        variant="outline"
                        className="flex items-center gap-2 p-2 border-orange-500"
                      >
                        <Calendar className="h-4 w-4 text-amber-600" />
                        <span>
                          Request Date: {formatDate(latestRequest.created_at)}
                        </span>
                      </Badge>
                      <Badge
                        variant="outline"
                        className="flex items-center gap-2 p-2 border-orange-500"
                      >
                        <Calendar className="h-4 w-4  text-amber-600" />
                        <span>
                          Return Date: {formatDate(latestRequest.return_date)}
                        </span>
                      </Badge>
                    </div>
                  </div>
                  <p className="text-xs">
                    Event type: {latestRequest.event_type}
                  </p>
                  <Separator className="" />

                  {latestRequest.approved_by && (
                    <div>
                      {latestRequest.status === "approved" ||
                      latestRequest.status === "partial"
                        ? `Approved by: ${latestRequest.approved_by}`
                        : latestRequest.status === "rejected"
                        ? `Rejected by: ${latestRequest.approved_by}`
                        : null}
                      <div className="flex items-center gap-2">
                        <Shield className="h-5 w-5 text-sky-500" />
                        <Badge variant="outline" className="text-sm">
                          {getRoleDisplay(userRole)}
                        </Badge>
                      </div>
                    </div>
                  )}
                </div>

                {/* Right section: Status */}
                <div className="flex items-center gap-2 sm:mt-0 mt-2 self-start sm:self-auto">
                  {getStatusIcon(latestRequest.status)}
                  <Badge
                    variant={getStatusVariant(latestRequest.status)}
                    className="text-sm"
                  >
                    {latestRequest.status || "pending"}
                  </Badge>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs text-muted-foreground pt-4">
                <span className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  {
                    latestRequest.properties.filter(
                      (p) => p.status === "approved"
                    ).length
                  }{" "}
                  approved
                </span>
                <span className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-red-500 rounded-full" />
                  {
                    latestRequest.properties.filter(
                      (p) => p.status === "rejected"
                    ).length
                  }{" "}
                  rejected
                </span>
                <span className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                  {
                    latestRequest.properties.filter(
                      (p) => !p.status || p.status === "pending"
                    ).length
                  }{" "}
                  pending
                </span>
              </div>
            </CardHeader>

            <CardContent>
              <PropertyDetailView request={latestRequest} />
            </CardContent>
          </Card>
        </div>

        {/* Common Resources */}
        <div className="pt-11">
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                Most Requested Resources
                <Star
                  className="fill-amber-400 text-amber-400"
                  fill="ge-red-500"
                  size={16}
                />
                <Star
                  className="fill-amber-400 text-amber-400"
                  fill="ge-red-500"
                  size={16}
                />
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Top resources across all departments
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-5">
                {dashboardStats.commonResources
                  .slice(0, 5)
                  .map((resource, index) => (
                    <div
                      key={resource.name}
                      className="flex items-center justify-between p-5 bg-muted/50 rounded-lg"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex items-center justify-center min-w-6 min-h-6 w-6 h-6 bg-green-500 text-primary-foreground rounded-full text-xs font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium">{resource.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {resource.departments.join(" • ")}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline" className="font-mono">
                        {resource.count} requests
                      </Badge>
                    </div>
                  ))}
                {dashboardStats.commonResources.length === 0 && (
                  <p className="text-center text-muted-foreground py-4">
                    No resource data available
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Other Requests - Mini Cards with Pagination */}
      {otherRequests.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Previous Requests</h2>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
            {otherRequests.map((request) => (
              <Dialog
                key={request.request_batch_id}
                open={
                  isDialogOpen &&
                  selectedRequest?.request_batch_id === request.request_batch_id
                }
                onOpenChange={(open) => {
                  setIsDialogOpen(open);
                  if (!open) setSelectedRequest(null);
                }}
              >
                <DialogTrigger asChild>
                  <Card
                    className={cn(
                      "cursor-pointer hover:shadow-md transition-all duration-200 hover:scale-[1.02] border"
                    )}
                    onClick={() => {
                      setSelectedRequest(request);
                      setIsDialogOpen(true);
                    }}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <CardTitle className="text-sm font-medium truncate">
                            {request.requestor_full_name}
                          </CardTitle>
                          <p className="text-xs text-muted-foreground truncate font-kefa">
                            {request.department}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(request.status)}
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Items:</span>
                          <span className="font-medium">
                            {request.properties.length}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Status:</span>
                          <Badge
                            variant={getStatusVariant(request.status)}
                            className="text-xs h-5"
                          >
                            {request.status || "pending"}
                          </Badge>
                        </div>

                        <div className="text-xs text-green-500">
                          {formatDate(request.created_at)}
                        </div>

                        <div className="flex items-center gap-1 pt-1">
                          <Eye className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-sky-600 ">
                            Click to view details
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </DialogTrigger>

                <DialogContent className="w-full max-w-[95vw] sm:max-w-2xl max-h-[90vh] sm:max-h-[80vh] bg-card overflow-y-auto pt-12 hide-scrollbar rounded-xl">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-3">
                      <User className="h-10 w-10" />
                      <div className="sm:flex-row gap-3 pt3">
                        <p>{selectedRequest?.requestor_full_name}</p>
                        <p className="text-muted-foreground font-kefa text-xs pt-1">
                          {selectedRequest?.department}
                        </p>
                        <Separator />
                        {selectedRequest?.approved_by && (
                          <p>
                            {selectedRequest?.status === "approved" ||
                            selectedRequest?.status === "partial"
                              ? `Approved by: ${selectedRequest?.approved_by}`
                              : selectedRequest?.status === "rejected"
                              ? `Rejected by: ${selectedRequest?.approved_by}`
                              : null}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 ml-auto">
                        {getStatusIcon(selectedRequest?.status)}
                        <Badge
                          variant={getStatusVariant(selectedRequest?.status)}
                        >
                          {selectedRequest?.status || "pending"}
                        </Badge>
                      </div>
                    </DialogTitle>
                    <p className="text-sm text-muted-foreground">
                      Submitted on{" "}
                      <span className="text-green-500">
                        {selectedRequest &&
                          formatDate(selectedRequest.created_at)}
                      </span>
                    </p>
                  </DialogHeader>

                  {selectedRequest && (
                    <PropertyDetailView request={selectedRequest} />
                  )}
                </DialogContent>
              </Dialog>
            ))}
          </div>

          {/* Pagination Controls */}
          {hasMore && (
            <div className="flex justify-center">
              <Button
                variant="outline"
                onClick={() => loadRequests(currentPage + 1)}
                disabled={loadingMore}
                className="flex items-center gap-2"
              >
                {loadingMore ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
                Load More Requests
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Enhanced Rejection Reason Dialog */}
      <AlertDialog
        open={rejectionDialog.isOpen}
        onOpenChange={(open) =>
          setRejectionDialog((prev) => ({ ...prev, isOpen: open }))
        }
      >
        <AlertDialogContent className="max-w-2xl pt-12">
          <AlertDialogHeader>
            <AlertDialogTitle>
              Reject {rejectionDialog.type === "item" ? "Item" : "Request"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {rejectionDialog.type === "item"
                ? `Please provide a reason for rejecting "${rejectionDialog.itemName}".`
                : "Please provide a reason for rejecting this entire request."}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="py-4 space-y-4 overflow-auto max-h-[400px] hide-scrollbar">
            <div className="space-y-3">
              <Label className="text-sm font-medium">
                Select a common reason or provide custom reason:
              </Label>

              <RadioGroup
                value={useCustomReason ? "custom" : selectedCommonReason}
                onValueChange={(value) => {
                  if (value === "custom") {
                    setUseCustomReason(true);
                    setSelectedCommonReason("");
                  } else {
                    setUseCustomReason(false);
                    setSelectedCommonReason(value);
                    setRejectionReason("");
                  }
                }}
                className="grid grid-cols-1 sm:grid-cols-2 gap-3"
              >
                {COMMON_REJECTION_REASONS.map((reason) => (
                  <Label
                    key={reason}
                    htmlFor={reason}
                    className="flex items-center gap-2 p-2 border hover:border-pink-100 rounded-lg cursor-pointer transition-all hover:bg-muted/50 data-[state=checked]:bg-primary/100 data-[state=checked]:border-pink-500"
                  >
                    <RadioGroupItem
                      value={reason}
                      id={reason}
                      className="mt-0.5 hover:border-pink-500"
                    />
                    <span className="text-sm">{reason}</span>
                  </Label>
                ))}
                <Label
                  htmlFor="custom"
                  className="flex items-center gap-2 p-2 border rounded-lg cursor-pointer transition-all hover:bg-muted/50 data-[state=checked]:bg-primary/10 data-[state=checked]:border-primary"
                >
                  <RadioGroupItem
                    value="custom"
                    id="custom"
                    className="mt-0.5"
                  />
                  <span className="text-sm">Custom reason</span>
                </Label>
              </RadioGroup>
            </div>

            {useCustomReason && (
              <div className="space-y-2">
                <Label htmlFor="customReason" className="text-sm font-medium">
                  Custom rejection reason:
                </Label>
                <Textarea
                  id="customReason"
                  placeholder="Enter your custom rejection reason..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="min-h-[100px]"
                />
              </div>
            )}
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRejectionConfirm}
              className="bg-rose-700 hover:bg-red-700 text-white"
              disabled={
                !useCustomReason
                  ? !selectedCommonReason
                  : !rejectionReason.trim()
              }
            >
              Reject with Reason
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {isEvalOpen && selectedRequest && (
        <RequestEvaluationForm
          onClose={() => setIsEvalOpen(false)}
          request={selectedRequest}
        />
      )}
    </div>
  );
}
