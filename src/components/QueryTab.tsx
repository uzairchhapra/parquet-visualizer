import { useState, useCallback } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItemButton,
  ListItemText,
  Chip,
  Paper,
} from "@mui/material";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import HistoryIcon from "@mui/icons-material/History";
import AutoFixHighIcon from "@mui/icons-material/AutoFixHigh";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import type { ColumnInfo } from "../lib/workerTypes";

interface QueryResult {
  columns: string[];
  rows: Record<string, unknown>[];
  rowCount: number;
}

interface HistoryEntry {
  sql: string;
  timestamp: number;
  rowCount: number;
  error?: string;
}

interface Props {
  onQuery: (sql: string) => Promise<QueryResult>;
  fileLoaded: boolean;
  schema: ColumnInfo[];
}

const SAMPLE_QUERIES = [
  "SELECT COUNT(*) FROM data;",
  "SELECT * FROM data LIMIT 100;",
];

function makeSampleGroupBy(schema: ColumnInfo[]): string | null {
  const strCol = schema.find(
    (c) =>
      c.type.toLowerCase().includes("varchar") ||
      c.type.toLowerCase().includes("text") ||
      c.type.toLowerCase().includes("string")
  );
  if (strCol) {
    const escaped = `"${strCol.name.replace(/"/g, '""')}"`;
    return `SELECT ${escaped}, COUNT(*) AS cnt FROM data GROUP BY ${escaped} ORDER BY cnt DESC LIMIT 20;`;
  }
  return null;
}

export default function QueryTab({ onQuery, fileLoaded, schema }: Props) {
  const [sql, setSql] = useState("SELECT * FROM data LIMIT 100;");
  const [result, setResult] = useState<QueryResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  const runQuery = useCallback(async () => {
    if (!sql.trim() || running) return;
    setRunning(true);
    setError(null);
    try {
      const res = await onQuery(sql.trim());
      setResult(res);
      setHistory((prev) => [
        { sql: sql.trim(), timestamp: Date.now(), rowCount: res.rowCount },
        ...prev,
      ]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      setResult(null);
      setHistory((prev) => [
        { sql: sql.trim(), timestamp: Date.now(), rowCount: 0, error: msg },
        ...prev,
      ]);
    } finally {
      setRunning(false);
    }
  }, [sql, running, onQuery]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      runQuery();
    }
  };

  const sampleQueries = [...SAMPLE_QUERIES];
  const groupBy = makeSampleGroupBy(schema);
  if (groupBy) sampleQueries.push(groupBy);

  const gridColumns: GridColDef[] = (result?.columns ?? []).map((col) => ({
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

  const gridRows = (result?.rows ?? []).map((row, idx) => ({ id: idx, ...row }));

  return (
    <Box sx={{ p: 2, display: "flex", flexDirection: "column", height: "100%" }}>
      <TextField
        multiline
        minRows={3}
        maxRows={8}
        fullWidth
        value={sql}
        onChange={(e) => setSql(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Enter SQL query..."
        disabled={!fileLoaded}
        InputProps={{
          sx: { fontFamily: '"Roboto Mono", monospace', fontSize: "0.85rem" },
        }}
        sx={{ mb: 1 }}
      />

      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
        <Button
          variant="contained"
          startIcon={<PlayArrowIcon />}
          onClick={runQuery}
          disabled={!fileLoaded || running || !sql.trim()}
          size="small"
        >
          {running ? "Running..." : "Run"}
        </Button>
        <Typography variant="caption" color="text.secondary">
          Ctrl+Enter to run
        </Typography>
      </Box>

      {error && (
        <Paper
          variant="outlined"
          sx={{
            p: 1.5,
            mb: 2,
            borderColor: "error.main",
            bgcolor: "error.main",
            color: "error.contrastText",
            opacity: 0.9,
          }}
        >
          <Typography variant="body2" fontFamily='"Roboto Mono", monospace'>
            {error}
          </Typography>
        </Paper>
      )}

      {result && (
        <Box sx={{ flexGrow: 1, minHeight: 200, mb: 2 }}>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: "block" }}>
            {result.rowCount} row{result.rowCount !== 1 ? "s" : ""} returned
          </Typography>
          <DataGrid
            rows={gridRows}
            columns={gridColumns}
            density="compact"
            pageSizeOptions={[25, 50, 100]}
            initialState={{
              pagination: { paginationModel: { pageSize: 25 } },
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
      )}

      <Accordion disableGutters variant="outlined" sx={{ mt: "auto" }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <AutoFixHighIcon sx={{ mr: 1, fontSize: 18 }} />
          <Typography variant="body2">Sample Queries</Typography>
        </AccordionSummary>
        <AccordionDetails sx={{ p: 0 }}>
          <List dense disablePadding>
            {sampleQueries.map((q, i) => (
              <ListItemButton key={i} onClick={() => setSql(q)}>
                <ListItemText
                  primary={q}
                  primaryTypographyProps={{
                    variant: "body2",
                    fontFamily: '"Roboto Mono", monospace',
                    fontSize: "0.8rem",
                    noWrap: true,
                  }}
                />
              </ListItemButton>
            ))}
          </List>
        </AccordionDetails>
      </Accordion>

      {history.length > 0 && (
        <Accordion disableGutters variant="outlined" sx={{ mt: 1 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <HistoryIcon sx={{ mr: 1, fontSize: 18 }} />
            <Typography variant="body2">
              Query History ({history.length})
            </Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ p: 0 }}>
            <List dense disablePadding>
              {history.map((entry, i) => (
                <ListItemButton key={i} onClick={() => setSql(entry.sql)}>
                  <ListItemText
                    primary={entry.sql}
                    secondary={new Date(entry.timestamp).toLocaleTimeString()}
                    primaryTypographyProps={{
                      variant: "body2",
                      fontFamily: '"Roboto Mono", monospace',
                      fontSize: "0.8rem",
                      noWrap: true,
                    }}
                  />
                  {entry.error ? (
                    <Chip label="Error" size="small" color="error" variant="outlined" />
                  ) : (
                    <Chip
                      label={`${entry.rowCount} rows`}
                      size="small"
                      variant="outlined"
                    />
                  )}
                </ListItemButton>
              ))}
            </List>
          </AccordionDetails>
        </Accordion>
      )}
    </Box>
  );
}
