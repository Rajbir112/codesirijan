import React, { useState, useEffect } from 'react';
import { fetchDoctorStats, fetchNurseStats } from '../api';

const DoctorList = ({ refreshTrigger }) => {
  const [docStats, setDocStats] = useState([]);
  const [nurseStats, setNurseStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAllStats();
  }, [refreshTrigger]);

  const loadAllStats = async () => {
    setLoading(true);
    try {
      const [docData, nurseData] = await Promise.all([
          fetchDoctorStats(),
          fetchNurseStats()
      ]);
      setDocStats(docData);
      setNurseStats(nurseData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const totalDoctors = docStats.reduce((sum, item) => sum + item.totalDoctors, 0);
  const totalNurses = nurseStats ? nurseStats.totalNurses : 0;
  const activeCategories = docStats.filter(item => item.totalDoctors > 0);

  return (
    <div className="card">
      <h2 className="card-title" style={{ color: '#1E293B', borderBottom: '1px solid #E2E8F0' }}>
        Medical Personnel Directory
      </h2>

      {loading ? (
        <p style={{ color: 'var(--text-muted)' }}>Loading personnel...</p>
      ) : (docStats.length === 0 || totalDoctors === 0) && totalNurses === 0 ? (
        <p style={{ color: 'var(--text-muted)' }}>No personnel have been added to the system yet.</p>
      ) : (
        <>
          <div className="grid-cards" style={{ marginBottom: '2rem' }}>
            <div className="stat-card" style={{ backgroundColor: '#F8FAFC', borderColor: '#E2E8F0' }}>
              <h3>Registered Doctors</h3>
              <div className="stat-value" style={{ color: '#0066FF' }}>{totalDoctors}</div>
              <div className="stat-sub" style={{ color: '#64748B' }}>Across {activeCategories.length} Specialties</div>
            </div>
            <div className="stat-card" style={{ backgroundColor: '#F8FAFC', borderColor: '#E2E8F0' }}>
              <h3>Nursing Staff</h3>
              <div className="stat-value" style={{ color: '#10B981' }}>{totalNurses}</div>
              <div className="stat-sub" style={{ color: '#64748B' }}>General RNs</div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

            {/* NURSES */}
            {totalNurses > 0 && (
              <SectionCard
                title="Nursing Staff"
                count={`${totalNurses} Nurse${totalNurses > 1 ? 's' : ''}`}
                accentColor="#10B981"
                accentBg="rgba(16,185,129,0.1)"
              >
                {nurseStats.nurses.map((nurse) => (
                  <PersonnelRow
                    key={nurse.id}
                    name={nurse.name}
                    subInfo={`⭐ ${nurse.experienceYears} Years Experience`}
                    deleteUrl={`http://localhost:8080/api/nurses/${nurse.id}`}
                    onDeleted={loadAllStats}
                  />
                ))}
              </SectionCard>
            )}

            {/* DOCTORS by category */}
            {activeCategories.map((item, index) => (
              <SectionCard
                key={index}
                title={item.categoryName}
                count={`${item.totalDoctors} Doctor${item.totalDoctors > 1 ? 's' : ''}`}
                accentColor="#0066FF"
                accentBg="rgba(0,102,255,0.1)"
              >
                {item.doctors.map((doc) => (
                  <PersonnelRow
                    key={doc.id}
                    name={`Dr. ${doc.name}`}
                    subInfo={`🎓 ${doc.education}  •  ⭐ ${doc.experienceYears} Yrs Exp`}
                    deleteUrl={`http://localhost:8080/api/doctors/${doc.id}`}
                    onDeleted={loadAllStats}
                  />
                ))}
              </SectionCard>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

// ─── Section Card ─────────────────────────────────────────────
const SectionCard = ({ title, count, accentColor, accentBg, children }) => (
  <div className="stat-card" style={{ textAlign: 'left', padding: '1.5rem', backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.75rem' }}>
      <h3 style={{ margin: 0, fontSize: '1.05rem', color: accentColor }}>{title}</h3>
      <span style={{ backgroundColor: accentBg, color: accentColor, padding: '4px 12px', borderRadius: '12px', fontSize: '0.88rem', fontWeight: 700 }}>{count}</span>
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>{children}</div>
  </div>
);

// ─── Personnel Row with Inline Confirm Delete ─────────────────
const PersonnelRow = ({ name, subInfo, deleteUrl, onDeleted }) => {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting]     = useState(false);
  const [error, setError]           = useState(null);

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    setError(null);
    setConfirming(true);
  };

  const handleCancel = (e) => {
    e.stopPropagation();
    setConfirming(false);
  };

  const handleConfirm = async (e) => {
    e.stopPropagation();
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(deleteUrl, { method: 'DELETE' });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Delete failed');
      }
      onDeleted();
    } catch (err) {
      setError(err.message);
      setDeleting(false);
      setConfirming(false);
    }
  };

  return (
    <div style={{ padding: '0.85rem 1rem', backgroundColor: '#F8FAFC', borderRadius: '8px', border: `1px solid ${confirming ? '#FECACA' : '#E2E8F0'}`, transition: 'border-color 0.2s' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, color: '#1E293B', fontSize: '1rem' }}>{name}</div>
          <div style={{ fontSize: '0.85rem', color: '#64748B', marginTop: '2px' }}>{subInfo}</div>
          {error && (
            <div style={{ color: '#EF4444', fontSize: '0.8rem', marginTop: '4px', fontWeight: 500 }}>
              ⚠ {error}
            </div>
          )}
        </div>

        {/* Inline confirmation UI — no window.confirm() */}
        {confirming ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
            <span style={{ fontSize: '0.82rem', color: '#EF4444', fontWeight: 600 }}>Sure?</span>
            <button
              onClick={handleConfirm}
              disabled={deleting}
              style={{
                background: '#EF4444', color: '#fff', border: 'none',
                borderRadius: '7px', padding: '0.38rem 0.85rem',
                cursor: deleting ? 'not-allowed' : 'pointer',
                fontWeight: 700, fontSize: '0.82rem',
                opacity: deleting ? 0.6 : 1
              }}
            >
              {deleting ? '…' : 'Yes, Delete'}
            </button>
            <button
              onClick={handleCancel}
              style={{
                background: '#FFFFFF', color: '#64748B',
                border: '1px solid #E2E8F0', borderRadius: '7px',
                padding: '0.38rem 0.75rem', cursor: 'pointer',
                fontWeight: 600, fontSize: '0.82rem'
              }}
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={handleDeleteClick}
            style={{
              background: '#FEF2F2', color: '#EF4444', border: '1px solid #FECACA',
              borderRadius: '8px', padding: '0.4rem 0.9rem', cursor: 'pointer',
              fontWeight: 600, fontSize: '0.82rem', flexShrink: 0,
              transition: 'background 0.15s', whiteSpace: 'nowrap'
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#FEE2E2'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#FEF2F2'; }}
          >
            🗑 Delete
          </button>
        )}
      </div>
    </div>
  );
};

export default DoctorList;
