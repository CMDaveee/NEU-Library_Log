import { useState, useEffect, useMemo } from 'react';
import { getIssues, createIssue, updateIssueStatus, addIssueComment } from '../../../firebase/firestore.js';
import { useCampus } from '../../../context/CampusContext.jsx';

const CATEGORIES = ['equipment', 'software', 'facility', 'security', 'other'];
const PRIORITIES  = ['low', 'medium', 'high', 'urgent'];
const STATUSES    = ['open', 'in-progress', 'resolved', 'closed'];

const STATUS_COLORS = {
  open:         'var(--red)',
  'in-progress':'var(--gold, #C9A84C)',
  resolved:     'var(--grn)',
  closed:       'var(--txt3)',
};

function cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : '-'; }

export default function IssuesTab({ adminEmail }) {
  const { campusId } = useCampus();
  const [issues,    setIssues]    = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [showForm,  setShowForm]  = useState(false);
  const [selected,  setSelected]  = useState(null);
  const [comment,   setComment]   = useState('');
  const [statusF,   setStatusF]   = useState('all');
  const [categoryF, setCategoryF] = useState('all');

  // New issue form
  const [form, setForm] = useState({ title: '', description: '', category: 'equipment', priority: 'medium' });
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState('');

  const load = async () => {
    setLoading(true);
    try { setIssues(await getIssues(campusId)); }
    catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { load(); }, [campusId]);

  const filtered = useMemo(() => issues.filter(i => {
    if (statusF !== 'all' && i.status !== statusF) return false;
    if (categoryF !== 'all' && i.category !== categoryF) return false;
    return true;
  }), [issues, statusF, categoryF]);

  const handleSubmit = async () => {
    if (!form.title.trim()) { setErr('Title is required.'); return; }
    setErr(''); setSubmitting(true);
    try {
      await createIssue({ ...form, title: form.title.trim(), description: form.description.trim() }, adminEmail, campusId);
      setForm({ title: '', description: '', category: 'equipment', priority: 'medium' });
      setShowForm(false);
      await load();
    } catch (e) { console.error(e); setErr('Failed to submit issue.'); }
    setSubmitting(false);
  };

  const handleStatusChange = async (issueId, status) => {
    try {
      await updateIssueStatus(issueId, status, adminEmail);
      setIssues(prev => prev.map(i => i.id === issueId ? { ...i, status } : i));
      if (selected?.id === issueId) setSelected(prev => ({ ...prev, status }));
    } catch (e) { console.error(e); }
  };

  const handleAddComment = async () => {
    if (!comment.trim() || !selected) return;
    try {
      await addIssueComment(selected.id, comment.trim(), adminEmail);
      const newComment = { user: adminEmail, message: comment.trim(), timestamp: new Date().toISOString() };
      setSelected(prev => ({ ...prev, comments: [...(prev.comments ?? []), newComment] }));
      setComment('');
    } catch (e) { console.error(e); }
  };

  return (
    <div>
      {/* Issue detail modal */}
      {selected && (
        <div className="po" onClick={() => setSelected(null)}>
          <div style={{ background: 'var(--surf)', borderRadius: 10, padding: '1.75rem', maxWidth: 600, width: '95%', maxHeight: '80vh', overflow: 'auto', boxShadow: '0 24px 64px rgba(0,0,0,.35)' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: '1.15rem', color: 'var(--txt)' }}>{selected.title}</div>
              <button className="ab ab-blk" onClick={() => setSelected(null)}>Close</button>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
              <span className="bdg bdg-out" style={{ textTransform: 'capitalize' }}>{selected.category}</span>
              <span className="bdg" style={{ background: 'var(--red-lt)', color: 'var(--red)', textTransform: 'capitalize' }}>{selected.priority}</span>
            </div>
            <p style={{ fontSize: '0.875rem', color: 'var(--txt2)', marginBottom: '1.25rem', lineHeight: 1.65 }}>{selected.description || 'No description.'}</p>
            <div style={{ marginBottom: '1.25rem' }}>
              <label className="fl">Update Status</label>
              <select className="fs" value={selected.status} onChange={e => handleStatusChange(selected.id, e.target.value)} style={{ marginTop: '0.3rem' }}>
                {STATUSES.map(s => <option key={s} value={s}>{cap(s.replace('-',' '))}</option>)}
              </select>
            </div>
            {(selected.comments ?? []).length > 0 && (
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--txt3)', marginBottom: '0.5rem' }}>Comments</div>
                {selected.comments.map((c, i) => (
                  <div key={i} style={{ background: 'var(--surf2)', border: '1px solid var(--bdr)', borderRadius: 6, padding: '0.625rem 0.875rem', marginBottom: '0.4rem' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--txt3)', marginBottom: '0.2rem' }}>{c.user?.split('@')[0]} · {new Date(c.timestamp).toLocaleString('en-PH')}</div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--txt)' }}>{c.message}</div>
                  </div>
                ))}
              </div>
            )}
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input className="fi" placeholder="Add comment..." value={comment} onChange={e => setComment(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddComment()} style={{ flex: 1 }} />
              <button className="fb fb-p" onClick={handleAddComment} disabled={!comment.trim()}>Post</button>
            </div>
          </div>
        </div>
      )}

      <div className="sec-hdr mb2">
        <div>
          <div className="sec-t">Issue Tracking</div>
          <div className="sec-s">Report and track library equipment and facility issues.</div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="fb fb-g" onClick={load} disabled={loading}>Refresh</button>
          <button className="fb fb-p" onClick={() => setShowForm(f => !f)}>
            {showForm ? 'Cancel' : '+ New Issue'}
          </button>
        </div>
      </div>

      {/* New issue form */}
      {showForm && (
        <div className="tc" style={{ marginBottom: '1.5rem', maxWidth: 580 }}>
          <div className="thbar"><div className="thtitle">Report New Issue</div></div>
          <div style={{ padding: '1.5rem' }}>
            <div className="form-row" style={{ marginBottom: '0.875rem' }}>
              <label className="form-label">Title <span style={{ color: 'var(--red)' }}>*</span></label>
              <input className="form-input" placeholder="Brief description of the issue" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
            </div>
            <div className="form-row" style={{ marginBottom: '0.875rem' }}>
              <label className="form-label">Description</label>
              <textarea className="form-input" rows={3} placeholder="Detailed description, error codes, steps to reproduce..." value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} style={{ resize: 'vertical', fontFamily: 'inherit', fontSize: '0.875rem' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem', marginBottom: '1.25rem' }}>
              <div>
                <label className="form-label">Category</label>
                <select className="fs" value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{cap(c)}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">Priority</label>
                <select className="fs" value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value }))}>
                  {PRIORITIES.map(p => <option key={p} value={p}>{cap(p)}</option>)}
                </select>
              </div>
            </div>
            {err && <div className="f-err" style={{ marginBottom: '0.75rem' }}>{err}</div>}
            <button className="fb fb-p" onClick={handleSubmit} disabled={submitting}>{submitting ? 'Submitting...' : 'Submit Issue'}</button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="fbar mb3">
        <div className="fg" style={{ maxWidth: 180 }}>
          <div className="fl">Status</div>
          <select className="fs" value={statusF} onChange={e => setStatusF(e.target.value)}>
            <option value="all">All Statuses</option>
            {STATUSES.map(s => <option key={s} value={s}>{cap(s.replace('-',' '))}</option>)}
          </select>
        </div>
        <div className="fg" style={{ maxWidth: 180 }}>
          <div className="fl">Category</div>
          <select className="fs" value={categoryF} onChange={e => setCategoryF(e.target.value)}>
            <option value="all">All Categories</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{cap(c)}</option>)}
          </select>
        </div>
      </div>

      <div className="tc">
        <div className="thbar">
          <div className="thtitle">Issues</div>
          <div className="cpill">{filtered.length} issues</div>
        </div>
        <div className="tscroll">
          {loading ? <div className="empty">Loading...</div> :
           filtered.length === 0 ? <div className="empty">No issues found.</div> : (
            <table>
              <thead><tr><th>Title</th><th>Category</th><th>Priority</th><th>Status</th><th>Reported</th><th>Comments</th><th>Action</th></tr></thead>
              <tbody>
                {filtered.map(i => (
                  <tr key={i.id}>
                    <td style={{ maxWidth: 220 }}>
                      <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--acc)', fontWeight: 600, fontSize: '0.82rem', textAlign: 'left', padding: 0 }} onClick={() => { setSelected(i); setComment(''); }}>
                        {i.title}
                      </button>
                    </td>
                    <td><span className="bdg bdg-out" style={{ textTransform: 'capitalize' }}>{i.category}</span></td>
                    <td><span className="bdg" style={{ background: i.priority==='urgent'?'var(--red-lt)':i.priority==='high'?'rgba(201,168,76,.12)':'var(--surf2)', color: i.priority==='urgent'?'var(--red)':i.priority==='high'?'var(--gold,#C9A84C)':'var(--txt3)', textTransform: 'capitalize' }}>{i.priority}</span></td>
                    <td>
                      <select className="esel" value={i.status} onChange={e => handleStatusChange(i.id, e.target.value)} style={{ fontSize: '0.75rem', minWidth: 110, color: STATUS_COLORS[i.status] ?? 'var(--txt2)' }}>
                        {STATUSES.map(s => <option key={s} value={s}>{cap(s.replace('-',' '))}</option>)}
                      </select>
                    </td>
                    <td style={{ fontSize: '0.75rem', color: 'var(--txt3)', whiteSpace: 'nowrap' }}>
                      {i.reportedAt ? new Date(i.reportedAt).toLocaleDateString('en-PH') : '-'}
                    </td>
                    <td style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.78rem' }}>{(i.comments ?? []).length}</td>
                    <td>
                      <button className="ab ab-ok" onClick={() => { setSelected(i); setComment(''); }}>View</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
