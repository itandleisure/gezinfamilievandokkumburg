// Weekmenu (afvalschema Frans): ca. 1.850 kcal, min. 130 g eiwit, 6 eetmomenten.
export const TARGET = 1850, LO = 1700, HI = 2000, PROT = 130;
const MAXK = 2300;
const CATNAME = { groente: 'Groente', fruit: 'Fruit', zuivel: 'Zuivel', eiwit: 'Vlees, vis & eieren', granen: 'Brood, granen & aardappelen', overig: 'Overig' };
// [naam, portie, kcal, eiwit, categorie?]
export const SLOTS = [
{id:'o',time:'07:30',name:'Ontbijt',comps:[
 {id:'basis',label:'Basis',cat:'zuivel',opts:[['Magere kwark','250 g',143,24],['Skyr naturel','250 g',158,27],['Griekse yoghurt 0%','250 g',145,25]],def:[0,0,0,0,0,0,0]},
 {id:'crunch',label:'Crunch',cat:'granen',opts:[['Muesli zonder toegevoegde suiker','40 g',150,4],['Havermout','40 g',150,5],['Granola','30 g',140,3]],def:[0,0,1,0,0,1,0]},
 {id:'fruit',label:'Fruit',cat:'fruit',opts:[['Frambozen','100 g',52,1],['Blauwe bessen','100 g',57,1],['Aardbeien','150 g',48,1]],def:[0,1,2,0,1,2,0]},
 {id:'extra',label:'Extra',cat:'fruit',opts:[['Medjool-dadel','1 stuk',66,.4],['Banaan','½ stuk',50,.6],['Walnoten','10 g',65,1.5,'overig'],['Niets extra','',0,0]],def:[0,1,0,1,0,1,2]}]},
{id:'f',time:'10:30',name:'Fruit',comps:[
 {id:'fruit',label:'Fruit',cat:'fruit',opts:[['Appel','1 stuk',80,.4],['Mandarijnen','2 stuks',70,1.2],['Peer','1 stuk',90,.6],['Kaki','1 stuk',110,1],['Sinaasappel','1 stuk',70,1.3],['Druiven','150 g',100,1]],def:[0,1,2,3,4,5,0]}]},
{id:'l',time:'12:30',name:'Lunch',comps:[
 {id:'brood',label:'Brood',cat:'granen',opts:[['Volkorenbrood','3 sneetjes',255,12],['Volkorenbrood + groentesoep','2 sneetjes + kom',250,10],['Volkoren wraps','2 stuks',260,8]],def:[0,0,1,0,0,2,1]},
 {id:'eiwit',label:'Beleg (eiwit)',cat:'eiwit',opts:[['Kalkoenfilet (pavo)','75 g',75,14],['Eieren, gekookt','2 stuks',150,13],['Tonijn in water','1 blikje (80 g)',90,20],['Hüttenkäse','100 g',100,12,'zuivel'],['Kipfilet, gegrild','80 g',95,19]],def:[0,1,2,3,4,0,1]},
 {id:'extra',label:'Beleg (extra)',cat:'zuivel',opts:[['Kaas 30+','1 plak (20 g)',60,5],['Avocado','¼ stuk',60,.7,'groente'],['Light smeerkaas','20 g',35,2],['Niets extra','',0,0]],def:[0,1,0,0,1,0,1]},
 {id:'groente',label:'Groente erbij',cat:'groente',opts:[['Tomaat & komkommer','150 g',30,1],['Paprikareepjes','150 g',40,1.5],['Worteltjes','150 g',50,1],['Sla & radijs','100 g',20,1]],def:[0,1,2,3,0,1,2]}]},
{id:'m',time:'15:30',name:'Tussendoor',comps:[
 {id:'snack',label:'Snack',cat:'zuivel',opts:[['Kwark met kaneel + amandelen','150 g + 15 g',175,17],['Appel + amandelen','1 stuk + 15 g',170,3.4,'fruit'],['Skyr met bessen','150 g + 75 g',135,16],['Gekookt ei + worteltjes','1 stuk + 100 g',115,7,'eiwit'],['Mandarijnen + kaasblokjes','2 stuks + 20 g',130,6,'fruit']],def:[0,1,2,3,4,0,1]}]},
{id:'d',time:'19:00',name:'Avondeten',comps:[
 {id:'eiwit',label:'Eiwit',cat:'eiwit',opts:[['Kipfilet','150 g',165,34],['Zalm','125 g',260,25],['Merluza (heek)','175 g',140,30],['Mager rundergehakt','125 g',170,27],['Varkenshaas (solomillo)','150 g',180,33],['Garnalen','175 g',150,32],['Linzen, gekookt','200 g',230,18,'overig']],def:[0,2,4,3,1,5,6]},
 {id:'groente',label:'Groente',cat:'groente',opts:[['Broccoli','300 g',100,8],['Bloemkool','300 g',75,6],['Sperziebonen','300 g',90,5],['Courgette','300 g',50,4],['Paprika & ui','300 g',90,3],['Spinazie','300 g',70,9],['Champignons','300 g',65,9],['Gemengde salade','250 g',50,3]],def:[0,4,2,1,5,6,3]},
 {id:'koolh',label:'Bijgerecht',cat:'granen',opts:[['Volkorenpasta','75 g droog',260,10],['Zilvervliesrijst','70 g droog',250,5],['Aardappelen','250 g',195,5],['Zoete aardappel','250 g',215,4],['Volkoren couscous','70 g droog',250,9]],def:[0,2,1,3,4,0,2]},
 {id:'vet',label:'Bereiding',cat:'overig',opts:[['Olijfolie','1 el',120,0],['Olijfolie + kruiden','½ el',60,0],['Tomatensaus + olijfolie','100 g + ½ el',100,1.5]],def:[0,0,2,0,1,0,2]}]},
{id:'a',time:'21:00',name:'Avond',comps:[
 {id:'toetje',label:'Toetje / drankje',cat:'overig',opts:[['Pure chocolade 85%','2 blokjes (10 g)',60,1],['Kwark met kaneel','150 g',85,14,'zuivel'],['Thee of Cola Zero','',2,0],['Cola (gewoon), weekmoment','1 blikje 330 ml',139,0],['Mandarijn','1 stuk',35,.6,'fruit']],def:[0,1,0,1,0,3,2]}]}];
export const DAYS = ['Maandag','Dinsdag','Woensdag','Donderdag','Vrijdag','Zaterdag','Zondag'];
const PADEL = [0, 2];
const SKIP = new Set(['Niets extra', 'Thee of Cola Zero']);
const COMPS = []; SLOTS.forEach(s => s.comps.forEach(c => { c.key = s.id + '.' + c.id; COMPS.push(c); }));

export const freshPlan = () => DAYS.map((_, d) => Object.fromEntries(COMPS.map(c => [c.key, c.def[d]])));
export const cleanPlan = p => Array.isArray(p) && p.length === 7
  ? p.map((x, d) => Object.fromEntries(COMPS.map(c => { const v = x && x[c.key]; return [c.key, Number.isInteger(v) && c.opts[v] ? v : c.def[d]]; })))
  : freshPlan();

const nf = n => Math.round(n).toLocaleString('nl-NL');
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// Boodschappen uit het menu: [{name, qty, category}]
export function menuShopping(plan) {
  const map = new Map();
  plan.forEach(day => COMPS.forEach(c => {
    const o = c.opts[day[c.key]]; if (!o || SKIP.has(o[0])) return;
    const k = o[0] + '|' + o[1];
    const cur = map.get(k) || { name: o[0], portie: o[1], category: CATNAME[o[4] || c.cat], n: 0 };
    cur.n++; map.set(k, cur);
  }));
  return [...map.values()].map(x => ({ name: x.name, qty: (x.portie ? x.portie + ' ' : '') + '×' + x.n, category: x.category }));
}

export function mountMenu(root, { getPlan, setPlan, toShopping }) {
  let day = (new Date().getDay() + 6) % 7;
  const opt = (plan, c, d) => c.opts[plan[d][c.key]];
  const tot = (plan, d) => COMPS.reduce((a, c) => { const o = opt(plan, c, d); a.k += o[2]; a.p += o[3]; return a; }, { k: 0, p: 0 });
  const slotK = (plan, s, d) => s.comps.reduce((a, c) => a + opt(plan, c, d)[2], 0);

  function render() {
    const plan = getPlan(), t = tot(plan, day), pct = v => Math.min(100, v / MAXK * 100);
    const st = t.k < LO ? ['Iets aan de lage kant: neem een fruit of kwarkje extra.', 'var(--warn)']
      : t.k > HI ? ['Boven je zone: kies een lichter bijgerecht of minder olie.', 'var(--warn)']
      : ['Binnen je zone.', 'var(--ok)'];
    root.innerHTML = `
      <div class="mtabs" role="tablist" aria-label="Dagen">${DAYS.map((n, d) => `<button class="mtab" role="tab" data-d="${d}" aria-selected="${d === day}"><b>${n.slice(0, 2)}${PADEL.includes(d) ? '<span class="pd" title="Padeldag"></span>' : ''}</b><small>${nf(tot(plan, d).k)} kcal</small></button>`).join('')}</div>
      <div class="msum">
        <div class="mut" style="font-size:14px">${DAYS[day]}${PADEL.includes(day) ? ' · padel 11:00–12:00' : ''}</div>
        <div class="big">${nf(t.k)} <small>kcal · ${nf(t.p)} g eiwit</small></div>
        <div class="meter"><i style="width:${pct(t.k)}%;background:${st[1]}"></i><span class="zone" style="left:${pct(LO)}%;width:${pct(HI) - pct(LO)}%"></span></div>
        <div style="font-weight:600;color:${st[1]};font-size:14px">${st[0]}</div>
      </div>
      ${SLOTS.map(s => `<article class="meal"><div class="time">${s.time}</div><div><h3>${s.name}<span>${nf(slotK(plan, s, day))} kcal</span></h3>${
        s.comps.map(c => `<div class="mrow"><label for="m-${c.key}">${c.label}</label><select id="m-${c.key}" data-k="${c.key}">${
          c.opts.map((o, i) => `<option value="${i}"${plan[day][c.key] === i ? ' selected' : ''}>${esc(o[0])}${o[1] ? ' · ' + esc(o[1]) : ''} (${o[2]} kcal)</option>`).join('')
        }</select><button class="all" type="button" data-all="${c.key}">Hele week</button></div>`).join('')
      }</div></article>`).join('')}
      <div class="actions"><button class="btn primary" type="button" id="menuToShop">Zet op boodschappenlijst</button><button class="btn" type="button" id="menuReset">Standaardmenu</button></div>`;
  }

  root.addEventListener('click', e => {
    const tab = e.target.closest('.mtab');
    if (tab) { day = +tab.dataset.d; render(); return; }
    const all = e.target.closest('.all');
    if (all) {
      const plan = getPlan().map(x => ({ ...x })), k = all.dataset.all, v = plan[day][k];
      plan.forEach(p => { p[k] = v; }); setPlan(plan); render();
      const b = root.querySelector(`[data-all="${k}"]`); if (b) { b.textContent = 'Op alle dagen'; b.classList.add('done'); }
      return;
    }
    if (e.target.closest('#menuToShop')) { toShopping(); return; }
    const r = e.target.closest('#menuReset');
    if (r) {
      if (r.dataset.sure) { setPlan(freshPlan()); render(); }
      else { r.dataset.sure = 1; r.textContent = 'Zeker? Tik nog een keer'; r.classList.add('sure'); setTimeout(() => { if (r.isConnected) { delete r.dataset.sure; r.textContent = 'Standaardmenu'; r.classList.remove('sure'); } }, 3000); }
    }
  });
  root.addEventListener('change', e => {
    const k = e.target.dataset.k; if (!k) return;
    const plan = getPlan().map(x => ({ ...x })); plan[day][k] = +e.target.value; setPlan(plan); render();
    const sel = root.querySelector(`[data-k="${k}"]`); if (sel) sel.focus();
  });
  return { render };
}
