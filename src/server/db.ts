import mongoose, { Schema } from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { 
  DEMO_USERS, 
  INITIAL_DONATIONS, 
  INITIAL_PICKUPS, 
  INITIAL_ACTIVITIES, 
  INITIAL_BROADCASTS, 
  INITIAL_PLATFORM_STATS,
  INITIAL_REDIS_METRICS,
  INITIAL_KAFKA_LOGS
} from '../data/mockData.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Data Directory for persistent backup JSON
const DATA_DIR = path.resolve(__dirname, '../../data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

// Ensure data folder exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// -------------------------------------------------------------
// TypeScript Interfaces
// -------------------------------------------------------------
export interface StoredUser {
  id: string;
  name: string;
  email: string;
  password?: string;
  phone: string;
  role: 'donor' | 'ngo' | 'volunteer';
  organization?: string;
  city: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  fssaiNumber?: string;
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

export interface FoodDonationItem {
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
  latitude: number;
  longitude: number;
  distanceKm?: number;
  status: 'available' | 'requested' | 'claimed' | 'picked_up' | 'in_transit' | 'completed' | 'cancelled' | 'expired';
  contactPhone: string;
  notes?: string;
  image?: string;
  createdAt: string;
  dispatchedAt?: string;
  deliveredAt?: string;
  milestones?: Array<{
    status: 'posted' | 'available' | 'claimed' | 'dispatched' | 'picked_up' | 'in_transit' | 'delivered' | 'completed';
    title: string;
    timestamp: string;
    description: string;
    actorName?: string;
    location?: string;
  }>;
  claimedByNGO?: {
    id: string;
    name: string;
    contact: string;
    address: string;
    claimedAt: string;
  };
  assignedVolunteer?: {
    id: string;
    name: string;
    phone: string;
    vehicle: string;
    status: 'assigned' | 'en_route_pickup' | 'picked_up' | 'en_route_delivery' | 'delivered';
  };
}

export interface StoredPickup {
  id: string;
  donationId: string;
  donationTitle: string;
  quantity: number;
  pickupAddress: string;
  pickupLatitude: number;
  pickupLongitude: number;
  dropoffAddress: string;
  dropoffLatitude: number;
  dropoffLongitude: number;
  donorName: string;
  donorPhone: string;
  ngoName: string;
  ngoPhone: string;
  volunteerId?: string;
  volunteerName?: string;
  volunteerPhone?: string;
  status: 'pending' | 'assigned' | 'picked_up' | 'in_transit' | 'delivered' | 'cancelled';
  assignedAt?: string;
  pickedUpAt?: string;
  deliveredAt?: string;
  createdAt: string;
}

export interface NGOBroadcast {
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

export interface FundDonation {
  id: string;
  donorName: string;
  donorEmail: string;
  donorPan?: string;
  amountRupees: number;
  mealsSponsored: number;
  timestamp: string;
  paymentId: string;
  taxExemptionEligible: boolean;
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

export interface PlatformStats {
  totalMealsRescued: number;
  totalKgSaved: number;
  co2PreventedKg: number;
  totalRupeesDonated: number;
  activeVolunteers: number;
  verifiedNGOs: number;
  partnerRestaurants: number;
}

export interface RedisMetricsState {
  key: string;
  status: 'HIT' | 'MISS' | 'EVICTED' | 'SET';
  hits: number;
  misses: number;
  cachedCount: number;
  ttlSecondsRemaining: number;
  lastUpdated: string;
  avgLatencyMs: number;
}

export interface KafkaEventRecord {
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

// -------------------------------------------------------------
// Mongoose Schemas & Models
// -------------------------------------------------------------
const UserSchema = new Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String },
  phone: { type: String, default: '+91 94370 12345' },
  role: { type: String, required: true, enum: ['donor', 'ngo', 'volunteer'] },
  organization: { type: String },
  city: { type: String, default: 'Bhubaneswar (Odisha)' },
  address: { type: String, default: '' },
  latitude: { type: Number },
  longitude: { type: Number },
  fssaiNumber: { type: String },
  vehicleType: { type: String },
  joinedDate: { type: String, default: 'Today' },
  stats: {
    mealsCount: { type: Number, default: 0 },
    donationsCount: { type: Number, default: 0 },
    deliveriesCount: { type: Number, default: 0 },
    volunteerHours: { type: Number, default: 0 },
    totalRupeesContributed: { type: Number, default: 0 }
  }
}, { timestamps: true, strict: false });

const DonationSchema = new Schema({
  id: { type: String, required: true, unique: true },
  donorId: { type: String, required: true },
  donorName: { type: String, required: true },
  donorPhone: { type: String },
  donorType: { type: String, default: 'Restaurant' },
  title: { type: String, required: true },
  description: { type: String },
  category: { type: String, default: 'cooked_meals' },
  servings: { type: Number, default: 0 },
  weightKg: { type: Number, default: 0 },
  storage: { type: String, default: 'ambient' },
  vegNonVeg: { type: String, default: 'pure_veg' },
  preparedAt: { type: String, default: 'Freshly prepared' },
  expiryTime: { type: String, default: 'In 4 hours' },
  pickupWindow: { type: String, default: 'Immediate' },
  address: { type: String, default: '' },
  city: { type: String, default: 'Bhubaneswar (Odisha)' },
  locality: { type: String, default: 'Local Area' },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  status: { type: String, default: 'available' },
  contactPhone: { type: String, default: '+91 94370 12345' },
  notes: { type: String },
  image: { type: String },
  createdAt: { type: String, default: 'Just now' },
  dispatchedAt: { type: String },
  deliveredAt: { type: String },
  milestones: { type: Array, default: [] },
  claimedByNGO: { type: Schema.Types.Mixed },
  assignedVolunteer: { type: Schema.Types.Mixed }
}, { timestamps: true, strict: false });

const PickupSchema = new Schema({
  id: { type: String, required: true, unique: true },
  donationId: { type: String, required: true },
  donationTitle: { type: String, required: true },
  quantity: { type: Number, default: 0 },
  pickupAddress: { type: String, default: '' },
  pickupLatitude: { type: Number },
  pickupLongitude: { type: Number },
  dropoffAddress: { type: String, default: '' },
  dropoffLatitude: { type: Number },
  dropoffLongitude: { type: Number },
  donorName: { type: String },
  donorPhone: { type: String },
  ngoName: { type: String },
  ngoPhone: { type: String },
  volunteerId: { type: String },
  volunteerName: { type: String },
  volunteerPhone: { type: String },
  status: { type: String, default: 'pending' },
  assignedAt: { type: String },
  pickedUpAt: { type: String },
  deliveredAt: { type: String },
  createdAt: { type: String, default: 'Just now' }
}, { timestamps: true, strict: false });

const BroadcastSchema = new Schema({
  id: { type: String, required: true, unique: true },
  ngoName: { type: String, required: true },
  location: { type: String, required: true },
  requiredServings: { type: Number, required: true },
  foodType: { type: String, required: true },
  urgency: { type: String, default: 'high' },
  timeNeededBy: { type: String, required: true },
  contactPerson: { type: String, required: true },
  contactPhone: { type: String, required: true },
  createdAt: { type: String, default: 'Just now' }
}, { timestamps: true, strict: false });

const FundDonationSchema = new Schema({
  id: { type: String, required: true, unique: true },
  donorName: { type: String, required: true },
  donorEmail: { type: String, required: true },
  donorPan: { type: String },
  amountRupees: { type: Number, required: true },
  mealsSponsored: { type: Number, required: true },
  timestamp: { type: String, default: 'Just now' },
  paymentId: { type: String, required: true },
  taxExemptionEligible: { type: Boolean, default: true }
}, { timestamps: true, strict: false });

const ActivitySchema = new Schema({
  id: { type: String, required: true, unique: true },
  timestamp: { type: String, default: 'Just now' },
  message: { type: String, required: true },
  type: { type: String, required: true },
  meals: { type: Number, default: 0 },
  location: { type: String, default: '' },
  amountRupees: { type: Number }
}, { timestamps: true, strict: false });

const PlatformStatsSchema = new Schema({
  totalMealsRescued: { type: Number, default: 0 },
  totalKgSaved: { type: Number, default: 0 },
  co2PreventedKg: { type: Number, default: 0 },
  totalRupeesDonated: { type: Number, default: 0 },
  activeVolunteers: { type: Number, default: 0 },
  verifiedNGOs: { type: Number, default: 0 },
  partnerRestaurants: { type: Number, default: 0 }
}, { timestamps: true, strict: false });

export const UserModel = mongoose.models.User || mongoose.model('User', UserSchema);
export const DonationModel = mongoose.models.Donation || mongoose.model('Donation', DonationSchema);
export const PickupModel = mongoose.models.Pickup || mongoose.model('Pickup', PickupSchema);
export const BroadcastModel = mongoose.models.Broadcast || mongoose.model('Broadcast', BroadcastSchema);
export const FundDonationModel = mongoose.models.FundDonation || mongoose.model('FundDonation', FundDonationSchema);
export const ActivityModel = mongoose.models.Activity || mongoose.model('Activity', ActivitySchema);
export const PlatformStatsModel = mongoose.models.PlatformStats || mongoose.model('PlatformStats', PlatformStatsSchema);

// -------------------------------------------------------------
// In-Memory Cache with Disk & MongoDB synchronization
// -------------------------------------------------------------
interface DatabaseStore {
  users: StoredUser[];
  donations: FoodDonationItem[];
  pickups: StoredPickup[];
  broadcasts: NGOBroadcast[];
  fundDonations: FundDonation[];
  activities: ActivityItem[];
  stats: PlatformStats;
  redisMetrics: RedisMetricsState;
  kafkaLogs: KafkaEventRecord[];
}

let store: DatabaseStore = {
  users: [...DEMO_USERS] as unknown as StoredUser[],
  donations: [...INITIAL_DONATIONS] as unknown as FoodDonationItem[],
  pickups: [...INITIAL_PICKUPS] as unknown as StoredPickup[],
  broadcasts: [...INITIAL_BROADCASTS] as unknown as NGOBroadcast[],
  fundDonations: [],
  activities: [...INITIAL_ACTIVITIES] as unknown as ActivityItem[],
  stats: { ...INITIAL_PLATFORM_STATS },
  redisMetrics: { ...INITIAL_REDIS_METRICS },
  kafkaLogs: [...INITIAL_KAFKA_LOGS]
};

let isMongoConnected = false;

// Haversine Distance Formula in Kilometers
export function calculateHaversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371.0;
  const dLat = ((lat2 - lat1) * Math.PI) / 180.0;
  const dLon = ((lon2 - lon1) * Math.PI) / 180.0;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180.0) * Math.cos((lat2 * Math.PI) / 180.0) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

// Real live platform stats calculation directly from actual database arrays
export function calculatePlatformStats(): PlatformStats {
  const validDonations = store.donations.filter(d => d.status !== 'cancelled');
  const totalDonationMeals = validDonations.reduce((sum, d) => sum + (Number(d.servings) || 0), 0);
  const totalFundMeals = store.fundDonations.reduce((sum, f) => sum + (Number(f.mealsSponsored) || 0), 0);
  const totalMeals = totalDonationMeals + totalFundMeals;
  const totalKg = validDonations.reduce((sum, d) => sum + (Number(d.weightKg) || (Number(d.servings) * 0.25) || 0), 0);
  const totalRupees = store.fundDonations.reduce((sum, f) => sum + (Number(f.amountRupees) || 0), 0);
  
  const volunteers = store.users.filter(u => u.role === 'volunteer').length;
  const ngos = store.users.filter(u => u.role === 'ngo').length;
  const donors = store.users.filter(u => u.role === 'donor').length;

  return {
    totalMealsRescued: totalMeals,
    totalKgSaved: Math.round(totalKg * 10) / 10,
    co2PreventedKg: Math.round(totalKg * 2.5),
    totalRupeesDonated: totalRupees,
    activeVolunteers: Math.max(volunteers, 1),
    verifiedNGOs: Math.max(ngos, 2),
    partnerRestaurants: Math.max(donors, 2)
  };
}

// Ensure each user's stats precisely reflect actual database records
export function syncUserStats(user: StoredUser): StoredUser {
  if (!user.stats) {
    user.stats = {
      mealsCount: 0,
      donationsCount: 0,
      deliveriesCount: 0,
      volunteerHours: 0,
      totalRupeesContributed: 0
    };
  }

  if (user.role === 'donor') {
    const myDonations = store.donations.filter(d => 
      (d.donorId === user.id || d.donorName === user.organization || d.donorName === user.name) && 
      d.status !== 'cancelled'
    );
    const donorFunds = store.fundDonations.filter(f => f.donorEmail?.toLowerCase() === user.email.toLowerCase());
    const fundMeals = donorFunds.reduce((sum, f) => sum + (f.mealsSponsored || 0), 0);
    const totalRupees = donorFunds.reduce((sum, f) => sum + (f.amountRupees || 0), 0);

    user.stats.donationsCount = myDonations.length;
    user.stats.mealsCount = myDonations.reduce((sum, d) => sum + (d.servings || 0), 0) + fundMeals;
    user.stats.totalRupeesContributed = totalRupees;
  } else if (user.role === 'ngo') {
    const myClaims = store.donations.filter(d => 
      (d.claimedByNGO?.id === user.id || d.claimedByNGO?.name === user.organization || d.claimedByNGO?.name === user.name) &&
      d.status !== 'cancelled'
    );
    user.stats.donationsCount = myClaims.length;
    user.stats.mealsCount = myClaims.reduce((sum, d) => sum + (d.servings || 0), 0);
  } else if (user.role === 'volunteer') {
    const myDeliveries = store.donations.filter(d => 
      (d.assignedVolunteer?.id === user.id || d.assignedVolunteer?.name === user.name) &&
      d.status === 'completed'
    );
    const inTransit = store.donations.filter(d => 
      (d.assignedVolunteer?.id === user.id || d.assignedVolunteer?.name === user.name) &&
      d.status === 'in_transit'
    );
    user.stats.deliveriesCount = myDeliveries.length;
    user.stats.mealsCount = myDeliveries.reduce((sum, d) => sum + (d.servings || 0), 0);
    user.stats.volunteerHours = Math.round((myDeliveries.length * 1.5 + (inTransit.length ? 0.5 : 0)) * 10) / 10;
  }

  return user;
}

// Save current state to local JSON file for bulletproof persistence
function saveToDisk() {
  try {
    store.stats = calculatePlatformStats();
    fs.writeFileSync(DB_FILE, JSON.stringify(store, null, 2), 'utf-8');
  } catch (err) {
    console.error('[DB] Error writing to disk store:', err);
  }
}

// Load from disk file
function loadFromDisk() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      if (raw.trim()) {
        const parsed = JSON.parse(raw);
        store = {
          users: parsed.users?.length ? parsed.users : [...DEMO_USERS],
          donations: parsed.donations?.length ? parsed.donations : [...INITIAL_DONATIONS],
          pickups: parsed.pickups?.length ? parsed.pickups : [...INITIAL_PICKUPS],
          broadcasts: parsed.broadcasts?.length ? parsed.broadcasts : [...INITIAL_BROADCASTS],
          fundDonations: parsed.fundDonations || [],
          activities: parsed.activities?.length ? parsed.activities : [...INITIAL_ACTIVITIES],
          stats: calculatePlatformStats(),
          redisMetrics: parsed.redisMetrics || { ...INITIAL_REDIS_METRICS },
          kafkaLogs: parsed.kafkaLogs || [...INITIAL_KAFKA_LOGS]
        };
        // Re-sync all users
        store.users.forEach(u => syncUserStats(u));
        store.stats = calculatePlatformStats();
        console.log(`[DB] Successfully loaded persistent data from disk (${store.users.length} users, ${store.donations.length} donations)`);
      }
    } else {
      saveToDisk();
    }
  } catch (err) {
    console.error('[DB] Error reading from disk store:', err);
  }
}

// Initialize Database (MongoDB + Disk Fallback)
export async function initDatabase(): Promise<void> {
  // Always load disk database first so data is immediately available
  loadFromDisk();

  mongoose.set('bufferCommands', false);
  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || process.env.DATABASE_URL;

  if (mongoUri) {
    try {
      console.log('[DB] Connecting to MongoDB cluster...');
      await mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 5000
      });
      isMongoConnected = true;
      console.log('[DB] MongoDB Connected Successfully!');

      // Hydrate memory from MongoDB if MongoDB has data
      const dbUsers = await (UserModel as any).find().lean();
      const dbDonations = await (DonationModel as any).find().lean();
      const dbPickups = await (PickupModel as any).find().lean();
      const dbBroadcasts = await (BroadcastModel as any).find().lean();
      const dbFunds = await (FundDonationModel as any).find().lean();
      const dbActivities = await (ActivityModel as any).find().lean();
      const dbStats = await (PlatformStatsModel as any).findOne().lean();

      if (dbUsers.length > 0 || dbDonations.length > 0) {
        store.users = (dbUsers as unknown as StoredUser[]) || store.users;
        store.donations = (dbDonations as unknown as FoodDonationItem[]) || store.donations;
        store.pickups = (dbPickups as unknown as StoredPickup[]) || store.pickups;
        store.broadcasts = (dbBroadcasts as unknown as NGOBroadcast[]) || store.broadcasts;
        store.fundDonations = (dbFunds as unknown as FundDonation[]) || store.fundDonations;
        store.activities = (dbActivities as unknown as ActivityItem[]) || store.activities;
        if (dbStats) {
          store.stats = dbStats as unknown as PlatformStats;
        }
        saveToDisk();
      } else if (store.users.length > 0 || store.donations.length > 0) {
        // Seed MongoDB from local disk data
        console.log('[DB] Seeding MongoDB from local storage...');
        if (store.users.length) await (UserModel as any).insertMany(store.users);
        if (store.donations.length) await (DonationModel as any).insertMany(store.donations);
        if (store.pickups.length) await (PickupModel as any).insertMany(store.pickups);
        if (store.broadcasts.length) await (BroadcastModel as any).insertMany(store.broadcasts);
        if (store.fundDonations.length) await (FundDonationModel as any).insertMany(store.fundDonations);
        if (store.activities.length) await (ActivityModel as any).insertMany(store.activities);
        await (PlatformStatsModel as any).create(store.stats);
      }
    } catch (error) {
      console.warn('[DB] Could not connect to MongoDB cluster, falling back seamlessly to persistent disk store:', (error as Error).message);
      isMongoConnected = false;
    }
  } else {
    console.log('[DB] Operating with persistent storage in data/db.json.');
  }
}

// -------------------------------------------------------------
// Database Operations (CRUD) with dual MongoDB & Disk sync
// -------------------------------------------------------------
export const db = {
  isMongo(): boolean {
    return isMongoConnected;
  },

  // USERS
  getUsers(): StoredUser[] {
    return store.users.map(u => syncUserStats(u));
  },

  findUserByEmail(email: string): StoredUser | undefined {
    const user = store.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    return user ? syncUserStats(user) : undefined;
  },

  findUserById(id: string): StoredUser | undefined {
    const user = store.users.find(u => u.id === id);
    return user ? syncUserStats(user) : undefined;
  },

  async createUser(user: StoredUser): Promise<StoredUser> {
    store.users = store.users.filter(u => u.email.toLowerCase() !== user.email.toLowerCase());
    const synced = syncUserStats(user);
    store.users.unshift(synced);

    saveToDisk();

    if (isMongoConnected) {
      try {
        await (UserModel as any).findOneAndUpdate({ id: user.id }, synced, { upsert: true, new: true }).exec();
        await (PlatformStatsModel as any).findOneAndUpdate({}, store.stats, { upsert: true }).exec();
      } catch (err) {
        console.error('[DB-Mongo] Error saving user to MongoDB:', err);
      }
    }

    return synced;
  },

  async updateUser(id: string, updates: Partial<StoredUser>): Promise<StoredUser | null> {
    const idx = store.users.findIndex(u => u.id === id);
    if (idx === -1) return null;

    store.users[idx] = { ...store.users[idx], ...updates };
    saveToDisk();

    if (isMongoConnected) {
      try {
        await (UserModel as any).findOneAndUpdate({ id }, { $set: updates }).exec();
      } catch (err) {
        console.error('[DB-Mongo] Error updating user in MongoDB:', err);
      }
    }

    return store.users[idx];
  },

  async deleteUser(id: string): Promise<boolean> {
    const user = store.users.find(u => u.id === id);
    if (!user) return false;

    store.users = store.users.filter(u => u.id !== id);
    if (user.role === 'donor' && store.stats.partnerRestaurants > 0) store.stats.partnerRestaurants -= 1;
    if (user.role === 'ngo' && store.stats.verifiedNGOs > 0) store.stats.verifiedNGOs -= 1;
    if (user.role === 'volunteer' && store.stats.activeVolunteers > 0) store.stats.activeVolunteers -= 1;

    saveToDisk();

    if (isMongoConnected) {
      try {
        await (UserModel as any).deleteOne({ id }).exec();
        await (PlatformStatsModel as any).findOneAndUpdate({}, store.stats, { upsert: true }).exec();
      } catch (err) {
        console.error('[DB-Mongo] Error deleting user in MongoDB:', err);
      }
    }
    return true;
  },

  // DONATIONS
  getDonations(filters?: { status?: string; city?: string; category?: string }): FoodDonationItem[] {
    let result = [...store.donations];
    if (filters?.status && filters.status !== 'all') {
      result = result.filter(d => d.status === filters.status);
    }
    if (filters?.city && filters.city !== 'all') {
      result = result.filter(d => d.city.toLowerCase().includes(filters.city!.toLowerCase()));
    }
    if (filters?.category && filters.category !== 'all') {
      result = result.filter(d => d.category === filters.category);
    }
    return result;
  },

  getAvailableDonations(): { data: FoodDonationItem[]; fromCache: boolean; latencyMs: number } {
    const available = store.donations.filter(d => d.status === 'available');
    
    // Simulate Redis cache hit tracking
    if (store.redisMetrics.status !== 'EVICTED') {
      store.redisMetrics.hits += 1;
      store.redisMetrics.status = 'HIT';
      store.redisMetrics.cachedCount = available.length;
      return { data: available, fromCache: true, latencyMs: 3.2 };
    } else {
      store.redisMetrics.misses += 1;
      store.redisMetrics.status = 'SET';
      store.redisMetrics.cachedCount = available.length;
      return { data: available, fromCache: false, latencyMs: 38.5 };
    }
  },

  getNearbyDonations(ngoLat: number, ngoLon: number, radiusKm = 25): FoodDonationItem[] {
    const available = store.donations.filter(d => d.status === 'available' && d.latitude && d.longitude);
    
    return available
      .map(d => {
        const distance = calculateHaversineDistanceKm(ngoLat, ngoLon, d.latitude, d.longitude);
        return { ...d, distanceKm: distance };
      })
      .filter(d => (d.distanceKm || 0) <= radiusKm)
      .sort((a, b) => (a.distanceKm || 0) - (b.distanceKm || 0));
  },

  findDonationById(id: string): FoodDonationItem | undefined {
    return store.donations.find(d => d.id === id);
  },

  async createDonation(donation: FoodDonationItem): Promise<FoodDonationItem> {
    store.donations.unshift(donation);

    // Update stats
    store.stats.totalMealsRescued += donation.servings || 0;
    store.stats.totalKgSaved += donation.weightKg || 0;
    store.stats.co2PreventedKg += Math.round((donation.weightKg || 0) * 2.5);

    // Update donor stats
    const donor = store.users.find(u => u.id === donation.donorId);
    if (donor) {
      donor.stats.donationsCount += 1;
      donor.stats.mealsCount += donation.servings || 0;
    }

    // 1. Evict Redis Cache
    store.redisMetrics.status = 'EVICTED';
    store.redisMetrics.lastUpdated = 'Just now (Cache invalidated by new donation)';

    // 2. Publish to Kafka Log Stream
    const kafkaRecord: KafkaEventRecord = {
      offset: store.kafkaLogs.length + 100,
      partition: Math.floor(Math.random() * 3),
      topic: 'food-donation-events',
      eventType: 'FOOD_DONATION_CREATED',
      donationId: donation.id,
      title: donation.title,
      quantity: donation.servings,
      donorOrNgo: donation.donorName,
      timestamp: 'Just now',
      consumerStatus: 'PROCESSED'
    };
    store.kafkaLogs.unshift(kafkaRecord);

    // Add activity
    const activity: ActivityItem = {
      id: `act-${Date.now()}`,
      timestamp: 'Just now',
      message: `${donation.donorName} listed ${donation.servings} portions of ${donation.title}`,
      type: 'donation_posted',
      meals: donation.servings,
      location: donation.city
    };
    store.activities.unshift(activity);

    saveToDisk();

    if (isMongoConnected) {
      try {
        await (DonationModel as any).create(donation);
        await (ActivityModel as any).create(activity);
        if (donor) await (UserModel as any).findOneAndUpdate({ id: donor.id }, { $set: donor }).exec();
        await (PlatformStatsModel as any).findOneAndUpdate({}, store.stats, { upsert: true }).exec();
      } catch (err) {
        console.error('[DB-Mongo] Error saving donation to MongoDB:', err);
      }
    }

    return donation;
  },

  async updateDonation(id: string, updates: Partial<FoodDonationItem>): Promise<FoodDonationItem | null> {
    const idx = store.donations.findIndex(d => d.id === id);
    if (idx === -1) return null;

    store.donations[idx] = { ...store.donations[idx], ...updates };

    // Evict Redis Cache
    store.redisMetrics.status = 'EVICTED';
    store.redisMetrics.lastUpdated = 'Just now (Cache invalidated)';

    saveToDisk();

    if (isMongoConnected) {
      try {
        await (DonationModel as any).findOneAndUpdate({ id }, { $set: updates }).exec();
      } catch (err) {
        console.error('[DB-Mongo] Error updating donation in MongoDB:', err);
      }
    }

    return store.donations[idx];
  },

  async cancelDonation(id: string, donorId: string): Promise<FoodDonationItem | null> {
    const donation = store.donations.find(d => d.id === id);
    if (!donation) return null;
    if (donation.donorId !== donorId) {
      throw new Error('Unauthorized');
    }
    if (donation.status !== 'available') {
      throw new Error('Only available donations can be cancelled');
    }

    donation.status = 'cancelled';

    // Evict Redis Cache
    store.redisMetrics.status = 'EVICTED';

    // Kafka event
    store.kafkaLogs.unshift({
      offset: store.kafkaLogs.length + 100,
      partition: 0,
      topic: 'food-donation-events',
      eventType: 'FOOD_DONATION_CANCELLED',
      donationId: donation.id,
      title: donation.title,
      quantity: donation.servings,
      donorOrNgo: donation.donorName,
      timestamp: 'Just now',
      consumerStatus: 'PROCESSED'
    });

    saveToDisk();
    return donation;
  },

  async claimDonation(
    id: string, 
    ngo: { id: string; name: string; contact: string; address: string; latitude?: number; longitude?: number }
  ): Promise<{ donation: FoodDonationItem; pickup: StoredPickup } | null> {
    const donation = store.donations.find(d => d.id === id);
    if (!donation) return null;

    // Double-claim prevention (concurrency protection)
    if (donation.status !== 'available') {
      throw new Error('Donation has already been claimed or is no longer available');
    }

    donation.status = 'claimed';
    donation.claimedByNGO = {
      id: ngo.id,
      name: ngo.name,
      contact: ngo.contact,
      address: ngo.address,
      claimedAt: 'Just now'
    };

    donation.milestones = donation.milestones || [];
    donation.milestones.push({
      status: 'claimed',
      title: `Claimed by ${ngo.name}`,
      timestamp: 'Just now',
      description: `Assigned to shelter. Ready for volunteer dispatch.`
    });

    // Create Pickup task for volunteers
    const pickup: StoredPickup = {
      id: `pickup-${Date.now()}`,
      donationId: donation.id,
      donationTitle: donation.title,
      quantity: donation.servings,
      pickupAddress: donation.address,
      pickupLatitude: donation.latitude,
      pickupLongitude: donation.longitude,
      dropoffAddress: ngo.address || 'Local Shelter Facility',
      dropoffLatitude: ngo.latitude || 20.2405,
      dropoffLongitude: ngo.longitude || 85.8340,
      donorName: donation.donorName,
      donorPhone: donation.contactPhone,
      ngoName: ngo.name,
      ngoPhone: ngo.contact,
      status: 'pending',
      createdAt: 'Just now'
    };
    store.pickups.unshift(pickup);

    // Evict Redis Cache
    store.redisMetrics.status = 'EVICTED';
    store.redisMetrics.lastUpdated = 'Just now (Cache invalidated by claim)';

    // Publish Kafka Event
    store.kafkaLogs.unshift({
      offset: store.kafkaLogs.length + 100,
      partition: 1,
      topic: 'food-donation-events',
      eventType: 'FOOD_DONATION_CLAIMED',
      donationId: donation.id,
      title: donation.title,
      quantity: donation.servings,
      donorOrNgo: ngo.name,
      timestamp: 'Just now',
      consumerStatus: 'PROCESSED'
    });

    // Update NGO user stats
    const ngoUser = store.users.find(u => u.id === ngo.id || u.name === ngo.name);
    if (ngoUser) {
      ngoUser.stats.donationsCount += 1;
      ngoUser.stats.mealsCount += donation.servings;
    }

    const activity: ActivityItem = {
      id: `act-${Date.now()}`,
      timestamp: 'Just now',
      message: `${ngo.name} claimed ${donation.servings} meals (${donation.title})`,
      type: 'donation_claimed',
      meals: donation.servings,
      location: donation.city
    };
    store.activities.unshift(activity);

    saveToDisk();

    if (isMongoConnected) {
      try {
        await (DonationModel as any).findOneAndUpdate({ id }, { $set: donation }).exec();
        await (PickupModel as any).create(pickup);
        await (ActivityModel as any).create(activity);
        if (ngoUser) await (UserModel as any).findOneAndUpdate({ id: ngoUser.id }, { $set: ngoUser }).exec();
      } catch (err) {
        console.error('[DB-Mongo] Error updating claim in MongoDB:', err);
      }
    }

    return { donation, pickup };
  },

  // PICKUPS
  getPickups(status?: string): StoredPickup[] {
    if (status && status !== 'all') {
      return store.pickups.filter(p => p.status === status);
    }
    return store.pickups;
  },

  getAvailablePickups(): StoredPickup[] {
    return store.pickups.filter(p => p.status === 'pending');
  },

  getVolunteerPickups(volunteerId: string): StoredPickup[] {
    return store.pickups.filter(p => p.volunteerId === volunteerId);
  },

  async acceptPickup(pickupId: string, volunteer: { id: string; name: string; phone: string; vehicle?: string }): Promise<StoredPickup | null> {
    const pickup = store.pickups.find(p => p.id === pickupId);
    if (!pickup) return null;
    if (pickup.status !== 'pending') {
      throw new Error('Pickup has already been assigned to another volunteer');
    }

    pickup.volunteerId = volunteer.id;
    pickup.volunteerName = volunteer.name;
    pickup.volunteerPhone = volunteer.phone;
    pickup.status = 'assigned';
    pickup.assignedAt = 'Just now';

    // Update corresponding donation
    const donation = store.donations.find(d => d.id === pickup.donationId);
    if (donation) {
      donation.status = 'in_transit';
      donation.assignedVolunteer = {
        id: volunteer.id,
        name: volunteer.name,
        phone: volunteer.phone,
        vehicle: volunteer.vehicle || 'Two-Wheeler with Thermal Box',
        status: 'assigned'
      };
      donation.milestones = donation.milestones || [];
      donation.milestones.push({
        status: 'in_transit',
        title: `Rider ${volunteer.name} Assigned`,
        timestamp: 'Just now',
        description: 'Volunteer accepted delivery task.'
      });
    }

    saveToDisk();
    return pickup;
  },

  async updatePickupStatus(
    pickupId: string, 
    status: 'picked_up' | 'delivered', 
    volunteerId: string
  ): Promise<StoredPickup | null> {
    const pickup = store.pickups.find(p => p.id === pickupId);
    if (!pickup) return null;

    pickup.status = status;
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (status === 'picked_up') {
      pickup.pickedUpAt = `Today at ${timestamp}`;
      const donation = store.donations.find(d => d.id === pickup.donationId);
      if (donation) {
        donation.status = 'in_transit';
        if (donation.assignedVolunteer) donation.assignedVolunteer.status = 'picked_up';
        donation.milestones?.push({
          status: 'picked_up',
          title: 'Food Picked Up from Donor',
          timestamp: `Today at ${timestamp}`,
          description: `Collected safely by ${pickup.volunteerName}`
        });
      }

      // Kafka Event
      store.kafkaLogs.unshift({
        offset: store.kafkaLogs.length + 100,
        partition: 2,
        topic: 'food-donation-events',
        eventType: 'FOOD_DONATION_PICKED_UP',
        donationId: pickup.donationId,
        title: pickup.donationTitle,
        quantity: pickup.quantity,
        donorOrNgo: pickup.volunteerName || 'Volunteer',
        timestamp: 'Just now',
        consumerStatus: 'PROCESSED'
      });

    } else if (status === 'delivered') {
      pickup.deliveredAt = `Today at ${timestamp}`;
      const donation = store.donations.find(d => d.id === pickup.donationId);
      if (donation) {
        donation.status = 'completed';
        donation.deliveredAt = `Delivered at ${timestamp}`;
        if (donation.assignedVolunteer) donation.assignedVolunteer.status = 'delivered';
        donation.milestones?.push({
          status: 'delivered',
          title: 'Food Delivered & Distributed',
          timestamp: `Today at ${timestamp}`,
          description: `Handed over fresh to ${pickup.ngoName}`
        });
      }

      // Update Volunteer stats
      const volunteerUser = store.users.find(u => u.id === volunteerId || u.name === pickup.volunteerName);
      if (volunteerUser) {
        volunteerUser.stats.deliveriesCount += 1;
        volunteerUser.stats.mealsCount += pickup.quantity;
        volunteerUser.stats.volunteerHours += 1;
      }

      // Kafka Event
      store.kafkaLogs.unshift({
        offset: store.kafkaLogs.length + 100,
        partition: 0,
        topic: 'food-donation-events',
        eventType: 'FOOD_DONATION_COMPLETED',
        donationId: pickup.donationId,
        title: pickup.donationTitle,
        quantity: pickup.quantity,
        donorOrNgo: pickup.ngoName,
        timestamp: 'Just now',
        consumerStatus: 'PROCESSED'
      });

      const activity: ActivityItem = {
        id: `act-${Date.now()}`,
        timestamp: 'Just now',
        message: `DELIVERED: ${pickup.quantity} meals delivered to ${pickup.ngoName}`,
        type: 'delivery_completed',
        meals: pickup.quantity,
        location: pickup.dropoffAddress
      };
      store.activities.unshift(activity);
    }

    saveToDisk();
    return pickup;
  },

  // REDIS CACHE OPERATIONS
  getRedisMetrics(): RedisMetricsState {
    return store.redisMetrics;
  },

  evictRedisCache(): boolean {
    store.redisMetrics.status = 'EVICTED';
    store.redisMetrics.lastUpdated = 'Manual eviction via Developer Inspector';
    saveToDisk();
    return true;
  },

  // KAFKA OPERATIONS
  getKafkaLogs(): KafkaEventRecord[] {
    return store.kafkaLogs;
  },

  // BROADCASTS
  getBroadcasts(): NGOBroadcast[] {
    return store.broadcasts;
  },

  async createBroadcast(broadcast: NGOBroadcast): Promise<NGOBroadcast> {
    store.broadcasts.unshift(broadcast);

    const activity: ActivityItem = {
      id: `act-${Date.now()}`,
      timestamp: 'Just now',
      message: `URGENT BROADCAST: ${broadcast.ngoName} requested ${broadcast.requiredServings} servings of ${broadcast.foodType}`,
      type: 'urgent_broadcast',
      meals: broadcast.requiredServings,
      location: broadcast.location
    };
    store.activities.unshift(activity);

    saveToDisk();

    if (isMongoConnected) {
      try {
        await (BroadcastModel as any).create(broadcast);
        await (ActivityModel as any).create(activity);
      } catch (err) {
        console.error('[DB-Mongo] Error saving broadcast to MongoDB:', err);
      }
    }

    return broadcast;
  },

  // FUND DONATIONS
  getFundDonations(): FundDonation[] {
    return store.fundDonations;
  },

  async createFundDonation(donation: FundDonation): Promise<FundDonation> {
    store.fundDonations.unshift(donation);

    store.stats.totalRupeesDonated += donation.amountRupees;
    store.stats.totalMealsRescued += donation.mealsSponsored;

    // Update user stats if matches donorEmail
    const donorUser = store.users.find(u => u.email.toLowerCase() === donation.donorEmail.toLowerCase());
    if (donorUser) {
      donorUser.stats.totalRupeesContributed = (donorUser.stats.totalRupeesContributed || 0) + donation.amountRupees;
      donorUser.stats.mealsCount += donation.mealsSponsored;
    }

    const activity: ActivityItem = {
      id: `act-${Date.now()}`,
      timestamp: 'Just now',
      message: `${donation.donorName} sponsored ₹${donation.amountRupees.toLocaleString()} (${donation.mealsSponsored} rescue meals funded)`,
      type: 'funds_donated',
      meals: donation.mealsSponsored,
      amountRupees: donation.amountRupees,
      location: 'Community Fund'
    };
    store.activities.unshift(activity);

    saveToDisk();

    if (isMongoConnected) {
      try {
        await (FundDonationModel as any).create(donation);
        await (ActivityModel as any).create(activity);
        if (donorUser) await (UserModel as any).findOneAndUpdate({ id: donorUser.id }, { $set: donorUser }).exec();
        await (PlatformStatsModel as any).findOneAndUpdate({}, store.stats, { upsert: true }).exec();
      } catch (err) {
        console.error('[DB-Mongo] Error saving fund donation to MongoDB:', err);
      }
    }

    return donation;
  },

  // ACTIVITIES
  getActivities(): ActivityItem[] {
    return store.activities;
  },

  // STATS
  getStats(): PlatformStats {
    store.stats = calculatePlatformStats();
    return store.stats;
  }
};
