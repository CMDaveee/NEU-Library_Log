import { useState } from 'react';
import NEULogo from '../common/NEULogo.jsx';
import { registerStudent } from '../../firebase/firestore.js';
import { COLLEGES, PROGRAMS } from '../../data/constants.js';
import { validateStudentId, formatStudentId } from '../../utils/formatters.js';
import '../../styles/auth.css';
import '../../styles/forms.css';

/**
 * CompleteProfile — shown after a new student signs up with Google.
 * They must link their NEU student ID and choose their college/program.
 *
 * Props:
 *   googleUser  — { uid, email, name, photo }
 *   onComplete(studentId) — profile saved, proceed to kiosk
 *   onBack()    — cancel
 */
export default function CompleteProfile({ googleUser, onComplete, onBack }) {
  const [form, setForm] = useState({
    studentId:   '',
    collegeCode: '',
    programCode: '',
    status:      'student',
  });
  const [errors,  setErrors]  = useState({});
  const [loading, setLoading] = useState(false);

  const programs = form.collegeCode ? (PROGRAMS[form.collegeCode] || []) : [];

  const set = (field, value) => {
    setForm(prev => {
      const next = { ...prev, [field]: value };
      if (field === 'collegeCode') next.programCode = '';
      return next;
    });
    setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const validate = () => {
    const e = {};
    if (!validateStudentId(form.studentId))
      e.studentId  = 'Please enter a valid 10-digit student ID.';
    if (!form.collegeCode) e.collegeCode = 'Please select a college.';
    if (!form.programCode) e.programCode = 'Please select a program.';
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }

    setLoading(true);
    try {
      const sid = formatStudentId(form.studentId);
      await registerStudent(sid, {
        fullName:    googleUser.name,
        email:       googleUser.email,
        googleUid:   googleUser.uid,
        collegeCode: form.collegeCode,
        programCode: form.programCode,
        status:      form.status,
      });
      onComplete(sid);
    } catch (err) {
      console.error(err);
      setErrors({ submit: 'Could not save your profile. Please try again.' });
    }
    setLoading(false);
  };

  return (
    <div className="auth" style={{ alignItems: 'flex-start', paddingTop: '2rem' }}>
      <div className="auth-grid" />
      <div className="auth-glow" />

      <div className="form-card" style={{ maxWidth: 520, zIndex: 1 }}>
        <div className="form-card-header">
          <NEULogo size={52} />
          <div>
            <div className="form-card-title">Complete Your Profile</div>
            <div className="form-card-sub">Signed in as {googleUser.email}</div>
          </div>
        </div>

        <div className="form-info-box">
          Welcome, <strong>{googleUser.name}</strong>! Link your NEU student ID
          to complete your library profile. This is required only once.
        </div>

        {/* Student ID */}
        <div className="form-row">
          <label className="form-label">
            Student ID <span className="req">*</span>
          </label>
          <input
            className={`form-input${errors.studentId ? ' is-error' : ''}`}
            type="text"
            placeholder="XX-XXXXX-XXX"
            value={form.studentId}
            onChange={e => set('studentId', e.target.value)}
            maxLength={12}
            style={{ fontFamily: "'DM Mono', monospace", letterSpacing: '0.08em' }}
          />
          {errors.studentId && <div className="form-error">{errors.studentId}</div>}
        </div>

        {/* Status */}
        <div className="form-row">
          <label className="form-label">Status <span className="req">*</span></label>
          <select
            className="form-select"
            value={form.status}
            onChange={e => set('status', e.target.value)}
          >
            <option value="student">Student</option>
            <option value="teacher">Teacher / Faculty</option>
            <option value="staff">Staff</option>
          </select>
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
            >
              <option value="">Select college...</option>
              {COLLEGES.map(c => (
                <option key={c.code} value={c.code}>{c.code}</option>
              ))}
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
              disabled={!form.collegeCode}
            >
              <option value="">
                {form.collegeCode ? 'Select program...' : 'Select college first'}
              </option>
              {programs.map(p => (
                <option key={p.code} value={p.code}>{p.code}</option>
              ))}
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
          <button className="form-cancel" onClick={onBack} disabled={loading}>
            Back
          </button>
          <button className="form-submit" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Saving...' : 'Save and Continue'}
          </button>
        </div>
      </div>
    </div>
  );
}
