// map.js — инициализация Mapbox и управление маркерами

export let mapInitialized = false;
export let map = null;
export let usingLeaflet = false;
export let userLocation = null;
let currentRouteLayer = null;

export function initMapbox(mapboxToken) {
  const container = document.getElementById('map');
  if (!container) {
    console.error('Map container not found');
    return;
  }
  // prevent double init
  if (mapInitialized) {
    try { if (map && typeof map.resize === 'function') map.resize(); } catch(e){}
    try { if (map && typeof map.invalidateSize === 'function') map.invalidateSize(); } catch(e){}
    return map;
  }

  // if token is missing or left as placeholder, fallback to Leaflet + OSM tiles
  const tokenMissing = !mapboxToken || mapboxToken.indexOf('YOUR_MAPBOX_ACCESS_TOKEN') !== -1;
  if (tokenMissing) {
    if (typeof L === 'undefined') {
      console.error('Leaflet not loaded — cannot initialize fallback map');
      return;
    }
    // clear container and create leaflet map
    container.innerHTML = '';
    map = L.map('map').setView([55.7558, 37.6173], 10);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);
    L.marker([55.7558, 37.6173]).addTo(map).bindPopup('Москва (пример)').openPopup();
    mapInitialized = true;
    usingLeaflet = true;
    // attempt to locate user and mark hospitals
    try { locateAndMarkHospitals(map); } catch (e) { console.warn('locate failed', e); }
    return map;
  }

  if (typeof mapboxgl === 'undefined') {
    console.error('Mapbox GL JS not loaded');
    return;
  }
  mapboxgl.accessToken = mapboxToken;
  map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/streets-v11',
    center: [37.6173, 55.7558], // Москва по умолчанию
    zoom: 10
  });
  map.addControl(new mapboxgl.NavigationControl());
  // Example marker
  new mapboxgl.Marker().setLngLat([37.6173, 55.7558]).setPopup(new mapboxgl.Popup().setText('Москва (пример)')).addTo(map);
  mapInitialized = true;
  usingLeaflet = false;
  // attempt to locate user and mark hospitals
  try { locateAndMarkHospitals(map); } catch (e) { console.warn('locate failed', e); }
  return map;
}

export function ensureMap() { return map; }

// get user's location and query nearby hospitals via Overpass API
export function locateAndMarkHospitals(theMap) {
  if (!navigator.geolocation) {
    console.warn('Geolocation not supported');
    return;
  }
  navigator.geolocation.getCurrentPosition(async (pos) => {
    const lat = pos.coords.latitude;
    const lon = pos.coords.longitude;
    // center map
    try {
      if (usingLeaflet && typeof L !== 'undefined') {
        theMap.setView([lat, lon], 12);
        L.circle([lat, lon], { radius: 50, color: '#1fa37a', fillOpacity: 0.2 }).addTo(theMap);
        L.marker([lat, lon], { title: 'Вы здесь' }).addTo(theMap).bindPopup('Вы здесь').openPopup();
        userLocation = { lat, lon };
      } else if (typeof mapboxgl !== 'undefined' && theMap && typeof theMap.flyTo === 'function') {
        theMap.flyTo({ center: [lon, lat], zoom: 12 });
        // add a user marker
        new mapboxgl.Marker({ color: '#1fa37a' }).setLngLat([lon, lat]).setPopup(new mapboxgl.Popup().setText('Вы здесь')).addTo(theMap);
        userLocation = { lat, lon };
      }
    } catch (e) { console.warn('center failed', e); }

    // query Overpass for hospitals around user; expand radius if none found
    let radius = 50000; // 50 km
    let hospitals = [];
    for (let i = 0; i < 4; i++) {
      try {
        hospitals = await fetchHospitalsOverpass(lat, lon, radius);
        if (hospitals && hospitals.length > 0) break;
      } catch (e) {
        console.warn('overpass query failed', e);
      }
      radius *= 2; // expand search radius
    }

    // add markers
    if (hospitals && hospitals.length) {
      hospitals.forEach(h => addHospitalMarker(h, theMap));
    } else {
      console.info('No hospitals found nearby');
    }

  }, (err) => {
    console.warn('Geolocation error', err);
  }, { enableHighAccuracy: true, timeout: 10000 });
}

async function fetchHospitalsOverpass(lat, lon, radius) {
  const query = `[out:json][timeout:25];(node["amenity"="hospital"](around:${radius},${lat},${lon});way["amenity"="hospital"](around:${radius},${lat},${lon});relation["amenity"="hospital"](around:${radius},${lat},${lon}););out center;`;
  const res = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
    body: query
  });
  if (!res.ok) throw new Error('Overpass query failed');
  const data = await res.json();
  return (data.elements || []).map(el => {
    const latlon = el.type === 'node' ? { lat: el.lat, lon: el.lon } : (el.center ? { lat: el.center.lat, lon: el.center.lon } : null);
    return { id: el.id, type: el.type, lat: latlon ? latlon.lat : null, lon: latlon ? latlon.lon : null, tags: el.tags || {} };
  }).filter(x => x.lat && x.lon);
}

function addHospitalMarker(hosp, theMap) {
  const title = hosp.tags.name || 'Больница';
  const info = [];
  if (hosp.tags['addr:street']) info.push(hosp.tags['addr:street']);
  if (hosp.tags['addr:housenumber']) info.push(hosp.tags['addr:housenumber']);
  if (hosp.tags['addr:city']) info.push(hosp.tags['addr:city']);
  const popupText = `<strong>${escapeHtml(title)}</strong><br/>${escapeHtml(info.join(', '))}`;
  try {
    if (usingLeaflet && typeof L !== 'undefined') {
      const marker = L.marker([hosp.lat, hosp.lon], { title }).addTo(theMap).bindPopup(popupText);
      marker.on('click', () => {
        if (userLocation) computeAndDisplayRoute(userLocation, { lat: hosp.lat, lon: hosp.lon }, theMap);
      });
    } else if (typeof mapboxgl !== 'undefined' && map && typeof mapboxgl.Marker === 'function') {
      // create DOM element for marker for better styling
      const el = document.createElement('div');
      el.className = 'hospital-marker';
      el.style.width = '18px';
      el.style.height = '18px';
      el.style.background = '#e74c3c';
      el.style.borderRadius = '50%';
      el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.4)';
      const marker = new mapboxgl.Marker(el).setLngLat([hosp.lon, hosp.lat]).setPopup(new mapboxgl.Popup().setHTML(popupText)).addTo(map);
      el.addEventListener('click', () => {
        if (userLocation) computeAndDisplayRoute(userLocation, { lat: hosp.lat, lon: hosp.lon }, theMap);
      });
    }
  } catch (e) { console.warn('marker add failed', e); }
}

// animate route drawing and moving neon marker
function animateRoute(geo, theMap, durationSec) {
  // clamp duration between 4s and 12s for animation
  const animDuration = Math.max(4, Math.min(12, durationSec || 8));
  const coords = geo.coordinates.slice();

  if (usingLeaflet && typeof L !== 'undefined') {
    // Leaflet expects [lat,lon]
    const latlngs = coords.map(c => [c[1], c[0]]);
    const baseLine = L.polyline([], { color: '#00f2ff', weight: 6, opacity: 0.95, className: 'neon-route' }).addTo(theMap);
    const glowLine = L.polyline([], { color: '#6c63ff', weight: 12, opacity: 0.6, className: 'neon-route-glow' }).addTo(theMap);

    let start = null;
    function step(ts) {
      if (!start) start = ts;
      const t = (ts - start) / (animDuration * 1000);
      const frac = Math.min(1, t);
      const upto = Math.floor(frac * (latlngs.length - 1));
      const partial = latlngs.slice(0, upto + 1);
      // append a small interpolated point between upto and upto+1
      if (upto < latlngs.length - 1) {
        const a = latlngs[upto];
        const b = latlngs[upto + 1];
        const subFrac = (frac * (latlngs.length - 1)) - upto;
        const ix = a[0] + (b[0] - a[0]) * subFrac;
        const iy = a[1] + (b[1] - a[1]) * subFrac;
        partial.push([ix, iy]);
        // mover removed to avoid jitter; only draw the route
      } else {
        // finished segment
      }
      baseLine.setLatLngs(partial);
      glowLine.setLatLngs(partial);
      if (frac < 1) requestAnimationFrame(step); else {
        // finished
      }
    }
    requestAnimationFrame(step);
    // store currentRouteLayer for removal
    currentRouteLayer = { leaflet: [baseLine, glowLine] };
  } else if (typeof mapboxgl !== 'undefined' && map) {
    const id = 'route-anim-source';
    const layerId = 'route-anim-layer';
    const glowId = 'route-anim-glow';
    // ensure source
    if (!map.getSource(id)) map.addSource(id, { type: 'geojson', data: { type: 'Feature', geometry: { type: 'LineString', coordinates: [] } } });
    if (!map.getLayer(layerId)) map.addLayer({ id: layerId, type: 'line', source: id, layout: {}, paint: { 'line-color': '#00f2ff', 'line-width': 6, 'line-opacity': 0.95 } });
    if (!map.getLayer(glowId)) map.addLayer({ id: glowId, type: 'line', source: id, layout: {}, paint: { 'line-color': '#6c63ff', 'line-width': 12, 'line-opacity': 0.6 } }, layerId);

    let start = null;
    function step(ts) {
      if (!start) start = ts;
      const t = (ts - start) / (animDuration * 1000);
      const frac = Math.min(1, t);
      const upto = Math.floor(frac * (coords.length - 1));
      const partial = coords.slice(0, upto + 1);
      if (upto < coords.length - 1) {
        const a = coords[upto];
        const b = coords[upto + 1];
        const subFrac = (frac * (coords.length - 1)) - upto;
        const ix = a[0] + (b[0] - a[0]) * subFrac;
        const iy = a[1] + (b[1] - a[1]) * subFrac;
        partial.push([ix, iy]);
        // mover removed to avoid jitter; only update route geometry
      } else {
        // finished
      }
      const src = map.getSource(id);
      if (src && src.setData) src.setData({ type: 'Feature', geometry: { type: 'LineString', coordinates: partial } });
      if (frac < 1) requestAnimationFrame(step); else {
        // finished
      }
    }
    requestAnimationFrame(step);
    currentRouteLayer = { mapbox: { sourceId: id, layerId, glowId } };
  }

}
// compute route using OSRM public server and draw on current map
async function computeAndDisplayRoute(from, to, theMap) {
  if (!from || !to) return;
  // remove existing route
  try { removeCurrentRoute(); } catch (e) {}

  const url = `https://router.project-osrm.org/route/v1/driving/${from.lon},${from.lat};${to.lon},${to.lat}?overview=full&geometries=geojson&alternatives=false&steps=false`;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error('Routing failed');
    const data = await res.json();
    if (!data.routes || !data.routes.length) throw new Error('No route');
    const route = data.routes[0];
    const geo = route.geometry;
    const distance = route.distance; // meters
    const duration = route.duration; // seconds

    // draw
    if (usingLeaflet && typeof L !== 'undefined') {
      currentRouteLayer = L.geoJSON(geo, { style: { color: '#1fa37a', weight: 5, opacity: 0.85 } }).addTo(theMap);
      theMap.fitBounds(currentRouteLayer.getBounds(), { padding: [40,40] });
      // animate neon route
      animateRoute(geo, theMap, Math.max(4, Math.min(12, Math.round(duration/60))));
    } else if (typeof mapboxgl !== 'undefined' && map) {
      // add/update source and layer
      const id = 'route-source';
      if (map.getSource && map.getSource(id)) {
        map.getSource(id).setData(geo);
      } else {
        map.addSource(id, { type: 'geojson', data: geo });
        map.addLayer({ id: 'route-layer', type: 'line', source: id, layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': '#1fa37a', 'line-width': 6, 'line-opacity': 0.9 } });
      }
      // compute bounds
      const coords = geo.coordinates;
      const bounds = coords.reduce(function(b, coord) { return b.extend(coord); }, new mapboxgl.LngLatBounds(coords[0], coords[0]));
      map.fitBounds(bounds, { padding: 40 });
      currentRouteLayer = { sourceId: id, layerId: 'route-layer' };
      // animate neon route
      animateRoute(geo, theMap, Math.max(4, Math.min(12, Math.round(duration/60))));
    }

    // show brief info
    const km = (distance/1000).toFixed(1);
    const mins = Math.round(duration/60);
    showRouteInfo(`Дистанция: ${km} км · Время: ${mins} мин`);
  } catch (e) {
    console.warn('route error', e);
    showRouteInfo('Не удалось проложить маршрут');
  }
}

function removeCurrentRoute() {
  if (!currentRouteLayer) return;
  if (usingLeaflet && typeof L !== 'undefined') {
    try {
      // if stored as array [baseLine, glowLine, mover]
      if (Array.isArray(currentRouteLayer.leaflet)) {
        currentRouteLayer.leaflet.forEach(i => { try { i.remove(); } catch(e){} });
      } else if (currentRouteLayer && typeof currentRouteLayer.remove === 'function') {
        try { currentRouteLayer.remove(); } catch (e) {}
      }
    } catch (e) {}
  } else if (map && currentRouteLayer) {
    try {
      const mb = currentRouteLayer.mapbox || currentRouteLayer;
      if (mb.layerId && map.getLayer && map.getLayer(mb.layerId)) {
        try { map.removeLayer(mb.layerId); } catch (e) {}
      }
      if (mb.glowId && map.getLayer && map.getLayer(mb.glowId)) {
        try { map.removeLayer(mb.glowId); } catch (e) {}
      }
      if (mb.sourceId && map.getSource && map.getSource(mb.sourceId)) {
        try { map.removeSource(mb.sourceId); } catch (e) {}
      }
    } catch (e) {}
  }
  currentRouteLayer = null;
  // clear info
  showRouteInfo('');
}

function showRouteInfo(text) {
  let el = document.getElementById('routeInfo');
  if (!el) {
    el = document.createElement('div');
    el.id = 'routeInfo';
    el.style.position = 'fixed';
    el.style.bottom = '22px';
    el.style.left = '50%';
    el.style.transform = 'translateX(-50%)';
    el.style.background = 'rgba(0,0,0,0.6)';
    el.style.color = '#fff';
    el.style.padding = '10px 16px';
    el.style.borderRadius = '12px';
    el.style.zIndex = 60;
    document.body.appendChild(el);
  }
  el.textContent = text;
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/[&<>"']/g, (s) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"})[s]);
}
