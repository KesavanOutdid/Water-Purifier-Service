# ==============================================================================
# Flutter APK Builder Script (with Dynamic IP Configuration)
# ==============================================================================

Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host " 📱 Flutter App - Auto-Config & APK Builder" -ForegroundColor Cyan
Write-Host "=================================================================" -ForegroundColor Cyan

# 1. Detect Active IP
$ipAddresses = @(Get-NetIPAddress -AddressFamily IPv4 | Where-Object { 
    $_.IPAddress -notlike "127.*" -and 
    $_.IPAddress -notlike "169.254.*" -and 
    $_.InterfaceAlias -notlike "*vEthernet*" -and 
    $_.InterfaceAlias -notlike "*Virtual*" -and 
    $_.InterfaceAlias -notlike "*Loopback*"
} | Select-Object -ExpandProperty IPAddress)

$detectedIp = if ($ipAddresses.Count -gt 0) { $ipAddresses[0] } else { "192.168.0.18" }

Write-Host "`nTarget Backend IP is set to: $detectedIp" -ForegroundColor Green
Write-Host "Press ENTER to accept or type custom IP:" -ForegroundColor Cyan -NoNewline
$customIp = Read-Host " "
if (-not [string]::IsNullOrWhiteSpace($customIp)) {
    $detectedIp = $customIp.Trim()
}

$backendUrl = "http://${detectedIp}:5001"

# 2. Update Flutter .env
$flutterEnvPath = "$PSScriptRoot\FRONTEND\App\service_app\.env"
Set-Content -Path $flutterEnvPath -Value "BASE_URL=$backendUrl"
Write-Host "`n✅ Updated $flutterEnvPath with: BASE_URL=$backendUrl" -ForegroundColor Green

# 3. Build APK
Write-Host "`n🔨 Building Flutter Release APK..." -ForegroundColor Yellow

$appDir = "$PSScriptRoot\FRONTEND\App\service_app"
Push-Location $appDir
try {
    flutter pub get
    flutter build apk --release
    
    $apkPath = "$appDir\build\app\outputs\flutter-apk\app-release.apk"
    if (Test-Path $apkPath) {
        Write-Host "`n🎉 SUCCESS! Release APK built successfully at:" -ForegroundColor Green
        Write-Host "   👉 $apkPath" -ForegroundColor Magenta
        Write-Host "   🔗 Target API: $backendUrl" -ForegroundColor Cyan
    }
} finally {
    Pop-Location
}
