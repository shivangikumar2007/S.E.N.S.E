import React, { FormEvent, useState } from 'react';
import { Building } from '../types/sense';
import { Building2, MapPin, Plus, Trash2 } from 'lucide-react';

interface BuildingManagementViewProps {
  buildings: Building[];
  selectedBuildingId: string;
  onSelectBuilding: (buildingId: string) => void;
  onAddBuilding: (building: Omit<Building, 'id'>) => void;
  onDeleteBuilding: (buildingId: string) => void;
}

export const BuildingManagementView: React.FC<BuildingManagementViewProps> = ({
  buildings,
  selectedBuildingId,
  onSelectBuilding,
  onAddBuilding,
  onDeleteBuilding,
}) => {
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [areaSqM, setAreaSqM] = useState('');
  const [floorCount, setFloorCount] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const area = Number(areaSqM);
    const floors = Number(floorCount);
    if (!name.trim() || !location.trim() || !ownerEmail.trim() || area <= 0 || floors < 1) return;

    onAddBuilding({ name: name.trim(), location: location.trim(), areaSqM: area, floorCount: Math.floor(floors), ownerEmail: ownerEmail.trim().toLowerCase() });
    setName('');
    setLocation('');
    setAreaSqM('');
    setFloorCount('');
    setOwnerEmail('');
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 24, fontWeight: 700 }}>Building Portfolio Management</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 4 }}>
          Administrator-only portfolio controls. New buildings receive their own live floor telemetry.
        </p>
      </div>

      <div className="panels-grid">
        <div className="dashboard-panel">
          <div className="panel-header"><div className="panel-title"><Building2 size={18} color="var(--accent-cyan)" /> Buildings</div></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {buildings.map((building) => (
              <div key={building.id} className="floor-slice" style={{ padding: 14, borderColor: building.id === selectedBuildingId ? 'var(--accent-cyan)' : undefined }}>
                <button
                  type="button"
                  onClick={() => onSelectBuilding(building.id)}
                  style={{ background: 'none', border: 0, color: 'inherit', cursor: 'pointer', textAlign: 'left', flex: 1, padding: 0 }}
                >
                  <div style={{ fontWeight: 700 }}>{building.name}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 4 }}><MapPin size={12} style={{ display: 'inline', marginRight: 4 }} />{building.location} · {building.areaSqM} m² · {building.floorCount} floors</div>
                  <div style={{ color: 'var(--accent-emerald)', fontSize: 11, marginTop: 4 }}>Owner: {building.ownerEmail}</div>
                </button>
                <button
                  type="button"
                  className="panel-btn"
                  disabled={buildings.length === 1}
                  title={buildings.length === 1 ? 'At least one building must remain' : `Delete ${building.name}`}
                  onClick={() => onDeleteBuilding(building.id)}
                  style={{ color: 'var(--accent-rose)' }}
                ><Trash2 size={15} /></button>
              </div>
            ))}
          </div>
        </div>

        <form className="dashboard-panel" onSubmit={handleSubmit}>
          <div className="panel-header"><div className="panel-title"><Plus size={18} color="var(--accent-emerald)" /> Add building</div></div>
          {[
            ['Building name', name, setName, 'e.g. Tower Delta', 'text'],
            ['Place', location, setLocation, 'e.g. Bengaluru, Karnataka', 'text'],
            ['Area (m²)', areaSqM, setAreaSqM, 'e.g. 2500', 'number'],
            ['Number of floors', floorCount, setFloorCount, 'e.g. 6', 'number'],
            ['Owner email', ownerEmail, setOwnerEmail, 'e.g. owner@example.com', 'email'],
          ].map(([label, value, setValue, placeholder, type]) => (
            <label key={label as string} style={{ display: 'block', marginBottom: 14, fontSize: 12, color: 'var(--text-secondary)' }}>
              {label as string}
              <input required min={type === 'number' ? 1 : undefined} type={type as string} value={value as string} placeholder={placeholder as string} onChange={(e) => (setValue as (value: string) => void)(e.target.value)} style={{ display: 'block', marginTop: 6, width: '100%', boxSizing: 'border-box', background: 'rgba(0,0,0,0.25)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', padding: '10px', color: '#fff' }} />
            </label>
          ))}
          <button id="btn-add-building" type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}><Plus size={16} /> Add building</button>
        </form>
      </div>
    </div>
  );
};
