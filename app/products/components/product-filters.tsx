"use client";

import { useEffect, useState } from "react";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { Calendar as CalendarIcon, X, FileSpreadsheet } from "lucide-react"; // Removed Search icon

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input"; // Input might not be used anymore, but keep for now
import { Calendar } from "@/components/ui/calendar";
import { DateRange } from "react-day-picker";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
// import { useDebounce } from "@/hooks/use-debounce"; // No longer needed here

interface ProductFiltersProps {
  onFilterChange: (filters: Omit<ProductFiltersState, 'search'>) => void; // Search removed from here
  onExport: () => void;
  loading?: boolean;
  currentSearch: string; // To pass current live search value to manual search
  onClearSearch: () => void; // Callback to clear search in parent
}

export interface ProductFiltersState {
  search: string; // Still exists, but managed by parent
  type: string;
  startDate?: string;
  endDate?: string;
  groupBy: string;
}

// Omit<ProductFiltersState, 'search'> is the type for the filters managed here
export function ProductFilters({ onFilterChange, onExport, loading, currentSearch, onClearSearch }: ProductFiltersProps) {
  // Local state for filters other than live search
  const [selectedType, setSelectedType] = useState<string>("all");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [period, setPeriod] = useState<string>("all");
  const [groupBy, setGroupBy] = useState<string>("none"); // none, box, pallet
  const [meterTypes, setMeterTypes] = useState<string[]>([]);

  // Fetch Meter Types on Mount
  useEffect(() => {
    fetch("/api/meter-types")
      .then((res) => res.json())
      .then(setMeterTypes)
      .catch(console.error);
  }, []);

  // Manual Trigger
  const handleManualSearch = () => {
    onFilterChange({
      type: selectedType,
      startDate: dateRange?.from ? startOfDay(dateRange.from).toISOString() : undefined,
      endDate: dateRange?.to ? endOfDay(dateRange.to).toISOString() : undefined,
      groupBy
    });
  };
  
  const handlePeriodChange = (value: string) => {
    setPeriod(value);
    const today = new Date();
    switch (value) {
      case "daily":
        setDateRange({ from: today, to: today });
        break;
      case "weekly":
        setDateRange({ from: subDays(today, 7), to: today });
        break;
      case "monthly":
        setDateRange({ from: subDays(today, 30), to: today });
        break;
      case "yearly":
        setDateRange({ from: subDays(today, 365), to: today });
        break;
      case "all":
        setDateRange(undefined);
        break;
      case "custom": // Added custom period for manual date range selection
        break;
    }
  };

  const clearFilters = () => {
    // setSearch(""); // Search managed by parent now
    onClearSearch(); // Clear search in parent
    setSelectedType("all");
    setPeriod("all");
    setGroupBy("none");
    setDateRange(undefined);
    onFilterChange({
        type: "all",
        startDate: undefined,
        endDate: undefined,
        groupBy: "none"
    });
  };

  return (
    <div className="bg-card p-4 rounded-lg border shadow-sm space-y-4">
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
             <div className="flex items-center gap-2 w-full overflow-x-auto">
                 {/* Group By Selector */}
                <div className="min-w-[120px]">
                     <Select value={groupBy} onValueChange={setGroupBy}>
                        <SelectTrigger>
                        <SelectValue placeholder="Group By" />
                        </SelectTrigger>
                        <SelectContent>
                        <SelectItem value="none">No Grouping</SelectItem>
                        <SelectItem value="box">Group by Box</SelectItem>
                        <SelectItem value="pallet">Group by Pallet</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                 {/* Meter Type */}
                <div className="min-w-[120px]">
                    <Select value={selectedType} onValueChange={setSelectedType}>
                        <SelectTrigger>
                        <SelectValue placeholder="Select Type" />
                        </SelectTrigger>
                        <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        {meterTypes.map((type) => (
                            <SelectItem key={type} value={type}>
                            {type}
                            </SelectItem>
                        ))}
                        </SelectContent>
                    </Select>
                </div>
                 
                 {/* Period */}
                 <div className="min-w-[120px]">
                    <Select value={period} onValueChange={handlePeriodChange}>
                        <SelectTrigger>
                        <SelectValue placeholder="Select Period" />
                        </SelectTrigger>
                        <SelectContent>
                        <SelectItem value="all">All Time</SelectItem>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="yearly">Yearly</SelectItem>
                        </SelectContent>
                    </Select>
                 </div>
                 
                 {/* Date Range */}
                  <Popover>
                    <PopoverTrigger asChild>
                    <Button
                        variant={"outline"}
                        className={cn(
                        "w-[240px] justify-start text-left font-normal",
                        !dateRange && "text-muted-foreground"
                        )}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateRange?.from ? (
                        dateRange.to ? (
                            <>
                            {format(dateRange.from, "LLL dd, y")} -{" "}
                            {format(dateRange.to, "LLL dd, y")}
                            </>
                        ) : (
                            format(dateRange.from, "LLL dd, y")
                        )
                        ) : (
                        <span>Pick a date</span>
                        )}
                    </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="end">
                    <Calendar
                        initialFocus
                        mode="range"
                        defaultMonth={dateRange?.from}
                        selected={dateRange}
                        onSelect={(range) => {
                             setDateRange(range);
                             if (period !== 'all' && period !== 'custom') setPeriod('custom');
                        }}
                        numberOfMonths={2}
                    />
                    </PopoverContent>
                </Popover>

                <Button onClick={handleManualSearch} disabled={loading}>
                    Search
                </Button>

                {/* Export Button */}
                <Button variant="outline" onClick={onExport} disabled={loading} title="Export Excel">
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    Export Excel
                </Button>

                 {(currentSearch || selectedType !== "all" || period !== "all" || dateRange || groupBy !== 'none') && (
                    <Button variant="ghost" size="icon" onClick={clearFilters} title="Clear Filters">
                         <X className="h-4 w-4" />
                    </Button>
                 )}
             </div>
        </div>
    </div>
  );
}