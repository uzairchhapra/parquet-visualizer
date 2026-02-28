import {
  Box,
  Typography,
  Card,
  CardContent,
  LinearProgress,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableRow,
} from "@mui/material";
import Grid from "@mui/material/Grid2";
import type { ColumnProfile } from "../lib/workerTypes";

interface Props {
  rowCount: number | null;
  columns: ColumnProfile[];
  progress: { done: number; total: number } | null;
  loading: boolean;
}

export default function ProfileTab({ rowCount, columns, progress, loading }: Props) {
  if (!loading && columns.length === 0 && rowCount === null) {
    return (
      <Box sx={{ p: 4, textAlign: "center" }}>
        <Typography color="text.secondary">
          Load a file and click Profile to analyze columns.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      {rowCount !== null && (
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          Total rows: {rowCount.toLocaleString()}
        </Typography>
      )}

      {loading && progress && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="caption" color="text.secondary">
            Profiling column {progress.done} / {progress.total}
          </Typography>
          <LinearProgress
            variant="determinate"
            value={(progress.done / progress.total) * 100}
            sx={{ mt: 0.5 }}
          />
        </Box>
      )}

      <Grid container spacing={2}>
        {columns.map((col) => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={col.name}>
            <Card variant="outlined" sx={{ height: "100%" }}>
              <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                  <Typography
                    variant="subtitle2"
                    fontFamily='"Roboto Mono", monospace'
                    noWrap
                    sx={{ flexGrow: 1 }}
                  >
                    {col.name}
                  </Typography>
                  <Chip label={col.type} size="small" variant="outlined" color="primary" />
                </Box>

                <Table size="small">
                  <TableBody>
                    <TableRow>
                      <TableCell sx={{ border: 0, py: 0.25, pl: 0 }}>
                        <Typography variant="caption" color="text.secondary">
                          Nulls
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ border: 0, py: 0.25, pr: 0 }} align="right">
                        <Typography variant="caption">
                          {col.nullCount >= 0
                            ? `${col.nullCount.toLocaleString()} (${col.nullPercent}%)`
                            : "—"}
                        </Typography>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell sx={{ border: 0, py: 0.25, pl: 0 }}>
                        <Typography variant="caption" color="text.secondary">
                          Distinct
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ border: 0, py: 0.25, pr: 0 }} align="right">
                        <Typography variant="caption">
                          {col.distinctCount >= 0
                            ? col.distinctCount.toLocaleString()
                            : "—"}
                        </Typography>
                      </TableCell>
                    </TableRow>
                    {col.min != null && (
                      <TableRow>
                        <TableCell sx={{ border: 0, py: 0.25, pl: 0 }}>
                          <Typography variant="caption" color="text.secondary">
                            Min
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ border: 0, py: 0.25, pr: 0 }} align="right">
                          <Typography variant="caption">{String(col.min)}</Typography>
                        </TableCell>
                      </TableRow>
                    )}
                    {col.max != null && (
                      <TableRow>
                        <TableCell sx={{ border: 0, py: 0.25, pl: 0 }}>
                          <Typography variant="caption" color="text.secondary">
                            Max
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ border: 0, py: 0.25, pr: 0 }} align="right">
                          <Typography variant="caption">{String(col.max)}</Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>

                {col.topValues && col.topValues.length > 0 && (
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                      Top values
                    </Typography>
                    <Box sx={{ maxHeight: 160, overflow: "auto", mt: 0.5 }}>
                      {col.topValues.map((tv, i) => (
                        <Box
                          key={i}
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            py: 0.25,
                          }}
                        >
                          <Typography
                            variant="caption"
                            fontFamily='"Roboto Mono", monospace'
                            noWrap
                            sx={{ flexGrow: 1, mr: 1 }}
                          >
                            {tv.value}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {tv.count.toLocaleString()}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
