import { AppSidebar } from "@/components/app-sidebar";
import OnboardingWrapper from "@/components/onboarding-wrapper";
import RequestProperty from "@/components/request-property";
import RequestedPropertiesTable from "@/components/RequestedPropertiesTable";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export default function Page() {
  return (
    <OnboardingWrapper>
      <SidebarProvider
        style={
          {
            "--sidebar-width": "calc(var(--spacing) * 72)",
            "--header-height": "calc(var(--spacing) * 12)",
          } as React.CSSProperties
        }
      >
        {/* Sidebar can be enabled here if needed */}
        <AppSidebar variant="inset" />

        <SidebarInset>
          <SiteHeader />

          <main className="flex flex-1 flex-col @container/main px-4 md:px-6 lg:px-8 py-4 md:py-6 gap-6">
            {/* Request Property Dialog Form */}
            {/* <div className="flex justify-end">
            <RequestProperty />
          </div> */}

            {/* Requested Properties Table */}
            <section className="w-full">
              <RequestedPropertiesTable />
            </section>
          </main>
        </SidebarInset>
      </SidebarProvider>
    </OnboardingWrapper>
  );
}
