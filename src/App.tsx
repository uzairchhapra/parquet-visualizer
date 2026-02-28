import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import {
  ThemeProvider,
  CssBaseline,
  AppBar,
  Toolbar,
  Typography,
  Box,
  Tabs,
  Tab,
  Chip,
  Tooltip,
} from "@mui/material";
import type { PaletteMode } from "@mui/material";
import StorageIcon from "@mui/icons-material/Storage";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import { buildTheme } from "./theme";
import { loadThemeMode, saveThemeMode } from "./lib/storage";
import { DuckDBClient } from "./lib/duckdbClient";
import type { ColumnInfo, ColumnProfile } from "./lib/workerTypes";
import LocalOnlyBadge from "./components/LocalOnlyBadge";
import ThemeToggle from "./components/ThemeToggle";
import FileDropzone from "./components/FileDropzone";
import PreviewTab from "./components/PreviewTab";
import SchemaTab from "./components/SchemaTab";
import ProfileTab from "./components/ProfileTab";
import QueryTab from "./components/QueryTab";
import ErrorSnackbar from "./components/ErrorSnackbar";

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function App() {
  const [mode, setMode] = useState<PaletteMode>(loadThemeMode);
  const theme = useMemo(() => buildTheme(mode), [mode]);

  const clientRef = useRef<DuckDBClient | null>(null);
  const [dbReady, setDbReady] = useState(false);
  const [file, setFile] = useState<{ name: string; size: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [tab, setTab] = useState(0);

  // Preview state
  const [previewCols, setPreviewCols] = useState<string[]>([]);
  const [previewRows, setPreviewRows] = useState<Record<string, unknown>[]>([]);
  const [previewRowCount, setPreviewRowCount] = useState(0);
  const [previewLoading, setPreviewLoading] = useState(false);

  // Schema state
  const [schema, setSchema] = useState<ColumnInfo[]>([]);
  const [schemaLoading, setSchemaLoading] = useState(false);

  // Profile state
  const [profileCols, setProfileCols] = useState<ColumnProfile[]>([]);
  const [profileRowCount, setProfileRowCount] = useState<number | null>(null);
  const [profileProgress, setProfileProgress] = useState<{
    done: number;
    total: number;
  } | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  // Initialize DuckDB
  useEffect(() => {
    const client = new DuckDBClient();
    clientRef.current = client;
    client
      .init()
      .then(() => setDbReady(true))
      .catch((err) => setError(`Failed to initialize DuckDB: ${err.message}`));
    return () => client.terminate();
  }, []);

  const toggleTheme = useCallback(() => {
    setMode((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      saveThemeMode(next);
      return next;
    });
  }, []);

  const runPreview = useCallback(async () => {
    const client = clientRef.current;
    if (!client) return;
    setPreviewLoading(true);
    try {
      const res = await client.query("SELECT * FROM data LIMIT 200");
      setPreviewCols(res.columns);
      setPreviewRows(res.rows);
      setPreviewRowCount(res.rowCount);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setPreviewLoading(false);
    }
  }, []);

  const runSchema = useCallback(async () => {
    const client = clientRef.current;
    if (!client) return;
    setSchemaLoading(true);
    try {
      const cols = await client.describe();
      setSchema(cols);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSchemaLoading(false);
    }
  }, []);

  const runProfile = useCallback(async () => {
    const client = clientRef.current;
    if (!client) return;
    setProfileLoading(true);
    setProfileCols([]);
    setProfileProgress(null);
    try {
      const result = await client.profile((done, total, col) => {
        setProfileProgress({ done, total });
        setProfileCols((prev) => [...prev, col]);
      });
      setProfileRowCount(result.rowCount);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setProfileLoading(false);
    }
  }, []);

  const handleFile = useCallback(
    async (f: File) => {
      const client = clientRef.current;
      if (!client || !dbReady) {
        setError("DuckDB is still initializing. Please wait.");
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const buffer = await f.arrayBuffer();
        await client.loadParquet(buffer, f.name, f.size);
        setFile({ name: f.name, size: f.size });
        // Auto-run preview and schema
        await Promise.all([runPreview(), runSchema()]);
        setTab(0);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setLoading(false);
      }
    },
    [dbReady, runPreview, runSchema]
  );

  const handleReset = useCallback(() => {
    setFile(null);
    setPreviewCols([]);
    setPreviewRows([]);
    setPreviewRowCount(0);
    setSchema([]);
    setProfileCols([]);
    setProfileRowCount(null);
    setProfileProgress(null);
    setTab(0);
  }, []);

  const handleQuery = useCallback(
    async (sql: string) => {
      const client = clientRef.current;
      if (!client) throw new Error("DuckDB not ready");
      return client.query(sql);
    },
    []
  );

  // Auto-run profile when Profile tab is selected and no profile data exists
  const handleTabChange = useCallback(
    (_: React.SyntheticEvent, newTab: number) => {
      setTab(newTab);
      if (newTab === 2 && file && profileCols.length === 0 && !profileLoading) {
        runProfile();
      }
    },
    [file, profileCols.length, profileLoading, runProfile]
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: "flex", flexDirection: "column", height: "100vh" }}>
        <AppBar
          position="static"
          sx={{ bgcolor: "background.paper", color: "text.primary" }}
          elevation={1}
        >
          <Toolbar variant="dense">
            <StorageIcon sx={{ mr: 1, color: "primary.main" }} />
            <Typography variant="h6" noWrap sx={{ mr: 2 }}>
              Parquet Visualizer
            </Typography>
            {file && (
              <Chip
                icon={<InsertDriveFileIcon />}
                label={`${file.name} (${formatSize(file.size)})`}
                size="small"
                variant="outlined"
                onDelete={handleReset}
                deleteIcon={
                  <Tooltip title="Reset">
                    <RestartAltIcon />
                  </Tooltip>
                }
                sx={{ mr: 1 }}
              />
            )}
            <Box sx={{ flexGrow: 1 }} />
            <LocalOnlyBadge />
            <Box sx={{ ml: 1 }}>
              <ThemeToggle mode={mode} onToggle={toggleTheme} />
            </Box>
          </Toolbar>
        </AppBar>

        {!file ? (
          <Box
            sx={{
              flexGrow: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              p: 4,
            }}
          >
            <Box sx={{ maxWidth: 480, width: "100%" }}>
              <Typography
                variant="h5"
                textAlign="center"
                sx={{ mb: 1, fontWeight: 500 }}
              >
                Explore Parquet files locally
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                textAlign="center"
                sx={{ mb: 3 }}
              >
                All processing happens in your browser. No data leaves your
                device.
              </Typography>
              <FileDropzone onFile={handleFile} disabled={loading || !dbReady} />
              {!dbReady && (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  textAlign="center"
                  sx={{ mt: 2, display: "block" }}
                >
                  Initializing DuckDB engine...
                </Typography>
              )}
            </Box>
          </Box>
        ) : (
          <Box sx={{ flexGrow: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
            <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
              <Tabs value={tab} onChange={handleTabChange}>
                <Tab label="Preview" />
                <Tab label="Schema" />
                <Tab label="Profile" />
                <Tab label="Query" />
              </Tabs>
            </Box>

            <Box sx={{ flexGrow: 1, overflow: "auto", minHeight: 0 }}>
              {tab === 0 && (
                <PreviewTab
                  columns={previewCols}
                  rows={previewRows}
                  rowCount={previewRowCount}
                  loading={previewLoading}
                />
              )}
              {tab === 1 && (
                <SchemaTab columns={schema} loading={schemaLoading} />
              )}
              {tab === 2 && (
                <ProfileTab
                  rowCount={profileRowCount}
                  columns={profileCols}
                  progress={profileProgress}
                  loading={profileLoading}
                />
              )}
              {tab === 3 && (
                <QueryTab
                  onQuery={handleQuery}
                  fileLoaded={!!file}
                  schema={schema}
                />
              )}
            </Box>
          </Box>
        )}
      </Box>

      <ErrorSnackbar message={error} onClose={() => setError(null)} />
    </ThemeProvider>
  );
}
