Add-Type -AssemblyName System.IO.Compression.FileSystem

$zipPath = "C:\GitHub\Piattaforma WEBMASTER\webmaster-platform\public\downloads\webmaster-monitor-v1.0.0.zip"
$sourcePath = "C:\GitHub\Piattaforma WEBMASTER\webmaster-platform\wordpress-plugin\webmaster-monitor"

# Remove old zip if exists
if (Test-Path $zipPath) {
    Remove-Item -Force $zipPath
}

$zip = [System.IO.Compression.ZipFile]::Open($zipPath, 'Create')

Get-ChildItem -Path $sourcePath -Recurse -File | ForEach-Object {
    $relativePath = $_.FullName.Substring($sourcePath.Length - "webmaster-monitor".Length)
    $relativePath = $relativePath.Replace('\', '/')
    if ($relativePath.StartsWith('/')) {
        $relativePath = $relativePath.Substring(1)
    }
    Write-Host "Adding: $relativePath"
    [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, $_.FullName, $relativePath) | Out-Null
}

$zip.Dispose()
Write-Host "ZIP created successfully at $zipPath"
