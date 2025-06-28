import { AppSidebar } from "@/components/app-sidebar"
import { DataTable } from "@/components/data-table";
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import data from "../dashboard/data.json"
import { getAllProperties } from "@/lib/actions/property.action";
import { columns } from "@/components/columns";
import { DataTableNew } from "../../components/datatable";
import { Badge } from "@/components/ui/badge";
import { Card, CardAction, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { IconTrendingUp } from "@tabler/icons-react";
const PropertyList = async ({searchParams}: SearchParams) => {
  const filters = await searchParams;
  const category = filters.category ? filters.category : '' 

  const {property, total} = await getAllProperties({category});

  console.log('Params:' , property)
  return (
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
              <div className="px-12 lg:px-6">
              {/* {property.map((propertyItem, index) => (
              <div key={index}>{propertyItem.name}</div> ))} */}
                {/* <ChartAreaInteractive /> */}
        <div className="size-60">
                 <Card className="@container/card">
        <CardHeader>
          <CardDescription>Total Property</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {total}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconTrendingUp />
              +12.5%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Trending up this month <IconTrendingUp className="size-4" />
          </div>
          <div className="text-muted-foreground">
            Visitors for the last 6 months
          </div>
        </CardFooter>
      </Card>
        </div>
              </div>
              Total Property : {total}
              <DataTableNew columns={columns} data={property} />
        </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

export default PropertyList