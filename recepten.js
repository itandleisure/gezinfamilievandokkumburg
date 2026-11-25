// Receptenboekje: avondeten met foto, ingedeeld op hoeveel tijd jullie hebben.
// Ma en wo (sport kinderen): snel. Di, do en vr: meer tijd. Zaterdag: uitgebreid en leuk. Zondag: patat.
// Elk recept is voor 4 personen. k = de vier onderdelen van Avondeten in het weekmenu (posities in SLOTS van menu.js),
// zodat "Zet op het menu" de calorieën van Frans meteen goed telt.
// Foto's: Pexels (gratis te gebruiken, ook zonder naamsvermelding: https://www.pexels.com/license/). foto = het Pexels-fotonummer.
import { SLOTS, DAYS, REC } from './menu.js';

const G = 'Groente', V = 'Vlees, vis & eieren', Z = 'Zuivel', B = 'Brood, granen & aardappelen', BA = 'Basis', O = 'Overig';
// Ingrediënt: [naam, hoeveelheid, afdeling, heb-je-meestal-al?]
export const SOORTEN = [
  { id: 'snel', n: 'Snel', sub: 'ma & wo: sportavond', dagen: [0, 2] },
  { id: 'tijd', n: 'Meer tijd', sub: 'di, do & vr', dagen: [1, 3, 4] },
  { id: 'zaterdag', n: 'Zaterdag', sub: 'uitgebreid en leuk', dagen: [5] },
  { id: 'zondag', n: 'Zondag', sub: 'patat, borrelplank of pizza', dagen: [6] }
];
const r = (id, soort, n, es, min, foto, k, ingr, stap, tip) => ({ id, soort, n, es, min, foto, k: { 'd.eiwit': k[0], 'd.groente': k[1], 'd.koolh': k[2], 'd.saus': k[3] }, ingr, stap, tip });

export const RECIPES = [
  // ---------- Snel (ma & wo) ----------
  r('pasta-kip-spinazie', 'snel', 'Pasta met kip, tomaat en spinazie', 'Pasta con pollo y espinacas', 20, 1373915, [0, 4, 2, 2],
    [['Volkorenpasta', '300 g', B], ['Kipfilet', '500 g', V], ['Verse spinazie', '400 g', G], ['Snoeptomaatjes', '250 g', G], ['Tomate frito of passata', '1 pak (400 g)', BA], ['Knoflook', '2 teentjes', G], ['Geraspte Parmezaan', '40 g', Z], ['Olijfolie', '1 el', BA, 1]],
    ['Zet water op en kook de pasta in 10 tot 12 minuten.', 'Snijd de kip in blokjes en bak hem 6 minuten in de olie met de knoflook.', 'Halveer de tomaatjes en doe ze met de tomatensaus bij de kip. Laat 3 minuten pruttelen.', 'Roer de spinazie er handje voor handje door tot hij geslonken is.', 'Schep de pasta erdoor en strooi de Parmezaan erover.'],
    'Jouw portie: 75 g droge pasta. Zin in meer? Neem extra spinazie, geen extra pasta.'),
  r('arroz-tres-delicias', 'snel', 'Gebakken rijst met ei, ham en doperwten', 'Arroz tres delicias', 20, 1410236, [8, 10, 3, 1],
    [['Rijst (liefst van gisteren)', '280 g droog', B], ['Eieren', '6 stuks', V], ['Hamblokjes (taquitos de jamón)', '150 g', V], ['Doperwten en worteltjes (diepvries)', '450 g', G], ['Lente-uitjes', '1 bosje', G], ['Sojasaus', '2 el', BA], ['Olijfolie', '1 el', BA, 1]],
    ['Kook de rijst (of gebruik rijst van gisteren: die bakt het lekkerst).', 'Klop de eieren los, bak er een dunne omelet van in de wok en snijd hem in reepjes.', 'Bak de hamblokjes en de doperwten met wortel 4 minuten in dezelfde pan.', 'Doe de rijst erbij en bak alles 3 minuten op hoog vuur.', 'Roer de sojasaus, de reepjes ei en de lente-ui erdoor.'],
    'Tip: kook op zondag of dinsdag een dubbele portie rijst, dan staat dit op maandag in 10 minuten op tafel.'),
  r('merluza-krieltjes', 'snel', 'Merluza met krieltjes en sperziebonen', 'Merluza a la plancha', 20, 4013723, [4, 2, 1, 1],
    [['Merluza- of kabeljauwfilet', '700 g', V], ['Krieltjes (voorgekookt)', '1 kg', B], ['Sperziebonen', '500 g', G], ['Citroen', '1 stuk', G], ['Knoflook', '1 teentje', G], ['Peterselie', '1 bosje', G], ['Olijfolie', '1 el', BA, 1]],
    ['Kook de sperziebonen in 8 minuten gaar.', 'Bak de krieltjes in een pan met een beetje olie in 10 minuten goudbruin.', 'Bestrooi de vis met peper en zout en bak hem 3 minuten per kant in een hete pan.', 'Hak knoflook en peterselie fijn, meng met een scheutje olie en citroensap en schep dit over de vis.'],
    'Vis is mager en zit vol eiwit: je zit hiermee ruim binnen je zone.'),
  r('pollo-pimientos', 'snel', 'Kip met paprika en tomaat, met rijst', 'Pollo con pimientos', 25, 17321119, [0, 9, 3, 1],
    [['Rijst', '280 g droog', B], ['Kipfilet', '600 g', V], ['Paprika’s (rood en groen)', '3 stuks', G], ['Ui', '1 grote', G], ['Tomate frito', '1 pak (400 g)', BA], ['Gerookt paprikapoeder (pimentón)', '1 tl', BA, 1], ['Olijfolie', '1 el', BA, 1]],
    ['Kook de rijst.', 'Snijd kip, paprika en ui in reepjes.', 'Bak de kip 5 minuten, doe ui en paprika erbij en bak nog 5 minuten.', 'Roer pimentón en tomate frito erdoor en laat 5 minuten zachtjes pruttelen.', 'Serveer met de rijst.'],
    'Pimentón de la Vera geeft een rooksmaak zonder extra calorieën.'),

  // ---------- Meer tijd (di, do, vr) ----------
  r('pollo-al-ajillo', 'tijd', 'Knoflookkip met aardappeltjes en sla', 'Pollo al ajillo', 40, 5956828, [0, 8, 0, 0],
    [['Kipfilet of kippendijen zonder vel', '700 g', V], ['Aardappelen', '1 kg', B], ['Knoflook', '1 hele bol', G], ['Sla, tomaat en komkommer', 'voor 4', G], ['Witte wijn of bouillon', '100 ml', BA], ['Laurierblad', '2 stuks', BA, 1], ['Olijfolie', '2 el', BA, 1]],
    ['Schil de aardappelen, snijd ze in blokjes en kook ze 10 minuten voor.', 'Bak de stukken kip in 2 el olie rondom bruin (10 minuten).', 'Doe de gekneusde teentjes knoflook en de laurier erbij en bak 2 minuten mee.', 'Blus af met wijn of bouillon, doe de aardappelen erbij en laat 15 minuten zachtjes garen met de deksel op de pan.', 'Maak intussen een simpele salade.'],
    'Klassieker uit de Andalusische keuken. Kippendij is sappiger, kipfilet is magerder.'),
  r('albondigas', 'tijd', 'Gehaktballetjes in tomatensaus met rijst', 'Albóndigas en salsa', 45, 6248797, [2, 10, 3, 2],
    [['Mager rundergehakt', '500 g', V], ['Ei', '1 stuk', V], ['Paneermeel', '3 el', BA], ['Ui', '1 stuk', G], ['Knoflook', '2 teentjes', G], ['Tomate frito of passata', '2 pakken (800 g)', BA], ['Doperwten en worteltjes (diepvries)', '450 g', G], ['Rijst', '280 g droog', B]],
    ['Meng gehakt, ei, paneermeel, een snuf zout en peper en draai er zo’n 20 balletjes van. Leuk om samen met de kinderen te doen.', 'Bak de balletjes rondom bruin in een grote pan.', 'Fruit ui en knoflook mee, giet de tomatensaus erbij en laat 15 minuten zachtjes stoven.', 'Doe de doperwten en worteltjes de laatste 5 minuten erbij.', 'Kook intussen de rijst.'],
    'Jouw portie: 5 balletjes. Vries de rest in voor een snelle maandag.'),
  r('espinacas-garbanzos', 'tijd', 'Kikkererwten met spinazie (vega)', 'Espinacas con garbanzos', 30, 23384627, [9, 4, 3, 1],
    [['Kikkererwten (pot)', '2 potten (800 g uitgelekt)', BA], ['Verse spinazie', '500 g', G], ['Ui', '1 stuk', G], ['Knoflook', '3 teentjes', G], ['Gerookt paprikapoeder en komijn', '1 tl van elk', BA, 1], ['Gepelde tomaten (blik)', '1 blik', BA], ['Rijst of stokbrood', '200 g droog', B], ['Olijfolie', '1 el', BA, 1]],
    ['Fruit ui en knoflook 5 minuten in de olie.', 'Roer pimentón en komijn erdoor en bak 30 seconden mee.', 'Doe de tomaten erbij en laat 5 minuten inkoken.', 'Voeg de uitgelekte kikkererwten toe en de spinazie in delen. Laat 10 minuten zachtjes doorkoken.', 'Lekker met rijst of een stuk stokbrood.'],
    'Typisch Sevilla. Vol vezels en eiwit, dus je zit lang vol.'),
  r('solomillo-champis', 'tijd', 'Varkenshaas met champignons en aardappelen', 'Solomillo con champiñones', 35, 36183176, [3, 7, 0, 1],
    [['Varkenshaas (solomillo de cerdo)', '2 stuks (ca. 700 g)', V], ['Champignons', '500 g', G], ['Aardappelen', '1 kg', B], ['Broccoli', '1 stuk', G], ['Kookroom light', '100 ml', Z], ['Knoflook', '1 teentje', G], ['Olijfolie', '½ el', BA, 1]],
    ['Kook de aardappelen en de broccoli.', 'Snijd de varkenshaas in medaillons van 2 cm en bak ze 3 minuten per kant. Haal ze uit de pan.', 'Bak de plakjes champignon met de knoflook in dezelfde pan tot ze bruin zijn.', 'Roer de room erdoor, doe het vlees terug en laat 2 minuten warm worden.'],
    'Varkenshaas is het magerste stuk van het varken: veel eiwit, weinig vet.'),
  r('pollo-al-horno', 'tijd', 'Kip uit de oven met aardappel en paprika', 'Pollo al horno con patatas', 50, 37100056, [0, 9, 0, 0],
    [['Kipfilet of kippendijen zonder vel', '700 g', V], ['Aardappelen', '1 kg', B], ['Paprika’s', '2 stuks', G], ['Rode ui', '2 stuks', G], ['Citroen', '1 stuk', G], ['Rozemarijn of tijm (gedroogd)', '1 el', BA, 1], ['Olijfolie', '2 el', BA, 1]],
    ['Verwarm de oven voor op 200 °C.', 'Snijd aardappel in partjes, paprika en ui in grove stukken. Meng alles met de olie, kruiden, peper en zout op een bakplaat.', 'Zet de plaat 20 minuten in de oven.', 'Leg de kip ertussen, knijp de citroen erover uit en bak nog 25 minuten.'],
    'Weinig werk: de oven doet het meeste. Intussen kun je even met de kettlebell aan de slag.'),

  // ---------- Zaterdag: uitgebreid en leuk ----------
  r('paella-pollo', 'zaterdag', 'Paella met kip en groente', 'Paella de pollo y verduras', 60, 24906297, [0, 2, 3, 0],
    [['Paellarijst (arroz bomba of redondo)', '320 g', B], ['Kipfilet of kippendijen', '600 g', V], ['Sperziebonen (judías planas)', '300 g', G], ['Rode paprika', '1 stuk', G], ['Rijpe tomaat', '2 stuks', G], ['Kippenbouillon', '1 liter', BA], ['Saffraan of colorante', '1 zakje', BA], ['Citroen', '1 stuk', G], ['Olijfolie', '2 el', BA, 1]],
    ['Bak de stukken kip in de paellapan rondom bruin in de olie.', 'Doe sperziebonen en reepjes paprika erbij en bak 5 minuten mee.', 'Rasp de tomaten en bak ze 3 minuten mee.', 'Strooi de rijst erover, roer één keer en giet de hete bouillon met saffraan erbij.', 'Nu niet meer roeren! 10 minuten op hoog vuur, dan 8 minuten zacht. Laat 5 minuten rusten onder een theedoek.', 'Serveer met partjes citroen. De knapperige bodem (socarrat) is het lekkerst.'],
    'Een echte zaterdagklus om samen te doen. Paellapan te leen of voor een paar euro bij de ferretería in Cómpeta.'),
  r('hamburgers', 'zaterdag', 'Zelfgemaakte hamburgers met ovenpartjes', 'Hamburguesas caseras', 50, 14014041, [2, 11, 7, 1],
    [['Mager rundergehakt', '600 g', V], ['Volkoren hamburgerbroodjes', '4 stuks', B], ['Aardappelen (voor partjes)', '600 g', B], ['Sla, tomaat en rode ui', 'voor 4', G], ['Plakjes kaas 30+', '4 plakjes', Z], ['Augurk en ketchup', 'naar smaak', BA, 1], ['Olijfolie', '1 el', BA, 1]],
    ['Snijd de aardappelen in partjes, meng met olie, paprikapoeder en zout en bak ze 30 minuten op 200 °C (oven of airfryer).', 'Kneed het gehakt met peper en zout en vorm 4 burgers van 150 g. Druk met je duim een kuiltje in het midden, dan blijven ze plat.', 'Bak de burgers 4 minuten per kant. Leg de laatste minuut de kaas erop.', 'Laat iedereen zelf zijn burger beleggen met sla, tomaat en ui.'],
    'Jouw portie: 1 burger met broodje en veel sla. Een handje partjes erbij is ongeveer 100 kcal extra.'),
  r('pinchitos', 'zaterdag', 'Spiesjes met rijst en salade', 'Pinchitos morunos', 45, 17312401, [0, 11, 3, 1],
    [['Kipfilet (of varkenshaas)', '700 g', V], ['Rijst', '280 g droog', B], ['Sla, tomaat en ui', 'voor 4', G], ['Citroen', '1 stuk', G], ['Pinchito-kruiden of komijn, pimentón en oregano', '2 el', BA], ['Knoflook', '2 teentjes', G], ['Satéprikkers', '1 pak', O], ['Olijfolie', '2 el', BA, 1]],
    ['Snijd het vlees in blokjes en meng met kruiden, knoflook, olie en citroensap. Laat minstens 30 minuten (of ’s ochtends al) marineren.', 'Rijg het vlees aan de prikkers. Leuk werk voor de kinderen.', 'Gril de spiesjes 8 tot 10 minuten op de barbecue of in een grillpan, af en toe draaien.', 'Kook de rijst en maak een frisse salade.'],
    'Pinchitos zie je hier op elke feria. Op de barbecue is dit een feestje.'),
  r('dorada-horno', 'zaterdag', 'Dorade uit de oven met aardappelschijfjes', 'Dorada al horno', 50, 19239119, [4, 11, 0, 0],
    [['Dorade, schoongemaakt (vraag het aan de visboer)', '4 stuks', V], ['Aardappelen', '1 kg', B], ['Ui', '2 stuks', G], ['Citroen', '2 stuks', G], ['Knoflook', '3 teentjes', G], ['Sla en tomaat', 'voor 4', G], ['Witte wijn', '100 ml', BA], ['Olijfolie', '2 el', BA, 1]],
    ['Verwarm de oven voor op 200 °C.', 'Snijd aardappelen en ui in dunne schijfjes, meng met 1 el olie en zout en bak ze 20 minuten in een ovenschaal.', 'Leg de vissen erop, met plakjes citroen en knoflook in de buik. Sprenkel de wijn en de rest van de olie erover.', 'Bak nog 20 minuten tot de vis gaar is (het vlees laat makkelijk los van de graat).', 'Serveer met een frisse salade.'],
    'Dorade is goedkoop bij de vismarkt in Torre del Mar of Vélez. Jouw portie: 1 vis.'),
  r('tacos-pollo', 'zaterdag', 'Taco-avond met kip', 'Tacos de pollo', 40, 28895960, [0, 9, 6, 1],
    [['Kipfilet', '600 g', V], ['Tortilla-wraps (klein)', '12 stuks', B], ['Paprika’s', '2 stuks', G], ['Ui', '1 stuk', G], ['Avocado', '1 stuk', G], ['Tomaat en sla', 'voor 4', G], ['Mais (blik)', '1 klein blik', BA], ['Griekse yoghurt 0%', '150 g', Z], ['Taco- of fajitakruiden', '1 zakje', BA], ['Limoen', '1 stuk', G]],
    ['Snijd kip, paprika en ui in reepjes en bak ze met de kruiden 10 minuten.', 'Maak een snelle salsa: blokjes tomaat, ui en een beetje limoen.', 'Prak de avocado met limoensap en zout.', 'Zet alles in schaaltjes op tafel, warm de wraps even op en laat iedereen zelf vullen.'],
    'Gebruik Griekse yoghurt in plaats van zure room: veel minder calorieën, extra eiwit.'),

  // ---------- Zondag: patat ----------
  r('nuggets-patat', 'zondag', 'Patat met zelfgemaakte kipnuggets', 'Patatas con nuggets caseros', 35, 10183543, [0, 11, 4, 4],
    [['Kipfilet', '600 g', V], ['Eieren', '2 stuks', V], ['Cornflakes zonder suiker of paneermeel', '100 g', BA], ['Diepvriespatat', '1 kg', B], ['Sla en komkommer', 'voor 4', G], ['Fritessaus light of ketchup', 'naar smaak', BA]],
    ['Snijd de kip in stukjes zo groot als een nugget.', 'Haal ze door losgeklopt ei en daarna door verkruimelde cornflakes.', 'Bak ze 12 tot 15 minuten in de airfryer of oven op 200 °C, halverwege omdraaien.', 'Bak de patat in de airfryer.', 'Een bakje sla en komkommer erbij, en klaar.'],
    'Airfryer in plaats van frituur scheelt je zo’n 125 kcal. Zelfgemaakte nuggets hebben veel meer eiwit dan uit de diepvries.'),

  // ---------- Erbij gekomen: meer rijst, wraps, en zondag ook eens iets anders dan patat ----------
  r('curry-rijst', 'snel', 'Kip-kerrie met rijst en doperwten', 'Arroz con pollo al curry', 25, 6113813, [0, 10, 3, 6],
    [['Rijst', '280 g droog', B], ['Kipfilet', '500 g', V], ['Doperwten en worteltjes (diepvries)', '450 g', G], ['Ui', '1 stuk', G], ['Kokosmelk light', '1 blik (400 ml)', BA], ['Kerriepoeder', '2 el', BA, 1]],
    ['Kook de rijst.', 'Snijd kip en ui in stukjes en bak ze 5 minuten.', 'Strooi de kerrie erover en bak 1 minuut mee.', 'Giet de kokosmelk erbij, doe de doperwten en worteltjes erin en laat 8 minuten zachtjes pruttelen.', 'Serveer met de rijst.'],
    'Kinderen houden het mild: begin met 1 el kerrie en maak je eigen bord pittiger met een beetje sambal.'),
  r('rijstbowl', 'tijd', 'Rijstbowl met kip, zwarte bonen en mais', 'Bol de arroz mexicano', 30, 10696501, [0, 9, 3, 1],
    [['Rijst', '280 g droog', B], ['Kipfilet', '500 g', V], ['Zwarte bonen (blik)', '1 blik', BA], ['Mais (blik)', '1 klein blik', BA], ['Paprika’s', '2 stuks', G], ['Avocado', '1 stuk', G], ['Tomaat en sla', 'voor 4', G], ['Geraspte kaas', '60 g', Z], ['Taco- of fajitakruiden', '1 zakje', BA], ['Olijfolie', '½ el', BA, 1]],
    ['Kook de rijst.', 'Bak reepjes kip en paprika met de kruiden 8 minuten.', 'Warm de bonen en de mais even op in een pannetje.', 'Zet alles los op tafel: iedereen maakt zijn eigen bowl met rijst, kip of bonen, groente, avocado en een beetje kaas.'],
    'Een bowl is makkelijk voor iedereen: de kinderen kiezen zelf, en jij schept meer groente en minder rijst.'),
  r('wraps-kip', 'snel', 'Wraps met kip, sla en knoflooksaus', 'Wraps de pollo', 15, 12464909, [0, 11, 6, 1],
    [['Tortilla-wraps', '8 stuks', B], ['Kipfilet (of kant-en-klare kipreepjes)', '500 g', V], ['IJsbergsla', '1 krop', G], ['Tomaten', '3 stuks', G], ['Komkommer', '1 stuk', G], ['Griekse yoghurt 0%', '200 g', Z], ['Knoflook', '1 teentje', G], ['Olijfolie', '½ el', BA, 1]],
    ['Bak de kipreepjes met peper, zout en paprikapoeder in 6 minuten gaar.', 'Roer voor de saus de yoghurt met de geraspte knoflook en een snuf zout door elkaar.', 'Snijd sla, tomaat en komkommer.', 'Warm de wraps 20 seconden in een droge pan of de magnetron, en vullen maar.'],
    'Jouw portie: 2 wraps. Yoghurtsaus in plaats van mayo of knoflooksaus uit de fles scheelt zo 100 kcal.'),
  r('wraps-oven', 'tijd', 'Wraps uit de oven met gehakt, bonen en kaas', 'Enchiladas al horno', 35, 12097599, [2, 9, 6, 1],
    [['Tortilla-wraps', '8 stuks', B], ['Mager rundergehakt', '400 g', V], ['Kidneybonen (blik)', '1 blik', BA], ['Paprika’s', '2 stuks', G], ['Ui', '1 stuk', G], ['Tomate frito of passata', '1 pak (400 g)', BA], ['Geraspte kaas', '80 g', Z], ['Taco- of fajitakruiden', '1 zakje', BA], ['Sla', '1 zak', G]],
    ['Verwarm de oven voor op 200 °C.', 'Bak gehakt, ui en paprika met de kruiden 8 minuten rul. Doe de uitgelekte bonen erbij.', 'Vul de wraps, rol ze op en leg ze naast elkaar in een ovenschaal.', 'Giet de tomatensaus erover, strooi de kaas erop en bak 15 minuten tot de kaas bruin is.', 'Lekker met een frisse salade.'],
    'Jouw portie: 2 wraps. Wil je meer, neem dan een extra schep salade.'),
  r('borrelplank', 'zondag', 'Borrelplank-avond', 'Tabla de picoteo', 20, 5975472, [10, 12, 8, 7],
    [['Serranoham', '150 g', V], ['Gebakken kipreepjes of kipfilet (beleg)', '200 g', V], ['Manchego of jonge kaas', '200 g', Z], ['Hummus', '1 bakje', Z], ['Olijven', '1 bakje', BA], ['Stokbrood (barra)', '1 stuk', B], ['Komkommer, paprika, worteltjes en snoeptomaatjes', 'voor 4', G], ['Druiven of mandarijnen', '1 tros of 4 stuks', 'Fruit'], ['Chips (voor de kinderen)', '1 zak', BA]],
    ['Snijd de groente in reepjes en leg ze als eerste op de plank: dat wordt de basis.', 'Rol de ham op, snijd de kaas in blokjes en leg de kip erbij.', 'Zet hummus, olijven en chips in schaaltjes.', 'Snijd het stokbrood en leg het fruit in de hoekjes.', 'Laat de kinderen helpen met leggen: dat is de halve pret.'],
    'Zo blijf je binnen je schema: begin met groente en ham of kip, neem 2 sneetjes brood en wat hummus. Een klein handje chips (20 g) is ongeveer 105 kcal: dat past als je die avond je laatste snack overslaat.'),
  r('pizza-avond', ['zondag', 'snel'], 'Pizza-avond met een grote salade', 'Noche de pizza', 20, 5710200, [7, 11, 9, 1],
    [['Diepvriespizza’s (bijv. Ristorante)', '3 stuks', B], ['Snoeptomaatjes', '250 g', G], ['Sla of rucola', '1 zak', G], ['Komkommer', '1 stuk', G], ['Extra groente erop: paprika, champignons, ui', 'naar smaak', G], ['Olijfolie en balsamico', 'voor de dressing', BA, 1]],
    ['Verwarm de oven volgens de verpakking.', 'Beleg de pizza’s eventueel nog met extra paprika, champignons of ui: meer groente, meer vulling.', 'Maak intussen een grote salade met een dun laagje dressing.', 'Snijd elke pizza in 8 punten en zet alles op tafel.'],
    'Mag pizza? Ja, met een halve pizza. Een hele Dr. Oetker Ristorante is al gauw 800 tot 950 kcal, een halve met een grote salade is ongeveer 535 kcal. Pizza heeft weinig eiwit, dus neem ’s middags een gekookt ei extra.'),

  // ---------- Volledig vegetarisch: voor het hele gezin, ook voor Frans ----------
  r('vega-bolognese', 'snel', 'Pasta bolognese met vega gehakt', 'Espaguetis boloñesa vegetarianos', 20, 21906876, [5, 9, 2, 2],
    [['Spaghetti of penne (volkoren)', '350 g', B], ['Vega gehakt', '2 pakken (400 g)', V], ['Ui', '1 stuk', G], ['Wortel', '2 stuks', G], ['Paprika', '1 stuk', G], ['Tomate frito of passata', '1 pak (400 g)', BA], ['Geraspte kaas', '50 g', Z], ['Italiaanse kruiden', '1 tl', BA, 1], ['Olijfolie', '½ el', BA, 1]],
    ['Kook de pasta.', 'Rasp de wortel fijn en snipper ui en paprika. Bak ze 5 minuten in de olie.', 'Doe het vega gehakt erbij en bak 4 minuten mee.', 'Giet de tomatensaus erbij, kruiden erin en laat 5 minuten pruttelen.', 'Kaas apart op tafel.'],
    'Geraspte wortel verdwijnt in de saus: de kinderen proeven het niet, en jij krijgt extra groente.'),
  r('ovenpasta', 'tijd', 'Ovenpasta met tomaat, courgette en mozzarella', 'Pasta al horno', 35, 11889305, [15, 4, 2, 2],
    [['Penne (volkoren)', '350 g', B], ['Courgette', '1 stuk', G], ['Verse spinazie', '200 g', G], ['Tomate frito of passata', '1 pak (400 g)', BA], ['Mozzarella light', '2 bollen', Z], ['Geraspte Parmezaan', '30 g', Z], ['Olijfolie', '½ el', BA, 1]],
    ['Verwarm de oven voor op 200 °C en kook de pasta 2 minuten korter dan op het pak staat.', 'Bak blokjes courgette 4 minuten, roer de spinazie erdoor tot hij slinkt.', 'Meng pasta, groente en tomatensaus in een ovenschaal.', 'Leg plakjes mozzarella erop, Parmezaan erover en bak 15 minuten.'],
    'Maak de schaal ’s middags klaar en schuif hem om 18:30 de oven in: makkelijk op een drukke dag.'),
  r('tortilla-patatas', 'tijd', 'Tortilla de patatas met salade', 'Tortilla de patatas', 40, 4765652, [11, 11, 0, 0],
    [['Eieren', '8 stuks', V], ['Aardappelen (vastkokend)', '800 g', B], ['Ui', '1 stuk', G], ['Sla, tomaat en komkommer', 'voor 4', G], ['Olijfolie', '2 el', BA, 1]],
    ['Schil de aardappelen en snijd ze in dunne plakjes. Snipper de ui.', 'Bak aardappel en ui in 2 el olie met de deksel op de pan in 20 minuten zacht. Af en toe omscheppen.', 'Klop de eieren los met zout en meng de aardappel erdoor.', 'Giet alles terug in de pan en bak 5 minuten op laag vuur. Keer hem met een groot bord en bak de andere kant 3 minuten.', 'Snijd in punten en geef er een frisse salade bij.'],
    'De Spaanse klassieker, maar met 2 el olie in plaats van een halve fles. Een punt over is je lunch van morgen.'),
  r('shakshuka', 'snel', 'Eieren in tomatensaus met brood', 'Huevos a la flamenca', 25, 6275165, [11, 9, 8, 2],
    [['Eieren', '8 stuks', V], ['Paprika’s', '2 stuks', G], ['Ui', '1 stuk', G], ['Gepelde tomaten (blik)', '2 blikken', BA], ['Gerookt paprikapoeder en komijn', '1 tl van elk', BA, 1], ['Stokbrood (barra)', '1 stuk', B], ['Feta', '100 g', Z], ['Olijfolie', '½ el', BA, 1]],
    ['Bak reepjes ui en paprika 5 minuten in een grote pan.', 'Roer de kruiden erdoor, doe de tomaten erbij en laat 8 minuten inkoken.', 'Maak 8 kuiltjes in de saus en breek in elk kuiltje een ei.', 'Deksel erop, 6 tot 8 minuten zachtjes garen tot het eiwit gestold is.', 'Brokkel de feta erover en zet het stokbrood erbij om te dippen.'],
    'Eén pan op tafel, iedereen schept zelf. Jouw portie: 2 eieren en 2 sneetjes brood.'),
  r('lentejas', 'tijd', 'Linzenstoof met groente', 'Lentejas estofadas', 40, 6120506, [12, 3, 8, 1],
    [['Linzen (pot) of droge linzen', '2 potten (800 g) of 300 g droog', BA], ['Wortel', '3 stuks', G], ['Aardappel', '2 stuks', B], ['Ui', '1 stuk', G], ['Paprika', '1 stuk', G], ['Knoflook', '2 teentjes', G], ['Groentebouillon', '1 liter', BA], ['Gerookt paprikapoeder', '1 tl', BA, 1], ['Stokbrood (barra)', '1 stuk', B], ['Olijfolie', '½ el', BA, 1]],
    ['Snijd ui, wortel, paprika en aardappel in blokjes en bak ze 5 minuten in de olie met de knoflook.', 'Roer de pimentón erdoor.', 'Giet de bouillon erbij en laat 15 minuten koken tot de aardappel bijna gaar is.', 'Doe de uitgelekte linzen erbij en laat nog 10 minuten zachtjes doorkoken.', 'Met een stuk brood erbij.'],
    'Lentejas eet half Spanje op een doordeweekse dag. Goedkoop, vult goed en is de volgende dag nog lekkerder.'),
  r('quesadillas', 'snel', 'Quesadillas met bonen, mais en kaas', 'Quesadillas de alubias', 20, 13243944, [14, 9, 6, 1],
    [['Tortilla-wraps', '8 stuks', B], ['Kidneybonen of zwarte bonen (blik)', '1 blik', BA], ['Mais (blik)', '1 klein blik', BA], ['Paprika', '1 stuk', G], ['Geraspte kaas', '150 g', Z], ['Griekse yoghurt 0%', '150 g', Z], ['Sla en tomaat', 'voor 4', G]],
    ['Prak de uitgelekte bonen grof met een vork.', 'Besmeer de helft van elke wrap met bonen, strooi er mais, blokjes paprika en kaas over en vouw dicht.', 'Bak ze in een droge koekenpan 2 tot 3 minuten per kant tot de kaas smelt.', 'Snijd in punten en geef er yoghurt en salade bij.'],
    'Jouw portie: 2 quesadillas met veel salade. Yoghurt in plaats van zure room.'),
  r('halloumi-ovenschotel', 'tijd', 'Halloumi uit de oven met krieltjes en groente', 'Halloumi al horno con verduras', 40, 8751405, [13, 9, 1, 1],
    [['Halloumi', '2 blokken', Z], ['Krieltjes', '1 kg', B], ['Paprika’s', '2 stuks', G], ['Courgette', '1 stuk', G], ['Rode ui', '2 stuks', G], ['Snoeptomaatjes', '250 g', G], ['Gedroogde oregano', '1 tl', BA, 1], ['Olijfolie', '1 el', BA, 1]],
    ['Verwarm de oven voor op 200 °C.', 'Halveer de krieltjes, snijd de groente in stukken en meng alles met olie, oregano en zout op een bakplaat.', 'Bak 25 minuten.', 'Leg plakken halloumi ertussen en bak nog 10 minuten tot ze goudbruin zijn.'],
    'Halloumi is zout: strooi dus weinig zout over de groente.')
];
// Vega-variant per recept: de partner van Frans eet geen vlees en vis, wel eieren en zuivel.
// [uitleg, extra ingrediënten]. Lege uitleg = het recept is al vegetarisch.
const VEGA = {
  'pasta-kip-spinazie': ['Bak de kip in een apart pannetje en schep hem pas op je eigen bord door de pasta. Op het bord van je partner: kikkererwten of een gebakken ei.', [['Kikkererwten (pot)', '1 pot', BA]]],
  'arroz-tres-delicias': ['Schep een portie apart voordat de ham erbij gaat en bak er 2 extra eieren door.', [['Eieren extra', '2 stuks', V]]],
  'merluza-krieltjes': ['Bak voor je partner plakken halloumi of 2 eieren in plaats van vis.', [['Halloumi', '1 blok', Z]]],
  'pollo-pimientos': ['Maak de saus eerst zonder kip. Haal er een portie uit en warm daarin kikkererwten op. Daarna gaat de kip in de rest.', [['Kikkererwten (pot)', '1 pot', BA]]],
  'pollo-al-ajillo': ['Bak voor je partner champignons met dezelfde knoflook (champiñones al ajillo) en een gebakken ei erbij.', [['Champignons', '250 g', G], ['Eieren', '2 stuks', V]]],
  'albondigas': ['Bak vega balletjes in een eigen pannetje en schep er wat van dezelfde tomatensaus over voordat de vleesballetjes erin gaan.', [['Vegetarische balletjes', '1 pak', V]]],
  'espinacas-garbanzos': ['', []],
  'solomillo-champis': ['Champignonroomsaus is al vega: bak er voor je partner halloumi of een omelet bij in plaats van vlees.', [['Halloumi', '1 blok', Z]]],
  'pollo-al-horno': ['Leg een blok feta en kikkererwten op een hoek van de bakplaat, zonder kip. Feta gaat pas de laatste 15 minuten erin.', [['Feta', '1 blok', Z], ['Kikkererwten (pot)', '1 pot', BA]]],
  'paella-pollo': ['Gebruik groentebouillon en bak de kip apart. Leg die op het eind alleen op jullie helft van de pan. Kikkererwten en extra paprika op de vega-helft.', [['Groentebouillon (in plaats van kip)', '1 liter', BA], ['Kikkererwten (pot)', '1 pot', BA]]],
  'hamburgers': ['Veggieburger voor je partner, in een apart pannetje. Alles eromheen blijft hetzelfde.', [['Veggieburger', '1 of 2 stuks', V]]],
  'pinchitos': ['Maak een paar spiesjes met halloumi, paprika en champignon, in dezelfde marinade.', [['Halloumi', '1 blok', Z], ['Champignons', '250 g', G]]],
  'dorada-horno': ['Bak in een kleiner schaaltje dezelfde aardappelschijfjes met een blok feta en wat tomaatjes.', [['Feta', '1 blok', Z], ['Snoeptomaatjes', '250 g', G]]],
  'tacos-pollo': ['Zet naast de kip een pannetje zwarte bonen met dezelfde kruiden op tafel.', [['Zwarte bonen (blik)', '1 blik', BA]]],
  'nuggets-patat': ['Vega nuggets uit de diepvries gaan tegelijk in de airfryer.', [['Vegetarische nuggets', '1 pak', V]]],
  'curry-rijst': ['Haal een portie saus apart voordat de kip erin gaat en warm daarin kikkererwten op.', [['Kikkererwten (pot)', '1 pot', BA]]],
  'rijstbowl': ['Bowls zijn het makkelijkst: je partner neemt zwarte bonen in plaats van kip. Doe er voor de zekerheid een extra blik bij.', [['Zwarte bonen extra', '1 blik', BA]]],
  'wraps-kip': ['Bak voor je partner roerei met spinazie of een paar plakken halloumi.', [['Eieren', '3 stuks', V], ['Halloumi', '1 blok', Z]]],
  'wraps-oven': ['Maak 2 wraps met vega gehakt of alleen bonen en leg ze aan één kant van de schaal. Steek er een prikker in, dan weet je welke het zijn.', [['Vega gehakt', '1 pak (200 g)', V]]],
  'borrelplank': ['Maak één hoek van de plank vega: kaas, hummus, gekookte eitjes, olijven en tortilla de patatas. Leg de ham aan de andere kant.', [['Eieren (gekookt)', '4 stuks', V], ['Tortilla de patatas (koeling)', '1 stuk', V]]],
  'pizza-avond': ['Kies voor je partner een Margherita, Funghi of Quattro Formaggi: die zijn zonder vlees.', []],
  'vega-bolognese': ['', []], 'ovenpasta': ['', []], 'tortilla-patatas': ['', []], 'shakshuka': ['', []], 'lentejas': ['', []], 'quesadillas': ['', []], 'halloumi-ovenschotel': ['', []]
};

// Zo serveer je het voor de kinderen: zij eten het liefst pasta of rijst los, zonder saus erdoor, en alles naast elkaar op het bord.
const KIDS = {
  'pasta-kip-spinazie': 'Schep hun pasta af voordat alles door elkaar gaat. Kip en tomaatjes los ernaast, saus in een kommetje.',
  'arroz-tres-delicias': 'Bak hun rijst zonder sojasaus, of geef gewone witte rijst met de reepjes ei, ham en doperwten los ernaast.',
  'merluza-krieltjes': 'Vis, krieltjes en boontjes los op het bord. Geen knoflook-peterselie over hun stukje vis.',
  'pollo-pimientos': 'Witte rijst naturel, kip apart uit de pan halen voordat de saus erbij gaat. Saus in een kommetje voor wie wil.',
  'pollo-al-ajillo': 'Hun kip en aardappeltjes zonder de knoflook: haal hun stukken eruit voordat de knoflook erin gaat.',
  'albondigas': 'Witte rijst naturel, balletjes eruit scheppen met een beetje saus apart, doperwten los ernaast.',
  'espinacas-garbanzos': 'Geef ze witte rijst met een paar kikkererwten en een gekookt ei los ernaast. Of kook voor hen gewoon pasta met tomatensaus.',
  'solomillo-champis': 'Varkenshaas, aardappel en broccoli los, zonder champignonsaus.',
  'pollo-al-horno': 'Kip en aardappelpartjes van de bakplaat los op het bord: dat werkt meestal al zonder aanpassing.',
  'paella-pollo': 'Geen paella-fan? Kook een pannetje witte rijst en geef de stukjes kip uit de paella erbij.',
  'hamburgers': 'Laat ze zelf hun burger beleggen. Partjes met een beetje ketchup.',
  'pinchitos': 'Witte rijst naturel en een spiesje zonder kruidenmarinade (kip met alleen een beetje zout en olie).',
  'dorada-horno': 'Haal de graten eruit en leg de vis, aardappeltjes en wat komkommer los op het bord. Of maak voor hen vissticks in de airfryer.',
  'tacos-pollo': 'Ze vullen hun wrap zelf, met wat ze lekker vinden: kip, kaas, mais.',
  'nuggets-patat': 'Kinderfavoriet: hoeft niets aan te veranderen.',
  'curry-rijst': 'Witte rijst naturel met kip en doperwten los. Haal hun kip eruit voordat de curry erin gaat.',
  'rijstbowl': 'Een bowl is al los: rijst, kip, mais en kaas in eigen hoekjes.',
  'wraps-kip': 'Zelf vullen: kip, kaas en komkommer. Saus erbij alleen als ze willen.',
  'wraps-oven': 'Maak 2 wraps met alleen gehakt en kaas, zonder saus erover.',
  'borrelplank': 'Een plank is ideaal: iedereen pakt wat hij lekker vindt. Chips in een eigen bakje.',
  'pizza-avond': 'Hoeft niets aan te veranderen. Komkommer en tomaatjes los ernaast.',
  'vega-bolognese': 'Schep hun pasta af voordat de saus erdoor gaat en geef de saus in een kommetje erbij.',
  'ovenpasta': 'Houd een paar scheppen gewone pasta apart en geef een beetje tomatensaus en geraspte kaas erbij.',
  'tortilla-patatas': 'Tortilla lusten de meeste kinderen. Doe er eventueel wat patat of brood bij.',
  'shakshuka': 'Bak voor hen een gewoon gebakken eitje met brood en wat komkommer.',
  'lentejas': 'Kook voor hen pasta of rijst naturel met een gekookt ei of een stukje kaas erbij.',
  'quesadillas': 'Maak hun quesadilla met alleen kaas (en eventueel mais).',
  'halloumi-ovenschotel': 'Krieltjes en stukjes halloumi los op hun bord, met de groente die ze lusten.'
};
RECIPES.forEach(x => { const v = VEGA[x.id] || ['', []]; x.vega = v[0]; x.vingr = v[1]; x.kids = KIDS[x.id] || ''; });
export const byId = id => RECIPES.find(x => x.id === id);

const DC = SLOTS.find(s => s.id === 'd').comps;
export const recipeKcal = rc => DC.reduce((a, c) => { const o = c.opts[rc.k['d.' + c.id]] || [0, 0, 0, 0]; a.k += o[2]; a.p += o[3]; return a; }, { k: 0, p: 0 });
const foto = (id, w = 600) => `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=${w}`;
const nf = n => Math.round(n).toLocaleString('nl-NL');
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const todayIdx = () => (new Date().getDay() + 6) % 7;
const soortVan = d => (SOORTEN.find(s => s.dagen.includes(d)) || SOORTEN[0]).id;
// Als een foto niet laadt: een tegeltje in azulejo-blauw met een bord
const FALLBACK = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 90"><rect width="120" height="90" fill="#1d4e89"/><circle cx="60" cy="45" r="28" fill="#fff"/><circle cx="60" cy="45" r="18" fill="none" stroke="#c4502b" stroke-width="3"/></svg>');

export function mountRecepten(root, { getPlan, setPlan, getDishes, setDishes, addToShopping, toast }) {
  let soort = soortVan(todayIdx()), open = null;

  function list() {
    const items = soort === 'alle' ? RECIPES : soort === 'vega' ? RECIPES.filter(x => !x.vega) : RECIPES.filter(x => [].concat(x.soort).includes(soort));
    const s = SOORTEN.find(x => x.id === soort);
    return `<div class="chips rb-chips" role="tablist" aria-label="Soort avond">${
      SOORTEN.map(x => `<button class="chip" role="tab" data-soort="${x.id}" aria-selected="${x.id === soort}">${x.n}</button>`).join('')
    }<button class="chip" role="tab" data-soort="vega" aria-selected="${soort === 'vega'}">🌱 Vega</button><button class="chip" role="tab" data-soort="alle" aria-selected="${soort === 'alle'}">Alles</button></div>
    <p class="mut rb-sub">${s ? `${esc(s.n)}: ${esc(s.sub)}.` : soort === 'vega' ? 'Helemaal vegetarisch: geschikt voor jullie allebei.' : 'Alle recepten.'} Tik op een recept voor ingrediënten en bereiding. Calorieën gelden voor jouw portie.</p>
    <div class="rb-grid">${items.map(x => { const t = recipeKcal(x); return `<button class="rb-card" type="button" data-open="${x.id}">
      <img src="${foto(x.foto, 400)}" alt="" loading="lazy">
      <span class="rb-txt"><b>${esc(x.n)}</b>${x.vega ? '' : '<em class="rb-veg">🌱 vegetarisch</em>'}<i>${esc(x.es)}</i><small>⏱ ${x.min} min · ${nf(t.k)} kcal · ${nf(t.p)} g eiwit</small></span></button>`; }).join('')}</div>
    <p class="mut rb-credit">Foto’s: <a href="https://www.pexels.com" target="_blank" rel="noopener">Pexels</a>, gratis te gebruiken. De gerechten zelf hoeven er natuurlijk niet precies zo uit te zien.</p>`;
  }

  const ingrRow = (g, i) => `<li><label class="check"><input type="checkbox" data-ingr="${i}"${g[3] ? '' : ' checked'}><span><b>${esc(g[0])}</b> ${esc(g[1])}${g[3] ? ' <small>(heb je meestal al)</small>' : ''}</span></label></li>`;
  function detail(x) {
    const t = recipeKcal(x), plan = getPlan(), td = todayIdx();
    const ss = [].concat(x.soort).map(id => SOORTEN.find(q => q.id === id)), s = ss[0], fitDays = ss.flatMap(q => q.dagen);
    const days = [0, 1, 2, 3, 4, 5, 6].map(i => (td + i) % 7);
    const inList = getDishes().some(g => g.n.toLowerCase() === x.n.toLowerCase());
    return `<button class="btn link rb-back" type="button" data-back>‹ Terug naar het receptenboekje</button>
    <article class="rb-detail">
      <img class="rb-hero" src="${foto(x.foto, 900)}" alt="${esc(x.n)}">
      <h2>${esc(x.n)}</h2>
      <p class="rb-es">${esc(x.es)}</p>
      <p class="rb-meta"><span>⏱ ${x.min} min</span>${ss.map(q => `<span>${esc(q.n)} · ${esc(q.sub)}</span>`).join('')}<span>Voor 4 personen</span></p>
      <div class="rb-kcal"><b>${nf(t.k)} kcal</b> · ${nf(t.p)} g eiwit <small>jouw portie</small></div>
      <p class="rb-tip">💡 ${esc(x.tip)}</p>
      <p class="rb-kids">🧒 <b>Voor de kinderen:</b> ${esc(x.kids)}</p>
      <p class="rb-vega">🌱 <b>Vega-variant:</b> ${x.vega ? esc(x.vega) : 'dit recept is al vegetarisch.'}</p>
      <h3>Zet op het menu</h3>
      <div class="rb-days">${days.map((d, i) => { const on = plan[d][REC] === x.id, fit = fitDays.includes(d); return `<button class="chip${fit ? ' fit' : ''}" type="button" data-day="${d}" aria-pressed="${on}">${on ? '✓ ' : ''}${i ? DAYS[d].slice(0, 2) : 'Vandaag'}</button>`; }).join('')}</div>
      <p class="mut rb-small">Blauw omrand = past bij die dag. Het avondeten in het weekmenu wordt dan ingesteld op dit recept.</p>
      <h3>Ingrediënten <small>voor 4</small></h3>
      <ul class="rb-ingr">${x.ingr.map((g, i) => ingrRow(g, i)).join('')}</ul>
      ${x.vingr.length ? `<h4 class="rb-vh">🌱 Erbij voor de vega-variant</h4><ul class="rb-ingr">${x.vingr.map((g, i) => ingrRow(g, 'v' + i)).join('')}</ul>` : ''}
      <button class="btn primary rb-shop" type="button" data-shop>Zet aangevinkte op de boodschappenlijst</button>
      <h3>Zo maak je het</h3>
      <ol class="rb-steps">${x.stap.map(t => `<li>${esc(t)}</li>`).join('')}</ol>
      <div class="actions"><button class="btn" type="button" data-savedish${inList ? ' disabled' : ''}>${inList ? '✓ Staat bij vaste gerechten' : 'Bewaar bij vaste gerechten'}</button></div>
    </article>`;
  }

  function render() {
    const x = open && byId(open);
    root.innerHTML = x ? detail(x) : list();
  }

  root.addEventListener('error', e => { const i = e.target; if (i.tagName === 'IMG' && i.src !== FALLBACK) i.src = FALLBACK; }, true);
  root.addEventListener('click', async e => {
    const so = e.target.closest('[data-soort]');
    if (so) { soort = so.dataset.soort; render(); return; }
    const op = e.target.closest('[data-open]');
    if (op) { open = op.dataset.open; render(); window.scrollTo(0, 0); return; }
    if (e.target.closest('[data-back]')) { open = null; render(); window.scrollTo(0, 0); return; }
    const x = open && byId(open); if (!x) return;
    const dy = e.target.closest('[data-day]');
    if (dy) {
      const d = +dy.dataset.day, plan = getPlan().map(p => ({ ...p }));
      if (plan[d][REC] === x.id) { delete plan[d][REC]; setPlan(plan); render(); toast('Recept van ' + DAYS[d].toLowerCase() + ' gehaald'); return; }
      Object.entries(x.k).forEach(([key, v]) => { plan[d][key] = v; delete plan[d][key + '#q']; });
      plan[d][REC] = x.id; setPlan(plan); render(); toast(x.n + ' staat op ' + DAYS[d].toLowerCase()); return;
    }
    const sh = e.target.closest('[data-shop]');
    if (sh) {
      const picked = [...root.querySelectorAll('[data-ingr]:checked')].map(i => i.dataset.ingr[0] === 'v' ? x.vingr[+i.dataset.ingr.slice(1)] : x.ingr[+i.dataset.ingr]);
      if (!picked.length) { toast('Vink eerst iets aan'); return; }
      sh.disabled = true;
      const ok = await addToShopping(picked.map(g => ({ name: g[0], qty: g[1] + ' · ' + x.n, category: g[2] })));
      sh.disabled = false;
      if (ok) { sh.textContent = '✓ ' + picked.length + ' op de lijst gezet'; sh.classList.add('done'); }
      return;
    }
    const di = e.target.closest('[data-savedish]');
    if (di && !di.disabled) {
      const list = getDishes().slice();
      list.push({ n: x.n.slice(0, 60), k: { ...x.k }, q: {} });
      setDishes(list); render(); toast('Staat nu bij de vaste gerechten in het menu');
    }
  });

  return {
    render,
    // Vanuit het menu: open een recept (of de lijst die past bij die dag)
    show(id, day) { open = id && byId(id) ? id : null; if (!open && day != null) soort = soortVan(day); }
  };
}
