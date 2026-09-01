import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { FoodDonation, PickupTask } from '../types';

interface FoodRescueMapProps {
  center?: [number, number];
  zoom?: number;
  donations?: FoodDonation[];
  selectedDonation?: FoodDonation | null;
  onSelectDonation?: (donation: FoodDonation) => void;
  onClaimDonation?: (donation: FoodDonation) => void;
  radiusKm?: number;
  userLocation?: [number, number];
  userLabel?: string;
  activePickup?: PickupTask | null;
  height?: string;
}

export const FoodRescueMap: React.FC<FoodRescueMapProps> = ({
  center = [20.2961, 85.8245], // Default: Bhubaneswar
  zoom = 13,
  donations = [],
  selectedDonation,
  onSelectDonation,
  onClaimDonation,
  radiusKm,
  userLocation,
  userLabel = 'Your Location / Shelter',
  activePickup,
  height = '480px'
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const radiusCircleRef = useRef<L.Circle | null>(null);
  const routeLineRef = useRef<L.Polyline | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: userLocation || center,
        zoom: zoom,
        zoomControl: true,
        attributionControl: true
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19
      }).addTo(map);

      markersLayerRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update Markers & Overlays
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;
    if (!map || !markersLayer) return;

    markersLayer.clearLayers();

    if (radiusCircleRef.current) {
      radiusCircleRef.current.remove();
      radiusCircleRef.current = null;
    }

    if (routeLineRef.current) {
      routeLineRef.current.remove();
      routeLineRef.current = null;
    }

    const bounds = L.latLngBounds([]);

    // 1. Render User / Shelter Location Marker
    if (userLocation) {
      const userIcon = L.divIcon({
        className: 'custom-user-marker',
        html: `
          <div class="relative flex items-center justify-center">
            <div class="w-8 h-8 rounded-full bg-emerald-600 border-2 border-white shadow-lg flex items-center justify-center text-white font-bold text-xs">
              📍
            </div>
            <div class="absolute -bottom-6 bg-slate-900/90 text-white text-[10px] font-semibold px-2 py-0.5 rounded shadow whitespace-nowrap">
              ${userLabel}
            </div>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      const userMarker = L.marker(userLocation, { icon: userIcon });
      userMarker.bindPopup(`
        <div class="p-1 text-slate-800">
          <div class="font-bold text-sm text-emerald-700">📍 ${userLabel}</div>
          <div class="text-xs text-slate-500 mt-0.5">Reference Location for Proximity Matching</div>
        </div>
      `);
      markersLayer.addLayer(userMarker);
      bounds.extend(userLocation);

      // Add Radius Circle if specified
      if (radiusKm && radiusKm > 0) {
        radiusCircleRef.current = L.circle(userLocation, {
          radius: radiusKm * 1000,
          color: '#059669',
          fillColor: '#10b981',
          fillOpacity: 0.08,
          weight: 1.5,
          dashArray: '6, 6'
        }).addTo(map);
      }
    }

    // 2. Render Food Donation Markers
    donations.forEach((donation) => {
      if (!donation.latitude || !donation.longitude) return;

      const isSelected = selectedDonation?.id === donation.id;
      const isAvailable = donation.status === 'available';

      const pinColor = isAvailable ? (donation.category === 'cooked_meals' ? 'bg-amber-500' : 'bg-emerald-500') : 'bg-slate-400';
      const badgeIcon = donation.vegNonVeg === 'pure_veg' ? '🌱' : '🍱';

      const markerHtml = `
        <div class="group relative cursor-pointer transform transition-transform hover:scale-110 ${isSelected ? 'scale-125 z-50' : ''}">
          <div class="w-9 h-9 rounded-full ${pinColor} border-2 border-white shadow-xl flex items-center justify-center text-white text-xs font-bold ring-2 ring-slate-900/10">
            ${badgeIcon}
          </div>
          <div class="absolute -top-2 -right-2 bg-slate-900 text-white text-[9px] font-bold px-1.5 py-0.2 rounded-full border border-white">
            ${donation.servings}
          </div>
          <div class="absolute -bottom-5 left-1/2 -translate-x-1/2 bg-slate-900/90 text-white text-[10px] font-medium px-1.5 py-0.2 rounded shadow whitespace-nowrap max-w-[120px] truncate">
            ${donation.title}
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'custom-food-marker',
        html: markerHtml,
        iconSize: [36, 36],
        iconAnchor: [18, 18]
      });

      const marker = L.marker([donation.latitude, donation.longitude], { icon: customIcon });

      // Create rich interactive popup
      const popupDiv = document.createElement('div');
      popupDiv.className = 'p-2 max-w-[240px] text-slate-800 text-xs font-sans';
      popupDiv.innerHTML = `
        <div class="flex items-center gap-1.5 mb-1.5">
          <span class="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
            donation.vegNonVeg === 'pure_veg' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
          }">${donation.vegNonVeg.replace('_', ' ')}</span>
          <span class="text-slate-400 text-[10px]">•</span>
          <span class="text-slate-500 font-semibold text-[10px]">${donation.servings} Servings</span>
          ${donation.distanceKm !== undefined ? `<span class="ml-auto font-bold text-emerald-600 text-[11px]">${donation.distanceKm} km away</span>` : ''}
        </div>
        <h4 class="font-bold text-sm text-slate-900 leading-snug mb-1">${donation.title}</h4>
        <p class="text-slate-600 text-[11px] mb-2 leading-tight">${donation.donorName} • ${donation.locality || donation.city}</p>
        <div class="bg-slate-50 p-1.5 rounded text-[10px] text-slate-600 border border-slate-200 mb-2.5">
          <div><span class="font-semibold text-slate-700">Expiry:</span> ${donation.expiryTime}</div>
          <div><span class="font-semibold text-slate-700">Window:</span> ${donation.pickupWindow || 'Immediate'}</div>
        </div>
      `;

      if (isAvailable && onClaimDonation) {
        const claimBtn = document.createElement('button');
        claimBtn.className = 'w-full py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded text-xs shadow transition cursor-pointer flex items-center justify-center gap-1';
        claimBtn.innerHTML = '<span>⚡ Claim Donation</span>';
        claimBtn.onclick = (e) => {
          e.stopPropagation();
          onClaimDonation(donation);
          map.closePopup();
        };
        popupDiv.appendChild(claimBtn);
      }

      marker.bindPopup(popupDiv);
      marker.on('click', () => {
        if (onSelectDonation) onSelectDonation(donation);
      });

      markersLayer.addLayer(marker);
      bounds.extend([donation.latitude, donation.longitude]);
    });

    // 3. Render Active Pickup Line Route
    if (activePickup && activePickup.pickupLatitude && activePickup.dropoffLatitude) {
      const p1: [number, number] = [activePickup.pickupLatitude, activePickup.pickupLongitude];
      const p2: [number, number] = [activePickup.dropoffLatitude, activePickup.dropoffLongitude];

      routeLineRef.current = L.polyline([p1, p2], {
        color: '#2563eb',
        weight: 4,
        dashArray: '8, 8',
        opacity: 0.8
      }).addTo(map);

      // Pickup Marker
      const pickupIcon = L.divIcon({
        className: 'pickup-marker',
        html: `
          <div class="w-8 h-8 rounded-full bg-amber-500 border-2 border-white shadow-lg flex items-center justify-center text-white text-xs font-bold">
            📦
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });
      const pickupMarker = L.marker(p1, { icon: pickupIcon }).bindPopup(`
        <div class="p-1 text-xs">
          <div class="font-bold text-amber-700">Pickup: ${activePickup.donorName}</div>
          <div class="text-slate-600">${activePickup.pickupAddress}</div>
        </div>
      `);
      markersLayer.addLayer(pickupMarker);

      // Dropoff Marker
      const dropoffIcon = L.divIcon({
        className: 'dropoff-marker',
        html: `
          <div class="w-8 h-8 rounded-full bg-emerald-600 border-2 border-white shadow-lg flex items-center justify-center text-white text-xs font-bold">
            🏠
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });
      const dropoffMarker = L.marker(p2, { icon: dropoffIcon }).bindPopup(`
        <div class="p-1 text-xs">
          <div class="font-bold text-emerald-700">Dropoff: ${activePickup.ngoName}</div>
          <div class="text-slate-600">${activePickup.dropoffAddress}</div>
        </div>
      `);
      markersLayer.addLayer(dropoffMarker);

      bounds.extend(p1);
      bounds.extend(p2);
    }

    // Fit map bounds smoothly if multiple points exist
    if (bounds.isValid() && donations.length > 0) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    }
  }, [donations, selectedDonation, userLocation, radiusKm, activePickup]);

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-slate-200 shadow-inner bg-slate-100 z-0">
      <div ref={mapContainerRef} style={{ height, width: '100%' }} />
      <div className="absolute top-3 right-3 bg-white/90 backdrop-blur px-3 py-1.5 rounded-lg border border-slate-200 shadow text-[11px] font-medium text-slate-700 pointer-events-none z-10 flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-200"></span>
          <span>Available Meal</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 ring-2 ring-amber-200"></span>
          <span>Cooked Feast</span>
        </div>
        {userLocation && (
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 ring-2 ring-blue-200"></span>
            <span>Your Shelter</span>
          </div>
        )}
      </div>
    </div>
  );
};
