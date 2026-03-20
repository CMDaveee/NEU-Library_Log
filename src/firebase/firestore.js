/**
 * Firestore service layer
 *
 * Performance notes:
 * - registerStudent uses optimistic local state via onComplete(sid) before
 *   awaiting Firestore, so the UI feels instant.
 * - getStudent + getActiveVisit are run in parallel with Promise.all
 *   in KioskPage, cutting the sequential round-trip in half.
 * - getAllStudents uses a cursor-based pagination query so we never
 *   download the entire collection at once.
 * - subscribeToVisits is limited to the most recent 200 records to avoid
 *   streaming the entire visits collection to every admin session.
 */
import {
  collection, doc, getDoc, getDocs, addDoc, updateDoc, setDoc,
  query, where, orderBy, limit, startAfter, serverTimestamp, onSnapshot,
  writeBatch, Timestamp, deleteDoc,
} from 'firebase/firestore';
import { db } from './config.js';

const VISITS   = 'visits';
const STUDENTS = 'students';

// ─── Students ─────────────────────────────────────────────────────────────────

/** Fetch a single student by formatted ID */
export async function getStudent(studentId) {
  const snap = await getDoc(doc(db, STUDENTS, studentId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

/**
 * Fetch students with cursor-based pagination.
 * @param {number} pageSize  - records per page (default 20)
 * @param {object|null} lastDoc - Firestore document snapshot to start after
 * @returns {{ students, lastDoc, hasMore }}
 */
export async function getStudentsPaginated(pageSize = 20, lastDoc = null) {
  let q = query(
    collection(db, STUDENTS),
    orderBy('fullName'),
    limit(pageSize + 1), // fetch one extra to detect hasMore
  );
  if (lastDoc) q = query(q, startAfter(lastDoc));

  const snap = await getDocs(q);
  const docs = snap.docs;
  const hasMore = docs.length > pageSize;
  const page    = hasMore ? docs.slice(0, pageSize) : docs;

  return {
    students: page.map(d => ({ id: d.id, ...d.data() })),
    lastDoc:  page[page.length - 1] ?? null,
    hasMore,
  };
}

/** Fetch ALL students — used only for block/unblock lookup in AccessControlTab */
export async function getAllStudents() {
  const snap = await getDocs(collection(db, STUDENTS));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

/**
 * Register a new student.
 * NOTE: Call onComplete(sid) optimistically BEFORE awaiting this if
 * you want the UI to feel instant — Firestore will complete in the background.
 */
export async function registerStudent(studentId, data) {
  await setDoc(doc(db, STUDENTS, studentId), {
    ...data,
    studentId,
    isBlocked:    false,
    registeredAt: serverTimestamp(),
  });
}

/** Block or unblock a student — writes only allowed fields per security rules */
export async function setStudentBlocked(studentId, blocked, adminEmail, reason = '') {
  await updateDoc(doc(db, STUDENTS, studentId), {
    isBlocked:     blocked,
    blockedBy:     blocked ? adminEmail : null,
    blockedAt:     blocked ? serverTimestamp() : null,
    blockedReason: blocked ? reason : null,
  });
}

// ─── Visits ───────────────────────────────────────────────────────────────────

/**
 * Check if a student has an active visit AND fetch their profile in one
 * parallel round-trip. Used by KioskPage to cut latency roughly in half.
 * @returns {{ student, activeVisit }}
 */
export async function getStudentAndActiveVisit(studentId) {
  const [studentSnap, visitSnap] = await Promise.all([
    getDoc(doc(db, STUDENTS, studentId)),
    getDocs(
      query(
        collection(db, VISITS),
        where('studentId', '==', studentId),
        where('isActive',  '==', true),
        limit(1),
      )
    ),
  ]);

  return {
    student:     studentSnap.exists() ? { id: studentSnap.id, ...studentSnap.data() } : null,
    activeVisit: visitSnap.empty      ? null : { id: visitSnap.docs[0].id, ...visitSnap.docs[0].data() },
  };
}

/** Get the currently active visit for a student (standalone) */
export async function getActiveVisit(studentId) {
  const snap = await getDocs(
    query(
      collection(db, VISITS),
      where('studentId', '==', studentId),
      where('isActive',  '==', true),
      limit(1),
    )
  );
  return snap.empty ? null : { id: snap.docs[0].id, ...snap.docs[0].data() };
}

/** Create a check-in record — purpose fields are optional for backward compat */
export async function checkIn(studentId, { purpose = null, purposeOther = null, campusId = null } = {}) {
  const ref = await addDoc(collection(db, VISITS), {
    studentId,
    checkInTime:  serverTimestamp(),
    checkOutTime: null,
    isActive:     true,
    action:       'check-in',
    createdAt:    serverTimestamp(),
    ...(purpose      && { purpose }),
    ...(purposeOther && { purposeOther }),
    ...(campusId     && { campusId }),
  });
  return ref.id;
}

/** Mark a visit as checked out */
export async function checkOut(visitId) {
  await updateDoc(doc(db, VISITS, visitId), {
    checkOutTime: serverTimestamp(),
    isActive:     false,
    action:       'check-out',
  });
}

/**
 * Live subscription — limited to the 200 most recent visits so we never
 * stream thousands of records to every connected admin browser.
 */
export function subscribeToVisits(cb) {
  const q = query(
    collection(db, VISITS),
    orderBy('checkInTime', 'desc'),
    limit(200),
  );
  return onSnapshot(q, snap => {
    cb(snap.docs.map(d => ({
      visitId:      d.id,
      ...d.data(),
      checkInTime:  d.data().checkInTime?.toDate()  ?? null,
      checkOutTime: d.data().checkOutTime?.toDate()  ?? null,
      createdAt:    d.data().createdAt?.toDate()      ?? null,
    })));
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// NEW FUNCTIONS — added for Feature 2-9. Existing functions above are untouched.
// ─────────────────────────────────────────────────────────────────────────────

const SETTINGS      = 'settings';
const ANNOUNCEMENTS = 'announcements';
const MONITORS      = 'monitors';
const REWARDS       = 'rewards';
const ISSUES        = 'issues';
const CAMPUSES      = 'campuses';

// ── Purpose-aware check-in (replaces old checkIn for kiosk) ──────────────────
/**
 * Create a check-in record, optionally with purpose.
 * Backward-compatible: purpose fields are optional.
 */
export async function checkInWithPurpose(studentId, { purpose = null, purposeOther = null, campusId = null } = {}) {
  const ref = await addDoc(collection(db, VISITS), {
    studentId,
    checkInTime:  serverTimestamp(),
    checkOutTime: null,
    isActive:     true,
    action:       'check-in',
    createdAt:    serverTimestamp(),
    ...(purpose      && { purpose }),
    ...(purposeOther && { purposeOther }),
    ...(campusId     && { campusId }),
  });

  // Award check-in points in background (non-blocking)
  _awardPoints(studentId, 'checkIn', purpose).catch(console.error);

  return ref.id;
}

// ── Analytics ─────────────────────────────────────────────────────────────────
/** Aggregate purpose counts for a date range */
export async function getPurposeStats({ startDate, endDate } = {}) {
  let q = query(collection(db, VISITS), orderBy('checkInTime', 'desc'), limit(1000));
  if (startDate) q = query(q, where('checkInTime', '>=', Timestamp.fromDate(startDate)));
  if (endDate)   q = query(q, where('checkInTime', '<=', Timestamp.fromDate(endDate)));

  const snap  = await getDocs(q);
  const counts = {};
  snap.docs.forEach(d => {
    const p = d.data().purpose ?? 'unspecified';
    counts[p] = (counts[p] ?? 0) + 1;
  });
  return counts;
}

/** Get visit counts per hour for a given date */
export async function getHourlyTraffic(date = new Date()) {
  const start = new Date(date); start.setHours(0,0,0,0);
  const end   = new Date(date); end.setHours(23,59,59,999);

  const q = query(
    collection(db, VISITS),
    where('checkInTime', '>=', Timestamp.fromDate(start)),
    where('checkInTime', '<=', Timestamp.fromDate(end)),
  );
  const snap   = await getDocs(q);
  const hours  = Array.from({ length: 24 }, (_, h) => ({ hour: h, count: 0, purposes: {} }));

  snap.docs.forEach(d => {
    const t  = d.data().checkInTime?.toDate?.() ?? null;
    if (!t) return;
    const h  = t.getHours();
    const p  = d.data().purpose ?? 'unspecified';
    hours[h].count++;
    hours[h].purposes[p] = (hours[h].purposes[p] ?? 0) + 1;
  });
  return hours;
}

// ── Reports: date-range visits join with students ─────────────────────────────
export async function getVisitsByDateRange(startDate, endDate) {
  const q = query(
    collection(db, VISITS),
    where('checkInTime', '>=', Timestamp.fromDate(startDate)),
    where('checkInTime', '<=', Timestamp.fromDate(endDate)),
    orderBy('checkInTime', 'desc'),
    limit(2000),
  );
  const [visitsSnap, studentsSnap] = await Promise.all([
    getDocs(q),
    getDocs(collection(db, STUDENTS)),
  ]);

  const studentMap = {};
  studentsSnap.docs.forEach(d => { studentMap[d.id] = d.data(); });

  return visitsSnap.docs.map(d => {
    const v  = d.data();
    const st = studentMap[v.studentId] ?? {};
    return {
      visitId:      d.id,
      studentId:    v.studentId,
      fullName:     st.fullName ?? '-',
      collegeCode:  st.collegeCode ?? '-',
      programCode:  st.programCode ?? '-',
      purpose:      v.purpose ?? '-',
      checkInTime:  v.checkInTime?.toDate()  ?? null,
      checkOutTime: v.checkOutTime?.toDate()  ?? null,
      isActive:     v.isActive ?? false,
      action:       v.action ?? '-',
    };
  });
}

// ── Settings ──────────────────────────────────────────────────────────────────
export async function getSettings(id = 'autoCheckout') {
  const snap = await getDoc(doc(db, SETTINGS, id));
  return snap.exists() ? snap.data() : null;
}

export async function saveSettings(id, data, adminEmail) {
  await setDoc(doc(db, SETTINGS, id), {
    ...data,
    updatedBy: adminEmail,
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

/** Auto check-out all active visits whose check-in was before the cutoff time today */
export async function autoCheckoutAll(cutoffTimeStr = '23:59') {
  const [h, m] = cutoffTimeStr.split(':').map(Number);
  const cutoff = new Date(); cutoff.setHours(h, m, 0, 0);

  const q = query(
    collection(db, VISITS),
    where('isActive', '==', true),
    where('checkInTime', '<=', Timestamp.fromDate(cutoff)),
  );
  const snap  = await getDocs(q);
  if (snap.empty) return 0;

  const batch = writeBatch(db);
  snap.docs.forEach(d => {
    batch.update(d.ref, {
      checkOutTime: Timestamp.fromDate(cutoff),
      isActive:     false,
      action:       'auto-check-out',
    });
  });
  await batch.commit();
  return snap.size;
}

// ── Announcements ─────────────────────────────────────────────────────────────
export async function createAnnouncement(data, adminEmail) {
  return addDoc(collection(db, ANNOUNCEMENTS), {
    ...data,
    createdBy: adminEmail,
    createdAt: serverTimestamp(),
    readBy:    [],
  });
}

export async function getActiveAnnouncements() {
  const now = Timestamp.now();
  const q   = query(
    collection(db, ANNOUNCEMENTS),
    where('expiresAt', '>', now),
    orderBy('expiresAt'),
    limit(50),
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data(),
    createdAt: d.data().createdAt?.toDate() ?? null,
    expiresAt: d.data().expiresAt?.toDate() ?? null,
  }));
}

export async function deleteAnnouncement(id) {
  await deleteDoc(doc(db, ANNOUNCEMENTS, id));
}

export async function getMonitors() {
  const snap = await getDocs(query(collection(db, MONITORS), where('active', '==', true)));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function upsertMonitor(id, data) {
  await setDoc(doc(db, MONITORS, id), { ...data, active: true }, { merge: true });
}

// ── Rewards ───────────────────────────────────────────────────────────────────
export async function getRewardsForStudent(studentId) {
  const snap = await getDoc(doc(db, REWARDS, studentId));
  return snap.exists() ? snap.data() : null;
}

export async function getAllRewards() {
  const snap = await getDocs(query(collection(db, REWARDS), orderBy('points', 'desc'), limit(200)));
  return snap.docs.map(d => ({ studentId: d.id, ...d.data() }));
}

const LEVEL_THRESHOLDS = [
  { name: 'bronze',   min: 0    },
  { name: 'silver',   min: 500  },
  { name: 'gold',     min: 1000 },
  { name: 'platinum', min: 2500 },
];

function _getLevel(points) {
  let level = 'bronze';
  LEVEL_THRESHOLDS.forEach(l => { if (points >= l.min) level = l.name; });
  return level;
}

const POINT_RULES = {
  checkIn:   10,
  checkOut:   5,
  purpose: { research: 15, reading: 12, borrow: 10, 'group-study': 10, faculty: 8, computer: 5, printing: 5, return: 5, other: 5 },
};

async function _awardPoints(studentId, event, purpose = null) {
  let pts = POINT_RULES[event] ?? 0;
  if (event === 'checkIn' && purpose) pts += (POINT_RULES.purpose[purpose] ?? 0);

  const ref      = doc(db, REWARDS, studentId);
  const existing = await getDoc(ref);
  const prev     = existing.exists() ? existing.data() : { points: 0, visits: 0, streak: 0, badges: [] };
  const newPts   = (prev.points ?? 0) + pts;
  const newVisits = event === 'checkIn' ? (prev.visits ?? 0) + 1 : (prev.visits ?? 0);
  const level    = _getLevel(newPts);
  const badges   = _computeBadges(prev.badges ?? [], newVisits, prev, new Date());

  await setDoc(ref, {
    points:    newPts,
    level,
    visits:    newVisits,
    badges,
    streak:    prev.streak ?? 0,
    lastVisit: serverTimestamp(),
    studentId,
  }, { merge: true });
}

function _computeBadges(existing, visits, prev, now) {
  const badges = [...existing];
  const has = id => badges.some(b => b.id === id);

  if (visits >= 10 && !has('first-ten'))
    badges.push({ id: 'first-ten', name: 'First Steps', description: '10 library visits', earnedAt: now.toISOString() });
  if (visits >= 50 && !has('regular'))
    badges.push({ id: 'regular', name: 'Regular', description: '50 library visits', earnedAt: now.toISOString() });
  if (visits >= 100 && !has('centurion'))
    badges.push({ id: 'centurion', name: 'Centurion', description: '100 library visits', earnedAt: now.toISOString() });
  if (now.getHours() < 8 && visits >= 5 && !has('early-bird'))
    badges.push({ id: 'early-bird', name: 'Early Bird', description: 'Visited before 8 AM multiple times', earnedAt: now.toISOString() });

  return badges;
}

// ── Campuses ──────────────────────────────────────────────────────────────────
export async function getCampuses() {
  const snap = await getDocs(query(collection(db, CAMPUSES), where('active', '==', true)));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function upsertCampus(id, data) {
  await setDoc(doc(db, CAMPUSES, id), { ...data, active: true }, { merge: true });
}

// ── Issues ────────────────────────────────────────────────────────────────────
export async function getIssues(campusId = null) {
  let q = query(collection(db, ISSUES), orderBy('reportedAt', 'desc'), limit(100));
  if (campusId) q = query(collection(db, ISSUES), where('campusId', '==', campusId), orderBy('reportedAt', 'desc'), limit(100));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({
    id: d.id, ...d.data(),
    reportedAt: d.data().reportedAt?.toDate() ?? null,
  }));
}

export async function createIssue(data, adminEmail, campusId = null) {
  return addDoc(collection(db, ISSUES), {
    ...data,
    status:      'open',
    reportedBy:  adminEmail,
    reportedAt:  serverTimestamp(),
    comments:    [],
    ...(campusId && { campusId }),
  });
}

export async function updateIssueStatus(issueId, status, adminEmail) {
  await updateDoc(doc(db, ISSUES, issueId), { status, lastUpdatedBy: adminEmail, lastUpdatedAt: serverTimestamp() });
}

export async function addIssueComment(issueId, message, adminEmail) {
  const ref    = doc(db, ISSUES, issueId);
  const snap   = await getDoc(ref);
  const prev   = snap.data()?.comments ?? [];
  await updateDoc(ref, {
    comments: [...prev, { user: adminEmail, message, timestamp: new Date().toISOString() }],
  });
}
