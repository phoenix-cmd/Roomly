import bcrypt from 'bcryptjs';
import { connectDatabase, disconnectDatabase } from '../db/connection.js';
import { User } from '../models/User.js';
import { Hotel } from '../models/Hotel.js';
import { HotelMembership } from '../models/HotelMembership.js';
import { RoomCategory } from '../models/RoomCategory.js';
import { Room } from '../models/Room.js';
import { InventoryDay } from '../models/InventoryDay.js';
import { Booking } from '../models/Booking.js';
import { Payment } from '../models/Payment.js';
import { HousekeepingTask } from '../models/HousekeepingTask.js';
import { formatDateKey } from '../utils/date.js';
import { logger } from '../utils/logger.js';

export async function seedDatabase() {
  logger.info('🌱 Starting Roomly database seed with Luxury hospitality data...');
  await connectDatabase();

  // 1. Clean existing collections
  await Promise.all([
    User.deleteMany({}),
    Hotel.deleteMany({}),
    HotelMembership.deleteMany({}),
    RoomCategory.deleteMany({}),
    Room.deleteMany({}),
    InventoryDay.deleteMany({}),
    Booking.deleteMany({}),
    Payment.deleteMany({}),
    HousekeepingTask.deleteMany({}),
  ]);
  logger.info('🧹 Cleaned existing database collections.');

  // 2. Create Users
  const passwordSalt = await bcrypt.genSalt(12);
  const adminPasswordHash = await bcrypt.hash('AdminPass123!', passwordSalt);
  const managerPasswordHash = await bcrypt.hash('ManagerPass123!', passwordSalt);
  const staffPasswordHash = await bcrypt.hash('StaffPass123!', passwordSalt);
  const guestPasswordHash = await bcrypt.hash('GuestPass123!', passwordSalt);

  const [adminUser, managerUser, frontDeskUser, housekeeperUser, guestUser] = await Promise.all([
    User.create({
      email: 'admin@roomly.luxury',
      passwordHash: adminPasswordHash,
      firstName: 'Lord Harrison',
      lastName: 'Sterling',
      globalRole: 'PLATFORM_ADMIN',
      isEmailVerified: true,
    }),
    User.create({
      email: 'manager@riviera.luxury',
      passwordHash: managerPasswordHash,
      firstName: 'Geneviève',
      lastName: 'De La Tour',
      globalRole: 'GUEST',
      isEmailVerified: true,
    }),
    User.create({
      email: 'frontdesk@riviera.luxury',
      passwordHash: staffPasswordHash,
      firstName: 'Antoine',
      lastName: 'Laurent',
      globalRole: 'GUEST',
      isEmailVerified: true,
    }),
    User.create({
      email: 'housekeeper@riviera.luxury',
      passwordHash: staffPasswordHash,
      firstName: 'Camille',
      lastName: 'Moreau',
      globalRole: 'GUEST',
      isEmailVerified: true,
    }),
    User.create({
      email: 'guest@example.com',
      passwordHash: guestPasswordHash,
      firstName: 'Lady Eleanora',
      lastName: 'Vane',
      phone: '+1 (555) 234-5678',
      globalRole: 'GUEST',
      isEmailVerified: true,
    }),
  ]);

  logger.info('👤 Created Admin, Manager, Staff, and Guest user accounts.');

  // 3. Create Luxury Hotels
  const hotelRiviera = await Hotel.create({
    name: 'The Grand Azure Riviera',
    slug: 'the-grand-azure-riviera',
    tagline: 'Timeless Mediterranean Elegance & Coastal Sanctuary',
    description:
      'Perched on the sun-kissed cliffs of the Côte d’Azur, The Grand Azure Riviera offers an extraordinary blend of belle époque architecture, private Mediterranean coves, and world-class gastronomy curated by Michelin-lauded chefs.',
    starRating: 5,
    address: {
      street: '14 Boulevard de la Croisette',
      city: 'Cannes',
      state: "Provence-Alpes-Côte d'Azur",
      country: 'France',
      postalCode: '06400',
      coordinates: { lat: 43.5528, lng: 7.0174 },
    },
    contact: {
      email: 'concierge@riviera.luxury',
      phone: '+33 4 93 39 00 00',
      website: 'https://riviera.roomly.luxury',
    },
    policies: {
      checkInTime: '15:00',
      checkOutTime: '11:00',
      cancellationWindowHours: 48,
      taxRatePercent: 12,
    },
    currency: 'USD',
    amenities: [
      'Private Mediterranean Beach Club',
      'Infinity Cliffside Heated Pool',
      'Michelin-Starred Oceanfront Dining',
      'Holistic Thalassotherapy Spa',
      'Helipad & Yacht Charter Concierge',
      '24/7 White-Glove Butler Service',
      'Valet Chauffeur Service',
      'High-Speed Wi-Fi 6',
    ],
    images: [
      {
        url: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1600&q=80',
        caption: 'The Grand Azure Riviera Cliffside Facade at Dusk',
        isFeatured: true,
      },
      {
        url: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1600&q=80',
        caption: 'Panoramic Oceanfront Terrace & Lounge',
        isFeatured: false,
      },
      {
        url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1600&q=80',
        caption: 'Heated Infinity Pool overlooking the Bay',
        isFeatured: false,
      },
      {
        url: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1600&q=80',
        caption: 'Sunset Dining on the Private Pier',
        isFeatured: false,
      },
    ],
    isActive: true,
  });

  const hotelAlpine = await Hotel.create({
    name: 'Aethelgard Manor & Alpine Spa',
    slug: 'aethelgard-manor-alpine-spa',
    tagline: 'A High-Altitude Haven of Seclusion and Serenity',
    description:
      'Sheltered amidst the majestic Swiss Alps of St. Moritz, Aethelgard Manor balances rustic timber craftsmanship with avant-garde thermal hydrotherapy and ski-in/ski-out alpine exclusivity.',
    starRating: 5,
    address: {
      street: 'Via Serlas 27',
      city: 'St. Moritz',
      state: 'Graubünden',
      country: 'Switzerland',
      postalCode: '7500',
      coordinates: { lat: 46.4908, lng: 9.8355 },
    },
    contact: {
      email: 'concierge@aethelgard.luxury',
      phone: '+41 81 837 10 00',
      website: 'https://aethelgard.roomly.luxury',
    },
    policies: {
      checkInTime: '15:00',
      checkOutTime: '11:00',
      cancellationWindowHours: 72,
      taxRatePercent: 10,
    },
    currency: 'USD',
    amenities: [
      'Direct Ski-in / Ski-out Access',
      'Geothermal Heated Outdoor Alpine Pool',
      'Alpine Herbal Spa & Finnish Saunas',
      'Fondue & Fine Wine Sommelier Cellar',
      'Private Ski Equipment Butler',
      'Fireplace Library & Whiskey Bar',
    ],
    images: [
      {
        url: 'https://images.unsplash.com/photo-1502784444187-359ac186c5bb?auto=format&fit=crop&w=1600&q=80',
        caption: 'Aethelgard Manor Winter Wonderland',
        isFeatured: true,
      },
      {
        url: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1600&q=80',
        caption: 'Heated Outdoor Geothermal Spa Pool',
        isFeatured: false,
      },
    ],
    isActive: true,
  });

  logger.info('🏨 Created luxury properties: The Grand Azure Riviera & Aethelgard Manor.');

  // 4. Create Hotel Memberships (Multi-Tenant Staff Assignments)
  await Promise.all([
    HotelMembership.create({
      userId: managerUser._id,
      hotelId: hotelRiviera._id,
      role: 'HOTEL_MANAGER',
      permissions: ['manage_inventory', 'manage_pricing', 'check_in_out', 'view_reports', 'manage_staff'],
    }),
    HotelMembership.create({
      userId: frontDeskUser._id,
      hotelId: hotelRiviera._id,
      role: 'FRONT_DESK',
      permissions: ['check_in_out', 'manage_inventory'],
    }),
    HotelMembership.create({
      userId: housekeeperUser._id,
      hotelId: hotelRiviera._id,
      role: 'HOUSEKEEPING',
      permissions: ['housekeeping_write'],
    }),
  ]);

  logger.info('🛡️ Assigned Hotel Memberships with scoped operational permissions.');

  // 5. Create Room Categories for The Grand Azure Riviera
  const categoriesData = [
    {
      hotelId: hotelRiviera._id,
      name: 'Azure Panoramic Suite',
      slug: 'azure-panoramic-suite',
      description:
        'A magnificent oceanfront sanctuary boasting floor-to-ceiling glass doors opening onto an expansive teak terrace with uninterrupted views of the Côte d’Azur. Includes a freestanding Carrara marble soaking tub, king featherbed, and dedicated butler service.',
      maxOccupancy: 3,
      maxAdults: 2,
      maxChildren: 1,
      basePriceCents: 65000, // $650.00
      weekendMultiplier: 1.15,
      sizeSqFt: 980,
      bedConfiguration: '1 California King Bed',
      viewType: 'Panoramic Mediterranean Sea View',
      totalRooms: 6,
      amenities: [
        'Teak Terrace with Sun Loungers',
        'Carrara Marble Double Vanity & Soaking Tub',
        'Dyson Supersonic Hair Care Suite',
        'Complimentary Dom Pérignon Welcome Bottle',
        'Nespresso Vertuo & Artisan Tea Bar',
        'White-Glove Butler Service',
      ],
      images: [
        {
          url: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80',
          caption: 'Panoramic Ocean Suite Master Bedroom',
          isPrimary: true,
        },
        {
          url: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80',
          caption: 'Marble Bathroom with Freestanding Tub',
          isPrimary: false,
        },
      ],
    },
    {
      hotelId: hotelRiviera._id,
      name: 'Riviera Deluxe King',
      slug: 'riviera-deluxe-king',
      description:
        'Warm sandstone interiors complemented by bespoke oak furnishings, private garden-view Juliet balcony, handcrafted Italian linens, and rain shower suite.',
      maxOccupancy: 2,
      maxAdults: 2,
      maxChildren: 0,
      basePriceCents: 42000, // $420.00
      weekendMultiplier: 1.12,
      sizeSqFt: 620,
      bedConfiguration: '1 European King Bed',
      viewType: 'Palatial Courtyard & Garden View',
      totalRooms: 8,
      amenities: [
        'Juliet Balcony',
        'Rain Shower with Diptyque Paris Amenities',
        'Pillow Menu (6 Organic Varieties)',
        'In-Room Marshall Sound System',
        'Curated Minibar with Provençal Rosé',
      ],
      images: [
        {
          url: 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=1200&q=80',
          caption: 'Riviera Deluxe Room Interior',
          isPrimary: true,
        },
      ],
    },
    {
      hotelId: hotelRiviera._id,
      name: 'Prestige Coastal Villa',
      slug: 'prestige-coastal-villa',
      description:
        'The zenith of Riviera luxury. A private standalone 2-bedroom villa featuring an exclusive heated plunge pool, Mediterranean private garden, dining pavilion, and dedicated chauffeur.',
      maxOccupancy: 5,
      maxAdults: 4,
      maxChildren: 2,
      basePriceCents: 125000, // $1,250.00
      weekendMultiplier: 1.2,
      sizeSqFt: 1850,
      bedConfiguration: '2 King Beds + Living Salon',
      viewType: 'Private Cove & Unobstructed Ocean',
      totalRooms: 3,
      amenities: [
        'Private Heated Plunge Pool & Sun Deck',
        'Private Garden & Outdoor Dining Pergola',
        'Personal Chef Dinner Service on Request',
        'Private Range Rover Chauffeur for Stay',
        'Full Kitchenette & Wine Cellar',
      ],
      images: [
        {
          url: 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=1200&q=80',
          caption: 'Coastal Villa Living Pavilion and Plunge Pool',
          isPrimary: true,
        },
      ],
    },
  ];

  const createdCategories = await RoomCategory.insertMany(categoriesData);
  logger.info(`🛏️ Created ${createdCategories.length} luxury room categories.`);

  // 6. Provision Physical Rooms and 90-Day Inventory Allotments
  const today = new Date();
  const roomsToCreate: any[] = [];
  const inventoryToCreate: any[] = [];

  for (const cat of createdCategories) {
    // Create physical rooms
    for (let r = 1; r <= cat.totalRooms; r++) {
      roomsToCreate.push({
        hotelId: hotelRiviera._id,
        roomCategoryId: cat._id,
        roomNumber: `${cat.name.startsWith('Azure') ? '3' : cat.name.startsWith('Riviera') ? '2' : 'V'}${String(r).padStart(2, '0')}`,
        floor: cat.name.startsWith('Azure') ? 3 : cat.name.startsWith('Riviera') ? 2 : 1,
        status: r === 1 ? 'AVAILABLE' : r === 2 ? 'CLEANING_REQUIRED' : 'AVAILABLE',
      });
    }

    // Create 90 days of inventory
    for (let d = 0; d < 90; d++) {
      const curDate = new Date(today);
      curDate.setUTCDate(today.getUTCDate() + d);
      inventoryToCreate.push({
        hotelId: hotelRiviera._id,
        roomCategoryId: cat._id,
        date: formatDateKey(curDate),
        totalInventory: cat.totalRooms,
        bookedCount: 0,
        heldCount: 0,
        priceCents: cat.basePriceCents,
      });
    }
  }

  const createdRooms = await Room.insertMany(roomsToCreate);
  await InventoryDay.insertMany(inventoryToCreate);
  logger.info(`🔑 Provisioned ${createdRooms.length} physical rooms and 90 days of inventory records.`);

  // 7. Seed Sample Bookings
  const tomorrow = new Date(today);
  tomorrow.setUTCDate(today.getUTCDate() + 1);
  const checkoutDate = new Date(today);
  checkoutDate.setUTCDate(today.getUTCDate() + 4);

  const checkInStr = formatDateKey(tomorrow);
  const checkOutStr = formatDateKey(checkoutDate);

  const sampleBooking = await Booking.create({
    confirmationCode: 'RML-892341',
    hotelId: hotelRiviera._id,
    guestId: guestUser._id,
    roomCategoryId: createdCategories[0]._id,
    assignedRoomId: createdRooms[0]._id,
    checkInDate: checkInStr,
    checkOutDate: checkOutStr,
    nights: 3,
    adults: 2,
    children: 0,
    status: 'CONFIRMED',
    pricingSnapshot: {
      nightlyRates: [
        { date: checkInStr, rateCents: 65000 },
        { date: formatDateKey(new Date(tomorrow.getTime() + 86400000)), rateCents: 65000 },
        { date: formatDateKey(new Date(tomorrow.getTime() + 172800000)), rateCents: 65000 },
      ],
      subtotalCents: 195000,
      taxPercent: 12,
      taxCents: 23400,
      cleaningFeeCents: 0,
      totalCents: 218400, // $2,184.00
      currency: 'USD',
      cancellationPolicy: {
        freeCancellationUntil: new Date(Date.now() + 48 * 3600000),
        penaltyPercent: 0,
      },
    },
    guestDetails: {
      firstName: guestUser.firstName,
      lastName: guestUser.lastName,
      email: guestUser.email,
      phone: guestUser.phone,
      specialRequests: 'Chilled champagne and extra goose-down pillows on arrival.',
    },
  });

  // Mark inventory as booked for those nights
  await InventoryDay.updateMany(
    {
      hotelId: hotelRiviera._id,
      roomCategoryId: createdCategories[0]._id,
      date: { $in: [checkInStr, formatDateKey(new Date(tomorrow.getTime() + 86400000)), formatDateKey(new Date(tomorrow.getTime() + 172800000))] },
    },
    { $inc: { bookedCount: 1 } }
  );

  // Seed verified payment
  await Payment.create({
    bookingId: sampleBooking._id,
    hotelId: hotelRiviera._id,
    guestId: guestUser._id,
    amountCents: 218400,
    currency: 'USD',
    provider: 'MOCK_SANDBOX',
    providerTransactionId: 'mock_pi_seed_confirmed_892341',
    status: 'SUCCEEDED',
    paymentMethod: 'card_visa_luxury',
  });

  // Seed sample housekeeping task
  await HousekeepingTask.create({
    hotelId: hotelRiviera._id,
    roomId: createdRooms[1]._id,
    taskType: 'TURNOVER_CLEAN',
    priority: 'HIGH',
    status: 'PENDING',
    notes: 'Prioritize turnover before 14:00 for VIP arrival.',
  });

  logger.info('🎉 Seed completed successfully!');
  logger.info('---------------------------------------------------------');
  logger.info('Demo Credentials:');
  logger.info('Platform Admin: admin@roomly.luxury      / AdminPass123!');
  logger.info('Hotel Manager:  manager@riviera.luxury    / ManagerPass123!');
  logger.info('Front Desk:     frontdesk@riviera.luxury  / StaffPass123!');
  logger.info('Housekeeper:    housekeeper@riviera.luxury/ StaffPass123!');
  logger.info('Guest:          guest@example.com         / GuestPass123!');
  logger.info('---------------------------------------------------------');

  await disconnectDatabase();
}

if (process.argv[1]?.endsWith('seed.ts') || process.argv[1]?.endsWith('seed.js')) {
  seedDatabase().catch((err) => {
    logger.error('Fatal seed error:', err);
    process.exit(1);
  });
}
