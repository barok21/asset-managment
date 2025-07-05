import * as React from "react";
import {
  IconChevronDown,
  IconLayoutColumns,
  IconPlus,
} from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import MyForm from "./propertyForm";
import ResourceRequestForm from "./resource-request-form";
import BulkPropertyForm from "./propertyForm";
import AllProperty from "./all-property";
import AllPropertyList from "./all-property";
import CreateDept from "./create-dept";
import AllDept from "./all-dept";

const SettingTab = () => {
  return (
    <Tabs
      defaultValue="outline"
      className="w-full flex-col justify-start gap-6"
    >
      <div className="flex items-center justify-between px-4 lg:px-6">
        <Label htmlFor="view-selector" className="sr-only">
          View
        </Label>
        <Select defaultValue="outline">
          <SelectTrigger
            className="flex w-fit @4xl/main:hidden"
            size="sm"
            id="view-selector"
          >
            <SelectValue placeholder="Select a view" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="outline">Outline</SelectItem>
            <SelectItem value="past-performance">Register Property</SelectItem>
            <SelectItem value="key-personnel">Key Personnel</SelectItem>
            <SelectItem value="focus-documents">Focus Documents</SelectItem>
          </SelectContent>
        </Select>
        <TabsList className="**:data-[slot=badge]:bg-muted-foreground/30 hidden **:data-[slot=badge]:size-5 **:data-[slot=badge]:rounded-full **:data-[slot=badge]:px-1 @4xl/main:flex">
          <TabsTrigger value="outline">Departments</TabsTrigger>
          <TabsTrigger value="past-performance">
            Create Department
            {/* <Badge variant="secondary">3</Badge> */}
          </TabsTrigger>
          <TabsTrigger value="key-personnel">
            Tab 3 <Badge variant="secondary">2</Badge>
          </TabsTrigger>
          <TabsTrigger value="focus-documents">Tab 4</TabsTrigger>
        </TabsList>
      </div>
      {/*  */}

      <TabsContent value="outline" className="flex flex-col px-4 lg:px-6">
        <div className="aspect-video w-full flex-1">
          <div className="">
            <AllDept />
            {/* <AllPropertyList /> */}
          </div>
        </div>
      </TabsContent>
      <TabsContent
        value="past-performance"
        className="flex flex-col px-4 lg:px-6"
      >
        <div className="aspect-video w-full flex-1">
          <CreateDept />
          {/* <BulkPropertyForm /> */}
        </div>
      </TabsContent>

      <TabsContent value="key-personnel" className="flex flex-col px-4 lg:px-6">
        <div className="aspect-video w-full flex-1 rounded-lg border border-dashed"></div>
      </TabsContent>

      <TabsContent
        value="focus-documents"
        className="flex flex-col px-4 lg:px-6"
      >
        <div className="aspect-video w-full flex-1 rounded-lg border border-dashed"></div>
      </TabsContent>
    </Tabs>
  );
};

export default SettingTab;
