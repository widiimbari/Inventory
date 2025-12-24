"use client";

import React from "react";
import { DataGrid, GridColDef, GridPaginationModel } from "@mui/x-data-grid";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { grey } from "@mui/material/colors"; // Import grey palette

// Create a custom Sage Green theme
const customDarkTheme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#556B2F", // Sage Green
      light: "#8FBC8F", // Dark Sea Green
      dark: "#2E3B19", // Dark Olive Green
    },
    secondary: {
      main: "#F5F5DC", // Beige/Cream
    },
    background: {
      default: "#F9FBF7", // Very light green-tinted white
      paper: "#FFFFFF",   // White
    },
    text: {
      primary: "#2F3E28", // Dark Green-Grey
      secondary: "#5C6E58", // Medium Sage
      disabled: grey[400],
    },
    divider: "#E0E8D9", // Light Sage border
    action: {
      active: "#556B2F",
      hover: "#E8F0E4",
      selected: "#D0DFC6",
    }
  },
  typography: {
    fontFamily: [
      "Inter",
      "-apple-system",
      "BlinkMacSystemFont",
      '"Segoe UI"',
      "Roboto",
      '"Helvetica Neue"',
      "Arial",
      "sans-serif",
    ].join(","),
    fontSize: 14,
  },
  components: {
    MuiDataGrid: {
      styleOverrides: {
        root: {
          backgroundColor: "#FFFFFF",
          color: "#2F3E28",
          border: "1px solid #E0E8D9",
          borderRadius: "0.5rem",
          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)", // Subtle shadow
        },
        columnHeaders: {
          backgroundColor: "#F0F4EC", // Light Sage/Mint
          color: "#2F3E28",
          borderBottom: "2px solid #556B2F", // Sage accent
          textTransform: "uppercase",
          fontSize: "0.75rem",
          letterSpacing: "0.05em",
        },
        columnHeader: {
          "& .MuiDataGrid-columnHeaderTitle": {
            fontWeight: "700",
          },
          "&:focus": {
            outline: "none",
          },
        },
        cell: {
          color: "#2F3E28",
          borderBottom: "1px solid #F0F4EC",
          "&:focus": {
            outline: "none",
          },
        },
        row: {
          "&:nth-of-type(odd)": {
            backgroundColor: "#FAFCF9", // Alternating very light mint
          },
          "&:hover": {
            backgroundColor: "#E8F0E4 !important", // Highlight sage
            cursor: "pointer",
          },
        },
        footerContainer: {
          backgroundColor: "#F0F4EC",
          color: "#2F3E28",
          borderTop: "1px solid #E0E8D9",
        },
        toolbarContainer: {
          color: "#556B2F",
        },
        overlay: {
            backgroundColor: "rgba(255, 255, 255, 0.8)",
            color: "#556B2F",
        }
      },
    } as any,
  } as any,
});

interface DataGridTableProps {
  rows: any[];
  rowCount: number;
  loading: boolean;
  paginationModel: GridPaginationModel;
  onPaginationModelChange: (model: GridPaginationModel) => void;
  columns: GridColDef[];
  onSearch?: (value: string) => void;
  searchValue?: string;
}

export default function DataGridTable({
  rows,
  rowCount,
  loading,
  paginationModel,
  onPaginationModelChange,
  columns,
  onSearch,
  searchValue
}: DataGridTableProps) {
  
  return (
    <div style={{ height: 600, width: "100%" }}>
      <ThemeProvider theme={customDarkTheme}>
      <CssBaseline />
      <DataGrid
        rows={rows}
        columns={columns}
        rowCount={rowCount}
        loading={loading}
        pageSizeOptions={[10, 50, 100]} // Default options
        paginationModel={paginationModel}
        paginationMode="server"
        onPaginationModelChange={onPaginationModelChange}
        disableRowSelectionOnClick
        // Custom toolbar can be added here if needed, but for now we have external search.
        // slots={{ toolbar: GridToolbar }} // If you want MUI's default toolbar with internal search/filter
      />
      </ThemeProvider>
    </div>
  );
}
