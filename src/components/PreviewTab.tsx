import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Chip,
  Button,
  Menu,
  MenuItem,
} from "@mui/material";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import { exportToCsv, exportToJson } from "../lib/exportUtils";

const MONO = '"JetBrains Mono", "Roboto Mono", monospace';

interface Props {
  columns: string[];
  rows: Record<string, unknown>[];
  rowCount: number;
  loading: boolean;
  filename?: string;
}

export default function PreviewTab({
  columns,
  rows,
  loading,
  rowCount,
  filename = "data",
}: Props) {
  const [selectedCols, setSelectedCols] = useState<string[]>(columns);
  const [exportAnchor, setExportAnchor] = useState<null | HTMLElement>(null);

  // Reset selection whenever a new file is loaded
  useEffect(() => {
    setSelectedCols(columns);
  }, [columns]);

  const allSelected = selectedCols.length === columns.length;

  const toggleAll = () => {
    setSelectedCols(allSelected ? [] : [...columns]);
  };

  const toggleCol = (col: string) => {
    setSelectedCols((prev) =>
      prev.includes(col) ? prev.filter((c) => c !== col) : [...prev, col]
    );
  };

  const visibleCols = columns.filter((c) => selectedCols.includes(c));
  const exportName = filename.replace(/\.parquet$/i, "");

  const gridColumns: GridColDef[] = visibleCols.map((col) => ({
    field: col,
    headerName: col,
    minWidth: 120,
    flex: 1,
    renderCell: (params) => {
      const val = params.value;
      if (val === null || val === undefined) {
        return (
          <Typography variant="body2" color="text.disabled" fontStyle="italic">
            null
          </Typography>
        );
      }
      return String(val);
    },
  }));

  const gridRows = rows.map((row, idx) => ({ id: idx, ...row }));

  if (!loading && columns.length === 0) {
    return (
      <Box sx={{ p: 4, textAlign: "center" }}>
        <Typography color="text.secondary">
          Load a Parquet file to see a preview.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {/* Toolbar */}
      <Box
        sx={{
          px: 2,
          py: 1,
          display: "flex",
          alignItems: "center",
          gap: 1,
          borderBottom: 1,
          borderColor: "divider",
          flexShrink: 0,
        }}
      >
        <Typography variant="caption" color="text.secondary" sx={{ flexGrow: 1 }}>
          {rows.length} of {rowCount} rows &nbsp;·&nbsp; {visibleCols.length} of{" "}
          {columns.length} cols
        </Typography>
        <Button
          size="small"
          variant="outlined"
          startIcon={<FileDownloadIcon />}
          onClick={(e) => setExportAnchor(e.currentTarget)}
          disabled={visibleCols.length === 0 || rows.length === 0}
        >
          Export
        </Button>
        <Menu
          anchorEl={exportAnchor}
          open={Boolean(exportAnchor)}
          onClose={() => setExportAnchor(null)}
        >
          <MenuItem
            onClick={() => {
              exportToCsv(visibleCols, rows, exportName);
              setExportAnchor(null);
            }}
          >
            Export as CSV
          </MenuItem>
          <MenuItem
            onClick={() => {
              exportToJson(visibleCols, rows, exportName);
              setExportAnchor(null);
            }}
          >
            Export as JSON
          </MenuItem>
        </Menu>
      </Box>

      {/* Data grid */}
      <Box sx={{ flexGrow: 1, minHeight: 0 }}>
        <DataGrid
          rows={gridRows}
          columns={gridColumns}
          loading={loading}
          density="compact"
          pageSizeOptions={[25, 50, 100]}
          initialState={{
            pagination: { paginationModel: { pageSize: 50 } },
          }}
          disableRowSelectionOnClick
          sx={{
            border: 0,
            "& .MuiDataGrid-cell": {
              fontFamily: MONO,
              fontSize: "0.8rem",
            },
            "& .MuiDataGrid-columnHeaderTitle": {
              fontWeight: 600,
              fontSize: "0.8rem",
            },
          }}
        />
      </Box>

      {/* Column filter chips */}
      {columns.length > 0 && (
        <Box
          sx={{
            px: 2,
            py: 1,
            borderTop: 1,
            borderColor: "divider",
            display: "flex",
            gap: 0.75,
            flexWrap: "wrap",
            alignItems: "center",
            flexShrink: 0,
          }}
        >
          <Chip
            label="ALL"
            size="small"
            color={allSelected ? "primary" : "default"}
            variant={allSelected ? "filled" : "outlined"}
            onClick={toggleAll}
            sx={{ fontWeight: 500 }}
          />
          {columns.map((col) => (
            <Chip
              key={col}
              label={col}
              size="small"
              color={selectedCols.includes(col) ? "primary" : "default"}
              variant={selectedCols.includes(col) ? "filled" : "outlined"}
              onClick={() => toggleCol(col)}
              sx={{ fontFamily: MONO, fontSize: "0.72rem" }}
            />
          ))}
        </Box>
      )}
    </Box>
  );
}
