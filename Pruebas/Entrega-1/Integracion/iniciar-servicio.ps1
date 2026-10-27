$ErrorActionPreference='Stop'
$repo=Split-Path (Split-Path (Split-Path $PSScriptRoot -Parent) -Parent) -Parent
$project=Join-Path $repo 'Java-Web-Services'
$javaHome=$env:JAVA_HOME
if(!$javaHome){$javaHome=[Environment]::GetEnvironmentVariable('JAVA_HOME','Machine')}
if(!$javaHome){throw 'Configura JAVA_HOME con el JDK 21.'}
Push-Location -LiteralPath $project
try{
    & (Join-Path $javaHome 'bin\java.exe') '-jar' 'target\gestion-leads-backend-0.0.1-SNAPSHOT.jar' '--server.port=8096' '--server.address=127.0.0.1'
}finally{Pop-Location}
