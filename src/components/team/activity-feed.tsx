'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, ChevronDown } from 'lucide-react';
import { ActivityItem } from './activity-item';
import type { ActivityLog } from '@/types/database';

interface ActivityFeedProps {
  limit?: number;
  showLoadMore?: boolean;
}

export function ActivityFeed({ limit = 10, showLoadMore = true }: ActivityFeedProps) {
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    fetchActivities(1);
  }, []);

  async function fetchActivities(pageNum: number) {
    if (pageNum === 1) {
      setIsLoading(true);
    } else {
      setIsLoadingMore(true);
    }

    try {
      const response = await fetch(`/api/team/activity?page=${pageNum}&limit=${limit}`);
      const data = await response.json();

      if (response.ok) {
        if (pageNum === 1) {
          setActivities(data.activities);
        } else {
          setActivities(prev => [...prev, ...data.activities]);
        }
        setHasMore(data.pagination.page < data.pagination.totalPages);
        setPage(pageNum);
      }
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }

  function handleLoadMore() {
    fetchActivities(page + 1);
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Attivita recente</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (activities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Attivita recente</CardTitle>
          <CardDescription>
            Nessuna attivita registrata
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Attivita recente</CardTitle>
        <CardDescription>
          Cronologia delle azioni nel team
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-1">
            {activities.map(activity => (
              <ActivityItem key={activity.id} activity={activity} />
            ))}
          </div>

          {showLoadMore && hasMore && (
            <div className="pt-4 text-center">
              <Button
                variant="outline"
                size="sm"
                onClick={handleLoadMore}
                disabled={isLoadingMore}
              >
                {isLoadingMore ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <ChevronDown className="mr-2 h-4 w-4" />
                )}
                Carica altre
              </Button>
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
