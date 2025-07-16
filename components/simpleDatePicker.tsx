"use client";

import * as React from "react";
import { Calendar } from "@/components/ui/calendar";

interface SingleDatePickerProps {
  selected: Date | undefined;
  onChange: (value: string) => void;
  onSelect?: (value: string) => void;
}

export function SingleDatePicker({
  selected,
  onChange,
  onSelect,
}: SingleDatePickerProps) {
  return (
    <Calendar
      mode="single"
      selected={selected}
      onSelect={(date) => {
        if (date) {
          const isoDate = date.toISOString();
          onChange(isoDate);
          onSelect?.(isoDate);
        }
      }}
      className="rounded-md border"
    />
  );
}
