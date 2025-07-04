import PropertyForm from '@/components/propertyForm'
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { ChartLineDotsCustom } from '@/components/chart'
import Tab from '@/components/tabs'


const NewProperty = async () => {
  const {userId} = await auth()
  if(!userId) redirect('./sign-in');
  return (
    
    <main>
        <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              {/* <SectionCards /> */}
              <Tab/>
              <div className="px-12 lg:px-6">
              <article>
            {/* <h1>Property Registration</h1> */}
            
            <PropertyForm/>
              </article>
                {/* <ChartAreaInteractive /> */}
              </div>
              {/* <DataTable data={data} /> */}
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
        
    </main>
  )
  
}

export default NewProperty


