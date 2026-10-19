# Tourism Management System (TMS) - MERN Prototype

[![Jest Backend Tests](https://img.shields.io/badge/backend%20tests-69%20passed-emerald)](file:///m:/SEM7/SPMT/Project/server/tests)
[![Vitest Frontend Tests](https://img.shields.io/badge/frontend%20tests-8%20passed-sky)](file:///m:/SEM7/SPMT/Project/client/src)
[![Stack](https://img.shields.io/badge/stack-MongoDB%20%7C%20Express%20%7C%20React%20%7C%20Node-purple)](https://react.dev)

A complete, working full-stack Tourism Management System prototype built on the **MERN** stack (MongoDB, Express, React/Vite, Node.js). Designed for an academic 2-person project delivered in 4 increments.

---

## 🚀 Quick Start

### 1. Prerequisites
- **Node.js** (v18+ recommended)
- **MongoDB** running locally on port `27017` (e.g. `mongodb://127.0.0.1:27017/tms_db`)

### 2. Install Dependencies
Run from project root:
```bash
npm install
npm run install:all
```

### 3. Seed Demo Data
Populate the database with demo users, holiday packages, hotels, flights/trains, promotional offers, bookings, complaints, and reviews:
```bash
cd server
npm run seed
```
*(To wipe and re-seed from scratch anytime, run `npm run seed:reset`)*

### 4. Run Locally
- **Backend Server** (Port `5000`):
  ```bash
  cd server
  npm run dev
  ```
- **Frontend Client** (Port `5173`):
  ```bash
  cd client
  npm run dev
  ```
Open `http://localhost:5173` in your browser.

---

## 👥 Demo Accounts

| Role | Email | Password | Access Highlights |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@tms.test` | `Admin@123` | Analytics, Recharts graphs, User Directory, Promo Codes, PDF/CSV Export |
| **Employee (Agent)** | `agent@tms.test` | `Agent@123` | Operations queue, booking status updates, complaints timeline, internal notes |
| **Customer** | `customer@tms.test` | `Customer@123` | Catalog search, booking, mock payments, PDF invoices, refunds, complaints, reviews |

---

## 🧪 Automated Test Suites

### Backend Jest Tests (69 Passing Tests)
```bash
cd server
npm test
```
- `tests/auth.test.js`: Register, login, token refresh, password reset, account deactivation blocking.
- `tests/catalog.test.js`: Package, hotel, transport search, category filtering, provider fallback resilience.
- `tests/booking_payment.test.js`: Booking flow, coupon calculation, mock CARD/UPI checkout, invoice generation, cancellation refund tiers (100%/90%/50%/0%).
- `tests/complaint_report.test.js`: Complaints lifecycle, staff notes, verified reviews on completed trips, admin deletion safeguards, CSV/PDF report streaming.

### Frontend Vitest Tests (8 Passing Tests)
```bash
cd client
npm test
```
- Component tests for `LoginPage`, `PackagesPage`, and `PriceBreakdown`.

---

## 📋 5-Minute Evaluation Demo Walkthrough

Follow this click-by-click walkthrough to demonstrate every role end-to-end:

### Step 1: Customer Journey (Search, Book & Pay)
1. Navigate to `http://localhost:5173/login` and click **"Demo Customer"** to log in as `customer@tms.test`.
2. Click **"Packages"** in the navigation bar. Filter by category (e.g. *LUXURY* or *HONEYMOON*) or search "Goa".
3. Click on a package card (e.g., *Goa Beach Paradise*) to view itinerary and star ratings.
4. Select departure date, add traveller details, and enter coupon code `WELCOME10` to observe live 10% discount calculation.
5. Click **"Proceed to Reserve"**. On the mock checkout screen, select **Credit / Debit Card** and click **"Simulate Successful Payment"**.
6. The booking is instantly confirmed. Click **"Download Tax Invoice"** to inspect the official PDF.

### Step 2: Customer Journey (Cancellation, Complaints & Reviews)
1. Navigate to **"My Bookings"** (`/my-bookings`).
2. On confirmed trip `TMS-20261019-1001`, click **"Cancel Trip"**. The refund modal shows an exact 90% refund calculation.
3. On completed trip `TMS-20261019-1002`, click **"Rate & Review"**. Submit a 5-star rating with feedback to see real-time recalculation of package rating averages.
4. Click **"Support Tickets"** in the top navigation (`/support/complaints`). Click **"Submit New Ticket"** and create ticket `CMP-XXXXXX` linked to your booking.

### Step 3: Travel Agent Journey (Operations & Customer Service)
1. Sign out and log in as **"Demo Travel Agent"** (`agent@tms.test` / `Agent@123`).
2. Navigate to **"Agent Dashboard"** (`/agent/dashboard`).
3. In **Bookings Queue**, inspect pending trips, change status from `PENDING_PAYMENT` to `CONFIRMED` or `COMPLETED`.
4. Switch to **Complaints Queue**. Open the customer ticket, append an internal staff note, set resolution message, and mark as `RESOLVED`. (Notice SMS and email dispatch in console logs).

### Step 4: Administrator Journey (Governance, Analytics & Auditing)
1. Sign out and log in as **"Demo Admin"** (`admin@tms.test` / `Admin@123`).
2. Navigate to **"Admin Console"** (`/admin/dashboard`).
3. **Analytics & Trends**: View the Recharts Gross Revenue Area Chart and Booking Status Distribution Donut Chart.
4. **Users & RBAC**: Test self-deletion prevention (click delete on self $\rightarrow$ safeguard blocks action). Deactivate/activate a customer account.
5. **Promo Offers**: Toggle coupon codes on/off or create a new seasonal promo code.
6. **Export Data**: Click **"Export CSV Spreadsheet"** and **"Export Official PDF Report"** to download instant audit files.

---

## 📁 Project Structure

```
├── client/                     # Vite + React Frontend
│   ├── src/
│   │   ├── api/axios.js        # Centralized Axios with JWT interceptors
│   │   ├── components/         # Booking, Catalog, Layout, Common components
│   │   ├── context/AuthContext # Authentication & User state
│   │   ├── pages/              # Catalog, Dashboard, Support, Auth pages
│   │   └── App.jsx             # Role-guarded routing
├── server/                     # Express & Node.js Backend
│   ├── src/
│   │   ├── config/             # DB & environment variables
│   │   ├── controllers/        # Auth, Catalog, Booking, Payment, Complaints, Reports
│   │   ├── middleware/         # JWT Protect, Role Authorize, Error Handling
│   │   ├── models/             # User, TourPackage, Hotel, Transport, Booking, Payment, Complaint, Review
│   │   ├── routes/             # REST API routers
│   │   ├── seeds/seed.js       # Demo data seeder
│   │   └── services/           # PDF Invoices, Email, SMS, External Provider Fallback
│   └── tests/                  # 4 Jest test suites
├── docs/                       # Project Documentation Deliverables
│   ├── ADMIN_GUIDE.md          # Complete Administrator Guide
│   ├── USER_MANUAL.md          # Customer Traveller Manual
│   └── API.md                  # REST API Endpoints Reference
└── package.json                # Monorepo scripts
```

---

## 📜 Documentation Links
- [Administrator Guide](file:///m:/SEM7/SPMT/Project/docs/ADMIN_GUIDE.md)
- [Traveller User Manual](file:///m:/SEM7/SPMT/Project/docs/USER_MANUAL.md)
- [REST API Reference](file:///m:/SEM7/SPMT/Project/docs/API.md)
