import { useState, useCallback, useRef } from "react";
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
  Menu,
  MenuItem,
  Divider,
} from "@mui/material";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import HistoryIcon from "@mui/icons-material/History";
import AutoFixHighIcon from "@mui/icons-material/AutoFixHigh";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import type { ColumnInfo } from "../lib/workerTypes";
import { exportToCsv, exportToJson } from "../lib/exportUtils";

const MONO = '"JetBrains Mono", "Roboto Mono", monospace';

const SQL_KEYWORDS = [
  "SELECT",
  "FROM",
  "WHERE",
  "GROUP BY",
  "ORDER BY",
  "LIMIT",
  "COUNT",
  "SUM",
  "AVG",
  "MIN",
  "MAX",
  "AS",
  "DISTINCT",
  "HAVING",
  "JOIN",
  "INNER JOIN",
  "LEFT JOIN",
  "ON",
  "AND",
  "OR",
  "NOT",
  "IN",
  "LIKE",
  "BETWEEN",
  "CASE",
  "WHEN",
  "THEN",
  "END",
  "CAST",
  "COALESCE",
  "NULLIF",
  "IS NULL",
  "IS NOT NULL",
];

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
  "SELECT * FROM data LIMIT 100;",
  "SELECT COUNT(*) FROM data;",
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

/** Return the word being typed immediately before `cursorPos`. */
function wordAtCursor(text: string, cursorPos: number): { word: string; start: number } {
  let start = cursorPos;
  while (start > 0 && /[\w.]/.test(text[start - 1])) start--;
  return { word: text.slice(start, cursorPos), start };
}

function computeSuggestions(word: string, colNames: string[]): string[] {
  if (!word) return [];
  const lw = word.toLowerCase();

  // "data.<prefix>" → qualified column names
  if (lw.startsWith("data.")) {
    const prefix = lw.slice(5);
    return colNames
      .filter((c) => c.toLowerCase().startsWith(prefix))
      .map((c) => `data.${c}`)
      .slice(0, 10);
  }

  const matchCols = colNames.filter((c) => c.toLowerCase().startsWith(lw));
  const matchKws = SQL_KEYWORDS.filter((k) => k.toLowerCase().startsWith(lw));
  return [...new Set([...matchCols, ...matchKws])].slice(0, 10);
}

export default function QueryTab({ onQuery, fileLoaded, schema }: Props) {
  const [sql, setSql] = useState("SELECT * FROM data LIMIT 100;");
  const [result, setResult] = useState<QueryResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [exportAnchor, setExportAnchor] = useState<null | HTMLElement>(null);

  // Autocomplete state
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [acWordStart, setAcWordStart] = useState(0);
  const [acWordEnd, setAcWordEnd] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const colNames = schema.map((c) => c.name);

  const runQuery = useCallback(async () => {
    if (!sql.trim() || running) return;
    setRunning(true);
    setError(null);
    setSuggestions([]);
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

  /** Insert text at the textarea's current cursor position. */
  const insertAtCursor = useCallback(
    (text: string) => {
      const ta = textareaRef.current;
      const start = ta?.selectionStart ?? sql.length;
      const end = ta?.selectionEnd ?? sql.length;
      const newSql = sql.slice(0, start) + text + sql.slice(end);
      setSql(newSql);
      setSuggestions([]);
      requestAnimationFrame(() => {
        if (ta) {
          const pos = start + text.length;
          ta.setSelectionRange(pos, pos);
          ta.focus();
        }
      });
    },
    [sql]
  );

  /** Accept the currently highlighted autocomplete suggestion. */
  const acceptSuggestion = useCallback(
    (suggestion: string) => {
      const ta = textareaRef.current;
      const newSql = sql.slice(0, acWordStart) + suggestion + sql.slice(acWordEnd);
      setSql(newSql);
      setSuggestions([]);
      requestAnimationFrame(() => {
        if (ta) {
          const pos = acWordStart + suggestion.length;
          ta.setSelectionRange(pos, pos);
          ta.focus();
        }
      });
    },
    [sql, acWordStart, acWordEnd]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSql(val);
    const pos = (e.target as unknown as HTMLTextAreaElement).selectionStart ?? val.length;
    const { word, start } = wordAtCursor(val, pos);
    const suggs = computeSuggestions(word, colNames);
    setSuggestions(suggs);
    setActiveIdx(0);
    setAcWordStart(start);
    setAcWordEnd(pos);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Autocomplete navigation takes priority
    if (suggestions.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIdx((i) => Math.min(i + 1, suggestions.length - 1));
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIdx((i) => Math.max(i - 1, 0));
        return;
      }
      if (e.key === "Tab" || (e.key === "Enter" && !e.ctrlKey && !e.metaKey)) {
        e.preventDefault();
        acceptSuggestion(suggestions[activeIdx]);
        return;
      }
      if (e.key === "Escape") {
        setSuggestions([]);
        return;
      }
    }

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
    <Box sx={{ p: 2, display: "flex", flexDirection: "column", height: "100%", gap: 1 }}>
      {/* Column reference chips */}
      {schema.length > 0 && (
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, alignItems: "center" }}>
          <Typography variant="caption" color="text.secondary" sx={{ mr: 0.5 }}>
            Columns:
          </Typography>
          <Chip
            label="data"
            size="small"
            color="primary"
            variant="outlined"
            onClick={() => insertAtCursor("data")}
            sx={{ fontFamily: MONO, fontSize: "0.72rem" }}
          />
          {schema.map((col) => (
            <Chip
              key={col.name}
              label={col.name}
              size="small"
              variant="outlined"
              onClick={() =>
                insertAtCursor(
                  /[^a-zA-Z0-9_]/.test(col.name) ? `"${col.name}"` : col.name
                )
              }
              sx={{ fontFamily: MONO, fontSize: "0.72rem" }}
            />
          ))}
        </Box>
      )}

      {/* SQL editor with autocomplete */}
      <Box sx={{ position: "relative" }}>
        <TextField
          multiline
          minRows={3}
          maxRows={8}
          fullWidth
          value={sql}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onBlur={() => setTimeout(() => setSuggestions([]), 150)}
          placeholder="Enter SQL query… (Ctrl+Enter to run)"
          disabled={!fileLoaded}
          inputRef={textareaRef}
          slotProps={{
            input: {
              sx: { fontFamily: MONO, fontSize: "0.85rem" },
            },
          }}
        />
        {/* Autocomplete dropdown */}
        {suggestions.length > 0 && (
          <Paper
            elevation={6}
            sx={{
              position: "absolute",
              top: "100%",
              left: 0,
              right: 0,
              zIndex: 1400,
              maxHeight: 220,
              overflow: "auto",
              mt: 0.25,
            }}
          >
            {suggestions.map((s, i) => (
              <Box
                key={s}
                onMouseDown={(e) => {
                  e.preventDefault(); // prevent blur before click registers
                  acceptSuggestion(s);
                }}
                sx={{
                  px: 1.5,
                  py: 0.75,
                  cursor: "pointer",
                  bgcolor: i === activeIdx ? "action.selected" : "transparent",
                  "&:hover": { bgcolor: "action.hover" },
                  fontFamily: MONO,
                  fontSize: "0.8rem",
                  borderBottom: i < suggestions.length - 1 ? "1px solid" : "none",
                  borderColor: "divider",
                }}
              >
                {s}
              </Box>
            ))}
          </Paper>
        )}
      </Box>

      {/* Run button + hint */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Button
          variant="contained"
          startIcon={<PlayArrowIcon />}
          onClick={runQuery}
          disabled={!fileLoaded || running || !sql.trim()}
          size="small"
        >
          {running ? "Running…" : "Run"}
        </Button>
        <Typography variant="caption" color="text.secondary">
          Ctrl+Enter · Tab to autocomplete
        </Typography>
      </Box>

      {/* Error */}
      {error && (
        <Paper
          variant="outlined"
          sx={{
            p: 1.5,
            borderColor: "error.main",
            bgcolor: "error.main",
            color: "error.contrastText",
            opacity: 0.9,
          }}
        >
          <Typography variant="body2" fontFamily={MONO}>
            {error}
          </Typography>
        </Paper>
      )}

      {/* Results */}
      {result && (
        <Box sx={{ flexGrow: 1, minHeight: 200, display: "flex", flexDirection: "column" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
            <Typography variant="caption" color="text.secondary" sx={{ flexGrow: 1 }}>
              {result.rowCount} row{result.rowCount !== 1 ? "s" : ""} returned
            </Typography>
            <Button
              size="small"
              variant="outlined"
              startIcon={<FileDownloadIcon />}
              onClick={(e) => setExportAnchor(e.currentTarget)}
              disabled={result.columns.length === 0}
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
                  exportToCsv(result.columns, result.rows, "query-result");
                  setExportAnchor(null);
                }}
              >
                Export as CSV
              </MenuItem>
              <MenuItem
                onClick={() => {
                  exportToJson(result.columns, result.rows, "query-result");
                  setExportAnchor(null);
                }}
              >
                Export as JSON
              </MenuItem>
            </Menu>
          </Box>
          <Box sx={{ flexGrow: 1, minHeight: 0 }}>
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
                "& .MuiDataGrid-cell": { fontFamily: MONO, fontSize: "0.8rem" },
                "& .MuiDataGrid-columnHeaderTitle": { fontWeight: 600, fontSize: "0.8rem" },
              }}
            />
          </Box>
        </Box>
      )}

      {/* Sample queries */}
      <Accordion disableGutters variant="outlined" sx={{ mt: "auto", flexShrink: 0 }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <AutoFixHighIcon sx={{ mr: 1, fontSize: 18 }} />
          <Typography variant="body2">Sample Queries</Typography>
        </AccordionSummary>
        <AccordionDetails sx={{ p: 0 }}>
          <List dense disablePadding>
            {sampleQueries.map((q, i) => (
              <ListItemButton key={i} onClick={() => { setSql(q); setSuggestions([]); }}>
                <ListItemText
                  primary={q}
                  primaryTypographyProps={{
                    variant: "body2",
                    fontFamily: MONO,
                    fontSize: "0.8rem",
                    noWrap: true,
                  }}
                />
              </ListItemButton>
            ))}
          </List>
        </AccordionDetails>
      </Accordion>

      {/* Query history */}
      {history.length > 0 && (
        <Accordion disableGutters variant="outlined" sx={{ flexShrink: 0 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <HistoryIcon sx={{ mr: 1, fontSize: 18 }} />
            <Typography variant="body2">Query History ({history.length})</Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ p: 0 }}>
            <List dense disablePadding>
              {history.map((entry, i) => (
                <ListItemButton key={i} onClick={() => { setSql(entry.sql); setSuggestions([]); }}>
                  <ListItemText
                    primary={entry.sql}
                    secondary={new Date(entry.timestamp).toLocaleTimeString()}
                    primaryTypographyProps={{
                      variant: "body2",
                      fontFamily: MONO,
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

      <Divider sx={{ display: "none" }} />
    </Box>
  );
}
