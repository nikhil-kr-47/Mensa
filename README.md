# Mensa 🍔 — Digital Counter Infrastructure for Campus Canteens

> A lightweight, multi-tenant food ordering & live queue platform designed for universities and college canteens. Zero app downloads, zero chaos at the counter.

---

### 🚀 Key Features

- 🎫 **Digital Order Token System**: Unique daily token numerals (#001, #047) providing crystal-clear pickup status for students.
- 🏢 **Multi-Tenant Architecture**: Every campus canteen counter receives its own dedicated portal (`/canteen/:slug`) with isolated menus, queues, and credentials.
- 🚴 **3 Flexible Fulfillment Modes**:
  - **Live Queue**: Real-time counter pickup between classes.
  - **Hostel Delivery**: Direct delivery to student hostel rooms.
  - **Slot Booking**: Pre-order meals for scheduled lunch breaks.
- ⚡ **Live Admin Counter Terminal**: Glanceable dashboard with order status progression (`Preparing` ➔ `Ready` ➔ `Delivered`) and real-time revenue analytics.
- 🛡️ **Super Admin Controls**: One-click canteen approvals, slug assignments, and instant active/pause killswitches.
- 🎓 **Campus Email Verification**: Domain-restricted authentication ensuring only verified campus members can order.

---

### 🛠️ Built With

- **Backend**: Node.js & Express 5
- **Database**: MongoDB & Mongoose
- **Frontend**: Server-rendered EJS templates with mobile-first CSS (WCAG AA compliant)
- **Auth**: Passport.js (Local strategy with role-based access control)
