param(
    [string]$FlowableWar=$env:FLOWABLE_WAR,
    [int]$PuertoMotor=8098,
    [int]$PuertoJava=8096
)
$ErrorActionPreference='Stop'
$repo=(Resolve-Path (Join-Path $PSScriptRoot '../..')).Path
$local=Join-Path $repo '.local'
New-Item -ItemType Directory -Path $local -Force | Out-Null
$java=(Get-Command java.exe -ErrorAction Stop).Source
if(!$FlowableWar -or !(Test-Path -LiteralPath $FlowableWar)) { throw 'Indica -FlowableWar con la ruta a wars/flowable-rest.war de Flowable 8.0.0.' }
$FlowableWar=(Resolve-Path -LiteralPath $FlowableWar).Path
$jar=Join-Path $repo 'Java-Web-Services/target/gestion-leads-backend-0.0.1-SNAPSHOT.jar'
if(!(Test-Path -LiteralPath $jar)) { throw 'Primero compila Java-Web-Services con .\mvnw.cmd clean verify.' }
$authFile=Join-Path $local 'auth.txt'
if(!(Test-Path -LiteralPath $authFile)) {
    $bytes=New-Object byte[] 24
    $generator=[System.Security.Cryptography.RandomNumberGenerator]::Create()
    $generator.GetBytes($bytes)
    $generator.Dispose()
    $password=[BitConverter]::ToString($bytes).Replace('-','')
    $basic=[Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes('peluditos-local:'+$password))
    [IO.File]::WriteAllText($authFile,$basic)
    $motorDb=(Join-Path $local 'datos-motor/flowable').Replace('\','/')
    $javaDb=(Join-Path $local 'datos-negocio/clientes').Replace('\','/')
    New-Item -ItemType Directory -Path (Join-Path $local 'datos-motor'),(Join-Path $local 'datos-negocio') -Force | Out-Null
    $motorConfig=@"
server.address=127.0.0.1
server.port=$PuertoMotor
server.servlet.context-path=/flowable-rest
spring.datasource.url=jdbc:h2:file:$motorDb;DB_CLOSE_ON_EXIT=FALSE
spring.datasource.username=flowable
spring.datasource.password=$password
spring.datasource.hikari.minimumIdle=2
spring.datasource.hikari.maximumPoolSize=8
flowable.rest.app.admin.user-id=peluditos-local
flowable.rest.app.admin.password=$password
flowable.rest.app.create-demo-definitions=false
flowable.database-schema-update=true
flowable.async-executor-activate=true
flowable.history-level=full
"@
    [IO.File]::WriteAllText((Join-Path $local 'motor.properties'),$motorConfig,(New-Object Text.UTF8Encoding($false)))
    $javaConfig=@"
server.address=127.0.0.1
server.port=$PuertoJava
spring.datasource.url=jdbc:h2:file:$javaDb;DB_CLOSE_ON_EXIT=FALSE
spring.datasource.username=sa
spring.datasource.password=$password
"@
    [IO.File]::WriteAllText((Join-Path $local 'java.properties'),$javaConfig,(New-Object Text.UTF8Encoding($false)))
}

function Start-LocalJava([string]$Name,[string]$Archive,[int]$Port) {
    $pidFile=Join-Path $local ($Name+'.pid')
    if(Test-Path -LiteralPath $pidFile) {
        $savedId=[int](Get-Content -LiteralPath $pidFile)
        $savedProcess=Get-CimInstance Win32_Process -Filter "ProcessId=$savedId"
        if($savedProcess -and $savedProcess.Name -eq 'java.exe' -and $savedProcess.CommandLine.Contains((Join-Path $local ($Name+'.properties')).Replace('\','/'))) {
            Write-Host "$Name ya está iniciado."; return
        }
    }
    if(Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue) { throw "El puerto $Port está ocupado. No se detuvo ningún proceso ajeno a este entorno." }
    $config=(Join-Path $local ($Name+'.properties')).Replace('\','/')
    $args='-Xms64m -Xmx512m -jar "'+$Archive+'" "--spring.config.additional-location=file:'+$config+'"'
    $process=Start-Process -FilePath $java -ArgumentList $args -WorkingDirectory $repo -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $local ($Name+'-out.log')) -RedirectStandardError (Join-Path $local ($Name+'-err.log'))
    $process.Id | Set-Content -LiteralPath $pidFile
}
Start-LocalJava 'motor' $FlowableWar $PuertoMotor
Start-LocalJava 'java' $jar $PuertoJava
$auth=@{Authorization='Basic '+(Get-Content -Raw -LiteralPath $authFile).Trim()}
$ready=$false
for($i=0;$i -lt 90;$i++) {
    try {
        $engine=Invoke-RestMethod "http://127.0.0.1:$PuertoMotor/flowable-rest/service/management/engine" -Headers $auth -TimeoutSec 3
        if($engine.version -ne '8.0.0') { throw "Se esperaba Flowable 8.0.0, se obtuvo $($engine.version)" }
        $null=Invoke-RestMethod "http://127.0.0.1:$PuertoJava/api/leads" -TimeoutSec 3
        $ready=$true; break
    } catch { Start-Sleep -Seconds 1 }
}
if(!$ready) { throw 'El entorno no respondió. Revisa los logs de .local.' }
Write-Host "Flowable $($engine.version) y el servicio Jakarta responden."
Write-Host "Consola incluida: http://127.0.0.1:$PuertoMotor/flowable-rest/docs/"
Write-Host 'La configuración privada y las bases quedan en .local, fuera del material para subir.'
