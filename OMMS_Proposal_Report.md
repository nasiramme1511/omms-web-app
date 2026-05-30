# OMMS — Organization Member Management System

## Proposal Report

**Prepared for:** Stakeholders  
**Project URL:** https://omms-web-app.onrender.com  
**Date:** May 29, 2026  
**Version:** 1.0

---

## Executive Summary

OMMS (Organization Member Management System) is a full-stack SaaS platform designed to streamline how organizations manage their members, events, communications, and financial transactions. The system provides role-based access for platform administrators (SuperAdmin), organization administrators (OrgAdmin), and individual members, with support for Ethiopian payment gateways, national ID verification, and automated receipt processing via OCR.

---

## 1. Project Overview

| Attribute | Detail |
|---|---|
| **Project Name** | OMMS — Organization Member Management System |
| **Platform** | Web-based SaaS |
| **Target Market** | Ethiopian organizations, NGOs, businesses, and institutions needing digital member management |
| **Deployment** | Render (Cloud) + TiDB Cloud (Serverless MySQL) |
| **Live URL** | https://omms-web-app.onrender.com |

---

## 2. Problem Statement

Organizations in Ethiopia face significant challenges in managing their membership:

- **No centralized digital platform** for member registration, tracking, and communication
- **Manual payment collection** — cash-based with poor record-keeping
- **No unified event management** — scheduling, registration, and attendance tracking
- **Limited payment options** — no integration with local payment gateways like Chapa, Telebirr, or CBE Birr
- **No national ID verification** — inability to leverage Ethiopia's Fayda digital ID system
- **Fragmented communication** — announcements and blogs scattered across multiple channels

---

## 3. Solution

OMMS provides a complete, multi-tenant platform where:

- **SuperAdmins** manage the entire ecosystem — organizations, subscription plans, platform-wide payments, and system configuration
- **OrgAdmins** manage their organization's members, events, blogs, payments, and plan subscriptions
- **Members** access their dashboard, register for events, read blogs, make payments, and manage their profile
- **Public users** browse the website, view public events and blogs, and register as members

---

## 4. Technology Stack

### Frontend

| Technology | Purpose |
|---|---|
| React 18 + TypeScript | Component-based UI framework |
| Vite 5 | Frontend build tool and dev server |
| Tailwind CSS 3 | Utility-first CSS framework with custom brand theming |
| React Router v6 | Client-side routing with nested layouts and role guards |
| TanStack React Query | Server state management, caching, and data fetching |
| Axios | HTTP client with JWT interceptors |
| Lucide React | Consistent icon library |
| Google OAuth (@react-oauth/google) | Social authentication |

### Backend

| Technology | Purpose |
|---|---|
| Node.js + Express | REST API server |
| TypeScript | Type safety and developer productivity |
| Prisma ORM | Database schema, migrations, and type-safe queries |
| MySQL / TiDB Cloud | Relational database (MySQL-compatible) |
| JWT (jsonwebtoken) | Stateless authentication |
| bcryptjs | Password hashing |
| Multer | File upload handling (images and receipts) |
| Nodemailer | Email delivery (OTP codes, password resets) |
| Tesseract.js | OCR for payment receipt processing |
| google-auth-library | Google ID token verification |

### Third-Party Integrations

| Integration | Status | Description |
|---|---|---|
| **Google OAuth** | ✅ Live | Register and login with Google accounts |
| **Fayda ID (Ethiopia)** | ✅ Mock | National ID verification (ready for real API integration) |
| **Chapa Payment Gateway** | ✅ Live | Ethiopian payment processor for plan and event payments |
| **Telebirr / CBE Birr** | ✅ Manual | Receipt upload with OCR-based transaction verification |
| **SMTP (Gmail)** | ✅ Configured | Transactional emails (OTP, password reset) |

---

## 5. Core Features

### 5.1 Authentication & Security

- Email/password registration with 6-digit OTP email verification
- Google OAuth sign-in and registration
- Fayda National ID (Ethiopia) verification and auto-account creation
- Password reset flow with email token
- JWT-based stateless authentication with 1-day token expiry
- bcrypt password hashing (10 salt rounds)
- Role-based route protection (SuperAdmin, OrgAdmin, Member)

### 5.2 Role-Based Dashboards

#### SuperAdmin Dashboard
- Platform-wide analytics: total organizations, members, revenue, system health metrics
- Organization CRUD with admin account creation
- Org admin listing with CSV export and search
- Global member directory
- Subscription plan management (Basic, Pro, Enterprise)
- Payment management: confirm, reject, and revoke payments
- System configuration: platform name, contact info, payment phone numbers, social links, live chat toggle
- Profile management

#### OrgAdmin Dashboard
- Organization stats: member count, events, blogs, revenue
- Full member CRUD with plan limit enforcement
- CSV import/export for member data
- Custom attribute definitions per organization (text, number, date, boolean fields)
- Event management: create, edit, publish with capacity tracking and payment toggle
- Blog management: draft/publish/archive with categories, tags, and read time
- Payment management: subscription upgrade with Chapa/Telebirr/CBE Birr, receipt OCR
- Organization settings: name, timezone, payment phone, notifications
- Plan comparison and upgrade

#### Member Dashboard
- Welcome overview with membership status, upcoming events, recent blogs, payment history
- Event registration (free and paid)
- Blog reading
- Payment history and new payments
- Profile editing with photo upload

### 5.3 Organization Management

- Multi-tenant architecture — each organization is isolated
- Organizations have types: Business, Non-Profit, Government, Other
- Plan-based member limits (Basic: 10, Pro: 50, Enterprise: 500)
- Custom attribute system for collecting member-specific data

### 5.4 Event Management

- Full CRUD with image upload
- Status workflow: draft → published
- Categories, capacity limits, location, virtual meeting links
- Payment integration — events can require payment
- Attendee registration and tracking

### 5.5 Blog/Announcement System

- Full CRUD with image upload
- Status workflow: draft → published → archived
- 12+ content categories
- Tags, read time estimation
- Author attribution and authorization

### 5.6 Payment System

Three distinct payment flows:

| Flow | Description |
|---|---|
| **Plan Subscription** | OrgAdmin pays SuperAdmin for plan access |
| **Event Registration** | Member pays OrgAdmin for event access |
| **Member-to-Org** | Member makes general payments to their organization |

**Payment Methods:**
- **Chapa** — Ethiopian payment gateway (online)
- **Telebirr** — Manual receipt upload with OCR
- **CBE Birr** — Manual receipt upload with OCR
- **Manual** — Direct transaction ID entry

**OCR Service** extracts transaction ID, amount, and date from receipt screenshots automatically.

### 5.7 Notification System

- Role-scoped notifications (SuperAdmin, OrgAdmin)
- Automatic notifications on payment actions
- Read/unread tracking with badge counts
- Bulk mark-all-read functionality

### 5.8 System Configuration (SuperAdmin)

- Platform branding (name, support email)
- Maintenance mode toggle
- Payment phone numbers (Telebirr, CBE Birr)
- Contact information
- Live chat widget toggle and URL
- Social media links (Facebook, Telegram, LinkedIn)

### 5.9 Public Pages

- Landing page with hero, features, testimonials, stats counter, FAQ
- About, Services, Contact pages
- Public event listing with search and filter
- Public blog listing with search and pagination

---

## 6. Database Architecture

10 core models power the platform:

| Model | Purpose |
|---|---|
| **User** | All users across all roles (SuperAdmin, OrgAdmin, Member) |
| **PendingUser** | Temporary storage during OTP registration flow |
| **Organization** | Tenant/Organization entity |
| **Plan** | Subscription plans with pricing, member limits, duration |
| **Payment** | Full payment lifecycle with status tracking |
| **Event** | Events with capacity, pricing, attendance |
| **Blog** | Content management with categories and statuses |
| **Notification** | User notifications with read tracking |
| **PasswordResetToken** | Secure password reset tokens |
| **CustomAttributeDefinition** | Dynamic form fields per organization |
| **MemberAttributeValue** | Values for custom attributes per member |
| **SystemConfig** | Platform-wide configuration singleton |
| **OtpToken** | OTP storage (legacy — OTPs currently stored on PendingUser) |

---

## 7. API Architecture

### RESTful API with 14 route modules:

| Module | Endpoints | Description |
|---|---|---|
| `/api/auth` | 10 | Register, login, OTP, Google OAuth, profile, password reset |
| `/api/fayda` | 2 | Fayda ID verification and login |
| `/api/organizations` | 3 | Public org listing and org settings |
| `/api/admin` | 6 | SuperAdmin: org CRUD + system config |
| `/api/dashboard` | 1 | Role-based dashboard stats |
| `/api/members` | 4 | Member CRUD with plan enforcement |
| `/api/plans` | 4 | Plan CRUD |
| `/api/payments` | 17 | Full payment lifecycle |
| `/api/chapa` | 4 | Chapa gateway integration |
| `/api/blogs` | 4 | Blog CRUD with authorization |
| `/api/events` | 5 | Event CRUD + registration |
| `/api/notifications` | 3 | Notification list + mark read |
| `/api/custom-attributes` | 6 | Custom attribute definitions + values |
| `/api/help` | 1 | Help resources |

---

## 8. Security Architecture

| Layer | Implementation |
|---|---|
| **Authentication** | JWT with 1-day expiry, bcrypt password hashing |
| **Authorization** | Role-based middleware + frontend route guards |
| **Email Verification** | 6-digit OTP, 10-minute expiry, hashed in database |
| **Password Reset** | Token-based with 1-hour expiry |
| **File Upload** | Type whitelist (jpeg, jpg, png, webp), 5MB limit |
| **Payment Verification** | OCR-based receipt validation + admin confirmation |
| **Webhook Security** | HMAC SHA256 signature verification (Chapa) |
| **Plan Limits** | Enforced at member creation |
| **Data Isolation** | Organization-scoped queries for OrgAdmin role |

---

## 9. Deployment Architecture

```
                    ┌─────────────┐
                    │   Browser    │
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │    Render   │
                    │  (Node.js)  │
                    │             │
                    │  Express API│
                    │  + SPA Serve│
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │  TiDB Cloud │
                    │  (MySQL)    │
                    └─────────────┘
```

- **Hosting:** Render (Free Tier) — auto-deploys from GitHub `main` branch
- **Database:** TiDB Cloud (Serverless, AWS us-west-2)
- **Email:** Gmail SMTP via Nodemailer
- **File Storage:** Local filesystem (`uploads/` directory)

---

## 10. Development Roadmap & Future Enhancements

### Completed (MVP)
- ✅ Authentication (email, Google OAuth, Fayda ID mock)
- ✅ Role-based dashboards (SuperAdmin, OrgAdmin, Member)
- ✅ Organization management
- ✅ Member management with custom attributes
- ✅ Event management with registration
- ✅ Blog/announcement system
- ✅ Payment system (Chapa, Telebirr, CBE Birr with OCR)
- ✅ Subscription plans
- ✅ Notifications
- ✅ System configuration
- ✅ Public pages

### Recommended Phase 2

| Feature | Priority | Description |
|---|---|---|
| Real Fayda API integration | High | Connect to Ethiopian government National ID API |
| Mobile app (React Native) | High | Native mobile experience for members |
| Advanced analytics & reporting | Medium | Dashboard charts, exportable reports, member growth trends |
| Email/SMS marketing | Medium | Bulk communication to members |
| Multi-language support | Medium | Amharic, Afan Oromo, Somali, Tigrinya |
| Two-factor authentication | Medium | App-based 2FA for admins |
| Audit logging | Medium | Track all admin actions for compliance |
| Public API for third-party apps | Low | REST API for external integrations |
| WhatsApp integration | Low | Automated notifications via WhatsApp Business API |

---

## 11. Cost Analysis

| Service | Plan | Estimated Monthly Cost |
|---|---|---|
| Render (Web Service) | Free | $0 |
| TiDB Cloud | Serverless (Free Tier) | $0 (200K RUs/month) |
| SMTP (Gmail) | Free | $0 |
| Chapa Payment Gateway | Per-transaction fee | Variable |
| Domain | Custom domain | ~$10-15/year |

**Total Base Cost:** ~$0/month (within free tier limits)

---

## 12. Conclusion

OMMS is a production-ready, full-featured organization membership management platform tailored for the Ethiopian market. It addresses the core challenges of digital member management with local payment integrations (Chapa, Telebirr, CBE Birr), national ID support (Fayda), and a comprehensive feature set covering events, content management, and financial transactions. The modular architecture and clean separation of concerns make it extensible for future growth.

---

*This proposal was prepared based on the live application at https://omms-web-app.onrender.com and the complete source code analysis dated May 29, 2026.*
