import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { getStudentsPaginated, setStudentBlocked } from '../../../firebase/firestore.js';
import { COLLEGES, PROGRAMS } from '../../../data/constants.js';
import { fmtDate } from '../../../utils/formatters.js';

// Build lookup maps once at module level — O(1) access, zero runtime cost
const COLLEGE_MAP = Object.fromEntries(COLLEGES.map(c => [c.code, c.name]));
const PROGRAM_MAP = Object.fromEntries(
  Object.entries(PROGRAMS).flatMap(([col, progs]) =>
    progs.map(p => [`${col}:${p.code}`, p.name])
  )
);

function getCollegeName(code)              { return COLLEGE_MAP[code] ?? code ?? '-'; }
function getProgramName(col, prog)         { return PROGRAM_MAP[`${col}:${prog}`] ?? prog ?? '-'; }

const PAGE_SIZE = 20;

export default function StudentsTab({ adminEmail }) {
  // ── Pagination state ────────────────────────────────────────────────────────
  const [pages,       setPages]       = useState([[]]); // pages[i] = array of students
  const [cursors,     setCursors]     = useState([null]); // Firestore doc cursors per page
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore,     setHasMore]     = useState(false);
  const [loading,     setLoading]     = useState(true);
  const [loadingNext, setLoadingNext] = useState(false);

  // ── Filter / search (client-side within loaded page) ──────────────────────
  const [search,    setSearch]    = useState('');
  const [filter,    setFilter]    = useState('all');

  // ── Block modal state ───────────────────────────────────────────────────────
  const [blocking,  setBlocking]  = useState({});
  const [reason,    setReason]    = useState('');
  const [reasonFor, setReasonFor] = useState(null);

  const tableRef = useRef(null);

  // ── Load page 0 on mount ────────────────────────────────────────────────────
  const loadPage0 = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getStudentsPaginated(PAGE_SIZE, null);
      setPages([result.students]);
      setCursors([null, result.lastDoc]);
      setHasMore(result.hasMore);
      setCurrentPage(0);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadPage0(); }, [loadPage0]);

  // ── Navigate to next page (fetches from Firestore if not yet cached) ────────
  const goNext = useCallback(async () => {
    const nextIdx = currentPage + 1;

    // Already cached — just switch
    if (pages[nextIdx]) {
      setCurrentPage(nextIdx);
      tableRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }

    setLoadingNext(true);
    try {
      const cursor = cursors[nextIdx] ?? null;
      const result = await getStudentsPaginated(PAGE_SIZE, cursor);
      setPages(prev => { const n = [...prev]; n[nextIdx] = result.students; return n; });
      setCursors(prev => { const n = [...prev]; n[nextIdx + 1] = result.lastDoc; return n; });
      setHasMore(result.hasMore);
      setCurrentPage(nextIdx);
      tableRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (e) {
      console.error(e);
    }
    setLoadingNext(false);
  }, [currentPage, pages, cursors]);

  const goPrev = useCallback(() => {
    if (currentPage > 0) {
      setCurrentPage(p => p - 1);
      tableRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [currentPage]);

  // ── Current page students ────────────────────────────────────────────────────
  const pageStudents = pages[currentPage] ?? [];

  // ── Filtering within current page (useMemo so it only runs when deps change) ─
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return pageStudents.filter(s => {
      if (q) {
        const hit =
          s.studentId?.toLowerCase().includes(q) ||
          s.fullName?.toLowerCase().includes(q)   ||
          s.email?.toLowerCase().includes(q)       ||
          s.collegeCode?.toLowerCase().includes(q);
        if (!hit) return false;
      }
      if (filter === 'blocked') return s.isBlocked;
      if (filter === 'allowed') return !s.isBlocked;
      return true;
    });
  }, [pageStudents, search, filter]);

  // ── Counts (useMemo — don't recompute on unrelated state changes) ───────────
  const blockedCount = useMemo(
    () => pageStudents.filter(s => s.isBlocked).length,
    [pageStudents]
  );

  // ── Optimistic block / unblock — update local state immediately ─────────────
  const updateLocal = useCallback((sid, patch) => {
    setPages(prev =>
      prev.map(pg => pg.map(s => s.studentId === sid ? { ...s, ...patch } : s))
    );
  }, []);

  const handleBlock = useCallback((sid) => {
    setReasonFor(sid);
    setReason('');
  }, []);

  const confirmBlock = useCallback(async () => {
    const sid = reasonFor;
    setReasonFor(null);
    setBlocking(p => ({ ...p, [sid]: true }));

    // Optimistic update — table responds instantly, Firestore syncs in background
    updateLocal(sid, {
      isBlocked:     true,
      blockedBy:     adminEmail,
      blockedReason: reason.trim() || null,
    });

    try {
      await setStudentBlocked(sid, true, adminEmail, reason.trim());
    } catch (e) {
      console.error(e);
      // Rollback on failure
      updateLocal(sid, { isBlocked: false, blockedBy: null, blockedReason: null });
    }
    setBlocking(p => { const n = { ...p }; delete n[sid]; return n; });
  }, [reasonFor, reason, adminEmail, updateLocal]);

  const handleUnblock = useCallback(async (sid) => {
    setBlocking(p => ({ ...p, [sid]: true }));

    // Optimistic update
    updateLocal(sid, { isBlocked: false, blockedBy: null, blockedReason: null });

    try {
      await setStudentBlocked(sid, false, adminEmail);
    } catch (e) {
      console.error(e);
      // Rollback on failure
      updateLocal(sid, { isBlocked: true });
    }
    setBlocking(p => { const n = { ...p }; delete n[sid]; return n; });
  }, [adminEmail, updateLocal]);

  const totalPages = pages.filter(Boolean).length;

  return (
    <div>
      {/* Block-reason modal */}
      {reasonFor && (
        <div className="po">
          <div className="bc" style={{ maxWidth: 400 }}>
            <div className="bc-title" style={{ marginBottom: '0.75rem' }}>Block Student</div>
            <p style={{ fontSize: '0.82rem', color: 'var(--txt2)', marginBottom: '1rem' }}>
              Reason for blocking <strong>{reasonFor}</strong> (optional):
            </p>
            <input
              className="fi"
              style={{ width: '100%', marginBottom: '1.25rem' }}
              placeholder="e.g. Overdue books, policy violation..."
              value={reason}
              onChange={e => setReason(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && confirmBlock()}
              autoFocus
            />
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                className="bc-close"
                style={{ background: 'var(--surf2)', color: 'var(--txt2)', border: '1.5px solid var(--bdr)', flex: 1 }}
                onClick={() => setReasonFor(null)}
              >
                Cancel
              </button>
              <button className="bc-close" style={{ flex: 1 }} onClick={confirmBlock}>
                Confirm Block
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="sec-hdr mb2">
        <div>
          <div className="sec-t">Student Registry</div>
          <div className="sec-s">Read-only view. Admins may block or restore student access.</div>
        </div>
        <button className="fb fb-g" onClick={loadPage0} disabled={loading || loadingNext}>
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {/* Search + filter */}
      <div className="fbar mb3">
        <div className="fg" style={{ maxWidth: 300 }}>
          <div className="fl">Search</div>
          <input
            className="fi"
            placeholder="Name, ID, email, college..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="fg" style={{ maxWidth: 180 }}>
          <div className="fl">Access Status</div>
          <select className="fs" value={filter} onChange={e => setFilter(e.target.value)}>
            <option value="all">All Students</option>
            <option value="allowed">Allowed Only</option>
            <option value="blocked">Blocked Only</option>
          </select>
        </div>
      </div>

      <div className="tc" ref={tableRef}>
        <div className="thbar">
          <div className="thtitle">Registered Students</div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <div className="cpill">{filtered.length} on this page</div>
            {blockedCount > 0 && (
              <div className="cpill" style={{ background: 'var(--red-lt)', color: 'var(--red)', borderColor: 'var(--red)' }}>
                {blockedCount} blocked
              </div>
            )}
          </div>
        </div>

        <div className="tscroll">
          {loading ? (
            <div className="empty">Loading students...</div>
          ) : filtered.length === 0 ? (
            <div className="empty">No students found.</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Student ID</th>
                  <th>Full Name</th>
                  <th>College</th>
                  <th>Program</th>
                  <th>Status</th>
                  <th>Registered</th>
                  <th>Access</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(s => (
                  <tr key={s.id}>
                    <td><span className="mono">{s.studentId}</span></td>
                    <td style={{ fontWeight: 500 }}>{s.fullName ?? '-'}</td>
                    <td>
                      <span title={getCollegeName(s.collegeCode)} style={{ cursor: 'default' }}>
                        {s.collegeCode ?? '-'}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.75rem' }}>
                      <span title={getProgramName(s.collegeCode, s.programCode)} style={{ cursor: 'default' }}>
                        {s.programCode ?? '-'}
                      </span>
                    </td>
                    <td>
                      <span className="bdg bdg-out" style={{ textTransform: 'capitalize' }}>
                        {s.status ?? 'student'}
                      </span>
                    </td>
                    <td style={{ whiteSpace: 'nowrap', fontSize: '0.75rem' }}>
                      {fmtDate(s.registeredAt?.toDate ? s.registeredAt.toDate() : s.registeredAt)}
                    </td>
                    <td>
                      <span className={`bdg ${s.isBlocked ? 'bdg-blk' : 'bdg-in'}`}>
                        {s.isBlocked ? 'Blocked' : 'Allowed'}
                      </span>
                      {s.isBlocked && s.blockedReason && (
                        <div style={{ fontSize: '0.65rem', color: 'var(--txt3)', marginTop: '2px' }}>
                          {s.blockedReason}
                        </div>
                      )}
                    </td>
                    <td>
                      {s.isBlocked ? (
                        <button
                          className="ab ab-ok"
                          onClick={() => handleUnblock(s.studentId)}
                          disabled={blocking[s.studentId]}
                        >
                          {blocking[s.studentId] ? '...' : 'Restore'}
                        </button>
                      ) : (
                        <button
                          className="ab ab-blk"
                          onClick={() => handleBlock(s.studentId)}
                          disabled={blocking[s.studentId]}
                        >
                          {blocking[s.studentId] ? '...' : 'Block'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination controls */}
        {(currentPage > 0 || hasMore) && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '0.875rem 1.4rem',
            borderTop: '1px solid var(--bdr)',
            background: 'var(--surf2)',
          }}>
            <button
              className="fb fb-g"
              onClick={goPrev}
              disabled={currentPage === 0 || loading || loadingNext}
              style={{ minWidth: 90 }}
            >
              Previous
            </button>
            <span style={{ fontSize: '0.78rem', color: 'var(--txt3)', fontFamily: "'DM Mono', monospace" }}>
              Page {currentPage + 1}{totalPages > 1 ? ` of ${totalPages}${hasMore ? '+' : ''}` : ''}
            </span>
            <button
              className="fb fb-p"
              onClick={goNext}
              disabled={!hasMore || loadingNext}
              style={{ minWidth: 90 }}
            >
              {loadingNext ? 'Loading...' : 'Next'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
