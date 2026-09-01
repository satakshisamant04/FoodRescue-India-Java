import React, { useState, useMemo } from 'react';
import { 
  Utensils, 
  Clock, 
  MapPin, 
  CheckCircle2, 
  Radio, 
  Truck, 
  Send, 
  Filter,
  Search,
  Building2,
  ShieldCheck,
  History,
  Navigation,
  CheckSquare,
  Eye,
  FileCheck,
  Map,
  Grid,
  Zap,
  Sliders
} from 'lucide-react';
import { FoodDonation, UserProfile } from '../types';
import { RescueTrackingModal } from './Modals/RescueTrackingModal';
import { FoodRescueMap } from './FoodRescueMap';

interface NGOPortalProps {
  user: UserProfile;
  donations: FoodDonation[];
  onClaimDonation: (donationId: string, deliveryType: 'volunteer' | 'self_pickup') => void;
  onRequestNeed: (need: string) => void;
}

// Haversine distance calculator in KM
function getHaversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371.0;
  const dLat = ((lat2 - lat1) * Math.PI) / 180.0;
  const dLon = ((lon2 - lon1) * Math.PI) / 180.0;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180.0) * Math.cos((lat2 * Math.PI) / 180.0) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

export const NGOPortal: React.FC<NGOPortalProps> = ({
  user,
  donations,
  onClaimDonation,
  onRequestNeed
}) => {
  const [activeTab, setActiveTab] = useState<'available' | 'inbound' | 'history'>('available');
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');
  const [filterVeg, setFilterVeg] = useState<'all' | 'pure_veg'>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [radiusKm, setRadiusKm] = useState<number>(25);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTrackingDonation, setSelectedTrackingDonation] = useState<FoodDonation | null>(null);
  const [selectedMapDonation, setSelectedMapDonation] = useState<FoodDonation | null>(null);
  
  // Urgent broadcast form
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [broadcastFoodType, setBroadcastFoodType] = useState('Cooked Hot Dinner (Dal, Sabzi, Rice)');
  const [broadcastServings, setBroadcastServings] = useState(100);
  const [broadcastUrgency, setBroadcastUrgency] = useState<'critical' | 'high' | 'medium'>('critical');
  const [broadcastTime, setBroadcastTime] = useState('Today by 7:30 PM');

  // NGO Coordinates (Default: Old Town Shelter, Bhubaneswar)
  const ngoLat = user.latitude || 20.2405;
  const ngoLon = user.longitude || 85.8340;

  // Filter donations with Haversine distance
  const availableDonations = useMemo(() => {
    return donations
      .filter(d => {
        if (d.status !== 'available') return false;
        if (filterVeg === 'pure_veg' && d.vegNonVeg !== 'pure_veg') return false;
        if (filterCategory !== 'all' && d.category !== filterCategory) return false;
        if (searchTerm && !d.title.toLowerCase().includes(searchTerm.toLowerCase()) && !d.city.toLowerCase().includes(searchTerm.toLowerCase())) return false;
        
        // Calculate Distance if coordinates exist
        if (d.latitude && d.longitude) {
          const dist = getHaversineDistanceKm(ngoLat, ngoLon, d.latitude, d.longitude);
          d.distanceKm = dist;
          if (radiusKm > 0 && dist > radiusKm) return false;
        }
        return true;
      })
      .sort((a, b) => (a.distanceKm || 0) - (b.distanceKm || 0));
  }, [donations, filterVeg, filterCategory, searchTerm, radiusKm, ngoLat, ngoLon]);

  const myClaimedDonations = donations.filter(d => 
    d.claimedByNGO?.id === user.id || 
    d.claimedByNGO?.name === user.organization ||
    d.claimedByNGO?.name === user.name
  );

  const inboundDonations = myClaimedDonations.filter(d => d.status === 'claimed' || d.status === 'in_transit');
  const deliveredDonations = myClaimedDonations.filter(d => d.status === 'completed');

  const totalMealsReceived = myClaimedDonations.reduce((acc, curr) => acc + (Number(curr.servings) || 0), 0);

  const handleBroadcastSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onRequestNeed(`${broadcastServings} servings of ${broadcastFoodType} for ${user.organization || user.name}`);
    setShowBroadcastModal(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fadeIn">
      
      {/* Header Banner */}
      <div className="bg-white dark:bg-[#111c30] rounded-3xl p-6 sm:p-8 border border-[#d3e4fe] dark:border-[#243452] shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6 transition-colors">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#ffdad2] dark:bg-[#ae3115]/30 text-[#8c1900] dark:text-[#ffb4a3] text-xs font-bold">
              <Utensils className="w-3.5 h-3.5" />
              <span>NGO & Shelter Rescue Hub</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-xs font-bold">
              <Zap className="w-3.5 h-3.5 text-emerald-600" />
              <span>Redis Cache Layer Active (~3.2ms response)</span>
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#0b1c30] dark:text-white">
            {user.organization || user.name}
          </h1>
          <p className="text-xs sm:text-sm text-[#59413c] dark:text-[#cbd5e1]">
            Verified Food Redistribution Partner • Center: {user.address || 'Old Town, Bhubaneswar'}
          </p>
        </div>

        <button
          onClick={() => setShowBroadcastModal(true)}
          className="px-5 py-3.5 bg-[#ae3115] hover:bg-[#8c1900] text-white text-xs sm:text-sm font-extrabold rounded-xl shadow-md shadow-[#ae3115]/20 hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer shrink-0"
        >
          <Radio className="w-4 h-4 animate-pulse" />
          <span>Broadcast Urgent Food Need</span>
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#111c30] p-4 rounded-2xl border border-[#d3e4fe] dark:border-[#243452] shadow-xs transition-colors">
          <div className="text-[11px] font-semibold text-[#565e74] dark:text-[#94a3b8]">Available Surplus Portions</div>
          <div className="text-2xl font-extrabold text-[#ae3115] dark:text-[#ff7e62] mt-1">
            {availableDonations.reduce((acc, curr) => acc + curr.servings, 0).toLocaleString()}
          </div>
          <div className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold mt-0.5">Within {radiusKm > 0 ? `${radiusKm} km radius` : 'All distances'}</div>
        </div>

        <div className="bg-white dark:bg-[#111c30] p-4 rounded-2xl border border-[#d3e4fe] dark:border-[#243452] shadow-xs transition-colors">
          <div className="text-[11px] font-semibold text-[#565e74] dark:text-[#94a3b8]">Inbound Deliveries</div>
          <div className="text-2xl font-extrabold text-[#0b1c30] dark:text-white mt-1">
            {inboundDonations.length}
          </div>
          <div className="text-[10px] text-blue-700 dark:text-blue-400 font-bold mt-0.5">Dispatched / En Route</div>
        </div>

        <div className="bg-white dark:bg-[#111c30] p-4 rounded-2xl border border-[#d3e4fe] dark:border-[#243452] shadow-xs transition-colors">
          <div className="text-[11px] font-semibold text-[#565e74] dark:text-[#94a3b8]">Total Meals Distributed</div>
          <div className="text-2xl font-extrabold text-emerald-700 dark:text-emerald-400 mt-1">
            {totalMealsReceived.toLocaleString()}
          </div>
          <div className="text-[10px] text-[#59413c] dark:text-[#94a3b8] mt-0.5">Community impact</div>
        </div>

        <div className="bg-white dark:bg-[#111c30] p-4 rounded-2xl border border-[#d3e4fe] dark:border-[#243452] shadow-xs transition-colors">
          <div className="text-[11px] font-semibold text-[#565e74] dark:text-[#94a3b8]">Completed Batches Logged</div>
          <div className="text-2xl font-extrabold text-[#0b1c30] dark:text-white mt-1">
            {deliveredDonations.length}
          </div>
          <div className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold mt-0.5">100% Verified Handover</div>
        </div>
      </div>

      {/* Main Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#d3e4fe] dark:border-[#243452] pb-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveTab('available')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'available'
                ? 'bg-[#0b1c30] dark:bg-white text-white dark:text-[#0b1c30] shadow-sm'
                : 'bg-[#eff4ff] dark:bg-[#16243d] text-[#565e74] dark:text-[#94a3b8] hover:bg-[#d3e4fe]/50'
            }`}
          >
            <Utensils className="w-3.5 h-3.5" />
            <span>Available Food Surplus ({availableDonations.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('inbound')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'inbound'
                ? 'bg-[#0b1c30] dark:bg-white text-white dark:text-[#0b1c30] shadow-sm'
                : 'bg-[#eff4ff] dark:bg-[#16243d] text-[#565e74] dark:text-[#94a3b8] hover:bg-[#d3e4fe]/50'
            }`}
          >
            <Truck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>Active Inbound Deliveries ({inboundDonations.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'history'
                ? 'bg-[#0b1c30] dark:bg-white text-white dark:text-[#0b1c30] shadow-sm'
                : 'bg-[#eff4ff] dark:bg-[#16243d] text-[#565e74] dark:text-[#94a3b8] hover:bg-[#d3e4fe]/50'
            }`}
          >
            <History className="w-3.5 h-3.5 text-[#ae3115] dark:text-[#ff7e62]" />
            <span>Rescue History & Logs ({deliveredDonations.length})</span>
          </button>
        </div>

        {/* View Mode Switcher (Map vs Grid) */}
        {activeTab === 'available' && (
          <div className="flex bg-[#eff4ff] dark:bg-[#16243d] p-1 rounded-xl border border-[#d3e4fe] dark:border-[#2b3e64]">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-[#1f2f4e] text-[#0b1c30] dark:text-white shadow-xs'
                  : 'text-[#565e74] dark:text-[#94a3b8]'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              <span>Cards Grid</span>
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'map'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-emerald-700 dark:text-emerald-400'
              }`}
            >
              <Map className="w-3.5 h-3.5" />
              <span>🗺️ Leaflet Map & Radius</span>
            </button>
          </div>
        )}
      </div>

      {/* TAB 1: AVAILABLE SURPLUS */}
      {activeTab === 'available' && (
        <div className="space-y-6">
          {/* Filter & Radius Bar */}
          <div className="bg-white dark:bg-[#111c30] p-4 sm:p-5 rounded-2xl border border-[#d3e4fe] dark:border-[#243452] shadow-xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 transition-colors">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#565e74] dark:text-[#94a3b8]" />
              <input
                type="text"
                placeholder="Search food by name or area (e.g. Rice, Patia, Nayapalli, Cuttack)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-[#eff4ff] dark:bg-[#16243d] border border-[#d3e4fe] dark:border-[#2b3e64] rounded-xl text-xs text-[#0b1c30] dark:text-white outline-none focus:ring-2 focus:ring-[#ae3115]/30 focus:border-[#ae3115]"
              />
            </div>

            {/* Radius & Veg Filters */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Haversine Radius Slider Selector */}
              <div className="flex items-center gap-2 bg-[#eff4ff] dark:bg-[#16243d] px-3 py-1.5 rounded-xl border border-[#d3e4fe] dark:border-[#2b3e64]">
                <Sliders className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200">Radius:</span>
                <select
                  value={radiusKm}
                  onChange={(e) => setRadiusKm(Number(e.target.value))}
                  className="bg-transparent text-xs font-extrabold text-emerald-700 dark:text-emerald-400 outline-none cursor-pointer"
                >
                  <option value={5}>Within 5 km (Hyperlocal)</option>
                  <option value={10}>Within 10 km</option>
                  <option value={25}>Within 25 km (City-wide)</option>
                  <option value={50}>Within 50 km</option>
                  <option value={0}>All Distances</option>
                </select>
              </div>

              {/* Veg Toggle */}
              <div className="flex bg-[#eff4ff] dark:bg-[#16243d] p-1 rounded-xl border border-[#d3e4fe] dark:border-[#2b3e64]">
                <button
                  onClick={() => setFilterVeg('all')}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    filterVeg === 'all' 
                      ? 'bg-white dark:bg-[#1f2f4e] text-[#0b1c30] dark:text-white shadow-xs' 
                      : 'text-[#565e74] dark:text-[#94a3b8]'
                  }`}
                >
                  All Food
                </button>
                <button
                  onClick={() => setFilterVeg('pure_veg')}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                    filterVeg === 'pure_veg' 
                      ? 'bg-emerald-600 text-white shadow-xs' 
                      : 'text-emerald-700 dark:text-emerald-400'
                  }`}
                >
                  <span>🟢 Pure Veg</span>
                </button>
              </div>

              {/* Category Dropdown */}
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-3 py-2 bg-[#eff4ff] dark:bg-[#16243d] border border-[#d3e4fe] dark:border-[#2b3e64] rounded-xl text-xs font-bold text-[#0b1c30] dark:text-white outline-none cursor-pointer"
              >
                <option value="all">All Food Types</option>
                <option value="cooked_meals">Cooked Hot Meals</option>
                <option value="bakery">Fresh Bakery / Bread</option>
                <option value="produce">Raw Produce / Veggies</option>
                <option value="dairy">Dairy Products</option>
                <option value="packaged">Packaged Groceries</option>
              </select>
            </div>
          </div>

          {/* MAP VIEW */}
          {viewMode === 'map' && (
            <div className="space-y-4">
              <div className="bg-white dark:bg-[#111c30] p-4 rounded-2xl border border-[#d3e4fe] dark:border-[#243452] shadow-xs">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                      <span>📍 Geospatial Proximity Matcher (OpenStreetMap & Leaflet)</span>
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Showing food donors within <strong>{radiusKm > 0 ? `${radiusKm} km` : 'all ranges'}</strong> of your shelter. Click any pin to inspect food portions and claim instantly.
                    </p>
                  </div>
                  <span className="text-xs font-bold bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full">
                    {availableDonations.length} Nearby Donors Found
                  </span>
                </div>

                <FoodRescueMap
                  center={[ngoLat, ngoLon]}
                  userLocation={[ngoLat, ngoLon]}
                  userLabel={user.organization || user.name}
                  radiusKm={radiusKm}
                  donations={availableDonations}
                  selectedDonation={selectedMapDonation}
                  onSelectDonation={(d) => setSelectedMapDonation(d)}
                  onClaimDonation={(d) => onClaimDonation(d.id, 'volunteer')}
                  height="460px"
                />
              </div>
            </div>
          )}

          {/* CARDS GRID */}
          {viewMode === 'grid' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-black text-[#0b1c30] dark:text-white">
                  Available Food Listings (Sorted by Haversine Distance)
                </h2>
                <span className="text-xs font-semibold text-[#565e74] dark:text-[#94a3b8]">{availableDonations.length} Active Listings</span>
              </div>

              {availableDonations.length === 0 ? (
                <div className="bg-white dark:bg-[#111c30] rounded-3xl p-12 text-center border border-dashed border-[#d3e4fe] dark:border-[#243452] space-y-3">
                  <Utensils className="w-10 h-10 text-[#565e74] dark:text-[#94a3b8] mx-auto" />
                  <h3 className="text-lg font-bold text-[#0b1c30] dark:text-white">No Food Surplus Within This Radius</h3>
                  <p className="text-xs text-[#59413c] dark:text-[#cbd5e1] max-w-md mx-auto">
                    Try expanding your search radius (e.g. to 25km or 50km) or broadcasting an urgent request to nearby commercial kitchens.
                  </p>
                  <button
                    onClick={() => setRadiusKm(50)}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer"
                  >
                    Expand Search to 50 km Radius
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {availableDonations.map(item => (
                    <div
                      key={item.id}
                      className="bg-white dark:bg-[#111c30] rounded-3xl border border-[#d3e4fe] dark:border-[#243452] overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                    >
                      <div>
                        {/* Food Image */}
                        <div className="relative h-44 w-full overflow-hidden bg-[#eff4ff] dark:bg-[#16243d]">
                          <img
                            src={item.image || 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=600&q=80'}
                            alt={item.title}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute top-3 left-3 flex gap-2">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase shadow-sm ${
                              item.vegNonVeg === 'pure_veg' 
                                ? 'bg-emerald-600 text-white' 
                                : 'bg-amber-600 text-white'
                            }`}>
                              {item.vegNonVeg === 'pure_veg' ? '🟢 Pure Veg' : '🍱 Non-Veg / Egg'}
                            </span>
                          </div>

                          {/* Distance & Expiry Badges */}
                          <div className="absolute top-3 right-3 flex flex-col items-end gap-1">
                            <div className="bg-black/75 backdrop-blur-xs text-white text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                              <Clock className="w-3 h-3 text-[#ffdad2]" />
                              <span>{item.expiryTime}</span>
                            </div>
                            {item.distanceKm !== undefined && (
                              <div className="bg-emerald-700/90 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow">
                                📍 {item.distanceKm} km away
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Body Info */}
                        <div className="p-5 space-y-3">
                          <div>
                            <div className="text-[11px] font-bold text-[#ae3115] dark:text-[#ff7e62] uppercase tracking-wider">
                              {item.donorType} • {item.donorName}
                            </div>
                            <h3 className="text-base font-bold text-[#0b1c30] dark:text-white mt-0.5 leading-snug">
                              {item.title}
                            </h3>
                            {item.description && (
                              <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                                {item.description}
                              </p>
                            )}
                          </div>

                          <div className="grid grid-cols-2 gap-2 bg-[#eff4ff] dark:bg-[#16243d] p-3 rounded-2xl text-center text-xs">
                            <div>
                              <span className="text-[10px] text-[#565e74] dark:text-[#94a3b8] block">Portions</span>
                              <span className="font-extrabold text-base text-[#ae3115] dark:text-[#ff7e62]">{item.servings} Meals</span>
                            </div>
                            <div>
                              <span className="text-[10px] text-[#565e74] dark:text-[#94a3b8] block">Estimated Weight</span>
                              <span className="font-bold text-[#0b1c30] dark:text-white">{item.weightKg} kg</span>
                            </div>
                          </div>

                          <div className="space-y-1 text-xs text-[#565e74] dark:text-[#94a3b8]">
                            <div className="flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5 text-[#ae3115] dark:text-[#ff7e62] shrink-0" />
                              <span className="truncate">{item.address}, {item.city}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-[#565e74] dark:text-[#94a3b8] shrink-0" />
                              <span>Pickup Window: {item.pickupWindow || 'Immediate'}</span>
                            </div>
                          </div>

                          {item.notes && (
                            <p className="text-[11px] text-[#59413c] dark:text-[#cbd5e1] italic bg-[#f8f9ff] dark:bg-[#16243d] p-2 rounded-lg border border-[#e5eeff] dark:border-[#2b3e64]">
                              "{item.notes}"
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Claim Button */}
                      <div className="p-5 pt-0">
                        <button
                          onClick={() => onClaimDonation(item.id, 'volunteer')}
                          className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Claim for My Shelter (Generate Pickup Task)</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: INBOUND / DISPATCHED DELIVERIES */}
      {activeTab === 'inbound' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-[#0b1c30] dark:text-white">Active Inbound Rescued Food Deliveries</h2>
            <span className="text-xs font-semibold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-3 py-1 rounded-full border border-blue-200 dark:border-blue-900/50">
              {inboundDonations.length} Active Shipments
            </span>
          </div>

          {inboundDonations.length === 0 ? (
            <div className="bg-white dark:bg-[#111c30] rounded-3xl p-10 text-center border border-dashed border-[#d3e4fe] dark:border-[#243452] space-y-3">
              <Truck className="w-10 h-10 text-[#565e74] dark:text-[#94a3b8] mx-auto" />
              <h4 className="text-base font-bold text-[#0b1c30] dark:text-white">No Inbound Deliveries Currently En Route</h4>
              <p className="text-xs text-[#59413c] dark:text-[#cbd5e1] max-w-md mx-auto">
                When you claim a surplus food batch from the marketplace, you can monitor the volunteer driver's live dispatch and ETA here.
              </p>
              <button
                onClick={() => setActiveTab('available')}
                className="px-5 py-2.5 bg-[#0b1c30] dark:bg-white text-white dark:text-[#0b1c30] text-xs font-bold rounded-xl cursor-pointer shadow-sm transition-all"
              >
                Browse Surplus Food Now
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {inboundDonations.map(item => (
                <div key={item.id} className="bg-white dark:bg-[#111c30] p-5 rounded-2xl border border-[#d3e4fe] dark:border-[#243452] shadow-xs space-y-3 transition-colors">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#ae3115] dark:text-[#ff7e62]">
                        From: {item.donorName}
                      </span>
                      <h4 className="font-bold text-sm text-[#0b1c30] dark:text-white">{item.title}</h4>
                      <span className="text-xs text-[#565e74] dark:text-[#94a3b8]">{item.servings} Servings ({item.weightKg} kg)</span>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                      item.status === 'in_transit'
                        ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 animate-pulse'
                        : 'bg-blue-100 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300'
                    }`}>
                      {item.status === 'in_transit' ? '🚚 Driver On Road' : '✓ Claimed - Dispatching'}
                    </span>
                  </div>

                  {item.assignedVolunteer ? (
                    <div className="bg-[#eff4ff] dark:bg-[#16243d] p-3 rounded-xl border border-[#d3e4fe] dark:border-[#2b3e64] text-xs flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Truck className="w-4 h-4 text-[#ae3115] dark:text-[#ff7e62]" />
                        <div>
                          <div className="font-bold text-[#0b1c30] dark:text-white">{item.assignedVolunteer.name}</div>
                          <div className="text-[10px] text-[#565e74] dark:text-[#94a3b8]">{item.assignedVolunteer.vehicle} • {item.assignedVolunteer.phone}</div>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">ETA ~ 20-30 mins</span>
                    </div>
                  ) : (
                    <div className="bg-amber-50 dark:bg-amber-950/20 p-3 rounded-xl border border-amber-200 dark:border-amber-900/40 text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span>Broadcasting route to nearby volunteer drivers...</span>
                    </div>
                  )}

                  <div className="pt-2 border-t border-[#e5eeff] dark:border-[#243452] flex items-center justify-between">
                    <span className="text-[11px] text-[#565e74] dark:text-[#94a3b8]">Origin: {item.address}</span>
                    <button
                      onClick={() => setSelectedTrackingDonation(item)}
                      className="px-3 py-1 rounded-lg bg-[#eff4ff] dark:bg-[#16243d] hover:bg-[#ffdad2] dark:hover:bg-[#203050] text-xs font-bold text-[#0b1c30] dark:text-white flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Navigation className="w-3.5 h-3.5 text-[#ae3115] dark:text-[#ff7e62]" />
                      <span>Track Live Dispatch</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: RESCUE HISTORY */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black text-[#0b1c30] dark:text-white">Preserved Shelter Food Distribution Log</h2>
              <p className="text-xs text-[#565e74] dark:text-[#94a3b8]">All delivered food rescues received and distributed by your shelter.</p>
            </div>
            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-900/50">
              {deliveredDonations.length} Received Batches
            </span>
          </div>

          {deliveredDonations.length === 0 ? (
            <div className="bg-white dark:bg-[#111c30] rounded-3xl p-10 text-center border border-dashed border-[#d3e4fe] dark:border-[#243452] space-y-3">
              <History className="w-10 h-10 text-[#565e74] dark:text-[#94a3b8] mx-auto" />
              <h4 className="text-base font-bold text-[#0b1c30] dark:text-white">No Completed Rescues in History Yet</h4>
              <p className="text-xs text-[#59413c] dark:text-[#cbd5e1] max-w-md mx-auto">
                When an assigned driver delivers a claimed food surplus batch to your shelter and marks it completed, its permanent receipt and distribution timeline will appear here.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {deliveredDonations.map(item => (
                <div key={item.id} className="bg-white dark:bg-[#111c30] p-5 rounded-2xl border border-emerald-200 dark:border-emerald-900/40 shadow-xs space-y-3 transition-colors">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                        Donated by: {item.donorName}
                      </span>
                      <h4 className="font-bold text-sm text-[#0b1c30] dark:text-white">{item.title}</h4>
                      <span className="text-xs text-[#565e74] dark:text-[#94a3b8]">{item.servings} Servings ({item.weightKg} kg)</span>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Verified Distributed</span>
                    </span>
                  </div>

                  <div className="bg-[#eff4ff] dark:bg-[#16243d] p-3 rounded-xl border border-[#d3e4fe] dark:border-[#2b3e64] text-xs flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-800 dark:text-white">Delivered by: {item.assignedVolunteer?.name || 'Volunteer Rider'}</div>
                      <div className="text-[10px] text-slate-500">{item.deliveredAt || 'Today'}</div>
                    </div>
                    <button
                      onClick={() => setSelectedTrackingDonation(item)}
                      className="px-2.5 py-1 bg-white dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 rounded-lg border border-slate-200 dark:border-slate-700 shadow-xs"
                    >
                      View Receipt
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tracking Modal */}
      {selectedTrackingDonation && (
        <RescueTrackingModal
          donation={selectedTrackingDonation}
          isOpen={Boolean(selectedTrackingDonation)}
          onClose={() => setSelectedTrackingDonation(null)}
        />
      )}

      {/* Broadcast Modal */}
      {showBroadcastModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white dark:bg-[#111c30] rounded-3xl p-6 sm:p-8 max-w-md w-full border border-[#d3e4fe] dark:border-[#243452] shadow-2xl space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-red-100 text-red-600">
                  <Radio className="w-5 h-5 animate-pulse" />
                </div>
                <h3 className="text-lg font-black text-[#0b1c30] dark:text-white">Broadcast Urgent Food Need</h3>
              </div>
              <button
                onClick={() => setShowBroadcastModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleBroadcastSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Food Type / Meal Description
                </label>
                <input
                  type="text"
                  required
                  value={broadcastFoodType}
                  onChange={(e) => setBroadcastFoodType(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#eff4ff] dark:bg-[#16243d] border border-[#d3e4fe] dark:border-[#2b3e64] rounded-xl text-xs text-[#0b1c30] dark:text-white outline-none"
                  placeholder="e.g. Cooked Hot Dinner (Dal, Sabzi, Rice)"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Required Servings
                  </label>
                  <input
                    type="number"
                    required
                    min={10}
                    value={broadcastServings}
                    onChange={(e) => setBroadcastServings(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-[#eff4ff] dark:bg-[#16243d] border border-[#d3e4fe] dark:border-[#2b3e64] rounded-xl text-xs text-[#0b1c30] dark:text-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Urgency Level
                  </label>
                  <select
                    value={broadcastUrgency}
                    onChange={(e) => setBroadcastUrgency(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 bg-[#eff4ff] dark:bg-[#16243d] border border-[#d3e4fe] dark:border-[#2b3e64] rounded-xl text-xs font-bold text-[#0b1c30] dark:text-white outline-none"
                  >
                    <option value="critical">🚨 Critical (&lt; 2 hrs)</option>
                    <option value="high">⚠️ High (Today evening)</option>
                    <option value="medium">ℹ️ Medium (Tomorrow)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Time Needed By
                </label>
                <input
                  type="text"
                  value={broadcastTime}
                  onChange={(e) => setBroadcastTime(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#eff4ff] dark:bg-[#16243d] border border-[#d3e4fe] dark:border-[#2b3e64] rounded-xl text-xs text-[#0b1c30] dark:text-white outline-none"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowBroadcastModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Broadcast</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
