import React from "react";
import type { Racer, Student } from "./types";
import { LuCamera, LuCopy, LuCheck } from "react-icons/lu";
import LeaderboardView from "./LeaderboardView";
import { useRacers, useMoodleScript } from "../hooks/useCountdown";

interface LeaderboardTabProps {
    kelas?: string;
    eligibleStudents?: Student[];
    racers: Racer[];
    setRacers?: React.Dispatch<React.SetStateAction<Racer[]>>;
}

export default function LeaderboardTab({
    kelas = "",
    eligibleStudents = [],
    racers,
    setRacers,
}: LeaderboardTabProps) {
    const {
        newRacerName,
        setNewRacerName,
        addRacer,
        removeRacer,
        handleRacerImageUpload,
    } = useRacers(racers, setRacers);

    const {
        isCopied,
        showScript,
        setShowScript,
        generateScript,
        copyScript,
    } = useMoodleScript(kelas);

    return (
        <div className="leaderboard-tab" style={{ width: "100%", display: "flex", flexDirection: "column", gap: "20px" }}>
            {/* Header info */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
                <h2 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "var(--text-primary)" }}>
                    Leaderboard Praktikum{kelas ? `: Kelas ${kelas}` : ""}
                </h2>
            </div>

            {/* Pengaturan pembalap asprak */}
            <div className="racer-setup" style={{ margin: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                    <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 600, color: "var(--text-primary)" }}>
                        Daftar Pembalap (ASPRAK)
                    </h3>
                    <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                        {racers.length} pembalap terdaftar
                    </span>
                </div>

                <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
                    <input
                        type="text"
                        className="sidebar-input"
                        placeholder="Kode ASPRAK (contoh: AFF)"
                        value={newRacerName}
                        onChange={(e) => setNewRacerName(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && addRacer()}
                        aria-label="Kode ASPRAK baru"
                    />
                    <button className="btn btn-primary" onClick={addRacer}>
                        + Tambah
                    </button>
                </div>

                <div className="racer-list">
                    {racers.length === 0 ? (
                        <div style={{ padding: "16px", textAlign: "center", color: "var(--text-muted)", fontSize: "13px" }}>
                            Belum ada pembalap. Tambahkan kode asprak untuk balapan di tab Hitung Mundur.
                        </div>
                    ) : (
                        racers.map((r) => (
                            <div key={r.id} className="racer-list-item">
                                <div className="racer-avatar-preview">
                                    {r.imageBase64 ? (
                                        <img src={r.imageBase64} alt={r.name} />
                                    ) : (
                                        <span>{r.name}</span>
                                    )}
                                </div>
                                <span className="racer-name">{r.name}</span>
                                <label
                                    className="btn btn-secondary"
                                    style={{
                                        cursor: "pointer",
                                        margin: 0,
                                        padding: "6px 10px",
                                        fontSize: "12px",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "4px",
                                    }}
                                >
                                    <LuCamera /> Foto
                                    <input
                                        type="file"
                                        accept="image/*"
                                        style={{ display: "none" }}
                                        onChange={(e) => handleRacerImageUpload(r.id, e)}
                                    />
                                </label>
                                <button
                                    className="btn"
                                    style={{
                                        padding: "6px 10px",
                                        fontSize: "12px",
                                        margin: 0,
                                        background: "var(--danger-surface)",
                                        color: "var(--danger)",
                                    }}
                                    onClick={() => removeRacer(r.id)}
                                    title={`Hapus pembalap ${r.name}`}
                                    aria-label={`Hapus pembalap ${r.name}`}
                                >
                                    ✕
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Skrip integrasi moodle leaderboard */}
            <div className="countdown-config-card" style={{ flexDirection: "column", alignItems: "stretch", margin: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                    <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 600 }}>Setup Moodle Leaderboard</h3>
                    <button
                        className="btn btn-secondary"
                        onClick={() => setShowScript(!showScript)}
                        style={{ padding: "4px 8px", fontSize: "11px", margin: 0 }}
                    >
                        {showScript ? "Sembunyikan" : "Tampilkan Script"}
                    </button>
                </div>

                {showScript && (
                    <p style={{ margin: "0 0 12px 0", fontSize: "13px", color: "var(--text-muted)" }}>
                        Copy script di bawah ini, lalu buka halaman grading Moodle. Buka Developer Console (F12, pilih tab Console), paste, lalu tekan Enter.
                    </p>
                )}

                <div style={{ position: "relative", background: "var(--bg-body)", padding: "12px", minHeight: "48px", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
                    {showScript ? (
                        <pre style={{ margin: 0, fontSize: "11px", overflowX: "auto", color: "var(--text-secondary)", paddingRight: "80px" }}>
                            {generateScript()}
                        </pre>
                    ) : (
                        <div style={{ fontSize: "12px", color: "var(--text-muted)", paddingTop: "4px" }}>
                            Script tersembunyi. Klik "Tampilkan Script" atau langsung Copy.
                        </div>
                    )}
                    <button
                        className="btn btn-secondary"
                        onClick={copyScript}
                        style={{ position: "absolute", top: "8px", right: "8px", padding: "6px 10px", fontSize: "12px", display: "flex", alignItems: "center", gap: "4px" }}
                        aria-label="Salin script Moodle"
                    >
                        {isCopied ? <><LuCheck style={{ color: "var(--success)" }} /> Copied</> : <><LuCopy /> Copy</>}
                    </button>
                </div>

                <div style={{ marginTop: "8px", fontSize: "12px", color: "var(--text-muted)", textAlign: "right" }}>
                    credit to{" "}
                    <a
                        href="https://github.com/rafiathallah"
                        target="_blank"
                        rel="noreferrer"
                        style={{ fontFamily: 'Consolas, "Courier New", monospace', color: "var(--accent)", textDecoration: "none", fontWeight: 600 }}
                    >
                        @rafiathallah
                    </a>
                </div>
            </div>

            {/* Live Leaderboard Table */}
            <LeaderboardView room={kelas} students={eligibleStudents} />
        </div>
    );
}
