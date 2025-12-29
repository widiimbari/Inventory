"use client";

import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

// Flexible Column Definition
export interface DataTableColumn<TData, TValue = any> {
  id?: string;
  accessorKey?: keyof TData; // Key to access data
  header: string | React.ReactNode; // Header label or component
  cell?: (props: { row: TData; value: any }) => React.ReactNode; // Custom cell renderer
  width?: number | string; // Optional width
  className?: string; // Optional class for the cell
}

interface DataTableProps<TData> {
  columns: DataTableColumn<TData>[];
  data: TData[];
  pagination?: {
    pageIndex: number;
    pageSize: number;
    rowCount: number;
    onPageChange: (pageIndex: number) => void;
    onPageSizeChange: (pageSize: number) => void;
  };
  loading?: boolean;
  footer?: React.ReactNode;
}

export function DataTable<TData>({
  columns,
  data,
  pagination,
  loading = false,
  footer,
}: DataTableProps<TData>) {
  
  // Calculate total pages if pagination is provided
  const totalPages = pagination ? Math.ceil(pagination.rowCount / pagination.pageSize) : 0;

  return (
    <div className="space-y-4 w-full">
      <div className="rounded-md border bg-white shadow-sm overflow-hidden">
        {/* Single Scroll Container: Handles both horizontal and vertical scroll */}
        <div className="relative overflow-auto max-h-[70vh] min-h-[300px]">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                {columns.map((col, index) => (
                  <TableHead 
                    key={col.id || String(col.accessorKey) || index} 
                    style={{ width: col.width }}
                    className={cn(
                        "text-primary bg-slate-50 text-left", 
                        col.className
                    )}
                  >
                    {col.header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground font-medium">
                    <div className="flex items-center justify-center gap-2">
                        <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
                        Loading data...
                    </div>
                  </TableCell>
                </TableRow>
              ) : data.length > 0 ? (
                data.map((row, rowIndex) => (
                  <TableRow 
                    key={rowIndex} 
                    className="hover:bg-secondary/30 transition-colors odd:bg-white even:bg-secondary/5"
                  >
                    {columns.map((col, colIndex) => {
                      // Resolve value
                      const value = col.accessorKey ? (row as any)[col.accessorKey] : undefined;
                      return (
                        <TableCell 
                            key={colIndex} 
                            className={cn(
                                "px-4 py-3 text-sm text-foreground text-left", 
                                col.className
                            )}
                        >
                          {col.cell ? col.cell({ row, value }) : value}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                    No results found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
            {footer && <TableFooter className="sticky bottom-0 z-10 bg-slate-50 border-t-2">{footer}</TableFooter>}
          </Table>
        </div>
      </div>

      {/* Pagination Controls */}
      {pagination && (
        <div className="flex items-center justify-between px-2 py-2">
          <div className="flex items-center space-x-2 text-sm text-slate-500">
            <span>Show</span>
            <Select 
                value={String(pagination.pageSize)} 
                onValueChange={(val) => pagination.onPageSizeChange(Number(val))}
            >
                <SelectTrigger className="h-8 w-[75px] bg-white">
                    <SelectValue placeholder={pagination.pageSize} />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                </SelectContent>
            </Select>
            <span className="hidden sm:inline-block">rows per page. Total {pagination.rowCount} records.</span>
          </div>
          
          <div className="flex items-center space-x-1">
            <div className="text-sm font-medium mr-2 text-slate-700">
                Page {pagination.pageIndex + 1} of {Math.max(1, totalPages)}
            </div>
            <div className="flex items-center gap-1">
                <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => pagination.onPageChange(0)}
                disabled={pagination.pageIndex === 0}
                >
                <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => pagination.onPageChange(pagination.pageIndex - 1)}
                disabled={pagination.pageIndex === 0}
                >
                <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => pagination.onPageChange(pagination.pageIndex + 1)}
                disabled={pagination.pageIndex >= totalPages - 1}
                >
                <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => pagination.onPageChange(totalPages - 1)}
                disabled={pagination.pageIndex >= totalPages - 1}
                >
                <ChevronsRight className="h-4 w-4" />
                </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}