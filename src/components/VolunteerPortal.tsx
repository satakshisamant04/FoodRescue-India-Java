import React, { useState } from 'react';
import { 
  Truck, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  ShieldCheck, 
  Navigation, 
  Phone, 
  Award, 
  History, 
  Eye, 
  CheckSquare, 
  FileCheck,
  Map as MapIcon,
  Zap,
  Radio,
  ArrowRight
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { FoodDonation, UserProfile } from '../types';
import { RescueTrackingModal } from './Modals/RescueTrackingModal';
import { FoodRescueMap } from './FoodRescueMap';

interface VolunteerPortalProps {
  user: UserProfile;
  donations: FoodDonation[];
  onAcceptMission: (donationId: string) => void;
  onUpdateMissionStatus: (donationId: string, newStatus: 'picked_up' | 'delivered') => void;
}

export const VolunteerPortal: React.FC<VolunteerPortalProps> = ({
  user,
  donations,
  onAcceptMission,
  onUpdateMissionStatus
}) => {
  const [activeTab, setActiveTab] = useState<'runs' | 'history'>('runs');
  const [safetyChecked, setSafetyChecked] = useState(false);
  const [otpCode, setOtpCode] = useState('4829');
  const [selectedTrackingDonation, setSelectedTrackingDonation] = useState<FoodDonation | null>(null);
  const [showMapRoute, setShowMapRoute] = useState(true);

  // Missions currently assigned to this driver
  const myActiveMission = donations.find(d => 
    (d.assignedVolunteer?.id === user.id || d.assignedVolunteer?.name === user.name) && 
    d.status !== 'completed'
  );

  // Available missions waiting for a driver
  const availableMissions = donations.filter(d => 
    d.status === 'claimed' && !d.assignedVolunteer
  );

  // Completed missions by this driver
  const myCompletedMissions = donations.filter(d => 
    (d.assignedVolunteer?.id === user.id || d.assignedVolunteer?.name === user.name) && 
    d.status === 'completed'
  );

  const totalMealsDelivered = myCompletedMissions.reduce((acc, curr) => acc + (Number(curr.servings) || 0), 0);
  const totalVolunteerHours = user.stats.volunteerHours || (myCompletedMissions.length * 1.5 + (myActiveMission ? 0.5 : 0));
  const totalRunsCompleted = myCompletedMissions.length;

  const handlePickUp = (donationId: string) => {
    onUpdateMissionStatus(donationId, 'picked_up');
  };

  const handleCompleteDelivery = (donationId: string) => {
    confetti({
      particleCount: 120,
      spread: 80,
      origin: { y: 0.6 }
    });
    onUpdateMissionStatus(donationId, 'delivered');
    setSafetyChecked(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fadeIn">
      
      {/* Header Profile Banner */}
      <div className="bg-white dark:bg-[#111c30] rounded-3xl p-6 sm:p-8 border border-[#d3e4fe] dark:border-[#243452] shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6 transition-colors">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#ffdad2] dark:bg-[#ae3115]/30 text-[#8c1900] dark:text-[#ffb4a3] text-xs font-bold">
              <Truck className="w-3.5 h-3.5" />
              <span>Volunteer Driver Dispatch</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-950/40 text-purple-800 dark:text-purple-300 text-xs font-bold">
              <Radio className="w-3.5 h-3.5 text-purple-600" />
              <span>Kafka Event Pipeline Synchronized</span>
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#0b1c30] dark:text-white">
            {user.name}
          </h1>
          <p className="text-xs sm:text-sm text-[#59413c] dark:text-[#cbd5e1]">
            Vehicle: {user.vehicleType || 'Two-Wheeler with Insulated Food Carrier'} • Operating City: {user.city || 'Bhubaneswar'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-[#eff4ff] dark:bg-[#16243d] px-4 py-2 rounded-2xl border border-[#d3e4fe] dark:border-[#2b3e64] text-center">
            <div className="text-xs text-[#565e74] dark:text-[#94a3b8]">Meals Rescued</div>
            <div className="text-xl font-black text-emerald-600 dark:text-emerald-400">{totalMealsDelivered}</div>
          </div>
          <div className="bg-[#eff4ff] dark:bg-[#16243d] px-4 py-2 rounded-2xl border border-[#d3e4fe] dark:border-[#2b3e64] text-center">
            <div className="text-xs text-[#565e74] dark:text-[#94a3b8]">Total Hours</div>
            <div className="text-xl font-black text-[#ae3115] dark:text-[#ff7e62]">{totalVolunteerHours} hrs</div>
          </div>
          <div className="bg-[#eff4ff] dark:bg-[#16243d] px-4 py-2 rounded-2xl border border-[#d3e4fe] dark:border-[#2b3e64] text-center">
            <div className="text-xs text-[#565e74] dark:text-[#94a3b8]">Runs Completed</div>
            <div className="text-xl font-black text-[#0b1c30] dark:text-white">{totalRunsCompleted}</div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-[#d3e4fe] dark:border-[#243452] pb-3">
        <button
          onClick={() => setActiveTab('runs')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'runs'
              ? 'bg-[#0b1c30] dark:bg-white text-white dark:text-[#0b1c30] shadow-sm'
              : 'bg-[#eff4ff] dark:bg-[#16243d] text-[#565e74] dark:text-[#94a3b8] hover:bg-[#d3e4fe]/50'
          }`}
        >
          <Truck className="w-3.5 h-3.5" />
          <span>Live Dispatch & Missions ({availableMissions.length + (myActiveMission ? 1 : 0)})</span>
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
          <span>Completed Mission History ({myCompletedMissions.length})</span>
        </button>
      </div>

      {/* TAB 1: RUNS & DISPATCH */}
      {activeTab === 'runs' && (
        <div className="space-y-8">
          {/* ACTIVE RESCUE RUN SIMULATOR (If mission in progress) */}
          {myActiveMission ? (
            <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-800 space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
                  <h2 className="text-xl font-extrabold text-white">Active Rescue Mission in Progress</h2>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowMapRoute(!showMapRoute)}
                    className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg cursor-pointer transition-colors flex items-center gap-1.5 border border-slate-700"
                  >
                    <MapIcon className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{showMapRoute ? 'Hide Live Map' : 'Show Live Map'}</span>
                  </button>
                  <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 text-xs font-extrabold rounded-full border border-emerald-500/30">
                    Mission #{myActiveMission.id.slice(-6).toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Live Route Map */}
              {showMapRoute && myActiveMission.latitude && (
                <div className="rounded-2xl overflow-hidden border border-slate-800">
                  <FoodRescueMap
                    center={[myActiveMission.latitude, myActiveMission.longitude]}
                    userLocation={[user.latitude || 20.2961, user.longitude || 85.8245]}
                    userLabel="Volunteer Rider (You)"
                    activePickup={{
                      id: myActiveMission.id,
                      donationId: myActiveMission.id,
                      donorName: myActiveMission.donorName,
                      pickupAddress: myActiveMission.address,
                      pickupLatitude: myActiveMission.latitude,
                      pickupLongitude: myActiveMission.longitude,
                      ngoName: myActiveMission.claimedByNGO?.name || 'Aahaar Seva Shelter',
                      dropoffAddress: myActiveMission.claimedByNGO?.address || 'Old Town Night Shelter, Bhubaneswar',
                      dropoffLatitude: myActiveMission.claimedByNGO?.latitude || 20.2405,
                      dropoffLongitude: myActiveMission.claimedByNGO?.longitude || 85.8340,
                      servings: myActiveMission.servings,
                      status: myActiveMission.status === 'in_transit' ? 'in_transit' : 'assigned',
                      foodTitle: myActiveMission.title,
                      assignedVolunteerId: user.id,
                      assignedVolunteerName: user.name,
                      assignedVolunteerPhone: user.phone || '+91 98765 43210',
                      createdAt: new Date().toISOString()
                    }}
                    height="320px"
                  />
                </div>
              )}

              {/* Route details banner */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-800/60 p-5 rounded-2xl border border-slate-800">
                {/* Step 1: Pickup from Donor */}
                <div className="space-y-2">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-amber-400" />
                    <span>1. Pickup Point (Food Donor)</span>
                  </div>
                  <h4 className="text-base font-bold text-white">{myActiveMission.donorName}</h4>
                  <p className="text-xs text-slate-300">{myActiveMission.address}, {myActiveMission.city}</p>
                  <div className="flex items-center gap-2 text-xs text-amber-300 pt-1">
                    <Phone className="w-3.5 h-3.5" />
                    <span>{myActiveMission.contactPhone}</span>
                  </div>
                </div>

                {/* Step 2: Drop-off at Shelter */}
                <div className="space-y-2 border-t md:border-t-0 md:border-l border-slate-800 pt-4 md:pt-0 md:pl-6">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>2. Delivery Destination (Shelter)</span>
                  </div>
                  <h4 className="text-base font-bold text-white">{myActiveMission.claimedByNGO?.name || 'Aahaar Seva Foundation'}</h4>
                  <p className="text-xs text-slate-300">{myActiveMission.claimedByNGO?.address || 'Old Town Night Shelter, Bhubaneswar'}</p>
                  <div className="flex items-center gap-2 text-xs text-emerald-300 pt-1">
                    <Phone className="w-3.5 h-3.5" />
                    <span>{myActiveMission.claimedByNGO?.contact || '+91 94372 88990'}</span>
                  </div>
                </div>
              </div>

              {/* Food Details */}
              <div className="bg-slate-800/40 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs border border-slate-800">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Food Consignment</span>
                  <span className="font-bold text-white text-sm">{myActiveMission.title} ({myActiveMission.servings} Servings • {myActiveMission.weightKg} kg)</span>
                </div>
                <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                  Storage: {myActiveMission.storage}
                </span>
              </div>

              {/* Step 1 Action: Pickup Confirmation */}
              {myActiveMission.status === 'claimed' && (
                <div className="space-y-3 p-4 bg-slate-800/80 rounded-2xl border border-slate-700">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
                    <CheckSquare className="w-4 h-4" />
                    <span>Step 1: Arrive at Donor Location & Verify Freshness</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 text-xs text-slate-200 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={safetyChecked}
                        onChange={(e) => setSafetyChecked(e.target.checked)}
                        className="rounded accent-emerald-500 w-4 h-4 cursor-pointer"
                      />
                      <span>I verified food temperature and sealed in insulated carrier</span>
                    </label>
                  </div>
                  <button
                    disabled={!safetyChecked}
                    onClick={() => handlePickUp(myActiveMission.id)}
                    className="w-full py-3 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Truck className="w-4 h-4" />
                    <span>Confirm Food Collected & Start Delivery Route (Publishes Kafka Event)</span>
                  </button>
                </div>
              )}

              {/* Step 2 Action: Handover at Shelter */}
              {myActiveMission.status === 'in_transit' && (
                <div className="space-y-4 p-4 bg-slate-800/80 rounded-2xl border border-emerald-500/40">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Step 2: Arrived at Shelter & Safe Handover</span>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1">
                      <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                        Enter 4-Digit Shelter Handover PIN
                      </label>
                      <input
                        type="text"
                        maxLength={4}
                        placeholder="PIN (e.g. 4829)"
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-base font-mono font-bold text-white outline-none focus:border-emerald-500 text-center tracking-widest"
                      />
                    </div>
                    <div className="sm:self-end">
                      <button
                        onClick={() => handleCompleteDelivery(myActiveMission.id)}
                        className="w-full sm:w-auto px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Complete Mission Handover</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-[#eff4ff] dark:bg-[#16243d] rounded-3xl p-6 border border-[#d3e4fe] dark:border-[#2b3e64] flex items-center justify-between transition-colors">
              <div className="space-y-1">
                <h3 className="text-base font-bold text-[#0b1c30] dark:text-white">You are currently Online & Ready for Dispatch</h3>
                <p className="text-xs text-[#59413c] dark:text-[#cbd5e1]">Select an available mission below to start delivering food to shelters.</p>
              </div>
              <span className="px-3 py-1.5 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-xs font-extrabold rounded-full flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Dispatch Active
              </span>
            </div>
          )}

          {/* Available Missions Board */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black text-[#0b1c30] dark:text-white">Available Food Rescue Routes Nearby</h2>
              <span className="text-xs font-semibold text-[#565e74] dark:text-[#94a3b8]">{availableMissions.length} Routes Waiting Driver</span>
            </div>

            {availableMissions.length === 0 ? (
              <div className="bg-white dark:bg-[#111c30] rounded-3xl p-10 text-center border border-dashed border-[#d3e4fe] dark:border-[#243452] space-y-3">
                <Truck className="w-10 h-10 text-[#565e74] dark:text-[#94a3b8] mx-auto" />
                <h3 className="text-base font-bold text-[#0b1c30] dark:text-white">All active runs are currently covered!</h3>
                <p className="text-xs text-[#59413c] dark:text-[#cbd5e1] max-w-md mx-auto">
                  Great job! When an NGO claims a food batch requiring transport assistance, a new mission card will instantly appear here.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {availableMissions.map(item => (
                  <div key={item.id} className="bg-white dark:bg-[#111c30] rounded-2xl p-5 border border-[#d3e4fe] dark:border-[#243452] shadow-xs space-y-4 hover:shadow-md transition-all">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#ae3115] dark:text-[#ff7e62]">
                          {item.donorType} • {item.city}
                        </span>
                        <h3 className="text-base font-bold text-[#0b1c30] dark:text-white mt-0.5">{item.title}</h3>
                      </div>
                      <span className="px-2.5 py-1 bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 text-xs font-bold rounded-full">
                        Urgent Pickup
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 bg-[#eff4ff] dark:bg-[#16243d] p-3 rounded-xl text-center text-xs">
                      <div>
                        <span className="text-[10px] text-[#565e74] dark:text-[#94a3b8] block">Quantity</span>
                        <span className="font-extrabold text-[#ae3115] dark:text-[#ff7e62]">{item.servings} Portions</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-[#565e74] dark:text-[#94a3b8] block">Estimated Weight</span>
                        <span className="font-bold text-[#0b1c30] dark:text-white">~ {item.weightKg} kg</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-[#565e74] dark:text-[#94a3b8] block">Pickup Window</span>
                        <span className="font-bold text-[#0b1c30] dark:text-white">{item.pickupWindow || 'Within 1 hr'}</span>
                      </div>
                    </div>

                    <div className="space-y-1 text-xs text-[#565e74] dark:text-[#94a3b8]">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-[#ae3115] dark:text-[#ff7e62]" />
                        <span className="truncate">From: {item.address} ({item.donorName})</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span className="truncate">To: {item.claimedByNGO?.name || 'Shelter Facility'}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => onAcceptMission(item.id)}
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                    >
                      <Truck className="w-4 h-4" />
                      <span>Accept Route & Begin Rescue</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: COMPLETED MISSIONS HISTORY */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black text-[#0b1c30] dark:text-white">Completed Rescue Mission History</h2>
              <p className="text-xs text-[#565e74] dark:text-[#94a3b8]">Archive of all food batches picked up and safely delivered to shelters by you.</p>
            </div>
            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-900/50">
              {myCompletedMissions.length} Runs Completed
            </span>
          </div>

          {myCompletedMissions.length === 0 ? (
            <div className="bg-white dark:bg-[#111c30] rounded-3xl p-10 text-center border border-dashed border-[#d3e4fe] dark:border-[#243452] space-y-3">
              <History className="w-10 h-10 text-[#565e74] dark:text-[#94a3b8] mx-auto" />
              <h4 className="text-base font-bold text-[#0b1c30] dark:text-white">No Completed Runs in History Yet</h4>
              <p className="text-xs text-[#59413c] dark:text-[#cbd5e1] max-w-md mx-auto">
                Accept an open rescue route from the Dispatch tab, collect the meals from the food donor, and hand them over at the shelter to log your delivery runs here.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {myCompletedMissions.map(item => (
                <div key={item.id} className="bg-white dark:bg-[#111c30] p-5 rounded-2xl border border-emerald-200 dark:border-emerald-900/40 shadow-xs space-y-3 transition-colors">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Mission Completed
                      </span>
                      <h4 className="font-bold text-sm text-[#0b1c30] dark:text-white">{item.title}</h4>
                      <span className="text-xs text-[#565e74] dark:text-[#94a3b8]">{item.servings} Servings • {item.weightKg} kg</span>
                    </div>
                    <span className="text-xs font-mono font-bold text-[#565e74] dark:text-[#94a3b8]">
                      #{item.id.slice(-6).toUpperCase()}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 bg-[#eff4ff] dark:bg-[#16243d] p-3 rounded-xl text-center text-xs">
                    <div>
                      <span className="text-[10px] text-[#565e74] dark:text-[#94a3b8] block">Delivered To</span>
                      <span className="font-bold text-[#0b1c30] dark:text-white truncate block">{item.claimedByNGO?.name || 'Shelter'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#565e74] dark:text-[#94a3b8] block">Food Saved</span>
                      <span className="font-bold text-emerald-700 dark:text-emerald-400">{item.weightKg} kg</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#565e74] dark:text-[#94a3b8] block">Hours Logged</span>
                      <span className="font-bold text-[#ae3115] dark:text-[#ff7e62]">+1 Hour</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[#e5eeff] dark:border-[#243452] flex items-center justify-between">
                    <span className="text-[11px] text-[#565e74] dark:text-[#94a3b8]">Handed over at {item.deliveredAt || 'Delivered'}</span>
                    <button
                      onClick={() => setSelectedTrackingDonation(item)}
                      className="px-3 py-1.5 rounded-lg bg-[#eff4ff] dark:bg-[#16243d] hover:bg-[#ffdad2] dark:hover:bg-[#203050] text-xs font-bold text-[#0b1c30] dark:text-white flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      <span>View Route History</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Rescue Journey Tracking Modal */}
      {selectedTrackingDonation && (
        <RescueTrackingModal
          donation={selectedTrackingDonation}
          isOpen={Boolean(selectedTrackingDonation)}
          onClose={() => setSelectedTrackingDonation(null)}
        />
      )}

    </div>
  );
};
