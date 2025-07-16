import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import OnboardingWrapper from "@/components/onboarding-wrapper"
import UserRoleManagement from "@/components/user-role-management"
import { getUserRole } from "@/lib/actions/user.action"
import RequestedPropertyAdminCards from "@/components/RequestedPropertiesTable"
import RequestProperty from "@/components/request-property"

export default async function DashboardPage() {
  const { userId } = await auth()

  if (!userId) {
    redirect("/sign-in")
  }

  const userRole = await getUserRole()
  const canManageRoles = ["higher_manager", "admin"].includes(userRole)

  return (
    <OnboardingWrapper>
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto py-8">
          <div className="space-y-8">
            Property Requests Dashboard
            <RequestedPropertyAdminCards />
            {/* Role Management (only for higher management) */}
            {canManageRoles && (
              <div className="mt-12">
                <RequestProperty/>
                <UserRoleManagement currentUserRole={userRole} />
              </div>
            )}
          </div>
        </div>
      </div>
    </OnboardingWrapper>
  )
}
