$ErrorActionPreference='Stop'
$base='http://127.0.0.1:8096/api/leads'
$body=@{
    nombreCliente='Cliente de prueba'
    correo='prueba@example.invalid'
    telefono='CONTACTO-DE-PRUEBA'
    canalOrigen='WhatsApp'
    consulta='Consulta ficticia para probar la conexion del servicio'
} | ConvertTo-Json
$creado=Invoke-RestMethod -Uri $base -Method Post -ContentType 'application/json; charset=utf-8' -Body ([Text.Encoding]::UTF8.GetBytes($body))
if(!$creado.id -or $creado.estado -ne 'NUEVO'){throw 'No se registro la consulta con su estado inicial.'}
$lista=Invoke-RestMethod -Uri $base
if(!($lista | Where-Object id -eq $creado.id)){throw 'La consulta no aparece en el listado.'}
$cambiado=Invoke-RestMethod -Uri ($base+'/'+$creado.id+'/estado') -Method Put -ContentType 'application/json' -Body '{"estado":"EN_SEGUIMIENTO"}'
if($cambiado.estado -ne 'EN_SEGUIMIENTO'){throw 'No se cambio el estado.'}
$despues=Invoke-RestMethod -Uri $base
$confirmado=$despues | Where-Object id -eq $creado.id
if($confirmado.estado -ne 'EN_SEGUIMIENTO'){throw 'El listado no conserva el nuevo estado.'}
$resultado=[ordered]@{
    fecha=(Get-Date).ToString('o')
    entorno='Local, Java 21, puerto 8096, datos ficticios'
    registro=$creado
    actualizacion=$cambiado
    listadoConfirmado=$confirmado
    comprobaciones=@('POST: consulta creada con estado NUEVO','GET: consulta encontrada','PUT: cambio a EN_SEGUIMIENTO','GET: nuevo estado confirmado')
    pendiente='Todavia no se ha probado el recorrido desde Flowable Enterprise ni el external worker.'
}
$json=$resultado | ConvertTo-Json -Depth 6
[IO.File]::WriteAllText((Join-Path $PSScriptRoot 'resultado-servicio-java.json'),$json)
$resultado.comprobaciones | ForEach-Object {Write-Output ('OK: '+$_)}
