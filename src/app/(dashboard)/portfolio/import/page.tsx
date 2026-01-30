'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useDropzone } from 'react-dropzone';
import Papa from 'papaparse';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Upload,
  FileSpreadsheet,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ArrowLeft,
  Loader2,
  Server,
  Calendar,
} from 'lucide-react';
import Link from 'next/link';

interface RegisterItRow {
  ID?: string;
  Dominio?: string;
  Descrizione?: string;
  'Dati Supplementari'?: string;
  'Data di Scadenza'?: string;
}

interface ImportResult {
  domain: string;
  status: 'created' | 'exists' | 'error';
  siteId?: string;
  serverAssigned?: string;
  error?: string;
}

interface ImportResponse {
  success: boolean;
  message: string;
  summary: {
    total: number;
    created: number;
    skipped: number;
    errors: number;
    assigned: number;
  };
  results: ImportResult[];
}

export default function ImportRegistrarPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<RegisterItRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ImportResponse | null>(null);
  const [registrar, setRegistrar] = useState('Register.it');
  const [autoAssign, setAutoAssign] = useState(true);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      setFile(file);
      setResult(null);

      // Parse CSV
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        encoding: 'UTF-8',
        complete: (results) => {
          // Filter out rows without a domain
          const data = (results.data as RegisterItRow[]).filter(
            row => row.Dominio || row.dominio
          );
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
      'application/vnd.ms-excel': ['.csv'],
    },
    maxFiles: 1,
  });

  const handleImport = async () => {
    if (parsedData.length === 0) return;

    setImporting(true);
    setProgress(10);

    try {
      const response = await fetch('/api/portfolio/import-registrar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rows: parsedData,
          registrar,
          autoAssign,
        }),
      });

      setProgress(90);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Errore durante l\'importazione');
      }

      setResult(data);
      setProgress(100);

      if (data.summary.created > 0) {
        toast.success(`Importati ${data.summary.created} domini`);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Errore durante l\'importazione');
    } finally {
      setImporting(false);
    }
  };

  const getDomain = (row: RegisterItRow) => row.Dominio || (row as any).dominio || '';
  const getExpiry = (row: RegisterItRow) => row['Data di Scadenza'] || (row as any)['data di scadenza'] || '';

  return (
    <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/portfolio">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Importa Domini da Registrar</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Importa domini da Register.it, Aruba, o altri registrar
          </p>
        </div>
      </div>

      {/* Instructions */}
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-base sm:text-lg">Formato Supportato</CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            CSV esportato da Register.it o simili con le colonne:
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
          <div className="flex flex-wrap gap-2 mb-4">
            <Badge variant="secondary">ID</Badge>
            <Badge variant="secondary">Dominio</Badge>
            <Badge variant="secondary">Descrizione</Badge>
            <Badge variant="secondary">Data di Scadenza</Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            I domini saranno importati con la data di scadenza e automaticamente assegnati
            al server corretto via DNS (se configurato).
          </p>
        </CardContent>
      </Card>

      {/* Options */}
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-base sm:text-lg">Opzioni Import</CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0 space-y-4">
          <div className="flex items-center gap-4">
            <Label htmlFor="registrar" className="text-sm w-24">Registrar:</Label>
            <Input
              id="registrar"
              value={registrar}
              onChange={(e) => setRegistrar(e.target.value)}
              placeholder="Register.it"
              className="max-w-xs"
            />
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg border">
            <div className="flex items-center gap-2">
              <Server className="h-4 w-4 text-muted-foreground" />
              <div>
                <Label htmlFor="autoAssign" className="text-sm font-medium">
                  Auto-assegna Server
                </Label>
                <p className="text-xs text-muted-foreground">
                  Risolvi DNS e assegna automaticamente al server corretto
                </p>
              </div>
            </div>
            <Switch
              id="autoAssign"
              checked={autoAssign}
              onCheckedChange={setAutoAssign}
            />
          </div>
        </CardContent>
      </Card>

      {/* Upload Area */}
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-base sm:text-lg">Carica File CSV</CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-lg p-4 sm:p-8 text-center cursor-pointer
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
                <FileSpreadsheet className="h-6 w-6 sm:h-8 sm:w-8 text-green-500" />
                <div>
                  <span className="font-medium text-sm sm:text-base">{file.name}</span>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {parsedData.length} domini trovati
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <Upload className="h-6 w-6 sm:h-8 sm:w-8 mx-auto text-muted-foreground" />
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Trascina qui il file CSV esportato da Register.it
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Preview */}
      {parsedData.length > 0 && !result && (
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-base sm:text-lg">
              Anteprima ({parsedData.length} domini)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
            <ScrollArea className="h-64 rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs sm:text-sm">#</TableHead>
                    <TableHead className="text-xs sm:text-sm">Dominio</TableHead>
                    <TableHead className="text-xs sm:text-sm">Scadenza</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedData.slice(0, 50).map((row, i) => (
                    <TableRow key={i}>
                      <TableCell className="text-xs sm:text-sm text-muted-foreground">
                        {i + 1}
                      </TableCell>
                      <TableCell className="text-xs sm:text-sm font-mono">
                        {getDomain(row)}
                      </TableCell>
                      <TableCell className="text-xs sm:text-sm">
                        {getExpiry(row) && (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            {getExpiry(row)}
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {parsedData.length > 50 && (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-muted-foreground text-xs">
                        ... e altri {parsedData.length - 50} domini
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </ScrollArea>

            {importing && (
              <div className="mt-4 space-y-2">
                <Progress value={progress} className="h-2" />
                <p className="text-xs sm:text-sm text-center text-muted-foreground">
                  Importazione in corso... {progress}%
                </p>
              </div>
            )}

            <div className="mt-4 flex gap-2">
              <Button onClick={handleImport} disabled={importing}>
                {importing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Importa {parsedData.length} Domini
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
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              {result.summary.errors === 0 ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : result.summary.created === 0 ? (
                <XCircle className="h-5 w-5 text-red-500" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
              )}
              Risultato Importazione
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0 space-y-4">
            {/* Summary */}
            <div className="grid grid-cols-5 gap-2 text-center">
              <div className="p-3 rounded-lg bg-muted">
                <div className="text-xl font-bold">{result.summary.total}</div>
                <div className="text-xs text-muted-foreground">Totali</div>
              </div>
              <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900/30">
                <div className="text-xl font-bold text-green-600">{result.summary.created}</div>
                <div className="text-xs text-muted-foreground">Creati</div>
              </div>
              <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <div className="text-xl font-bold text-blue-600">{result.summary.assigned}</div>
                <div className="text-xs text-muted-foreground">Server</div>
              </div>
              <div className="p-3 rounded-lg bg-yellow-100 dark:bg-yellow-900/30">
                <div className="text-xl font-bold text-yellow-600">{result.summary.skipped}</div>
                <div className="text-xs text-muted-foreground">Esistenti</div>
              </div>
              <div className="p-3 rounded-lg bg-red-100 dark:bg-red-900/30">
                <div className="text-xl font-bold text-red-600">{result.summary.errors}</div>
                <div className="text-xs text-muted-foreground">Errori</div>
              </div>
            </div>

            {/* Results list */}
            <ScrollArea className="h-64 rounded-md border p-3">
              <div className="space-y-1">
                {result.results.map((r, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-2">
                      {r.status === 'created' && (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      )}
                      {r.status === 'exists' && (
                        <AlertTriangle className="h-4 w-4 text-yellow-500" />
                      )}
                      {r.status === 'error' && (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                      <span className="text-sm font-mono">{r.domain}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {r.serverAssigned && (
                        <Badge variant="secondary" className="text-xs">
                          <Server className="h-3 w-3 mr-1" />
                          {r.serverAssigned}
                        </Badge>
                      )}
                      {r.status === 'exists' && (
                        <Badge variant="outline" className="text-xs text-yellow-600">
                          Già presente
                        </Badge>
                      )}
                      {r.error && r.status === 'error' && (
                        <Badge variant="destructive" className="text-xs">
                          Errore
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="flex gap-2">
              <Button onClick={() => router.push('/portfolio')}>
                Vai al Portfolio
              </Button>
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
