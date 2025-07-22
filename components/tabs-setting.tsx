"use client";

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

import AllDepartmentList from "./all-departments";
import CreateDept from "./create-dept";

const SettingTab = () => {
  const [tabValue, setTabValue] = React.useState("outline");

  return (
    <Tabs
      value={tabValue}
      onValueChange={setTabValue}
      className="w-full flex-col gap-6"
    >
      <div className="flex items-center justify-between px-4 lg:px-6 py-2 gap-2 flex-wrap">
        {/* Mobile View Selector */}
        <div className="w-full @4xl/main:hidden">
          <Label htmlFor="view-selector" className="sr-only">
            View
          </Label>
          <Select value={tabValue} onValueChange={setTabValue}>
            <SelectTrigger id="view-selector" className="w-full sm:w-fit">
              <SelectValue placeholder="Select a view" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="outline">Departments</SelectItem>
              <SelectItem value="past-performance">
                Create Department
              </SelectItem>
              <SelectItem value="key-personnel">Key Personnel</SelectItem>
              <SelectItem value="focus-documents">Focus Documents</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Desktop Tab List */}
        <TabsList className="hidden @4xl/main:flex flex-wrap">
          <TabsTrigger value="outline">Departments</TabsTrigger>
          <TabsTrigger value="past-performance">Create Department</TabsTrigger>
          <TabsTrigger value="key-personnel">
            Tab 3 <Badge variant="secondary">2</Badge>
          </TabsTrigger>
          <TabsTrigger value="focus-documents">Tab 4</TabsTrigger>
        </TabsList>
      </div>

      {/* Tab Contents */}
      <TabsContent value="outline" className="px-4 lg:px-6">
        <AllDepartmentList />
      </TabsContent>

      <TabsContent value="past-performance" className="px-4 lg:px-6">
        <CreateDept />
      </TabsContent>

      <TabsContent value="key-personnel" className="px-4 lg:px-6">
        <div className="w-full rounded-lg border border-dashed p-4 text-muted-foreground">
          Content for Tab 3
        </div>
      </TabsContent>

      <TabsContent value="focus-documents" className="px-4 lg:px-6">
        <div className="w-full rounded-lg border border-dashed p-4 text-muted-foreground">
          Content for Tab 4
        </div>
      </TabsContent>
    </Tabs>
  );
};

export default SettingTab;
