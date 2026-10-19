# Tourism Management System (TMS) - Traveller User Manual

Welcome to the **Tourism Management System (TMS)**. This guide walks you through planning, booking, managing, and reviewing your travel journeys.

---

## 1. Demo Customer Credentials

You can use the pre-seeded customer account or register your own:
- **URL**: `http://localhost:5173/login`
- **Email**: `customer@tms.test`
- **Password**: `Customer@123`
- *Or register a new account on `/register`.*

---

## 2. Exploring the Travel Catalog

### 2.1 Tour Packages (`/packages`)
- **Search & Filter**: Search destinations (e.g. *Goa, Rajasthan, Kerala, Kashmir, Manali*), filter by category (*ADVENTURE, LUXURY, CULTURAL, FAMILY, HONEYMOON*), or sort by price.
- **Package Details**: View duration, itinerary schedule, included amenities, and real-time star ratings calculated from verified traveller reviews.

### 2.2 Hotel Stays (`/hotels`)
- Filter by city/destination, star rating (1–5), amenities (Pool, Spa, WiFi), and price range.
- External provider fallback ensures seamless listings even if external partner APIs experience timeouts.

### 2.3 Flights, Trains & Buses (`/transport`)
- Filter by transit mode (`flight`, `train`, `bus`), origin city, destination, and available seat inventory.

---

## 3. Booking & Mock Payment Flow

1. **Select Travel Dates & Travellers**:
   - Choose travel departure dates and add passenger manifests (name, age, gender).
2. **Apply Promotional Coupons**:
   - Enter promotional codes like `WELCOME10` (10% off up to ₹2,000) or `FLAT500` (₹500 off) for instant price deductions.
3. **Price Transparency**:
   - Complete live price breakdown showing unit price, base price, applied discount, 5% GST taxes, and final total.
4. **Mock Payment Simulation**:
   - Simulated payment modal supporting Card or UPI. Instant transaction processing with zero real money deducted.
5. **Instant Confirmation & PDF Tax Invoice**:
   - Booking transitions to `CONFIRMED`.
   - Download official PDF Tax Invoice anytime from **My Bookings** (`/my-bookings`).

---

## 4. Trip Cancellations & Automated Refunds

Plans change? TMS provides tiered cancellation refunds based on departure countdown:

| Cancellation Timing | Refund Percentage |
| :--- | :--- |
| **> 15 days before departure** | **100% Full Refund** |
| **7 – 15 days before departure** | **90% Refund** (10% handling fee) |
| **2 – 6 days before departure** | **50% Refund** |
| **< 48 hours before departure** | **No Refund** |

- Click **Cancel Trip** on any confirmed booking card to preview your guaranteed refund calculation before confirming.
- Refund records are automatically logged and viewable in your dashboard.

---

## 5. Customer Support & Complaints (`/support/complaints`)

- Encounter an issue or need special assistance (e.g. sea-view upgrade, senior citizen lower berth seats)?
- Submit a ticket directly from the **Support Tickets** portal:
  - Generate a unique tracking ID (`CMP-XXXXXX`).
  - Optionally link ticket to an active or past booking.
  - View agent replies, staff notes, and resolution updates in real time.

---

## 6. Verified Traveller Reviews

- Completed a tour with us?
- Once a booking reaches status `COMPLETED`, a **Rate & Review** button appears on your booking card.
- Rate your experience (1–5 stars) and write comments.
- Submissions dynamically recalculate package star ratings and appear on public tour listings.
