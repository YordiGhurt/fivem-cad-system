'use client';

import { useEffect } from 'react';
import { MapContainer, ImageOverlay, Marker, Popup } from 'react-leaflet';
import L, { CRS } from 'leaflet';
import 'leaflet/dist/leaflet.css';

// GTA5 Weltkarte – Koordinatensystem
// GTA5 Welt: X: -4096 bis 4096, Y: -4096 bis 4096
// Leaflet CRS.Simple: lat = GTA5_Y, lng = GTA5_X
//
// Karten-Bild: Lege eine gta5-map.jpg in das /public/images/ Verzeichnis.
// Ein frei verfügbares GTA5-Kartenbild findest du z.B. im FiveM-Forum oder
// auf GitHub (z.B. https://github.com/nicog98/gta5-map-tiles).
// Alternativ: CDN-URL direkt als GTA5_MAP_IMAGE_URL eintragen.
const GTA5_MAP_IMAGE_URL = '/images/gta5-map.jpg';

// GTA5-Kartengrenzen für Leaflet CRS.Simple
const GTA5_BOUNDS: [[number, number], [number, number]] = [
  [-4096, -4096], // Südwest (minY, minX)
  [4096, 4096],   // Nordost (maxY, maxX)
];

// Mittelpunkt der GTA5-Karte
const GTA5_CENTER: [number, number] = [0, 0];

// Fix leaflet default icons in Next.js
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface Incident {
  id: string;
  caseNumber: string;
  type: string;
  location: string;
  status: string;
  priority: number;
  coordinates?: { lat: number; lng: number } | null;
}

interface Props {
  incidents: Incident[];
}

const priorityColors: Record<number, string> = {
  1: '#ef4444', // red
  2: '#f97316', // orange
  3: '#eab308', // yellow
  4: '#3b82f6', // blue
  5: '#6b7280', // gray
};

function createColoredIcon(priority: number) {
  const color = priorityColors[priority] ?? '#6b7280';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 25 41" width="25" height="41">
    <path d="M12.5 0C5.6 0 0 5.6 0 12.5c0 10 12.5 28.5 12.5 28.5S25 22.5 25 12.5C25 5.6 19.4 0 12.5 0z" fill="${color}" stroke="white" stroke-width="1.5"/>
    <circle cx="12.5" cy="12.5" r="5" fill="white"/>
  </svg>`;
  return L.divIcon({
    html: svg,
    className: '',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [0, -41],
  });
}

export default function IncidentMap({ incidents }: Props) {
  const mapIncidents = incidents.filter(
    (i) => i.coordinates && typeof i.coordinates.lat === 'number' && typeof i.coordinates.lng === 'number',
  );

  // GTA5-Koordinaten: lat = GTA5_Y, lng = GTA5_X
  // Falls Koordinaten als GTA5-Weltkoordinaten gespeichert wurden, direkt nutzen.
  const center: [number, number] = mapIncidents.length > 0
    ? [mapIncidents[0].coordinates!.lat, mapIncidents[0].coordinates!.lng]
    : GTA5_CENTER;

  return (
    <MapContainer
      crs={CRS.Simple}
      center={center}
      zoom={-1}
      minZoom={-2}
      maxZoom={3}
      maxBounds={GTA5_BOUNDS}
      maxBoundsViscosity={1.0}
      style={{ height: '100%', width: '100%', borderRadius: '0.75rem', background: '#1e293b' }}
      className="z-0"
    >
      <ImageOverlay
        url={GTA5_MAP_IMAGE_URL}
        bounds={GTA5_BOUNDS}
        opacity={1}
      />
      {mapIncidents.map((incident) => (
        <Marker
          key={incident.id}
          position={[incident.coordinates!.lat, incident.coordinates!.lng]}
          icon={createColoredIcon(incident.priority)}
        >
          <Popup>
            <div className="text-sm font-sans">
              <p className="font-bold">{incident.caseNumber}</p>
              <p><strong>Typ:</strong> {incident.type}</p>
              <p><strong>Ort:</strong> {incident.location}</p>
              <p><strong>Status:</strong> {incident.status}</p>
              <p><strong>Priorität:</strong> {incident.priority}</p>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
