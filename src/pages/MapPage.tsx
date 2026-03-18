import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  MapPin,
  Search,
  Hospital,
  Pill,
  Stethoscope,
  Phone,
  Clock,
  Navigation,
  X,
  Globe,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { useLanguage } from "@/contexts/useLanguage";
import { apiFetch } from "@/lib/api";

interface MedicalFacility {
  id: string;
  name: string;
  type: "pharmacy" | "hospital" | "clinic";
  coordinates: [number, number];
  address: string;
  phone: string;
  hours: string;
  website?: string;
  specializations?: string[];
  departments?: Record<string, string>;
  doctorSummary?: string;
  distance?: number;
}

// Global medical facilities database
const globalFacilities: MedicalFacility[] = [
  // Kazakhstan - Astana
  {
    id: "kz-1",
    name: "Central Pharmacy",
    type: "pharmacy",
    coordinates: [71.4306, 51.1283],
    address: "123 Mangilik El Ave, Astana",
    phone: "+7 (7172) 55-12-34",
    hours: "24/7",
    website: "https://pharmacy.kz",
  },
  {
    id: "kz-2",
    name: "City Medical Center",
    type: "hospital",
    coordinates: [71.4502, 51.1355],
    address: "45 Kenesary St, Astana",
    phone: "+7 (7172) 70-00-00",
    hours: "24/7",
    website: "https://cityhospital.kz",
    specializations: ["Emergency", "Surgery", "Cardiology"],
    departments: {
      reception: "+7 (7172) 70-00-00",
      emergency: "+7 (7172) 70-00-01",
      cardiology: "+7 (7172) 70-00-25",
    },
    doctorSummary: "Staffed with 150+ qualified physicians including specialists in emergency medicine, cardiology, and general surgery.",
  },
  {
    id: "kz-3",
    name: "Family Health Clinic",
    type: "clinic",
    coordinates: [71.4168, 51.1195],
    address: "78 Kabanbay Batyr Ave, Astana",
    phone: "+7 (7172) 32-45-67",
    hours: "Mon-Sat: 8:00 - 20:00",
    specializations: ["General Practice", "Pediatrics", "Dermatology"],
    departments: {
      reception: "+7 (7172) 32-45-67",
      pediatrics: "+7 (7172) 32-45-70",
    },
    doctorSummary: "A team of experienced family doctors and pediatricians providing comprehensive care for all ages.",
  },
  {
    id: "kz-4",
    name: "MediPharm Plus",
    type: "pharmacy",
    coordinates: [71.4589, 51.1412],
    address: "12 Turan Ave, Astana",
    phone: "+7 (7172) 43-21-00",
    hours: "08:00 - 22:00",
  },
  {
    id: "kz-5",
    name: "National Research Hospital",
    type: "hospital",
    coordinates: [71.4721, 51.1289],
    address: "2 Syganak St, Astana",
    phone: "+7 (7172) 70-55-55",
    hours: "24/7",
    website: "https://nrh.kz",
    specializations: ["Oncology", "Neurology", "Orthopedics"],
    doctorSummary: "Leading research hospital with internationally trained specialists in oncology and neurological disorders.",
  },
  // Kazakhstan - Almaty
  {
    id: "kz-6",
    name: "Almaty City Hospital",
    type: "hospital",
    coordinates: [76.9286, 43.2220],
    address: "15 Abay Ave, Almaty",
    phone: "+7 (727) 250-00-00",
    hours: "24/7",
    specializations: ["Emergency", "Trauma", "Internal Medicine"],
  },
  {
    id: "kz-7",
    name: "Green Pharmacy Almaty",
    type: "pharmacy",
    coordinates: [76.9458, 43.2380],
    address: "78 Dostyk Ave, Almaty",
    phone: "+7 (727) 330-55-66",
    hours: "08:00 - 23:00",
  },
  {
    id: "kz-8",
    name: "Shymkent Regional Hospital",
    type: "hospital",
    coordinates: [69.5901, 42.3242],
    address: "1 Tauke Khan Ave, Shymkent",
    phone: "+7 (7252) 55-55-55",
    hours: "24/7",
    website: "https://shymkentmed.kz",
    specializations: ["Trauma", "Cardiology", "Neurology"],
    doctorSummary: "Regional referral center serving southern Kazakhstan with trauma and neurology teams.",
  },
  {
    id: "kz-9",
    name: "Aktobe Family Clinic",
    type: "clinic",
    coordinates: [57.1533, 50.2830],
    address: "12 Bogenbai Batyr St, Aktobe",
    phone: "+7 (7132) 30-30-30",
    hours: "Mon-Sat: 8:00 - 20:00",
    specializations: ["Family Medicine", "Pediatrics"],
    doctorSummary: "Community clinic offering preventive care and pediatric follow-ups.",
  },
  // USA - New York
  {
    id: "us-1",
    name: "NYC General Hospital",
    type: "hospital",
    coordinates: [-73.9857, 40.7484],
    address: "550 1st Avenue, New York, NY",
    phone: "+1 (212) 555-0100",
    hours: "24/7",
    website: "https://nycgeneral.org",
    specializations: ["Emergency", "Cardiology", "Oncology", "Pediatrics"],
    departments: {
      reception: "+1 (212) 555-0100",
      emergency: "+1 (212) 555-0101",
      oncology: "+1 (212) 555-0133",
    },
    doctorSummary: "World-renowned medical center with over 2000 physicians and cutting-edge research facilities.",
  },
  {
    id: "us-2",
    name: "Manhattan Pharmacy",
    type: "pharmacy",
    coordinates: [-73.9772, 40.7529],
    address: "123 Madison Ave, New York, NY",
    phone: "+1 (212) 555-0200",
    hours: "07:00 - 22:00",
  },
  {
    id: "us-3",
    name: "Midtown Medical Clinic",
    type: "clinic",
    coordinates: [-73.9845, 40.7580],
    address: "350 5th Avenue, New York, NY",
    phone: "+1 (212) 555-0300",
    hours: "Mon-Fri: 8:00 - 18:00",
    specializations: ["General Practice", "Urgent Care", "Vaccination"],
  },
  {
    id: "us-4",
    name: "Chicago Lakeview Health",
    type: "clinic",
    coordinates: [-87.6462, 41.9410],
    address: "3200 N Lincoln Ave, Chicago, IL",
    phone: "+1 (312) 555-0400",
    hours: "Mon-Fri: 8:00 - 20:00",
    specializations: ["Primary Care", "Occupational Health"],
    doctorSummary: "Urban clinic with bilingual staff and evening hours for working families.",
  },
  // UK - London
  {
    id: "uk-1",
    name: "St. Thomas Hospital",
    type: "hospital",
    coordinates: [-0.1180, 51.4990],
    address: "Westminster Bridge Rd, London",
    phone: "+44 20 7188 7188",
    hours: "24/7",
    website: "https://guysandstthomas.nhs.uk",
    specializations: ["Emergency", "Cardiology", "Transplant"],
    departments: {
      reception: "+44 20 7188 7188",
      emergency: "+44 20 7188 5100",
    },
  },
  {
    id: "uk-2",
    name: "Boots Pharmacy Westminster",
    type: "pharmacy",
    coordinates: [-0.1276, 51.5074],
    address: "Piccadilly Circus, London",
    phone: "+44 20 7734 6126",
    hours: "08:00 - 21:00",
    website: "https://boots.com",
  },
  // Germany - Berlin
  {
    id: "de-1",
    name: "CharitГ© Hospital",
    type: "hospital",
    coordinates: [13.3777, 52.5252],
    address: "CharitГ©platz 1, Berlin",
    phone: "+49 30 450 50",
    hours: "24/7",
    website: "https://charite.de",
    specializations: ["Research", "Neurology", "Cardiology", "Oncology"],
    doctorSummary: "One of Europe's largest university hospitals with cutting-edge research and treatment facilities.",
  },
  {
    id: "de-2",
    name: "Berlin Apotheke",
    type: "pharmacy",
    coordinates: [13.3890, 52.5170],
    address: "Unter den Linden 50, Berlin",
    phone: "+49 30 2000 5000",
    hours: "08:00 - 20:00",
  },
  {
    id: "de-3",
    name: "Berlin City Clinic",
    type: "clinic",
    coordinates: [13.4049, 52.5201],
    address: "FriedrichstraГџe 10, Berlin",
    phone: "+49 30 1234 5678",
    hours: "Mon-Fri: 8:00 - 18:00",
    specializations: ["General Practice", "Internal Medicine"],
  },
  // Russia - Moscow
  {
    id: "ru-1",
    name: "Botkin Hospital",
    type: "hospital",
    coordinates: [37.5596, 55.7942],
    address: "Botkinsky Proezd, 5, Moscow",
    phone: "+7 (499) 490-03-03",
    hours: "24/7",
    specializations: ["Emergency", "Surgery", "Infectious Diseases"],
  },
  {
    id: "ru-2",
    name: "Pharmacy 36.6",
    type: "pharmacy",
    coordinates: [37.6173, 55.7558],
    address: "Tverskaya St, Moscow",
    phone: "+7 (495) 123-45-67",
    hours: "24/7",
    website: "https://366.ru",
  },
  {
    id: "ru-3",
    name: "Moscow Cardiovascular Clinic",
    type: "clinic",
    coordinates: [37.6208, 55.7577],
    address: "Ulitsa Bolshaya Dmitrovka, 7, Moscow",
    phone: "+7 (495) 777-77-77",
    hours: "Mon-Fri: 8:00 - 21:00",
    specializations: ["Cardiology", "Preventive Care"],
    doctorSummary: "Private clinic focused on cardiovascular risk assessment and rehabilitation.",
  },
  {
    id: "ru-4",
    name: "Sklifosovsky Emergency Research Institute",
    type: "hospital",
    coordinates: [37.6176, 55.7778],
    address: "Bolshaya Sukharevskaya Ploshchad, 3, Moscow",
    phone: "+7 (495) 600-07-07",
    hours: "24/7",
    specializations: ["Emergency", "Surgery", "Trauma"],
    departments: {
      reception: "+7 (495) 600-07-07",
      trauma: "+7 (495) 600-07-17",
    },
    doctorSummary: "Leading emergency research hospital handling complex trauma and disaster cases.",
  },
];

const typeConfig = {
  pharmacy: { icon: Pill, color: "#10B981", label: "pharmacy" as const },
  hospital: { icon: Hospital, color: "#0EA5E9", label: "hospital" as const },
  clinic: { icon: Stethoscope, color: "#8B5CF6", label: "clinic" as const },
};

const cityPresets: Array<{ label: string; coords: [number, number] }> = [
  { label: "Astana", coords: [71.4306, 51.1283] },
  { label: "Almaty", coords: [76.9286, 43.2220] },
  { label: "Shymkent", coords: [69.5901, 42.3242] },
  { label: "New York", coords: [-73.9857, 40.7484] },
  { label: "London", coords: [-0.1276, 51.5074] },
  { label: "Berlin", coords: [13.4049, 52.5200] },
];
const USE_MAPBOX = true;

export default function MapPage() {
  const { t } = useLanguage();
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<mapboxgl.Marker[]>([]);
  const userMarker = useRef<mapboxgl.Marker | null>(null);
  const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN;
  const [routeInfo, setRouteInfo] = useState("");
  const routeSourceId = "route-source";
  const [selectedFacility, setSelectedFacility] = useState<MedicalFacility | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState<string[]>(["pharmacy", "hospital", "clinic"]);
  const [specializationQuery, setSpecializationQuery] = useState("");
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [loading, setLoading] = useState(false);
  const [facilities, setFacilities] = useState<MedicalFacility[]>(globalFacilities);
  const [nearbyPharmacies, setNearbyPharmacies] = useState<MedicalFacility[]>([]);
  const [radiusKm, setRadiusKm] = useState(50);
  const [selectedCity, setSelectedCity] = useState("Astana");
  const [mapFailed, setMapFailed] = useState(false);
  const [mapError, setMapError] = useState("");
  const [mapReady, setMapReady] = useState(false);
  const autoLocateAttempted = useRef(false);

  const filteredFacilities = useMemo(
    () => {
      const normalizedSearch = searchQuery.toLowerCase().trim();
      const normalizedSpecialization = specializationQuery.toLowerCase().trim();
      const maxDistance = radiusKm;
      const filtered = facilities.filter((f) => {
        const textMatch =
          !normalizedSearch ||
          f.name.toLowerCase().includes(normalizedSearch) ||
          f.address.toLowerCase().includes(normalizedSearch) ||
          f.specializations?.some((s) => s.toLowerCase().includes(normalizedSearch));
        const specializationMatch =
          !normalizedSpecialization ||
          f.specializations?.some((s) => s.toLowerCase().includes(normalizedSpecialization));
        const typeMatch = activeFilters.includes(f.type);
        const distanceMatch =
          f.distance == null || f.distance <= maxDistance;
        return textMatch && specializationMatch && typeMatch && distanceMatch;
      });
      return filtered.sort((a, b) => (a.distance ?? Number.MAX_SAFE_INTEGER) - (b.distance ?? Number.MAX_SAFE_INTEGER));
    },
    [facilities, activeFilters, searchQuery, specializationQuery, radiusKm]
  );

  // Calculate distance between two coordinates
  const calculateDistance = useCallback(
    (lat1: number, lon1: number, lat2: number, lon2: number): number => {
      const R = 6371; // Earth's radius in km
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    },
    [],
  );

  const clearRoute = useCallback(() => {
    if (!map.current) return;
    if (map.current.getLayer(routeSourceId)) {
      try {
        map.current.removeLayer("route-line");
      } catch (e) {
        console.warn(e);
      }
      try {
        map.current.removeLayer("route-glow");
      } catch (e) {
        console.warn(e);
      }
    }
    if (map.current.getSource(routeSourceId)) {
      try {
        map.current.removeSource(routeSourceId);
      } catch (e) {
        console.warn(e);
      }
    }
    setRouteInfo("");
  }, [mapboxToken]);

  const drawRoute = useCallback(
    (geojson: GeoJSON.LineString, user: [number, number]) => {
      if (!map.current) return;
      clearRoute();
      if (!map.current.getSource(routeSourceId)) {
        map.current.addSource(routeSourceId, { type: "geojson", data: { type: "Feature", geometry: geojson } });
      } else {
        (map.current.getSource(routeSourceId) as mapboxgl.GeoJSONSource).setData({ type: "Feature", geometry: geojson });
      }
      if (!map.current.getLayer("route-line")) {
        map.current.addLayer({
          id: "route-line",
          type: "line",
          source: routeSourceId,
          layout: { "line-cap": "round", "line-join": "round" },
          paint: { "line-color": "#1FA37A", "line-width": 7, "line-opacity": 0.9 },
        });
      }
      if (!map.current.getLayer("route-glow")) {
        map.current.addLayer({
          id: "route-glow",
          type: "line",
          source: routeSourceId,
          layout: { "line-cap": "round", "line-join": "round" },
          paint: { "line-color": "#10B981", "line-width": 16, "line-opacity": 0.35 },
        });
      }
      const bounds = new mapboxgl.LngLatBounds(user, user);
      geojson.coordinates.forEach((coord) => bounds.extend(coord as [number, number]));
      map.current.fitBounds(bounds, { padding: 60 });
    },
    [clearRoute],
  );
  const fetchFacilitiesOverpass = useCallback(async (lat: number, lon: number, radius: number) => {
    const params = new URLSearchParams({
      lat: String(lat),
      lon: String(lon),
      radius: String(radius),
    });
    const { data } = await apiFetch<{ data: MedicalFacility[] }>(`/facilities?${params.toString()}`);
    return Array.isArray(data) ? data : [];
  }, []);

  const loadFacilities = useCallback(
    async (coords: [number, number], radKm: number) => {
      const [lon, lat] = coords;
      const radiusMeters = Math.max(1000, Math.min(200000, Math.round(radKm * 1000)));
      try {
        const data = await fetchFacilitiesOverpass(lat, lon, radiusMeters);
        if (data && data.length) {
          const decorated = data.map((facility) => ({
            ...facility,
            distance: calculateDistance(lat, lon, facility.coordinates[1], facility.coordinates[0]),
          }));
          setFacilities(decorated);
          return decorated;
        }
      } catch (error) {
        console.warn("facility fetch failed, falling back to defaults", error);
      }
      const fallback = globalFacilities.map((facility) => ({
        ...facility,
        distance: calculateDistance(lat, lon, facility.coordinates[1], facility.coordinates[0]),
      }));
      setFacilities(fallback);
      return fallback;
    },
    [calculateDistance, fetchFacilitiesOverpass],
  );

  const centerMapOnLocation = useCallback((coords: [number, number], zoom = 12) => {
    if (!map.current || !mapReady) return;
    map.current.flyTo({
      center: coords,
      zoom,
      duration: 1200,
    });
    if (userMarker.current) {
      userMarker.current.setLngLat(coords);
    } else {
      userMarker.current = new mapboxgl.Marker({ color: "#ef4444" })
        .setLngLat(coords)
        .addTo(map.current);
    }
  }, [mapReady]);

  const fetchRouteToFacility = useCallback(
    async (facility: MedicalFacility) => {
      if (!userLocation) return;
      const url = `https://router.project-osrm.org/route/v1/driving/${userLocation[0]},${userLocation[1]};${facility.coordinates[0]},${facility.coordinates[1]}?overview=full&geometries=geojson&steps=false`;
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error("Routing failed");
        const data = await res.json();
        const route = data.routes?.[0];
        if (!route) throw new Error("No route");
        drawRoute(route.geometry, userLocation);
        const distanceKm = route.distance ? route.distance / 1000 : 0;
        const durationMin = route.duration ? Math.round(route.duration / 60) : 0;
        setRouteInfo(`Distance ${distanceKm.toFixed(1)} km | ~${durationMin} min`);
      } catch (error) {
        console.warn("Route error", error);
        setRouteInfo("Не удалось проложить маршрут");
      }
    },
    [userLocation, drawRoute],
  );

  // Get user location
  const getUserLocation = useCallback(() => {
    setLoading(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const coords: [number, number] = [position.coords.longitude, position.coords.latitude];
          setUserLocation(coords);
          await loadFacilities(coords, radiusKm);
          centerMapOnLocation(coords, 13);
          setLoading(false);
        },
        (error) => {
          console.error("Geolocation error:", error);
          setLoading(false);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
      );
    } else {
      setLoading(false);
    }
  }, [centerMapOnLocation, loadFacilities, radiusKm]);

  const focusCity = async (cityLabel: string) => {
    const preset = cityPresets.find((item) => item.label === cityLabel);
    if (!preset) return;
    setSelectedCity(cityLabel);
    setUserLocation(preset.coords);
    await loadFacilities(preset.coords, radiusKm);
    if (map.current) {
      map.current.flyTo({
        center: preset.coords,
        zoom: 12,
        duration: 1300,
      });
      if (userMarker.current) {
        userMarker.current.setLngLat(preset.coords);
      } else {
        userMarker.current = new mapboxgl.Marker({ color: "#ef4444" })
          .setLngLat(preset.coords)
          .addTo(map.current);
      }
    }
  };

  useEffect(() => {
    if (!mapContainer.current || map.current) return;
    if (!USE_MAPBOX) {
      setMapFailed(true);
      setMapError("Mapbox disabled for stability mode");
      return;
    }

    if (!mapboxToken) {
      console.warn("Mapbox token is missing. Set VITE_MAPBOX_TOKEN in your environment.");
      setMapFailed(true);
      setMapError("Missing Mapbox token");
      return;
    }
    mapboxgl.accessToken = mapboxToken;
    let loadTimeout: ReturnType<typeof setTimeout> | null = null;
    let loaded = false;
    try {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: "mapbox://styles/mapbox/light-v11",
        center: [71.4306, 51.1283],
        zoom: 3,
      });

      map.current.on("error", (evt) => {
        const message = evt?.error?.message || "Mapbox rendering error";
        setMapFailed(true);
        setMapError(message);
      });
      map.current.on("load", () => {
        loaded = true;
        setMapReady(true);
        map.current?.resize();
        setTimeout(() => map.current?.resize(), 100);
      });
      loadTimeout = setTimeout(() => {
        if (!loaded) {
          setMapFailed(true);
          setMapError("Mapbox load timeout");
        }
      }, 7000);

      map.current.addControl(new mapboxgl.NavigationControl(), "top-right");
      map.current.addControl(new mapboxgl.GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        trackUserLocation: true,
      }), "top-right");
    } catch (error) {
      setMapFailed(true);
      setMapError(error instanceof Error ? error.message : "Mapbox init failed");
      return;
    }

    return () => {
      if (loadTimeout) clearTimeout(loadTimeout);
      map.current?.remove();
      map.current = null;
    };
  }, [mapboxToken]);

  useEffect(() => {
    if (!mapReady || !map.current) return;
    map.current.resize();
  }, [mapReady]);

  useEffect(() => {
    if (!userLocation) return;
    centerMapOnLocation(userLocation, 13);
  }, [centerMapOnLocation, userLocation]);

  useEffect(() => {
    if (autoLocateAttempted.current) return;
    autoLocateAttempted.current = true;
    getUserLocation();
  }, [getUserLocation]);

  useEffect(() => {
    const preset = cityPresets.find((item) => item.label === selectedCity) || cityPresets[0];
    if (!preset) return;
    setUserLocation(preset.coords);
    void loadFacilities(preset.coords, radiusKm);
  }, [selectedCity, loadFacilities]);

  useEffect(() => {
    if (!userLocation) return;
    const nearby = facilities
      .filter((entry) => entry.type === "pharmacy" && (entry.distance ?? 0) <= radiusKm)
      .sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0));
    setNearbyPharmacies(nearby);
  }, [facilities, radiusKm, userLocation]);

  useEffect(() => {
    if (!map.current) return;

    const desiredIds = new Set(filteredFacilities.map((facility) => facility.id));

    // Remove markers that are no longer needed
    markers.current.forEach((marker) => {
      const id = marker.getElement().dataset.id;
      if (id && !desiredIds.has(id)) {
        marker.remove();
      }
    });

    markers.current = markers.current.filter((marker) => {
      const id = marker.getElement().dataset.id;
      return !!id && desiredIds.has(id);
    });

    // Add or update markers for current facilities
    filteredFacilities.forEach((facility) => {
      let existing = markers.current.find((marker) => marker.getElement().dataset.id === facility.id);
      if (existing) {
        existing.setLngLat(facility.coordinates);
        return;
      }

      const config = typeConfig[facility.type];
      const el = document.createElement("div");
      el.setAttribute("data-id", facility.id);
      el.className = "custom-marker";
      el.innerHTML = `
        <div style="
          width: 54px;
          height: 54px;
          background: ${config.color};
          clip-path: polygon(25% 6%, 75% 6%, 94% 50%, 75% 94%, 25% 94%, 6% 50%);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 8px 22px ${config.color}55;
          cursor: pointer;
          border: 2px solid #ffffff;
          transition: transform 0.25s ease, filter 0.25s ease;
        ">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            ${facility.type === "pharmacy" ? '<path d="M10.5 20H4a2 2 0 0 1-2-2V5c0-1.1.9-2 2-2h3.93a2 2 0 0 1 1.66.9l.82 1.2a2 2 0 0 0 1.66.9H20a2 2 0 0 1 2 2v2.5"/><circle cx="16.5" cy="17.5" r="2.5"/><path d="M18.5 15.5v4"/><path d="M16.5 17.5h4"/>' : ''}
            ${facility.type === "hospital" ? '<path d="M12 6v4"/><path d="M14 14h-4"/><path d="M14 18h-4"/><path d="M14 8h-4"/><path d="M18 12h2a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-9a2 2 0 0 1 2-2h2"/><path d="M18 22V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v18"/>' : ''}
            ${facility.type === "clinic" ? '<path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3"/><path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4"/><circle cx="20" cy="10" r="2"/>' : ''}
          </svg>
        </div>
      `;

      const innerDot = el.firstElementChild as HTMLElement | null;
      const scaleMarker = (scale: string) => {
        if (innerDot) {
          innerDot.style.transform = scale;
          innerDot.style.filter = scale === "scale(1)" ? "brightness(1)" : "brightness(1.1)";
        }
      };
      el.addEventListener("mouseenter", () => scaleMarker("scale(1.16)"));
      el.addEventListener("mouseleave", () => scaleMarker("scale(1)"));
      el.addEventListener("click", () => {
        setSelectedFacility(facility);
        map.current?.flyTo({
          center: facility.coordinates,
          zoom: 15,
          duration: 1000,
        });
        fetchRouteToFacility(facility);
      });

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat(facility.coordinates)
        .addTo(map.current!);

      markers.current.push(marker);
    });
  }, [filteredFacilities, fetchRouteToFacility]);

  const toggleFilter = (type: string) => {
    setActiveFilters((prev) =>
      prev.includes(type)
        ? prev.filter((f) => f !== type)
        : [...prev, type]
    );
  };

  const flyToFacility = (facility: MedicalFacility) => {
    setSelectedFacility(facility);
    map.current?.flyTo({
      center: facility.coordinates,
      zoom: 15,
      duration: 1000,
    });
    fetchRouteToFacility(facility);
  };

  const getTypeLabel = (type: "pharmacy" | "hospital" | "clinic") => {
    return t[typeConfig[type].label];
  };

  const openDirections = (facility: MedicalFacility) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${facility.coordinates[1]},${facility.coordinates[0]}`;
    window.open(url, "_blank");
  };

  const mapCenter =
    selectedFacility?.coordinates ||
    userLocation ||
    cityPresets.find((city) => city.label === selectedCity)?.coords ||
    [71.4306, 51.1283];

  const osmEmbedUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${mapCenter[0] - 0.4}%2C${mapCenter[1] - 0.25}%2C${mapCenter[0] + 0.4}%2C${mapCenter[1] + 0.25}&layer=mapnik&marker=${mapCenter[1]}%2C${mapCenter[0]}`;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1 pt-16">
        <div className="flex flex-col md:flex-row h-[calc(100vh-4rem)]">
          {/* Sidebar */}
          <div className="w-full md:w-[30rem] md:border-r border-border bg-card flex flex-col overflow-hidden md:h-full h-[56vh]">
            {/* Search Header */}
            <div className="p-4 border-b border-border space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-secondary/20 flex items-center justify-center">
                    <MapPin className="w-6 h-6 text-secondary" />
                  </div>
                  <div>
                    <h1 className="font-display text-xl font-semibold">{t.findCare}</h1>
                    <p className="text-sm text-muted-foreground">{t.nearbyFacilities}</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={getUserLocation}
                  disabled={loading}
                  className="gap-1"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Navigation className="w-4 h-4" />}
                </Button>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder={`${t.search}...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Input
                placeholder={`${t.specialization}...`}
                value={specializationQuery}
                onChange={(e) => setSpecializationQuery(e.target.value)}
              />

              {/* Filters */}
              <div className="flex gap-2">
                {Object.entries(typeConfig).map(([type, config]) => {
                  const Icon = config.icon;
                  const isActive = activeFilters.includes(type);
                  return (
                    <Button
                      key={type}
                      variant={isActive ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleFilter(type)}
                      className="gap-1.5 flex-1"
                      style={{
                        backgroundColor: isActive ? config.color : undefined,
                        borderColor: isActive ? config.color : undefined,
                      }}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span className="text-xs">{t[config.label]}</span>
                    </Button>
                  );
                })}
              </div>
              {userLocation && (
                <div className="mt-3 px-3 py-2 bg-muted/50 rounded-lg text-xs text-muted-foreground space-y-2">
                  <div className="flex items-center justify-between">
                    <span>Nearby pharmacies within {radiusKm} km:</span>
                    <span className="text-primary font-semibold">{nearbyPharmacies.length}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-muted-foreground">Radius</span>
                    <input
                      type="range"
                      min={10}
                      max={120}
                      value={radiusKm}
                      onChange={(e) => setRadiusKm(Number(e.target.value))}
                      className="flex-1"
                    />
                    <span className="text-xs">{radiusKm} km</span>
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    {nearbyPharmacies.length > 0
                      ? nearbyPharmacies.slice(0, 3).map((pharmacy) => pharmacy.name).join(", ")
                      : t.noResults}
                  </div>
                </div>
              )}
              <div className="mt-2 space-y-1">
                <div className="text-xs text-muted-foreground">New city quick jump</div>
                <div className="flex flex-wrap gap-1">
                  {cityPresets.map((city) => (
                    <Button
                      key={city.label}
                      variant={selectedCity === city.label ? "default" : "outline"}
                      size="sm"
                      className="text-[11px] px-2 py-1 h-7"
                      onClick={() => focusCity(city.label)}
                    >
                      {city.label}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            {/* Facility List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {filteredFacilities.map((facility) => {
                const config = typeConfig[facility.type];
                const Icon = config.icon;
                const isSelected = selectedFacility?.id === facility.id;

                return (
                  <motion.div
                    key={facility.id}
                    layout
                    onClick={() => flyToFacility(facility)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? "border-primary bg-primary/5 shadow-medical"
                        : "border-border bg-card hover:border-primary/30"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: `${config.color}20` }}
                      >
                        <Icon className="w-5 h-5" style={{ color: config.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm truncate">{facility.name}</h3>
                        <p className="text-xs text-muted-foreground truncate">{facility.address}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span
                            className="text-xs px-2 py-0.5 rounded-full"
                            style={{ backgroundColor: `${config.color}20`, color: config.color }}
                          >
                            {getTypeLabel(facility.type)}
                          </span>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {facility.hours}
                          </span>
                          {facility.distance !== undefined && (
                            <span className="text-xs text-primary font-medium">
                              {facility.distance.toFixed(1)} km
                            </span>
                          )}
                        </div>
                        {facility.specializations && facility.specializations.length > 0 && (
                          <p className="text-[11px] text-muted-foreground mt-1 line-clamp-1">
                            {facility.specializations.join(", ")}
                          </p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}

              {filteredFacilities.length === 0 && (
                <div className="text-center py-8">
                  <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">No facilities found</p>
                </div>
              )}
            </div>
          </div>

          {/* Map */}
          <div className="block flex-1 relative min-h-[44vh] md:min-h-0">
            {USE_MAPBOX && (
              <div
                ref={mapContainer}
                className={`absolute inset-0 z-20 transition-opacity duration-300 ${
                  mapReady ? "opacity-100" : "opacity-0 pointer-events-none"
                }`}
              />
            )}
            {(!USE_MAPBOX || mapFailed || !mapboxToken || !mapReady) && (
              <div className="absolute inset-0 z-10 bg-background">
                <iframe
                  title="OpenStreetMap Fallback"
                  src={osmEmbedUrl}
                  className="w-full h-full border-0"
                  loading="lazy"
                />
              </div>
            )}
            {USE_MAPBOX && !mapFailed && Boolean(mapboxToken) && !mapReady && (
              <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/80">
                <div className="text-sm text-muted-foreground flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading map...
                </div>
              </div>
            )}
            {(!USE_MAPBOX || mapFailed || !mapboxToken) && (
              <div className="absolute left-3 bottom-3 z-30 bg-card/95 border border-border rounded-md px-3 py-2 text-xs text-muted-foreground max-w-[28rem]">
                Fallback map is active{mapError ? `. ${mapError}` : "."}
              </div>
            )}

            {/* Selected Facility Panel */}
            {selectedFacility && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="absolute top-4 right-4 w-[26rem] bg-card rounded-xl shadow-xl border border-border overflow-hidden"
              >
                <div className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-12 h-12 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: `${typeConfig[selectedFacility.type].color}20` }}
                      >
                        {(() => {
                          const Icon = typeConfig[selectedFacility.type].icon;
                          return <Icon className="w-6 h-6" style={{ color: typeConfig[selectedFacility.type].color }} />;
                        })()}
                      </div>
                      <div>
                        <h3 className="font-display font-semibold">{selectedFacility.name}</h3>
                        <span
                          className="text-xs px-2 py-0.5 rounded-full"
                          style={{
                            backgroundColor: `${typeConfig[selectedFacility.type].color}20`,
                            color: typeConfig[selectedFacility.type].color,
                          }}
                        >
                          {getTypeLabel(selectedFacility.type)}
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-8 h-8"
                      onClick={() => setSelectedFacility(null)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      {selectedFacility.address}
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="w-4 h-4" />
                      <a href={`tel:${selectedFacility.phone}`} className="hover:text-primary">
                        {selectedFacility.phone}
                      </a>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      {selectedFacility.hours}
                    </div>
                    {selectedFacility.website && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Globe className="w-4 h-4" />
                        <a 
                          href={selectedFacility.website} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="hover:text-primary flex items-center gap-1"
                        >
                          Website <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}
                    {selectedFacility.distance !== undefined && (
                      <div className="flex items-center gap-2 text-primary font-medium">
                        <Navigation className="w-4 h-4" />
                        {selectedFacility.distance.toFixed(1)} km away
                      </div>
                    )}
                  </div>

                  {selectedFacility.specializations && (
                    <div className="mt-3">
                      <p className="text-xs font-medium mb-2">Specializations</p>
                      <div className="flex flex-wrap gap-1">
                        {selectedFacility.specializations.map((spec) => (
                          <span key={spec} className="text-xs bg-muted px-2 py-1 rounded-full">
                            {spec}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedFacility.departments && Object.keys(selectedFacility.departments).length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs font-medium mb-2">Department numbers</p>
                      <div className="space-y-1">
                        {Object.entries(selectedFacility.departments).map(([dep, phone]) => (
                          <p key={dep} className="text-xs text-muted-foreground">
                            {dep}: {phone}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedFacility.doctorSummary && (
                    <div className="mt-3 p-3 bg-muted/50 rounded-lg">
                      <p className="text-xs font-medium mb-1">About the Medical Staff</p>
                      <p className="text-xs text-muted-foreground">{selectedFacility.doctorSummary}</p>
                    </div>
                  )}

                  {routeInfo && (
                    <div className="mt-3 px-3 py-2 rounded-lg bg-primary/10 text-primary text-xs font-medium">
                      {routeInfo}
                    </div>
                  )}

                  <Button 
                    className="w-full mt-4 gap-2 medical-gradient"
                    onClick={() => openDirections(selectedFacility)}
                  >
                    <Navigation className="w-4 h-4" />
                    {t.getDirections}
                  </Button>
                </div>
              </motion.div>
            )}

          </div>
        </div>
      </main>
    </div>
  );
}



