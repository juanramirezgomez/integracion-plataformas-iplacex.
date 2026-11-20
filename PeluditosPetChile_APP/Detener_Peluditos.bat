@echo off
title Peluditos Pet Chile - Deteniendo Sistema
echo Deteniendo servicios de Peluditos Pet Chile...

powershell -NoProfile -Command ^
  "$ports = @(8096, 8098, 5173);" ^
  "Get-NetTCPConnection -LocalPort $ports -State Listen -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique | ForEach-Object {" ^
  "  Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue" ^
  "};" ^
  "Get-CimInstance Win32_Process -Filter \"Name='powershell.exe'\" | Where-Object { $_.CommandLine -like '*worker.ps1*' -or $_.CommandLine -like '*5173*' } | ForEach-Object {" ^
  "  Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue" ^
  "}"

echo Verificando liberacion de puertos...
powershell -NoProfile -Command ^
  "$activos = Get-NetTCPConnection -LocalPort 8096,8098,5173 -State Listen -ErrorAction SilentlyContinue;" ^
  "if ($activos) { Write-Host '[AVISO] Aun hay procesos activos (ejecuta este script como Administrador).' -ForegroundColor Yellow } else { Write-Host 'Todos los servicios y puertos fueron detenidos correctamente.' -ForegroundColor Green }"

timeout /t 2 /nobreak >nul
exit