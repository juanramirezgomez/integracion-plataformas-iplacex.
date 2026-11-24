param([switch]$SinNavegador)
$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
. (Join-Path $PSScriptRoot 'procesos.ps1')
$root = $PSScriptRoot
$java = Join-Path $root 'JRE\bin\java.exe'
$local = Join-Path $root '.local'

$windowsPowerShell = Join-Path $PSHOME 'powershell.exe'
if (!(Test-Path -LiteralPath $windowsPowerShell)) {
    $windowsPowerShell = Join-Path $env:WINDIR 'System32/WindowsPowerShell/v1.0/powershell.exe'
}
function ConvertTo-PeluditosCommand([string]$Script) {
    [Convert]::ToBase64String([Text.Encoding]::Unicode.GetBytes($Script))
}
function Start-PeluditosChild([string]$Name, [hashtable]$Options) {
    $process = Start-Process @Options -WorkingDirectory $root -WindowStyle Hidden -PassThru
    try {
        Save-PeluditosProcess $Name $process
    } catch {
        if (!$process.HasExited) { $process.Kill() }
        throw
    }
    $process
}

$lock = $null
$starting = $false
try {
    $lock = Lock-Peluditos
    $running = @(Get-PeluditosRecords | ForEach-Object { Get-PeluditosProcess $_ })
    if ($running.Count) {
        throw 'Esta copia de Peluditos ya tiene procesos activos. Usa Detener_Peluditos.bat antes de reiniciar.'
    }

    $config = Join-Path $local 'instalacion.json'
    if (!(Test-Path -LiteralPath $config)) {
        Copy-Item -LiteralPath (Join-Path $root 'instalacion.ejemplo.json') -Destination $config
    }
    try {
        $settings = Get-Content -LiteralPath $config -Raw | ConvertFrom-Json
    } catch {
        throw 'El archivo .local/instalacion.json no es un JSON valido. Revisa el ejemplo del paquete.'
    }
    $ports = @($settings.puertoFlowable, $settings.puertoJava, $settings.puertoWeb)
    if (($ports | Where-Object { ($_ -isnot [int] -and $_ -isnot [long]) -or $_ -lt 1024 -or $_ -gt 65535 }) -or
        @($ports | Select-Object -Unique).Count -ne 3) {
        throw 'Configura tres puertos enteros distintos entre 1024 y 65535 en .local/instalacion.json.'
    }
    $flowableBase = "http://127.0.0.1:$($settings.puertoFlowable)/flowable-rest"
    $javaBase = "http://127.0.0.1:$($settings.puertoJava)"
    $webBase = "http://localhost:$($settings.puertoWeb)"

    $occupied = @(Get-NetTCPConnection -LocalPort $ports -State Listen -ErrorAction SilentlyContinue |
        Select-Object -ExpandProperty LocalPort -Unique | Sort-Object)
    if ($occupied.Count) {
        throw "Puertos ocupados: $($occupied -join ', '). Cierra la aplicacion que los usa o ejecuta Peluditos cuando esten libres."
    }

    $starting = $true
    Stop-PeluditosProcesses
    # 1. Credenciales y properties (UTF-8 SIN BOM)
    $authFile = Join-Path $local 'auth.txt'
    if (!(Test-Path $authFile)) {
        $bytes = New-Object byte[] 24
        $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
        $rng.GetBytes($bytes); $rng.Dispose()
        $pass = [BitConverter]::ToString($bytes).Replace('-', '')
        $basic = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes("peluditos-local:$pass"))
        [IO.File]::WriteAllText($authFile, $basic, (New-Object Text.UTF8Encoding($false)))
    } else {
        $decoded = [Text.Encoding]::UTF8.GetString([Convert]::FromBase64String((Get-Content $authFile -Raw).Trim()))
        $pass = $decoded.Split(':', 2)[1]
    }

    $motorDb = (Join-Path $local 'datos-motor/flowable').Replace('\', '/')
    $javaDb  = (Join-Path $local 'datos-negocio/clientes').Replace('\', '/')
    New-Item -ItemType Directory -Path (Join-Path $local 'datos-motor'), (Join-Path $local 'datos-negocio') -Force | Out-Null

    $motorCfg = @"
server.address=127.0.0.1
server.port=$($settings.puertoFlowable)
server.servlet.context-path=/flowable-rest
spring.datasource.url=jdbc:h2:file:$motorDb;DB_CLOSE_ON_EXIT=FALSE;WRITE_DELAY=0
spring.datasource.username=flowable
spring.datasource.password=$pass
spring.datasource.hikari.minimumIdle=2
spring.datasource.hikari.maximumPoolSize=8
flowable.rest.app.admin.user-id=peluditos-local
flowable.rest.app.admin.password=$pass
flowable.rest.app.create-demo-definitions=false
flowable.database-schema-update=true
flowable.async-executor-activate=true
flowable.history-level=full
"@
    [IO.File]::WriteAllText((Join-Path $local 'motor.properties'), $motorCfg, (New-Object Text.UTF8Encoding($false)))

    $javaCfg = @"
server.address=127.0.0.1
server.port=$($settings.puertoJava)
spring.datasource.url=jdbc:h2:file:$javaDb;DB_CLOSE_ON_EXIT=FALSE;WRITE_DELAY=0
spring.datasource.username=sa
spring.datasource.password=$pass
app.flowable.base-url=$flowableBase
app.flowable.auth-file=$($authFile.Replace('\', '/'))
"@
    [IO.File]::WriteAllText((Join-Path $local 'java.properties'), $javaCfg, (New-Object Text.UTF8Encoding($false)))

    # 2. Arrancar Flowable y Backend
    Write-Host "[1/4] Iniciando Flowable y Backend Java..."
    $motorCfgPath = (Join-Path $local 'motor.properties').Replace('\', '/')
    $javaCfgPath  = (Join-Path $local 'java.properties').Replace('\', '/')
    $appCfgPath   = (Join-Path $root 'application.properties').Replace('\', '/')

    $motorProcess = Start-PeluditosChild 'Flowable' @{
        FilePath = $java
        ArgumentList = "-Xms128m -Xmx768m -jar flowable-rest.war `"--spring.config.additional-location=file:$motorCfgPath`""
        RedirectStandardOutput = Join-Path $local 'motor.log'
        RedirectStandardError = Join-Path $local 'motor-err.log'
    }
    $javaProcess = Start-PeluditosChild 'Servicio Java' @{
        FilePath = $java
        ArgumentList = "-Xms64m -Xmx512m -jar gestion-leads-backend-0.0.1-SNAPSHOT.jar `"--spring.config.location=file:$appCfgPath`" `"--spring.config.additional-location=file:$javaCfgPath`""
        RedirectStandardOutput = Join-Path $local 'java.log'
        RedirectStandardError = Join-Path $local 'java-err.log'
    }

    Write-Host '[2/4] Esperando a Flowable y al servicio Java...'
    $auth = @{ Authorization = 'Basic ' + (Get-Content -LiteralPath $authFile -Raw).Trim() }
    $ready = $false
    for ($i = 0; $i -lt 90; $i++) {
        if ($motorProcess.HasExited -or $javaProcess.HasExited) {
            throw 'Flowable o Java se detuvo durante el arranque. Revisa sus archivos de registro en .local.'
        }
        try {
            $null = Invoke-RestMethod "$flowableBase/service/management/engine" -Headers $auth -TimeoutSec 2
            $null = Invoke-RestMethod "$javaBase/api/leads" -TimeoutSec 2
            $ready = $true
            break
        } catch {
            Start-Sleep -Seconds 1
        }
    }
    if (!$ready) { throw 'Flowable o Java no respondio. Revisa sus archivos de registro en .local.' }

    Write-Host '[3/4] Desplegando modelos BPMN...'
    $flow = "$flowableBase/service"
    foreach ($model in @('TO-BE.bpmn', 'Oportunidades-Recompra.bpmn')) {
        $bpmn = Join-Path $root "BPMN/$model"
        ('header = "Authorization: ' + $auth.Authorization + '"') |
            & curl.exe --config - -fsS -F "file=@$bpmn" "$flow/repository/deployments" | Out-Null
        if ($LASTEXITCODE -ne 0) { throw "No se pudo desplegar $model." }
    }

    Write-Host '[4/4] Iniciando el worker y el servidor web...'
    $workerCode = @'
$PSDefaultParameterValues['Invoke-WebRequest:UseBasicParsing'] = $true
$ProgressPreference = 'SilentlyContinue'
& './External-Workers/worker.ps1' -TokenPath './.local/auth.txt' -AuthScheme Basic -FlowableBase '__FLOWABLE_BASE__' -JavaBase '__JAVA_BASE__' -LogPath './.local/worker-ejecucion.jsonl'
'@
    $workerProcess = Start-PeluditosChild 'Worker' @{
        FilePath = $windowsPowerShell
        ArgumentList = @('-NoProfile', '-NonInteractive', '-EncodedCommand', (ConvertTo-PeluditosCommand ($workerCode.Replace('__FLOWABLE_BASE__', $flowableBase).Replace('__JAVA_BASE__', $javaBase))))
        RedirectStandardOutput = Join-Path $local 'worker.log'
        RedirectStandardError = Join-Path $local 'worker-err.log'
    }

    $webCode = @'
Add-Type -AssemblyName System.Net.Http
$ErrorActionPreference = 'Stop'
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add('http://127.0.0.1:__WEB_PORT__/')
$listener.Prefixes.Add('http://localhost:__WEB_PORT__/')
$listener.Start()
$webRoot = Join-Path (Get-Location) 'Interfaz'
$handler = New-Object System.Net.Http.HttpClientHandler
$client = New-Object System.Net.Http.HttpClient($handler)

while ($listener.IsListening) {
    $ctx = $listener.GetContext()
    $rawUrl = $ctx.Request.RawUrl
    if ($rawUrl.StartsWith('/api/')) {
        try {
            $targetUrl = '__JAVA_BASE__' + $rawUrl
            $msg = New-Object System.Net.Http.HttpRequestMessage((New-Object System.Net.Http.HttpMethod($ctx.Request.HttpMethod)), $targetUrl)
            if ($ctx.Request.HasEntityBody) {
                $ms = New-Object System.IO.MemoryStream
                $ctx.Request.InputStream.CopyTo($ms)
                $content = New-Object System.Net.Http.ByteArrayContent(,$ms.ToArray())
                if ($ctx.Request.ContentType) {
                    $content.Headers.TryAddWithoutValidation('Content-Type', $ctx.Request.ContentType) | Out-Null
                }
                $msg.Content = $content
            }
            $resp = $client.SendAsync($msg).GetAwaiter().GetResult()
            $ctx.Response.StatusCode = [int]$resp.StatusCode
            if ($resp.Content.Headers.ContentType) {
                $ctx.Response.ContentType = $resp.Content.Headers.ContentType.ToString()
            }
            $respBytes = $resp.Content.ReadAsByteArrayAsync().GetAwaiter().GetResult()
            $ctx.Response.ContentLength64 = $respBytes.Length
            $ctx.Response.OutputStream.Write($respBytes, 0, $respBytes.Length)
        } catch {
            $ctx.Response.StatusCode = 502
        } finally {
            $ctx.Response.Close()
        }
        continue
    }

    $rel = $ctx.Request.Url.LocalPath.TrimStart('/')
    if ([string]::IsNullOrEmpty($rel)) { $rel = 'index.html' }
    $file = Join-Path $webRoot $rel
    if (!(Test-Path -LiteralPath $file -PathType Leaf)) { $file = Join-Path $webRoot 'index.html' }
    $ext = [System.IO.Path]::GetExtension($file)
    $mime = switch ($ext) { '.html' {'text/html; charset=utf-8'} '.js' {'application/javascript; charset=utf-8'} '.css' {'text/css; charset=utf-8'} '.json' {'application/json'} '.png' {'image/png'} '.jpg' {'image/jpeg'} '.svg' {'image/svg+xml'} default {'application/octet-stream'} }
    $ctx.Response.ContentType = $mime
    $bytes = [System.IO.File]::ReadAllBytes($file)
    $ctx.Response.ContentLength64 = $bytes.Length
    $ctx.Response.OutputStream.Write($bytes, 0, $bytes.Length)
    $ctx.Response.Close()
}
'@
    $webProcess = Start-PeluditosChild 'Interfaz' @{
        FilePath = $windowsPowerShell
        ArgumentList = @('-NoProfile', '-NonInteractive', '-EncodedCommand', (ConvertTo-PeluditosCommand ($webCode.Replace('__WEB_PORT__', [string]$settings.puertoWeb).Replace('__JAVA_BASE__', $javaBase))))
        RedirectStandardOutput = Join-Path $local 'web.log'
        RedirectStandardError = Join-Path $local 'web-err.log'
    }
    $webReady = $false
    for ($i = 0; $i -lt 20; $i++) {
        if ($webProcess.HasExited -or $workerProcess.HasExited) {
            throw 'El servidor web o el worker se detuvo. Revisa sus archivos de registro en .local.'
        }
        try {
            $homePage = Invoke-WebRequest -Uri "$webBase/" -UseBasicParsing -TimeoutSec 2
            $null = Invoke-RestMethod "$webBase/api/leads" -TimeoutSec 2
            if ($homePage.Content.Contains('id="vistaInicio"')) {
                $webReady = $true
                break
            }
        } catch {}
        Start-Sleep -Seconds 1
    }
    if (!$webReady) { throw 'La interfaz no respondio. Revisa los archivos web.log y web-err.log en .local.' }
} catch {
    Write-Host "[ERROR] $($_.Exception.Message)" -ForegroundColor Red
    if ($starting) {
        try { Stop-PeluditosProcesses }
        catch { Write-Warning 'El apagado quedo incompleto. Vuelve a ejecutar Detener_Peluditos.bat.' }
    }
    exit 1
} finally {
    if ($lock) { $lock.Dispose() }
}
Write-Host "Peluditos esta disponible en $webBase"
if (!$SinNavegador) {
    try { Start-Process $webBase }
    catch { Write-Warning "Abre $webBase en el navegador." }
}
