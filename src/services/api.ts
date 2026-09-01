import { 
  ActivityItem, 
  FoodDonation, 
  NGOBroadcastRequest, 
  PlatformStats, 
  UserProfile, 
  UserRole,
  PickupTask,
  RedisCacheMetrics,
  KafkaLogRecord
} from '../types';

export const api = {
  // Auth
  async register(userData: {
    name: string;
    email: string;
    password?: string;
    phone?: string;
    role: UserRole;
    organization?: string;
    city?: string;
    address?: string;
    latitude?: number;
    longitude?: number;
    fssaiNumber?: string;
    vehicleType?: string;
  }): Promise<{ success: boolean; user?: UserProfile; token?: string; error?: string; message?: string }> {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });
      const data = await res.json();
      return data;
    } catch {
      return { success: false, error: 'Failed to connect to authentication server' };
    }
  },

  async login(credentials: {
    email: string;
    password?: string;
    role?: UserRole;
  }): Promise<{ success: boolean; user?: UserProfile; token?: string; error?: string; message?: string }> {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      });
      const data = await res.json();
      return data;
    } catch {
      return { success: false, error: 'Failed to connect to authentication server' };
    }
  },

  async getMe(email: string): Promise<UserProfile | null> {
    try {
      const res = await fetch(`/api/auth/me?email=${encodeURIComponent(email)}`);
      if (!res.ok) return null;
      const data = await res.json();
      return data.user || null;
    } catch {
      return null;
    }
  },

  async getDemoUsers(): Promise<UserProfile[] | null> {
    try {
      const res = await fetch('/api/auth/demo-users');
      if (!res.ok) return null;
      const data = await res.json();
      return data.users;
    } catch {
      return null;
    }
  },

  async deleteUser(id: string): Promise<boolean> {
    try {
      const res = await fetch(`/api/auth/users/${encodeURIComponent(id)}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      return Boolean(data.success);
    } catch {
      return false;
    }
  },

  async getDbStatus(): Promise<{ success: boolean; engine: string; isMongo: boolean; totalUsers: number; totalDonations: number } | null> {
    try {
      const res = await fetch('/api/db-status');
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  // Stats & Activities
  async getStats(): Promise<PlatformStats | null> {
    try {
      const res = await fetch('/api/stats');
      if (!res.ok) return null;
      const data = await res.json();
      return data.data;
    } catch {
      return null;
    }
  },

  async getActivities(): Promise<ActivityItem[] | null> {
    try {
      const res = await fetch('/api/activities');
      if (!res.ok) return null;
      const data = await res.json();
      return data.data;
    } catch {
      return null;
    }
  },

  // Donations
  async getDonations(filters?: { status?: string; city?: string; category?: string }): Promise<FoodDonation[] | null> {
    try {
      const params = new URLSearchParams();
      if (filters?.status) params.append('status', filters.status);
      if (filters?.city) params.append('city', filters.city);
      if (filters?.category) params.append('category', filters.category);

      const res = await fetch(`/api/donations?${params.toString()}`);
      if (!res.ok) return null;
      const data = await res.json();
      return data.data;
    } catch {
      return null;
    }
  },

  async getAvailableDonations(): Promise<{ data: FoodDonation[]; fromCache: boolean; latencyMs: number } | null> {
    try {
      const res = await fetch('/api/donations/available');
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  async getNearbyDonations(lat: number, lon: number, radiusKm = 25): Promise<FoodDonation[] | null> {
    try {
      const res = await fetch(`/api/donations/nearby?lat=${lat}&lon=${lon}&radiusKm=${radiusKm}`);
      if (!res.ok) return null;
      const data = await res.json();
      return data.data;
    } catch {
      return null;
    }
  },

  async createDonation(donationData: Partial<FoodDonation>): Promise<FoodDonation | null> {
    try {
      const res = await fetch('/api/donations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(donationData)
      });
      if (!res.ok) return null;
      const data = await res.json();
      return data.data;
    } catch {
      return null;
    }
  },

  async cancelDonation(id: string, donorId: string): Promise<boolean> {
    try {
      const res = await fetch(`/api/donations/${encodeURIComponent(id)}?donorId=${encodeURIComponent(donorId)}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      return Boolean(data.success);
    } catch {
      return false;
    }
  },

  async claimDonation(
    id: string,
    ngoDetails: { id: string; name: string; contact: string; address: string; latitude?: number; longitude?: number; claimedAt?: string }
  ): Promise<{ donation: FoodDonation; pickup?: PickupTask } | null> {
    try {
      const res = await fetch(`/api/donations/${id}/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ngoId: ngoDetails.id,
          ngoName: ngoDetails.name,
          ngoContact: ngoDetails.contact,
          ngoAddress: ngoDetails.address,
          latitude: ngoDetails.latitude,
          longitude: ngoDetails.longitude
        })
      });
      if (!res.ok) return null;
      const data = await res.json();
      return { donation: data.data, pickup: data.pickup };
    } catch {
      return null;
    }
  },

  // Pickups
  async getAvailablePickups(): Promise<PickupTask[] | null> {
    try {
      const res = await fetch('/api/pickups/available');
      if (!res.ok) return null;
      const data = await res.json();
      return data.data;
    } catch {
      return null;
    }
  },

  async getMyPickups(volunteerId: string): Promise<PickupTask[] | null> {
    try {
      const res = await fetch(`/api/pickups/my?volunteerId=${encodeURIComponent(volunteerId)}`);
      if (!res.ok) return null;
      const data = await res.json();
      return data.data;
    } catch {
      return null;
    }
  },

  async acceptPickup(pickupId: string, volunteer: { id: string; name: string; phone: string; vehicle?: string }): Promise<PickupTask | null> {
    try {
      const res = await fetch(`/api/pickups/${pickupId}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          volunteerId: volunteer.id,
          volunteerName: volunteer.name,
          volunteerPhone: volunteer.phone,
          vehicle: volunteer.vehicle
        })
      });
      if (!res.ok) return null;
      const data = await res.json();
      return data.data;
    } catch {
      return null;
    }
  },

  async assignVolunteer(donationId: string, volunteer: { id: string; name: string; phone: string; vehicle?: string }): Promise<any> {
    return this.acceptPickup(donationId, volunteer);
  },

  async updatePickupStatus(pickupId: string, status: 'picked_up' | 'delivered', volunteerId?: string): Promise<PickupTask | null> {
    try {
      const res = await fetch(`/api/pickups/${pickupId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, volunteerId: volunteerId || '' })
      });
      if (!res.ok) return null;
      const data = await res.json();
      return data.data;
    } catch {
      return null;
    }
  },

  async updateVolunteerStatus(donationId: string, status: 'picked_up' | 'delivered', volunteerId?: string): Promise<any> {
    return this.updatePickupStatus(donationId, status, volunteerId);
  },

  // Developer & Architecture Tools (Redis & Kafka)
  async getRedisMetrics(): Promise<RedisCacheMetrics | null> {
    try {
      const res = await fetch('/api/cache/status');
      if (!res.ok) return null;
      const data = await res.json();
      return data.data;
    } catch {
      return null;
    }
  },

  async evictRedisCache(): Promise<boolean> {
    try {
      const res = await fetch('/api/cache/evict', { method: 'POST' });
      const data = await res.json();
      return Boolean(data.success);
    } catch {
      return false;
    }
  },

  async getKafkaLogs(): Promise<KafkaLogRecord[] | null> {
    try {
      const res = await fetch('/api/kafka/events');
      if (!res.ok) return null;
      const data = await res.json();
      return data.data;
    } catch {
      return null;
    }
  },

  // NGO Broadcasts
  async getBroadcasts(): Promise<NGOBroadcastRequest[] | null> {
    try {
      const res = await fetch('/api/broadcasts');
      if (!res.ok) return null;
      const data = await res.json();
      return data.data;
    } catch {
      return null;
    }
  },

  async createBroadcast(broadcast: Partial<NGOBroadcastRequest>): Promise<NGOBroadcastRequest | null> {
    try {
      const res = await fetch('/api/broadcasts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(broadcast)
      });
      if (!res.ok) return null;
      const data = await res.json();
      return data.data;
    } catch {
      return null;
    }
  },

  // Donate Funds
  async donateFunds(payload: {
    donorName: string;
    donorEmail: string;
    donorPan?: string;
    amountRupees: number;
  }) {
    try {
      const res = await fetch('/api/donate-funds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  }
};
