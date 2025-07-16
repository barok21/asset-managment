"use client"

import * as React from "react"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { TimerIcon } from "lucide-react"

interface CalendarFormProps {
  startDate: string
  endDate: string
  onStartDateChange: (val: string) => void
  onEndDateChange: (val: string) => void
  startTime: string
  endTime: string
  onStartTimeChange: (val: string) => void
  onEndTimeChange: (val: string) => void
}

export function Calendar04({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  startTime,
  endTime,
  onStartTimeChange,
  onEndTimeChange,
}: CalendarFormProps) {
  const [open, setOpen] = React.useState(false)

  const from = startDate ? new Date(startDate) : undefined
  const to = endDate ? new Date(endDate) : undefined

  // Automatically close the popover if all values are set
  React.useEffect(() => {
    if (startDate && endDate && startTime && endTime) {
      setOpen(false)
    }
  }, [startDate, endDate, startTime, endTime])

  const handleRangeChange = (range: { from?: Date; to?: Date } | undefined) => {
    if (!range) return
    if (range.from) {
      onStartDateChange(range.from.toISOString().split("T")[0])
    }
    if (range.to) {
      onEndDateChange(range.to.toISOString().split("T")[0])
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="justify-start text-left w-full">
          {from ? (
            <span className="flex items-start gap-2">
              <span>{from.toLocaleDateString()} – {to?.toLocaleDateString() || "..."}</span>
              <span className="flex items-center gap-2 text-sm text-muted-foreground">
                <p><TimerIcon className="w-4 h-4 text-sky-500" /></p>
                <p>{startTime || "--:--"} - {endTime || "--:--"}</p> 
              </span>
            </span>
          ) : (
            "Select event date and time"
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Card className="w-fit py-4">
          <CardContent className="px-4">
            <Calendar
              mode="range"
              defaultMonth={from}
              selected={{ from, to }}
              onSelect={handleRangeChange}
              className="rounded-lg border shadow-sm"
            />
          </CardContent>
          <CardFooter className="flex gap-2 border-t px-4 !pt-4 *:[div]:w-full">
            <div>
              <Label htmlFor="time-from" className="sr-only">Start Time</Label>
              <Input
                id="time-from"
                type="time"
                value={startTime || ""}
                onChange={(e) => onStartTimeChange(e.target.value)}
                className="appearance-none"
                step="60"
              />
            </div>
            <span>-</span>
            <div>
              <Label htmlFor="time-to" className="sr-only">End Time</Label>
              <Input
                id="time-to"
                type="time"
                value={endTime || ""}
                onChange={(e) => onEndTimeChange(e.target.value)}
                className="appearance-none"
                step="60"
              />
            </div>
          </CardFooter>
        </Card>
      </PopoverContent>
    </Popover>
  )
}
