export type UserRole = 'donor' | 'ngo' | 'volunteer';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  organization?: string;
  address?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  fssaiNumber?: string; // FSSAI food license for Indian restaurants/NGOs
  panNumber?: string;
  vehicleType?: string;
  joinedDate: string;
  stats: {
    mealsCount: number;
    donationsCount: number;
    deliveriesCount: number;
    volunteerHours: number;
    totalRupeesContributed?: number;
  };
}

export interface DonationMilestone {
  status: 'posted' | 'available' | 'claimed' | 'dispatched' | 'picked_up' | 'in_transit' | 'delivered' | 'completed';
  title: string;
  timestamp: string;
  description: string;
  actorName?: string;
  location?: string;
}

export interface FoodDonation {
  id: string;
  donorId: string;
  donorName: string;
  donorPhone?: string;
  donorType: 'Restaurant' | 'Hotel' | 'Catering' | 'Bakery' | 'Supermarket' | 'Corporate' | 'Individual';
  title: string;
  description?: string;
  category: 'cooked_meals' | 'bakery' | 'produce' | 'dairy' | 'packaged';
  servings: number;
  weightKg: number;
  storage: 'ambient' | 'refrigerated' | 'frozen';
  vegNonVeg: 'pure_veg' | 'non_veg' | 'egg';
  preparedAt: string;
  expiryTime: string;
  pickupWindow?: string;
  address: string;
  city: string;
  locality?: string;
  latitude?: number;
  longitude?: number;
  distanceKm?: number; // Calculated on-the-fly via Haversine for NGO radius filter
  status: 'available' | 'requested' | 'claimed' | 'picked_up' | 'in_transit' | 'completed' | 'cancelled' | 'expired';
  contactPhone: string;
  notes?: string;
  image?: string;
  createdAt: string;
  dispatchedAt?: string;
  deliveredAt?: string;
  milestones?: DonationMilestone[];
  claimedByNGO?: {
    id: string;
    name: string;
    contact: string;
    address: string;
    claimedAt: string;
    latitude?: number;
    longitude?: number;
  };
  assignedVolunteer?: {
    id: string;
    name: string;
    phone: string;
    vehicle: string;
    status: 'assigned' | 'en_route_pickup' | 'picked_up' | 'en_route_delivery' | 'delivered';
  };
}

export interface PickupTask {
  id: string;
  donationId: string;
  donationTitle?: string;
  foodTitle?: string;
  quantity?: number;
  servings?: number;
  pickupAddress: string;
  pickupLatitude: number;
  pickupLongitude: number;
  dropoffAddress: string;
  dropoffLatitude: number;
  dropoffLongitude: number;
  donorName: string;
  donorPhone?: string;
  ngoName: string;
  ngoPhone?: string;
  volunteerId?: string;
  volunteerName?: string;
  volunteerPhone?: string;
  assignedVolunteerId?: string;
  assignedVolunteerName?: string;
  assignedVolunteerPhone?: string;
  status: 'pending' | 'assigned' | 'picked_up' | 'in_transit' | 'delivered' | 'cancelled';
  assignedAt?: string;
  pickedUpAt?: string;
  deliveredAt?: string;
  createdAt: string;
}

export interface ActivityItem {
  id: string;
  timestamp: string;
  message: string;
  type: 'donation_posted' | 'donation_claimed' | 'delivery_completed' | 'urgent_broadcast' | 'funds_donated';
  meals: number;
  location: string;
  amountRupees?: number;
}

export interface NGOBroadcastRequest {
  id: string;
  ngoName: string;
  location: string;
  requiredServings: number;
  foodType: string;
  urgency: 'high' | 'critical' | 'medium';
  timeNeededBy: string;
  contactPerson: string;
  contactPhone: string;
  createdAt: string;
}

export interface PlatformStats {
  totalMealsRescued: number;
  totalKgSaved: number;
  co2PreventedKg: number;
  totalRupeesDonated: number;
  activeVolunteers: number;
  verifiedNGOs: number;
  partnerRestaurants: number;
}

export interface RedisCacheMetrics {
  key: string;
  status: 'HIT' | 'MISS' | 'EVICTED' | 'SET';
  hits: number;
  misses: number;
  cachedCount: number;
  ttlSecondsRemaining: number;
  lastUpdated: string;
  avgLatencyMs: number;
}

export interface KafkaLogRecord {
  offset: number;
  partition: number;
  topic: string;
  eventType: 'FOOD_DONATION_CREATED' | 'FOOD_DONATION_CLAIMED' | 'FOOD_DONATION_PICKED_UP' | 'FOOD_DONATION_COMPLETED' | 'FOOD_DONATION_CANCELLED';
  donationId: string;
  title: string;
  quantity: number;
  donorOrNgo: string;
  timestamp: string;
  consumerStatus: 'PROCESSED' | 'ACKNOWLEDGED' | 'DELIVERED';
}

export const CITIES_LIST = [
  'Bhubaneswar (Odisha)',
  'Cuttack (Odisha)',
  'Puri (Odisha)',
  'Rourkela (Odisha)',
  'Mumbai (Maharashtra)',
  'Delhi NCR',
  'Bengaluru (Karnataka)',
  'Hyderabad (Telangana)',
  'Kolkata (West Bengal)',
  'Chennai (Tamil Nadu)',
  'Pune (Maharashtra)',
  'Ahmedabad (Gujarat)'
];

