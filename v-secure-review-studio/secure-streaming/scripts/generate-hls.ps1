param(
  [string]$InputFile = ""
)

$ErrorActionPreference = "Stop"

$RootDir = Resolve-Path (Join-Path $PSScriptRoot "..")
if ([string]::IsNullOrWhiteSpace($InputFile)) {
  $InputFile = Join-Path $RootDir "input/sample.mp4"
}

$OutputDir = Join-Path $RootDir "output"
$SecretsDir = Join-Path $RootDir "secrets"
$KeyFile = Join-Path $SecretsDir "demo.key"
$KeyInfoFile = Join-Path $SecretsDir "demo.keyinfo"
$Token = if ($env:HLS_DEMO_TOKEN) { $env:HLS_DEMO_TOKEN } else { "demo-secure-token" }
$KeyUri = if ($env:HLS_KEY_URI) { $env:HLS_KEY_URI } else { "http://localhost:8080/keys/demo.key?token=$Token" }

if (-not (Get-Command ffmpeg -ErrorAction SilentlyContinue)) {
  throw "ffmpeg is required. Install ffmpeg and rerun this script."
}

if (-not (Test-Path -LiteralPath $InputFile)) {
  throw "Input video not found: $InputFile"
}

New-Item -ItemType Directory -Force -Path $OutputDir, $SecretsDir | Out-Null
Get-ChildItem -LiteralPath $OutputDir -Include *.m3u8, *.ts -File -ErrorAction SilentlyContinue | Remove-Item -Force
if (Test-Path -LiteralPath $KeyInfoFile) {
  Remove-Item -LiteralPath $KeyInfoFile -Force
}

$KeyBytes = New-Object byte[] 16
$Rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
$Rng.GetBytes($KeyBytes)
[System.IO.File]::WriteAllBytes($KeyFile, $KeyBytes)

$IvBytes = New-Object byte[] 16
$Rng.GetBytes($IvBytes)
$Rng.Dispose()
$IvHex = ($IvBytes | ForEach-Object { $_.ToString("x2") }) -join ""

$KeyInfo = "$KeyUri`n$KeyFile`n$IvHex`n"
Set-Content -LiteralPath $KeyInfoFile -Value $KeyInfo -NoNewline -Encoding ascii

& ffmpeg -y `
  -i $InputFile `
  -c:v libx264 `
  -preset veryfast `
  -profile:v main `
  -c:a aac `
  -b:a 128k `
  -hls_time 6 `
  -hls_playlist_type vod `
  -hls_key_info_file $KeyInfoFile `
  -hls_segment_filename (Join-Path $OutputDir "segment_%03d.ts") `
  (Join-Path $OutputDir "master.m3u8")

Write-Host "Encrypted HLS generated:"
Write-Host "  Playlist: $(Join-Path $OutputDir "master.m3u8")"
Write-Host "  Key:      $KeyFile"
Write-Host "  URI:      $KeyUri"
