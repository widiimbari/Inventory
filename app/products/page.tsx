"use client";

import { useEffect, useState, useCallback } from "react";
import { useDebounce } from "@/hooks/use-debounce";
import { CellAction } from "./components/cell-action";
import { DataTable, DataTableColumn } from "@/components/ui/data-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Search, FileSpreadsheet, X, ArrowRight, Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { DateRange } from "react-day-picker";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { cn } from "@/lib/utils";
import { TableRow, TableCell } from "@/components/ui/table";

interface ProductFiltersState {
  searchScope: string;
  startSerial: string;
  endSerial: string;
  type: string;
  startDate?: string;
  endDate?: string;
}

interface OutputStats {
    totalOutput: number;
    lineStats: { line: string; count: number; target: number; performance: number }[];
    detailedStats: {
        tanggal: string;
        tahun: number;
        line: string;
        type: string;
        total_output: number;
        total_bigbox: number;
        total_pallet: number;
        target: number;
        percentage: number;
    }[];
}

export default function ProductsPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [rowCount, setRowCount] = useState(0);
  
  // Stats State
  const [stats, setStats] = useState<OutputStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);

  // Filter States
  const [searchScope, setSearchScope] = useState("serial");
  const [startSerial, setStartSerial] = useState("");
  const [endSerial, setEndSerial] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [period, setPeriod] = useState<string>("all"); // Added Period state back
  const [meterTypes, setMeterTypes] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  // Debounced Search for Type Detection
  const debouncedStartSerial = useDebounce(startSerial, 500);
  const debouncedEndSerial = useDebounce(endSerial, 500);
  const [detectedStartTypes, setDetectedStartTypes] = useState<string[]>([]);
  const [detectedEndTypes, setDetectedEndTypes] = useState<string[]>([]);
  const [searchWarning, setSearchWarning] = useState<string | null>(null);

  // Effect: Detect Type for Start Serial
  useEffect(() => {
    if (!debouncedStartSerial) {
        setDetectedStartTypes([]);
        setSearchWarning(null);
        return;
    }
    fetch(`/api/detect-type?serial=${encodeURIComponent(debouncedStartSerial)}`)
        .then(res => res.json())
        .then(data => setDetectedStartTypes(data.types))
        .catch(console.error);
  }, [debouncedStartSerial]);

  // Effect: Detect Type for End Serial
  useEffect(() => {
    if (!debouncedEndSerial) {
        setDetectedEndTypes([]);
        setSearchWarning(null);
        return;
    }
    fetch(`/api/detect-type?serial=${encodeURIComponent(debouncedEndSerial)}`)
        .then(res => res.json())
        .then(data => setDetectedEndTypes(data.types))
        .catch(console.error);
  }, [debouncedEndSerial]);

  // Current Active Filters (for fetching)
  const [currentFilters, setCurrentFilters] = useState<ProductFiltersState>({
    searchScope: "serial",
    startSerial: "",
    endSerial: "",
    type: "all",
    startDate: undefined,
    endDate: undefined
  });

  // Pagination State
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });
  
  const [hasSearched, setHasSearched] = useState(false);

  // Fetch Meter Types
  useEffect(() => {
    fetch("/api/meter-types")
      .then((res) => res.json())
      .then(setMeterTypes)
      .catch(console.error);
  }, []);

  // Fetch Product List
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: (pagination.pageIndex + 1).toString(),
        limit: pagination.pageSize.toString(),
      });

      params.append("searchScope", currentFilters.searchScope);

      if (currentFilters.startSerial && currentFilters.endSerial) {
          params.append("startSerial", currentFilters.startSerial);
          params.append("endSerial", currentFilters.endSerial);
      } else if (currentFilters.startSerial) {
          params.append("startSerial", currentFilters.startSerial); 
      }

      if (currentFilters.type && currentFilters.type !== "all") {
        params.append("type", currentFilters.type);
      }

      const res = await fetch(`/api/products?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const result = await res.json();

      setRows(result.data);
      setRowCount(result.metadata.total);
    } catch (error) {
      console.error("Failed to fetch products:", error);
    } finally {
      setLoading(false);
    }
  }, [pagination, currentFilters]);

  // Fetch Output Stats
  const fetchStats = useCallback(async () => {
      if (!currentFilters.startDate || !currentFilters.endDate) return;
      
      setLoadingStats(true);
      try {
        const params = new URLSearchParams();
        params.append("startDate", currentFilters.startDate);
        params.append("endDate", currentFilters.endDate);
        if (currentFilters.type && currentFilters.type !== "all") {
            params.append("type", currentFilters.type);
        }

        const res = await fetch(`/api/products/stats?${params}`);
        if (res.ok) {
            setStats(await res.json());
        }
      } catch (error) {
          console.error("Failed to fetch stats:", error);
      } finally {
          setLoadingStats(false);
      }
  }, [currentFilters]);

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
      case "custom": 
        break;
    }
  };

  const handleApplyFilters = () => {
      setSearchWarning(null);
      let autoScope = searchScope;

      // 1. Optimize Scope based on Start Serial
      if (startSerial && detectedStartTypes.length > 0) {
          // If current scope is not in detected types, switch to the first detected type
          if (!detectedStartTypes.includes(searchScope)) {
               autoScope = detectedStartTypes[0]; 
          }
      }

      // 2. Validate Range if End Serial is present
      if (startSerial && endSerial) {
          if (detectedStartTypes.length > 0 && detectedEndTypes.length > 0) {
             const commonTypes = detectedStartTypes.filter(t => detectedEndTypes.includes(t));
             
             if (commonTypes.length === 0) {
                 // Mismatch found
                 const startTypeStr = detectedStartTypes.join(' or ');
                 const endTypeStr = detectedEndTypes.join(' or ');
                 setSearchWarning(`Range Mismatch: Start is '${startTypeStr}' but End is '${endTypeStr}'. Please ensure both are the same type.`);
                 return; // Stop search
             } else {
                 // Refine scope to the common type
                 autoScope = commonTypes[0];
             }
          }

          // Prefix Validation (Warn if prefixes are drastically different)
          if (startSerial.length >= 3 && endSerial.length >= 3) {
             const startPrefix = startSerial.substring(0, 3);
             const endPrefix = endSerial.substring(0, 3);
             if (startPrefix !== endPrefix) {
                 setSearchWarning(`Prefix Mismatch: Start '${startPrefix}' vs End '${endPrefix}'. Are you sure this is a valid range?`);
                 // We don't return here, just warn. The backend optimization handles the performance.
             }
          }
      }

      setSearchScope(autoScope);
      setPagination(prev => ({ ...prev, pageIndex: 0 }));
      setHasSearched(true);
      
      setCurrentFilters({
          searchScope: autoScope,
          startSerial,
          endSerial,
          type: selectedType,
          startDate: dateRange?.from ? startOfDay(dateRange.from).toISOString() : undefined,
          endDate: dateRange?.to ? endOfDay(dateRange.to).toISOString() : undefined,
      });
  };

  const handleClearFilters = () => {
      setSearchScope("serial");
      setStartSerial("");
      setEndSerial("");
      setSelectedType("all");
      setPeriod("all");
      setDateRange(undefined);
      
      setCurrentFilters({
          searchScope: "serial",
          startSerial: "",
          endSerial: "",
          type: "all",
          startDate: undefined,
          endDate: undefined
      });
      setHasSearched(false);
      setRows([]);
      setRowCount(0);
      setStats(null);
  };

  const handleExport = () => {
    const params = new URLSearchParams();
    if (currentFilters.startDate && currentFilters.endDate) {
        params.append("startDate", currentFilters.startDate);
        params.append("endDate", currentFilters.endDate);
    } 
    
    params.append("searchScope", currentFilters.searchScope);
    
    if (currentFilters.startSerial) {
         if (currentFilters.endSerial) {
            params.append("startSerial", currentFilters.startSerial);
            params.append("endSerial", currentFilters.endSerial);
         } else {
            params.append("search", currentFilters.startSerial);
         }
    }
    if (currentFilters.type && currentFilters.type !== "all") {
       params.append("type", currentFilters.type);
    }
    window.open(`/api/export?${params.toString()}`, '_blank');
  };

  const handlePageChange = (pageIndex: number) => {
      setPagination(prev => ({ ...prev, pageIndex }));
  };

  const handlePageSizeChange = (pageSize: number) => {
      setPagination({ pageIndex: 0, pageSize });
  };

  // Effect to trigger fetch based on what is active
  useEffect(() => {
      if (hasSearched) {
          // If Date Range is active -> Output Mode
          if (currentFilters.startDate && currentFilters.endDate) {
              fetchStats();
          } 
          // Else -> Product List Mode
          else {
              fetchData();
          }
      }
  }, [pagination, currentFilters, fetchData, fetchStats, hasSearched]);

  // Determine View Mode
  const isOutputMode = !!(currentFilters.startDate && currentFilters.endDate) && !currentFilters.startSerial;

  const productColumns: DataTableColumn<any>[] = [
      {
          id: 'no',
          header: 'No',
          width: 50,
          cell: ({ row }) => {
              const rowIndex = rows.indexOf(row);
              return (pagination.pageIndex * pagination.pageSize) + rowIndex + 1;
          }
      },
      { accessorKey: 'serial', header: 'Serial Number' },
      { accessorKey: 'module_serial', header: 'Module Serial' },
      { 
        accessorKey: 'timestamp', 
        header: 'Tanggal', 
        cell: ({ value }) => new Date(value).toLocaleString("id-ID", { timeZone: "UTC" })
      },
      { accessorKey: 'line', header: 'Line' },
      { accessorKey: 'type', header: 'Type' },
      { accessorKey: 'box_serial', header: 'Serial Box' },
      { accessorKey: 'pallet_serial', header: 'Serial Pallet' },
      { 
          accessorKey: 'status', 
          header: 'Status',
          cell: ({ value }) => (
              <Badge variant={value === 'Delivery' ? "default" : "secondary"} className={value === 'Delivery' ? "bg-green-600" : "bg-blue-600"}>
                  {value}
              </Badge>
          )
      },
      { accessorKey: 'area', header: 'Area' },
      {
        id: "actions",
        header: "Actions",
        width: 100,
        cell: ({ row }) => <CellAction data={row} />,
      },
  ];

  const outputColumns: DataTableColumn<any>[] = [
      {
          id: 'no',
          header: 'No',
          width: 50,
          cell: ({ row }) => {
              const rowIndex = stats?.detailedStats.indexOf(row) || 0;
              return rowIndex + 1;
          }
      },
      { accessorKey: 'tanggal', header: 'Tanggal' },
      { accessorKey: 'line', header: 'Line' },
      { accessorKey: 'type', header: 'Type' },
      { accessorKey: 'total_output', header: 'Total Output' },
      { accessorKey: 'total_bigbox', header: 'Total Bigbox' },
      { accessorKey: 'total_pallet', header: 'Total Pallet' },
      { accessorKey: 'target', header: 'Target' },
      { 
          accessorKey: 'percentage', 
          header: 'Percentage',
          cell: ({ value }) => (
              <div className="flex items-center gap-2">
                  <div className="w-16 bg-slate-100 rounded-full h-2">
                      <div 
                          className={cn(
                              "h-full rounded-full",
                              value >= 100 ? "bg-emerald-500" : value >= 80 ? "bg-blue-500" : "bg-amber-500"
                          )}
                          style={{ width: `${Math.min(100, value)}%` }}
                      />
                  </div>
                  <span className="text-xs font-bold">{value}%</span>
              </div>
          )
      },
  ];

  return (
    <div className="container mx-auto py-10 space-y-6">
      
      <div className="flex justify-between items-end">
        <h1 className="text-3xl font-bold">Products</h1>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border shadow-sm flex flex-col xl:flex-row gap-4 items-end xl:items-center">
        
        <div className="flex flex-1 w-full gap-2 items-center flex-wrap">
            {/* Serial Range Inputs */}
            <div className="flex flex-col gap-1 flex-1 min-w-[200px]">
                <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                        <Input 
                            placeholder="Serial / Module / Box / Pallet..." 
                            value={startSerial}
                            onChange={(e) => setStartSerial(e.target.value)}
                            className={cn("bg-slate-50 border-slate-200", detectedStartTypes.length > 0 && "border-blue-300 ring-1 ring-blue-100")}
                        />
                         {detectedStartTypes.length > 0 && startSerial && (
                            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                                {detectedStartTypes.map(t => (
                                    <Badge key={t} variant="secondary" className="h-5 px-1 text-[10px] bg-blue-100 text-blue-700 hover:bg-blue-100">
                                        {t}
                                    </Badge>
                                ))}
                            </div>
                        )}
                    </div>
                    <ArrowRight className="h-4 w-4 text-slate-400 shrink-0" />
                    <div className="relative flex-1">
                        <Input 
                            placeholder="End Serial..." 
                            value={endSerial}
                            onChange={(e) => setEndSerial(e.target.value)}
                            className={cn("bg-slate-50 border-slate-200", detectedEndTypes.length > 0 && "border-blue-300 ring-1 ring-blue-100")}
                        />
                         {detectedEndTypes.length > 0 && endSerial && (
                            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                                {detectedEndTypes.map(t => (
                                    <Badge key={t} variant="secondary" className="h-5 px-1 text-[10px] bg-blue-100 text-blue-700 hover:bg-blue-100">
                                        {t}
                                    </Badge>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
                {searchWarning && (
                    <p className="text-xs text-red-600 font-medium px-1">{searchWarning}</p>
                )}
            </div>

            <div className="h-8 w-px bg-slate-200 hidden xl:block mx-2"></div>

            {/* Type Selector */}
            <div className="w-[140px]">
                <Select value={selectedType} onValueChange={setSelectedType}>
                    <SelectTrigger className="bg-slate-50 border-slate-200">
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

            {/* Period Selector */}
            <div className="w-[120px]">
                <Select value={period} onValueChange={handlePeriodChange}>
                    <SelectTrigger className="bg-slate-50 border-slate-200">
                        <SelectValue placeholder="Period" />
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
            <div className="w-[220px]">
                <Popover>
                    <PopoverTrigger asChild>
                    <Button
                        variant={"outline"}
                        className={cn(
                        "w-full justify-start text-left font-normal bg-slate-50 border-slate-200",
                        !dateRange && "text-muted-foreground"
                        )}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateRange?.from ? (
                        dateRange.to ? (
                            <>
                            {format(dateRange.from, "dd/MM/y")} - {format(dateRange.to, "dd/MM/y")}
                            </>
                        ) : (
                            format(dateRange.from, "dd/MM/y")
                        )
                        ) : (
                        <span>Pick Date</span>
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
            </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
            <Button onClick={handleApplyFilters} disabled={loading || loadingStats} className="bg-slate-900 text-white hover:bg-slate-800">
                <Search className="h-4 w-4 mr-2" />
                Search
            </Button>

            <Button variant="outline" onClick={handleExport} disabled={loading} title="Export Excel">
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Export
            </Button>

             {(startSerial || endSerial || selectedType !== "all" || dateRange) && (
                <Button variant="ghost" size="icon" onClick={handleClearFilters} title="Clear Filters" className="text-red-500 hover:text-red-700 hover:bg-red-50">
                     <X className="h-4 w-4" />
                </Button>
             )}
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {/* Output Summary Mode */}
        {isOutputMode && stats ? (
            <Card className="shadow-md border-none">
                <CardContent className="p-0">
                    <DataTable
                        data={stats.detailedStats}
                        loading={loadingStats}
                        columns={outputColumns}
                        footer={
                            <TableRow className="bg-slate-100/50 font-bold border-t-2 border-slate-300">
                                <TableCell colSpan={4} className="text-center py-4 px-4 text-sm font-bold uppercase text-slate-600">Total Keseluruhan</TableCell>
                                <TableCell className="bg-primary/5 text-primary text-base font-bold py-4 px-4 border-x border-slate-200">
                                    {stats.totalOutput.toLocaleString()}
                                </TableCell>
                                <TableCell className="py-4 px-4 border-r border-slate-200 bg-slate-50/50">
                                    {stats.detailedStats.reduce((sum, item) => sum + Number(item.total_bigbox), 0).toLocaleString()}
                                </TableCell>
                                <TableCell className="py-4 px-4 border-r border-slate-200 bg-slate-50/50">
                                    {stats.detailedStats.reduce((sum, item) => sum + Number(item.total_pallet), 0).toLocaleString()}
                                </TableCell>
                                <TableCell colSpan={2} className="bg-slate-50/30"></TableCell>
                            </TableRow>
                        }
                    />
                </CardContent>
            </Card>
        ) : (
            /* Product List Mode */
            <Card className="shadow-md border-none">
                <CardContent className="p-0">
                    <DataTable
                        data={rows}
                        loading={loading}
                        columns={productColumns}
                        pagination={{
                            pageIndex: pagination.pageIndex,
                            pageSize: pagination.pageSize,
                            rowCount: rowCount,
                            onPageChange: handlePageChange,
                            onPageSizeChange: handlePageSizeChange
                        }}
                    />
                </CardContent>
            </Card>
        )}
      </div>
    </div>
  );
}
