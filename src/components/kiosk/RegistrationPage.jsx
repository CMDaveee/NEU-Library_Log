import { useState, useMemo, useCallback } from 'react';
import NEULogo from '../common/NEULogo.jsx';
import { registerStudent } from '../../firebase/firestore.js';
import { COLLEGES, PROGRAMS } from '../../data/constants.js';
import '../../styles/kiosk.css';
import '../../styles/forms.css';

// Email regex compiled once at module level — not inside render
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function RegistrationPage({ studentId, onComplete, onCancel }) {
  const [form, setForm] = useState({
    fullName:    '',
    email:       '',
    collegeCode: '',
    programCode: '',
    status:      'student',
  });
  const [errors,  setErrors]  = useState({});
  const [loading, setLoading] = useState(false);

  // Programs list only recalculates when collegeCode changes — not on every keystroke
  const programs = useMemo(
    () => form.collegeCode ? (PROGRAMS[form.collegeCode] ?? []) : [],
    [form.collegeCode]
  );

  // College options built once — COLLEGES is a module-level constant
  const collegeOptions = useMemo(
    () => COLLEGES.map(c => (
      <option key={c.code} value={c.code}>{c.code} — {c.name}</option>
    )),
    [] // empty deps: COLLEGES never changes at runtime
  );

  // Program options only recalculate when programs list changes
  const programOptions = useMemo(
    () => programs.map(p => (
      <option key={p.code} value={p.code}>{p.code} — {p.name}</option>
    )),
    [programs]
  );

  const set = useCallback((field, value) => {
    setForm(prev => {
      const next = { ...prev, [field]: value };
      if (field === 'collegeCode') next.programCode = '';
      return next;
    });
    setErrors(prev => ({ ...prev, [field]: '' }));
  }, []);

  const validate = useCallback(() => {
    const e = {};
    if (!form.fullName.trim()) e.fullName    = 'Full name is required.';
    if (!form.collegeCode)      e.collegeCode = 'Please select a college.';
    if (!form.programCode)      e.programCode = 'Please select a program.';
    if (!form.status)           e.status      = 'Please select a status.';
    if (form.email && !EMAIL_RE.test(form.email))
      e.email = 'Please enter a valid email address.';
    return e;
  }, [form]);

  const handleSubmit = useCallback(async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }

    setLoading(true);

    const payload = {
      fullName:    form.fullName.trim(),
      email:       form.email.trim() || null,
      collegeCode: form.collegeCode,
      programCode: form.programCode,
      status:      form.status,
    };

    // Optimistic completion — tell the parent immediately so check-in
    // can proceed while Firestore write finishes in the background.
    // The student document will be ready by the time KioskPage queries it
    // again on the next tap (Firestore write typically takes ~200–400 ms).
    onComplete(studentId);

    try {
      await registerStudent(studentId, payload);
    } catch (err) {
      console.error('Registration write failed (background):', err);
      // Non-fatal: check-in already shown; the document will be retried
      // on next tap when getStudent returns null again.
    }
  }, [form, studentId, validate, onComplete]);

  const disabled = loading;

  return (
    <div className="form-page">
      <div className="form-card" style={{ maxWidth: 540 }}>

        <div className="form-card-header">
          <NEULogo size={52} />
          <div>
            <div className="form-card-title">Student Registration</div>
            <div className="form-card-sub">
              New Era University Library — First-time visitor
            </div>
          </div>
        </div>

        {/* Student ID display */}
        <div className="form-row">
          <label className="form-label">Student ID</label>
          <div className="form-id-display">{studentId}</div>
          <div className="form-hint">
            This ID was not found in our records. Please complete registration to continue.
          </div>
        </div>

        {/* Full Name */}
        <div className="form-row">
          <label className="form-label">
            Full Name <span className="req">*</span>
          </label>
          <input
            className={`form-input${errors.fullName ? ' is-error' : ''}`}
            type="text"
            placeholder="e.g. Juan dela Cruz"
            value={form.fullName}
            onChange={e => set('fullName', e.target.value)}
            disabled={disabled}
            autoFocus
          />
          {errors.fullName && <div className="form-error">{errors.fullName}</div>}
        </div>

        {/* Email */}
        <div className="form-row">
          <label className="form-label">Email Address</label>
          <input
            className={`form-input${errors.email ? ' is-error' : ''}`}
            type="email"
            placeholder="e.g. juan@neu.edu.ph (optional)"
            value={form.email}
            onChange={e => set('email', e.target.value)}
            disabled={disabled}
          />
          {errors.email && <div className="form-error">{errors.email}</div>}
        </div>

        {/* Status */}
        <div className="form-row">
          <label className="form-label">
            Status <span className="req">*</span>
          </label>
          <select
            className={`form-select${errors.status ? ' is-error' : ''}`}
            value={form.status}
            onChange={e => set('status', e.target.value)}
            disabled={disabled}
          >
            <option value="student">Student</option>
            <option value="teacher">Teacher / Faculty</option>
            <option value="staff">Staff</option>
          </select>
          {errors.status && <div className="form-error">{errors.status}</div>}
        </div>

        {/* College + Program */}
        <div className="form-row-2">
          <div>
            <label className="form-label">
              College <span className="req">*</span>
            </label>
            <select
              className={`form-select${errors.collegeCode ? ' is-error' : ''}`}
              value={form.collegeCode}
              onChange={e => set('collegeCode', e.target.value)}
              disabled={disabled}
            >
              <option value="">Select college...</option>
              {collegeOptions}
            </select>
            {errors.collegeCode && <div className="form-error">{errors.collegeCode}</div>}
          </div>

          <div>
            <label className="form-label">
              Program <span className="req">*</span>
            </label>
            <select
              className={`form-select${errors.programCode ? ' is-error' : ''}`}
              value={form.programCode}
              onChange={e => set('programCode', e.target.value)}
              disabled={disabled || !form.collegeCode}
            >
              <option value="">
                {form.collegeCode ? 'Select program...' : 'Select college first'}
              </option>
              {programOptions}
            </select>
            {errors.programCode && <div className="form-error">{errors.programCode}</div>}
          </div>
        </div>

        {errors.submit && (
          <div className="form-error" style={{ marginBottom: '0.75rem' }}>
            {errors.submit}
          </div>
        )}

        <div className="form-actions">
          <button className="form-cancel" onClick={onCancel} disabled={disabled}>
            Cancel
          </button>
          <button className="form-submit" onClick={handleSubmit} disabled={disabled}>
            {loading
              ? <><SubmitSpinner /> Registering...</>
              : 'Register and Check In'
            }
          </button>
        </div>
      </div>
    </div>
  );
}

function SubmitSpinner() {
  return (
    <svg
      width="14" height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      style={{ animation: 'spin 0.7s linear infinite', marginRight: '0.4rem', verticalAlign: 'middle' }}
    >
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
    </svg>
  );
}
