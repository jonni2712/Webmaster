'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useDropzone } from 'react-dropzone';
import Papa from 'papaparse';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Upload,
  FileSpreadsheet,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Download,
} from 'lucide-react';
import type { CSVSiteRow, ImportResult } from '@/types';

export default function ImportPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<CSVSiteRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ImportResult | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      setFile(file);
      setResult(null);

      // Parse CSV
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const data = results.data as CSVSiteRow[];
          setParsedData(data);
        },
        error: (error) => {
          toast.error(`Errore parsing CSV: ${error.message}`);
        },
      });
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
    },
    maxFiles: 1,
  });

  const handleImport = async () => {
    if (parsedData.length === 0) return;

    setImporting(true);
    setProgress(0);

    const errors: Array<{ row: number; error: string }> = [];
    let imported = 0;

    for (let i = 0; i < parsedData.length; i++) {
      const row = parsedData[i];

      try {
        // Validate row
        if (!row.name || !row.url) {
          errors.push({ row: i + 1, error: 'Nome o URL mancante' });
          continue;
        }

        // Normalize platform
        let platform = (row.platform || 'other').toLowerCase();
        if (!['wordpress', 'prestashop', 'other'].includes(platform)) {
          platform = 'other';
        }

        const response = await fetch('/api/sites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: row.name,
            url: row.url.startsWith('http') ? row.url : `https://${row.url}`,
            platform,
            tags: row.tags ? row.tags.split(',').map((t) => t.trim()) : [],
          }),
        });

        if (!response.ok) {
          const data = await response.json();
          errors.push({ row: i + 1, error: data.error || 'Errore sconosciuto' });
        } else {
          imported++;
        }
      } catch (error) {
        errors.push({
          row: i + 1,
          error: error instanceof Error ? error.message : 'Errore sconosciuto',
        });
      }

      setProgress(Math.round(((i + 1) / parsedData.length) * 100));
    }

    setResult({
      total: parsedData.length,
      imported,
      failed: errors.length,
      errors,
    });

    setImporting(false);

    if (imported > 0) {
      toast.success(`Importati ${imported} siti con successo`);
    }
    if (errors.length > 0) {
      toast.error(`${errors.length} siti non importati`);
    }
  };

  const downloadTemplate = () => {
    const template = 'name,url,platform,tags\nMio Sito,https://esempio.com,wordpress,"tag1, tag2"';
    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'template-import-siti.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Importa Siti da CSV</h1>
        <p className="text-muted-foreground">
          Importa multipli siti contemporaneamente da un file CSV
        </p>
      </div>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Formato CSV</CardTitle>
          <CardDescription>
            Il file CSV deve contenere le seguenti colonne
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Colonna</TableHead>
                <TableHead>Richiesta</TableHead>
                <TableHead>Descrizione</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-mono">name</TableCell>
                <TableCell>
                  <Badge>Si</Badge>
                </TableCell>
                <TableCell>Nome identificativo del sito</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-mono">url</TableCell>
                <TableCell>
                  <Badge>Si</Badge>
                </TableCell>
                <TableCell>URL completo del sito (es. https://esempio.com)</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-mono">platform</TableCell>
                <TableCell>
                  <Badge variant="secondary">No</Badge>
                </TableCell>
                <TableCell>wordpress, prestashop, o other (default: other)</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-mono">tags</TableCell>
                <TableCell>
                  <Badge variant="secondary">No</Badge>
                </TableCell>
                <TableCell>Tag separati da virgola</TableCell>
              </TableRow>
            </TableBody>
          </Table>

          <Button variant="outline" className="mt-4" onClick={downloadTemplate}>
            <Download className="h-4 w-4 mr-2" />
            Scarica Template
          </Button>
        </CardContent>
      </Card>

      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle>Carica File</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
              transition-colors
              ${
                isDragActive
                  ? 'border-primary bg-primary/5'
                  : 'border-muted-foreground/25 hover:border-primary/50'
              }
            `}
          >
            <input {...getInputProps()} />
            {file ? (
              <div className="flex items-center justify-center gap-2">
                <FileSpreadsheet className="h-8 w-8 text-green-500" />
                <div>
                  <span className="font-medium">{file.name}</span>
                  <p className="text-sm text-muted-foreground">
                    {parsedData.length} siti trovati
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Trascina qui il file CSV o clicca per selezionarlo
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Preview */}
      {parsedData.length > 0 && !result && (
        <Card>
          <CardHeader>
            <CardTitle>Anteprima ({parsedData.length} siti)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-64 overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>URL</TableHead>
                    <TableHead>Piattaforma</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedData.slice(0, 10).map((row, i) => (
                    <TableRow key={i}>
                      <TableCell>{i + 1}</TableCell>
                      <TableCell>{row.name || '-'}</TableCell>
                      <TableCell className="font-mono text-xs">
                        {row.url || '-'}
                      </TableCell>
                      <TableCell>{row.platform || 'other'}</TableCell>
                    </TableRow>
                  ))}
                  {parsedData.length > 10 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground">
                        ... e altri {parsedData.length - 10} siti
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {importing && (
              <div className="mt-4 space-y-2">
                <Progress value={progress} />
                <p className="text-sm text-center text-muted-foreground">
                  Importazione in corso... {progress}%
                </p>
              </div>
            )}

            <div className="mt-4 flex gap-2">
              <Button onClick={handleImport} disabled={importing}>
                {importing ? 'Importazione...' : 'Avvia Importazione'}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setFile(null);
                  setParsedData([]);
                }}
              >
                Annulla
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {result.failed === 0 ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : result.imported === 0 ? (
                <XCircle className="h-5 w-5 text-red-500" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
              )}
              Risultato Importazione
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-4 rounded-lg bg-muted">
                <div className="text-2xl font-bold">{result.total}</div>
                <div className="text-sm text-muted-foreground">Totali</div>
              </div>
              <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950">
                <div className="text-2xl font-bold text-green-600">{result.imported}</div>
                <div className="text-sm text-muted-foreground">Importati</div>
              </div>
              <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950">
                <div className="text-2xl font-bold text-red-600">{result.failed}</div>
                <div className="text-sm text-muted-foreground">Falliti</div>
              </div>
            </div>

            {result.errors.length > 0 && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Errori durante l&apos;importazione</AlertTitle>
                <AlertDescription>
                  <ul className="mt-2 list-disc list-inside text-sm">
                    {result.errors.slice(0, 5).map((err, i) => (
                      <li key={i}>
                        Riga {err.row}: {err.error}
                      </li>
                    ))}
                    {result.errors.length > 5 && (
                      <li>... e altri {result.errors.length - 5} errori</li>
                    )}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            <div className="flex gap-2">
              <Button onClick={() => router.push('/sites')}>
                Vai ai Siti
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setFile(null);
                  setParsedData([]);
                  setResult(null);
                }}
              >
                Importa Altri
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
