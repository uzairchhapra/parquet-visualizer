import { Box, Typography } from "@mui/material";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";

interface Props {
  columns: string[];
  rows: Record<string, unknown>[];
  rowCount: number;
  loading: boolean;
}

export default function PreviewTab({ columns, rows, loading, rowCount }: Props) {
  if (!loading && columns.length === 0) {
    return (
      <Box sx={{ p: 4, textAlign: "center" }}>
        <Typography color="text.secondary">
          Load a Parquet file to see a preview.
        </Typography>
      </Box>
    );
  }

  const gridColumns: GridColDef[] = columns.map((col) => ({
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

  return (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <Box sx={{ px: 2, py: 1 }}>
        <Typography variant="caption" color="text.secondary">
          Showing {rows.length} of {rowCount} rows
        </Typography>
      </Box>
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
              fontFamily: '"Roboto Mono", monospace',
              fontSize: "0.8rem",
            },
          }}
        />
      </Box>
    </Box>
  );
}
