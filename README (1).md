# NEU Library Log

> **Automated Visitor Management System**
> New Era University Library — Quezon City, Philippines

---

## Overview

NEU Library Log is a full-stack web application that digitizes and automates visitor management at the New Era University Library. It replaces manual paper logbooks with a real-time, cloud-connected system built on React and Firebase. The platform has two distinct interfaces: a **public kiosk** used by students to record their visits, and a **private admin dashboard** used exclusively by authorized library administrators.

---

## Table of Contents

- [Features](#features)
  - [Kiosk — Student-Facing](#kiosk--student-facing)
  - [Admin Dashboard](#admin-dashboard)
- [Access Control](#access-control)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Deployment](#deployment)
- [Firebase Project](#firebase-project)

---

## Features

### Kiosk — Student-Facing

The kiosk is the only interface students interact with. It is publicly accessible and requires no login.

#### ID Tap — Check-In / Check-Out
Students enter their student ID number (format `XX-XXXXX-XXX`) at the kiosk. The system auto-formats digits as they type. On submission it queries Firestore and:
- If no active visit exists → creates a **check-in** record
- If an active visit exists → closes it as a **check-out**

Both actions are handled by a single button tap.

#### Purpose of Visit Selection
After tapping their ID for a check-in, a purpose selection popup appears before the confirmation. Available options:
- Research, Computer Use, Reading / Study, Borrow Books, Return Books, Group Study, Printing / Scanning, Faculty Work, Other (free-text)

The purpose is saved to the visit record and surfaced in the Analytics dashboard for admins. Students do not see any of this data.

#### First-Time Student Registration
When a student ID is not found in the database, the kiosk redirects to a registration form. The student provides their full name, optional email, status (Student / Teacher / Staff), college, and program. On submission they are automatically checked in and returned to the kiosk.

#### Google Sign-Up
Students may register using their `@neu.edu.ph` Google account instead of manually entering details. New users are prompted to link their student ID and select college and program. Returning users are recognized by email and returned to the kiosk directly.

#### Blocked Student Notice
If an administrator has restricted access for a student, tapping their ID shows a formal "Access Restricted" modal with instructions to visit the library counter.

---

### Admin Dashboard

The admin dashboard is accessible only to authorized administrator accounts. It is organized into ten tabs.

#### Dashboard
- Statistics cards: today's check-ins, active sessions, completed visits, total records, average duration
- 7-day bar chart of visit frequency
- Live active sessions table — updated in real time via Firestore `onSnapshot`

#### Visit Log
- Filterable log of all visit records (by date range and student ID)
- Columns: Student ID, Check-In, Check-Out, Duration, Status
- Records are immutable — deletion is blocked at the Firestore security rules level

#### Students
- Paginated registry (20 students per page, cursor-based Firestore queries)
- Search by name, student ID, email, or college
- Filter by access status: All / Allowed Only / Blocked Only
- Block or restore individual students with an optional reason, stored with the blocking admin's email and timestamp
- Optimistic UI — rows update instantly before the Firestore write completes

#### Access Control
- Quick block/unblock by manually entering a student ID
- View all currently blocked students with their block reasons
- Unblock with a single button from the blocked list

#### Analytics
- Purpose distribution bar chart filterable by Today / Last 7 Days / This Month
- Hourly traffic heatmap — visit counts per hour, color-coded by intensity
- Live today purpose breakdown drawn from the real-time visit stream
- Peak hour detection

#### Reports
- Date range selector (From / To) to fetch visit records from Firestore
- Print preview modal with NEU Library header, address, and formatted table
- Export CSV — includes student name, college, purpose, and full timestamps
- Export PDF — formatted report using jsPDF and jsPDF-AutoTable with library branding and generation timestamp
- Quick one-click CSV exports for today, all-time, and currently active sessions

#### Announcements
- Compose messages with target (All Monitors or a specific monitor), priority (Low / Normal / High / Urgent), and expiry time
- Active announcements list with time-remaining countdown and one-click removal
- **Nav badge** — a red number badge appears on the Announcements tab when new announcements arrive
- **Banner strip** — the highest-priority active announcement is displayed as a colored banner below the nav on all other tabs, with a View All link and dismiss button
- Announcements poll every 30 seconds and re-surface the banner when new ones arrive

#### Rewards *(Admin-only — students are unaware)*
- Points awarded automatically on every check-in (+10) and check-out (+5), with bonuses by purpose (Research +15, Study +12, others +5 to +10)
- Four levels: Bronze (0 pts), Silver (500), Gold (1,000), Platinum (2,500)
- Auto-earned badges: Early Bird, First Steps (10 visits), Regular (50 visits), Centurion (100 visits)
- Admin leaderboard with level badges, progress bars, visit counts, streak days, and earned badge chips
- Search and filter by name or level
- Info button (`i`) opens a modal explaining the full rewards system and confirming students are not informed

#### Issues
- Report library equipment, software, facility, or security issues
- Fields: title, description, category, priority
- Status workflow: Open → In Progress → Resolved → Closed
- Per-issue comment thread for admin collaboration
- Filter by status and category
- Inline status updates from the table or from the detail modal

#### Settings
- Auto check-out toggle and time picker — automatically closes all active sessions at a configurable time (default 23:59)
- Run Now button to trigger auto check-out immediately
- Settings persisted to the `settings` Firestore collection
- Campus configuration reference

#### Multi-Campus Support
- Campus context stored in `localStorage` and injected via `CampusContext`
- Campus selector dropdown in the admin topbar (shown when more than one campus is configured)
- All queries filterable by `campusId` for full data isolation between campuses

#### Theme Toggle
- Light and dark mode with a sun/moon icon button in the topbar
- Theme preference persisted to `localStorage` and restored on next session

---

## Access Control

| Role | Interface | Login Required |
|---|---|---|
| Student / Visitor | Kiosk only | No |
| Administrator | Admin Dashboard only | Yes — Google OAuth (`@neu.edu.ph`) |

Students have no login access to the admin dashboard. All features except the kiosk and purpose popup are exclusively for administrators.

### Admin Accounts

Only these two email addresses have administrator privileges:

- `jcesperanza@neu.edu.ph`
- `daveandrew.claveria@neu.edu.ph`

All other `@neu.edu.ph` accounts will receive an Access Denied screen.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend Framework | React 18 |
| Build Tool | Vite 5 |
| Database | Cloud Firestore |
| Authentication | Firebase Auth — Google OAuth |
| Hosting | Firebase Hosting |
| Real-Time Updates | Firestore `onSnapshot` |
| PDF Export | jsPDF + jsPDF-AutoTable |
| CSV Export | Client-side Blob API |
| Styling | Vanilla CSS + CSS custom properties |
| Fonts | DM Serif Display, DM Sans, DM Mono |

---

## Project Structure

```
neu-library-log/
├── firebase.json              # Hosting config + SPA rewrites
├── firestore.rules            # Firestore security rules
├── vite.config.js
├── package.json
└── src/
    ├── App.jsx                # Root view router
    ├── main.jsx
    ├── assets/
    │   └── library-building.jpg
    ├── firebase/
    │   ├── config.js          # Firebase app initialization
    │   ├── auth.js            # signInWithGoogle, logOut, onAuthChange
    │   └── firestore.js       # All Firestore operations (30+ functions)
    ├── context/
    │   ├── ThemeContext.jsx   # Light/dark theme provider
    │   └── CampusContext.jsx  # Multi-campus state provider
    ├── data/
    │   └── constants.js       # ADMIN_EMAILS, COLLEGES, PROGRAMS, PURPOSES
    ├── components/
    │   ├── common/
    │   │   ├── NEULogo.jsx
    │   │   ├── LiveClock.jsx
    │   │   ├── Confetti.jsx
    │   │   └── ThemeToggle.jsx
    │   ├── kiosk/
    │   │   ├── KioskPage.jsx           # Landing page, ID tap, purpose flow
    │   │   ├── PurposePopup.jsx        # Purpose selection popup
    │   │   ├── RegistrationPage.jsx    # First-time registration form
    │   │   ├── CheckInPopup.jsx        # 3-second confirmation modal
    │   │   └── BlockedPopup.jsx        # Access restricted modal
    │   ├── auth/
    │   │   ├── AuthPage.jsx            # Admin Google sign-in screen
    │   │   ├── GoogleSignUp.jsx        # Student Google sign-up screen
    │   │   ├── CompleteProfile.jsx     # New-user profile linking form
    │   │   ├── WelcomePopup.jsx        # Admin welcome with image and address
    │   │   └── AccessDenied.jsx        # Non-admin rejection screen
    │   └── admin/
    │       ├── AdminDashboard.jsx      # Topbar, nav, tabs, announcement badge
    │       ├── campus/
    │       │   └── CampusSelector.jsx
    │       ├── tabs/
    │       │   ├── DashboardTab.jsx
    │       │   ├── VisitsTab.jsx
    │       │   ├── StudentsTab.jsx
    │       │   └── AccessControlTab.jsx
    │       ├── analytics/
    │       │   └── AnalyticsTab.jsx
    │       ├── reports/
    │       │   └── ReportsTab.jsx
    │       ├── announcements/
    │       │   └── AnnouncementsTab.jsx
    │       ├── rewards/
    │       │   └── RewardsTab.jsx
    │       ├── issues/
    │       │   └── IssuesTab.jsx
    │       └── settings/
    │           └── SettingsTab.jsx
    ├── styles/
    │   ├── globals.css        # CSS variables, reset, keyframes
    │   ├── kiosk.css          # Kiosk landing and purpose popup
    │   ├── admin.css          # Dashboard layout, tables, nav
    │   ├── auth.css           # Auth screens and welcome popup
    │   └── forms.css          # Registration and profile forms
    └── utils/
        └── formatters.js      # ID formatting, date/time helpers, duration
```

---

## Getting Started

### Prerequisites

- Node.js 18 or later
- npm 9 or later
- Firebase CLI — `npm install -g firebase-tools`

### Install and run locally

```bash
cd neu-library-log
npm install
npm run dev
```

The app will be available at `http://localhost:5173`.

---

## Deployment

### First-time setup

```bash
firebase login
firebase use neu-library-log-bd990
```

Enable Google Sign-In in the Firebase Console under Authentication → Sign-in method → Google, and add your deployment domain to the Authorized Domains list.

### Deploy Firestore security rules

```bash
firebase deploy --only firestore:rules
```

### Build and deploy

```bash
npm run deploy
```

This runs `npm run build` followed by `firebase deploy --only hosting`.

### Fixing 404 errors on live server

Two settings work together to prevent 404 errors after deployment:

| File | Setting | Purpose |
|---|---|---|
| `vite.config.js` | `base: './'` | Generates relative asset paths that work on Firebase CDN |
| `firebase.json` | `rewrites: [{ source: "**", destination: "/index.html" }]` | Serves `index.html` for all routes so React handles navigation |

---

## Firebase Project

**Project ID:** `neu-library-log-bd990`
**Hosting URL:** `https://neu-library-log-bd990.web.app`

### Firestore Collections

| Collection | Description |
|---|---|
| `students` | Registered student profiles — ID, name, college, program, block status |
| `visits` | All check-in/check-out records with purpose and timestamps |
| `settings` | System configuration — auto check-out time and enabled toggle |
| `announcements` | Active admin announcements with priority, expiry, and target monitor |
| `monitors` | Library monitor terminals registered to receive announcements |
| `rewards` | Student points, level, badges, visit count, and streak data |
| `issues` | Library issue reports with status, priority, category, and comments |
| `campuses` | Campus registry for multi-campus data isolation |

### Security Rules Summary

- **`students`** — Anyone can create (kiosk registration). Admins can only update `isBlocked`, `blockedBy`, `blockedAt`, and `blockedReason`. Deletion is permanently disabled.
- **`visits`** — Anyone can create (kiosk check-in). Only admins can update (check-out). Deletion is permanently disabled for audit integrity.
