# bundle-windows.ps1
# Descarga el .exe de Supabase, lo empaqueta con el .bat y sube el .zip

param(
    [string]$Version = "v0.2.0",
    [string]$SupabaseUrl = "https://cccntuyiekdajmgfrfsx.supabase.co",
    [string]$SupabaseServiceKey = ""
)

if (-not $SupabaseServiceKey) {
    $SupabaseServiceKey = Read-Host "Pega tu Supabase service_role key"
}

$tmp     = "$env:TEMP\agendivo-bundle"
$exeName = "Agendivo_0.2.0_x64-setup.exe"
$batSrc  = "$PSScriptRoot\instalar-windows.bat"
$zipName = "Agendivo_0.2.0_Windows.zip"
$zipPath = "$tmp\$zipName"

New-Item -ItemType Directory -Force -Path $tmp | Out-Null

# 1. Descargar .exe desde Supabase
Write-Host "Descargando $exeName..." -ForegroundColor Cyan
$headers = @{ "Authorization" = "Bearer $SupabaseServiceKey" }
Invoke-WebRequest `
    -Uri "$SupabaseUrl/storage/v1/object/desktop-releases/$Version/$exeName" `
    -Headers $headers `
    -OutFile "$tmp\$exeName"

# 2. Copiar .bat junto al .exe
Copy-Item $batSrc "$tmp\instalar-windows.bat"

# 3. Crear zip
Write-Host "Empaquetando zip..." -ForegroundColor Cyan
if (Test-Path $zipPath) { Remove-Item $zipPath }
Compress-Archive -Path "$tmp\$exeName", "$tmp\instalar-windows.bat" -DestinationPath $zipPath

# 4. Subir zip a Supabase
Write-Host "Subiendo $zipName a Supabase..." -ForegroundColor Cyan
$uploadHeaders = @{
    "Authorization" = "Bearer $SupabaseServiceKey"
    "Content-Type"  = "application/octet-stream"
}
Invoke-RestMethod `
    -Uri "$SupabaseUrl/storage/v1/object/desktop-releases/$Version/$zipName" `
    -Method Post `
    -Headers $uploadHeaders `
    -InFile $zipPath

Write-Host "`nListo! Archivo disponible en:" -ForegroundColor Green
Write-Host "  desktop-releases/$Version/$zipName"

# 5. Limpiar tmp
Remove-Item "$tmp\$exeName", "$tmp\instalar-windows.bat", $zipPath
