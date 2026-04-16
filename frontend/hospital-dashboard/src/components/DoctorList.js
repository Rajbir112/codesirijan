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
    <div className="card" style={{ borderColor: '#8b5cf6' }}>
      <h2 className="card-title" style={{ color: '#c4b5fd', borderBottomColor: 'rgba(139, 92, 246, 0.2)' }}>
        Medical Personnel Directory
      </h2>
      
      {loading ? (
        <p style={{color: 'var(--text-muted)'}}>Loading personnel...</p>
      ) : (docStats.length === 0 || totalDoctors === 0) && totalNurses === 0 ? (
        <p style={{color: 'var(--text-muted)'}}>No personnel have been added to the system yet.</p>
      ) : (
        <>
          <div className="grid-cards" style={{marginBottom: '2rem'}}>
            <div className="stat-card" style={{ backgroundColor: 'rgba(139, 92, 246, 0.1)', borderColor: 'rgba(139, 92, 246, 0.3)' }}>
              <h3>Registered Doctors</h3>
              <div className="stat-value" style={{ color: '#a78bfa' }}>{totalDoctors}</div>
              <div className="stat-sub" style={{ color: '#c4b5fd' }}>Across {activeCategories.length} Specialties</div>
            </div>
            <div className="stat-card" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', borderColor: 'rgba(16, 185, 129, 0.3)' }}>
              <h3>Nursing Staff</h3>
              <div className="stat-value" style={{ color: '#10b981' }}>{totalNurses}</div>
              <div className="stat-sub" style={{ color: '#34d399' }}>General RNs</div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* RENDER NURSES CAREGORY IF ANY EXIST */}
            {totalNurses > 0 && (
                <div className="stat-card" style={{ textAlign: 'left', padding: '1.5rem', backgroundColor: 'rgba(30, 41, 59, 0.8)', borderColor: 'rgba(16, 185, 129, 0.3)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
                        <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#10b981' }}>Nursing Staff</h3>
                        <span style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)', color: '#34d399', padding: '4px 12px', borderRadius: '12px', fontSize: '0.9rem', fontWeight: 'bold' }}>
                            {totalNurses} Nurse{totalNurses > 1 ? 's' : ''}
                        </span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                        {nurseStats.nurses.map((nurse, idx) => (
                            <div key={idx} style={{ padding: '0.8rem', backgroundColor: 'rgba(15, 23, 42, 0.5)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <div style={{ fontWeight: 'bold', color: '#f8fafc', fontSize: '1.05rem' }}>{nurse.name}</div>
                                <div style={{ fontSize: '0.9rem', color: '#94a3b8', marginTop: '0.2rem' }}>
                                    <span>⭐ {nurse.experienceYears} Years Experience</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* RENDER DOCTOR CATEGORIES */}
            {activeCategories.map((item, index) => (
              <div key={index} className="stat-card" style={{ textAlign: 'left', padding: '1.5rem', backgroundColor: 'rgba(30, 41, 59, 0.8)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#e2e8f0' }}>{item.categoryName}</h3>
                    <span style={{ backgroundColor: 'rgba(139, 92, 246, 0.2)', color: '#c4b5fd', padding: '4px 12px', borderRadius: '12px', fontSize: '0.9rem', fontWeight: 'bold' }}>
                        {item.totalDoctors} Doctor{item.totalDoctors > 1 ? 's' : ''}
                    </span>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                    {item.doctors.map((doc, idx) => (
                        <div key={idx} style={{ padding: '0.8rem', backgroundColor: 'rgba(15, 23, 42, 0.5)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <div style={{ fontWeight: 'bold', color: '#f8fafc', fontSize: '1.05rem' }}>{doc.name}</div>
                            <div style={{ fontSize: '0.9rem', color: '#94a3b8', marginTop: '0.2rem' }}>
                                <span style={{ marginRight: '1rem' }}>🎓 {doc.education}</span>
                                <span>⭐ {doc.experienceYears} Years Experience</span>
                            </div>
                        </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default DoctorList;
