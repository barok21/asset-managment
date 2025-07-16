"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { CalendarIcon } from "lucide-react"

// Ethiopian calendar conversion (no external modules)
const JD_EPOCH_OFFSET_GREGORIAN = 1723856;
const JD_EPOCH_OFFSET_ETHIOPIAN = 1723856 + 365;

function toJulian(year: number, month: number, day: number): number {
  return (
    JD_EPOCH_OFFSET_ETHIOPIAN +
    365 * (year - 1) +
    Math.floor(year / 4) +
    30 * (month - 1) +
    day - 1
  );
}

function fromJulian(jdn: number): Date {
  let a = jdn + 32044;
  let b = Math.floor((4 * a + 3) / 146097);
  let c = a - Math.floor((146097 * b) / 4);
  let d = Math.floor((4 * c + 3) / 1461);
  let e = c - Math.floor((1461 * d) / 4);
  let m = Math.floor((5 * e + 2) / 153);
  let day = e - Math.floor((153 * m + 2) / 5) + 1;
  let month = m + 3 - 12 * Math.floor(m / 10);
  let year = 100 * b + d - 4800 + Math.floor(m / 10);
  return new Date(year, month - 1, day);
}

function toEthiopian(date: Date): [number, number, number] {
  const jd =
    Math.floor(
      (date.getTime() - new Date(Date.UTC(1, 0, 1)).getTime()) / 86400000
    ) + 1721426;
  const r = jd - JD_EPOCH_OFFSET_ETHIOPIAN;
  const year = Math.floor(r / 1461) * 4 + Math.floor((r % 1461) / 365) + 1;
  const dayOfYear = r % 365;
  const month = Math.floor(dayOfYear / 30) + 1;
  const day = (dayOfYear % 30) + 1;
  return [year, month, day];
}

function toGregorian(year: number, month: number, day: number): Date {
  return fromJulian(toJulian(year, month, day));
}

const ethiopianMonths = [
  "መስከረም", "ጥቅምት", "ኅዳር", "ታህሳስ",
  "ጥር", "የካቲት", "መጋቢት", "ሚያዝያ",
  "ግንቦት", "ሰኔ", "ሐምሌ", "ነሃሴ", "ጳጉሜን"
];

const today = new Date();
const [initYear, initMonth, initDay] = toEthiopian(today);

export function EthiopianCalendarPicker() {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [year, setYear] = useState(initYear);
  const [month, setMonth] = useState(initMonth);

  const daysInMonth = month === 13 ? (year % 4 === 3 ? 6 : 5) : 30;

  const handleDaySelect = (day: number) => {
    const date = toGregorian(year, month, day);
    setSelectedDate(date);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-[250px] justify-start text-left font-normal">
          <CalendarIcon className="mr-2 h-4 w-4" />
          {selectedDate ? (() => {
            const [y, m, d] = toEthiopian(selectedDate);
            return `${ethiopianMonths[m - 1]} ${d}, ${y}`;
          })() : <span>ቀን ይምረጡ</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-4">
        <div className="flex gap-2 mb-4">
          <Select value={month.toString()} onValueChange={(val) => setMonth(Number(val))}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="ወር" />
            </SelectTrigger>
            <SelectContent>
              {ethiopianMonths.map((name, idx) => (
                <SelectItem key={idx} value={(idx + 1).toString()}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={year.toString()} onValueChange={(val) => setYear(Number(val))}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="ዓመት" />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 20 }, (_, i) => year - 10 + i).map((y) => (
                <SelectItem key={y} value={y.toString()}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => (
            <button
              key={day}
              onClick={() => handleDaySelect(day)}
              className={cn(
                "rounded text-sm p-2 hover:bg-accent",
                selectedDate && (() => {
                  const [ey, em, ed] = toEthiopian(selectedDate);
                  return ey === year && em === month && ed === day ? "bg-primary text-white" : ""
                })()
              )}
            >
              {day}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}