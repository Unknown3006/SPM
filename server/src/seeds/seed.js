const mongoose = require('mongoose');
const env = require('../config/env');
const { connectDB, disconnectDB } = require('../config/db');
const User = require('../models/User');
const TourPackage = require('../models/TourPackage');
const Hotel = require('../models/Hotel');
const TransportService = require('../models/TransportService');
const PromotionalOffer = require('../models/PromotionalOffer');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const Complaint = require('../models/Complaint');
const Review = require('../models/Review');

// Helper to generate dynamic dates relative to today
const getFutureDate = (daysAhead) => {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  d.setHours(10, 0, 0, 0);
  return d;
};

const getPastDate = (daysAgo) => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(10, 0, 0, 0);
  return d;
};

const seedCatalog = async (isReset = false) => {
  console.log(`[Seed] Starting database seeding (Reset mode: ${isReset})...`);

  if (isReset) {
    console.log('[Seed] Purging collections: Users, Packages, Hotels, Transport, Offers, Bookings, Payments, Complaints, Reviews...');
    await User.deleteMany({});
    await TourPackage.deleteMany({});
    await Hotel.deleteMany({});
    await TransportService.deleteMany({});
    await PromotionalOffer.deleteMany({});
    await Booking.deleteMany({});
    await Payment.deleteMany({});
    await Complaint.deleteMany({});
    await Review.deleteMany({});
  }

  // 1. SEED USERS
  const demoUsers = [
    {
      name: 'System Administrator',
      email: 'admin@tms.test',
      phone: '+91 9876543210',
      password: 'Admin@123',
      role: 'admin',
      isActive: true
    },
    {
      name: 'Travel Agent Priya',
      email: 'agent@tms.test',
      phone: '+91 9876543211',
      role: 'employee',
      password: 'Agent@123',
      isActive: true
    },
    {
      name: 'Rahul Sharma',
      email: 'customer@tms.test',
      phone: '+91 9876543212',
      role: 'customer',
      password: 'Customer@123',
      isActive: true
    },
    {
      name: 'Deactivated User',
      email: 'deactivated@tms.test',
      phone: '+91 9876543213',
      role: 'customer',
      password: 'Deactivated@123',
      isActive: false
    }
  ];

  for (const acc of demoUsers) {
    const existing = await User.findOne({ email: acc.email });
    if (!existing) {
      const passwordHash = await User.hashPassword(acc.password);
      await User.create({
        name: acc.name,
        email: acc.email,
        phone: acc.phone,
        passwordHash,
        role: acc.role,
        isActive: acc.isActive,
        lastLoginAt: new Date()
      });
      console.log(`  + User: ${acc.email} (${acc.role})`);
    }
  }

  // 2. SEED TOUR PACKAGES (14 packages across 6 categories)
  const packagesData = [
    // Adventure
    {
      title: 'Himalayan High Passes Trek (Manali - Leh)',
      destination: 'Leh Ladakh',
      description: 'An exhilarating 7-day expedition traversing Rohtang Pass, Pangong Tso crystal lake, and Khardung La at 18,000 feet. Experience camping under starry Himalayan skies.',
      durationDays: 7,
      price: 24999,
      category: 'adventure',
      images: [
        'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800&auto=format&fit=crop&q=80'
      ],
      itinerary: [
        { day: 1, title: 'Arrival in Manali', description: 'Acclimatization, gear check, and orientation dinner.' },
        { day: 2, title: 'Manali to Jispa via Atal Tunnel', description: 'Scenic drive through Lahaul Valley.' },
        { day: 3, title: 'Jispa to Sarchu Plains', description: 'Crossing Baralacha La pass and high altitude camping.' },
        { day: 4, title: 'Sarchu to Leh', description: 'Traversing Tanglang La pass and check-in at Leh hotel.' },
        { day: 5, title: 'Nubra Valley via Khardung La', description: 'Double-humped camel safari at Hunder sand dunes.' },
        { day: 6, title: 'Nubra to Pangong Tso Lake', description: 'Stunning sunset over the world-famous blue waters.' },
        { day: 7, title: 'Pangong to Leh Departure', description: 'Souvenir shopping and airport transfer.' }
      ],
      inclusions: ['4x4 Vehicle with Fuel', 'All Oxygen Cylinders & First Aid', 'Camp & Hotel Stays', 'Breakfast & Dinner', 'Inner Line Permits'],
      maxGroupSize: 12,
      availableDates: [
        { date: getFutureDate(10), seatsLeft: 8 },
        { date: getFutureDate(25), seatsLeft: 12 },
        { date: getFutureDate(45), seatsLeft: 10 }
      ],
      ratingAverage: 4.8,
      ratingCount: 38
    },
    {
      title: 'Rishikesh White Water & Bungee Expedition',
      destination: 'Rishikesh',
      description: 'The ultimate weekend adrenaline pump! Conquer Grade IV rapids on the Ganges, cliff jump from 30 feet, and jump from India highest 83m Bungee platform.',
      durationDays: 3,
      price: 8999,
      category: 'adventure',
      images: [
        'https://images.unsplash.com/photo-1530521954074-e64f6810b32d?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80'
      ],
      itinerary: [
        { day: 1, title: 'Riverside Camp Check-in', description: 'Campfire, musical night and beach volleyball.' },
        { day: 2, title: 'Rafting Shivpuri to Marine Drive', description: '24km white water rafting with Body Surfing.' },
        { day: 3, title: 'Bungee Jump & Ganga Aarti', description: 'Jump platform briefing, certificate and Triveni Ghat Aarti.' }
      ],
      inclusions: ['Riverside Swiss Tents', 'Certified Jump Master Fees', 'All Safety Gear & Helmets', 'All Meals (Buffet)'],
      maxGroupSize: 16,
      availableDates: [
        { date: getFutureDate(7), seatsLeft: 6 },
        { date: getFutureDate(14), seatsLeft: 14 }
      ],
      ratingAverage: 4.7,
      ratingCount: 52
    },

    // Beach
    {
      title: 'Goa Sun, Sand & Sea Leisure Escape',
      destination: 'Goa',
      description: 'Unwind on the pristine white sands of South Goa and lively shores of North Goa. Enjoy sunset catamaran cruises, beach shack seafood, and Portuguese heritage villas.',
      durationDays: 5,
      price: 15499,
      category: 'beach',
      images: [
        'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800&auto=format&fit=crop&q=80'
      ],
      itinerary: [
        { day: 1, title: 'Welcome to Goa', description: 'Airport pickup and beachside resort check-in.' },
        { day: 2, title: 'North Goa Beaches & Fort Aguada', description: 'Calangute, Baga, and historic lighthouse views.' },
        { day: 3, title: 'Mandovi River Sunset Cruise', description: 'Live Goan folk dance and DJ party on cruise.' },
        { day: 4, title: 'Old Goa Churches & Spice Plantation', description: 'Basilica of Bom Jesus and authentic Goan lunch.' },
        { day: 5, title: 'Souvenir Shopping & Farewell', description: 'Anjuna flea market and departure transfer.' }
      ],
      inclusions: ['4-Star Beach Resort', 'Daily Breakfast', 'Private AC Cab for Sightseeing', 'Mandovi Catamaran Cruise Tickets'],
      maxGroupSize: 20,
      availableDates: [
        { date: getFutureDate(5), seatsLeft: 15 },
        { date: getFutureDate(18), seatsLeft: 18 }
      ],
      ratingAverage: 4.6,
      ratingCount: 64
    },
    {
      title: 'Andaman Coral Islands & Scuba Odyssey',
      destination: 'Andaman & Nicobar',
      description: 'Discover Havelock Island Radhanagar Beach, ranked Asia best beach. Snorkel at Elephant Beach, explore limestone caves at Baratang, and visit historic Cellular Jail.',
      durationDays: 6,
      price: 32999,
      category: 'beach',
      images: [
        'https://images.unsplash.com/photo-1589308078059-be1415eab4c3?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80'
      ],
      itinerary: [
        { day: 1, title: 'Port Blair & Cellular Jail', description: 'Light & Sound show depicting Indian freedom struggle.' },
        { day: 2, title: 'Cruise to Havelock Island', description: 'High-speed catamaran cruise and Radhanagar Beach sunset.' },
        { day: 3, title: 'Elephant Beach Scuba & Snorkel', description: 'Underwater coral reef exploration with certified PADI diver.' },
        { day: 4, title: 'Neil Island Natural Bridge', description: 'Laxmanpur and Bharatpur coral formations.' },
        { day: 5, title: 'Return to Port Blair & Chidiya Tapu', description: 'Bird watching and sunset vantage point.' },
        { day: 6, title: 'Airport Departure', description: 'Memories of the turquoise ocean.' }
      ],
      inclusions: ['Premium Island Resorts', 'Makruzz Premium Cruise Tickets', '1 Discover Scuba Dive Session', 'All Island Entry Permits'],
      maxGroupSize: 14,
      availableDates: [
        { date: getFutureDate(12), seatsLeft: 6 },
        { date: getFutureDate(30), seatsLeft: 10 }
      ],
      ratingAverage: 4.9,
      ratingCount: 41
    },

    // Cultural
    {
      title: 'Royal Rajasthan Heritage & Forts',
      destination: 'Rajasthan',
      description: 'Step into the era of maharajas. Explore the Pink City of Jaipur, blue houses of Jodhpur, desert dunes of Jaisalmer, and romantic lakes of Udaipur.',
      durationDays: 8,
      price: 28999,
      category: 'cultural',
      images: [
        'https://images.unsplash.com/photo-1477587458883-47145ed94245?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1599661046289-e31897846e41?w=800&auto=format&fit=crop&q=80'
      ],
      itinerary: [
        { day: 1, title: 'Arrival in Jaipur', description: 'Amber Fort elephant experience and Hawa Mahal photo-op.' },
        { day: 2, title: 'City Palace & Jantar Mantar', description: 'Royal astronomical observatory and bazaar stroll.' },
        { day: 3, title: 'Jaipur to Jodhpur', description: 'Towering Mehrangarh Fort and Jaswant Thada.' },
        { day: 4, title: 'Jodhpur to Jaisalmer Golden City', description: 'Sonar Kella living fort and sunset camel ride.' },
        { day: 5, title: 'Sam Sand Dunes Camp', description: 'Folk Kalbelia dance, Rajasthani buffet and tent stay.' },
        { day: 6, title: 'Jaisalmer to Udaipur', description: 'Ranakpur Jain Marble Temples en route.' },
        { day: 7, title: 'City of Lakes Udaipur', description: 'Lake Pichola boat ride and Saheliyon Ki Bari.' },
        { day: 8, title: 'Departure from Udaipur', description: 'Royal memories.' }
      ],
      inclusions: ['Heritage Haveli Stays', 'Daily Breakfast & Dinner', 'Private Chauffeur Driven Sedan', 'Monument Entry Passes'],
      maxGroupSize: 18,
      availableDates: [
        { date: getFutureDate(8), seatsLeft: 12 },
        { date: getFutureDate(22), seatsLeft: 15 }
      ],
      ratingAverage: 4.7,
      ratingCount: 49
    },
    {
      title: 'Varanasi Spiritual Ghats & Sarnath Walk',
      destination: 'Varanasi',
      description: 'Experience the spiritual soul of India. Witness dawn boat rides along ancient stone ghats, evening Ganga Aarti, and the Buddhist monastic ruins at Sarnath.',
      durationDays: 4,
      price: 11999,
      category: 'cultural',
      images: [
        'https://images.unsplash.com/photo-1561361513-2d000a50f0dc?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800&auto=format&fit=crop&q=80'
      ],
      itinerary: [
        { day: 1, title: 'Arrival & Dashashwamedh Aarti', description: 'VIP seats for the sacred evening Aarti ceremony.' },
        { day: 2, title: 'Subah-e-Banaras Dawn Boat', description: 'Sunrise boat ride along 84 historic ghats.' },
        { day: 3, title: 'Sarnath Buddhist Heritage', description: 'Dhamek Stupa and Ashoka Pillar museum.' },
        { day: 4, title: 'Kashi Vishwanath Corridor & Departure', description: 'Golden Temple darshan and Banarasi silk market.' }
      ],
      inclusions: ['Boutique Riverview Hotel', 'VIP Ghat Boat Excursion', 'Knowledgeable Historian Guide', 'All Temple Entry Assistance'],
      maxGroupSize: 15,
      availableDates: [
        { date: getFutureDate(6), seatsLeft: 10 },
        { date: getFutureDate(20), seatsLeft: 15 }
      ],
      ratingAverage: 4.8,
      ratingCount: 35
    },

    // Family
    {
      title: 'Kerala Backwaters & Munnar Hills',
      destination: 'Kerala',
      description: 'The quintessential family holiday in God Own Country. Cruise tranquil Vembanad backwaters in an authentic houseboat and breathe tea estate air in Munnar.',
      durationDays: 6,
      price: 21999,
      category: 'family',
      images: [
        'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1589308078059-be1415eab4c3?w=800&auto=format&fit=crop&q=80'
      ],
      itinerary: [
        { day: 1, title: 'Kochi Arrival & Drive to Munnar', description: 'Cheeyappara Waterfalls and fragrant spice garden tours.' },
        { day: 2, title: 'Munnar Tea Gardens & Eravikulam', description: 'Nilgiri Tahr spotting and tea museum visit.' },
        { day: 3, title: 'Munnar to Thekkady Wild Reserve', description: 'Periyar wildlife boat safari and Kathakali show.' },
        { day: 4, title: 'Thekkady to Alleppey Houseboat', description: 'Check-in to private houseboat with traditional Kerala meals.' },
        { day: 5, title: 'Alleppey to Marari Beach', description: 'Family games and coconut grove relaxation.' },
        { day: 6, title: 'Kochi Sightseeing & Departure', description: 'Chinese fishing nets and airport drop.' }
      ],
      inclusions: ['Private Deluxe Houseboat Stay', 'Hill Resort in Munnar', 'All Meals on Houseboat', 'Private Innova for Family'],
      maxGroupSize: 10,
      availableDates: [
        { date: getFutureDate(11), seatsLeft: 8 },
        { date: getFutureDate(26), seatsLeft: 10 }
      ],
      ratingAverage: 4.8,
      ratingCount: 77
    },
    {
      title: 'Golden Triangle Explorer (Delhi - Agra - Jaipur)',
      destination: 'Agra & Delhi',
      description: 'The classic Indian journey for all generations. Behold the marble wonder of the Taj Mahal at dawn, the monumental Red Fort, and royal palaces of Jaipur.',
      durationDays: 5,
      price: 16999,
      category: 'family',
      images: [
        'https://images.unsplash.com/photo-1564507592333-c60657eea523?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1477587458883-47145ed94245?w=800&auto=format&fit=crop&q=80'
      ],
      itinerary: [
        { day: 1, title: 'Old & New Delhi Tour', description: 'Qutub Minar, India Gate, and Chandni Chowk rickshaw ride.' },
        { day: 2, title: 'Delhi to Agra via Yamuna Expressway', description: 'Agra Fort and Mehtab Bagh sunset view of Taj Mahal.' },
        { day: 3, title: 'Sunrise Taj Mahal & Drive to Jaipur', description: 'Ghost city of Fatehpur Sikri en route.' },
        { day: 4, title: 'Jaipur Pink City Sights', description: 'Amber Fort, Jal Mahal palace, and colorful handicraft markets.' },
        { day: 5, title: 'Jaipur to Delhi Drop', description: 'Safe return transfer.' }
      ],
      inclusions: ['Family Interconnecting Hotel Rooms', 'Dedicated English Speaking Guide', 'All Interstate Road Taxes & Tolls', 'Taj Mahal Express Entry'],
      maxGroupSize: 16,
      availableDates: [
        { date: getFutureDate(9), seatsLeft: 12 },
        { date: getFutureDate(24), seatsLeft: 14 }
      ],
      ratingAverage: 4.6,
      ratingCount: 88
    },

    // Luxury
    {
      title: 'Udaipur Lake Palace & Royal Haveli Retreat',
      destination: 'Udaipur',
      description: 'Experience 5-star royal luxury fit for an emperor. Private palace butler service, sunset champagne cruises on Lake Pichola, and spa treatments overlooking Aravalli peaks.',
      durationDays: 4,
      price: 54999,
      category: 'luxury',
      images: [
        'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&auto=format&fit=crop&q=80'
      ],
      itinerary: [
        { day: 1, title: 'Private Airport Chauffeur & Royal Welcome', description: 'Rose petal ceremony and Lake View suite check-in.' },
        { day: 2, title: 'Vintage Car Museum & Private Palace Dining', description: 'Curated royal dinner with classical sitar ensemble.' },
        { day: 3, title: 'Luxury Spa & Sunset Shikara Cruise', description: 'Ayurvedic wellness rejuvenation and canapés on water.' },
        { day: 4, title: 'Royal Departure', description: 'Memories of timeless regal grandeur.' }
      ],
      inclusions: ['5-Star Luxury Lake Palace Suite', 'Mercedes Benz Airport Transfers', 'All Gourmet Dining Included', 'Couples Signature Spa Therapy'],
      maxGroupSize: 8,
      availableDates: [
        { date: getFutureDate(15), seatsLeft: 4 },
        { date: getFutureDate(35), seatsLeft: 6 }
      ],
      ratingAverage: 5.0,
      ratingCount: 22
    },
    {
      title: 'Dubai Glamour, Burj & Desert Safari',
      destination: 'Dubai',
      description: 'The pinnacle of international luxury. Marvel at panoramic views from Burj Khalifa Level 148, shop in gold souks, and enjoy private 4x4 dune bashing with gala BBQ dinner.',
      durationDays: 5,
      price: 68999,
      category: 'luxury',
      images: [
        'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1580674684081-7617fbf3d745?w=800&auto=format&fit=crop&q=80'
      ],
      itinerary: [
        { day: 1, title: 'Dubai Arrival & Marina Dhow Dinner', description: 'Private limousine transfer and skyline dining.' },
        { day: 2, title: 'Burj Khalifa At The Top & Dubai Mall', description: 'VIP Sky lounge access at 555 meters.' },
        { day: 3, title: 'Luxury Desert Safari & Stargazing', description: 'Private Land Cruiser dune bashing and falconry show.' },
        { day: 4, title: 'Palm Jumeirah & Atlantis Aquaventure', description: 'Helicopter tour and underwater aquarium exploration.' },
        { day: 5, title: 'Duty Free Shopping & Departure', description: 'Transfer to Dubai International.' }
      ],
      inclusions: ['5-Star Downtown Hotel', 'Burj Khalifa Level 148 Fast Track', 'Private Desert Safari & Camp VIP Table', 'UAE Tourist Visa Included'],
      maxGroupSize: 12,
      availableDates: [
        { date: getFutureDate(20), seatsLeft: 6 },
        { date: getFutureDate(40), seatsLeft: 8 }
      ],
      ratingAverage: 4.9,
      ratingCount: 31
    },

    // Honeymoon
    {
      title: 'Kashmir Paradise: Srinagar & Gulmarg Meadows',
      destination: 'Kashmir',
      description: 'Romantic bliss in the Switzerland of the East. Stay in handcrafted cedar wood houseboats on Dal Lake and ride the world second highest Gulmarg Gondola over snowy pines.',
      durationDays: 6,
      price: 27499,
      category: 'honeymoon',
      images: [
        'https://images.unsplash.com/photo-1595815771614-ade9d652a65d?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=80'
      ],
      itinerary: [
        { day: 1, title: 'Srinagar Arrival & Shikara Ride', description: 'Floating flower market and luxury houseboat check-in.' },
        { day: 2, title: 'Mughal Gardens Shalimar & Nishat', description: 'Centuries-old terraced gardens and mountain vistas.' },
        { day: 3, title: 'Gulmarg Gondola Ride', description: 'Ascent to Apharwat Peak at 13,780 feet.' },
        { day: 4, title: 'Pahalgam Valley of Shepherds', description: 'Betaab Valley and Lidder river romantic stroll.' },
        { day: 5, title: 'Pahalgam to Srinagar Candlelight Dinner', description: 'Traditional Wazwan multicourse feast.' },
        { day: 6, title: 'Airport Departure', description: 'Memories of eternal paradise.' }
      ],
      inclusions: ['Deluxe Dal Lake Houseboat', 'Pine Resort in Pahalgam', 'Gulmarg Gondola Phase 1 Tickets', 'Honeymoon Cake & Flower Bed Decor'],
      maxGroupSize: 8,
      availableDates: [
        { date: getFutureDate(7), seatsLeft: 4 },
        { date: getFutureDate(21), seatsLeft: 6 }
      ],
      ratingAverage: 4.9,
      ratingCount: 65
    },
    {
      title: 'Bali Romance & Tropical Villa Getaway',
      destination: 'Bali',
      description: 'The quintessential romantic island paradise. Private pool villa nestled in Ubud lush rainforests, sunset dinner on Jimbaran Beach, and sacred water temple blessing.',
      durationDays: 6,
      price: 49999,
      category: 'honeymoon',
      images: [
        'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?w=800&auto=format&fit=crop&q=80'
      ],
      itinerary: [
        { day: 1, title: 'Denpasar Arrival & Ubud Pool Villa Check-in', description: 'Traditional Balinese floral garland greeting.' },
        { day: 2, title: 'Tegalalang Rice Terraces & Jungle Swing', description: 'Iconic couple swing photos over emerald valleys.' },
        { day: 3, title: 'Uluwatu Sunset Temple & Kecak Dance', description: 'Cliff-top amphitheater dramatic ocean performance.' },
        { day: 4, title: 'Nusa Penida Island Tour', description: 'Kelingking T-Rex cliff and Crystal Bay snorkeling.' },
        { day: 5, title: 'Seminyak Beach Club & Jimbaran Seafood Dinner', description: 'Romantic candlelit table on the beach.' },
        { day: 6, title: 'Spa & Departure', description: 'Balinese herbal massage and flight home.' }
      ],
      inclusions: ['Private Pool Villa in Ubud', 'Beachfront Hotel in Seminyak', 'Romantic Jimbaran Candlelight Dinner', 'All Private Sightseeing with Driver'],
      maxGroupSize: 10,
      availableDates: [
        { date: getFutureDate(14), seatsLeft: 4 },
        { date: getFutureDate(28), seatsLeft: 8 }
      ],
      ratingAverage: 4.8,
      ratingCount: 42
    },
    // Extra packages to ensure thorough coverage
    {
      title: 'Kolkata to Darjeeling Himalayan Toy Train Experience',
      destination: 'Darjeeling',
      description: 'Witness sunrise over Mount Kanchenjunga from Tiger Hill and ride the UNESCO World Heritage Darjeeling Himalayan Railway.',
      durationDays: 4,
      price: 14499,
      category: 'cultural',
      images: [
        'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800&auto=format&fit=crop&q=80'
      ],
      itinerary: [
        { day: 1, title: 'Bagdogra to Darjeeling Drive', description: 'Scenic ascent through tea valleys.' },
        { day: 2, title: 'Tiger Hill Sunrise & Toy Train', description: 'Early morning mountain glow and steam train ride.' },
        { day: 3, title: 'Peace Pagoda & Himalayan Mountaineering Institute', description: 'Everest expedition history and zoo.' },
        { day: 4, title: 'Departure via Mirik Lake', description: 'Cardamom plantation route.' }
      ],
      inclusions: ['Colonial Heritage Hotel', 'Toy Train Joyride Tickets', 'Tiger Hill Sunrise Passes', 'All Transfers'],
      maxGroupSize: 14,
      availableDates: [
        { date: getFutureDate(16), seatsLeft: 10 }
      ],
      ratingAverage: 4.6,
      ratingCount: 29
    },
    {
      title: 'Jim Corbett Tiger Safari & Wildlife Haven',
      destination: 'Jim Corbett',
      description: 'Venture into India oldest national park in an open 4x4 Gypsy. Track the elusive Royal Bengal Tiger and wild Asiatic elephants in their natural sal forests.',
      durationDays: 3,
      price: 9999,
      category: 'adventure',
      images: [
        'https://images.unsplash.com/photo-1561731216-c3a4d99437d5?w=800&auto=format&fit=crop&q=80'
      ],
      itinerary: [
        { day: 1, title: 'Check-in to Jungle Resort', description: 'Evening nature walk along Kosi river bank.' },
        { day: 2, title: 'Bijrani / Dhikala Jeep Safari', description: 'Morning and afternoon tiger tracking safaris.' },
        { day: 3, title: 'Garjiya Devi Temple & Return', description: 'Riverside temple darshan and journey back.' }
      ],
      inclusions: ['Jungle Luxury Resort', '2 Guided Open Jeep Safaris', 'All Forest Entry Permits', 'All Buffet Meals'],
      maxGroupSize: 12,
      availableDates: [
        { date: getFutureDate(5), seatsLeft: 6 },
        { date: getFutureDate(19), seatsLeft: 8 }
      ],
      ratingAverage: 4.7,
      ratingCount: 33
    }
  ];

  for (const pkg of packagesData) {
    const existing = await TourPackage.findOne({ title: pkg.title });
    if (!existing) {
      await TourPackage.create(pkg);
      console.log(`  + Package: ${pkg.title} [${pkg.category.toUpperCase()}]`);
    }
  }

  // 3. SEED HOTELS (10 hotels across varied cities)
  const hotelsData = [
    {
      name: 'Taj Exotica Resort & Spa',
      city: 'Goa',
      address: 'Calwaddo, Benaulim, South Goa 403716',
      pricePerNight: 16500,
      roomTypes: ['Garden Villa', 'Sea View Deluxe Suite', 'Presidential Villa'],
      amenities: ['Private Beach', 'Infinity Pool', 'Jiva Spa', 'Free High Speed WiFi', 'Multi-Cuisine Restaurants'],
      rating: 4.8,
      availableRooms: 12,
      images: [
        'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&auto=format&fit=crop&q=80'
      ]
    },
    {
      name: 'The Himalayan Luxury Mountain Resort',
      city: 'Manali',
      address: 'Hadimba Road, Siyal, Manali, Himachal Pradesh 175131',
      pricePerNight: 8500,
      roomTypes: ['Victorian Chamber', 'Castle Suite', 'Cottage'],
      amenities: ['Heated Pool', 'Mountain Views', 'Fireplace', 'Gym', 'Free Breakfast'],
      rating: 4.7,
      availableRooms: 15,
      images: [
        'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800&auto=format&fit=crop&q=80'
      ]
    },
    {
      name: 'Rambagh Palace Heritage Luxury',
      city: 'Jaipur',
      address: 'Bhawani Singh Road, Jaipur, Rajasthan 302005',
      pricePerNight: 28000,
      roomTypes: ['Palace Room', 'Historical Suite', 'Royal Suite'],
      amenities: ['Royal Butler Service', 'Indoor/Outdoor Pools', 'Polo Bar', 'Spa', 'Peacock Gardens'],
      rating: 4.9,
      availableRooms: 6,
      images: [
        'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&auto=format&fit=crop&q=80'
      ]
    },
    {
      name: 'Spice Tree Wellness Retreat',
      city: 'Munnar',
      address: 'Muttukad-Periakanal Road, Chinnakkanal, Munnar 685618',
      pricePerNight: 7200,
      roomTypes: ['Classic Room', 'Spa Suite with Jacuzzi', 'Pool Villa'],
      amenities: ['Yoga Deck', 'Infinity Mountain Pool', 'Plantation Walks', 'Restaurant'],
      rating: 4.6,
      availableRooms: 14,
      images: [
        'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&auto=format&fit=crop&q=80'
      ]
    },
    {
      name: 'The Lalit Grand Palace',
      city: 'Srinagar',
      address: 'Gupkar Road, Srinagar, Jammu & Kashmir 190001',
      pricePerNight: 14500,
      roomTypes: ['Palace Deluxe', 'Chinar Suite', 'Maharani Suite'],
      amenities: ['Dal Lake Overlook', 'Historic Chinar Trees', 'Indoor Heated Pool', 'Spa'],
      rating: 4.7,
      availableRooms: 10,
      images: [
        'https://images.unsplash.com/photo-1595815771614-ade9d652a65d?w=800&auto=format&fit=crop&q=80'
      ]
    },
    {
      name: 'The Imperial New Delhi',
      city: 'Delhi',
      address: 'Janpath Lane, Connaught Place, New Delhi 110001',
      pricePerNight: 12000,
      roomTypes: ['Imperial Room', 'Heritage Suite', 'Eliza Single Ladies Room'],
      amenities: ['Art Deco Architecture', 'Swimming Pool', 'Award Winning Restaurants', 'Valet Parking'],
      rating: 4.8,
      availableRooms: 20,
      images: [
        'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&auto=format&fit=crop&q=80'
      ]
    },
    {
      name: 'The Taj Mahal Palace & Tower',
      city: 'Mumbai',
      address: 'Apollo Bunder, Colaba, Mumbai, Maharashtra 400001',
      pricePerNight: 22000,
      roomTypes: ['Tower City View', 'Palace Sea View', 'Grand Luxury Suite'],
      amenities: ['Gateway of India View', '9 Iconic Restaurants', 'Jiva Spa', 'Luxury Yacht Service'],
      rating: 4.9,
      availableRooms: 18,
      images: [
        'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&auto=format&fit=crop&q=80'
      ]
    },
    {
      name: 'Taj Lake Palace',
      city: 'Udaipur',
      address: 'P.O. Box No. 5, Lake Pichola, Udaipur 313001',
      pricePerNight: 35000,
      roomTypes: ['Luxury Lake View', 'Palace Room', 'Grand Royal Suite'],
      amenities: ['Island Palace on Lake', 'Speedboat Transfer', 'Royal Astrologer', 'Jharokha Dining'],
      rating: 5.0,
      availableRooms: 8,
      images: [
        'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&auto=format&fit=crop&q=80'
      ]
    },
    {
      name: 'Symphony Samudra Beachside Resort',
      city: 'Port Blair',
      address: 'Chidiya Tapu, Port Blair, Andaman & Nicobar 744105',
      pricePerNight: 9800,
      roomTypes: ['Casa Tropicana', 'Aqua Villa', 'Sky Villa'],
      amenities: ['Sunset Point', 'Infinity Pool', 'Eco-trail Walks', 'Seafood Grill'],
      rating: 4.5,
      availableRooms: 16,
      images: [
        'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800&auto=format&fit=crop&q=80'
      ]
    },
    {
      name: 'Atlantis The Royal Resort',
      city: 'Dubai',
      address: 'Crescent Road, Palm Jumeirah, Dubai, UAE',
      pricePerNight: 45000,
      roomTypes: ['Seascape Room', 'Sky Pool Villa', 'Royal Mansion'],
      amenities: ['90m Sky Pool', 'Celebrity Chef Dining', 'Private Beach', 'Aquaventure Access'],
      rating: 4.9,
      availableRooms: 10,
      images: [
        'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&auto=format&fit=crop&q=80'
      ]
    }
  ];

  for (const htl of hotelsData) {
    const existing = await Hotel.findOne({ name: htl.name });
    if (!existing) {
      await Hotel.create(htl);
      console.log(`  + Hotel: ${htl.name} (${htl.city})`);
    }
  }

  // 4. SEED TRANSPORT SERVICES (16 scheduled routes across flight, train, bus)
  const transportData = [
    // Flights
    {
      type: 'flight',
      operator: 'IndiGo 6E-205',
      from: 'Delhi',
      to: 'Goa',
      departureTime: '06:30 AM',
      arrivalTime: '09:05 AM',
      duration: '2h 35m',
      price: 4999,
      seatsAvailable: 42
    },
    {
      type: 'flight',
      operator: 'Air India AI-883',
      from: 'Delhi',
      to: 'Goa',
      departureTime: '11:15 AM',
      arrivalTime: '01:55 PM',
      duration: '2h 40m',
      price: 5499,
      seatsAvailable: 28
    },
    {
      type: 'flight',
      operator: 'Vistara UK-927',
      from: 'Mumbai',
      to: 'Delhi',
      departureTime: '07:00 AM',
      arrivalTime: '09:10 AM',
      duration: '2h 10m',
      price: 4200,
      seatsAvailable: 35
    },
    {
      type: 'flight',
      operator: 'Air India AI-821',
      from: 'Delhi',
      to: 'Srinagar',
      departureTime: '08:45 AM',
      arrivalTime: '10:15 AM',
      duration: '1h 30m',
      price: 5800,
      seatsAvailable: 24
    },
    {
      type: 'flight',
      operator: 'IndiGo 6E-442',
      from: 'Delhi',
      to: 'Leh',
      departureTime: '05:40 AM',
      arrivalTime: '07:05 AM',
      duration: '1h 25m',
      price: 6800,
      seatsAvailable: 18
    },
    {
      type: 'flight',
      operator: 'Air India AI-488',
      from: 'Kolkata',
      to: 'Port Blair',
      departureTime: '06:10 AM',
      arrivalTime: '08:25 AM',
      duration: '2h 15m',
      price: 7500,
      seatsAvailable: 30
    },

    // Trains
    {
      type: 'train',
      operator: 'Vande Bharat Express (22436)',
      from: 'Delhi',
      to: 'Varanasi',
      departureTime: '06:00 AM',
      arrivalTime: '02:00 PM',
      duration: '8h 00m',
      price: 1850,
      seatsAvailable: 64
    },
    {
      type: 'train',
      operator: 'Vande Bharat Express (20977)',
      from: 'Delhi',
      to: 'Jaipur',
      departureTime: '06:10 AM',
      arrivalTime: '09:45 AM',
      duration: '3h 35m',
      price: 1050,
      seatsAvailable: 78
    },
    {
      type: 'train',
      operator: 'Rajdhani Express (12952)',
      from: 'Delhi',
      to: 'Mumbai',
      departureTime: '04:55 PM',
      arrivalTime: '08:35 AM',
      duration: '15h 40m',
      price: 2950,
      seatsAvailable: 45
    },
    {
      type: 'train',
      operator: 'Gatimaan Express (12050)',
      from: 'Delhi',
      to: 'Agra',
      departureTime: '08:10 AM',
      arrivalTime: '09:50 AM',
      duration: '1h 40m',
      price: 750,
      seatsAvailable: 90
    },
    {
      type: 'train',
      operator: 'Kerala Express (12626)',
      from: 'Delhi',
      to: 'Kochi',
      departureTime: '08:10 PM',
      arrivalTime: '04:30 AM',
      duration: '40h 20m',
      price: 2450,
      seatsAvailable: 32
    },

    // Buses
    {
      type: 'bus',
      operator: 'Zingbus Luxury Volvo 9600 Multi-Axle',
      from: 'Delhi',
      to: 'Manali',
      departureTime: '06:30 PM',
      arrivalTime: '08:00 AM',
      duration: '13h 30m',
      price: 1450,
      seatsAvailable: 28
    },
    {
      type: 'bus',
      operator: 'IntrCity SmartBus Volvo Sleeper',
      from: 'Delhi',
      to: 'Rishikesh',
      departureTime: '11:00 PM',
      arrivalTime: '05:30 AM',
      duration: '6h 30m',
      price: 799,
      seatsAvailable: 22
    },
    {
      type: 'bus',
      operator: 'KSRTC Airavat Club Class Multi-Axle',
      from: 'Bangalore',
      to: 'Goa',
      departureTime: '08:00 PM',
      arrivalTime: '07:30 AM',
      duration: '11h 30m',
      price: 1250,
      seatsAvailable: 34
    },
    {
      type: 'bus',
      operator: 'KSRTC Swift Scania Sleeper',
      from: 'Bangalore',
      to: 'Kochi',
      departureTime: '09:30 PM',
      arrivalTime: '06:45 AM',
      duration: '9h 15m',
      price: 1100,
      seatsAvailable: 26
    },
    {
      type: 'bus',
      operator: 'RSRTC Royal Goldline Scania',
      from: 'Delhi',
      to: 'Jaipur',
      departureTime: '07:30 AM',
      arrivalTime: '01:00 PM',
      duration: '5h 30m',
      price: 650,
      seatsAvailable: 38
    }
  ];

  for (const trn of transportData) {
    const existing = await TransportService.findOne({
      operator: trn.operator,
      from: trn.from,
      to: trn.to
    });
    if (!existing) {
      await TransportService.create(trn);
      console.log(`  + Transport: ${trn.operator} [${trn.type.toUpperCase()}] ${trn.from} -> ${trn.to}`);
    }
  }

  // 5. SEED PROMOTIONAL OFFERS (3 specified offers)
  const offersData = [
    {
      code: 'WELCOME10',
      title: 'New Explorer Welcome Offer',
      description: 'Get 10% off your booking, up to a maximum of ₹2,000 on minimum booking of ₹5,000.',
      discountType: 'PERCENT',
      discountValue: 10,
      maxDiscount: 2000,
      minAmount: 5000,
      validFrom: getPastDate(30),
      validTo: getFutureDate(365),
      usageLimit: 500,
      usedCount: 14,
      isActive: true
    },
    {
      code: 'FLAT500',
      title: 'Flat ₹500 Super Saver',
      description: 'Enjoy an instant flat discount of ₹500 on all orders above ₹5,000.',
      discountType: 'FLAT',
      discountValue: 500,
      maxDiscount: 500,
      minAmount: 5000,
      validFrom: getPastDate(30),
      validTo: getFutureDate(365),
      usageLimit: 1000,
      usedCount: 42,
      isActive: true
    },
    {
      code: 'EXPIRED50',
      title: 'Monsoon Flash Sale (Expired Test)',
      description: 'Special 50% discount code created specifically to test offer expiry validation.',
      discountType: 'PERCENT',
      discountValue: 50,
      maxDiscount: 5000,
      minAmount: 1000,
      validFrom: getPastDate(90),
      validTo: getPastDate(15), // Expired in the past!
      usageLimit: 100,
      usedCount: 100,
      isActive: true
    }
  ];

  for (const off of offersData) {
    const existing = await PromotionalOffer.findOne({ code: off.code });
    if (!existing) {
      await PromotionalOffer.create(off);
      console.log(`  + Offer: ${off.code} (${off.discountType} ${off.discountValue})`);
    }
  }

  // 6. SEED DEMO BOOKINGS & PAYMENTS (For Customer Demo)
  const customer = await User.findOne({ email: 'customer@tms.test' });
  const agent = await User.findOne({ email: 'agent@tms.test' });
  const goaPkg = await TourPackage.findOne({ destination: 'Goa' });
  const rajasthanPkg = await TourPackage.findOne({ destination: 'Rajasthan' });
  const tajHotel = await Hotel.findOne({ name: /Taj Exotica/i });
  const flightGoa = await TransportService.findOne({ type: 'flight', to: 'Goa' });

  if (customer && goaPkg) {
    // 1. Confirmed Booking (Upcoming in 14 days)
    const existingConfirmed = await Booking.findOne({ bookingId: 'TMS-20261019-1001' });
    if (!existingConfirmed) {
      const travelDate = getFutureDate(14);
      const basePrice = goaPkg.price * 2;
      const discount = Math.min(Math.round((basePrice * 10) / 100), 2000); // WELCOME10
      const taxes = Math.round((basePrice - discount) * 0.05 * 100) / 100;
      const total = basePrice - discount + taxes;

      const confirmedBooking = await Booking.create({
        bookingId: 'TMS-20261019-1001',
        user: customer._id,
        itemType: 'package',
        package: goaPkg._id,
        travelDate,
        travellers: [
          { name: 'Rohan Sharma', age: 29, gender: 'male' },
          { name: 'Ananya Sharma', age: 27, gender: 'female' }
        ],
        numberOfTravellers: 2,
        priceBreakdown: {
          unitPrice: goaPkg.price,
          basePrice,
          discount,
          discountDetails: { code: 'WELCOME10', discountType: 'PERCENT', discountValue: 10 },
          taxes,
          total
        },
        appliedOfferCode: 'WELCOME10',
        status: 'CONFIRMED',
        assignedAgent: agent ? agent._id : null,
        statusHistory: [
          { status: 'PENDING_PAYMENT', changedAt: getPastDate(2), note: 'Booking initiated' },
          { status: 'CONFIRMED', changedAt: getPastDate(2), note: 'Payment verified via CARD' }
        ]
      });

      await Payment.create({
        booking: confirmedBooking._id,
        user: customer._id,
        amount: total,
        method: 'CARD',
        gateway: 'MockGateway',
        gatewayOrderId: 'order_mock_seed_1001',
        gatewayPaymentId: 'pay_mock_seed_1001',
        status: 'SUCCESS',
        invoiceNumber: 'INV-20261019-1001'
      });
      console.log('  + Seeded Confirmed Booking: TMS-20261019-1001 (Goa, 2 travellers, Invoice INV-20261019-1001)');
    }

    // 2. Completed Booking (Past trip 20 days ago)
    const existingCompleted = await Booking.findOne({ bookingId: 'TMS-20261019-1002' });
    if (!existingCompleted && rajasthanPkg) {
      const travelDate = getPastDate(20);
      const basePrice = rajasthanPkg.price;
      const taxes = Math.round(basePrice * 0.05 * 100) / 100;
      const total = basePrice + taxes;

      const completedBooking = await Booking.create({
        bookingId: 'TMS-20261019-1002',
        user: customer._id,
        itemType: 'package',
        package: rajasthanPkg._id,
        travelDate,
        travellers: [{ name: 'Rohan Sharma', age: 29, gender: 'male' }],
        numberOfTravellers: 1,
        priceBreakdown: {
          unitPrice: rajasthanPkg.price,
          basePrice,
          discount: 0,
          taxes,
          total
        },
        status: 'COMPLETED',
        assignedAgent: agent ? agent._id : null,
        statusHistory: [
          { status: 'PENDING_PAYMENT', changedAt: getPastDate(30), note: 'Booking initiated' },
          { status: 'CONFIRMED', changedAt: getPastDate(30), note: 'Payment verified' },
          { status: 'COMPLETED', changedAt: getPastDate(15), note: 'Trip completed successfully' }
        ]
      });

      await Payment.create({
        booking: completedBooking._id,
        user: customer._id,
        amount: total,
        method: 'UPI',
        gateway: 'MockGateway',
        gatewayOrderId: 'order_mock_seed_1002',
        gatewayPaymentId: 'pay_mock_seed_1002',
        status: 'SUCCESS',
        invoiceNumber: 'INV-20261019-1002'
      });
      console.log('  + Seeded Completed Booking: TMS-20261019-1002 (Rajasthan, 1 traveller, Status COMPLETED)');
    }

    // 3. Cancelled Booking with Refund
    const existingCancelled = await Booking.findOne({ bookingId: 'TMS-20261019-1003' });
    if (!existingCancelled && flightGoa) {
      const basePrice = flightGoa.price;
      const taxes = Math.round(basePrice * 0.05 * 100) / 100;
      const total = basePrice + taxes;
      const refundAmount = Math.round((total * 90) / 100);

      const cancelledBooking = await Booking.create({
        bookingId: 'TMS-20261019-1003',
        user: customer._id,
        itemType: 'transport',
        transport: flightGoa._id,
        travelDate: getFutureDate(10),
        travellers: [{ name: 'Rohan Sharma', age: 29, gender: 'male' }],
        numberOfTravellers: 1,
        priceBreakdown: {
          unitPrice: flightGoa.price,
          basePrice,
          discount: 0,
          taxes,
          total
        },
        status: 'CANCELLED',
        cancellation: {
          reason: 'Change in office schedule',
          cancelledAt: getPastDate(1),
          refundPercentage: 90,
          refundAmount,
          refundStatus: 'PROCESSED'
        },
        statusHistory: [
          { status: 'PENDING_PAYMENT', changedAt: getPastDate(5) },
          { status: 'CONFIRMED', changedAt: getPastDate(5) },
          { status: 'CANCELLED', changedAt: getPastDate(1), note: 'Cancelled by customer (90% refund)' }
        ]
      });

      await Payment.create({
        booking: cancelledBooking._id,
        user: customer._id,
        amount: refundAmount,
        method: 'CARD',
        gateway: 'MockGateway',
        status: 'REFUNDED',
        gatewayPaymentId: 'rfnd_mock_seed_1003'
      });
      console.log('  + Seeded Cancelled Booking: TMS-20261019-1003 (Flight, 90% Refund processed)');
    }

    // 4. Pending Payment Booking (Ready for interactive checkout demo)
    const existingPending = await Booking.findOne({ bookingId: 'TMS-20261019-1004' });
    if (!existingPending && tajHotel) {
      const basePrice = tajHotel.pricePerNight * 2;
      const taxes = Math.round(basePrice * 0.05 * 100) / 100;
      const total = basePrice + taxes;

      await Booking.create({
        bookingId: 'TMS-20261019-1004',
        user: customer._id,
        itemType: 'hotel',
        hotel: tajHotel._id,
        checkInDate: getFutureDate(5),
        checkOutDate: getFutureDate(7),
        roomType: 'Deluxe Room',
        travellers: [
          { name: 'Rohan Sharma', age: 29, gender: 'male' },
          { name: 'Ananya Sharma', age: 27, gender: 'female' }
        ],
        numberOfTravellers: 2,
        priceBreakdown: {
          unitPrice: tajHotel.pricePerNight * 2,
          basePrice,
          discount: 0,
          taxes,
          total
        },
        status: 'PENDING_PAYMENT',
        paymentExpiresAt: new Date(Date.now() + 15 * 60 * 1000),
        statusHistory: [
          { status: 'PENDING_PAYMENT', changedAt: new Date(), note: 'Booking reserved; awaiting payment' }
        ]
      });
      console.log('  + Seeded Pending Booking: TMS-20261019-1004 (Taj Exotica, ready for Pay Now demo)');
    }

    // 7. SEED DEMO COMPLAINTS & REVIEWS
    const completedBooking = await Booking.findOne({ bookingId: 'TMS-20261019-1002' });
    const confirmedBooking = await Booking.findOne({ bookingId: 'TMS-20261019-1001' });

    // Reviews (Only on completed bookings)
    if (completedBooking && rajasthanPkg) {
      const existingReview = await Review.findOne({ booking: completedBooking._id });
      if (!existingReview) {
        const review = new Review({
          user: customer._id,
          booking: completedBooking._id,
          package: rajasthanPkg._id,
          rating: 5,
          comment: 'Absolutely breathtaking experience exploring Jaipur and Udaipur! The heritage hotels and guided tours were top-notch.'
        });
        await review.save();
        console.log('  + Seeded Review: 5 stars on Rajasthan Royal Heritage Tour');
      }
    }

    // Complaints
    const existingCmp1 = await Complaint.findOne({ complaintId: 'CMP-882194' });
    if (!existingCmp1) {
      await Complaint.create({
        complaintId: 'CMP-882194',
        user: customer._id,
        booking: confirmedBooking ? confirmedBooking._id : null,
        subject: 'Room upgrade inquiry for Taj Exotica',
        description: 'I would like to inquire if sea-view room upgrades are available for my upcoming stay at Taj Exotica.',
        status: 'OPEN'
      });
      console.log('  + Seeded Open Complaint: CMP-882194');
    }

    const existingCmp2 = await Complaint.findOne({ complaintId: 'CMP-441209' });
    if (!existingCmp2) {
      await Complaint.create({
        complaintId: 'CMP-441209',
        user: customer._id,
        subject: 'Train seat preference assistance',
        description: 'Need lower berth seats for senior citizen passengers on the Vande Bharat Express booking.',
        status: 'RESOLVED',
        assignedTo: agent ? agent._id : null,
        notes: [
          {
            author: agent ? agent._id : customer._id,
            text: 'Contacted reservation counter; lower berths confirmed for coaches B2 and B3.',
            createdAt: getPastDate(2)
          }
        ],
        resolution: 'Lower berths confirmed and updated ticket e-voucher re-issued.'
      });
      console.log('  + Seeded Resolved Complaint: CMP-441209');
    }
  }

  console.log('[Seed] Database seeding completed successfully.');
};

const run = async () => {
  const isReset = process.argv.includes('--reset');
  try {
    await connectDB();
    await seedCatalog(isReset);
    await disconnectDB();
    console.log('[Seed] Finished all seed operations. Exiting.');
    process.exit(0);
  } catch (err) {
    console.error(`[Seed Error] ${err.message}`);
    process.exit(1);
  }
};

if (require.main === module) {
  run();
}

module.exports = { seedCatalog };
