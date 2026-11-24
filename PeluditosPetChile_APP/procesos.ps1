$packageState = Join-Path $PSScriptRoot '.local'
$processFile = Join-Path $packageState 'procesos.json'

function Lock-Peluditos {
    New-Item -ItemType Directory -Path $packageState -Force | Out-Null
    try {
        [IO.File]::Open((Join-Path $packageState 'procesos.lock'), 'OpenOrCreate', 'ReadWrite', 'None')
    } catch [IO.IOException] {
        throw 'Ya hay un inicio o apagado de Peluditos en curso. Espera a que termine.'
    }
}

function Get-PeluditosRecords {
    if (Test-Path -LiteralPath $processFile) {
        $stored = Get-Content -LiteralPath $processFile -Raw | ConvertFrom-Json
        foreach ($record in $stored) { $record }
    }
}

function Get-PeluditosProcess($Record) {
    $process = Get-Process -Id $Record.Id -ErrorAction SilentlyContinue
    if (!$process) { return }
    if ($process.StartTime.ToUniversalTime().Ticks.ToString() -ne $Record.Started) { return }
    if (!$process.Path) { throw "No se pudo comprobar la identidad de $($Record.Name)." }
    if ($process.Path -eq $Record.Path) { $process }
}

function Save-PeluditosProcess([string]$Name, [System.Diagnostics.Process]$Process) {
    # Capture the identity before recording the PID for a later shutdown.
    $records = @(Get-PeluditosRecords)
    $records += [pscustomobject]@{
        Name = $Name
        Id = $Process.Id
        Started = $Process.StartTime.ToUniversalTime().Ticks.ToString()
        Path = $Process.Path
    }
    if (!$Process.Path) { throw "No se pudo registrar el ejecutable de $Name." }
    $next = Join-Path $packageState 'procesos.tmp'
    ConvertTo-Json -InputObject $records | Set-Content -LiteralPath $next -Encoding UTF8 -ErrorAction Stop
    if (Test-Path -LiteralPath $processFile) {
        $previous = Join-Path $packageState 'procesos.anterior'
        [IO.File]::Replace($next, $processFile, $previous)
        Remove-Item -LiteralPath $previous -ErrorAction SilentlyContinue
    } else {
        [IO.File]::Move($next, $processFile)
    }
}

function Stop-PeluditosProcesses {
    $records = @(Get-PeluditosRecords)
    [array]::Reverse($records)
    foreach ($record in $records) {
        $process = Get-PeluditosProcess $record
        if (!$process) { continue }
        try {
            $process.Kill()
        } catch [InvalidOperationException] {
            if (!$process.HasExited) { throw }
        }
        if (!$process.WaitForExit(10000)) { throw "No se pudo detener $($record.Name)." }
    }
    if (Test-Path -LiteralPath $processFile) { Remove-Item -LiteralPath $processFile }
}
