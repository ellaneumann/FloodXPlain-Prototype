// ============ RISK-SPECIFIC ACTIONS ============

// Generates a list of context-aware action items for a neighborhood,
// based on its CSO status, impervious surface %, elevation risk, and risk tier.
// Returns an array of {t: title, b: body} objects used in both the popup and the detail panel.
function getActions(props) {
  var name = props.NAME;
  var cat  = props.risk_pca_category || 'Moderate';
  var cls  = CSO_CLASSIFICATION[name] || {};
  var noOut = props.outlet_count === 0;
  var imperv = props.impervious_pct || 0;
  var elevRisk = props.elevation_risk || 0;
  var acts = [];

  if (cls.in_cso) {
    acts.push({t:'Install a backflow prevention valve NOW', b:'Your neighborhood is inside the combined sewer zone. During heavy rain, raw sewage backs up into homes through floor drains. A licensed plumber can install a backflow valve for $300-$600. This is the single most important action for CSO-zone residents.'});
    acts.push({t:'Do not use drains during heavy storms', b:'Keep floor drains sealed during storm watches. Avoid washing machines and toilets during heavy rain until the storm passes. In a CSO zone, these can become sewage entry points when the system surcharges.'});
    acts.push({t:'Report CSO overflows to EPA and DWM', b:'If you see or smell sewage in streets or waterways, call Atlanta DWM at (404) 546-0311 and report to the EPA at epa.gov/cso. Photograph with timestamps. Reports are required under the federal consent decree and directly influence where infrastructure dollars go.'});
  } else if (cls.low_adj_cso) {
    acts.push({t:'Understand that CSO overflow flows toward your neighborhood', b:'Your neighborhood is at lower elevation than the adjacent combined sewer zone (' + (cls.adj_zone || 'nearby') + '). When the CSO overflows, sewage flows downhill into your area. This is the exact mechanism behind the 2002 Vine City and 2012 Peoplestown disasters.'});
    acts.push({t:'Seal ground-floor entry points before major storms', b:'Sewage-laden floodwater can enter through floor drains, sump pits, and HVAC condensate lines. Seal floor drains with a rubber plug before storms. Ensure sump pumps discharge well away from street level.'});
  }

  if (noOut) {
    acts.push({t:'Advocate for storm outlet construction through your NPU', b:name + ' has zero storm outlets in the COA shapefile data. Stormwater enters the pipe network but has no exit point — it accumulates until it overflows at street level. Contact your NPU chair and City Council member requesting outlet construction through Atlanta\'s 5-Year Capital Improvement Plan.'});
  }

  if (imperv > 60) {
    acts.push({t:'Reduce impervious surface on your property', b:'Your neighborhood has ' + imperv.toFixed(0) + '% impervious coverage — a primary flooding driver. Replace concrete or asphalt with permeable pavers, gravel, or native ground cover. The City of Atlanta offers stormwater credits for on-site retention. Even a 10x10 ft replacement absorbs ~100 gallons per rain event.'});
    acts.push({t:'Install a rain garden at your downspout', b:'A rain garden (shallow depression with native plants) absorbs 30-40% more water than lawn. Position it to catch roof runoff from downspouts. Georgia Native Plant Society and Trees Atlanta offer free native plants for qualifying neighborhoods.'});
  }

  if (elevRisk > 0.55) {
    acts.push({t:'Know which streets flood first in your neighborhood', b:'Low-elevation neighborhoods flood fastest because water flows downhill from surrounding areas. Identify the lowest street crossings near your home before storm season. Six inches of fast-moving water can knock a person down; 12 inches can sweep a car.'});
  }

  if (cat === 'High') {
    acts.push({t:'Build a 72-hour flood emergency kit', b:'Store water (1 gallon/person/day), non-perishable food, 7-day medication supply, flashlight, battery radio, and waterproof copies of documents. Keep it on an upper floor or in a waterproof container. N95 masks are important — sewage floodwater carries pathogens.'});
    acts.push({t:'Sign up for emergency alerts', b:'Register at fcema.org (Fulton County) and atlantaga.gov/residents/atlanta-ready. Enable Wireless Emergency Alerts on your phone. Follow NWS Atlanta at weather.gov/ffc for real-time flash flood watches.'});
    acts.push({t:'Document every flood event to build the public record', b:'Every time your neighborhood floods: photograph it, note the time and address, and email documentation to your City Council member and Atlanta DWM. A documented record is required to qualify for FEMA Hazard Mitigation Grant funds — which can pay for infrastructure improvements at no cost to residents.'});
  } else if (cat === 'Moderate') {
    acts.push({t:'Keep storm drains clear', b:'Clear drain grates near your property of leaves and debris before storm season. A single blocked drain can back up an entire block during a 1-inch rain event. Call ATL 311 (404-546-0311) if city-maintained drains are clogged.'});
    acts.push({t:'Consider flood insurance', b:'Standard homeowner\'s insurance does NOT cover flood damage. NFIP flood insurance averages $700-$900/year and covers up to $250,000 in building damage. Get a quote at floodsmart.gov — worth it even outside FEMA Zone AE.'});
    acts.push({t:'Plant native ground cover and trees', b:'Native plants absorb significantly more stormwater than turf grass. A single mature oak absorbs 50 gallons per day. Georgia Native Plant Society and Trees Atlanta offer free plantings in qualifying neighborhoods.'});
  } else {
    acts.push({t:'Stay informed — low risk is not zero risk', b:'Monitor NWS Atlanta (weather.gov/ffc) during storms. Climate change is increasing the frequency of storms that exceed Atlanta\'s drainage design capacity.'});
    acts.push({t:'Maintain your drainage infrastructure', b:'Keep gutters, downspouts, and storm drains clear. Direct downspouts away from foundations and toward permeable surfaces.'});
    acts.push({t:'Support green infrastructure policies', b:"Advocate for permeable pavement and rain gardens. Atlanta's 2013 Post-Development Stormwater Ordinance requires new development to retain the first 1.2 inches of rainfall onsite."});
  }
  return acts;
}


// ============ EVALUATION FORM ============

// Stores the current numeric score for each of the five evaluation questions.
var EV = {act:0, acc:0, pri:0, ej:0, ov:0};

// SS (Set Score): Called by each rating button's onclick.
// Saves the chosen score and visually highlights all buttons up to and including the selected one.
function SS(key, val) {
  EV[key] = val;
  document.getElementById('sc-'+key).querySelectorAll('.sc-btn').forEach(function(b,i) {
    b.classList.toggle('sel', i < val);
  });
}

// Submits evaluation data to Formspree. Falls back to mailto: if the POST fails.
async function submitEval() {
  var btn = document.getElementById('sub-btn');
  btn.disabled = true; btn.textContent = 'Submitting...';
  var body = {
    _subject: 'FloodXPlain Evaluation Submission',
    actionable_score: EV.act,  actionable_comment: document.getElementById('ta-act').value,
    accuracy_score:   EV.acc,  accuracy_comment:   document.getElementById('ta-acc').value,
    priority_score:   EV.pri,  priority_comment:   document.getElementById('ta-pri').value,
    ej_score:         EV.ej,   ej_comment:         document.getElementById('ta-ej').value,
    overall_score:    EV.ov,   overall_comment:    document.getElementById('ta-ov').value,
  };
  try {
    var r = await fetch('https://formspree.io/f/xdkebqrz', {
      method:'POST', headers:{'Content-Type':'application/json','Accept':'application/json'},
      body: JSON.stringify(body),
    });
    if (!r.ok) throw new Error('server error');
    document.getElementById('sub-ok').style.display = 'block';
    btn.style.display = 'none';
  } catch(e) {
    var lines = ['FloodXPlain Evaluation','',
      'Actionable: '+EV.act, document.getElementById('ta-act').value,'',
      'Accuracy: '+EV.acc,   document.getElementById('ta-acc').value,'',
      'Priority: '+EV.pri,   document.getElementById('ta-pri').value,'',
      'EJ: '+EV.ej,          document.getElementById('ta-ej').value,'',
      'Overall: '+EV.ov,     document.getElementById('ta-ov').value,
    ];
    window.location.href = 'mailto:?subject=FloodXPlain+Evaluation&body='+encodeURIComponent(lines.join('\n'));
    document.getElementById('sub-ok').textContent = 'Opening email client...';
    document.getElementById('sub-ok').style.display = 'block';
    btn.style.display = 'none';
  }
}


// ============ COLLAPSIBLE METHOD SECTION ============

var methodOpen = true;
function toggleMethod() {
  methodOpen = !methodOpen;
  var body = document.getElementById('method-body');
  var chev = document.getElementById('mchev');
  body.style.maxHeight = methodOpen ? '220px' : '0';
  chev.style.transform = methodOpen ? 'rotate(0deg)' : 'rotate(-90deg)';
}


// ============ PRECIPITATION (LIVE WEATHER) ============

var precip = 0;

// Fetches the most recent hourly precipitation reading from the NWS KATL station.
// Converts from mm to inches, updates the header widget, and shows/hides the rain badge and precip banner.
// Also triggers a polygon redraw so CSO-adjacent neighborhoods reflect the live rain boost.
async function fetchPrecip() {
  try {
    var r = await fetch('https://api.weather.gov/stations/KATL/observations/latest', {headers:{'Accept':'application/geo+json'}});
    if (!r.ok) throw new Error('HTTP '+r.status);
    var d = await r.json();
    var raw = ((d.properties||{}).precipitationLastHour||{}).value;
    precip = (raw != null && !isNaN(raw)) ? parseFloat((raw*39.3701).toFixed(2)) : 0;
    document.getElementById('wx-val').textContent = precip > 0 ? precip.toFixed(2)+'" last hr' : '0.00" (dry)';
    var badge = document.getElementById('rain-badge');
    var banner = document.getElementById('precip-banner');
    if (precip >= 0.5) {
      badge.style.display = 'block';
      banner.style.display = 'block';
      banner.textContent = (precip >= 1.0 ? 'CRITICAL RAIN' : 'ELEVATED RAIN') + ': ' + precip.toFixed(2) + '" last hr — CSO overflow risk elevated';
    } else {
      badge.style.display = 'none';
      banner.style.display = 'none';
    }
    redrawPolygons();
  } catch(e) {
    document.getElementById('wx-val').textContent = 'N/A';
  }
}

// Returns a live precipitation boost value for CSO-affected neighborhoods.
// Used to elevate the visual warning in popups and detail panels during rain events.
function csoBoost(name) {
  var c = CSO_CLASSIFICATION[name] || {};
  if (!c.in_cso && !c.low_adj_cso) return 0;
  if (precip >= 1.0) return 0.10;
  if (precip >= 0.5) return 0.05;
  return 0;
}


// ============ COLOR HELPERS ============

// Returns the fill color for a neighborhood polygon based on its risk category,
// CSO classification, and EJ priority status.
function nbhFill(name, cat) {
  var c = CSO_CLASSIFICATION[name] || {};
  var f = NBH_GEOJSON.features.find(function(x){return x.properties.NAME===name;});
  if (f && f.properties.ej_top) return 'rgba(216,27,96,.65)';
  if (c.in_cso)      return 'rgba(0,77,64,.75)';
  if (c.low_adj_cso) return 'rgba(0,95,115,.70)';
  if (cat === 'High')     return 'rgba(230,81,0,.52)';
  if (cat === 'Moderate') return 'rgba(249,168,37,.45)';
  return 'rgba(21,101,192,.28)';
}

// Returns the border/stroke color for a neighborhood polygon.
function nbhBorder(name, cat) {
  var c = CSO_CLASSIFICATION[name] || {};
  var f = NBH_GEOJSON.features.find(function(x){return x.properties.NAME===name;});
  if (f && f.properties.ej_top) return '#D81B60';
  if (c.in_cso)      return '#004D40';
  if (c.low_adj_cso) return '#005F73';
  if (cat === 'High')     return '#E65100';
  if (cat === 'Moderate') return '#F9A825';
  return '#1565C0';
}

// Returns the full Leaflet style object (fill, stroke, weight, opacity) for a neighborhood polygon.
function nbhStyle(name, cat) {
  var c = CSO_CLASSIFICATION[name] || {};
  var f = NBH_GEOJSON.features.find(function(x){return x.properties.NAME===name;});
  var ejTop = f && f.properties.ej_top;
  return {
    fillColor:   nbhFill(name, cat),
    color:       nbhBorder(name, cat),
    weight:      ejTop ? 2.5 : (c.in_cso || c.low_adj_cso) ? 2 : cat==='High' ? 1.5 : 1,
    opacity:     0.9,
    fillOpacity: ejTop ? .82 : c.in_cso ? .75 : c.low_adj_cso ? .70 : cat==='High' ? .52 : cat==='Moderate' ? .45 : .28,
  };
}


// ============ MAP INITIALIZATION ============

// Two tile layers: CartoDB Voyager (street) and Esri World Imagery (satellite).
var STREET = L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
  {attribution:'&copy; OpenStreetMap &copy; CARTO', subdomains:'abcd', maxZoom:20});
var SAT = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
  {attribution:'&copy; Esri', maxZoom:19});

// Initialize the Leaflet map centered on Atlanta with zoom controls disabled
// (we use our own custom zoom buttons instead).
var map = L.map('map', {center:[33.748,-84.39], zoom:12, zoomControl:false, layers:[STREET]});
var baseNow = 'street';

// Switches between street and satellite basemaps.
function setBase(b) {
  if (b === baseNow) return;
  if (b === 'street') { map.removeLayer(SAT); STREET.addTo(map); }
  else               { map.removeLayer(STREET); SAT.addTo(map); }
  baseNow = b;
  document.getElementById('btn-st').classList.toggle('active', b==='street');
  document.getElementById('btn-sa').classList.toggle('active', b==='sat');
}


// ============ LAYER MANAGEMENT ============

// LG holds all Leaflet LayerGroup objects, one per data layer.
// LON tracks the on/off state of each layer to sync with the checkboxes in the Layers tab.
var LG = {
  nbh:L.layerGroup().addTo(map), demo:L.layerGroup(),
  rivers:L.layerGroup().addTo(map), rlabels:L.layerGroup().addTo(map),
  pipes:L.layerGroup().addTo(map), outlets:L.layerGroup().addTo(map), inlets:L.layerGroup(),
  cso:L.layerGroup().addTo(map), sso:L.layerGroup().addTo(map),
  intrenchment:L.layerGroup().addTo(map),
};
var LON = {nbh:true,demo:false,rivers:true,rlabels:true,pipes:true,outlets:true,inlets:false,cso:true,sso:true,intrenchment:true};

// TL (Toggle Layer): Toggles a single layer on/off and updates its sidebar checkbox.
function TL(n) {
  LON[n] = !LON[n];
  var el = document.getElementById('chk-'+n);
  if (el) el.classList.toggle('on', LON[n]);
  if (LON[n]) map.addLayer(LG[n]); else map.removeLayer(LG[n]);
}


// ============ WATERWAYS ============

// Draws the main rivers and streams as polylines with tooltips, and adds named labels at midpoints.
[{n:'Chattahoochee River',c:'#1E88E5',w:5,p:[[33.850,-84.540],[33.820,-84.510],[33.797,-84.495],[33.775,-84.490],[33.750,-84.484],[33.720,-84.472],[33.690,-84.455]]},
 {n:'Flint River',c:'#1E88E5',w:4,p:[[33.680,-84.505],[33.640,-84.440],[33.600,-84.390],[33.560,-84.368],[33.520,-84.340]]},
 {n:'Peachtree Creek',c:'#42A5F5',w:3,p:[[33.887,-84.335],[33.865,-84.348],[33.840,-84.358],[33.820,-84.370],[33.808,-84.385],[33.800,-84.400],[33.795,-84.415]]},
 {n:'Proctor Creek',c:'#42A5F5',w:3,p:[[33.810,-84.470],[33.800,-84.462],[33.790,-84.455],[33.782,-84.448],[33.775,-84.445],[33.762,-84.440]]},
 {n:'South River',c:'#64B5F6',w:3,p:[[33.750,-84.280],[33.730,-84.295],[33.712,-84.315],[33.698,-84.330],[33.680,-84.348]]},
 {n:'Intrenchment Creek',c:'#64B5F6',w:2.5,p:[[33.755,-84.310],[33.748,-84.325],[33.743,-84.340],[33.737,-84.358],[33.733,-84.372]]},
 {n:'Utoy Creek',c:'#90CAF9',w:2,p:[[33.755,-84.510],[33.740,-84.498],[33.728,-84.485],[33.718,-84.468],[33.706,-84.452]]},
 {n:'Nancy Creek',c:'#90CAF9',w:2,p:[[33.920,-84.395],[33.900,-84.382],[33.880,-84.372],[33.865,-84.365],[33.852,-84.368]]},
 {n:'Camp Creek',c:'#BBDEFB',w:1.5,p:[[33.730,-84.545],[33.715,-84.530],[33.702,-84.515],[33.690,-84.498]]},
 {n:'Sugar Creek',c:'#BBDEFB',w:1.5,p:[[33.762,-84.295],[33.750,-84.308],[33.740,-84.320],[33.728,-84.335]]},
].forEach(function(r) {
  L.polyline(r.p, {color:r.c,weight:r.w,opacity:.88}).bindTooltip(r.n,{direction:'top'}).addTo(LG.rivers);
  var mid = r.p[Math.floor(r.p.length/2)];
  L.marker(mid, {icon:L.divIcon({html:'<div style="font-size:9.5px;font-weight:700;color:'+r.c+';white-space:nowrap;text-shadow:0 0 3px #fff,0 0 3px #fff">'+r.n+'</div>',className:'',iconSize:[13,13]})}).addTo(LG.rlabels);
});

// Draws the Intrenchment Creek / Custer Watershed boundary from the GeoJSON LineString in INTRENCHMENT_OUTLINE.
// Coordinates in GeoJSON are [lng, lat], so they are flipped for Leaflet.
(function() {
  var coords = INTRENCHMENT_OUTLINE.features[0].geometry.coordinates;
  L.polyline(coords.map(function(c){return [c[1],c[0]];}), {color:'#D81B60',weight:2.5,opacity:.9,dashArray:'8,5'})
   .bindPopup('<div class="pop"><div class="pop-title">Custer Sewer Watershed Boundary</div><p style="font-size:10.5px;line-height:1.55;color:#555">The Intrenchment Creek / Custer Avenue drainage area from <code>RedOutline_Project.shp</code>. Subject to the 2024 Custer Ave Multi-Benefit Capacity Relief Project under federal consent decree.</p></div>')
   .addTo(LG.intrenchment);
})();


// ============ SEWER ZONES ============

// Draws the three combined sewer (CSO) polygon zones as dashed dark-teal outlines.
[{n:'Downtown/Midtown CSO Core', c:[[33.740,-84.405],[33.790,-84.405],[33.790,-84.355],[33.740,-84.355]]},
 {n:'Grant Park/Peoplestown CSO Zone', c:[[33.730,-84.405],[33.758,-84.405],[33.758,-84.362],[33.730,-84.362]]},
 {n:'Intrenchment Creek CSO Basin', c:[[33.718,-84.382],[33.758,-84.382],[33.758,-84.328],[33.718,-84.328]]},
].forEach(function(a) {
  L.polygon(a.c, {color:'#004D40',weight:2,opacity:.8,dashArray:'7,4',fillColor:'#004D40',fillOpacity:.08})
   .bindPopup('<div class="pop"><div class="pop-title">'+a.n+'</div><p style="font-size:10.5px;line-height:1.55;color:#555">Inside the combined sewer zone. Stormwater and raw sewage share one pipe here. During heavy rain, the system overflows — discharging raw sewage directly into waterways and streets.</p></div>')
   .addTo(LG.cso);
});

// Draws the four sanitary sewer (SSO) polygon zones as dashed blue outlines.
[{n:'NW Sanitary',c:[[33.790,-84.475],[33.830,-84.475],[33.830,-84.415],[33.790,-84.415]]},
 {n:'SW Sanitary',c:[[33.680,-84.540],[33.732,-84.540],[33.732,-84.468],[33.680,-84.468]]},
 {n:'NE Sanitary',c:[[33.840,-84.405],[33.900,-84.405],[33.900,-84.338],[33.840,-84.338]]},
 {n:'SE Sanitary',c:[[33.690,-84.372],[33.748,-84.372],[33.748,-84.288],[33.690,-84.288]]},
].forEach(function(a) {
  L.polygon(a.c, {color:'#1565C0',weight:1.5,opacity:.7,dashArray:'5,4',fillColor:'#1565C0',fillOpacity:.06}).addTo(LG.sso);
});

// Creates a small colored square icon for CSO (teal) or SSO (blue) facility markers.
function facIcon(t) {
  var bg=t==='cso'?'#004D40':'#1565C0',sym=t==='cso'?'C':'S';
  return L.divIcon({html:'<div style="width:18px;height:18px;background:'+bg+';border:2px solid #fff;border-radius:3px;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;color:#fff">'+sym+'</div>',className:'',iconSize:[18,18]});
}

// Adds marker pins for each named CSO and SSO facility.
CSO_SITES.forEach(function(s){L.marker([s.lat,s.lng],{icon:facIcon('cso')}).bindPopup('<div class="pop"><div class="pop-title">'+s.name+'</div>'+(s.ws?'<div class="pop-row"><span>Watershed</span><b>'+s.ws+'</b></div>':'')+'<p style="font-size:10.5px;margin-top:6px;color:#555">'+s.desc+'</p>'+(s.url?'<a class="n-link" href="'+s.url+'" target="_blank" style="margin-top:8px;display:inline-block">Source</a>':'')+' </div>').addTo(LG.cso);});
SSO_SITES.forEach(function(s){L.marker([s.lat,s.lng],{icon:facIcon('sso')}).bindPopup('<div class="pop"><div class="pop-title">'+s.name+'</div><p style="font-size:10.5px;margin-top:6px;color:#555">'+s.desc+'</p>'+(s.url?'<a class="n-link" href="'+s.url+'" target="_blank" style="margin-top:8px;display:inline-block">Source</a>':'')+' </div>').addTo(LG.sso);});


// ============ STORM INFRASTRUCTURE ============

// Material color and display name lookup tables for storm pipe types.
var MATC={RCP:'#004D40',VCP:'#D81B60',CMP:'#FFC107',PVC:'#1E88E5',CLP:'#7B2D8B',CO:'#0097A7'};
var MATN={RCP:'Reinforced Concrete',VCP:'Vitrified Clay (aging)',CMP:'Corrugated Metal (aging)',PVC:'PVC Plastic',CLP:'Clay Lined',CO:'Concrete Open'};

// Draws each storm pipe as a polyline; aging materials (VCP, CMP) are drawn thicker to highlight failure risk.
PIPES_DATA.forEach(function(p){if(!p.c||p.c.length<2)return;L.polyline(p.c,{color:MATC[p.m]||'#78909C',weight:(p.m==='VCP'||p.m==='CMP')?2.5:1.5,opacity:.7}).bindPopup('<div class="pop"><div class="pop-title">Storm Pipe</div><div class="pop-row"><span>Watershed</span><b>'+(p.w||'—')+'</b></div><div class="pop-row"><span>Material</span><b>'+(MATN[p.m]||p.m)+'</b></div><div class="pop-row"><span>Diameter</span><b>'+(p.d||'?')+'"</b></div></div>').addTo(LG.pipes);});

// Draws storm outlet discharge points as amber circle markers.
OUTLETS_DATA.forEach(function(o){L.circleMarker([o.lat,o.lng],{radius:4,color:'#fff',weight:1.2,fillColor:'#FFC107',fillOpacity:.9}).bindPopup('<div class="pop"><div class="pop-title">Storm Outlet</div><div class="pop-row"><span>Watershed</span><b>'+(o.w||'—')+'</b></div><div class="pop-row"><span>Type</span><b>'+(o.t||'—')+'</b></div></div>').addTo(LG.outlets);});

// Draws storm inlet points as small blue circle markers (off by default).
INLETS_DATA.forEach(function(i){L.circleMarker([i.lat,i.lng],{radius:2.5,fillColor:'#1E88E5',fillOpacity:.7,color:'none',weight:0}).addTo(LG.inlets);});


// ============ POPUP BUILDER ============

// Currently selected neighborhood name (used to keep the polygon highlighted).
var selNbh = null;
// Map from neighborhood name to its Leaflet GeoJSON layer, for direct style updates.
var polyLayers = {};

// Builds the full HTML string for a Leaflet map popup for a given neighborhood.
// Includes: risk badge, interpretation text, CSO/EJ/rain warnings, key stats, demographics, and action items.
function buildPopupHTML(props) {
  var name = props.NAME;
  var cat  = props.risk_pca_category || 'Moderate';
  var cls  = CSO_CLASSIFICATION[name] || {};
  var ejTop = props.ej_top;
  var noOut = props.outlet_count === 0;
  var boost = csoBoost(name);

  var interp = cat==='High'
    ? 'This neighborhood is at <b>high risk of flooding</b> during significant rain events. Streets and yards can flood quickly. If in or near the combined sewer zone, raw sewage may enter homes.'
    : cat==='Moderate'
    ? 'This neighborhood has <b>moderate flood risk</b>. Flooding is possible during heavy or prolonged rainfall, particularly near low-lying drainage areas.'
    : 'This neighborhood is at <b>lower flood risk</b> relative to Atlanta. Flooding can still occur during extreme events.';

  var h = '<div class="pop">';
  h += '<div class="pop-title">' + name;
  h += '<span class="pop-badge" style="background:'+nbhBorder(name,cat)+'">'+cat+'</span>';
  if (ejTop) h += '<span class="pop-badge" style="background:#D81B60">EJ Priority</span>';
  if (noOut) h += '<span class="pop-badge" style="background:#E65100">No Outlets</span>';
  h += '</div>';
  h += '<div class="pop-explain '+cat.toLowerCase()+'">'+interp+'</div>';

  if (ejTop)                  h += '<div class="pop-warn pw-ej">Highest EJ concern: high flood risk + majority Black + income below city median. Top priority for infrastructure investment.</div>';
  if (cls.in_cso)             h += '<div class="pop-warn pw-cso">Inside combined sewer zone: stormwater and raw sewage share one pipe. Any heavy rain can trigger raw sewage overflow.</div>';
  if (cls.low_adj_cso && !cls.in_cso) h += '<div class="pop-warn pw-adj">At lower elevation than adjacent CSO zone ('+( cls.adj_zone||'nearby')+'). CSO overflow sewage flows downhill into this neighborhood.</div>';
  if (boost > 0)              h += '<div class="pop-warn pw-rain">Current rain: '+precip.toFixed(2)+'" last hr — CSO overflow risk elevated.</div>';
  if (noOut && !cls.in_cso)   h += '<div class="pop-warn pw-noout">No storm outlets detected. +0.20 drainage penalty applied. Stormwater has no direct exit path.</div>';

  h += '<div class="pop-row"><span>Impervious surface</span><b>'+(props.impervious_pct||0).toFixed(1)+'%</b></div>';
  h += '<div class="pop-row"><span>Mean elevation</span><b>'+(props.mean_elev||0).toFixed(0)+' ft</b></div>';
  h += '<div class="pop-row"><span>Storm outlets</span><b>'+props.outlet_count+'</b></div>';
  h += '<div class="pop-row"><span>Drainage risk</span><b>'+(props.drainage_risk_pca||0).toFixed(3)+'</b></div>';

  if (props.pct_black !== undefined) {
    h += '<div style="font-size:9.5px;font-weight:700;color:#202124;margin:7px 0 4px">Demographics (ACS 2020)</div>';
    h += '<div class="pop-demo">';
    h += '<div class="pd"><div class="pd-v">'+props.pct_black+'%</div><div class="pd-l">Black</div></div>';
    h += '<div class="pd"><div class="pd-v">$'+Math.round((props.med_income||0)/1000)+'k</div><div class="pd-l">Med. Income</div></div>';
    h += '<div class="pd"><div class="pd-v">'+props.pct_poverty+'%</div><div class="pd-l">Poverty</div></div>';
    h += '</div>';
  }

  // Actions button + panel — NO inline onclick, NO getElementById by dynamic ID
  // Panel is always the immediate next sibling of the button
  var acts = getActions(props);
  h += '<button class="pop-act-btn" type="button">Actions to Take <span>&#x25BE;</span></button>';
  h += '<div class="pop-act-panel">';
  acts.forEach(function(a, i) {
    h += '<div class="pa-item"><div class="pa-num">'+(i+1)+'</div><div><b>'+a.t+'</b> '+a.b+'</div></div>';
  });
  h += '</div>';
  h += '</div>';
  return h;
}

// Uses event delegation on the document to handle action button clicks inside popups and the detail panel.
// This avoids attaching onclick handlers to dynamically-generated HTML.
document.addEventListener('click', function(e) {
  // Popup actions button
  if (e.target && (e.target.classList.contains('pop-act-btn') || e.target.closest('.pop-act-btn'))) {
    var btn = e.target.classList.contains('pop-act-btn') ? e.target : e.target.closest('.pop-act-btn');
    var panel = btn.nextElementSibling;
    if (panel && panel.classList.contains('pop-act-panel')) {
      panel.classList.toggle('open');
      var arrow = btn.querySelector('span');
      if (arrow) arrow.style.transform = panel.classList.contains('open') ? 'rotate(180deg)' : '';
    }
  }
  // Sidebar actions button
  if (e.target && e.target.id === 'dp-act-btn') {
    var p = document.getElementById('dp-act-panel');
    if (p) {
      p.classList.toggle('open');
      e.target.querySelector('span').style.transform = p.classList.contains('open') ? 'rotate(180deg)' : '';
    }
  }
});


// ============ NEIGHBORHOOD POLYGONS ============

// Iterates over every neighborhood in the GeoJSON, creates a Leaflet layer for each,
// attaches popup, click/hover event handlers, and registers it in polyLayers[].
// Also builds the purple demographics overlay for EJ-flagged neighborhoods.
NBH_GEOJSON.features.forEach(function(feat) {
  var props = feat.properties;
  var name  = props.NAME;
  var cat   = props.risk_pca_category;
  if (!cat) return;

  var layer = L.geoJSON(feat, {style: nbhStyle(name, cat)});
  layer.bindPopup(buildPopupHTML(props), {maxWidth:295});
  layer.on('click', function(e) {
    layer.setPopupContent(buildPopupHTML(props));
    selectNbh(name, props);
    L.DomEvent.stopPropagation(e);
  });
  layer.on('mouseover', function() {
    if (selNbh !== name) {
      var s = nbhStyle(name, cat);
      layer.setStyle({weight:s.weight+1.5, fillOpacity:Math.min(.92, s.fillOpacity+.18)});
    }
  });
  layer.on('mouseout', function() {
    if (selNbh !== name) layer.setStyle(nbhStyle(name, cat));
  });
  polyLayers[name] = layer;
  LG.nbh.addLayer(layer);

  if (props.env_justice) {
    L.geoJSON(feat, {style:{fillColor:'#7B2D8B',color:'#7B2D8B',weight:1,opacity:.5,fillOpacity:.2}})
     .bindPopup('<div class="pop"><div class="pop-title">EJ: '+name+'</div><p style="font-size:10.5px;margin-top:5px;color:#555">'+props.pct_black+'% Black &middot; $'+(props.med_income||0).toLocaleString()+' median income &middot; '+props.pct_poverty+'% poverty rate</p></div>')
     .addTo(LG.demo);
  }
});

// Redraws all non-selected neighborhood polygons with their current base style.
// Called after a live precipitation update so rain-boost colors refresh automatically.
function redrawPolygons() {
  NBH_GEOJSON.features.forEach(function(f) {
    var n = f.properties.NAME, c = f.properties.risk_pca_category;
    if (polyLayers[n] && selNbh !== n) polyLayers[n].setStyle(nbhStyle(n, c));
  });
}


// ============ FILTER & SEARCH ============

var curFilter = 'all';

// Updates the active filter button and re-renders the neighborhood list.
function setFilter(f) {
  curFilter = f;
  ['all','ej','cso','hi','mod','lo'].forEach(function(k) {
    var el = document.getElementById('filt-'+k);
    if (!el) return;
    el.className = 'cf';
    if (k==='all'&&f==='all') el.className='cf on-all';
    if (k==='ej' &&f==='ej')  el.className='cf on-ej';
    if (k==='cso'&&f==='cso') el.className='cf on-cso';
    if (k==='hi' &&f==='High') el.className='cf on-hi';
    if (k==='mod'&&f==='Moderate') el.className='cf on-mod';
    if (k==='lo' &&f==='Low') el.className='cf on-lo';
  });
  renderList();
}

// Renders the scrollable neighborhood list in the Flood Index tab.
// Applies the current filter, sorts by EJ score or flood risk, and filters by search text.
function renderList() {
  var el = document.getElementById('nbh-list');
  el.innerHTML = '';
  var q = document.getElementById('nbh-search').value.toLowerCase();
  var feats = NBH_GEOJSON.features.slice();
  if (curFilter === 'ej') feats.sort(function(a,b){return (b.properties.ej_score||0)-(a.properties.ej_score||0);});
  else feats.sort(function(a,b){return (b.properties.flood_risk_pca||0)-(a.properties.flood_risk_pca||0);});
  feats.forEach(function(feat) {
    var p = feat.properties, cat = p.risk_pca_category;
    if (!cat) return;
    var cls = CSO_CLASSIFICATION[p.NAME] || {};
    if (curFilter==='High'     && cat!=='High') return;
    if (curFilter==='Moderate' && cat!=='Moderate') return;
    if (curFilter==='Low'      && cat!=='Low') return;
    if (curFilter==='ej'  && !p.ej_top && (p.ej_score||0)<.45) return;
    if (curFilter==='cso' && !cls.in_cso) return;
    if (q && p.NAME.toLowerCase().indexOf(q)===-1) return;

    var sw = nbhFill(p.NAME, cat), bd = nbhBorder(p.NAME, cat);
    var div = document.createElement('div');
    div.className = 'nbh-row';
    div.id = 'nr-'+p.NAME.replace(/[^a-z0-9]/gi,'-');
    if (selNbh === p.NAME) div.classList.add('sel');
    var tags = '';
    if (p.ej_top)       tags += '<span class="nt nt-ej">EJ Priority</span>';
    if (cls.in_cso)     tags += '<span class="nt nt-cso">CSO zone</span>';
    if (cls.low_adj_cso)tags += '<span class="nt nt-adj">Downhill CSO</span>';
    if (p.outlet_count===0) tags += '<span class="nt nt-no">No outlets</span>';
    div.innerHTML =
      '<div class="nbh-sw" style="background:'+sw+';border-left:3px solid '+bd+'"></div>'+
      '<div class="nbh-body">'+
        '<div class="nbh-name">'+p.NAME+'</div>'+
        '<div class="nbh-meta">'+cat+' &middot; '+(p.impervious_pct||0).toFixed(0)+'% imprv &middot; '+p.outlet_count+' outlets</div>'+
        (tags?'<div class="nbh-tags">'+tags+'</div>':'')+
      '</div>';
    div.onclick = function() { selectNbh(p.NAME, p); ST('flood'); };
    el.appendChild(div);
  });
}

// Selects a neighborhood: highlights its polygon, scrolls the list to it, and renders the detail panel.
function selectNbh(name, props) {
  if (selNbh && polyLayers[selNbh]) {
    var pf = NBH_GEOJSON.features.find(function(f){return f.properties.NAME===selNbh;});
    if (pf) polyLayers[selNbh].setStyle(nbhStyle(selNbh, pf.properties.risk_pca_category));
    var pe = document.getElementById('nr-'+selNbh.replace(/[^a-z0-9]/gi,'-'));
    if (pe) pe.classList.remove('sel');
  }
  selNbh = name;
  if (polyLayers[name]) {
    polyLayers[name].setStyle({weight:3.5, fillOpacity:.92, color:'#1a1a2e'});
    try { map.fitBounds(polyLayers[name].getBounds(), {padding:[20,20], maxZoom:15}); } catch(e){}
  }
  var li = document.getElementById('nr-'+name.replace(/[^a-z0-9]/gi,'-'));
  if (li) { li.classList.add('sel'); li.scrollIntoView({behavior:'smooth',block:'nearest'}); }
  renderDetail(props);
}

// Renders the full detail panel for a selected neighborhood in the sidebar.
// Mirrors the popup content but in a larger, non-scrolling layout with bar charts.
function renderDetail(props) {
  var name = props.NAME, cat = props.risk_pca_category||'Moderate';
  var cls  = CSO_CLASSIFICATION[name]||{};
  var ejTop = props.ej_top, noOut = props.outlet_count===0, boost = csoBoost(name);
  var col = nbhBorder(name, cat);

  var interp = cat==='High'
    ? '<b>What this means for you:</b> High risk of street and yard flooding during significant rain. If in or near the combined sewer zone, raw sewage may back up into homes. Water can accumulate faster than it drains.'
    : cat==='Moderate'
    ? '<b>What this means for you:</b> Moderate flood risk. Flooding is possible during heavy or prolonged rainfall, particularly near low-lying areas.'
    : '<b>What this means for you:</b> Lower flood risk relative to Atlanta. Flooding can still occur during extreme events.';

  var h = '<div class="dp-scroll">';
  h += '<div class="dp-name">'+name;
  h += '<span class="dbadge" style="background:'+col+'">'+cat+'</span>';
  if (ejTop) h += '<span class="dbadge" style="background:#D81B60">EJ Priority</span>';
  if (noOut) h += '<span class="dbadge" style="background:#E65100">No Outlets</span>';
  h += '</div>';
  h += '<div class="dp-explain '+cat.toLowerCase()+'">'+interp+'</div>';
  if (ejTop) h += '<div class="warn warn-ej">Highest EJ concern: high flood risk + majority Black + income below city median. Top priority for infrastructure investment.</div>';
  if (cls.in_cso) h += '<div class="warn warn-cso">Inside combined sewer zone. CSO overflow risk compounds the baseline score.</div>';
  if (cls.low_adj_cso&&!cls.in_cso) h += '<div class="warn warn-adj">At lower elevation than adjacent CSO zone ('+( cls.adj_zone||'nearby')+'). CSO overflow sewage flows downhill here.</div>';
  if (boost>0) h += '<div class="warn warn-rain">Live rain: '+precip.toFixed(2)+'" last hr — CSO overflow risk elevated.</div>';

  function fcard(lbl, norm, disp, c) {
    var pct = Math.round(Math.min(1, norm||0)*100);
    return '<div class="fc"><div class="fc-lbl">'+lbl+'</div><div class="fc-bar"><div class="fc-fill" style="width:'+pct+'%;background:'+c+'"></div></div><div class="fc-val">'+disp+'</div></div>';
  }
  h += '<div class="fgrid">';
  h += fcard('Impervious', props.impervious_norm||0, (props.impervious_pct||0).toFixed(1)+'%', '#E65100');
  h += fcard('Drainage Risk', Math.min(1,props.drainage_risk_pca||0), (props.drainage_risk_pca||0).toFixed(3), '#D81B60');
  h += fcard('Elevation Risk', props.elevation_risk||0, (props.mean_elev||0).toFixed(0)+'ft', '#F9A825');
  h += fcard('No Outlets', noOut?1:0, props.outlet_count+' outlets', noOut?'#E65100':'#004D40');
  h += '</div>';

  if (props.pct_black !== undefined) {
    h += '<div style="font-size:9.5px;font-weight:700;color:#202124;margin-bottom:5px">Demographics (ACS 2020)</div>';
    h += '<div class="demo-grid">';
    h += '<div class="dcard"><div class="dcard-v">'+props.pct_black+'%</div><div class="dcard-l">Black</div></div>';
    h += '<div class="dcard"><div class="dcard-v">'+props.pct_white+'%</div><div class="dcard-l">White</div></div>';
    h += '<div class="dcard"><div class="dcard-v">$'+Math.round((props.med_income||0)/1000)+'k</div><div class="dcard-l">Med. Income</div></div>';
    h += '<div class="dcard"><div class="dcard-v">'+props.pct_poverty+'%</div><div class="dcard-l">Poverty</div></div>';
    h += '<div class="dcard"><div class="dcard-v">'+props.pop.toLocaleString()+'</div><div class="dcard-l">Population</div></div>';
    h += '<div class="dcard"><div class="dcard-v">'+(props.NPU||'—')+'</div><div class="dcard-l">NPU</div></div>';
    h += '</div>';
  }

  var acts = getActions(props);
  h += '<button class="act-btn" id="dp-act-btn" type="button">Actions to Take <span class="act-btn-arrow">&#x25BE;</span></button>';
  h += '<div class="act-panel" id="dp-act-panel">';
  acts.forEach(function(a, i) {
    h += '<div class="act-item"><div class="act-num">'+(i+1)+'</div><div><b>'+a.t+'</b> '+a.b+'</div></div>';
  });
  h += '</div>';
  h += '</div>';

  document.getElementById('detail-panel').innerHTML = h;
}


// ============ TAB SWITCHING ============

// ST (Switch Tab): Activates the named tab and its associated panel.
function ST(name) {
  var names = ['layers','flood','sewers','news','eval'];
  document.querySelectorAll('.tab').forEach(function(t,i){ t.classList.toggle('active', names[i]===name); });
  document.querySelectorAll('.panel').forEach(function(p){ p.classList.toggle('active', p.id==='tab-'+name); });
}


// ============ NEWS FETCHING ============

// localStorage keys used to cache the AI-fetched news results for the day.
// Changing these keys (e.g. fx_v10 -> fx_v11) will bust the cache and force a fresh fetch.
var NK='fx_v10_news', ND='fx_v10_date';

// fetchNews: The main function that retrieves live Atlanta flood/sewer news via the Claude API.
//
// How it works, step by step:
//
//   1. CACHE CHECK — If "force" is false (called on page load), we first check localStorage.
//      If we already fetched today's news and it's stored, we use that cached result and skip
//      the API call entirely. This avoids unnecessary API costs on page reload.
//
//   2. SHOW LOADING STATE — Sets the news panel to a spinner, disables the Refresh button,
//      and updates the status dot in the header to "Fetching..." in amber.
//
//   3. API CALL — POSTs to the Anthropic Claude API (/v1/messages endpoint).
//      The model is prompted to return a JSON array of recent Atlanta flood news articles.
//      Each article should have: y (year), title, src, tag, tc (tag color), sum (summary),
//      full (full text), and url. max_tokens is kept low (1000) to stay fast.
//      NOTE: This call requires a valid Anthropic API key configured server-side or via a proxy.
//
//   4. PARSE RESPONSE — Extracts the text block from the API response, then uses a regex
//      to find the JSON array inside the returned text. This is needed because the model
//      may include brief explanation text before/after the JSON.
//
//   5. CACHE RESULT — Saves the parsed JSON array and today's date to localStorage
//      so subsequent page loads within the same day skip the API call.
//
//   6. RENDER — Calls renderNews() with the AI results. This function merges them with
//      STATIC_NEWS (archived stories) and renders all cards sorted newest-first.
//
//   7. ERROR FALLBACK — If the API call fails for any reason (network error, bad response,
//      JSON parse failure), the catch block calls renderNews([]) with an empty AI array.
//      The page still shows the STATIC_NEWS archived stories. The status dot turns amber
//      and the label changes to "Archived reports" so users know they're seeing old data.
//
async function fetchNews(force) {
  // Step 1: Cache check — return early if we already fetched today
  var today = new Date().toISOString().slice(0,10);
  if (!force) {
    try {
      var cd=localStorage.getItem(ND), cn=localStorage.getItem(NK);
      if (cd===today&&cn) { renderNews(JSON.parse(cn)); setSt('Updated today','#4CAF50'); return; }
    } catch(e){}
  }

  // Step 2: Show loading state in the news panel and header
  document.getElementById('news-box').innerHTML='<div style="padding:20px;text-align:center;font-size:11px;color:var(--g400)"><span class="spin"></span>Searching&#8230;</div>';
  document.getElementById('rfbtn').disabled=true;
  document.getElementById('news-label').textContent='Fetching&#8230;';
  setSt('Fetching&#8230;','#FFC107');

  try {
    // Step 3: POST to the Claude API — request a JSON array of recent Atlanta flood/sewer news
    var t=new Date().toISOString().slice(0,10);
    var r=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model:'claude-sonnet-4-20250514',max_tokens:1000,tools:[{name:'web_search',description:'Search the web',input_schema:{type:'object',properties:{query:{type:'string'}},required:['query']}}],messages:[{role:'user',content:'Search for recent Atlanta Georgia flood sewer news from '+t+'. Return ONLY a JSON array (no other text) of up to 5 articles, each with fields: y (year as number), title, src, tag (e.g. Flood/Policy/Sinkhole), tc (hex color for tag), sum (2-sentence summary), full (3-4 sentence detail), url. Focus on flooding, sewer overflows, CSOs, sinkholes, infrastructure failures.'}]})});
    var data=await r.json();

    // Step 4: Extract the text content from the response, then find the JSON array inside it
    var txt=(data.content||[]).filter(function(b){return b.type==='text';}).map(function(b){return b.text;}).join('');
    var m=txt.match(/\[\s*\{[\s\S]*?\}\s*\]/); // regex: find [...] containing at least one {...}
    if(!m)throw new Error('no JSON');
    var ai=JSON.parse(m[0]);

    // Step 5: Cache the result in localStorage so today's page reloads skip the API
    localStorage.setItem(NK,JSON.stringify(ai)); localStorage.setItem(ND,t);

    // Step 6: Render the merged news feed and update the header status to green
    renderNews(ai); setSt('Updated today','#4CAF50');

  } catch(e) {
    // Step 7: Fallback — show only archived stories if the API call or parse fails
    console.error(e); renderNews([]); setSt('Archived','#FFC107');
    document.getElementById('news-label').textContent='Archived reports';
  } finally {
    // Always re-enable the Refresh button when done, whether successful or not
    document.getElementById('rfbtn').disabled=false;
  }
}

// Updates the status dot color and text in the page header.
function setSt(t,c){document.getElementById('stext').textContent=t;document.getElementById('sdot').style.background=c;}

// Renders the news feed: merges AI-fetched articles with STATIC_NEWS, sorts newest-first,
// and builds card HTML for each story.
function renderNews(ai) {
  var box=document.getElementById('news-box'); box.innerHTML='';
  // Merge AI articles (flagged isAI:true) with static archived articles (isAI:false)
  var all=ai.map(function(a){return Object.assign({},a,{isAI:true});})
    .concat(STATIC_NEWS.map(function(a){return Object.assign({},a,{isAI:false});}));
  // Sort all articles newest first by year
  all.sort(function(a,b){return (b.y||0)-(a.y||0);});
  document.getElementById('news-label').textContent=(ai.length>0?ai.length+' live + ':'')+STATIC_NEWS.length+' archived';
  all.forEach(function(n,i){
    var d=document.createElement('div'); d.className='n-card';
    var tc=n.tc||'#607D8B';
    d.innerHTML='<div class="n-hdr" onclick="xNews('+i+')">'
      +'<div class="n-meta"><span class="n-yr">'+(n.y||'?')+'</span>'
      +'<span class="n-tg" style="background:'+tc+'22;color:'+tc+'">'+(n.tag||'')+'</span>'
      +(n.isAI?'<span class="ai-tg">Live</span>':'')+'</div>'
      +'<div class="n-src">'+(n.src||'')+'</div>'
      +'<div class="n-ttl">'+(n.title||'')+'</div>'
      +'<div class="n-sum">'+(n.sum||n.summary||'')+'</div>'
      +'<button class="n-xbtn" id="nb-'+i+'">Read more</button></div>'
      +'<div class="n-body" id="nb-body-'+i+'"><div class="n-txt">'+(n.full||'')+'</div>'
      +'<a class="n-link" href="'+(n.url||'#')+'" target="_blank">Open source</a></div>';
    box.appendChild(d);
  });
}

// Toggles the expanded body of a news card and updates the "Read more / Collapse" button text.
function xNews(i){var b=document.getElementById('nb-body-'+i),btn=document.getElementById('nb-'+i);var o=b.classList.toggle('open');btn.textContent=o?'Collapse':'Read more';}


// ============ SEWER FACILITY LISTS ============

// Builds the clickable facility cards in the Sewers tab for CSO and SSO sites.
// Clicking a card (not the link) flies the map to that facility's location.
function buildFacList(type) {
  var sites=type==='cso'?CSO_SITES:SSO_SITES;
  var el=document.getElementById(type+'-fac-list');
  sites.forEach(function(s){
    var d=document.createElement('div'); d.className='fac';
    d.style.cssText='background:#fff;border-color:'+(type==='cso'?'#b2dfdb':'#bbdefb')+';';
    d.innerHTML='<div class="fac-name" style="color:'+(type==='cso'?'#004D40':'#1565C0')+'">'+s.name+'</div>'
      +'<div class="fac-desc">'+s.desc.substring(0,110)+'&hellip;</div>'
      +'<a href="'+s.url+'" target="_blank" style="font-size:9.5px;color:var(--riv)">Read source</a>';
    d.onclick=function(e){if(e.target.tagName!=='A'){map.setView([s.lat,s.lng],15);ST('flood');}};
    el.appendChild(d);
  });
}
buildFacList('cso');
buildFacList('sso');


// ============ SIDEBAR TOGGLE ============

var sbOpen = true;

// Collapses or expands the sidebar and updates the toggle button arrow.
// Calls map.invalidateSize() after the CSS transition completes so the map redraws correctly.
function toggleSB() {
  sbOpen = !sbOpen;
  document.querySelector('.sidebar').classList.toggle('sb-closed', !sbOpen);
  document.getElementById('sb-toggle').innerHTML = sbOpen ? '&#10094;' : '&#10095;';
  setTimeout(function(){ map.invalidateSize(); }, 280);
}


// ============ NEWS PANEL LOADER ============

// loadNewsPanel: fetches news-panel.html and injects it into #news-panel-mount,
// then kicks off the live news fetch once the markup is in the DOM.
//
// Why a separate file?
//   news-panel.html contains both the tab markup AND its own documentation
//   explaining exactly how the news scraping works. Keeping it separate makes
//   the news system self-contained and easy to find, read, and modify without
//   touching the main index.html.
//
// How it works:
//   1. fetch('news-panel.html') — loads the HTML fragment (no full page, just the panel)
//   2. .text() — reads it as a plain string
//   3. innerHTML on #news-panel-mount — drops it into the DOM where index.html
//      left the placeholder <div id="news-panel-mount"></div>
//   4. fetchNews(false) — now that #news-box and #rfbtn exist in the DOM,
//      the news fetch can safely run
//
// If the fetch fails (e.g. running index.html as a local file:// URL without a
// server), the mount div stays empty and fetchNews() is skipped gracefully.
async function loadNewsPanel() {
  try {
    var html = await fetch('news-panel.html').then(function(r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.text();
    });
    document.getElementById('news-panel-mount').innerHTML = html;
    fetchNews(false);
  } catch (e) {
    console.warn('news-panel.html could not be loaded:', e.message,
      '— serve files via a local HTTP server (e.g. python3 -m http.server) to enable the News tab.');
  }
}


// ============ INITIALIZATION ============

// Run on page load:
//   • renderList()      — populate the neighborhood list in the Flood Index tab
//   • fetchPrecip()     — get live NWS rainfall and update the header widget
//   • loadNewsPanel()   — fetch news-panel.html, inject it, then fetch news
//   • setInterval(...)  — re-fetch precipitation every 10 minutes
renderList();
fetchPrecip();
loadNewsPanel();
setInterval(fetchPrecip, 600000);
