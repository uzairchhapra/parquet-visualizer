import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
} from "@mui/material";
import type { ColumnInfo } from "../lib/workerTypes";

interface Props {
  columns: ColumnInfo[];
  loading: boolean;
}

export default function SchemaTab({ columns, loading }: Props) {
  if (!loading && columns.length === 0) {
    return (
      <Box sx={{ p: 4, textAlign: "center" }}>
        <Typography color="text.secondary">
          Load a Parquet file to see the schema.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="subtitle2" sx={{ mb: 2 }}>
        {columns.length} column{columns.length !== 1 ? "s" : ""}
      </Typography>
      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>#</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Column</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Nullable</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {columns.map((col, i) => (
              <TableRow key={col.name}>
                <TableCell>{i + 1}</TableCell>
                <TableCell>
                  <Typography
                    variant="body2"
                    fontFamily='"Roboto Mono", monospace'
                    fontWeight={500}
                  >
                    {col.name}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={col.type}
                    size="small"
                    variant="outlined"
                    color="primary"
                  />
                </TableCell>
                <TableCell>
                  {col.nullable ? (
                    <Chip label="YES" size="small" color="warning" variant="outlined" />
                  ) : (
                    <Chip label="NO" size="small" color="default" variant="outlined" />
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
