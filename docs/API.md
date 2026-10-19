# Tourism Management System (TMS) - REST API Documentation

Base URL: `http://localhost:5000/api/v1`

All authenticated endpoints require an `Authorization: Bearer <JWT_TOKEN>` header.

---

## 1. Authentication Endpoints (`/auth`)

### Register Customer
- **Endpoint**: `POST /auth/register`
- **Body**: `{ "name": "string", "email": "string", "password": "string", "phone": "string" }`
- **Response**: `201 Created` $\rightarrow$ `{ "success": true, "token": "string", "user": { ... } }`

### Login
- **Endpoint**: `POST /auth/login`
- **Body**: `{ "email": "string", "password": "string" }`
- **Response**: `200 OK` $\rightarrow$ `{ "success": true, "token": "string", "user": { ... } }`

### Get Current User Profile
- **Endpoint**: `GET /auth/me`
- **Auth**: Required (`customer`, `employee`, `admin`)
- **Response**: `200 OK` $\rightarrow$ `{ "success": true, "user": { ... } }`

### Password Reset Flow
- **Request Token**: `POST /auth/forgot-password` with `{ "email": "string" }`
- **Reset Password**: `POST /auth/reset-password/:token` with `{ "password": "string" }`

---

## 2. Catalog & Search Endpoints

### Tour Packages
- `GET /packages`: Search packages with query parameters `search`, `category`, `minPrice`, `maxPrice`, `page`, `limit`.
- `GET /packages/:id`: Retrieve single package details with itinerary and reviews.

### Hotels
- `GET /hotels`: Search hotels with query parameters `city`, `stars`, `minPrice`, `maxPrice`.
- *Includes graceful fallback to LocalProvider if external supplier APIs encounter 504 timeouts.*
- `GET /hotels/:id`: Retrieve single hotel details.

### Transport
- `GET /transport`: Search transport routes with query parameters `type` (`flight|train|bus`), `from`, `to`, `date`.

---

## 3. Booking Engine (`/bookings`)

### Create Booking
- **Endpoint**: `POST /bookings`
- **Auth**: Required (`customer`)
- **Body**:
  ```json
  {
    "itemType": "package | hotel | transport",
    "packageId": "objectId",
    "travelDate": "2026-11-15T00:00:00.000Z",
    "travellers": [
      { "name": "Rohan Sharma", "age": 29, "gender": "male" }
    ],
    "offerCode": "WELCOME10"
  }
  ```
- **Response**: `201 Created` $\rightarrow$ `{ "success": true, "booking": { ... } }`

### View My Bookings
- **Endpoint**: `GET /bookings/mine`
- **Auth**: Required (`customer`)
- **Response**: `200 OK` $\rightarrow$ `{ "success": true, "bookings": [ ... ] }`

### Booking Cancellation Preview
- **Endpoint**: `GET /bookings/:id/cancel-preview`
- **Auth**: Required (Owner or Admin)
- **Response**: `200 OK` $\rightarrow$ `{ "success": true, "preview": { "refundPercentage": 90, "refundAmount": 26838 } }`

### Confirm Cancellation
- **Endpoint**: `POST /bookings/:id/cancel`
- **Auth**: Required (Owner or Admin)
- **Body**: `{ "reason": "string" }`
- **Response**: `200 OK` $\rightarrow$ `{ "success": true, "booking": { ... }, "refund": { ... } }`

### Operations Queue (Employee & Admin)
- **Endpoint**: `GET /bookings`
- **Query**: `status`, `search`, `page`, `limit`
- **Update Status**: `PATCH /bookings/:id/status` with `{ "status": "string", "note": "string" }`

---

## 4. Payment Gateway & Invoicing (`/payments`)

### Create Mock Payment
- **Endpoint**: `POST /payments/create-intent`
- **Auth**: Required
- **Body**: `{ "bookingId": "string", "method": "CARD | UPI" }`
- **Response**: `200 OK` $\rightarrow$ `{ "success": true, "payment": { ... }, "invoiceNumber": "INV-..." }`

### Download Tax Invoice PDF
- **Endpoint**: `GET /payments/:bookingId/invoice`
- **Auth**: Required (Owner or Staff)
- **Response**: `200 OK` with binary `application/pdf` stream.

---

## 5. Complaints & Support (`/complaints`)

### Submit Complaint
- **Endpoint**: `POST /complaints`
- **Auth**: Required (`customer`)
- **Body**: `{ "subject": "string", "description": "string", "bookingId": "optional" }`
- **Response**: `201 Created` $\rightarrow$ `{ "success": true, "complaint": { "complaintId": "CMP-XXXXXX", ... } }`

### My Complaints
- **Endpoint**: `GET /complaints/mine`
- **Auth**: Required (`customer`)

### List All Complaints (Employee & Admin)
- **Endpoint**: `GET /complaints`
- **Query**: `status`, `search`, `page`, `limit`

### Add Internal Staff Note
- **Endpoint**: `POST /complaints/:id/notes`
- **Auth**: Required (`employee`, `admin`)
- **Body**: `{ "text": "string" }`

### Update Status & Resolution
- **Endpoint**: `PATCH /complaints/:id`
- **Auth**: Required (`employee`, `admin`)
- **Body**: `{ "status": "IN_PROGRESS | RESOLVED | CLOSED", "resolution": "string" }`

---

## 6. Verified Reviews (`/reviews`)

### Submit Review
- **Endpoint**: `POST /reviews`
- **Auth**: Required (`customer`)
- **Body**: `{ "bookingId": "objectId", "rating": 5, "comment": "string" }`
- *Requires `booking.status === 'COMPLETED'`. Rejects pending/cancelled bookings.*

### Get Package Reviews
- **Endpoint**: `GET /reviews/package/:packageId`
- **Public**: `200 OK` $\rightarrow$ `{ "success": true, "reviews": [ ... ] }`

---

## 7. Reports & Auditing (`/reports`)

### Summary KPI Statistics
- **Endpoint**: `GET /reports/stats`
- **Auth**: Required (`employee`, `admin`)
- **Response**:
  ```json
  {
    "success": true,
    "stats": {
      "totalUsers": 12,
      "totalBookings": 45,
      "totalRevenue": 145000,
      "openComplaints": 3,
      "bookingsByStatus": { "CONFIRMED": 20, "COMPLETED": 18, "CANCELLED": 7 }
    }
  }
  ```

### Monthly Revenue Trends
- **Endpoint**: `GET /reports/revenue`
- **Auth**: Required (`employee`, `admin`)
- **Query**: `period=month|day`

### Export Bookings (CSV or PDF)
- **Endpoint**: `GET /reports/bookings?format=csv` $\rightarrow$ streams `text/csv`
- **Endpoint**: `GET /reports/bookings?format=pdf` $\rightarrow$ streams `application/pdf`
