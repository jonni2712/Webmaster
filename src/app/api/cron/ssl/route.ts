import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { createAdminClient } from '@/lib/supabase/admin';
import { checkSSL } from '@/lib/monitoring/ssl-checker';

export const runtime = 'edge';
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const headersList = await headers();
  const authHeader = headersList.get('authorization');

  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = createAdminClient();

    const { data: sites, error } = await supabase
      .from('sites')
      .select('id, url, tenant_id')
      .eq('is_active', true)
      .eq('ssl_check_enabled', true);

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

    const BATCH_SIZE = 10;
    const results = {
      processed: 0,
      successful: 0,
      failed: 0,
    };

    for (let i = 0; i < sites.length; i += BATCH_SIZE) {
      const batch = sites.slice(i, i + BATCH_SIZE);

      const batchResults = await Promise.allSettled(
        batch.map(async (site) => {
          const result = await checkSSL(site.url);

          const { error: insertError } = await supabase
            .from('ssl_checks')
            .insert({
              site_id: site.id,
              is_valid: result.isValid,
              valid_from: result.validFrom,
              valid_to: result.validTo,
              days_until_expiry: result.daysUntilExpiry,
              issuer: result.issuer,
              subject: result.subject,
              serial_number: result.serialNumber,
              error_message: result.errorMessage,
            });

          if (insertError) {
            throw new Error(`Failed to save SSL check for ${site.url}`);
          }

          return result;
        })
      );

      for (const result of batchResults) {
        results.processed++;
        if (result.status === 'fulfilled') {
          results.successful++;
        } else {
          results.failed++;
        }
      }
    }

    return NextResponse.json({
      ...results,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Cron SSL error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
