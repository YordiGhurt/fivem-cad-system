'use client';

import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

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

  const center: [number, number] = mapIncidents.length > 0
    ? [mapIncidents[0].coordinates!.lat, mapIncidents[0].coordinates!.lng]
    : [51.505, -0.09];

  return (
    <MapContainer
      center={center}
      zoom={13}
      style={{ height: '100%', width: '100%', borderRadius: '0.75rem' }}
      className="z-0"
    >
      <TileLayer
        attribution='&copy; <a href="https://carto.com/">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
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
