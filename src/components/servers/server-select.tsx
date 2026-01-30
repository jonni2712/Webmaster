'use client';

import { useState, useEffect } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Server, Loader2 } from 'lucide-react';
import type { Server as ServerType } from '@/types/database';

interface ServerSelectProps {
  value: string | null | undefined;
  onChange: (value: string | null) => void;
  disabled?: boolean;
}

export function ServerSelect({ value, onChange, disabled }: ServerSelectProps) {
  const [servers, setServers] = useState<ServerType[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchServers();
  }, []);

  const fetchServers = async () => {
    try {
      const res = await fetch('/api/servers');
      if (res.ok) {
        const data = await res.json();
        setServers(data.servers || []);
      }
    } catch (error) {
      console.error('Error fetching servers:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 h-10 px-3 border rounded-md bg-muted/50">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Caricamento server...</span>
      </div>
    );
  }

  return (
    <Select
      value={value || 'none'}
      onValueChange={(val) => onChange(val === 'none' ? null : val)}
      disabled={disabled}
    >
      <SelectTrigger className="h-9 sm:h-10">
        <SelectValue placeholder="Seleziona server">
          {value && value !== 'none' ? (
            <div className="flex items-center gap-2">
              <Server className="h-4 w-4" />
              {servers.find(s => s.id === value)?.name || 'Server'}
            </div>
          ) : (
            <span className="text-muted-foreground">Nessun server</span>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none">Nessun server</SelectItem>
        {servers.filter(s => s.is_active).map((server) => (
          <SelectItem key={server.id} value={server.id}>
            <div className="flex items-center gap-2">
              <Server className="h-4 w-4" />
              <span>{server.name}</span>
              {server.provider && (
                <span className="text-muted-foreground text-xs">
                  ({server.provider})
                </span>
              )}
            </div>
          </SelectItem>
        ))}
        {servers.filter(s => !s.is_active).length > 0 && (
          <>
            <div className="px-2 py-1.5 text-xs text-muted-foreground border-t mt-1 pt-1">
              Server inattivi
            </div>
            {servers.filter(s => !s.is_active).map((server) => (
              <SelectItem key={server.id} value={server.id}>
                <div className="flex items-center gap-2 opacity-60">
                  <Server className="h-4 w-4" />
                  <span>{server.name}</span>
                  <span className="text-muted-foreground text-xs">(inattivo)</span>
                </div>
              </SelectItem>
            ))}
          </>
        )}
      </SelectContent>
    </Select>
  );
}
