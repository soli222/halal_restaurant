'use client';
import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function CenterOnMarker({ lat, lng }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], 15);
  }, [lat, lng, map]);
  return null;
}

export default function RestaurantLocationMap({ restaurant }) {
  const { lat, lng, name, location, mapsUrl } = restaurant;
  const hasCoords = lat != null && lng != null;

  const directionsUrl = mapsUrl ||
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${name} ${location || ''}`)}`;

  return (
    <div className="bg-[#111111] border border-white/5 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4">
        <h2 className="text-sm font-semibold text-white flex items-center gap-2">
          <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Location
        </h2>
        <a
          href={directionsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-xs font-semibold text-green-400 hover:text-green-300 bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 px-3 py-1.5 rounded-xl transition-all duration-200"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
          Get Directions
        </a>
      </div>

      {/* Map or fallback */}
      {hasCoords ? (
        <MapContainer
          center={[lat, lng]}
          zoom={15}
          style={{ height: '200px' }}
          zoomControl={false}
          attributionControl={false}
          scrollWheelZoom={false}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <CenterOnMarker lat={lat} lng={lng} />
          <Marker position={[lat, lng]} />
        </MapContainer>
      ) : (
        <div className="h-32 flex flex-col items-center justify-center gap-2 bg-white/[0.02] border-t border-white/5">
          <svg className="w-7 h-7 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          </svg>
          <p className="text-xs text-gray-600">{location || name}</p>
        </div>
      )}

      {/* Address strip */}
      {location && (
        <div className="px-5 py-3 border-t border-white/5">
          <p className="text-xs text-gray-500 truncate">{location}</p>
        </div>
      )}
    </div>
  );
}
