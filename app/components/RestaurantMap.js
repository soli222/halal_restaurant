'use client';
import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet's broken default icon paths in Next.js/webpack
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function certExpiryStatus(expiryDate) {
  if (!expiryDate) return null;
  const daysLeft = Math.floor((new Date(expiryDate) - new Date()) / 86400000);
  if (daysLeft < 0) return 'expired';
  if (daysLeft <= 30) return 'expiring';
  return 'valid';
}

function createMarkerIcon(color) {
  return L.divIcon({
    className: '',
    html: `<div style="width:14px;height:14px;border-radius:50%;background:${color};border:2px solid rgba(255,255,255,0.9);box-shadow:0 2px 8px rgba(0,0,0,0.5)"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
    popupAnchor: [0, -12],
  });
}

function getMarkerColor(rest) {
  if (!rest.halalCertified) return '#6b7280';
  const status = certExpiryStatus(rest.certExpiryDate);
  if (status === 'expired') return '#ef4444';
  if (status === 'expiring') return '#f59e0b';
  return '#22c55e';
}

function BoundsFitter({ restaurants, userLocation }) {
  const map = useMap();
  useEffect(() => {
    if (userLocation) {
      map.setView([userLocation.lat, userLocation.lng], 13);
      return;
    }
    const points = restaurants.filter(r => r.lat && r.lng).map(r => [r.lat, r.lng]);
    if (points.length === 1) {
      map.setView(points[0], 13);
    } else if (points.length > 1) {
      map.fitBounds(points, { padding: [40, 40], maxZoom: 14 });
    }
  }, [restaurants, userLocation, map]);
  return null;
}

const RATING_LABELS = { recommended: '✅ Highly Recommended', good: '👍 Good', average: '😐 Average', not_recommended: '👎 Not Recommended' };

export default function RestaurantMap({ restaurants, onSelect, userLocation, reviewStats = {} }) {
  const mapped = restaurants.filter(r => r.lat != null && r.lng != null);

  const defaultCenter = userLocation
    ? [userLocation.lat, userLocation.lng]
    : mapped.length > 0 ? [mapped[0].lat, mapped[0].lng]
    : [32.7767, -96.7970]; // Dallas fallback

  return (
    <div style={{ borderRadius: '16px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)' }}>
      <MapContainer
        center={defaultCenter}
        zoom={11}
        style={{ height: 'calc(100vh - 260px)', minHeight: '400px' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <BoundsFitter restaurants={mapped} userLocation={userLocation} />
        {mapped.map(rest => {
          const stats = reviewStats[rest.id];
          return (
            <Marker
              key={rest.id}
              position={[rest.lat, rest.lng]}
              icon={createMarkerIcon(getMarkerColor(rest))}
            >
              <Popup minWidth={190}>
                <div style={{ fontFamily: 'system-ui, sans-serif', padding: '2px 0' }}>
                  <p style={{ fontWeight: 700, fontSize: 13, marginBottom: 6, lineHeight: 1.3 }}>{rest.name}</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 6 }}>
                    {rest.cuisine && (
                      <span style={{ background: 'rgba(34,197,94,0.12)', color: '#16a34a', padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 600, border: '1px solid rgba(34,197,94,0.2)' }}>
                        {rest.cuisine}
                      </span>
                    )}
                    {rest.halalCertified && (
                      <span style={{ background: 'rgba(34,197,94,0.08)', color: '#16a34a', padding: '2px 8px', borderRadius: 99, fontSize: 11, border: '1px solid rgba(34,197,94,0.15)' }}>
                        ✓ Halal
                      </span>
                    )}
                  </div>
                  {stats?.count > 0 ? (
                    <p style={{ fontSize: 11, color: '#555', marginBottom: 4 }}>
                      {RATING_LABELS[Object.keys(RATING_LABELS)[Math.max(0, Math.round(4 - stats.avg))]] || '⭐'} · {stats.count} review{stats.count !== 1 ? 's' : ''}
                    </p>
                  ) : (
                    <p style={{ fontSize: 11, color: '#999', marginBottom: 4 }}>No reviews yet</p>
                  )}
                  <p style={{ fontSize: 11, color: '#888', marginBottom: 10 }}>{rest.city || rest.location}</p>
                  <button
                    onClick={() => onSelect(rest)}
                    style={{ background: '#16a34a', color: 'white', border: 'none', borderRadius: 8, padding: '5px 16px', fontSize: 12, cursor: 'pointer', fontWeight: 600, width: '100%' }}
                  >
                    View restaurant →
                  </button>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
      {mapped.length === 0 && restaurants.length > 0 && (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: '#666', fontSize: 13, background: '#111', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          Map coordinates not yet available for these restaurants.
          <br />
          <span style={{ fontSize: 11, color: '#444', marginTop: 4, display: 'block' }}>Run <code>node geocode-restaurants.mjs</code> to populate them.</span>
        </div>
      )}
    </div>
  );
}
