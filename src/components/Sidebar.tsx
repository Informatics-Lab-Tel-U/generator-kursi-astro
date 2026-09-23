import type { Student, ProjectorConfig } from './types';
import { LuSettings, LuBook, LuUsers, LuBan, LuDices, LuRotateCcw, LuLoader } from 'react-icons/lu';
import CustomSelect from './CustomSelect';

interface SidebarProps {
  showSidebar: boolean;
  matkul: string;
  setMatkul: (val: string) => void;
  kelas: string;
  setKelas: (val: string) => void;
  matkulOptions: {value: string, label: string}[];
  kelasOptions: {value: string, label: string}[];
  disabledSeats: Set<number>;
  toggleDisabledSeat: (seatNo: number) => void;
  eligibleStudents: Student[];
  isLoading: boolean;
  isOptionsLoading: boolean;
  isKelasLoading: boolean;
  handleGenerate: () => void;
  handleReset: () => void;
  totalSeats: number;
  projectorConfig: ProjectorConfig;
  setProjectorConfig: React.Dispatch<React.SetStateAction<ProjectorConfig>>;
  versions: import('./types').SeatVersion[];
  restoreVersion: (v: import('./types').SeatVersion) => void;
}

export default function Sidebar({
  showSidebar,
  matkul,
  setMatkul,
  kelas,
  setKelas,
  matkulOptions,
  kelasOptions,
  disabledSeats,
  toggleDisabledSeat,
  eligibleStudents,
  isLoading,
  isOptionsLoading,
  isKelasLoading,
  handleGenerate,
  handleReset,
  totalSeats,
  versions,
  restoreVersion,
}: SidebarProps) {

  return (
    <aside className={`sidebar ${showSidebar ? "open" : "closed"}`}>
      <div className="sidebar-header">
        <div style={{ display: 'flex', alignItems: 'center' }}>
            <LuSettings style={{ fontSize: '16px', marginRight: '6px' }} />
            Konfigurasi
        </div>
      </div>

      {/* Matkul & Kelas */}
      <div className="sidebar-section">
        <label className="sidebar-label">
          <LuBook style={{ marginRight: '6px' }} /> Mata Kuliah
        </label>
        <CustomSelect
          value={matkul}
          onChange={(v) => {
            setMatkul(v);
            setKelas(""); // Reset kelas so user must explicitly pick again
          }}
          options={matkulOptions}
          placeholder="-- Pilih Mata Kuliah --"
          isLoading={isOptionsLoading}
          disabled={isOptionsLoading}
        />

        <label className="sidebar-label">
          <LuUsers style={{ marginRight: '6px' }} /> Kelas
        </label>
        <CustomSelect
          value={kelas}
          onChange={(v) => setKelas(v)}
          options={kelasOptions}
          placeholder="-- Pilih Kelas --"
          disabled={!matkul || isKelasLoading || isOptionsLoading}
          isLoading={isKelasLoading}
        />
      </div>

      {/* Disabled seats */}
      <div className="sidebar-section">
        <label className="sidebar-label">
          <LuBan style={{ marginRight: '6px' }} /> Meja tidak aktif
          {disabledSeats.size > 0 && (
            <span className="badge badge-danger">
              {disabledSeats.size}
            </span>
          )}
        </label>
        <div className="seat-toggle-grid" style={{ gridTemplateColumns: `repeat(${totalSeats / 10}, 1fr)` }}>
          {Array.from(
            { length: totalSeats },
            (_, i) => i + 1,
          ).map((n) => (
            <button
              key={n}
              className={`seat-toggle ${disabledSeats.has(n) ? "disabled" : ""}`}
              onClick={() => toggleDisabledSeat(n)}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {/* Generate */}
      <div className="sidebar-section">
        <div className="sidebar-info">
          {eligibleStudents.length} praktikan di <strong>{kelas}</strong>
        </div>
        <button
          className="btn btn-primary"
          onClick={handleGenerate}
          disabled={!matkul || !kelas || eligibleStudents.length === 0 || isLoading}
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
        >
          {isLoading ? (
            <><LuLoader className="animate-spin" /> Generating...</>
          ) : (
            <><LuDices /> Generate Acak</>
          )}
        </button>
        <button 
          className="btn btn-secondary" 
          onClick={handleReset} 
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
        >
          <LuRotateCcw /> Reset
        </button>
      </div>

      {/* Riwayat / Versi */}
      {versions && versions.length > 0 && (
          <div className="sidebar-section">
            <label className="sidebar-label">Riwayat Generate (2 Jam Terakhir)</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {versions.map(v => {
                    const date = new Date(v.timestamp);
                    const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                    return (
                        <button 
                            key={v.id} 
                            className="btn btn-secondary"
                            style={{ justifyContent: 'flex-start', fontSize: '12px', padding: '8px', textAlign: 'left', lineHeight: '1.4' }}
                            onClick={() => restoreVersion(v)}
                            title="Klik untuk merestore versi ini"
                        >
                            <strong>{timeStr}</strong>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                {v.matkul} - {v.kelas}
                            </div>
                        </button>
                    )
                })}
            </div>
          </div>
      )}

    </aside>
  );
}
