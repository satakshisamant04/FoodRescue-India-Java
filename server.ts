import express, { Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { 
  initDatabase, 
  db, 
  StoredUser, 
  FoodDonationItem, 
  NGOBroadcast, 
  FundDonation,
  StoredPickup
} from './src/server/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(cors());
app.use(express.json());

// -------------------------------------------------------------
// API ROUTES
// -------------------------------------------------------------

// DB Status Endpoint
app.get('/api/db-status', (_req: Request, res: Response) => {
  res.json({
    success: true,
    engine: db.isMongo() ? 'MongoDB (Atlas / Remote Cluster)' : 'Local Persistent Database (data/db.json)',
    isMongo: db.isMongo(),
    totalUsers: db.getUsers().length,
    totalDonations: db.getDonations().length
  });
});

// 1. Auth Routes
app.post('/api/auth/register', async (req: Request, res: Response) => {
  try {
    const { name, email, password, phone, role, organization, city, address, latitude, longitude, fssaiNumber, vehicleType } = req.body;

    if (!email || !role) {
      return res.status(400).json({ success: false, error: 'Email and role are required' });
    }

    const existing = db.findUserByEmail(email);
    if (existing) {
      return res.status(400).json({ success: false, error: 'An account with this email already exists' });
    }

    const defaultLat = role === 'ngo' ? 20.2405 : 20.3014;
    const defaultLon = role === 'ngo' ? 85.8340 : 85.8277;

    const newUser: StoredUser = {
      id: `user-${role}-${Date.now()}`,
      name: name || (role === 'donor' ? 'Partner Food Donor' : role === 'ngo' ? 'Shelter Director' : 'Volunteer Hero'),
      email: email.toLowerCase(),
      password: password || 'password123',
      phone: phone || '+91 94370 12345',
      role,
      organization: organization || (role === 'donor' ? `${name || 'Commercial'} Kitchen` : role === 'ngo' ? `${name || 'Community'} Shelter` : undefined),
      city: city || 'Bhubaneswar (Odisha)',
      address: address || '',
      latitude: latitude || defaultLat,
      longitude: longitude || defaultLon,
      fssaiNumber: fssaiNumber || undefined,
      vehicleType: vehicleType || (role === 'volunteer' ? 'Two-Wheeler with Insulated Food Bag' : undefined),
      joinedDate: 'Today',
      stats: {
        mealsCount: 0,
        donationsCount: 0,
        deliveriesCount: 0,
        volunteerHours: 0,
        totalRupeesContributed: 0
      }
    };

    const saved = await db.createUser(newUser);
    const { password: _, ...safeUser } = saved;

    res.status(201).json({
      success: true,
      user: safeUser,
      token: `jwt_token_${saved.id}_${Date.now()}`,
      message: 'Account created and saved to database successfully!'
    });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

app.post('/api/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email) {
    return res.status(400).json({ success: false, error: 'Email is required' });
  }

  const user = db.findUserByEmail(email);

  if (!user) {
    return res.status(404).json({ 
      success: false, 
      error: 'No account found with this email. Please click Register to create your account as a Food Donor, NGO, or Volunteer Driver.' 
    });
  }

  if (password && user.password && user.password !== password) {
    return res.status(401).json({ success: false, error: 'Invalid password. Please check your credentials.' });
  }

  const { password: _, ...safeUser } = user;
  res.json({
    success: true,
    user: safeUser,
    token: `jwt_token_${user.id}_${Date.now()}`,
    message: `Welcome back, ${user.name}!`
  });
});

app.get('/api/auth/users', (_req: Request, res: Response) => {
  const safeList = db.getUsers().map(({ password: _, ...u }) => u);
  res.json({ success: true, users: safeList });
});

app.get('/api/auth/demo-users', (_req: Request, res: Response) => {
  const safeList = db.getUsers().map(({ password: _, ...u }) => u);
  res.json({ success: true, users: safeList });
});

app.get('/api/auth/me', (req: Request, res: Response) => {
  const email = req.query.email as string;
  const id = req.query.id as string;
  if (!email && !id) {
    return res.status(400).json({ success: false, error: 'Email or id required' });
  }
  const user = email ? db.findUserByEmail(email) : db.findUserById(id);
  if (!user) {
    return res.status(404).json({ success: false, error: 'User not found' });
  }
  const { password: _, ...safeUser } = user;
  res.json({ success: true, user: safeUser });
});

app.delete('/api/auth/users/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deleted = await db.deleteUser(id);
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'User account not found' });
    }
    res.json({ success: true, message: 'Account permanently deleted from MongoDB and local storage' });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

// 2. Food Donations Routes
app.get('/api/donations', (req: Request, res: Response) => {
  const { status, city, category } = req.query;
  const filtered = db.getDonations({
    status: status as string,
    city: city as string,
    category: category as string
  });

  res.json({
    success: true,
    data: filtered,
    count: filtered.length
  });
});

// Redis cached available donations endpoint
app.get('/api/donations/available', (_req: Request, res: Response) => {
  const result = db.getAvailableDonations();
  res.json({
    success: true,
    data: result.data,
    fromCache: result.fromCache,
    latencyMs: result.latencyMs,
    count: result.data.length
  });
});

// Haversine Geospatial matching endpoint
app.get('/api/donations/nearby', (req: Request, res: Response) => {
  const lat = parseFloat(req.query.lat as string) || 20.2961;
  const lon = parseFloat(req.query.lon as string) || 85.8245;
  const radiusKm = parseFloat(req.query.radiusKm as string) || 25;

  const nearby = db.getNearbyDonations(lat, lon, radiusKm);
  res.json({
    success: true,
    data: nearby,
    origin: { lat, lon },
    radiusKm,
    count: nearby.length
  });
});

app.get('/api/donations/:id', (req: Request, res: Response) => {
  const donation = db.findDonationById(req.params.id);
  if (!donation) {
    return res.status(404).json({ success: false, error: 'Donation not found' });
  }
  res.json({ success: true, data: donation });
});

app.post('/api/donations', async (req: Request, res: Response) => {
  try {
    const body = req.body;
    const servings = Number(body.servings) || 25;
    const weightKg = Number(body.weightKg) || Math.round(servings * 0.25);

    const newDonation: FoodDonationItem = {
      id: body.id || `food-dn-${Date.now()}`,
      donorId: body.donorId || 'donor-taj-bhubaneswar',
      donorName: body.donorName || 'Generous Kitchen Partner',
      donorPhone: body.donorPhone || body.contactPhone || '+91 94370 12345',
      donorType: body.donorType || 'Restaurant',
      title: body.title || 'Fresh Food Surplus',
      description: body.description || 'Hygienically prepared, packed in food-grade thermal containers.',
      category: body.category || 'cooked_meals',
      servings,
      weightKg,
      storage: body.storage || 'ambient',
      vegNonVeg: body.vegNonVeg || 'pure_veg',
      preparedAt: body.preparedAt || 'Freshly prepared',
      expiryTime: body.expiryTime || 'In 4 hours',
      pickupWindow: body.pickupWindow || 'Immediate pickup available',
      address: body.address || 'Patia, Bhubaneswar',
      city: body.city || 'Bhubaneswar (Odisha)',
      locality: body.locality || 'Local Area',
      latitude: Number(body.latitude) || 20.3533,
      longitude: Number(body.longitude) || 85.8195,
      status: 'available',
      contactPhone: body.contactPhone || '+91 94370 12345',
      notes: body.notes,
      image: body.image || 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=600&q=80',
      createdAt: 'Just now',
      milestones: [
        {
          status: 'available',
          title: 'Donation Listed & Published to Kafka',
          timestamp: 'Just now',
          description: `Listed ${servings} portions. Broadcasted to nearby shelters.`
        }
      ]
    };

    const saved = await db.createDonation(newDonation);

    res.status(201).json({
      success: true,
      data: saved,
      message: 'Food surplus listed, published to Kafka event bus, and saved to database!'
    });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

// NGO Claim Donation
const handleClaim = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { ngoId, ngoName, ngoContact, ngoAddress, latitude, longitude } = req.body;

    const result = await db.claimDonation(id, {
      id: ngoId || 'ngo-user',
      name: ngoName || 'Community Shelter',
      contact: ngoContact || '+91 94370 12345',
      address: ngoAddress || 'Shelter Facility',
      latitude: Number(latitude) || 20.2405,
      longitude: Number(longitude) || 85.8340
    });

    if (!result) {
      return res.status(404).json({ success: false, error: 'Donation not found' });
    }

    res.json({
      success: true,
      data: result.donation,
      pickup: result.pickup,
      message: 'Food claimed successfully! Pickup task generated for volunteers.'
    });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message || 'Error claiming donation' });
  }
};

app.post('/api/donations/:id/claim', handleClaim);
app.patch('/api/donations/:id/claim', handleClaim);
app.post('/api/donations/:id/request', handleClaim);

// Donor Cancel Donation
app.delete('/api/donations/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const donorId = (req.query.donorId as string) || (req.body.donorId as string) || '';
    const cancelled = await db.cancelDonation(id, donorId);
    if (!cancelled) {
      return res.status(404).json({ success: false, error: 'Donation not found' });
    }
    res.json({ success: true, data: cancelled, message: 'Donation cancelled and cache invalidated' });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// 3. Pickup Routes for Volunteers
app.get('/api/pickups/available', (_req: Request, res: Response) => {
  res.json({ success: true, data: db.getAvailablePickups() });
});

app.get('/api/pickups/my', (req: Request, res: Response) => {
  const volunteerId = (req.query.volunteerId as string) || '';
  res.json({ success: true, data: db.getVolunteerPickups(volunteerId) });
});

app.post('/api/pickups/:id/accept', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { volunteerId, volunteerName, volunteerPhone, vehicle } = req.body;

    const accepted = await db.acceptPickup(id, {
      id: volunteerId || `vol-${Date.now()}`,
      name: volunteerName || 'Volunteer Rider',
      phone: volunteerPhone || '+91 94370 12345',
      vehicle: vehicle || 'Two-Wheeler'
    });

    if (!accepted) {
      return res.status(404).json({ success: false, error: 'Pickup task not found' });
    }

    res.json({ success: true, data: accepted, message: 'Mission accepted! Ride safe.' });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

app.put('/api/pickups/:id/status', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, volunteerId } = req.body;

    if (status !== 'picked_up' && status !== 'delivered') {
      return res.status(400).json({ success: false, error: 'Status must be picked_up or delivered' });
    }

    const updated = await db.updatePickupStatus(id, status, volunteerId || '');
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Pickup task not found' });
    }

    res.json({ success: true, data: updated, message: `Status updated to ${status}` });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Legacy volunteer status endpoint
app.patch('/api/donations/:id/status', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, volunteerName, volunteerPhone, volunteerVehicle, volunteerId } = req.body;

    let updated: FoodDonationItem | null = null;
    if (volunteerName && status === 'in_transit') {
      const donation = db.findDonationById(id);
      if (donation) {
        donation.status = 'in_transit';
        donation.assignedVolunteer = {
          id: volunteerId || 'vol-hero',
          name: volunteerName,
          phone: volunteerPhone || '+91 94370 12345',
          vehicle: volunteerVehicle || 'Two-Wheeler',
          status: 'assigned'
        };
        updated = await db.updateDonation(id, donation);
      }
    } else if (status) {
      updated = await db.updateDonation(id, { status: status as FoodDonationItem['status'] });
    }

    res.json({ success: true, data: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. Redis Cache & Kafka Event Stream Inspection Endpoints
app.get('/api/cache/status', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: db.getRedisMetrics()
  });
});

app.post('/api/cache/evict', (_req: Request, res: Response) => {
  db.evictRedisCache();
  res.json({
    success: true,
    message: 'Redis cache for key "donations:available" manually evicted successfully!'
  });
});

app.get('/api/kafka/events', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: db.getKafkaLogs()
  });
});

// 5. NGO Broadcasts
app.get('/api/broadcasts', (_req: Request, res: Response) => {
  res.json({ success: true, data: db.getBroadcasts() });
});

app.post('/api/broadcasts', async (req: Request, res: Response) => {
  try {
    const body = req.body;
    const newBroadcast: NGOBroadcast = {
      id: `broad-${Date.now()}`,
      ngoName: body.ngoName || 'Urgent Shelter Kitchen',
      location: body.location || 'Bhubaneswar (Odisha)',
      requiredServings: Number(body.requiredServings) || 50,
      foodType: body.foodType || 'Nutritious Cooked Meals',
      urgency: body.urgency || 'high',
      timeNeededBy: body.timeNeededBy || 'Today evening',
      contactPerson: body.contactPerson || 'Shelter Coordinator',
      contactPhone: body.contactPhone || '+91 94370 12345',
      createdAt: 'Just now'
    };

    const saved = await db.createBroadcast(newBroadcast);
    res.status(201).json({ success: true, data: saved });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

// 6. Platform Stats & Activity Feed
app.get('/api/stats', (_req: Request, res: Response) => {
  res.json({ success: true, data: db.getStats() });
});

app.get('/api/activities', (_req: Request, res: Response) => {
  res.json({ success: true, data: db.getActivities() });
});

// 7. Money Donation in INR (Rupees)
app.post('/api/donate-funds', async (req: Request, res: Response) => {
  try {
    const { donorName, donorEmail, donorPan, amountRupees } = req.body;
    const amount = Number(amountRupees) || 100;
    const mealsSponsored = Math.floor(amount / 10);

    const donationRecord: FundDonation = {
      id: `fund-${Date.now()}`,
      donorName: donorName || 'Kind Donor',
      donorEmail: donorEmail || 'donor@example.com',
      donorPan: donorPan || undefined,
      amountRupees: amount,
      mealsSponsored,
      timestamp: 'Just now',
      paymentId: `UPI_RZP_${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
      taxExemptionEligible: true
    };

    const saved = await db.createFundDonation(donationRecord);

    res.status(201).json({
      success: true,
      data: saved,
      message: `Thank you! Sponsoring ₹${amount} feeds ${mealsSponsored} vulnerable people.`
    });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

// Database offline / buffer timeout fallback
app.use((err: any, req: Request, res: Response, next: any) => {
  if (err?.name === 'MongooseError' || err?.name === 'MongoNetworkError' || (err?.message && typeof err.message === 'string' && err.message.includes('buffering timed out'))) {
    console.warn('[AI Studio] Database offline — returning fallback response');
    if (req.method === 'GET') {
      return res.json(req.path.endsWith('s') || req.path.endsWith('s/') ? { success: true, data: [] } : { success: true, data: {} });
    }
    return res.status(503).json({ success: false, error: 'Database service temporarily unavailable' });
  }
  next(err);
});

// -------------------------------------------------------------
// Server Start
// -------------------------------------------------------------
async function startServer() {
  await initDatabase();

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 FoodRescue India server running on http://0.0.0.0:${PORT} with persistent database store`);
  });
}

startServer();
