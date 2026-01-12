import { NextRequest, NextResponse } from 'next/server';

// Plugin version - keep in sync with /api/plugin/info
const PLUGIN_VERSION = '1.0.1';
const PLUGIN_SLUG = 'webmaster-monitor';
const GITHUB_REPO = 'jonni2712/webmaster-monitor-plugin';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const version = searchParams.get('version') || PLUGIN_VERSION;

  // Redirect to GitHub releases
  const downloadUrl = `https://github.com/${GITHUB_REPO}/releases/download/v${version}/${PLUGIN_SLUG}.zip`;

  return NextResponse.redirect(downloadUrl, {
    status: 302,
    headers: {
      'Cache-Control': 'no-cache',
    },
  });
}
