import { useState, useRef, type ChangeEvent } from 'react';
import {
  Upload,
  FileText,
  CheckCircle,
  AlertCircle,
  X,
  Download,
  ArrowRight,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { INDIA_CITIES } from '@/data/indiaData';
import { DemoBadge } from '@/components/ui/DemoBadge';
import { PageHeader } from '@/components/ui/PageHeader';
import { usePageTitle } from '@/hooks/usePageTitle';

interface ParsedRow {
  [key: string]: string;
}

export function DataUploadPage() {
  usePageTitle('Data upload');
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [status, setStatus] = useState<'idle' | 'validating' | 'validated' | 'importing' | 'imported' | 'error'>('idle');
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const EXPECTED_COLUMNS = [
    'timestamp',
    'latitude',
    'longitude',
    'methane',
    'aqi',
    'temperature',
    'humidity',
    'wind_speed',
    'wind_direction',
  ];

  const handleFile = (f: File) => {
    setFile(f);
    setStatus('validating');
    setErrors([]);
    setRows([]);
    setColumns([]);

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (f.name.endsWith('.json')) {
        try {
          const data = JSON.parse(content);
          const arr = Array.isArray(data) ? data : [data];
          if (arr.length > 0) {
            const cols = Object.keys(arr[0]);
            setColumns(cols);
            setRows(arr.slice(0, 100));
            setColumnMapping({});
            cols.forEach((c) => {
              const match = EXPECTED_COLUMNS.find((ec) => ec.toLowerCase() === c.toLowerCase());
              if (match) setColumnMapping((prev) => ({ ...prev, [c]: match }));
            });
            setStatus('validated');
          } else {
            setErrors(['JSON file is empty or not an array.']);
            setStatus('error');
          }
        } catch {
          setErrors(['Invalid JSON format.']);
          setStatus('error');
        }
      } else {
        // CSV
        const lines = content.split('\n').filter((l) => l.trim());
        if (lines.length < 2) {
          setErrors(['CSV file must have a header row and at least one data row.']);
          setStatus('error');
          return;
        }
        const cols = lines[0].split(',').map((c) => c.trim());
        setColumns(cols);
        const parsed: ParsedRow[] = [];
        for (let i = 1; i < Math.min(lines.length, 101); i++) {
          const values = lines[i].split(',').map((v) => v.trim());
          const row: ParsedRow = {};
          cols.forEach((c, j) => { row[c] = values[j] ?? ''; });
          parsed.push(row);
        }
        setRows(parsed);
        setColumnMapping({});
        cols.forEach((c) => {
          const match = EXPECTED_COLUMNS.find((ec) => ec.toLowerCase() === c.toLowerCase());
          if (match) setColumnMapping((prev) => ({ ...prev, [c]: match }));
        });
        setStatus('validated');
      }
    };
    reader.readAsText(f);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f && (f.name.endsWith('.csv') || f.name.endsWith('.json'))) {
      handleFile(f);
    } else {
      setErrors(['Please upload a CSV or JSON file.']);
      setStatus('error');
    }
  };

  const handleImport = async () => {
    if (!user) return;
    setStatus('importing');
    try {
      if (user.id.startsWith('guest-')) {
        // Guest demo session: simulate import without hitting Postgres foreign key constraint
        await new Promise((res) => setTimeout(res, 500));
        setStatus('imported');
        return;
      }

      // Save dataset metadata
      const { error: metaError } = await supabase.from('uploaded_datasets').insert({
        user_id: user.id,
        filename: file?.name ?? 'unknown',
        file_type: file?.name.endsWith('.json') ? 'json' : 'csv',
        file_size: file?.size ?? null,
        row_count: rows.length,
        columns,
        column_mapping: columnMapping,
        status: 'imported',
        description: 'User-uploaded environmental dataset',
      });

      if (metaError) throw metaError;

      // Insert observations based on mapping
      const mapped = rows.map((row) => {
        const get = (field: string) => {
          const col = Object.entries(columnMapping).find(([, v]) => v === field)?.[0];
          return col ? row[col] : '';
        };
        return {
          location_name: 'User Upload',
          latitude: parseFloat(get('latitude')) || 0,
          longitude: parseFloat(get('longitude')) || 0,
          methane_index: parseFloat(get('methane')) || 0,
          methane_unit: 'ppb',
          data_source: 'user_uploaded',
          observed_at: get('timestamp') || new Date().toISOString(),
        };
      });

      if (mapped.length > 0) {
        await supabase.from('methane_observations').insert(mapped);
      }

      setStatus('imported');
    } catch (err) {
      setErrors([err instanceof Error ? err.message : 'Import failed.']);
      setStatus('error');
    }
  };

  const downloadDemoCSV = () => {
    const header = EXPECTED_COLUMNS.join(',');
    const lines = [header];
    for (let i = 0; i < 20; i++) {
      const city = INDIA_CITIES[i % INDIA_CITIES.length];
      const ts = new Date(Date.now() - i * 3600000).toISOString();
      lines.push([
        ts,
        city.latitude.toFixed(4),
        city.longitude.toFixed(4),
        Math.round(1900 + Math.random() * 500),
        Math.round(50 + Math.random() * 200),
        Math.round(20 + Math.random() * 15),
        Math.round(40 + Math.random() * 40),
        (Math.random() * 20).toFixed(1),
        Math.round(Math.random() * 360),
      ].join(','));
    }
    const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'airsense_demo_dataset.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const reset = () => {
    setFile(null);
    setRows([]);
    setColumns([]);
    setErrors([]);
    setStatus('idle');
    setColumnMapping({});
  };

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <PageHeader
        title="Data upload"
        description="Import CSV or JSON environmental datasets for analysis"
        actions={
          <button onClick={downloadDemoCSV} className="btn-secondary !py-1.5 !px-3 text-[13px]">
            <Download className="w-3.5 h-3.5" /> Sample dataset
          </button>
        }
      />

      {status === 'idle' || status === 'error' ? (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`surface p-12 border-2 border-dashed cursor-pointer transition-colors ${dragOver ? 'border-primary-500 bg-[var(--color-primary-soft)]' : 'border-[var(--color-border)] hover:border-[var(--color-border-strong)]'}`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.json"
            className="hidden"
            onChange={(e: ChangeEvent<HTMLInputElement>) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
          <div className="text-center">
            <p className="kicker mb-3">Step 1 — Upload</p>
            <div className="p-4 rounded-full bg-[var(--color-primary-soft)] w-fit mx-auto mb-4">
              <Upload className="w-7 h-7 text-[var(--color-primary-text)]" strokeWidth={1.75} />
            </div>
            <p className="font-semibold mb-1">Drop your file here or click to browse</p>
            <p className="text-sm text-muted">Supports CSV and JSON files</p>
          </div>
        </div>
      ) : null}

      {errors.length > 0 && (
        <div className="surface p-4 border-error-500/30">
          {errors.map((err, i) => (
            <div key={i} className="flex items-center gap-2 text-sm text-error-500 mb-1">
              <AlertCircle className="w-4 h-4" /> {err}
            </div>
          ))}
          <button onClick={reset} className="btn-secondary text-sm mt-3">Try Again</button>
        </div>
      )}

      {status === 'validated' && (
        <>
          {/* File info */}
          <div className="surface p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="w-8 h-8 text-primary-500" />
              <div>
                <p className="font-medium text-sm">{file?.name}</p>
                <p className="text-xs text-muted">{rows.length} rows · {columns.length} columns</p>
              </div>
            </div>
            <button onClick={reset} className="p-1.5 rounded-lg hover:bg-[var(--color-surface-2)]">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Column mapping */}
          <div className="surface p-5">
            <p className="kicker mb-1.5">Step 2 — Column mapping</p>
            <p className="text-[13px] text-secondary mb-4">Map your dataset columns to AirSense fields. Auto-detected columns are pre-filled.</p>
            <div className="space-y-2">
              {columns.map((col) => (
                <div key={col} className="flex items-center gap-3">
                  <span className="text-sm font-medium w-1/3 truncate">{col}</span>
                  <ArrowRight className="w-4 h-4 text-muted flex-shrink-0" />
                  <select
                    value={columnMapping[col] ?? ''}
                    onChange={(e) => setColumnMapping({ ...columnMapping, [col]: e.target.value })}
                    className="input-field text-sm flex-1"
                  >
                    <option value="">— Skip —</option>
                    {EXPECTED_COLUMNS.map((ec) => (
                      <option key={ec} value={ec}>{ec}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="surface p-5">
            <p className="kicker mb-1.5">Step 3 — Preview</p>
            <p className="text-[13px] text-secondary flex items-center gap-2 mb-3">
              Data preview (first 10 rows)
            </p>
            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-[var(--color-border)]">
                    {columns.map((c) => (
                      <th key={c} className="text-left p-2 font-semibold whitespace-nowrap">{c}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(0, 10).map((row, i) => (
                    <tr key={i} className="border-b border-[var(--color-border)]">
                      {columns.map((c) => (
                        <td key={c} className="p-2 whitespace-nowrap text-muted">{row[c]}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <button onClick={handleImport} className="btn-primary w-full py-3 flex items-center justify-center gap-2">
            <CheckCircle className="w-5 h-5" /> Import Dataset
          </button>
        </>
      )}

      {status === 'importing' && (
        <div className="surface p-8 text-center">
          <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full mx-auto mb-3" />
          <p className="text-sm text-muted">Importing data...</p>
        </div>
      )}

      {status === 'imported' && (
        <div className="surface p-8 text-center">
          <CheckCircle className="w-12 h-12 text-success-500 mx-auto mb-3" />
          <h3 className="font-semibold text-lg mb-1">Import Successful!</h3>
          <p className="text-sm text-muted mb-4">{rows.length} rows imported and available for analysis.</p>
          <button onClick={reset} className="btn-secondary">Upload Another File</button>
        </div>
      )}

      <div className="surface p-4">
        <h3 className="text-sm font-semibold mb-2">Expected CSV Format</h3>
        <p className="text-xs text-muted mb-2">Columns: timestamp, latitude, longitude, methane, aqi, temperature, humidity, wind_speed, wind_direction</p>
        <DemoBadge show={true} label="Reference dataset for download" />
      </div>
    </div>
  );
}
