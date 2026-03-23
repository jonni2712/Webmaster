'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Copy, Check, Loader2, Terminal, CheckCircle2, Wifi } from 'lucide-react';

interface AgentSetupProps {
  serverId: string;
  serverName: string;
  panelType: string;
  agentStatus: string;
  onConnected?: () => void;
}

export function AgentSetup({ serverId, serverName, panelType, agentStatus, onConnected }: AgentSetupProps) {
  const [step, setStep] = useState<'generate' | 'install' | 'waiting' | 'connected'>(
    agentStatus === 'online' ? 'connected' : 'generate'
  );
  const [installCommand, setInstallCommand] = useState('');
  const [agentToken, setAgentToken] = useState('');
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');

  // Poll for first heartbeat when waiting
  useEffect(() => {
    if (step !== 'waiting') return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/servers/${serverId}`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.agent_status === 'online') {
          setStep('connected');
          onConnected?.();
        }
      } catch {
        // Ignore polling errors
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [step, serverId, onConnected]);

  const generateToken = async () => {
    setIsGenerating(true);
    setError('');

    try {
      const res = await fetch('/api/agent/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ server_id: serverId, panel_type: panelType }),
      });

      const data = await res.json();
      if (!data.ok) {
        setError(data.error || 'Errore durante la generazione');
        return;
      }

      setAgentToken(data.agent_token);
      setInstallCommand(data.install_command);
      setStep('install');
    } catch {
      setError('Errore di connessione');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyCommand = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(installCommand);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = installCommand;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [installCommand]);

  return (
    <Card>
      <CardHeader className="p-4 sm:p-6">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base sm:text-lg">
            Configurazione Agente — {serverName}
          </CardTitle>
          <Badge variant={panelType === 'cpanel' ? 'default' : 'secondary'}>
            {panelType === 'cpanel' ? 'cPanel / WHM' : 'Plesk'}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0 space-y-4">
        {/* Step indicators */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <StepIndicator active={step === 'generate'} done={step !== 'generate'} label="1. Genera token" />
          <span className="text-muted-foreground/40">→</span>
          <StepIndicator active={step === 'install'} done={step === 'waiting' || step === 'connected'} label="2. Installa" />
          <span className="text-muted-foreground/40">→</span>
          <StepIndicator active={step === 'waiting'} done={step === 'connected'} label="3. Connessione" />
          <span className="text-muted-foreground/40">→</span>
          <StepIndicator active={step === 'connected'} done={false} label="4. Pronto" />
        </div>

        {/* Step: Generate */}
        {step === 'generate' && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Genera un token di autenticazione per connettere l&apos;agente sul server.
              L&apos;agente raccoglierà automaticamente i dati dal pannello {panelType === 'cpanel' ? 'cPanel' : 'Plesk'}.
            </p>
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
            <Button onClick={generateToken} disabled={isGenerating} size="sm">
              {isGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Terminal className="mr-2 h-4 w-4" />
              Genera Token
            </Button>
          </div>
        )}

        {/* Step: Install */}
        {step === 'install' && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Copia ed esegui questo comando via SSH sul server <strong>{serverName}</strong>:
            </p>
            <div className="relative">
              <pre className="bg-muted rounded-md p-3 pr-12 text-xs font-mono overflow-x-auto whitespace-pre-wrap break-all">
                {installCommand}
              </pre>
              <Button
                size="icon"
                variant="ghost"
                className="absolute top-2 right-2 h-7 w-7"
                onClick={copyCommand}
              >
                {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
              </Button>
            </div>
            <Button
              size="sm"
              onClick={() => setStep('waiting')}
            >
              <Wifi className="mr-2 h-4 w-4" />
              Ho eseguito il comando
            </Button>
          </div>
        )}

        {/* Step: Waiting */}
        {step === 'waiting' && (
          <div className="flex items-center gap-3 p-4 bg-muted rounded-md">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">In attesa di connessione...</p>
              <p className="text-xs text-muted-foreground">
                Questa pagina si aggiorna automaticamente quando l&apos;agente si connette.
              </p>
            </div>
          </div>
        )}

        {/* Step: Connected */}
        {step === 'connected' && (
          <div className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/20 rounded-md">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            <div>
              <p className="text-sm font-medium text-green-700 dark:text-green-400">
                Agente connesso!
              </p>
              <p className="text-xs text-muted-foreground">
                I dati verranno sincronizzati automaticamente ogni 15 minuti.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function StepIndicator({ active, done, label }: { active: boolean; done: boolean; label: string }) {
  return (
    <span className={`text-xs ${active ? 'text-foreground font-medium' : done ? 'text-green-500' : 'text-muted-foreground/60'}`}>
      {done ? '✓ ' : ''}{label}
    </span>
  );
}
