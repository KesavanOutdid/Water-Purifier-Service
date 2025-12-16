$auto = Get-Content 'AUTO_ASSIGNMENT_GUIDE.md' -Raw  
$device = Get-Content 'DEVICE_ASSIGNMENT_GUIDE.md' -Raw  
$redis = Get-Content '../REDIS_IMPLEMENTATION.md' -Raw  
$header = '# Water Purifier Service - Complete Backend End-to-End Documentation'  
$toc = '## Table of Contents'  
$combined = $header + \"`n`n\" + $toc + \"`n`n\" + '1. Auto-Assignment System' + \"`n\" + '2. Device Management' + \"`n\" + '3. Redis Caching' + \"`n`n---`n`n\" + $auto + \"`n`n---`n`n\" + $device + \"`n`n---`n`n\" + $redis  
$combined | Out-File 'BACKEND_COMPLETE_GUIDE.md' -Encoding UTF8  
Write-Host 'Complete!'  
