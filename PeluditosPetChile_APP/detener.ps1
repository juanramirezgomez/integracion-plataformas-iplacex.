$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'procesos.ps1')
$lock = $null
try {
    $lock = Lock-Peluditos
    Stop-PeluditosProcesses
    Write-Host 'Procesos de esta copia de Peluditos detenidos.'
} catch {
    Write-Host "[ERROR] $($_.Exception.Message)" -ForegroundColor Red
    exit 1
} finally {
    if ($lock) { $lock.Dispose() }
}
