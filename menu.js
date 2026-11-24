// Weekmenu (afvalschema Frans): ca. 1.800 kcal, min. 110 g eiwit, 6 eetmomenten.
export const TARGET = 1800, LO = 1600, HI = 1950, PROT = 110;
const MAXK = 2300;
const CATNAME = { groente: 'Groente', fruit: 'Fruit', zuivel: 'Zuivel', eiwit: 'Vlees, vis & eieren', granen: 'Brood, granen & aardappelen', overig: 'Overig' };
// [naam, portie, kcal, eiwit, categorie?]
// Gewoon, makkelijk eten: kwark, brood met kaas/vleeswaren, aardappel-groente-vlees, pasta, rijst; zondag patat.
const BELEG = [["Kaas 30+", "1 plak (20 g)", 60, 5, "zuivel"], ["Jonge kaas 48+", "1 plak (20 g)", 75, 5, "zuivel"], ["Salami", "3 dunne plakjes (15 g)", 60, 3.5], ["Serranoham", "2 plakjes (20 g)", 50, 6], ["Gekookt ei", "1 stuk", 75, 6.5], ["Kipfilet (beleg)", "2 plakjes (30 g)", 35, 7], ["Smeerkaas light", "20 g", 35, 2, "zuivel"], ["Pindakaas", "10 g", 60, 2.5, "overig"]];
export const SLOTS = [
{id:'o',time:'07:30',name:'Ontbijt',comps:[
 {id:'basis',label:'Kwark',cat:'zuivel',opts:[['Magere kwark','250 g',143,24],['Halfvolle kwark','250 g',190,22],['Griekse yoghurt 0%','250 g',145,25]],def:[0,0,0,0,0,0,0]},
 {id:'crunch',label:'Muesli',cat:'granen',opts:[['Muesli zonder toegevoegde suiker','40 g',150,4],['Havermout','40 g',150,5],['Krokante muesli','30 g',135,3]],def:[0,0,1,0,0,1,0]},
 {id:'fruit',label:'Fruit erdoor',cat:'fruit',opts:[['Frambozen','100 g',52,1],['Blauwe bessen','100 g',57,1],['Aardbeien','150 g',48,1],['Banaan','½ stuk',50,.6],['Diepvries rood fruit','100 g',45,1],['Appel in stukjes','½ appel',40,.2],['Peer in stukjes','½ peer',45,.3]],def:[4,5,3,4,6,5,3]},
 {id:'extra',label:'Extra',cat:'fruit',opts:[['Medjool-dadel','1 stuk',66,.4],['Walnoten','10 g',65,1.5,'overig'],['Honing','1 tl',30,0,'overig'],['Niets extra','',0,0]],def:[0,1,0,2,0,1,0]}]},
{id:'f',time:'10:30',name:'Fruit',comps:[
 {id:'fruit',label:'Fruit',cat:'fruit',opts:[['Appel','1 stuk',80,.4],['Mandarijnen','2 stuks',70,1.2],['Sinaasappel','1 stuk',70,1.3],['Peer','1 stuk',90,.6],['Banaan','1 stuk',105,1.3]],def:[0,1,2,0,1,2,3]}]},
{id:'l',time:'12:30',name:'Lunch',comps:[
 {id:'brood',label:'Brood',cat:'granen',opts:[['Volkorenbrood','3 sneetjes',255,12],['Volkorenbrood','2 sneetjes',170,8]],def:[0,0,0,0,0,0,0]},
 {id:'b1',label:'Beleg 1',cat:'eiwit',opts:BELEG,def:[0,0,1,0,0,1,0]},
 {id:'b2',label:'Beleg 2',cat:'eiwit',opts:BELEG,def:[2,3,3,2,3,2,3]},
 {id:'b3',label:'Beleg 3',cat:'eiwit',opts:BELEG,def:[5,4,1,5,0,4,5]},
 {id:'erbij',label:'Erbij',cat:'groente',opts:[['Tomaat & komkommer','150 g',30,1],['Snoeptomaatjes','100 g',20,1],['Niets erbij','',0,0]],def:[0,2,0,2,0,1,2]}]},
{id:'m',time:'15:30',name:'Tussendoor',comps:[
 {id:'snack',label:'Snack',cat:'eiwit',opts:[['Gekookt ei','1 stuk',75,6.5],['Gekookt ei + mandarijn','1 + 1 stuk',110,7.5],['Ongezouten noten','handje (20 g)',120,4,'overig'],['Appel','1 stuk',80,.4,'fruit'],['Kwark met kaneel (thuis)','150 g',85,14,'zuivel'],['Snoeptomaatjes + kaasblokjes','100 g + 20 g',100,6,'zuivel']],def:[1,0,1,0,1,2,0]}]},
{id:'d',time:'19:00',name:'Avondeten',comps:[
 {id:'eiwit',label:'Vlees / vis / vega',cat:'eiwit',opts:[['Kipfilet','150 g',165,34],['Biefstuk','150 g',190,33],['Mager rundergehakt','125 g',170,27],['Varkenshaas','150 g',180,33],['Witvis (kabeljauw/merluza)','175 g',140,30],['Vega gehakt','100 g',180,18],['Frikandel (airfryer)','1 stuk',160,8],['Geen vlees','',0,0]],def:[0,2,4,5,1,3,6]},
 {id:'groente',label:'Groente',cat:'groente',opts:[['Broccoli','300 g',100,8],['Bloemkool','300 g',75,6],['Sperziebonen','300 g',90,5],['Worteltjes','300 g',105,3],['Spinazie','300 g',70,9],['Rode kool','300 g',75,4],['Wokgroente','300 g',90,5],['Champignons','300 g',65,9],['Sla & rauwkost','250 g',50,3]],def:[0,6,2,7,1,3,8]},
 {id:'koolh',label:'Aardappel / pasta / rijst',cat:'granen',opts:[['Aardappelen','250 g',195,5],['Krieltjes','250 g',200,5],['Volkorenpasta','75 g droog',260,10],['Rijst','70 g droog',250,5],['Patat (airfryer/oven)','250 g',375,6],['Patat (frituur)','200 g',500,7]],def:[0,2,3,2,0,1,4]},
 {id:'saus',label:'Saus / bakken',cat:'overig',opts:[['Boter of olie om te bakken','1 el',100,0],['Boter of olie om te bakken','½ el',50,0],['Pastasaus (tomaat) + ½ el olie','150 g',110,2],['Jus + ½ el boter','50 ml',75,0],['Fritessaus','25 g',75,0],['Mayonaise','20 g',140,0]],def:[0,2,1,2,0,3,4]}]},
{id:'a',time:'21:00',name:'Avond',comps:[
 {id:'snack',label:'Iets lekkers',cat:'overig',opts:[['Ongezouten noten','handje (15 g)',95,3],['Pure chocolade','2 blokjes (10 g)',60,1],['Mandarijn','1 stuk',35,.6,'fruit'],['Niets','',0,0]],def:[0,1,0,0,1,0,3]},
 {id:'drank',label:'Drinken',cat:'overig',opts:[['Water of thee','',0,0],['Cola Zero','1 blikje',1,0],['Cola (gewoon)','1 glas (250 ml)',105,0]],def:[0,0,0,0,0,0,0]}]}];
export const DAYS = ['Maandag','Dinsdag','Woensdag','Donderdag','Vrijdag','Zaterdag','Zondag'];
const PADEL = [0, 2];
export const QOPTS = [[0.5, '½ portie'], [1, '1 portie'], [1.5, '1½ portie'], [2, '2 porties']];
const QVAL = new Set(QOPTS.map(q => q[0]));
const qk = c => c.key + '#q';
const SKIP = new Set(['Niets extra', 'Niets erbij', 'Niets', 'Geen vlees', 'Water of thee']);
const COMPS = []; SLOTS.forEach(s => s.comps.forEach(c => { c.key = s.id + '.' + c.id; COMPS.push(c); }));

export const freshPlan = () => DAYS.map((_, d) => Object.fromEntries(COMPS.map(c => [c.key, c.def[d]])));
export const cleanPlan = p => Array.isArray(p) && p.length === 7
  ? p.map((x, d) => Object.fromEntries(COMPS.flatMap(c => {
      const v = x && x[c.key], q = x && x[qk(c)];
      const out = [[c.key, Number.isInteger(v) && c.opts[v] ? v : c.def[d]]];
      if (QVAL.has(q) && q !== 1) out.push([qk(c), q]);
      return out;
    })))
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
    cur.n += day[qk(c)] || 1; map.set(k, cur);
  }));
  return [...map.values()].map(x => ({ name: x.name, qty: (x.portie ? x.portie + ' ' : '') + '×' + String(x.n).replace('.', ','), category: x.category }));
}

export function mountMenu(root, { getPlan, setPlan, toShopping }) {
  let day = (new Date().getDay() + 6) % 7;
  const opt = (plan, c, d) => c.opts[plan[d][c.key]];
  const mul = (plan, c, d) => plan[d][qk(c)] || 1;
  const tot = (plan, d) => COMPS.reduce((a, c) => { const o = opt(plan, c, d), m = mul(plan, c, d); a.k += o[2] * m; a.p += o[3] * m; return a; }, { k: 0, p: 0 });
  const slotK = (plan, s, d) => s.comps.reduce((a, c) => a + opt(plan, c, d)[2] * mul(plan, c, d), 0);

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
        }</select><select class="q" data-q="${c.key}" aria-label="Portie ${c.label}">${
          QOPTS.map(([v, l]) => `<option value="${v}"${mul(plan, c, day) === v ? ' selected' : ''}>${l}</option>`).join('')
        }</select><button class="all" type="button" data-all="${c.key}" title="Zet deze keuze en portie op alle 7 dagen">Hele week</button></div>`).join('')
      }</div></article>`).join('')}
      <div class="actions"><button class="btn primary" type="button" id="menuToShop">Zet op boodschappenlijst</button><button class="btn" type="button" id="menuReset">Standaardmenu</button></div>`;
  }

  root.addEventListener('click', e => {
    const tab = e.target.closest('.mtab');
    if (tab) { day = +tab.dataset.d; render(); return; }
    const all = e.target.closest('.all');
    if (all) {
      const plan = getPlan().map(x => ({ ...x })), k = all.dataset.all, v = plan[day][k], q = plan[day][k + '#q'];
      plan.forEach(p => { p[k] = v; if (q) p[k + '#q'] = q; else delete p[k + '#q']; }); setPlan(plan); render();
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
    const k = e.target.dataset.k, q = e.target.dataset.q; if (!k && !q) return;
    const plan = getPlan().map(x => ({ ...x }));
    if (k) plan[day][k] = +e.target.value;
    else { const v = +e.target.value; if (v === 1) delete plan[day][q + '#q']; else plan[day][q + '#q'] = v; }
    setPlan(plan); render();
    const sel = root.querySelector(k ? `[data-k="${k}"]` : `[data-q="${q}"]`); if (sel) sel.focus();
  });
  return { render };
}
