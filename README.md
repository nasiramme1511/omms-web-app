# Organization Membership Management System (OMMS)

[![Live Application](https://img.shields.io/badge/Live-Demo-brightgreen.svg)](https://omms-web-app.onrender.com)
[![GitHub Repository](https://img.shields.io/badge/GitHub-Repository-blue.svg)](https://github.com/nasiramme1511/omms-web-app)
[![Technology](https://img.shields.io/badge/Stack-Node.js%20%7C%20Express%20%7C%20React%20%7C%20Prisma%20%7C%20MySQL-blue.svg)](https://github.com/nasiramme1511/omms-web-app)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript-3178C6.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Frontend-React%2018%20%2B%20Vite-646CFF.svg)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Styling-Tailwind%20CSS-38B2AC.svg)](https://tailwindcss.com/)

---

## 📖 Overview

**Organization Membership Management System (OMMS)** is a web-based full-stack platform designed to digitize and simplify organization membership management.

The system provides a centralized environment where organizations can manage members, events, payments, blogs, subscription plans, notifications, and organization-specific custom attributes. OMMS follows a multi-tenant architecture with role-based access control, allowing different users to access functionality according to their assigned roles (`SuperAdmin`, `orgAdmin`, `member`) and organization scope.

---

## 🌐 Live Application & Repository

* **Live Web Application**: [https://omms-web-app.onrender.com](https://omms-web-app.onrender.com/)
* **GitHub Repository**: [https://github.com/nasiramme1511/omms-web-app](https://github.com/nasiramme1511/omms-web-app)

---

## 🎯 Project Goals

OMMS was developed to address common operational challenges faced by member-driven organizations that rely on manual or fragmented management processes:

* **Digitize Member Registration and Lifecycle Management**: Streamline member onboarding with OTP email verification and profile management.
* **Centralize Information in a Multi-Tenant Model**: Maintain separate organizational data boundaries across members, events, blogs, custom fields, and payments.
* **Provide Role-Tailored Dashboards**: Deliver specific user interfaces and administrative metrics for platform managers, organization leads, and regular members.
* **Support Event Coordination**: Manage event publishing, capacity tracking, and member RSVP registrations.
* **Enable Multi-Channel Payments**: Support online card/mobile transactions via Chapa API alongside manual bank transfer workflows (Telebirr, CBE Birr).
* **Assist Manual Verification with OCR**: Scan uploaded payment receipts using Tesseract.js OCR to extract reference numbers, amounts, and dates for admin approval.
* **Publish Organization Content**: Share organization news, announcements, and blogs.
* **Expose Typed RESTful APIs**: Maintain a clean, type-safe API built with Express, TypeScript, and Prisma ORM.

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                       Browser SPA                           │
│               React 18 + TypeScript + Vite                  │
│                Tailwind CSS + Lucide Icons                  │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               │ HTTP / REST API (Axios)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                      Node.js Backend                        │
│                 Express.js + TypeScript                     │
│                        Prisma ORM                           │
└──────────────┬───────────────┬───────────────┬──────────────┘
               │               │               │
        Prisma │        Resend │         Chapa │ Tesseract.js
           SQL │           API │           API │ OCR Engine
               ▼               ▼               ▼
┌──────────────┴────┐   ┌──────┴────────┐ ┌────┴───────────┐
│ MySQL / TiDB Cloud│   │  Resend Email │ │  Chapa Payment │
│ Relational DB     │   │  (OTP / Mail) │ │  Gateway       │
└───────────────────┘   └───────────────┘ └────────────────┘
```

---

## ✨ Features

### 🔐 Authentication & Security
* **Multi-Role Registration**: Users register as an Organization Admin (creating an organization) or Member (joining an existing organization).
* **Two-Step Email OTP Verification**: Pending registrations are temporarily cached in `PendingUser` until verified via a 6-digit OTP code sent by email.
* **Google OAuth 2.0 Integration**: Single Sign-On via Google authentication services (`@react-oauth/google` and `google-auth-library`).
* **JWT-Based Authorization**: Protected endpoints require a valid Bearer token signed with `jsonwebtoken`.
* **Password Reset Flow**: Hashed expiring tokens delivered via email (`sendResetPasswordEmail`).
* **Security Controls**: Password hashing using `bcryptjs`, role-based Express middleware guards, Multer file type/size restrictions, and organization-scoped Prisma queries.

### 👥 User Roles & Access Control
The application uses strict role names enforced in backend code (`authMiddleware.ts`):

| Role Casing | User Scope | Key Capabilities |
| :--- | :--- | :--- |
| **`SuperAdmin`** | Platform Owner | Manages organizations, organization admins, global subscription plans (`Basic`, `Pro`, `Enterprise`), platform-wide payment approvals, and global system configuration. |
| **`orgAdmin`** | Organization Admin | Manages members in their organization, defines dynamic custom member attributes, creates/edits events and blogs, exports member lists to CSV, and upgrades subscription plans. |
| **`member`** | Regular Member | Views organization events, RSVPs to upcoming events, reads blogs, updates profile details, uploads Fayda ID for simulated verification, and tracks payment history. |

---

## 🏢 Multi-Tenant Architecture

OMMS isolates organization-level data within a relational schema:
* Each organization maintains its own members, events, blogs, payment records, custom attribute definitions, and subscription plans.
* `orgAdmin` users operate strictly within their organization's boundary (`organizationId`).
* Supported organization classifications: **Business**, **Non-Profit**, **Government**, **Other**.

---

## 💳 Payment Management & Receipt OCR

### Payment Workflows
1. **Subscription Plan Upgrades**: Organization admins pay for platform tier upgrades (`Basic`, `Pro`, `Enterprise`).
2. **Event Registration Fees**: Members pay for paid event admissions.
3. **General Member Payments**: Members submit payments or dues directly to their organization.

### Payment Gateway & Manual Workflows
* **Chapa Online Integration**: Direct payment initialization and transaction verification (`chapaService.ts`) for mobile wallets and cards in Ethiopia.
* **Telebirr & CBE Birr Manual Transfers**: Users upload manual bank receipt screenshots.
* **Receipt OCR Processing**: Automated text extraction using **Tesseract.js** (`ocrService.ts`) attempts to read transaction IDs, amounts, and dates from receipt images to assist admin review. *OCR extraction serves as an administrative assistant tool and does not automatically auto-approve payments.*

---

## 📅 Event & 📝 Blog Management

### Event Management
* Create, update, publish, and delete organization events.
* Fields include date/time, location, capacity limits, virtual meeting links, category, and cover images.
* Supports free and paid event registrations with member RSVP tracking.

### Blog & Announcement Management
* Create, edit, publish, and delete blog articles with author attribution, read-time estimates, tags, categories, and cover images.
* Articles feature draft and published status states. *(Note: Schema includes `payment_required` flags, but public reading is currently non-gated in the present controller implementation).*

---

## 🪪 Fayda Identity Verification Workflow

* **Simulated National ID Flow**: Includes a dedicated Fayda ID verification interface and endpoint (`/api/fayda/verify` & `/api/fayda/login`).
* **Implementation Detail**: The current implementation provides a simulated verification workflow suitable for testing national ID login and profile linking without exposing production government API credentials.

---

## 📧 Email Notification System

* **Email Provider**: Transactional emails are powered by the **Resend API** (`resend` package).
* **Workflows Supported**:
  * Registration OTP verification codes.
  * Password reset link emails.
  * System notification messages (`sendNotificationEmail`).

---

## 🧩 Dynamic Custom Member Attributes

Organizations can define custom profile fields on the fly without modifying database models:
* `CustomAttributeDefinition`: Created by `orgAdmin` (e.g., Department, Staff ID, Region). Supported field types include `Text`, `Number`, `Date`, and `Boolean`.
* `MemberAttributeValue`: Stores unique values assigned to each member for those custom fields.

---

## 🛠️ Technology Stack

### Frontend
| Technology | Package Version | Purpose |
| :--- | :--- | :--- |
| **React** | `^18.2.0` | UI component library |
| **TypeScript** | `^5.2.2` | Client-side static typing |
| **Vite** | `^5.1.4` | Development server and build tool |
| **Tailwind CSS** | `^3.4.1` | Utility-first CSS styling |
| **React Router DOM** | `^6.22.2` | SPA route navigation |
| **TanStack React Query**| `^5.25.0` | Server-state caching and synchronization |
| **Axios** | `^1.6.7` | REST API HTTP client |
| **Lucide React** | `^0.344.0` | Dashboard iconography |
| **Google OAuth** | `^0.13.4` | `@react-oauth/google` integration |

### Backend
| Technology | Package Version | Purpose |
| :--- | :--- | :--- |
| **Node.js / Express** | `^4.18.3` | REST API framework |
| **TypeScript** | `^5.9.3` | Server-side static typing |
| **Prisma ORM** | `^5.10.2` | Database ORM and schema management |
| **JSONWebToken** | `^9.0.2` | JWT authentication signing & verification |
| **Bcryptjs** | `^2.4.3` | Password hashing |
| **Resend** | `^6.12.4` | Transactional email delivery API |
| **Multer** | `^2.1.1` | Multipart form-data image uploads |
| **Tesseract.js** | `^7.0.0` | Receipt text extraction via OCR |
| **Google Auth Library** | `^10.6.2` | Backend Google OAuth token verification |

### Database & Deployment
| Tool / Service | Configuration | Purpose |
| :--- | :--- | :--- |
| **MySQL / TiDB Cloud** | `schema.prisma` datasource | Relational database engine |
| **Render** | Node.js web service | Application cloud hosting |
| **npm** | Package scripts | Project dependency management |

---

## 🗄️ Database Architecture

The application uses **MySQL** managed by **Prisma ORM** (`backend/prisma/schema.prisma`).

```
Organization ───< User (Members & Admins) ───< Payment
     │               │                           │
     ├───< Event     ├───< Notification          └───> Plan
     ├───< Blog      └───< MemberAttributeValue ─────> CustomAttributeDefinition
     └───> Plan
```

### Prisma Models
| Model Name | Purpose | Key Relations |
| :--- | :--- | :--- |
| `User` | Stores application user accounts, roles, hashed passwords, profile details, and Fayda status. | Belongs to `Organization` and `Plan`. Has many `Payment`, `Notification`, `MemberAttributeValue`. |
| `PendingUser` | Temporary cache for registrations awaiting 6-digit email OTP verification. | Unlinked standalone entity. |
| `Organization` | Tenant organization profile (name, type, plan reference). | Has many `User`, `Blog`, `Event`, `CustomAttributeDefinition`. Belongs to `Plan`. |
| `Plan` | Platform subscription tiers (price, max members, billing cycle). | Has many `Organization`, `User`, `Payment`. |
| `Payment` | Records online (Chapa) and manual (Telebirr/CBE) payment transactions. | Belongs to `User`, `Plan`. |
| `Event` | Organization events with capacity, pricing, dates, and cover images. | Belongs to `Organization`. Has many attendee `User` records. |
| `Blog` | News articles and announcements. | Belongs to `Organization` and author `User`. |
| `Notification` | User-scoped notification items. | Belongs to `User`. |
| `CustomAttributeDefinition` | Dynamic fields created by organization admins. | Belongs to `Organization`. Has many `MemberAttributeValue`. |
| `MemberAttributeValue` | Stores member-specific values for custom attributes. | Belongs to `User` (member) and `CustomAttributeDefinition`. |
| `SystemConfig` | Global platform configuration settings. | Single-record platform table. |
| `OtpToken` & `PasswordResetToken` | Security token storage. | `OtpToken` belongs to `User`. |

---

## 🔌 REST API Overview

All backend routes are mounted under `/api` in `backend/src/index.ts`:

| Route Prefix | Controller File | Purpose | Main Access Guard |
| :--- | :--- | :--- | :--- |
| `/api/auth` | `authController.ts` | Register, verify OTP, login, Google OAuth, forgot/reset password | Public / Authenticated |
| `/api/fayda` | `faydaController.ts` | Fayda ID image upload and simulated verification | Authenticated |
| `/api/organizations` | `organizationController.ts` | Organization listings and settings updates | Authenticated |
| `/api/admin` | `adminController.ts` | SuperAdmin organization management and platform configuration | SuperAdmin |
| `/api/dashboard` | `dashboardController.ts` | Overview metrics for SuperAdmin, orgAdmin, and member | Authenticated |
| `/api/members` | `memberController.ts` | Member directory CRUD and CSV export | orgAdmin / SuperAdmin |
| `/api/plans` | `planController.ts` | Subscription plan catalog management | Public / SuperAdmin |
| `/api/payments` | `paymentController.ts` | Chapa initialization, manual receipt upload, admin approvals | Authenticated |
| `/api/chapa` | `chapaController.ts` | Chapa transaction verification and webhooks | Public / Server |
| `/api/blogs` | `blogController.ts` | Blog post creation, editing, deletion, and public listing | Public / Authenticated |
| `/api/events` | `eventController.ts` | Event creation, editing, public listing, and member RSVP | Public / Authenticated |
| `/api/notifications` | `notificationController.ts` | Fetching and marking notifications read | Authenticated |
| `/api/custom-attributes`| `customAttributeController.ts` | Creating and assigning custom member fields | orgAdmin |
| `/api/help` | `helpController.ts` | Help center contact request form | Public |

---

## 📁 Repository Structure

```
organization-member-management/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma       # Prisma ORM schema (MySQL provider)
│   │   └── seed.ts             # Database seeder script
│   ├── src/
│   │   ├── config/             # JWT secret configuration
│   │   ├── controllers/        # Request handler controllers
│   │   ├── middleware/         # Auth JWT guard & Multer file upload middleware
│   │   ├── routes/             # Express API route modules
│   │   ├── services/           # Chapa, Email (Resend), and OCR (Tesseract) services
│   │   └── index.ts            # Main Express application entry point
│   ├── uploads/                # Local storage directory for user uploads
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── public/                 # Web assets
│   ├── src/
│   │   ├── components/         # Reusable React components & layout headers
│   │   ├── context/            # AuthContext provider
│   │   ├── hooks/              # Custom hooks
│   │   ├── pages/              # SuperAdmin, orgAdmin, and Member route views
│   │   ├── services/           # Axios backend API client
│   │   ├── App.tsx             # Application router setup
│   │   └── main.tsx            # React application entry point
│   ├── package.json
│   ├── tailwind.config.cjs
│   └── vite.config.ts
├── package.json                # Workspace script runner
└── README.md                   # Project documentation
```

---

## 💻 Installation & Local Setup Guide

### Prerequisites
* **Node.js**: v18.0.0 or higher
* **npm**: v9.0.0 or higher
* **MySQL Database**: Local MySQL Server or cloud MySQL (e.g., TiDB Cloud)
* **Git**

### Step 1: Clone Repository
```bash
git clone https://github.com/nasiramme1511/omms-web-app.git
cd organization-member-management
```

### Step 2: Install Project Dependencies
Run the workspace installation script from the project root:
```bash
npm run install:all
```
*(This installs dependencies in both `backend/` and `frontend/` directories).*

### Step 3: Configure Environment Variables
Create a `.env` file in the `backend/` directory based on `.env.example`:

```bash
cp backend/.env.example backend/.env
```

Configure local environment variable **NAMES** in `backend/.env`:
```env
DATABASE_URL="mysql://your_user:your_password@localhost:3306/omms"
PORT=5000
JWT_SECRET="change_this_to_a_secure_jwt_secret"
GOOGLE_CLIENT_ID="your_google_client_id.apps.googleusercontent.com"
RESEND_API_KEY="re_your_resend_api_key"
FRONTEND_URL="http://localhost:5173"

# Seed User Credentials (Used when running 'npm run prisma:seed')
SEED_SUPERADMIN_EMAIL="admin@example.com"
SEED_SUPERADMIN_PASSWORD="change-this-seed-password"
SEED_DEMO_ORG_ADMIN_EMAIL="demo@example.com"
SEED_DEMO_ORG_ADMIN_PASSWORD="change-this-seed-password"
```

### Step 4: Synchronize Database Schema
Push the Prisma schema to your MySQL instance:
```bash
cd backend
npx prisma generate
npx prisma db push
```

### Step 5: Seed Initial Database Records (Optional)
Populate default subscription plans (`Basic`, `Pro`, `Enterprise`) and demo accounts:
```bash
npm run prisma:seed
```

### Step 6: Run Development Applications

* **Start Backend API Server** (Terminal 1):
  ```bash
  cd backend
  npm run dev
  ```
  *(Runs backend on `http://localhost:5000`)*

* **Start Frontend SPA Server** (Terminal 2):
  ```bash
  cd frontend
  npm run dev
  ```
  *(Runs frontend on `http://localhost:5173`)*

---

## 📜 Available NPM Scripts

| Command | Execution Path | Action |
| :--- | :--- | :--- |
| `npm run install:all` | Root | Installs `npm` dependencies for both backend and frontend |
| `npm run dev` | `backend/` | Starts Express TS backend with `nodemon` live-reloading |
| `npm run dev` | `frontend/` | Launches Vite frontend development server |
| `npm run build` | Root | Installs dependencies, builds Vite frontend dist, and transpiles TS backend |
| `npm start` | Root / `backend/` | Syncs database schema with `prisma db push` and starts backend server |
| `npx prisma generate` | `backend/` | Generates TypeScript Prisma Client types |
| `npx prisma db push` | `backend/` | Synchronizes Prisma schema directly with MySQL database |
| `npm run prisma:seed` | `backend/` | Executes `prisma/seed.ts` to populate default plans and seed users |

---

## 🚀 Deployment Configuration

The application is deployed on **Render** connected to a MySQL-compatible database:
* **Root Build Script**: `npm run build` (Installs dependencies and builds frontend dist & backend distribution).
* **Root Start Script**: `npm start` (Runs `prisma db push --accept-data-loss` and executes `node dist/src/index.js`).
* **Static File Serving**: Express statically serves built frontend files (`frontend/dist`) and user uploads (`backend/uploads`).

---

## 🎓 Academic / Internship Context

OMMS was developed as a full-stack **Software Engineering Project**.

* **Author**: Nasir Amme
* **Institution**: Dire Dawa University
* **Field**: Software Engineering
* **GitHub**: [https://github.com/nasiramme1511](https://github.com/nasiramme1511)
* **Live Demo**: [https://omms-web-app.onrender.com](https://omms-web-app.onrender.com/)

---

## 📄 License & Author Information

* **Author**: Nasir Amme
* **License**: Not specified
* **Repository**: [https://github.com/nasiramme1511/omms-web-app](https://github.com/nasiramme1511/omms-web-app)
