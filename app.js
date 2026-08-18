'use strict';
/* ══════════════════════════════════════════════════════════════
   GRID TAB 2.0 — minimalist customisable new tab
   ══════════════════════════════════════════════════════════════ */
(function(){
  const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
  const root=document.documentElement,body=document.body;
  const pad=n=>String(n).padStart(2,"0");
  const key=(y,m,d)=>y+"-"+pad(m+1)+"-"+pad(d);
  const hasChrome=typeof chrome!=="undefined"&&chrome.storage;

  /* ─────────── FAVICONS ─────────── */
  function faviconUrl(url){try{const u=url.startsWith("http")?url:"https://"+url;return "https://www.google.com/s2/favicons?domain="+new URL(u).hostname+"&sz=64";}catch(e){return null;}}
  function letterTile(name){const c=((name||"?").trim()[0]||"?").toUpperCase();
    let h=0;for(const ch of (name||"x"))h=(h+ch.charCodeAt(0))%360;
    const el=document.createElement("div");el.className="bm-letter";el.style.background="hsl("+h+" 52% 46%)";el.textContent=c;return el;}
  function iconEl(item){const wrap=document.createElement("div");wrap.className="bm-ic";
    if(item.iconData){const img=new Image();img.src=item.iconData;img.alt="";wrap.appendChild(img);return wrap;}
    const f=faviconUrl(item.url);
    if(f){const img=new Image();img.referrerPolicy="no-referrer";img.alt="";img.onerror=()=>{wrap.textContent="";wrap.appendChild(letterTile(item.name));};img.src=f;wrap.appendChild(img);}
    else wrap.appendChild(letterTile(item.name));
    return wrap;}
  function folderMiniEl(folder){const wrap=document.createElement("div");wrap.className="bm-ic bm-folder-ic";
    (folder.children||[]).slice(0,4).forEach(c=>{const cell=document.createElement("div");cell.className="fm-cell";
      const f=c.iconData||faviconUrl(c.url);
      if(f){const img=new Image();img.referrerPolicy="no-referrer";img.alt="";img.onerror=()=>img.remove();img.src=f;cell.appendChild(img);}
      wrap.appendChild(cell);});
    if(!(folder.children||[]).length)wrap.textContent="📁";
    return wrap;}
  const openUrl=(url,nt)=>{const u=url.startsWith("http")?url:"https://"+url;if(nt)window.open(u,"_blank","noopener");else window.location.href=u;};

  /* ─────────── STATE ─────────── */
  const now0=new Date();
  function defaults(){return {
    v:2, name:"", themeMode:"auto", accent:"#5A4BFF", bgMode:"tint", border:"hair", savedAt:0,
    widgets:[{id:"bookmarks",w:2,h:1,bg:null},{id:"tasks",w:1,h:1,bg:null},{id:"next",w:1,h:1,bg:null}],
    bookmarks:[
      {t:"link",url:"https://mail.google.com",name:"Gmail"},
      {t:"link",url:"https://youtube.com",name:"YouTube"},
      {t:"link",url:"https://github.com",name:"GitHub"},
      {t:"link",url:"https://open.spotify.com",name:"Spotify"},
      {t:"link",url:"https://notion.so",name:"Notion"},
      {t:"link",url:"https://x.com",name:"X"},
      {t:"link",url:"https://reddit.com",name:"Reddit"}
    ],
    tasks:[{t:"Welcome to Grid Tab — click to check off",d:false}],
    reminders:[],
    cols:4, calYear:now0.getFullYear(), calMonth:now0.getMonth()
  };}
  let state=defaults();
  const WSPEC={
    bookmarks:{name:"Bookmarks",icon:'<path d="M6 4h12a2 2 0 0 1 2 2v14l-8-4-8 4V6a2 2 0 0 1 2-2z"/>',dflt:{w:2,h:1}},
    tasks:{name:"Tasks",icon:'<path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>',dflt:{w:1,h:1}},
    next:{name:"Up next",icon:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',dflt:{w:1,h:1}},
    notes:{name:"Notes",icon:'<path d="M4 4h16v16H4z"/><path d="M8 9h8M8 13h8M8 17h5"/>',dflt:{w:1,h:1}},
    calendar:{name:"Calendar",icon:'<rect x="3" y="4" width="18" height="17" rx="2"/><path d="M3 9h18M8 3v4M16 3v4"/>',dflt:{w:1,h:2}},
    image:{name:"Image",icon:'<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M4 18l5-4 5 3 3-2 3 3"/>',dflt:{w:1,h:1}},
    focus:{name:"Focus timer",icon:'<circle cx="12" cy="13" r="8"/><path d="M12 13V9M9 2h6"/>',dflt:{w:1,h:1}}
  };

  /* ─────────── PERSISTENCE ─────────── */
  function exportable(){return {v:2,name:state.name,themeMode:state.themeMode,accent:state.accent,bgMode:state.bgMode,border:state.border,
    savedAt:state.savedAt,widgets:state.widgets,bookmarks:state.bookmarks,tasks:state.tasks,reminders:state.reminders};}
  function stripHeavy(o){const s=JSON.parse(JSON.stringify(o));
    s.widgets=(s.widgets||[]).map(w=>{const c={...w};if(c.img)c.img=null;return c;}); // images too big for sync
    s.bookmarks=(s.bookmarks||[]).map(b=>b.t==="folder"?{...b,children:(b.children||[]).map(c=>({...c,iconData:undefined}))}:{...b,iconData:undefined});
    return s;}
  let saveT;
  function save(){clearTimeout(saveT);saveT=setTimeout(persistNow,350);}
  function persistNow(){try{
    state.savedAt=Date.now();
    const d=JSON.stringify(exportable());
    if(hasChrome&&chrome.storage.local)chrome.storage.local.set({gridtab2:d});
    try{localStorage.setItem("gridtab2",d);}catch(e){}
    const sync=JSON.stringify(stripHeavy(exportable()));
    if(sync.length<90000)storeSynced(sync);
  }catch(e){}}
  async function storeSynced(data){
    if(!(hasChrome&&chrome.storage.sync))return;
    const CH=7500,total=Math.ceil(data.length/CH);
    try{const ex=await new Promise(r=>chrome.storage.sync.get(null,r));
      const old=Object.keys(ex).filter(k=>k.startsWith("gt_"));
      if(old.length)await new Promise(r=>chrome.storage.sync.remove(old,r));
      const obj={gt_n:total,gt_ts:Date.now()};
      for(let i=0;i<total;i++)obj["gt_"+i]=data.slice(i*CH,(i+1)*CH);
      await new Promise(r=>chrome.storage.sync.set(obj,r));
    }catch(e){}}
  function readSynced(){return new Promise(res=>{
    if(!(hasChrome&&chrome.storage.sync)){res(null);return;}
    try{chrome.storage.sync.get(null,all=>{try{
      if(chrome.runtime&&chrome.runtime.lastError){res(null);return;}
      if(!all||!all.gt_n){res(null);return;}
      let raw="";for(let i=0;i<all.gt_n;i++)raw+=all["gt_"+i]||"";
      const o=JSON.parse(raw);if(o&&!o.savedAt&&all.gt_ts)o.savedAt=all.gt_ts;res(o&&typeof o==="object"?o:null);
    }catch(e){res(null);}});}catch(e){res(null);}});}
  function applyLoaded(s){if(!s)return;const d=defaults();
    state.name=s.name!=null?s.name:d.name;
    state.themeMode=s.themeMode||d.themeMode;state.accent=s.accent||d.accent;state.bgMode=s.bgMode||d.bgMode;state.border=s.border||d.border;
    state.savedAt=s.savedAt||0;
    if(Array.isArray(s.widgets)&&s.widgets.length)state.widgets=s.widgets;
    if(Array.isArray(s.bookmarks))state.bookmarks=s.bookmarks;
    if(Array.isArray(s.tasks))state.tasks=s.tasks;
    if(Array.isArray(s.reminders))state.reminders=s.reminders;}
  function load(cb){
    const parse=r=>{try{return JSON.parse(r);}catch(e){return null;}};
    const pick=local=>{readSynced().then(sync=>{
      const lt=(local&&local.savedAt)||0,st=(sync&&sync.savedAt)||0;
      applyLoaded(sync&&st>=lt?sync:local);cb();
    }).catch(()=>{applyLoaded(local);cb();});};
    try{
      if(hasChrome&&chrome.storage.local)chrome.storage.local.get("gridtab2",r=>pick(parse((r&&r.gridtab2)||localStorage.getItem("gridtab2"))));
      else pick(parse(localStorage.getItem("gridtab2")));
    }catch(e){cb();}}

  /* ─────────── CLOCK ─────────── */
  const clock=$("#clock"),greeting=$("#greeting"),metaDate=$("#metaDate");
  function tick(){const d=new Date();let h=d.getHours();const m=pad(d.getMinutes());
    clock.innerHTML=((h%12)||12)+":"+m+' <span class="sec">'+(h>=12?"PM":"AM")+'</span>';
    greeting.textContent=(h<12?"Good morning":h<18?"Good afternoon":"Good evening")+(state.name?", "+state.name:"");
    metaDate.textContent=d.toLocaleDateString(undefined,{weekday:"long",day:"numeric",month:"long"});}

  /* ─────────── THEME / ACCENT / BG / BORDER / NAME ─────────── */
  const themeLabel=$("#themeLabel");
  function applyTheme(){if(state.themeMode==="auto"){root.removeAttribute("data-theme");themeLabel.textContent="Auto";}
    else{root.setAttribute("data-theme",state.themeMode);themeLabel.textContent=state.themeMode[0].toUpperCase()+state.themeMode.slice(1);}
    $$("#appearanceChoices button").forEach(b=>b.classList.toggle("on",b.dataset.theme===state.themeMode));applyBg();}
  function applyAccent(){root.style.setProperty("--accent",state.accent);
    $$("#swatches .sw").forEach(s=>s.classList.toggle("on",s.dataset.accent===state.accent));}
  function applyBg(){$$("#bgChoices button").forEach(x=>x.classList.toggle("on",x.dataset.bg===state.bgMode));
    root.style.setProperty("--amb",state.bgMode==="plain"?"0%":state.bgMode==="vivid"?"46%":(root.getAttribute("data-theme")==="dark"?"30%":"22%"));}
  function applyBorder(){$$("#borderChoices button").forEach(x=>x.classList.toggle("on",x.dataset.border===state.border));
    const dark=root.getAttribute("data-theme")==="dark";
    root.style.setProperty("--hair",state.border==="none"?"transparent":state.border==="bold"?(dark?"rgba(255,255,255,.24)":"rgba(20,22,26,.24)"):(dark?"rgba(255,255,255,.10)":"rgba(20,22,26,.11)"));}
  function applyAll(){applyTheme();applyAccent();applyBorder();}

  /* ─────────── SETTINGS SHEET ─────────── */
  const sheet=$("#sheet"),sheetScrim=$("#sheetScrim");
  const openSheet=()=>{sheet.classList.add("open");sheetScrim.classList.add("open");};
  const closeSheet=()=>{sheet.classList.remove("open");sheetScrim.classList.remove("open");};

  /* ─────────── TOAST ─────────── */
  let toastT;const toastEl=$("#toast");
  const toast=m=>{toastEl.textContent=m;toastEl.classList.add("show");clearTimeout(toastT);toastT=setTimeout(()=>toastEl.classList.remove("show"),1700);};

  /* ─────────── PANEL ─────────── */
  const panel=$("#panel");
  const openPanel=()=>panel.classList.add("open");
  const closePanel=()=>panel.classList.remove("open");

  /* ─────────── COLUMNS ─────────── */
  function computeCols(){const w=Math.min(window.innerWidth,1200)-80;state.cols=Math.max(1,Math.min(4,Math.floor(w/250)));$("#grid").style.setProperty("--cols",state.cols);}

  /* ─────────── FLIP ─────────── */
  function withFlip(container,mutate){const first={};[...container.children].forEach(c=>{if(c.dataset.id)first[c.dataset.id]=c.getBoundingClientRect();});
    mutate();
    [...container.children].forEach(c=>{const f=first[c.dataset.id];if(!f)return;const l=c.getBoundingClientRect();
      const dx=f.left-l.left,dy=f.top-l.top,sx=l.width?f.width/l.width:1,sy=l.height?f.height/l.height:1;
      if(Math.abs(dx)<.5&&Math.abs(dy)<.5&&Math.abs(sx-1)<.01&&Math.abs(sy-1)<.01)return;
      c.style.transformOrigin="top left";c.style.transition="none";c.style.transform="translate("+dx+"px,"+dy+"px) scale("+sx+","+sy+")";
      c.getBoundingClientRect();
      requestAnimationFrame(()=>{c.style.transition="transform .34s cubic-bezier(.2,.8,.2,1)";c.style.transform="";
        setTimeout(()=>{c.style.transition="";c.style.transformOrigin="";},360);});});}

  /* ─────────── WIDGET SKIN (per-widget bg + adaptive text) ─────────── */
  function lum(hex){hex=hex.replace("#","");if(hex.length===3)hex=hex.split("").map(c=>c+c).join("");const n=parseInt(hex,16);return (0.299*((n>>16)&255)+0.587*((n>>8)&255)+0.114*(n&255))/255;}
  function applyWidgetSkin(el,bg){const props=["--text","--text-2","--text-3","--hair","--hair-2"];
    if(!bg){el.style.background="";props.forEach(p=>el.style.removeProperty(p));return;}
    el.style.background=bg;
    if(lum(bg)>0.55){el.style.setProperty("--text","#1b1e23");el.style.setProperty("--text-2","rgba(27,30,35,.62)");el.style.setProperty("--text-3","rgba(27,30,35,.42)");el.style.setProperty("--hair","rgba(20,22,26,.15)");el.style.setProperty("--hair-2","rgba(20,22,26,.08)");}
    else{el.style.setProperty("--text","#EDEEF0");el.style.setProperty("--text-2","rgba(237,238,240,.66)");el.style.setProperty("--text-3","rgba(237,238,240,.42)");el.style.setProperty("--hair","rgba(255,255,255,.16)");el.style.setProperty("--hair-2","rgba(255,255,255,.09)");}}

  /* ─────────── WIDGET BODIES ─────────── */
  function bodyBookmarks(){return '<div class="bm-grid" id="bmGrid"></div>';}
  function wireBookmarks(card){const grid=card.querySelector("#bmGrid");grid.innerHTML="";
    state.bookmarks.forEach((b,i)=>{
      const el=document.createElement("div");el.className="bm"+(b.t==="folder"?" bm-folder":"");el.dataset.i=i;
      el.appendChild(b.t==="folder"?folderMiniEl(b):iconEl(b));
      const lb=document.createElement("div");lb.className="bm-lb";lb.textContent=b.name||"";el.appendChild(lb);
      if(b.t==="folder")el.addEventListener("click",e=>{if(!el.dataset.dragged)openFolder(i);delete el.dataset.dragged;});
      else{el.addEventListener("click",e=>{if(el.dataset.dragged){delete el.dataset.dragged;return;}(e.ctrlKey||e.metaKey)?openUrl(b.url,true):openUrl(b.url);});
        el.addEventListener("auxclick",e=>{if(e.button===1){e.preventDefault();openUrl(b.url,true);}});
        el.addEventListener("mousedown",e=>{if(e.button===1)e.preventDefault();});}
      el.addEventListener("pointerdown",e=>{if(e.button===0)startBmDrag(e,el,card);});
      grid.appendChild(el);
    });
    const add=document.createElement("div");add.className="bm bm-add";add.innerHTML='<div class="bm-ic"><svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg></div><div class="bm-lb">Add</div>';
    add.addEventListener("click",openBmModal);grid.appendChild(add);}

  function bodyTasks(){return '<div id="taskWrap"></div><input class="task-add" id="taskAdd" placeholder="Add a task"/>';}
  function wireTasks(card){const wrap=card.querySelector("#taskWrap");
    function paint(){wrap.innerHTML="";state.tasks.forEach((t,i)=>{const el=document.createElement("div");el.className="task"+(t.d?" done":"");
      el.innerHTML='<div class="box"><svg viewBox="0 0 24 24"><path d="M4 12l5 5L20 6"/></svg></div><span class="task-txt"></span><button class="item-del" title="Remove">×</button>';
      el.querySelector(".task-txt").textContent=t.t;
      el.querySelector(".box").onclick=el.querySelector(".task-txt").onclick=()=>{t.d=!t.d;paint();save();};
      el.querySelector(".item-del").onclick=e=>{e.stopPropagation();state.tasks.splice(i,1);paint();save();};
      wrap.appendChild(el);});}
    paint();
    card.querySelector("#taskAdd").onkeydown=e=>{if(e.key==="Enter"&&e.target.value.trim()){state.tasks.unshift({t:e.target.value.trim(),d:false});e.target.value="";paint();save();}};}

  function relLabel(ds){const[y,m,d]=ds.split("-").map(Number);const t=new Date(y,m-1,d),n=new Date(),t0=new Date(n.getFullYear(),n.getMonth(),n.getDate());
    const diff=Math.round((t-t0)/864e5);if(diff===0)return"Today";if(diff===1)return"Tmrw";if(diff>1&&diff<7)return t.toLocaleDateString(undefined,{weekday:"short"});return t.toLocaleDateString(undefined,{month:"short",day:"numeric"});}
  function bodyNext(){const items=upcoming();
    if(!items.length)return '<div class="next-empty">No reminders yet. Click a day in the Calendar widget to add one.</div>';
    return items.map(r=>'<div class="next-item'+(relLabel(r.date)==="Today"?" due":"")+'"><div class="next-time">'+relLabel(r.date)+'</div><div class="next-title">'+esc(r.label)+'</div><button class="item-del" data-rid="'+r.id+'" title="Remove">×</button></div>').join("");}
  function upcoming(){const n=new Date(),t0=new Date(n.getFullYear(),n.getMonth(),n.getDate());
    return state.reminders.filter(r=>{const[y,m,d]=r.date.split("-").map(Number);return new Date(y,m-1,d)>=t0;}).sort((a,b)=>a.date.localeCompare(b.date));}
  function wireNext(card){card.querySelectorAll(".item-del").forEach(b=>b.onclick=e=>{e.stopPropagation();state.reminders=state.reminders.filter(r=>r.id!==b.dataset.rid);renderGrid();save();});}

  function bodyNotes(w){return '<div class="notes-body" contenteditable="true" data-ph="Jot something down…">'+(w.notes||"")+'</div>';}
  function wireNotes(card,w){const el=card.querySelector(".notes-body");let t;el.addEventListener("input",()=>{clearTimeout(t);t=setTimeout(()=>{w.notes=el.innerHTML;save();},400);});}

  function bodyCalendar(){const y=state.calYear,mo=state.calMonth,now=new Date();
    const isThis=(y===now.getFullYear()&&mo===now.getMonth()),today=now.getDate();
    const first=new Date(y,mo,1).getDay(),off=first===0?6:first-1,dim=new Date(y,mo+1,0).getDate();
    const rem={};state.reminders.forEach(r=>{const[ry,rm,rd]=r.date.split("-").map(Number);if(ry===y&&rm-1===mo)rem[rd]=1;});
    let cells="";for(let i=0;i<off;i++)cells+='<div class="cal-d out"></div>';
    for(let d=1;d<=dim;d++)cells+='<div class="cal-d'+(isThis&&d===today?" today":"")+(rem[d]?" rem":"")+'" data-day="'+d+'">'+d+'</div>';
    return '<div class="cal-wrap"><div class="cal-top"><div class="cal-m">'+new Date(y,mo,1).toLocaleDateString(undefined,{month:"long",year:"numeric"})+'</div><div class="cal-nav"><button data-nav="-1"><svg viewBox="0 0 24 24"><path d="M15 6l-6 6 6 6"/></svg></button><button data-nav="1"><svg viewBox="0 0 24 24"><path d="M9 6l6 6-6 6"/></svg></button></div></div><div class="cal-dow"><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span><span>S</span></div><div class="cal-days">'+cells+'</div></div>';}
  function wireCalendar(card){card.querySelectorAll("[data-nav]").forEach(b=>b.onclick=()=>{state.calMonth+=+b.dataset.nav;if(state.calMonth<0){state.calMonth=11;state.calYear--;}if(state.calMonth>11){state.calMonth=0;state.calYear++;}renderGrid();});
    card.querySelectorAll("[data-day]").forEach(d=>d.onclick=()=>openRem(state.calYear,state.calMonth,+d.dataset.day));}

  function bodyImage(w){if(!w.img)return '<div class="img-ph" data-imgadd><svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M4 18l5-4 5 3 3-2 3 3"/></svg><span>Click to add image</span></div><input type="file" accept="image/*" class="img-file" style="display:none">';
    return '<img class="img-el" src="'+w.img.src+'" style="object-fit:'+w.img.fit+'"/><div class="img-ov"><button data-fit="cover"'+(w.img.fit==="cover"?' class="on"':'')+'>Fill</button><button data-fit="contain"'+(w.img.fit==="contain"?' class="on"':'')+'>Fit</button><button data-imgchange>Change</button><button data-imgremove>Remove</button></div><input type="file" accept="image/*" class="img-file" style="display:none">';}
  function wireImage(card,w){const file=card.querySelector(".img-file");
    const pick=()=>file.click();
    file.onchange=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=ev=>{w.img={src:ev.target.result,fit:(w.img&&w.img.fit)||"cover"};renderGrid();save();};r.readAsDataURL(f);e.target.value="";};
    const ph=card.querySelector("[data-imgadd]");if(ph)ph.onclick=pick;
    card.querySelectorAll("[data-fit]").forEach(b=>b.onclick=()=>{w.img.fit=b.dataset.fit;renderGrid();save();});
    const ch=card.querySelector("[data-imgchange]");if(ch)ch.onclick=pick;
    const rm=card.querySelector("[data-imgremove]");if(rm)rm.onclick=()=>{w.img=null;renderGrid();save();};}

  function bodyFocus(w){const mins=(w.focus&&w.focus.mins)||25;return '<div class="focus-t"><div class="focus-num" data-focus-num>'+pad(mins)+':00</div><button class="focus-btn" data-focus-btn>Start focus</button></div>';}
  function wireFocus(card,w){const num=card.querySelector("[data-focus-num]"),btn=card.querySelector("[data-focus-btn]");
    if(!w.focus)w.focus={mins:25,left:0,running:false};
    let iv=w._iv;
    function paint(){num.textContent=pad(Math.floor(w.focus.left/60))+":"+pad(w.focus.left%60);}
    if(w.focus.running){paint();btn.textContent="Stop";}
    btn.onclick=()=>{if(w.focus.running){w.focus.running=false;clearInterval(w._iv);btn.textContent="Start focus";num.textContent=pad(w.focus.mins)+":00";}
      else{w.focus.left=w.focus.mins*60;w.focus.running=true;btn.textContent="Stop";paint();
        w._iv=setInterval(()=>{w.focus.left--;if(w.focus.left<=0){clearInterval(w._iv);w.focus.running=false;btn.textContent="Start focus";num.textContent="00:00";toast("Focus session complete");}else paint();},1000);}};}

  const BODY={bookmarks:bodyBookmarks,tasks:bodyTasks,next:bodyNext,notes:bodyNotes,calendar:bodyCalendar,image:bodyImage,focus:bodyFocus};
  const WIRE={bookmarks:wireBookmarks,tasks:wireTasks,calendar:wireCalendar,next:wireNext,notes:wireNotes,image:wireImage,focus:wireFocus};
  const esc=s=>String(s==null?"":s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");

  /* ─────────── RENDER GRID ─────────── */
  const grid=$("#grid");
  function buildCard(w){const spec=WSPEC[w.id];const el=document.createElement("div");el.className="card";el.dataset.id=w.id;
    el.style.setProperty("--w",Math.min(w.w,state.cols));el.style.setProperty("--h",w.h);
    applyWidgetSkin(el,w.bg);
    if(w.id==="image"&&w.img)el.classList.add("img-filled");
    el.innerHTML='<div class="card-head"><div class="card-label"><span class="move-h" title="Drag to move"><svg viewBox="0 0 24 24" fill="currentColor" stroke="none"><circle cx="9" cy="6" r="1.6"/><circle cx="15" cy="6" r="1.6"/><circle cx="9" cy="12" r="1.6"/><circle cx="15" cy="12" r="1.6"/><circle cx="9" cy="18" r="1.6"/><circle cx="15" cy="18" r="1.6"/></svg></span>'+spec.name+'</div><div class="card-tools"><button class="ctool paint" title="Widget background"><svg viewBox="0 0 24 24"><path d="M12 3l7 7-9 9-5-2-2-5z"/><path d="M9 6l9 9"/></svg><input type="color" value="'+(w.bg||"#ffffff")+'"></button><button class="ctool rm" title="Remove widget"><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg></button></div></div><div class="card-body">'+BODY[w.id](w)+'</div><div class="rh rh-e" data-dir="e"></div><div class="rh rh-w" data-dir="w"></div><div class="rh rh-n" data-dir="n"></div><div class="rh rh-s" data-dir="s"></div><div class="rh rh-se" data-dir="se"></div><div class="rh rh-sw" data-dir="sw"></div><div class="rh rh-ne" data-dir="ne"></div><div class="rh rh-nw" data-dir="nw"></div>';
    el.querySelector(".rm").onclick=()=>{state.widgets=state.widgets.filter(x=>x!==w);renderGrid();save();};
    const pin=el.querySelector(".paint input");pin.oninput=e=>{w.bg=e.target.value;applyWidgetSkin(el,e.target.value);};pin.onchange=save;
    el.querySelector(".move-h").addEventListener("pointerdown",e=>{if(e.button===0)startCardDrag(e,w);});
    el.querySelectorAll(".rh").forEach(h=>h.addEventListener("pointerdown",e=>{if(e.button===0)startResize(e,w,el,h.dataset.dir);}));
    if(WIRE[w.id])WIRE[w.id](el,w);
    return el;}
  function attachScrollbar(card){const bodyEl=card.querySelector(".card-body");if(!bodyEl||card.querySelector(".cscroll"))return;
    const bar=document.createElement("div");bar.className="cscroll";card.appendChild(bar);
    function update(){const sh=bodyEl.scrollHeight,ch=bodyEl.clientHeight;
      if(sh<=ch+1){bar.style.display="none";bar.style.opacity="0";return;}
      bar.style.display="";bar.style.removeProperty("opacity");
      const inset=6,trackH=ch-inset*2,thumbH=Math.max(22,trackH*ch/sh),ms=sh-ch;
      bar.style.height=thumbH+"px";bar.style.top=(bodyEl.offsetTop+inset+(ms?bodyEl.scrollTop/ms:0)*(trackH-thumbH))+"px";}
    bodyEl.addEventListener("scroll",update,{passive:true});
    try{new ResizeObserver(update).observe(bodyEl);}catch(e){}
    try{new MutationObserver(update).observe(bodyEl,{childList:true,subtree:true,characterData:true});}catch(e){}
    requestAnimationFrame(update);}
  function renderGrid(){grid.innerHTML="";state.widgets.forEach(w=>grid.appendChild(buildCard(w)));
    requestAnimationFrame(()=>[...grid.querySelectorAll(".card")].forEach(attachScrollbar));}

  /* ─────────── CARD MOVE ─────────── */
  let cardDrag=null;
  function startCardDrag(e,w){e.preventDefault();
    const el=[...grid.children].find(c=>c.dataset.id===w.id);const r=el.getBoundingClientRect();
    const clone=el.cloneNode(true);clone.classList.add("drag-clone");clone.style.width=r.width+"px";clone.style.height=r.height+"px";clone.style.left=r.left+"px";clone.style.top=r.top+"px";document.body.appendChild(clone);
    cardDrag={w,clone,offX:e.clientX-r.left,offY:e.clientY-r.top};el.classList.add("drag-src");
    window.addEventListener("pointermove",onCardMove);window.addEventListener("pointerup",onCardUp,{once:true});}
  function onCardMove(e){if(!cardDrag)return;cardDrag.clone.style.left=(e.clientX-cardDrag.offX)+"px";cardDrag.clone.style.top=(e.clientY-cardDrag.offY)+"px";
    const under=document.elementFromPoint(e.clientX,e.clientY),over=under&&under.closest(".card");
    if(over&&over.dataset.id!==cardDrag.w.id){const overW=state.widgets.find(x=>x.id===over.dataset.id);
      const from=state.widgets.indexOf(cardDrag.w),to=state.widgets.indexOf(overW);
      if(from>-1&&to>-1){withFlip(grid,()=>{state.widgets.splice(from,1);state.widgets.splice(to,0,cardDrag.w);
        grid.innerHTML="";state.widgets.forEach(w=>grid.appendChild(buildCard(w)));requestAnimationFrame(()=>[...grid.querySelectorAll(".card")].forEach(attachScrollbar));
        [...grid.children].forEach(c=>{if(c.dataset.id===cardDrag.w.id)c.classList.add("drag-src");});});}}}
  function onCardUp(){if(!cardDrag)return;window.removeEventListener("pointermove",onCardMove);cardDrag.clone.remove();[...grid.children].forEach(c=>c.classList.remove("drag-src"));cardDrag=null;save();}

  /* ─────────── RESIZE ─────────── */
  function startResize(e,w,el,dir){e.preventDefault();e.stopPropagation();
    const gr=grid.getBoundingClientRect(),cell=(gr.width-16*(state.cols-1))/state.cols,rowH=214,rect=el.getBoundingClientRect();document.body.style.userSelect="none";
    function move(ev){let nw=w.w,nh=w.h;
      if(dir.indexOf("e")>-1)nw=Math.round((ev.clientX-rect.left)/(cell+16));
      if(dir.indexOf("w")>-1)nw=Math.round((rect.right-ev.clientX)/(cell+16));
      if(dir.indexOf("s")>-1)nh=Math.round((ev.clientY-rect.top)/rowH);
      if(dir.indexOf("n")>-1)nh=Math.round((rect.bottom-ev.clientY)/rowH);
      nw=Math.max(1,Math.min(state.cols,nw));nh=Math.max(1,Math.min(3,nh));
      if(nw!==w.w||nh!==w.h){w.w=nw;w.h=nh;withFlip(grid,()=>{el.style.setProperty("--w",Math.min(nw,state.cols));el.style.setProperty("--h",nh);});}}
    function up(){window.removeEventListener("pointermove",move);window.removeEventListener("pointerup",up);document.body.style.userSelect="";save();}
    window.addEventListener("pointermove",move);window.addEventListener("pointerup",up,{once:true});}

  /* ─────────── BOOKMARK DRAG (reorder + folder) ─────────── */
  let bmDrag=null;
  function startBmDrag(e,tile,card){let started=false;const sx=e.clientX,sy=e.clientY;const i=+tile.dataset.i;
    if(tile.classList.contains("bm-add"))return;
    const timer=setTimeout(begin,150);
    function begin(){started=true;const r=tile.querySelector(".bm-ic").getBoundingClientRect();
      const clone=tile.querySelector(".bm-ic").cloneNode(true);clone.className="bm-clone";clone.style.left=r.left+"px";clone.style.top=r.top+"px";document.body.appendChild(clone);
      bmDrag={i,clone,offX:e.clientX-r.left,offY:e.clientY-r.top,card,mode:null,target:null,after:false};tile.classList.add("bm-drag-src");tile.dataset.dragged="1";}
    function clearMarks(){card.querySelectorAll(".bm-drop-into,.bm-insert-before,.bm-insert-after").forEach(x=>x.classList.remove("bm-drop-into","bm-insert-before","bm-insert-after"));}
    function mv(ev){if(!started){if(Math.hypot(ev.clientX-sx,ev.clientY-sy)>6){clearTimeout(timer);begin();}return;}
      bmDrag.clone.style.left=(ev.clientX-bmDrag.offX)+"px";bmDrag.clone.style.top=(ev.clientY-bmDrag.offY)+"px";
      const under=document.elementFromPoint(ev.clientX,ev.clientY),over=under&&under.closest(".bm[data-i]");
      clearMarks();bmDrag.mode=null;bmDrag.target=null;
      if(over&&+over.dataset.i!==bmDrag.i&&!over.classList.contains("bm-add")){const to=+over.dataset.i,dragged=state.bookmarks[bmDrag.i],onIcon=under.closest(".bm-ic");
        if(onIcon&&dragged&&dragged.t==="link"){bmDrag.mode="folder";bmDrag.target=to;over.classList.add("bm-drop-into");}
        else{const r=over.getBoundingClientRect(),after=ev.clientX>r.left+r.width/2;bmDrag.mode="reorder";bmDrag.target=to;bmDrag.after=after;over.classList.add(after?"bm-insert-after":"bm-insert-before");}}}
    function up(){clearTimeout(timer);window.removeEventListener("pointermove",mv);window.removeEventListener("pointerup",up);
      if(!bmDrag)return;bmDrag.clone.remove();clearMarks();
      if(bmDrag.mode==="folder")makeFolder(bmDrag.i,bmDrag.target);
      else if(bmDrag.mode==="reorder"){let from=bmDrag.i,to=bmDrag.target+(bmDrag.after?1:0);const arr=state.bookmarks;const[m]=arr.splice(from,1);if(from<to)to--;arr.splice(Math.max(0,to),0,m);}
      if(bmDrag.mode)save();
      wireBookmarks(card);bmDrag=null;}
    window.addEventListener("pointermove",mv);window.addEventListener("pointerup",up,{once:true});}
  function makeFolder(fromIdx,targetIdx){const dragged=state.bookmarks[fromIdx],target=state.bookmarks[targetIdx];
    if(!dragged||dragged.t!=="link"||fromIdx===targetIdx)return;
    const child={url:dragged.url,name:dragged.name,iconData:dragged.iconData};
    if(target.t==="folder"){target.children.push(child);state.bookmarks.splice(fromIdx,1);toast("Added to “"+target.name+"”");}
    else{state.bookmarks[targetIdx]={t:"folder",name:"Folder",children:[{url:target.url,name:target.name,iconData:target.iconData},child]};state.bookmarks.splice(fromIdx,1);toast("Folder created");}}

  /* ─────────── ADD WIDGET ─────────── */
  const wgScrim=$("#wgScrim"),wgList=$("#wgList");
  function openWg(){wgList.innerHTML="";Object.keys(WSPEC).forEach(id=>{const has=state.widgets.some(w=>w.id===id);
    const el=document.createElement("button");el.className="wg";if(has)el.setAttribute("disabled","");
    el.innerHTML='<div class="wg-ic"><svg viewBox="0 0 24 24">'+WSPEC[id].icon+'</svg></div><div class="wg-name">'+WSPEC[id].name+(has?" ✓":"")+'</div>';
    el.onclick=()=>{if(!state.widgets.some(w=>w.id===id)){const d=WSPEC[id].dflt;state.widgets.push({id,w:d.w,h:d.h,bg:null});renderGrid();save();
      setTimeout(()=>grid.lastElementChild.scrollIntoView({behavior:"smooth",block:"center"}),60);}wgScrim.classList.remove("open");};
    wgList.appendChild(el);});wgScrim.classList.add("open");}

  /* ─────────── ADD BOOKMARK + CHROME IMPORT ─────────── */
  const bmScrim=$("#bmScrim");
  function openBmModal(){$("#bmName").value="";$("#bmUrl").value="";bmScrim.classList.add("open");setTimeout(()=>$("#bmName").focus(),50);}
  function bmCard(){return[...grid.children].find(x=>x.dataset.id==="bookmarks");}
  function refreshBm(){const c=bmCard();if(c)wireBookmarks(c);}
  function addBm(){const n=$("#bmName").value.trim(),u=$("#bmUrl").value.trim();if(!u&&!n)return;
    let url=u||n;if(!/^https?:/.test(url))url="https://"+url;
    if(!state.widgets.some(w=>w.id==="bookmarks")){state.widgets.unshift({id:"bookmarks",w:2,h:1,bg:null});renderGrid();}
    state.bookmarks.push({t:"link",url,name:n||url});refreshBm();save();bmScrim.classList.remove("open");toast("Bookmark added");}
  async function importChrome(){
    if(!(hasChrome&&chrome.bookmarks)){toast("Bookmarks permission unavailable");return;}
    const tree=await new Promise(r=>chrome.bookmarks.getTree(r));const list=[];
    (function walk(ns){ns.forEach(n=>{if(n.url&&/^https?:/.test(n.url))list.push({url:n.url,title:n.title||n.url});if(n.children)walk(n.children);});})(tree);
    if(!list.length){toast("No Chrome bookmarks found");return;}
    bmScrim.classList.remove("open");openImportPicker(list);}
  function openImportPicker(list){let modal=$("#importModal");
    if(!modal){modal=document.createElement("div");modal.id="importModal";modal.className="modal-scrim";
      modal.innerHTML='<div class="modal"><h3>Import from Chrome</h3><p>Pick the bookmarks to add.</p><input class="field-input" id="importSearch" placeholder="Search…"><div class="import-list" id="importList"></div><button class="btn-primary" id="importAdd">Add selected</button></div>';
      document.body.appendChild(modal);modal.addEventListener("click",e=>{if(e.target===modal)modal.classList.remove("open");});}
    const listEl=modal.querySelector("#importList"),search=modal.querySelector("#importSearch");
    function render(f){listEl.innerHTML="";list.filter(b=>!f||b.title.toLowerCase().includes(f)||b.url.toLowerCase().includes(f)).slice(0,300).forEach(b=>{
      const row=document.createElement("label");row.className="import-row";
      row.innerHTML='<input type="checkbox" value="'+esc(b.url)+'" data-t="'+esc(b.title)+'">';
      const ic=iconEl({url:b.url,name:b.title});ic.classList.add("import-ic");row.appendChild(ic);
      const tt=document.createElement("span");tt.className="import-title";tt.textContent=b.title;row.appendChild(tt);
      listEl.appendChild(row);});}
    render("");search.value="";search.oninput=()=>render(search.value.trim().toLowerCase());
    modal.querySelector("#importAdd").onclick=()=>{const picks=[...listEl.querySelectorAll("input:checked")];
      if(!picks.length){modal.classList.remove("open");return;}
      if(!state.widgets.some(w=>w.id==="bookmarks")){state.widgets.unshift({id:"bookmarks",w:2,h:1,bg:null});renderGrid();}
      picks.forEach(cb=>{if(!state.bookmarks.some(b=>b.url===cb.value))state.bookmarks.push({t:"link",url:cb.value,name:cb.dataset.t||cb.value});});
      refreshBm();save();modal.classList.remove("open");toast("Imported "+picks.length+" bookmark"+(picks.length>1?"s":""));};
    modal.classList.add("open");setTimeout(()=>search.focus(),50);}

  /* ─────────── FOLDER POPOVER ─────────── */
  const folderScrim=$("#folderScrim");let folderIdx=-1;
  function openFolder(i){folderIdx=i;const f=state.bookmarks[i];$("#folderName").value=f.name;renderFolder();folderScrim.classList.add("open");}
  function renderFolder(){const f=state.bookmarks[folderIdx];if(!f)return;const g=$("#folderGrid");g.innerHTML="";
    (f.children||[]).forEach((c,ci)=>{const el=document.createElement("div");el.className="bm";el.appendChild(iconEl(c));
      const lb=document.createElement("div");lb.className="bm-lb";lb.textContent=c.name;el.appendChild(lb);
      const out=document.createElement("button");out.className="bm-out";out.textContent="↗";out.title="Move out";el.appendChild(out);
      el.addEventListener("click",e=>{if(e.target===out)return;(e.ctrlKey||e.metaKey)?openUrl(c.url,true):openUrl(c.url);});
      el.addEventListener("auxclick",e=>{if(e.button===1){e.preventDefault();openUrl(c.url,true);}});
      out.onclick=e=>{e.stopPropagation();f.children.splice(ci,1);state.bookmarks.push({t:"link",url:c.url,name:c.name,iconData:c.iconData});
        if(!f.children.length){state.bookmarks.splice(folderIdx,1);folderScrim.classList.remove("open");}else renderFolder();refreshBm();save();};
      g.appendChild(el);});
    if(!(f.children||[]).length){const e=document.createElement("div");e.className="folder-empty";e.textContent="Empty folder";g.appendChild(e);}}

  /* ─────────── REMINDERS ─────────── */
  const remScrim=$("#remScrim");let remDate=null,ridN=1;
  function refreshRemList(){const list=$("#remList"),items=state.reminders.filter(r=>r.date===remDate);
    if(!items.length){list.style.display="none";list.innerHTML="";return;}
    list.style.display="";list.innerHTML=items.map(r=>'<div class="rem-row"><span class="rl">'+esc(r.label)+'</span><button class="item-del" data-rid="'+r.id+'">×</button></div>').join("");
    list.querySelectorAll(".item-del").forEach(b=>b.onclick=()=>{state.reminders=state.reminders.filter(r=>r.id!==b.dataset.rid);refreshRemList();renderGrid();save();});}
  function openRem(y,m,d){remDate=key(y,m,d);$("#remTitle").textContent=new Date(y,m,d).toLocaleDateString(undefined,{weekday:"long",month:"long",day:"numeric"});$("#remInput").value="";refreshRemList();remScrim.classList.add("open");setTimeout(()=>$("#remInput").focus(),50);}
  function saveRem(){const v=$("#remInput").value.trim();if(!v||!remDate)return;state.reminders.push({id:"r"+Date.now()+(ridN++),date:remDate,label:v});$("#remInput").value="";refreshRemList();renderGrid();save();$("#remInput").focus();}

  /* ─────────── COMMAND PALETTE ─────────── */
  const scrim=$("#paletteScrim"),input=$("#paletteInput"),listEl=$("#paletteList");
  const actIc='<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3"/></svg>';
  function buildCommands(){const cmds=[];
    state.bookmarks.forEach(b=>{if(b.t==="link")cmds.push({g:"Jump to",label:b.name,url:b.url,icon:b.iconData,run:()=>openUrl(b.url)});});
    const ensure=id=>{if(!state.widgets.some(w=>w.id===id)){const d=WSPEC[id].dflt;state.widgets.push({id,w:d.w,h:d.h,bg:null});renderGrid();save();}openPanel();};
    [["Add a task",()=>{ensure("tasks");setTimeout(()=>{const a=$("#taskAdd");if(a)a.focus();},250);}],
     ["Add a bookmark",openBmModal],["Import from Chrome",importChrome],["Add a widget",openWg],
     ["Open calendar",()=>ensure("calendar")],["Open notes",()=>ensure("notes")],
     ["Toggle dark mode",()=>{state.themeMode=(root.getAttribute("data-theme")==="dark")?"light":"dark";applyTheme();save();}],
     ["Customize",openSheet]].forEach(([label,run])=>cmds.push({g:"Actions",label,run}));
    return cmds;}
  let commands=[],filtered=[],sel=0;
  function searchUrl(q){return "https://www.google.com/search?q="+encodeURIComponent(q);}
  function renderList(){const q=input.value.trim().toLowerCase();
    filtered=commands.filter(c=>!q||c.label.toLowerCase().includes(q));listEl.innerHTML="";
    if(!filtered.length){listEl.innerHTML='<div class="p-empty">Press ↵ to search the web for “'+esc(input.value)+'”.</div>';return;}
    let g=null;filtered.forEach((c,i)=>{if(c.g!==g){g=c.g;const h=document.createElement("div");h.className="p-group";h.textContent=g;listEl.appendChild(h);}
      const el=document.createElement("div");el.className="p-item"+(i===sel?" sel":"");
      if(c.url){const ic=document.createElement("div");ic.className="p-ic brand";ic.appendChild(iconEl({url:c.url,name:c.label,iconData:c.icon}));el.appendChild(ic);}
      else{const ic=document.createElement("div");ic.className="p-ic";ic.innerHTML=actIc;el.appendChild(ic);}
      const lb=document.createElement("div");lb.className="p-lb";lb.textContent=c.label;el.appendChild(lb);
      el.onmousemove=()=>{if(sel!==i){sel=i;paint();}};el.onclick=()=>run(i);listEl.appendChild(el);});}
  function paint(){$$(".p-item").forEach((el,i)=>el.classList.toggle("sel",i===sel));const c=$$(".p-item")[sel];if(c)c.scrollIntoView({block:"nearest"});}
  function run(i){const c=filtered[i];if(!c){const q=input.value.trim();if(q){closePalette();openUrl(searchUrl(q));}return;}closePalette();setTimeout(()=>c.run&&c.run(),100);}
  function openPalette(){commands=buildCommands();scrim.classList.add("open");input.value="";sel=0;renderList();setTimeout(()=>input.focus(),40);}
  function closePalette(){scrim.classList.remove("open");}

  /* ─────────── INIT / WIRING ─────────── */
  function wireStatic(){
    $("#themeBtn").onclick=()=>{state.themeMode=state.themeMode==="auto"?"light":state.themeMode==="light"?"dark":"auto";applyTheme();save();};
    $$("#appearanceChoices button").forEach(b=>b.onclick=()=>{state.themeMode=b.dataset.theme;applyTheme();save();});
    $$("#swatches .sw").forEach(sw=>sw.onclick=()=>{state.accent=sw.dataset.accent;applyAccent();save();});
    $("#accentCustom").oninput=e=>{state.accent=e.target.value;applyAccent();};$("#accentCustom").onchange=save;
    $$("#bgChoices button").forEach(b=>b.onclick=()=>{state.bgMode=b.dataset.bg;applyBg();save();});
    $$("#borderChoices button").forEach(b=>b.onclick=()=>{state.border=b.dataset.border;applyBorder();save();});
    const nm=$("#nameInput");nm.oninput=()=>{state.name=nm.value.trim();tick();};nm.onchange=save;
    $("#settingsBtn").onclick=()=>{nm.value=state.name;openSheet();};$("#sheetX").onclick=closeSheet;sheetScrim.onclick=closeSheet;
    $("#widgetsOpen").onclick=openPanel;$("#widgetsClose").onclick=closePanel;
    $("#addWidgetBtn").onclick=openWg;wgScrim.onclick=e=>{if(e.target===wgScrim)wgScrim.classList.remove("open");};
    $("#commandOpen").onclick=openPalette;scrim.onclick=e=>{if(e.target===scrim)closePalette();};
    input.oninput=()=>{sel=0;renderList();};
    input.onkeydown=e=>{if(e.key==="ArrowDown"){e.preventDefault();sel=Math.min(sel+1,filtered.length-1);paint();}else if(e.key==="ArrowUp"){e.preventDefault();sel=Math.max(sel-1,0);paint();}else if(e.key==="Enter"){e.preventDefault();run(sel);}else if(e.key==="Escape")closePalette();};
    $("#bmSave").onclick=addBm;$("#bmUrl").onkeydown=e=>{if(e.key==="Enter")addBm();};$("#bmImport").onclick=importChrome;
    bmScrim.onclick=e=>{if(e.target===bmScrim)bmScrim.classList.remove("open");};
    folderScrim.onclick=e=>{if(e.target===folderScrim)folderScrim.classList.remove("open");};
    $("#folderName").oninput=function(){const f=state.bookmarks[folderIdx];if(f)f.name=this.value;};$("#folderName").onchange=()=>{refreshBm();save();};
    $("#folderUngroup").onclick=()=>{const f=state.bookmarks[folderIdx];if(!f)return;(f.children||[]).forEach(c=>state.bookmarks.push({t:"link",url:c.url,name:c.name,iconData:c.iconData}));state.bookmarks.splice(folderIdx,1);folderScrim.classList.remove("open");refreshBm();save();};
    $("#folderDelete").onclick=()=>{if(folderIdx<0)return;state.bookmarks.splice(folderIdx,1);folderScrim.classList.remove("open");refreshBm();save();};
    $("#remSave").onclick=saveRem;$("#remInput").onkeydown=e=>{if(e.key==="Enter")saveRem();};remScrim.onclick=e=>{if(e.target===remScrim)remScrim.classList.remove("open");};
    document.addEventListener("keydown",e=>{const typing=/^(INPUT|TEXTAREA)$/.test(document.activeElement.tagName)||document.activeElement.isContentEditable;
      if((e.key==="/"||((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==="k"))&&!typing&&!scrim.classList.contains("open")){e.preventDefault();openPalette();}
      else if(e.key==="Escape"){closePalette();closeSheet();wgScrim.classList.remove("open");bmScrim.classList.remove("open");folderScrim.classList.remove("open");remScrim.classList.remove("open");const im=$("#importModal");if(im)im.classList.remove("open");}});
    window.addEventListener("resize",()=>{computeCols();renderGrid();});
  }

  load(()=>{
    computeCols();applyAll();wireStatic();
    tick();setInterval(tick,15000);
    renderGrid();
  });
})();
