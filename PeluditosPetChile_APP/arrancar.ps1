# Liberar instancias previas de este paquete si quedaron abiertas
Get-NetTCPConnection -LocalPort 8096,8098,5173 -State Listen -ErrorAction SilentlyContinue | ForEach-Object {
    Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue
}

$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot
$java = Join-Path $root 'JRE\bin\java.exe'
$local = Join-Path $root '.local'
New-Item -ItemType Directory -Path $local -Force | Out-Null

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
server.port=8098
server.servlet.context-path=/flowable-rest
spring.datasource.url=jdbc:h2:file:$motorDb;DB_CLOSE_ON_EXIT=FALSE
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
server.port=8096
spring.datasource.url=jdbc:h2:file:$javaDb;DB_CLOSE_ON_EXIT=FALSE
spring.datasource.username=sa
spring.datasource.password=$pass
app.flowable.base-url=http://127.0.0.1:8098/flowable-rest
app.flowable.auth-file=$($authFile.Replace('\', '/'))
"@
[IO.File]::WriteAllText((Join-Path $local 'java.properties'), $javaCfg, (New-Object Text.UTF8Encoding($false)))

# 2. Arrancar Flowable (8098) y Backend (8096)
Write-Host "[1/4] Iniciando Flowable y Backend Java..."
$motorCfgPath = (Join-Path $local 'motor.properties').Replace('\', '/')
$javaCfgPath  = (Join-Path $local 'java.properties').Replace('\', '/')
$appCfgPath   = (Join-Path $root 'application.properties').Replace('\', '/')

Start-Process -FilePath $java -ArgumentList '-Xms128m', '-Xmx768m', '-jar', 'flowable-rest.war', "--spring.config.additional-location=file:$motorCfgPath" -WorkingDirectory $root -WindowStyle Hidden -RedirectStandardOutput (Join-Path $local 'motor.log') -RedirectStandardError (Join-Path $local 'motor-err.log')
Start-Process -FilePath $java -ArgumentList '-Xms64m', '-Xmx512m', '-jar', 'gestion-leads-backend-0.0.1-SNAPSHOT.jar', "--spring.config.location=file:$appCfgPath", "--spring.config.additional-location=file:$javaCfgPath" -WorkingDirectory $root -WindowStyle Hidden -RedirectStandardOutput (Join-Path $local 'java.log') -RedirectStandardError (Join-Path $local 'java-err.log')

# 3. Esperar puertos 8098 y 8096
Write-Host "[2/4] Esperando que los puertos 8098 y 8096 esten activos (puede tardar hasta 30s en el primer arranque)..."
$auth = @{ Authorization = 'Basic ' + (Get-Content $authFile -Raw).Trim() }
$ready = $false
for ($i = 0; $i -lt 150; $i++) {
    $p8098 = Get-NetTCPConnection -LocalPort 8098 -State Listen -ErrorAction SilentlyContinue
    $p8096 = Get-NetTCPConnection -LocalPort 8096 -State Listen -ErrorAction SilentlyContinue
    if ($p8098 -and $p8096) {
        try {
            $null = Invoke-RestMethod 'http://127.0.0.1:8098/flowable-rest/service/management/engine' -Headers $auth -TimeoutSec 2
            $ready = $true
            break
        } catch {}
    }
    Start-Sleep -Seconds 1
}

if (!$ready) {
    Write-Host "[ERROR] Tiempo agotado. Revisa .local\motor.log y .local\java.log" -ForegroundColor Red
    Read-Host "Presiona Enter para salir"
    exit 1
}

# 4. Desplegar BPMN, iniciar Worker y servidor Web en 5173
Write-Host "[3/4] Desplegando modelos BPMN..."
$h = 'Authorization: Basic ' + (Get-Content $authFile -Raw).Trim()
$flow = 'http://127.0.0.1:8098/flowable-rest/service'
curl.exe -fsS -H $h -F "file=@BPMN/TO-BE.bpmn" "$flow/repository/deployments" | Out-Null
curl.exe -fsS -H $h -F "file=@BPMN/Oportunidades-Recompra.bpmn" "$flow/repository/deployments" | Out-Null

Write-Host "[4/4] Iniciando Worker y Servidor Web (http://localhost:5173)..."
$workerScript = Join-Path $root 'External-Workers\worker.ps1'
Start-Process -FilePath 'powershell.exe' -ArgumentList '-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', "`$PSDefaultParameterValues['Invoke-WebRequest:UseBasicParsing'] = `$true; & '$workerScript' -TokenPath '$authFile' -AuthScheme Basic -FlowableBase http://127.0.0.1:8098/flowable-rest -JavaBase http://127.0.0.1:8096" -WorkingDirectory $root

$webCode = @"
`$listener = New-Object System.Net.HttpListener
`$listener.Prefixes.Add('http://127.0.0.1:5173/')
`$listener.Prefixes.Add('http://localhost:5173/')
`$listener.Start()
`$webRoot = '$(Join-Path $root 'Interfaz')'
while (`$listener.IsListening) {
    `$ctx = `$listener.GetContext()
    `$rel = `$ctx.Request.Url.LocalPath.TrimStart('/')
    if ([string]::IsNullOrEmpty(`$rel)) { `$rel = 'index.html' }
    `$file = Join-Path `$webRoot `$rel
    if (!(Test-Path `$file -PathType Leaf)) { `$file = Join-Path `$webRoot 'index.html' }
    `$ext = [System.IO.Path]::GetExtension(`$file)
    `$mime = switch (`$ext) { '.html' {'text/html; charset=utf-8'} '.js' {'application/javascript; charset=utf-8'} '.css' {'text/css; charset=utf-8'} '.json' {'application/json'} '.png' {'image/png'} '.jpg' {'image/jpeg'} '.svg' {'image/svg+xml'} default {'application/octet-stream'} }
    `$ctx.Response.ContentType = `$mime
    `$bytes = [System.IO.File]::ReadAllBytes(`$file)
    `$ctx.Response.ContentLength64 = `$bytes.Length
    `$ctx.Response.OutputStream.Write(`$bytes, 0, `$bytes.Length)
    `$ctx.Response.Close()
}
"@
Start-Process -FilePath 'powershell.exe' -ArgumentList '-NoProfile', '-WindowStyle', 'Hidden', '-Command', $webCode -WorkingDirectory $root

Start-Sleep -Seconds 1
Start-Process 'http://localhost:5173'
Write-Host "Sistema iniciado correctamente en http://localhost:5173" -ForegroundColor Green
Start-Sleep -Seconds 2