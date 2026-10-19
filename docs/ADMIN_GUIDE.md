# Tourism Management System (TMS) - Administrator Guide

Welcome to the **Tourism Management System (TMS)** Administrator Guide. This document provides step-by-step instructions for platform administrators to configure, monitor, maintain, and audit the TMS platform.

---

## 1. Demo Administrator Credentials

The system seeds a pre-configured administrator account:
- **URL**: `http://localhost:5173/login`
- **Email**: `admin@tms.test`
- **Password**: `Admin@123`
- **Role**: `admin` (Full superuser access)

---

## 2. Platform Architecture & RBAC Hierarchy

TMS enforces a strict 3-tier Role-Based Access Control (RBAC) model implemented via JWT tokens and backend authorization middleware:

| Role | Access Level | Description |
| :--- | :--- | :--- |
| **`admin`** | System Superuser | Full access to user management, promotional codes, catalog controls, financial reports, PDF/CSV audits, and complaint oversight. |
| **`employee`** | Travel Operations Agent | Access to operations queue, assigning agents, processing booking statuses, customer inquiries, and complaints resolution. |
| **`customer`** | End-User Traveller | Search catalog, create reservations, apply coupons, simulate mock payments, download tax invoices, request refunds, submit complaints, and review completed trips. |

---

## 3. Administrative Control Center

Log in with your administrator account and navigate to **Admin Console** (`/admin/dashboard`):

### 3.1 Analytics & KPI Monitoring
- **Gross Revenue**: Real-time aggregated summation of all successful mock card and UPI payments.
- **Total Bookings**: Count of all reservations across tour packages, hotels, and transport services.
- **Registered Customers**: Active customer accounts in the database.
- **Open Complaints**: Real-time count of tickets requiring agent investigation.
- **Interactive Recharts Visuals**:
  - **Monthly Revenue Area Chart**: Smooth volume gradient displaying gross revenue trends.
  - **Status Donut Chart**: Proportional distribution across `CONFIRMED`, `COMPLETED`, `PENDING_PAYMENT`, and `CANCELLED`.
  - **Top-Selling Packages**: Ranked list of highest grossing tour packages.

### 3.2 User Directory & RBAC Security
- **Filtering**: Search users by name or email; filter by role (`admin`, `employee`, `customer`).
- **Account Status**: Toggle user account active/suspended state instantly.
- **Critical Security Safeguards**:
  - *Self-Deletion Protection*: Administrators cannot delete their own account.
  - *Last-Admin Protection*: The system prevents deleting the last active administrator, ensuring management lockout never occurs.

### 3.3 Promotional Offers & Coupon Engine
Configure discount codes applied during customer booking checkouts:
- **Discount Types**:
  - `PERCENT`: Calculates percentage deduction (e.g. 10% off).
  - `FLAT`: Fixed rupee deduction (e.g. ₹500 flat off).
- **Guardrails**: Minimum booking subtotal threshold (`minBookingAmount`) and maximum allowable discount cap (`maxDiscountAmount`).
- **Toggle State**: Instantly activate or deactivate promo codes without deleting historical usage counts.

### 3.4 Financial Audits & Data Export
Generate audit reports containing traveller details, pricing breakdowns, and transaction proofs:
- **CSV Export**: Direct spreadsheet download (`TMS-Bookings-Report.csv`) via `GET /api/v1/reports/bookings?format=csv`.
- **PDF Export**: Formatted binary PDF report (`TMS-Bookings-Report.pdf`) via `GET /api/v1/reports/bookings?format=pdf` using `pdfkit`.
- **Filters**: Filter exports by booking status or date range.

---

## 4. Customer Support & Complaints Oversight

- Complaints can be tracked by Ticket ID (`CMP-XXXXXX`).
- Employees and administrators can add internal notes to ticket threads.
- Changing ticket status to `RESOLVED` triggers automated customer email and SMS notifications detailing the resolution.

---

## 5. Seed Reset Command

To restore demo users, promotional offers, sample bookings, and mock complaints to their pristine state:
```bash
cd server
node src/seeds/seed.js --reset
```
