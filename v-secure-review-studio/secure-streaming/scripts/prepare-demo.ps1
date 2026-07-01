$ErrorActionPreference = "Stop"

$RootDir = Resolve-Path (Join-Path $PSScriptRoot "..")
$ProjectDir = Resolve-Path (Join-Path $RootDir "..")
$SourceVideo = Join-Path $ProjectDir "client/public/sample.mp4"
$TargetVideo = Join-Path $RootDir "input/sample.mp4"

if (-not (Test-Path -LiteralPath $SourceVideo)) {
  throw "React sample video not found: $SourceVideo. Add client/public/sample.mp4 or copy a video to secure-streaming/input/sample.mp4."
}

Copy-Item -LiteralPath $SourceVideo -Destination $TargetVideo -Force
& (Join-Path $PSScriptRoot "generate-hls.ps1") -InputFile $TargetVideo

Write-Host "Demo HLS is ready. Start the stack with:"
Write-Host "  cd secure-streaming; docker compose up"
