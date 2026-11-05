'use client';
import {useEffect,useRef,useState} from 'react';
import {ArrowLeft,Crown,Maximize,Minimize,Trophy,WifiOff,Pause,Play,Target} from 'lucide-react';
import {standings, type Sale} from '../rules';

type ScreenLock = {released:boolean;release:()=>Promise<void>;addEventListener:(name:string,cb:()=>void)=>void};
export default function LiveDashboard(){
 const [sales,setSales]=useState<Sale[]>([]),[loaded,setLoaded]=useState(false),[error,setError]=useState(''),[updated,setUpdated]=useState<Date|null>(null),[now,setNow]=useState<Date|null>(null),[fullscreen,setFullscreen]=useState(false),[paused,setPaused]=useState(false),[lockMessage,setLockMessage]=useState('');
 const wakeLock=useRef<ScreenLock|null>(null),keepAwake=useRef(false);
 useEffect(()=>{
  let version=0;let stopped=false,controller:AbortController|null=null,timer:ReturnType<typeof setTimeout>|undefined;
  async function refresh(){
   const run=++version;clearTimeout(timer);controller?.abort();controller=new AbortController();const currentController=controller;
   const timeout=setTimeout(()=>currentController.abort(),12000);
   try{const response=await fetch('/api/sales',{cache:'no-store',signal:currentController.signal});if(!response.ok)throw Error('Não foi possível atualizar');const body:unknown=await response.json();if(!Array.isArray(body)||!body.every(s=>typeof s.seller==='string'&&Number.isInteger(s.quantity)&&s.quantity>0))throw Error('Dados indisponíveis');if(!stopped&&run===version){setSales(body as Sale[]);setLoaded(true);setError('');setUpdated(new Date());}}
   catch{if(!stopped&&run===version)setError('Conexão interrompida. Tentando reconectar…');}
   finally{clearTimeout(timeout);if(!stopped&&run===version)timer=setTimeout(refresh,15000);}
  }
  const visible=()=>{if(document.visibilityState==='visible')void refresh();};
  const clock=setInterval(()=>setNow(new Date()),1000);setNow(new Date());void refresh();document.addEventListener('visibilitychange',visible);window.addEventListener('online',visible);
  return()=>{stopped=true;clearTimeout(timer);clearInterval(clock);controller?.abort();document.removeEventListener('visibilitychange',visible);window.removeEventListener('online',visible);};
 },[]);
 async function acquireLock(){
  if(wakeLock.current&&!wakeLock.current.released)return;
  if(!('wakeLock' in navigator)){setLockMessage('Se necessário, desative a suspensão da tela nas configurações do aparelho.');return;}
  try{const sentinel=await (navigator as Navigator & {wakeLock:{request:(type:string)=>Promise<ScreenLock>}}).wakeLock.request('screen');wakeLock.current=sentinel;setLockMessage('Tela mantida ativa enquanto este painel estiver visível.');sentinel.addEventListener('release',()=>{wakeLock.current=null;});}catch{setLockMessage('Não foi possível manter a tela ativa. Confira a suspensão do aparelho.');}
 }
 useEffect(()=>{const change=()=>{const active=Boolean(document.fullscreenElement);setFullscreen(active);if(!active){keepAwake.current=false;void wakeLock.current?.release();setLockMessage('');}};const visible=()=>{if(document.visibilityState==='visible'&&keepAwake.current)void acquireLock();};document.addEventListener('fullscreenchange',change);document.addEventListener('visibilitychange',visible);return()=>{keepAwake.current=false;void wakeLock.current?.release();document.removeEventListener('fullscreenchange',change);document.removeEventListener('visibilitychange',visible);};},[]);
 async function tvMode(){
  if(document.fullscreenElement){await document.exitFullscreen();return;}
  keepAwake.current=true;void acquireLock();
  try{if(document.documentElement.requestFullscreen)await document.documentElement.requestFullscreen();else setLockMessage('Tela cheia indisponível. O painel continua atualizando automaticamente.');}catch{setLockMessage('Tela cheia indisponível. O painel continua atualizando automaticamente.');}
 }
 const list=standings(sales),top=list.filter(s=>s.count>0).slice(0,3),total=list.reduce((n,s)=>n+s.count,0),metas=list.filter(s=>s.count>=s.goal).length;
 const stale=updated&&now&&now.getTime()-updated.getTime()>45000;
 const time=(d:Date)=>d.toLocaleTimeString('pt-BR',{timeZone:'America/Fortaleza',hour:'2-digit',minute:'2-digit',second:'2-digit'});
 return <div className={`tv-page ${paused?'motion-paused':''}`}>
  <header className="tv-header"><a href="/" className="brand">new<span>pay</span><span className="brand-divider"/><small>BLACK FRIDAY ’26</small></a><div className="tv-live"><i/> RANKING AO VIVO</div><div className="tv-actions"><a href="/" aria-label="Voltar ao ranking"><ArrowLeft size={17}/><span>Ranking</span></a><button onClick={()=>setPaused(!paused)} aria-label={paused?'Ativar animações':'Pausar animações'}>{paused?<Play size={17}/>:<Pause size={17}/>}</button><button onClick={tvMode}>{fullscreen?<Minimize size={17}/>:<Maximize size={17}/>}<span>{fullscreen?'Sair da tela cheia':'Modo TV'}</span></button></div></header>
  <main className="tv-main"><div className="tv-title"><div><span className="eyebrow">QUEM PUXA O TIME PARA O TOPO</span><h1>Os protagonistas da Black<span>.</span></h1></div><div className="tv-clock">{now?time(now):'—'}<small>Horário de Fortaleza</small></div></div>
  <div className="tv-status" role="status">{error||stale?<><WifiOff size={15}/>{error||'Dados sem atualização recente.'} {loaded?'Exibindo o último placar recebido.':''}</>:updated?`Atualizado às ${time(updated)} · Atualização automática a cada 15 segundos`:'Conectando ao placar…'}</div>
  <section className="tv-podium" aria-label="Três vendedores com mais máquinas vendidas">{[0,1,2].map(index=>{const s=top[index];return <article className={`tv-card tv-slot-${index+1} ${s?.rank===1?'tv-champion':''}`} key={`${s?.id??index}-${s?.count??0}`} style={{animationDelay:`${index*100}ms`}}>
   <div className="tv-card-top"><span>{s?`${s.rank}º LUGAR`:'SEU LUGAR É AQUI'}</span>{s?.rank===1?<Crown size={25}/>:<Trophy size={22}/>}</div>
   <div className="tv-avatar">{s?.initials??'?'}</div><h2>{s?.name??(loaded?'À espera de uma conquista':'Carregando…')}</h2><div className="tv-number">{s?s.count:'—'}<span>máquinas vendidas</span></div>
   <div className="tv-person-goal"><span>{s?`${Math.round(s.count/s.goal*100)}% da meta`:'A próxima venda muda o jogo'}</span><b>{s?`${s.count} / ${s.goal}`:'—'}</b></div><div className="tv-track"><i style={{width:s?`${Math.min(100,s.count/s.goal*100)}%`:'0%'}}/></div><p>{s?(s.count>=s.goal?'Meta conquistada. Agora é ir além!':`Faltam ${s.goal-s.count} para a meta individual.`):'Cada máquina conta. Vamos juntos!'}</p>
  </article>;})}</section>
  <section className="tv-team" aria-label="Meta coletiva"><Target size={30}/><div><span>A CONQUISTA É DE TODO MUNDO</span><strong>{loaded?total:'—'}<small> / 110 máquinas</small></strong></div><div className="tv-team-progress"><div><span>{loaded?Math.round(total/110*100)+'% da meta coletiva':'Carregando…'}</span><span>{loaded?metas:'—'}/5 metas individuais</span></div><div className="tv-track"><i style={{width:`${Math.min(total/110*100,100)}%`}}/></div></div><p>{metas===5?'Surpresa liberada para o time!':'Todos na meta. Uma surpresa para o time.'}</p></section>
  </main><footer className="tv-footer"><span>BLACK NEWPAY · ATÉ 30/11/2026</span><span>Ranking por volume de máquinas. Empates compartilham posição; ordem alfabética define os três exibidos.</span></footer>{lockMessage&&<div className="tv-lock-message" role="status">{lockMessage}</div>}
 </div>;
}
