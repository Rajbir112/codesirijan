import React, { useState, useEffect } from 'react';
import { fetchInventory } from '../api';

const InventoryDashboard = ({ refreshTrigger }) => {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInventory();
  }, [refreshTrigger]);

  const loadInventory = async () => {
    setLoading(true);
    try {
      const data = await fetchInventory();
      setInventory(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const totalRooms = inventory.reduce((sum, item) => sum + item.totalRooms, 0);
  const totalBeds = inventory.reduce((sum, item) => sum + item.totalBeds, 0);

  return (
    <div className="card">
      <h2 className="card-title">Hospital Inventory</h2>
      
      {loading ? (
        <p style={{color: 'var(--text-muted)'}}>Loading inventory...</p>
      ) : inventory.length === 0 ? (
        <p style={{color: 'var(--text-muted)'}}>No capacity deployed yet. Use the form to deploy resources.</p>
      ) : (
        <>
          <div className="grid-cards" style={{marginBottom: '2rem'}}>
            <div className="stat-card">
              <h3>Total Rooms</h3>
              <div className="stat-value">{totalRooms}</div>
            </div>
            <div className="stat-card">
              <h3>Total Beds</h3>
              <div className="stat-value">{totalBeds}</div>
            </div>
          </div>

          <div className="grid-cards">
            {inventory.filter(item => item.totalRooms > 0).map((item, index) => (
              <div key={index} className="stat-card" style={{padding: '1rem'}}>
                <h3>{item.roomTypeName}</h3>
                <div style={{display: 'flex', justifyContent: 'space-around', marginTop: '0.5rem'}}>
                  <div>
                    <div style={{fontSize: '0.8rem', color: 'var(--text-muted)'}}>Rooms</div>
                    <div style={{fontSize: '1.2rem', fontWeight: 'bold'}}>{item.totalRooms}</div>
                  </div>
                  <div>
                    <div style={{fontSize: '0.8rem', color: 'var(--text-muted)'}}>Beds</div>
                    <div style={{fontSize: '1.2rem', fontWeight: 'bold'}}>{item.totalBeds}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default InventoryDashboard;
