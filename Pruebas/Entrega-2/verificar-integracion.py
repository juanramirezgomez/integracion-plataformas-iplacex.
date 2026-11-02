"""Prueba real de Jakarta REST + Flowable 8. Solo usa la biblioteca estándar de Python."""
from pathlib import Path
import argparse,base64,json,secrets,shutil,subprocess,time,urllib.request,urllib.error

ROOT=Path(__file__).resolve().parents[2]
args=None;out=None;events=[];contracts=[]
def write(name,data):
    (out/name).write_text(json.dumps(data,ensure_ascii=False,indent=2),encoding='utf-8')
def event(paso,**data):
    events.append(dict(fecha=time.strftime('%Y-%m-%dT%H:%M:%S%z'),paso=paso,**data));write('recorrido.json',events);print(paso,flush=True)
def request(path,method='GET',data=None,java=False,expected=None,headers=None):
    hdr={'Content-Type':'application/json',**(headers or {})}
    if not java:hdr['Authorization']='Basic '+args.auth_file.read_text(encoding='utf-8-sig').strip()
    req=urllib.request.Request((args.java if java else args.flowable+'/service')+path,data=None if data is None else json.dumps(data).encode(),headers=hdr,method=method)
    try:r=urllib.request.urlopen(req,timeout=20)
    except urllib.error.HTTPError as exc:r=exc
    raw=r.read()
    try:body=json.loads(raw) if raw else None
    except json.JSONDecodeError:body=raw.decode(errors='replace')[:400]
    if expected is not None:
        contracts.append(dict(metodo=method,ruta=path,esperado=expected,obtenido=r.code,respuesta=body));write('pruebas-endpoints-jakarta.json',contracts)
        assert r.code==expected,(method,path,r.code,body)
    elif r.code>=400:raise RuntimeError(f'{method} {path}: HTTP {r.code}: {body}')
    return body
def variables(values):return [dict(name=k,type='boolean' if isinstance(v,bool) else 'long' if isinstance(v,int) else 'string',value=v) for k,v in values.items()]
def tasks(pid):return request('/runtime/tasks?processInstanceId='+pid)['data']
def complete(pid,key,values=None):
    ts=tasks(pid);assert len(ts)==1 and ts[0]['taskDefinitionKey']==key,ts
    task=ts[0];request('/runtime/tasks/'+task['id'],'POST',dict(action='complete',variables=variables(values or {})))
    event('Tarea completada',instancia=pid,tarea=task.get('name'),clave=key)
def worker():
    shell=shutil.which('pwsh') or shutil.which('powershell')
    assert shell,'Se necesita PowerShell para ejecutar el worker.'
    result=subprocess.run([shell,'-NoProfile','-File',str(ROOT/'Flowable/Entrega-2/worker.ps1'),'-TokenPath',str(args.auth_file),'-AuthScheme','Basic','-FlowableBase',args.flowable,'-JavaBase',args.java,'-Cycles','1','-LogPath',str(out/'worker-ejecucion.jsonl')],capture_output=True,text=True,encoding='utf-8',errors='replace',timeout=90)
    assert result.returncode==0,result.stderr+'\n'+result.stdout
def deploy():
    file=ROOT/'BPMN/TO-BE.bpmn';boundary='----test'+secrets.token_hex(8)
    data=(f'--{boundary}\r\nContent-Disposition: form-data; name="file"; filename="TO-BE.bpmn"\r\nContent-Type: application/xml\r\n\r\n').encode()+file.read_bytes()+f'\r\n--{boundary}--\r\n'.encode()
    req=urllib.request.Request(args.flowable+'/service/repository/deployments',data=data,headers={'Authorization':'Basic '+args.auth_file.read_text().strip(),'Content-Type':'multipart/form-data; boundary='+boundary},method='POST')
    with urllib.request.urlopen(req,timeout=30) as r:write('despliegue.json',json.load(r))
    event('TO-BE desplegado en Flowable 8')
def start(values):
    p=request('/runtime/process-instances','POST',dict(message='ConsultaClienteRecibida',variables=variables({'initiator':'peluditos-local',**values})))
    event('Instancia iniciada por mensaje',instancia=p['id']);return p['id']
def wait_task(pid,key):
    deadline=time.time()+90
    while time.time()<deadline:
        ts=tasks(pid)
        if ts:assert ts[0]['taskDefinitionKey']==key,ts;return
        time.sleep(1)
    raise AssertionError('No apareció la tarea después del temporizador: '+key)
def restart():
    local=ROOT/'.local'
    # El script solo puede detener los PID cuyos comandos apuntan a esta copia del repo.
    for name in ['java','motor']:
        pid=int((local/(name+'.pid')).read_text())
        marker=str(local/(name+'.properties')).replace('\\','/')
        cmd=f"$p=Get-CimInstance Win32_Process -Filter 'ProcessId={pid}'; if($p -and $p.Name -eq 'java.exe' -and $p.CommandLine.Contains('{marker}')) {{Stop-Process -Id {pid}}} else {{throw 'No se detuvo un proceso ajeno'}}"
        subprocess.run([args.powershell,'-NoProfile','-Command',cmd],check=True,capture_output=True)
    event('Motor y Java detenidos para comprobar persistencia')
    time.sleep(2)
    subprocess.run([args.powershell,'-NoProfile','-File',str(ROOT/'Flowable/Entrega-2/iniciar-local.ps1'),'-FlowableWar',str(args.war)],check=True,timeout=130)
def run():
    engine=request('/management/engine');assert engine['version']=='8.0.0';write('version-motor.json',engine)
    event('Motor comprobado',version=engine['version'],servicio='Jakarta REST con Jersey')
    data=dict(nombreCliente='Prueba de contrato',correo='contrato@example.invalid',telefono='TEST-'+secrets.token_hex(6),canalOrigen='WhatsApp',consulta='Consulta ficticia de contrato REST')
    request('/api/leads',java=True,expected=200)
    lead=request('/api/leads','POST',data,True,200)
    request('/api/leads/'+str(lead['id'])+'/estado','PUT',{'estado':'EN_SEGUIMIENTO'},True,200)
    request('/api/leads/'+str(lead['id'])+'/estado','PUT',{'estado':''},True,400)
    request('/api/leads/99999999/estado','PUT',{'estado':'CONVERTIDO'},True,404)
    request('/api/leads','POST',{},True,400)
    request('/api/leads','POST',{**data,'estado':'NO_VALIDO'},True,400)
    request('/api/leads','OPTIONS',None,True,204,{'Origin':'http://localhost:5173','Access-Control-Request-Method':'POST'})
    request('/api/leads','OPTIONS',None,True,403,{'Origin':'http://no-autorizado.invalid','Access-Control-Request-Method':'POST'})
    request('/api/leads/'+str(lead['id']),'DELETE',None,True,204)
    request('/api/leads/'+str(lead['id']),'DELETE',None,True,404)
    assert not any(x['id']==lead['id'] for x in request('/api/leads',java=True))
    event('Contrato REST comprobado',pruebas=len(contracts))
    deploy()
    values=dict(nombreCliente='Prueba Jakarta Grupo 5',correo='jakarta@example.invalid',telefono='JAKARTA-'+secrets.token_hex(5),canalOrigen='WhatsApp',consulta='Consulta ficticia por torta para mascota')
    pid=start(values);complete(pid,'ExpandedSubProcess_4',values);worker();worker()
    assert tasks(pid)[0]['taskDefinitionKey']=='ExpandedSubProcess_18'
    lead=next(x for x in request('/api/leads',java=True) if x['telefono']==values['telefono']);write('cliente-antes-reinicio.json',lead)
    event('Verificar cliente superado y cliente creado',instancia=pid,cliente=lead)
    if args.war:
        restart()
        assert tasks(pid)[0]['taskDefinitionKey']=='ExpandedSubProcess_18'
        recovered=next(x for x in request('/api/leads',java=True) if x['id']==lead['id']);assert recovered==lead
        write('cliente-despues-reinicio.json',recovered);event('Reinicio comprobado: cliente y tarea conservados',instancia=pid)
    for key in ['ExpandedSubProcess_18','ExpandedSubProcess_24','ExpandedSubProcess_20','ExpandedSubProcess_22']:
        complete(pid,key,{'compraRealizada':True} if key.endswith('_22') else {})
    worker();complete(pid,'ExpandedSubProcess_99');wait_task(pid,'ExpandedSubProcess_100');complete(pid,'ExpandedSubProcess_100');complete(pid,'ExpandedSubProcess_101')
    hist=request('/history/historic-process-instances/'+pid);assert hist.get('endTime') and not hist.get('deleteReason')
    lead=next(x for x in request('/api/leads',java=True) if x['id']==lead['id']);assert lead['estado']=='CONVERTIDO'
    write('historial-instancia-completa.json',hist);write('cliente-final.json',lead)
    write('actividades-ejecutadas.json',request('/history/historic-activity-instances?processInstanceId='+pid+'&size=100'))
    write('resultado.json',dict(versionFlowable=engine['version'],servicio='Jakarta REST con Jersey 4',instancia=pid,completado=True,fin=hist['endTime'],cliente=lead,persistenciaMotorComprobada=bool(args.war),persistenciaNegocioComprobada=bool(args.war),inicio='Mensaje ConsultaClienteRecibida',temporizadorDemo='PT10S',interaccion='Tareas humanas completadas por API; interfaz propia pendiente',alcance='Recorrido con compra. La interfaz y las demás funciones de la Entrega 2 siguen pendientes.'))
    event('Recorrido con compra completado',instancia=pid)
    pid2=start(values);complete(pid2,'ExpandedSubProcess_4',values);worker();complete(pid2,'ExpandedSubProcess_69')
    assert len([x for x in request('/api/leads',java=True) if x['telefono']==values['telefono']])==1
    for key in ['ExpandedSubProcess_18','ExpandedSubProcess_24','ExpandedSubProcess_20','ExpandedSubProcess_22','ExpandedSubProcess_30']:
        complete(pid2,key,{'compraRealizada':False} if key.endswith('_22') else {})
    wait_task(pid2,'ExpandedSubProcess_103');complete(pid2,'ExpandedSubProcess_103');complete(pid2,'ExpandedSubProcess_104')
    hist2=request('/history/historic-process-instances/'+pid2);assert hist2.get('endTime') and not hist2.get('deleteReason')
    write('cliente-existente-sin-compra.json',dict(instancia=pid2,completado=True,sinDuplicados=True,historial=hist2))
    event('Cliente existente y seguimiento sin compra completados',instancia=pid2)
    print('Prueba integrada correcta. Evidencias:',out,flush=True)
if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--flowable',default='http://127.0.0.1:8098/flowable-rest')
    parser.add_argument('--java',default='http://127.0.0.1:8096')
    parser.add_argument('--auth-file',type=Path,default=ROOT/'.local/auth.txt')
    parser.add_argument('--war',type=Path,help='Activa además la prueba de reinicio del entorno iniciado con iniciar-local.ps1')
    parser.add_argument('--powershell',default=shutil.which('pwsh') or shutil.which('powershell'))
    args=parser.parse_args();args.flowable=args.flowable.rstrip('/');args.java=args.java.rstrip('/')
    out=ROOT/'Pruebas/Entrega-2';out.mkdir(parents=True,exist_ok=True)
    try:run()
    except Exception as exc:write('error-validacion.json',{'error':str(exc)});raise
