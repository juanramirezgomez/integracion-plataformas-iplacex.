param(
    [string]$TokenPath=$env:FLOWABLE_AUTH_FILE,
    [string]$FlowableBase='http://127.0.0.1:8098/flowable-rest',
    [string]$JavaBase='http://127.0.0.1:8096',
    [int]$Cycles=0,
    [string]$LogPath=(Join-Path $PSScriptRoot 'worker-ejecucion.jsonl'),
    [ValidateSet('Bearer','Basic')][string]$AuthScheme='Basic'
)
$ErrorActionPreference='Stop'
if(!$TokenPath -or !(Test-Path -LiteralPath $TokenPath)){throw 'Indica -TokenPath con el archivo privado .local/auth.txt del entorno OSS.'}
$auth=@{Authorization=$AuthScheme+' '+(Get-Content -Raw -LiteralPath $TokenPath).Trim()}
$workerId='peluditos-grupo5-local'
$topics=@('peluditos-verificar-cliente','peluditos-crear-cliente','peluditos-registrar-compra','peluditos-cerrar-sin-compra')

function Write-WorkerLog([string]$Event,[hashtable]$Data){
    $row=[ordered]@{fecha=(Get-Date).ToString('o');evento=$Event}
    foreach($key in $Data.Keys){$row[$key]=$Data[$key]}
    $json=$row | ConvertTo-Json -Depth 10 -Compress
    Add-Content -LiteralPath $LogPath -Value $json -Encoding utf8
    Write-Host $json
}
function Invoke-Flowable([string]$Path,[object]$Body){
    $response=Invoke-WebRequest -Uri ($FlowableBase.TrimEnd('/')+'/external-job-api'+$Path) -Method Post -Headers $auth -ContentType 'application/json' -Body ($Body|ConvertTo-Json -Depth 20 -Compress) -TimeoutSec 25
    if($Path.EndsWith('/complete')){
        Write-WorkerLog 'respuesta-http-flowable' @{ruta=$Path;status=[int]$response.StatusCode}
    }
    if($response.Content -and $response.Content.Trim()){
        $response.Content | ConvertFrom-Json
    }
}
function Invoke-Java([string]$Path,[string]$Method='GET',[object]$Body=$null){
    $params=@{Uri=$JavaBase.TrimEnd('/')+$Path;Method=$Method;TimeoutSec=15}
    if($null -ne $Body){$params.ContentType='application/json';$params.Body=$Body|ConvertTo-Json -Depth 10 -Compress}
    Invoke-RestMethod @params
}
function To-Variable([string]$Name,[string]$Type,[object]$Value){@{name=$Name;type=$Type;value=$Value}}
function Find-Lead([hashtable]$Values){
    $leads=Invoke-Java '/api/leads'
    $matches=@($leads|Where-Object{ $_.telefono -and $_.telefono -eq $Values.telefono })
    if($matches.Count -gt 0){return $matches[0]}
    return $null
}

function Save-Consulta([object]$Job,[hashtable]$Values,[long]$LeadId,[string]$Resultado){
    if(!$Job.processInstanceId){throw 'El trabajo no indica la instancia de la consulta.'}
    $body=@{leadId=$LeadId;resultado=$Resultado}
    foreach($field in @('nombreCliente','telefono','correo','canalOrigen','consulta')){
        $body[$field]=[string]$Values[$field]
    }
    $saved=Invoke-Java ('/api/consultas/'+$Job.processInstanceId) 'PUT' $body
    Write-WorkerLog 'java-consulta' @{job=$Job.id;procesoId=$Job.processInstanceId;leadId=$LeadId;resultado=$saved.resultado}
}

Write-WorkerLog 'inicio' @{worker=$workerId;flowable=$FlowableBase;java=$JavaBase}
$round=0
while($Cycles -eq 0 -or $round -lt $Cycles){
    $round++
    foreach($topic in $topics){
        $jobs=@(Invoke-Flowable '/acquire/jobs' @{topic=$topic;workerId=$workerId;lockDuration='PT1M';numberOfTasks=1})
        foreach($job in $jobs){
            if(!$job.id){continue}
            $values=@{}
            foreach($variable in $job.variables){$values[$variable.name]=$variable.value}
            $result=@()
            try{
                switch($topic){
                    'peluditos-verificar-cliente' {
                        if(!$values.telefono){throw 'Falta telefono en las variables del proceso.'}
                        $lead=Find-Lead $values
                        $result+=To-Variable 'clienteRegistrado' 'boolean' ($null -ne $lead)
                        if($null -ne $lead){
                            Save-Consulta $job $values ([long]$lead.id) 'PENDIENTE'
                            $result+=To-Variable 'leadId' 'long' ([long]$lead.id)
                        }
                        Write-WorkerLog 'java-verificar' @{job=$job.id;metodo='GET';ruta='/api/leads';encontrado=($null -ne $lead)}
                    }
                    'peluditos-crear-cliente' {
                        foreach($required in @('nombreCliente','telefono','correo','consulta')){if(!$values[$required]){throw "Falta $required en el formulario."}}
                        # Evita duplicar el registro si se repite el trabajo tras un fallo de red.
                        $lead=Find-Lead $values
                        if($null -eq $lead){
                            $body=@{}
                            foreach($field in @('nombreCliente','correo','telefono','canalOrigen','consulta')){$body[$field]=[string]$values[$field]}
                            $lead=Invoke-Java '/api/leads' 'POST' $body
                        }
                        Save-Consulta $job $values ([long]$lead.id) 'PENDIENTE'
                        $result+=To-Variable 'leadId' 'long' ([long]$lead.id)
                        Write-WorkerLog 'java-registro' @{job=$job.id;leadId=$lead.id;estado=$lead.estado;ruta='/api/leads'}
                    }
                    'peluditos-registrar-compra' {
                        if(!$values.leadId){throw 'Falta leadId devuelto al crear o verificar el cliente.'}
                        Save-Consulta $job $values ([long]$values.leadId) 'COMPRO'
                        $lead=Invoke-Java ('/api/leads/'+[long]$values.leadId+'/estado') 'PUT' @{estado='CONVERTIDO'}
                        $result+=To-Variable 'estadoLead' 'string' ([string]$lead.estado)
                        Write-WorkerLog 'java-compra' @{job=$job.id;leadId=$lead.id;estado=$lead.estado;metodo='PUT'}
                    }
                    'peluditos-cerrar-sin-compra' {
                        if(!$values.leadId){throw 'Falta leadId para cerrar la consulta.'}
                        Save-Consulta $job $values ([long]$values.leadId) 'NO_COMPRO'
                    }
                }
                $null=Invoke-Flowable ('/acquire/jobs/'+$job.id+'/complete') @{workerId=$workerId;variables=@($result)}
                Write-WorkerLog 'resultado-enviado-a-flowable' @{job=$job.id;topic=$topic;variables=@($result)}
            }catch{
                # No completa un trabajo si Java falla. El bloqueo vence al minuto.
                Write-WorkerLog 'error-trabajo' @{job=$job.id;topic=$topic;mensaje=$_.Exception.Message}
                throw
            }
        }
    }
    if($Cycles -eq 0 -or $round -lt $Cycles){Start-Sleep -Seconds 2}
}
