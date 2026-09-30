(() => {
  'use strict';
  const KEY='cristina_turnos_v1';
  const defaults=[
    {id:'m',name:'Mañá',code:'M',color:'#55bfae',start:'08:00',end:'15:00'},
    {id:'t',name:'Tarde',code:'T',color:'#f2b447',start:'15:00',end:'22:00'},
    {id:'n',name:'Noite',code:'N',color:'#7298d2',start:'22:00',end:'08:00'},
    {id:'l',name:'Libre',code:'L',color:'#aebfbc',start:'',end:''},
    {id:'v',name:'Vacacións',code:'V',color:'#eb8878',start:'',end:''},
    {id:'p',name:'Permiso/Baixa',code:'P',color:'#ad79cc',start:'',end:''}
  ];
  const previousDefaultColors={m:'#9fd9cf',t:'#ffd08a',n:'#9cb6df',l:'#d9e3e1',v:'#f5b7ad',p:'#d5b8e8'};
  const $=s=>document.querySelector(s); const $$=s=>[...document.querySelectorAll(s)];
  let state=load(), view=new Date(), paint=null, history=[], deferredPrompt=null;
  view=new Date(view.getFullYear(),view.getMonth(),1);

  function fresh(){return {version:1,shiftTypes:structuredClone(defaults),days:{}}}
  function load(){try{const x=JSON.parse(localStorage.getItem(KEY));if(!valid(x))return fresh();x.shiftTypes.forEach(t=>{if(previousDefaultColors[t.id]?.toLowerCase()===t.color.toLowerCase())t.color=defaults.find(d=>d.id===t.id).color});return x}catch{return fresh()}}
  function valid(x){return x&&x.version===1&&Array.isArray(x.shiftTypes)&&x.shiftTypes.every(t=>t.id&&t.name&&t.code&&/^#[0-9a-f]{6}$/i.test(t.color))&&x.days&&typeof x.days==='object'}
  function save(){localStorage.setItem(KEY,JSON.stringify(state))}
  function key(d){return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-')}
  function fromKey(k){const [y,m,d]=k.split('-').map(Number);return new Date(y,m-1,d)}
  function esc(s=''){return String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
  function type(id){return state.shiftTypes.find(t=>t.id===id)}
  function hours(t){if(!t?.start||!t?.end)return 0;const mins=s=>{const[a,b]=s.split(':').map(Number);return a*60+b};let d=mins(t.end)-mins(t.start);if(d<=0)d+=1440;return d/60}
  const months=['xaneiro','febreiro','marzo','abril','maio','xuño','xullo','agosto','setembro','outubro','novembro','decembro'];
  const weekdays=['domingo','luns','martes','mércores','xoves','venres','sábado'];
  function monthName(d){return `${months[d.getMonth()]} de ${d.getFullYear()}`}
  function longDate(d){return `${weekdays[d.getDay()]}, ${d.getDate()} de ${months[d.getMonth()]}`}
  function snapshot(){history.push(JSON.stringify(state));if(history.length>20)history.shift();$('#undoBtn').disabled=false}
  function toast(m){const e=$('#toast');e.textContent=m;e.classList.add('show');clearTimeout(toast.t);toast.t=setTimeout(()=>e.classList.remove('show'),2200)}
  function render(){renderPalette();renderCalendar();renderSummary();renderUpcoming()}
  function renderPalette(){const items=[`<button class="shift-chip ${paint===null?'selected':''}" data-paint="edit">✎ Editar día</button>`,...state.shiftTypes.map(t=>`<button class="shift-chip ${paint===t.id?'selected':''}" data-paint="${t.id}" style="--chip-bg:${t.color}">${esc(t.code)} · ${esc(t.name)}</button>`),`<button class="shift-chip ${paint==='clear'?'selected':''}" data-paint="clear">× Borrar</button>`];$('#shiftPalette').innerHTML=items.join('')}
  function renderCalendar(){
    $('#monthTitle').textContent=monthName(view);const y=view.getFullYear(),m=view.getMonth();const first=new Date(y,m,1);const offset=(first.getDay()+6)%7;const start=new Date(y,m,1-offset);const today=key(new Date());let html='';
    for(let i=0;i<42;i++){const d=new Date(start);d.setDate(start.getDate()+i);const k=key(d),entry=state.days[k],t=entry&&type(entry.shiftId);html+=`<button class="calendar-day ${d.getMonth()!==m?'outside':''} ${k===today?'today':''} ${t?'has-shift':''}" style="--day-color:${t?t.color:'transparent'}" data-day="${k}"><span class="sr-only">${esc(longDate(d))}${t?`, ${esc(t.name)}`:''}</span><span class="day-number">${d.getDate()}</span>${t?`<span class="day-code">${esc(t.code)}</span><span class="day-service">${esc(entry.service||'')}</span>`:''}</button>`}
    $('#calendar').innerHTML=html;
  }
  function renderSummary(){const y=view.getFullYear(),m=view.getMonth();let total=0;const counts={};Object.entries(state.days).forEach(([k,e])=>{const d=fromKey(k);if(d.getFullYear()===y&&d.getMonth()===m){counts[e.shiftId]=(counts[e.shiftId]||0)+1;total+=hours(type(e.shiftId))}});$('#hoursTotal').textContent=`${formatHours(total)} h`;const rows=state.shiftTypes.filter(t=>counts[t.id]).map(t=>`<div class="summary-item" style="--item-color:${t.color}"><b>${esc(t.name)}</b><span>${counts[t.id]} ${counts[t.id]===1?'día':'días'} · ${formatHours(counts[t.id]*hours(t))} h</span></div>`);$('#summary').innerHTML=rows.join('')||'<p class="empty">Aínda non hai quendas neste mes.</p>'}
  function formatHours(h){return Number.isInteger(h)?h:String(Math.round(h*100)/100).replace('.',',')}
  function renderUpcoming(){const now=new Date();now.setHours(0,0,0,0);const rows=Object.entries(state.days).map(([k,e])=>({k,e,d:fromKey(k),t:type(e.shiftId)})).filter(x=>x.d>=now&&x.t).sort((a,b)=>a.d-b.d).slice(0,7);$('#upcoming').innerHTML=rows.map(x=>`<button class="upcoming-item" data-day="${x.k}"><span class="date-box"><b>${x.d.getDate()}</b><span>${months[x.d.getMonth()].slice(0,3)}</span></span><span><b>${esc(x.t.name)}${x.t.start?' · '+x.t.start:''}</b><p>${esc(x.e.service||x.e.note||'Sen nota')}</p></span><span class="shift-dot" style="--dot:${x.t.color}"></span></button>`).join('')||'<p class="empty">Non tes próximas quendas anotadas.</p>'}
  function dayAction(k){if(paint===null)return openDay(k);snapshot();if(paint==='clear')delete state.days[k];else state.days[k]={...(state.days[k]||{}),shiftId:paint};save();render();toast(paint==='clear'?'Día borrado':'Quenda gardada')}
  function openDay(k){const d=fromKey(k),e=state.days[k]||{};$('#dayKey').value=k;$('#dayTitle').textContent=longDate(d);$('#serviceInput').value=e.service||'';$('#noteInput').value=e.note||'';$('#dayShiftOptions').innerHTML=state.shiftTypes.map(t=>`<label class="shift-radio"><input type="radio" name="dayShift" value="${t.id}" ${e.shiftId===t.id?'checked':''}><span style="--radio-bg:${t.color}">${esc(t.code)} · ${esc(t.name)}</span></label>`).join('');$('#dayDialog').showModal()}
  function renderEditor(){const box=$('#shiftEditor');box.innerHTML=state.shiftTypes.map(t=>`<div class="shift-edit-row" data-id="${t.id}"><input class="edit-color" type="color" value="${t.color}" aria-label="Cor de ${esc(t.name)}"><input class="edit-name" value="${esc(t.name)}" maxlength="24" aria-label="Nome"><input class="edit-code" value="${esc(t.code)}" maxlength="3" aria-label="Código"><button class="icon-btn delete-type" aria-label="Eliminar ${esc(t.name)}">×</button><input class="edit-start" type="time" value="${t.start||''}" aria-label="Inicio"><input class="edit-end" type="time" value="${t.end||''}" aria-label="Fin"></div>`).join('')}
  function commitEditor(){state.shiftTypes=$$('#shiftEditor .shift-edit-row').map(r=>({id:r.dataset.id,color:r.querySelector('.edit-color').value,name:r.querySelector('.edit-name').value.trim()||'Quenda',code:r.querySelector('.edit-code').value.trim().toUpperCase()||'?',start:r.querySelector('.edit-start').value,end:r.querySelector('.edit-end').value}));save();render()}

  document.addEventListener('click',e=>{const day=e.target.closest('[data-day]');if(day){dayAction(day.dataset.day);return}const chip=e.target.closest('[data-paint]');if(chip){paint=chip.dataset.paint==='edit'?null:chip.dataset.paint;renderPalette()}});
  $('#prevMonth').onclick=()=>{view.setMonth(view.getMonth()-1);render()};$('#nextMonth').onclick=()=>{view.setMonth(view.getMonth()+1);render()};$('#todayBtn').onclick=()=>{const n=new Date();view=new Date(n.getFullYear(),n.getMonth(),1);render()};
  $('#undoBtn').onclick=()=>{if(!history.length)return;state=JSON.parse(history.pop());save();render();$('#undoBtn').disabled=!history.length;toast('Cambio desfeito')};
  $('#dayForm').addEventListener('submit',e=>{e.preventDefault();const shift=new FormData(e.currentTarget).get('dayShift');if(!shift){toast('Escolle unha quenda');return}snapshot();state.days[$('#dayKey').value]={shiftId:shift,service:$('#serviceInput').value.trim(),note:$('#noteInput').value.trim()};save();render();$('#dayDialog').close();toast('Día gardado')});
  $('#clearDay').onclick=()=>{snapshot();delete state.days[$('#dayKey').value];save();render();$('#dayDialog').close();toast('Día borrado')};
  $$('.close-dialog').forEach(b=>b.onclick=()=>b.closest('dialog').close());
  $('#settingsBtn').onclick=()=>{renderEditor();$('#settingsDialog').showModal()};$('#settingsDialog').addEventListener('close',commitEditor);
  $('#addShiftBtn').onclick=()=>{commitEditor();state.shiftTypes.push({id:'c'+Date.now(),name:'Nova quenda',code:'Q',color:'#b7d8ef',start:'',end:''});save();renderEditor()};
  $('#shiftEditor').addEventListener('click',e=>{const b=e.target.closest('.delete-type');if(!b)return;const row=b.closest('.shift-edit-row');if(state.shiftTypes.length<=1){toast('Debe quedar polo menos unha quenda');return}row.remove()});
  $('#exportBtn').onclick=()=>{commitEditor();const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`turnos-copia-${key(new Date())}.json`;a.click();URL.revokeObjectURL(a.href);toast('Copia descargada')};
  $('#importInput').onchange=async e=>{try{const data=JSON.parse(await e.target.files[0].text());if(!valid(data))throw new Error();snapshot();state=data;save();renderEditor();render();toast('Copia restaurada')}catch{toast('A copia non é válida')}finally{e.target.value=''}};
  $('#clearAllBtn').onclick=()=>{if(confirm('Seguro que queres borrar todos os turnos e axustes?')){state=fresh();history=[];save();renderEditor();render();toast('Datos borrados')}};
  window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredPrompt=e;$('#installBtn').hidden=false});$('#installBtn').onclick=async()=>{if(deferredPrompt){deferredPrompt.prompt();await deferredPrompt.userChoice;deferredPrompt=null;$('#installBtn').hidden=true}};
  if('serviceWorker'in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js'));
  render();
})();
