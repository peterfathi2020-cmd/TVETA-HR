
import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { WorkUnit, WorkUnitTypeLabels } from '../types';
import { Building2, MapPin } from 'lucide-react';

// Fix for default marker icons in Leaflet with Webpack/Vite
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface MapViewProps {
  units: WorkUnit[];
  center?: [number, number];
  zoom?: number;
}

// Component to handle map center updates
const ChangeView = ({ center, zoom }: { center: [number, number], zoom: number }) => {
  const map = useMap();
  map.setView(center, zoom);
  return null;
};

export const MapView: React.FC<MapViewProps> = ({ 
  units, 
  center = [26.8206, 30.8025], // Center of Egypt
  zoom = 6 
}) => {
  // Filter units that have coordinates
  const unitsWithCoords = units.filter(u => u.latitude && u.longitude);

  return (
    <div className="h-[500px] w-full rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm relative z-0">
      <MapContainer 
        center={center} 
        zoom={zoom} 
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {unitsWithCoords.map(unit => (
          <Marker 
            key={unit.id} 
            position={[unit.latitude!, unit.longitude!]}
          >
            <Popup>
              <div className="p-1 text-right" dir="rtl">
                <div className="flex items-center gap-2 mb-1">
                    <Building2 size={16} className="text-indigo-600" />
                    <h3 className="font-bold text-slate-800 m-0">{unit.name_ar || unit.name}</h3>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                    <MapPin size={12} />
                    <span>{unit.governorate}</span>
                    <span className="bg-slate-100 px-1 rounded">{WorkUnitTypeLabels[unit.unit_type]}</span>
                </div>
                <button 
                    onClick={() => window.location.href = `/employees?workPlaceId=${unit.id}`}
                    className="w-full py-1.5 bg-indigo-600 text-white text-xs rounded hover:bg-indigo-700 transition-colors font-bold"
                >
                    عرض الموظفين
                </button>
              </div>
            </Popup>
          </Marker>
        ))}
        
        <ChangeView center={center} zoom={zoom} />
      </MapContainer>
    </div>
  );
};
