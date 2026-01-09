import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { createAdminClient } from '@/lib/supabase/admin';
import { checkUptime } from '@/lib/monitoring/uptime-checker';

export const runtime = 'edge';
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  // Verify Vercel Cron secret
  const headersList = await headers();
  const authHeader = headersList.get('authorization');

  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = createAdminClient();

    // Get all active sites with uptime check enabled
    const { data: sites, error } = await supabase
      .from('sites')
      .select('id, url, tenant_id')
      .eq('is_active', true)
      .eq('uptime_check_enabled', true);

    if (error) {
      console.error('Failed to fetch sites:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!sites || sites.length === 0) {
      return NextResponse.json({
        message: 'No sites to check',
        timestamp: new Date().toISOString(),
      });
    }

    // Process in batches to respect rate limits
    const BATCH_SIZE = 10;
    const results = {
      processed: 0,
      successful: 0,
      failed: 0,
      errors: [] as string[],
    };

    for (let i = 0; i < sites.length; i += BATCH_SIZE) {
      const batch = sites.slice(i, i + BATCH_SIZE);

      const batchResults = await Promise.allSettled(
        batch.map(async (site) => {
          const result = await checkUptime(site.url);

          // Save to database
          const { error: insertError } = await supabase
            .from('uptime_checks')
            .insert({
              site_id: site.id,
              is_up: result.isUp,
              status_code: result.statusCode,
              response_time_ms: result.responseTimeMs,
              error_type: result.errorType,
              error_message: result.errorMessage,
            });

          if (insertError) {
            throw new Error(`Failed to save check for ${site.url}: ${insertError.message}`);
          }

          // Update last_check_at on site
          await supabase
            .from('sites')
            .update({ last_check_at: new Date().toISOString() })
            .eq('id', site.id);

          return { siteId: site.id, url: site.url, ...result };
        })
      );

      for (const result of batchResults) {
        results.processed++;
        if (result.status === 'fulfilled') {
          results.successful++;
        } else {
          results.failed++;
          results.errors.push(result.reason?.message || 'Unknown error');
        }
      }
    }

    return NextResponse.json({
      ...results,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Cron uptime error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
