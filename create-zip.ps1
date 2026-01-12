Add-Type -AssemblyName System.IO.Compression.FileSystem

$zipPath = "C:\GitHub\Piattaforma WEBMASTER\webmaster-platform\public\downloads\webmaster-monitor.zip"
$sourcePath = "C:\GitHub\Piattaforma WEBMASTER\webmaster-platform\wordpress-plugin\webmaster-monitor"
$pluginFolderName = "webmaster-monitor"

# Remove old zip if exists
if (Test-Path $zipPath) {
    Remove-Item -Force $zipPath
}

# Create new ZIP
$zip = [System.IO.Compression.ZipFile]::Open($zipPath, 'Create')

# Add all files with forward slashes
Get-ChildItem -Path $sourcePath -Recurse -File | ForEach-Object {
    # Calculate relative path from parent of source (to include webmaster-monitor folder)
    $fullPath = $_.FullName
    $parentOfSource = Split-Path $sourcePath -Parent
    $relativePath = $fullPath.Substring($parentOfSource.Length + 1)

    # Convert backslashes to forward slashes
    $relativePath = $relativePath.Replace('\', '/')

    Write-Host "Adding: $relativePath"
    [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, $fullPath, $relativePath) | Out-Null
}

$zip.Dispose()
Write-Host "`nZIP created successfully at $zipPath"

# Verify entries
$zip = [System.IO.Compression.ZipFile]::OpenRead($zipPath)
Write-Host "`nEntries in ZIP (should have forward slashes):"
foreach ($entry in $zip.Entries) {
    Write-Host "  $($entry.FullName)"
}
$zip.Dispose()
