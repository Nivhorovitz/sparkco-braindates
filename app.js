
const APP_VERSION = 'v4.2-supabase-storage';
const SUPABASE_URL = 'https://cmtbwohbktirmplieeeq.supabase.co';
const SUPABASE_KEY = 'sb_publishable_tk18F8g4AS7oQF9eV9qGQw_nONj_xiX';
const supabaseClient = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY) : null;

const defaults = {
  offers:['מיתוג','בידול','AI','בניית קהילה','שיווק','מכירות','תמחור','ניהול מוצר','כתיבה','עיצוב','הנחיית קבוצות','גיוס כספים','חינוך','ליווי אישי'],
  needs:['פידבק על רעיון','דיוק הצעת ערך','שימוש ב-AI','תמחור','חיבור לשותפים','שיווק אורגני','בניית קהילה בתשלום','תמיכה טכנולוגית','מנטורינג קצר','השראה','לקוחות ראשונים'],
  availability:['בוקר','צהריים','אחר הצהריים','ערב','ראשון','שני','שלישי','רביעי','חמישי'],
  meetingStyles:['שיחת היכרות קצרה','פידבק ממוקד','חשיבה משותפת','מנטורינג קצר','שיחת עומק','קבוצה קטנה'],
  openness:['פתוח/ה לפניות','רק התאמות מדויקות','פנוי/ה לשיחה אחת השבוע','מעדיף/ה קבוצה קטנה','כרגע רק מתבונן/ת']
};

function getOrCreateUserKey(){
  let key = localStorage.getItem('sparkcoBraindatesUserKey');
  if(!key){
    key = crypto.randomUUID ? crypto.randomUUID() : 'user-' + Math.random().toString(36).slice(2) + Date.now();
    localStorage.setItem('sparkcoBraindatesUserKey', key);
  }
  return key;
}

let state = JSON.parse(localStorage.getItem('sparkcoBraindatesV4') || 'null') || {
  communityName:'קהילת Sparkco',
  communityId:null,
  taxonomy: defaults,
  userKey:getOrCreateUserKey(),
  myProfileId:null,
  me:{name:'',title:'',bio:'',photo:'',offers:[],needs:[],availability:[],meetingStyles:[],openness:[],currentFocus:'',braindateOffer:'',lookingToMeet:'',link:'',location:'',email:'',phone:'',contactVisibility:'private'},
  people:[],
  savedConnections:[],
  invites:[],
  activeReport:'overview',
  online:false
};
state.userKey = state.userKey || getOrCreateUserKey();

let selectedInvitePerson = null;
const $ = id => document.getElementById(id);
function compactStateForLocalStorage(){
  return {
    communityName: state.communityName,
    communityId: state.communityId,
    taxonomy: state.taxonomy,
    userKey: state.userKey,
    myProfileId: state.myProfileId,
    me: {...state.me, photo: ''},
    people: [],
    savedConnections: [],
    invites: [],
    activeReport: state.activeReport,
    online: state.online
  };
}
function saveLocal(){
  try{
    localStorage.setItem('sparkcoBraindatesV4', JSON.stringify(compactStateForLocalStorage()));
  }catch(err){
    console.warn('Local storage is full. Keeping only user key.', err);
    try{
      localStorage.setItem('sparkcoBraindatesUserKey', state.userKey || getOrCreateUserKey());
      localStorage.removeItem('sparkcoBraindatesV4');
    }catch(e){}
  }
}
function unique(arr){ return [...new Set((arr || []).filter(Boolean))]; }
function initials(name){ return (name || '?').split(' ').filter(Boolean).slice(0,2).map(x=>x[0]).join('') || '?'; }
function toggle(arr,val){ const i=arr.indexOf(val); i>=0 ? arr.splice(i,1) : arr.push(val); }
function profileAsPerson(){ return {...state.me, id:state.myProfileId || 'me', user_key:state.userKey}; }
function setStatus(text, mode=''){ const el=$('connectionStatus'); if(!el) return; el.textContent=text; el.className='connection-pill' + (mode ? ' ' + mode : ''); }

function dbProfileToUi(p){
  return {
    name:p.name || '', title:p.title || '', bio:p.bio || '', photo:p.photo_url || '',
    offers:p.offers || [], needs:p.needs || [], availability:p.availability || [],
    meetingStyles:p.meeting_styles || [], openness:p.openness || [],
    currentFocus:p.current_focus || '', braindateOffer:p.braindate_offer || '',
    lookingToMeet:p.looking_to_meet || '', link:p.personal_link || '', location:p.location || '',
    email:p.email || '', phone:p.phone || '', contactVisibility:p.contact_visibility || 'private'
  };
}
function dbProfileToPerson(p){ return {...dbProfileToUi(p), id:p.id, user_key:p.user_key, created_at:p.created_at, updated_at:p.updated_at}; }
function uiProfileToDb(){
  return {
    community_id: state.communityId, user_key: state.userKey,
    name: state.me.name || null, title: state.me.title || null, bio: state.me.bio || null, photo_url: state.me.photo || null,
    offers: state.me.offers || [], needs: state.me.needs || [], meeting_styles: state.me.meetingStyles || [],
    openness: state.me.openness || [], availability: state.me.availability || [],
    current_focus: state.me.currentFocus || null, braindate_offer: state.me.braindateOffer || null,
    looking_to_meet: state.me.lookingToMeet || null, personal_link: state.me.link || null,
    location: state.me.location || null, email: state.me.email || null, phone: state.me.phone || null,
    contact_visibility: state.me.contactVisibility || 'private'
  };
}

async function dbLoad(){
  if(!supabaseClient){ setStatus('Supabase לא נטען', 'error'); return; }
  setStatus('מתחבר...', '');
  try{
    let { data: communities, error: commErr } = await supabaseClient.from('communities').select('*').eq('name','Sparkco Braindates').order('created_at', { ascending:true }).limit(1);
    if(commErr) throw commErr;
    if(!communities || !communities.length){
      const res = await supabaseClient.from('communities').insert({name:'Sparkco Braindates', description:'Default community for Braindates'}).select().single();
      if(res.error) throw res.error;
      communities = [res.data];
    }
    state.communityId = communities[0].id;
    state.communityName = communities[0].name || state.communityName;

    const { data: taxonomy } = await supabaseClient.from('community_taxonomy').select('*').eq('community_id', state.communityId).limit(1);
    if(taxonomy && taxonomy.length){
      state.taxonomy = {
        offers: taxonomy[0].offers || defaults.offers,
        needs: taxonomy[0].needs || defaults.needs,
        meetingStyles: taxonomy[0].meeting_styles || defaults.meetingStyles,
        openness: taxonomy[0].openness || defaults.openness,
        availability: taxonomy[0].availability || defaults.availability
      };
    }

    const { data: myRows, error: myErr } = await supabaseClient.from('profiles').select('*').eq('community_id', state.communityId).eq('user_key', state.userKey).limit(1);
    if(myErr) throw myErr;
    if(myRows && myRows.length){
      state.myProfileId = myRows[0].id;
      state.me = dbProfileToUi(myRows[0]);
    }
    await refreshFromDb();
    state.online = true;
    setStatus('מחובר ל-Supabase', 'ok');
    saveLocal();
    render();
  }catch(err){
    console.error(err);
    state.online=false;
    setStatus('שגיאת חיבור', 'error');
    render();
  }
}

async function refreshFromDb(){
  if(!supabaseClient || !state.communityId) return;
  const { data: profiles, error: pErr } = await supabaseClient.from('profiles').select('*').eq('community_id', state.communityId).order('updated_at', {ascending:false});
  if(pErr) throw pErr;
  state.people = (profiles || []).filter(p=>p.user_key !== state.userKey).map(dbProfileToPerson);

  const { data: saved } = await supabaseClient.from('saved_connections').select('*, saved_profile:profiles(*)').eq('community_id', state.communityId).eq('user_key', state.userKey).order('updated_at', {ascending:false});
  state.savedConnections = saved || [];

  const { data: invites } = await supabaseClient.from('invites').select('*, receiver_profile:profiles(*)').eq('community_id', state.communityId).eq('sender_key', state.userKey).order('updated_at', {ascending:false});
  state.invites = invites || [];
}

async function saveProfileToDb(){
  saveLocal();
  if(!supabaseClient || !state.communityId){ alert('נשמר מקומית בלבד. Supabase עדיין לא מחובר.'); return; }
  setStatus('שומר...', '');
  try{
    const { data, error } = await supabaseClient.from('profiles').upsert(uiProfileToDb(), { onConflict:'community_id,user_key' }).select().single();
    if(error) throw error;
    state.myProfileId = data.id;
    await refreshFromDb();
    setStatus('נשמר בענן', 'ok');
    saveLocal();
    render();
  }catch(err){
    console.error(err);
    setStatus('שגיאה בשמירה', 'error');
    alert('לא הצלחתי לשמור ל-Supabase. כנראה בעיית הרשאות או מפתח.');
  }
}

function chip(label, selected, onClick){ const b=document.createElement('button'); b.type='button'; b.className='chip'+(selected?' selected':''); b.textContent=label; b.onclick=onClick; return b; }
function renderChipSet(el,taxonomyKey,userKey){ const target=$(el); if(!target) return; target.innerHTML=''; state.taxonomy[taxonomyKey].forEach(t=>target.appendChild(chip(t,(state.me[userKey]||[]).includes(t),()=>{ if(!state.me[userKey]) state.me[userKey]=[]; toggle(state.me[userKey],t); render(); }))); }
function renderChips(){ renderChipSet('offersChips','offers','offers'); renderChipSet('needsChips','needs','needs'); renderChipSet('availabilityChips','availability','availability'); renderChipSet('meetingStyleChips','meetingStyles','meetingStyles'); renderChipSet('opennessChips','openness','openness'); }
function syncForm(){
  ['name','title','bio','currentFocus','braindateOffer','lookingToMeet','link','location','email','phone'].forEach(k=>{ if($(k)) $(k).value=state.me[k]||''; });
  if($('communityName')) $('communityName').value=state.communityName;
  if($('adminOffers')) $('adminOffers').value=state.taxonomy.offers.join(', ');
  if($('adminNeeds')) $('adminNeeds').value=state.taxonomy.needs.join(', ');
}
function profileCompletion(){ const fields=[!!state.me.name,!!state.me.title,!!state.me.bio,!!state.me.photo,state.me.offers.length>0,state.me.needs.length>0,!!state.me.currentFocus,!!state.me.braindateOffer,!!state.me.lookingToMeet,state.me.availability.length>0,state.me.meetingStyles.length>0,state.me.openness.length>0]; return Math.round(fields.filter(Boolean).length/fields.length*100); }
function setPhoto(el, photo, fallback){ const node=$(el); if(!node) return; if(photo){ node.style.backgroundImage=`url(${photo})`; node.textContent=''; } else { node.style.backgroundImage=''; node.textContent=fallback; } }
function updatePreview(){
  if($('previewName')) $('previewName').textContent=state.me.name||'השם שלך';
  if($('previewTitle')) $('previewTitle').textContent=state.me.title||'התפקיד שלך';
  if($('previewBio')) $('previewBio').textContent=state.me.bio||'המשפט האישי שלך יופיע כאן.';
  if($('completionScore')) $('completionScore').textContent=profileCompletion()+'%';
  const fallback=initials(state.me.name);
  setPhoto('photoPreview',state.me.photo,fallback);
  setPhoto('publicPhoto',state.me.photo,fallback);
  const tags=unique([...state.me.offers,...state.me.needs,...state.me.meetingStyles]).slice(0,8);
  if($('previewTags')) $('previewTags').innerHTML=tags.map(t=>`<span class="tag">${t}</span>`).join('');
}

function calcMatches(){
  const me=state.me;
  return state.people.map(p=>{
    const offerNeed=(p.offers||[]).filter(x=>me.needs.includes(x));
    const needOffer=me.offers.filter(x=>(p.needs||[]).includes(x));
    const shared=unique([...(p.offers||[]),...(p.needs||[])].filter(x=>[...me.offers,...me.needs].includes(x)));
    const style=(p.meetingStyles||[]).filter(x=>me.meetingStyles.includes(x));
    const avail=(p.availability||[]).filter(x=>me.availability.includes(x));
    const opennessBonus=(me.openness.includes('פתוח/ה לפניות')||(p.openness||[]).includes('פתוח/ה לפניות'))?6:0;
    let score=Math.min(98,28+offerNeed.length*18+needOffer.length*16+shared.length*5+style.length*5+avail.length*4+opennessBonus);
    if(!me.name&&!me.bio) score=Math.max(45,score-18);
    const reasons=[];
    if(offerNeed.length) reasons.push(`${p.name} מביא/ה ${offerNeed.slice(0,3).join(', ')} — בדיוק משהו שסימנת שאת/ה מחפש/ת.`);
    if(needOffer.length) reasons.push(`יש לך יכולת לעזור ל-${p.name} ב-${needOffer.slice(0,3).join(', ')}.`);
    if(shared.length) reasons.push(`יש לכם שפה משותפת סביב ${shared.slice(0,3).join(', ')}.`);
    if(style.length) reasons.push(`שניכם פתוחים לסוג מפגש דומה: ${style.slice(0,2).join(', ')}.`);
    if(avail.length) reasons.push(`יש חפיפה בזמינות: ${avail.slice(0,3).join(', ')}.`);
    const matchType=offerNeed.length&&needOffer.length?'התאמה הדדית':offerNeed.length?'אפשר ללמוד ממנו/ה':needOffer.length?'אפשר לעזור לו/ה':'שיחה קהילתית מעניינת';
    return {...p,score,matchType,reasons:reasons.length?reasons:['יש כאן פוטנציאל לשיחת היכרות קהילתית קצרה.']};
  }).sort((a,b)=>b.score-a.score);
}

async function saveConnection(p){
  if(!state.communityId || !p.id){ alert('צריך לשמור פרופילים בענן לפני שאפשר לשמור חיבור.'); return; }
  const reason=(p.reasons||[]).join('\\n');
  const payload={community_id:state.communityId,user_key:state.userKey,saved_profile_id:p.id,match_score:p.score||null,match_reason:reason,status:'saved'};
  const { error } = await supabaseClient.from('saved_connections').upsert(payload, { onConflict:'user_key,saved_profile_id' });
  if(error){ console.error(error); alert('לא הצלחתי לשמור את החיבור.'); return; }
  await refreshFromDb(); render(); document.querySelector('[data-view="saved"]').click();
}

function renderMatches(){
  const list=$('matchList'); if(!list) return; list.innerHTML='';
  const matches=calcMatches();
  if(!matches.length){ list.innerHTML='<div class="empty">עדיין אין מספיק פרופילים בקהילה. מלא/י פרופיל ולחץ/י שמירה כדי להוסיף אותו למאגר.</div>'; return; }
  matches.forEach(p=>{
    const c=document.createElement('div'); c.className='card match-card';
    const photoStyle=p.photo?`style="background-image:url(${p.photo})"`:'';
    c.innerHTML=`<div class="score">${p.score}%</div><div><div class="person-top"><div class="mini-avatar" ${photoStyle}>${p.photo?'':initials(p.name)}</div><div><p class="eyebrow">${p.matchType}</p><h3>${p.name}</h3><p class="meta">${p.title||''}</p></div></div><p class="meta">${p.bio||''}</p><div class="tags">${unique([...(p.offers||[]),...(p.needs||[]),...(p.meetingStyles||[])]).slice(0,7).map(t=>`<span class="tag">${t}</span>`).join('')}</div><div class="match-explain"><strong>למה כדאי להיפגש?</strong><br>${p.reasons.join('<br>')}</div></div><div class="stack"><button class="primary invite-btn">הזמן/י לפגישה</button><button class="ghost save-btn">שמור לאחר כך</button></div>`;
    c.querySelector('.invite-btn').onclick=()=>openInvite(p);
    c.querySelector('.save-btn').onclick=()=>saveConnection(p);
    list.appendChild(c);
  });
}

function renderSaved(){
  const box=$('savedList'); if(!box) return; box.innerHTML='';
  if(!state.savedConnections.length){ box.innerHTML='<div class="empty">עדיין אין חיבורים שמורים. במסך ההתאמות אפשר ללחוץ “שמור לאחר כך”.</div>'; return; }
  state.savedConnections.forEach(item=>{
    const p=item.saved_profile?dbProfileToPerson(item.saved_profile):{};
    const card=document.createElement('div'); card.className='card';
    card.innerHTML=`<p class="eyebrow">Saved Connection · ${item.status||'saved'}</p><h3>${p.name||'ללא שם'}</h3><p class="meta">${p.title||''}<br>${p.bio||''}</p><div class="match-explain">${item.match_reason||'נשמר להמשך.'}</div><div class="note-box"><label>הערה אישית אחרי פגישה או לפני המשך<textarea data-note="${item.id}" placeholder="לדוגמה: דיברנו על תמחור. כדאי לחזור אליה אחרי שאנסח הצעה.">${item.private_note||''}</textarea></label><div class="small-actions"><button class="secondary" data-save-note="${item.id}">שמור הערה</button><button class="ghost" data-status="${item.id}" data-value="met">סמן שנפגשנו</button><button class="ghost" data-status="${item.id}" data-value="follow_up">צריך המשך</button><button class="ghost" data-status="${item.id}" data-value="archived">ארכוב</button></div></div>`;
    box.appendChild(card);
  });
  box.querySelectorAll('[data-save-note]').forEach(btn=>btn.onclick=async()=>{
    const id=btn.dataset.saveNote;
    const note=box.querySelector(`[data-note="${id}"]`).value;
    const {error}=await supabaseClient.from('saved_connections').update({private_note:note}).eq('id',id);
    if(error) alert('שמירת הערה נכשלה');
    await refreshFromDb(); render();
  });
  box.querySelectorAll('[data-status]').forEach(btn=>btn.onclick=async()=>{
    const {error}=await supabaseClient.from('saved_connections').update({status:btn.dataset.value}).eq('id',btn.dataset.status);
    if(error) alert('עדכון סטטוס נכשל');
    await refreshFromDb(); render();
  });
}

function renderPeople(){
  const grid=$('peopleGrid'); if(!grid) return; grid.innerHTML='';
  const people=[profileAsPerson(),...state.people].filter(p=>p.name||p.bio||(p.offers||[]).length||(p.needs||[]).length);
  if(!people.length){ grid.innerHTML='<div class="empty">מפת האנשים תתמלא אחרי שחברי הקהילה ימלאו פרופיל.</div>'; return; }
  people.forEach(p=>{
    const c=document.createElement('div'); c.className='card person-card';
    const photoStyle=p.photo?`style="background-image:url(${p.photo})"`:'';
    c.innerHTML=`<div class="person-top"><div class="mini-avatar" ${photoStyle}>${p.photo?'':initials(p.name)}</div><div><h3>${p.name||'ללא שם'}</h3><p class="meta">${p.title||''}</p></div></div><p class="meta">${p.bio||''}</p>${p.currentFocus?`<div class="match-explain"><strong>מעניין אותי עכשיו:</strong><br>${p.currentFocus}</div>`:''}${p.braindateOffer?`<p class="meta"><strong>מציע/ה Braindate:</strong> ${p.braindateOffer}</p>`:''}<div class="tags">${(p.offers||[]).slice(0,5).map(t=>`<span class="tag">נותן/ת: ${t}</span>`).join('')}${(p.needs||[]).slice(0,5).map(t=>`<span class="tag">מבקש/ת: ${t}</span>`).join('')}</div>`;
    grid.appendChild(c);
  });
}
function allProfiles(){ return [profileAsPerson(),...state.people].filter(p=>p.name||p.bio||(p.offers||[]).length||(p.needs||[]).length); }
function countBy(key){ return allProfiles().flatMap(p=>p[key]||[]).reduce((a,t)=>(a[t]=(a[t]||0)+1,a),{}); }
function sortedCounts(obj){ return Object.entries(obj).sort((a,b)=>b[1]-a[1]); }
function renderRooms(){
  const grid=$('roomsGrid'); if(!grid) return;
  const needs=sortedCounts(countBy('needs')); const offers=countBy('offers');
  const rooms=needs.slice(0,6).map(([need,count])=>({title:`חדר Braindate: ${need}`,count,reason:offers[need]?`יש ${count} מבקשים/ות ו-${offers[need]} שיכולים/ות לעזור.`:`יש ביקוש, אבל לא זוהו עדיין מספיק אנשים שמציעים את זה.`}));
  if(!rooms.length){ grid.innerHTML='<div class="empty">כשהקהילה תמלא פרופילים, נציע כאן חדרים לפתיחה בספארקו.</div>'; return; }
  grid.innerHTML=rooms.map(r=>`<div class="card room-card"><p class="eyebrow">Suggested Sparkco Room</p><h3>${r.title}</h3><div class="room-count">${r.count}</div><p class="meta">${r.reason}</p><button class="ghost">פתחו חדר כזה השבוע</button></div>`).join('');
}
function renderInvites(){
  const box=$('invitesList'); if(!box) return; box.innerHTML='';
  if(!state.invites.length){ box.innerHTML='<div class="empty">עדיין לא נשלחו הזמנות. מתוך מסך ההתאמות אפשר לשלוח הזמנה עם מועדים מוצעים.</div>'; return; }
  state.invites.forEach(inv=>{
    const p=inv.receiver_profile?dbProfileToPerson(inv.receiver_profile):{};
    const c=document.createElement('div'); c.className='card invite-card';
    const status=inv.status||'pending'; const statusLabel=status==='accepted'?'אושרה':status==='declined'?'נדחתה':'ממתינה';
    c.innerHTML=`<p class="eyebrow">Braindate Invite</p><h3>${p.name||'הזמנה'}</h3><span class="status ${status}">${statusLabel}</span><p class="meta">${inv.message||''}</p><div class="tags">${(inv.proposed_times||[]).map(t=>`<span class="tag">${t}</span>`).join('')}</div>`;
    box.appendChild(c);
  });
}
function kpis(){ const profiles=allProfiles(); return [['פרופילים',profiles.length],['פתוחים לפניות',profiles.filter(p=>(p.openness||[]).includes('פתוח/ה לפניות')).length],['הזמנות',state.invites.length],['נשמרו לי',state.savedConnections.length]]; }
function reportRows(title,entries,max){ if(!entries.length) return `<div class="empty">אין עדיין מספיק נתונים עבור ${title}</div>`; return `<div class="report-list">${entries.map(([k,v])=>`<div class="report-row"><div><strong>${k}</strong><div class="bar"><span style="width:${Math.max(7,Math.round(v/max*100))}%"></span></div></div><strong>${v}</strong></div>`).join('')}</div>`; }
function renderAdmin(){
  if(!$('kpiGrid')) return;
  $('kpiGrid').innerHTML=kpis().map(([label,value])=>`<div class="kpi"><strong>${value}</strong><span>${label}</span></div>`).join('');
  const needs=sortedCounts(countBy('needs')); const offers=sortedCounts(countBy('offers'));
  const needMap=countBy('needs'); const offerMap=countBy('offers');
  const gaps=Object.entries(needMap).map(([k,v])=>[k,v-(offerMap[k]||0)]).filter(([,v])=>v>0).sort((a,b)=>b[1]-a[1]);
  const people=allProfiles().map(p=>[p.name||'ללא שם',(p.offers||[]).length*2+(p.needs||[]).length+(p.braindateOffer?3:0)]).sort((a,b)=>b[1]-a[1]).slice(0,8);
  let html='';
  if(state.activeReport==='overview') html=`<div class="insight"><strong>מה הקהילה צריכה עכשיו:</strong><br>${needs.slice(0,5).map(([k,v])=>`${k} (${v})`).join(' · ')||'אין עדיין נתונים'}</div><div class="insight"><strong>מה הקהילה יודעת לתת:</strong><br>${offers.slice(0,5).map(([k,v])=>`${k} (${v})`).join(' · ')||'אין עדיין נתונים'}</div><div class="insight"><strong>המלצה:</strong><br>כשיש 4+ אנשים סביב אותו צורך, כדאי לפתוח חדר Braindate קבוצתי בספארקו.</div>`;
  if(state.activeReport==='needs') html=reportRows('צרכים',needs.slice(0,12),needs[0]?.[1]||1);
  if(state.activeReport==='offers') html=reportRows('יכולות',offers.slice(0,12),offers[0]?.[1]||1);
  if(state.activeReport==='gaps') html=reportRows('פערים',gaps.slice(0,12),gaps[0]?.[1]||1);
  if(state.activeReport==='people') html=reportRows('אנשים מרכזיים',people,people[0]?.[1]||1);
  $('adminReport').innerHTML=html;
}

function render(){ syncForm(); renderChips(); updatePreview(); renderMatches(); renderSaved(); renderPeople(); renderRooms(); renderInvites(); renderAdmin(); saveLocal(); }
function closeInvite(){ const dlg=$('inviteDialog'); if(dlg&&dlg.open) dlg.close(); }
function openInvite(p){
  selectedInvitePerson=p;
  $('inviteTitle').textContent=`הזמנה ל-${p.name}`;
  $('inviteReason').innerHTML=`<strong>${p.score}% התאמה · ${p.matchType}</strong><br>${p.reasons.join('<br>')}`;
  $('inviteMessage').value=`היי ${p.name},\nראיתי שהמערכת הציעה בינינו חיבור רלוונטי.\n${p.reasons[0]}\nאשמח לשיחת Braindate קצרה של 25 דקות.`;
  $('inviteTimes').value='ראשון 10:00\nשלישי 17:30\nחמישי 20:00';
  const dlg=$('inviteDialog'); dlg.showModal?dlg.showModal():dlg.setAttribute('open','open');
}
function suggestBioText(){
  const existing=(state.me.bio||'').trim();
  if(existing&&existing.length<=120) return existing;
  if(existing) return existing.slice(0,117).trim()+'...';
  const offer=state.me.offers.slice(0,2).join(' ו'); const need=state.me.needs.slice(0,2).join(' ו');
  return `מביא/ה ${offer||'ידע וניסיון'}, ומחפש/ת חיבורים סביב ${need||'למידה ושיתופי פעולה'}.`;
}
function addCustomTag(inputId,taxonomyKey,userKey){
  const value=$(inputId).value.trim(); if(!value) return;
  if(!state.taxonomy[taxonomyKey].includes(value)) state.taxonomy[taxonomyKey].push(value);
  if(!state.me[userKey].includes(value)) state.me[userKey].push(value);
  $(inputId).value=''; render();
}


function dataUrlToBlob(dataUrl){
  const parts = dataUrl.split(',');
  const mime = parts[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
  const binary = atob(parts[1]);
  const bytes = new Uint8Array(binary.length);
  for(let i=0;i<binary.length;i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], {type:mime});
}

function compressImageFile(file){
  return new Promise((resolve, reject)=>{
    const img = new Image();
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = ()=>{
      img.onload = ()=>{
        const max = 720;
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(blob=>resolve(blob), 'image/jpeg', 0.78);
      };
      img.onerror = reject;
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

async function uploadProfilePhoto(file){
  if(!supabaseClient){
    alert('Supabase לא נטען, אי אפשר לשמור תמונה בענן כרגע.');
    return null;
  }
  setStatus('מעלה תמונה...', '');
  const blob = await compressImageFile(file);
  const path = `${state.userKey}/avatar-${Date.now()}.jpg`;
  const { error } = await supabaseClient.storage
    .from('profile-photos')
    .upload(path, blob, { contentType:'image/jpeg', upsert:true });
  if(error){
    console.error(error);
    setStatus('שגיאה בהעלאת תמונה', 'error');
    alert('לא הצלחתי להעלות תמונה. ודא שהרצת את SQL יצירת Storage bucket וההרשאות.');
    return null;
  }
  const { data } = supabaseClient.storage.from('profile-photos').getPublicUrl(path);
  setStatus('תמונה הועלתה', 'ok');
  return data.publicUrl;
}


document.querySelectorAll('.nav-item').forEach(btn=>btn.onclick=()=>{ 
function dataUrlToBlob(dataUrl){
  const parts = dataUrl.split(',');
  const mime = parts[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
  const binary = atob(parts[1]);
  const bytes = new Uint8Array(binary.length);
  for(let i=0;i<binary.length;i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], {type:mime});
}

function compressImageFile(file){
  return new Promise((resolve, reject)=>{
    const img = new Image();
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = ()=>{
      img.onload = ()=>{
        const max = 720;
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(blob=>resolve(blob), 'image/jpeg', 0.78);
      };
      img.onerror = reject;
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

async function uploadProfilePhoto(file){
  if(!supabaseClient){
    alert('Supabase לא נטען, אי אפשר לשמור תמונה בענן כרגע.');
    return null;
  }
  setStatus('מעלה תמונה...', '');
  const blob = await compressImageFile(file);
  const path = `${state.userKey}/avatar-${Date.now()}.jpg`;
  const { error } = await supabaseClient.storage
    .from('profile-photos')
    .upload(path, blob, { contentType:'image/jpeg', upsert:true });
  if(error){
    console.error(error);
    setStatus('שגיאה בהעלאת תמונה', 'error');
    alert('לא הצלחתי להעלות תמונה. ודא שהרצת את SQL יצירת Storage bucket וההרשאות.');
    return null;
  }
  const { data } = supabaseClient.storage.from('profile-photos').getPublicUrl(path);
  setStatus('תמונה הועלתה', 'ok');
  return data.publicUrl;
}


document.querySelectorAll('.nav-item').forEach(b=>b.classList.remove('active')); btn.classList.add('active'); document.querySelectorAll('.view').forEach(v=>v.classList.remove('active')); $(btn.dataset.view+'View').classList.add('active'); $('viewTitle').textContent=btn.textContent; });
document.querySelectorAll('[data-go]').forEach(btn=>btn.onclick=()=>document.querySelector(`[data-view="${btn.dataset.go}"]`).click());
['name','title','bio','currentFocus','braindateOffer','lookingToMeet','link','location','email','phone'].forEach(k=>{ if($(k)) $(k).addEventListener('input',e=>{ state.me[k]=e.target.value; render(); }); });
if($('photoInput')) $('photoInput').addEventListener('change', async e=>{
  const file = e.target.files[0];
  if(!file) return;
  try{
    if($('photoPreview')) $('photoPreview').classList.add('photo-uploading');
    if($('publicPhoto')) $('publicPhoto').classList.add('photo-uploading');
    const publicUrl = await uploadProfilePhoto(file);
    if(publicUrl){
      state.me.photo = publicUrl;
      render();
      await saveProfileToDb();
    }
  }catch(err){
    console.error(err);
    alert('העלאת התמונה נכשלה.');
  }finally{
    if($('photoPreview')) $('photoPreview').classList.remove('photo-uploading');
    if($('publicPhoto')) $('publicPhoto').classList.remove('photo-uploading');
  }
});
if($('addOffer')) $('addOffer').onclick=()=>addCustomTag('customOffer','offers','offers');
if($('addNeed')) $('addNeed').onclick=()=>addCustomTag('customNeed','needs','needs');
if($('suggestBio')) $('suggestBio').onclick=()=>{ $('bioSuggestion').textContent=suggestBioText(); $('bioSuggestionBox').classList.remove('hidden'); };
if($('useSuggestion')) $('useSuggestion').onclick=()=>{ state.me.bio=$('bioSuggestion').textContent; $('bioSuggestionBox').classList.add('hidden'); render(); };
if($('dismissSuggestion')) $('dismissSuggestion').onclick=()=>$('bioSuggestionBox').classList.add('hidden');
if($('copyBio')) $('copyBio').onclick=async()=>{ try{ await navigator.clipboard.writeText(state.me.bio||''); $('copyStatus').textContent='המשפט הועתק. אפשר להדביק בפרופיל Sparkco.'; }catch(e){ $('copyStatus').textContent='אפשר לסמן ולהעתיק ידנית מתוך תיבת הביו.'; } };
if($('seedDemo')) $('seedDemo').onclick=async()=>{ alert('בגרסת Supabase אין צורך בטעינת דמו. מלא/י פרופיל ולחץ/י שמירה.'); };
if($('addDemoPerson')) $('addDemoPerson').onclick=()=>alert('בגרסת Supabase מוסיפים אנשים דרך מילוי פרופילים אמיתי.');
if($('refreshMatches')) $('refreshMatches').onclick=async()=>{ await refreshFromDb(); render(); };
if($('saveAll')) $('saveAll').onclick=saveProfileToDb;

if($('saveBottom')) $('saveBottom').onclick=saveProfileToDb;

if($('exportData')) $('exportData').onclick=()=>{ const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='sparkco-braindates-data.json'; a.click(); URL.revokeObjectURL(a.href); };
if($('saveAdmin')) $('saveAdmin').onclick=async()=>{ state.communityName=$('communityName').value; state.taxonomy.offers=$('adminOffers').value.split(',').map(x=>x.trim()).filter(Boolean); state.taxonomy.needs=$('adminNeeds').value.split(',').map(x=>x.trim()).filter(Boolean); if(supabaseClient && state.communityId){ await supabaseClient.from('community_taxonomy').upsert({community_id:state.communityId,offers:state.taxonomy.offers,needs:state.taxonomy.needs,meeting_styles:state.taxonomy.meetingStyles,openness:state.taxonomy.openness,availability:state.taxonomy.availability},{onConflict:'community_id'}); } render(); };
document.querySelectorAll('.report-tab').forEach(btn=>btn.onclick=()=>{ document.querySelectorAll('.report-tab').forEach(b=>b.classList.remove('active')); btn.classList.add('active'); state.activeReport=btn.dataset.report; render(); });
if($('sendInvite')) $('sendInvite').onclick=async()=>{ if(!selectedInvitePerson) return; const proposed=$('inviteTimes').value.split('\n').map(x=>x.trim()).filter(Boolean); const payload={community_id:state.communityId,sender_key:state.userKey,receiver_profile_id:selectedInvitePerson.id,message:$('inviteMessage').value,proposed_times:proposed,status:'pending'}; const {error}=await supabaseClient.from('invites').insert(payload); if(error){ console.error(error); alert('שליחת הזמנה נכשלה'); return; } closeInvite(); await refreshFromDb(); document.querySelector('[data-view="invites"]').click(); render(); };
if($('cancelInvite')) $('cancelInvite').onclick=closeInvite;
if($('closeInviteX')) $('closeInviteX').onclick=closeInvite;
if($('inviteDialog')) $('inviteDialog').addEventListener('click',e=>{ if(e.target===$('inviteDialog')) closeInvite(); });
render();
dbLoad();
