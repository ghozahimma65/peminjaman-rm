import { useState, useEffect } from "react";
import { Icons } from "../../components/Icons";
import { EmptyState } from "../../components/ui/EmptyState";
import { LoadingState } from "../../components/ui/LoadingState";
import { Badge } from "../../components/ui/Badge";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { 
  createDataRm,
  getAllDataRm, 
  searchDataRm, 
  MasterDataRmRow 
} from "../../lib/database/dataRmService";

export function MasterDataRm({ onNavigate }: { onNavigate: (page: string, nomorRm?: string) => void }) {
  const [data, setData] = useState<MasterDataRmRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [keyword, setKeyword] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [selectedRow, setSelectedRow] = useState<MasterDataRmRow | null>(null);
  const [formError, setFormError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({
    nomorRm: "",
    namaPasien: "",
    nik: "",
    jenisKelamin: "Laki-laki",
    tanggalLahir: "",
    alamat: "",
  });

  const loadData = async (searchKeyword = "") => {
    setIsLoading(true);
    setErrorMsg("");
    try {
      if (searchKeyword.trim()) {
        const result = await searchDataRm(searchKeyword.trim());
        setData(result);
      } else {
        const result = await getAllDataRm();
        setData(result);
      }
    } catch (err: unknown) {
      setErrorMsg((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    
    async function fetchInitial() {
      setIsLoading(true);
      try {
        const result = await getAllDataRm();
        if (active) setData(result);
      } catch (err: unknown) {
        if (active) setErrorMsg((err as Error).message);
      } finally {
        if (active) setIsLoading(false);
      }
    }
    
    fetchInitial();
    
    return () => {
      active = false;
    };
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadData(keyword);
  };

  const handleReset = () => {
    setKeyword("");
    loadData("");
  };

  const openForm = () => {
    setForm({
      nomorRm: "",
      namaPasien: "",
      nik: "",
      jenisKelamin: "Laki-laki",
      tanggalLahir: "",
      alamat: "",
    });
    setFormError("");
    setShowForm(true);
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    const nomorRm = form.nomorRm.trim();
    const namaPasien = form.namaPasien.trim();
    const nik = form.nik.trim();
    const jenisKelamin = form.jenisKelamin.trim();
    const tanggalLahir = form.tanggalLahir.trim();
    const alamat = form.alamat.trim();

    if (!nomorRm || !namaPasien || !nik || !jenisKelamin || !tanggalLahir || !alamat) {
      setFormError("Semua field wajib diisi, termasuk NIK, jenis kelamin, tanggal lahir, dan alamat.");
      return;
    }

    setIsSaving(true);
    setFormError("");
    try {
      await createDataRm(nomorRm, namaPasien, nik, jenisKelamin, tanggalLahir, alamat);
      setShowForm(false);
      setShowSuccess(true);
      await loadData(keyword);
    } catch (err: unknown) {
      const message = (err as Error).message || "Data RM gagal disimpan.";
      setFormError(message.toLowerCase().includes("unique") || message.toLowerCase().includes("constraint")
        ? "Nomor RM sudah terdaftar. Gunakan nomor RM lain."
        : message);
    } finally {
      setIsSaving(false);
    }
  };

  const closeForm = () => {
    if (!isSaving) setShowForm(false);
  };

  return (
    <div className="card p-6">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Icons.DataRM />
          <h2 style={{ margin: 0 }}>Master Data RM</h2>
        </div>
        <Button type="button" onClick={openForm}>+ Tambah RM Baru</Button>
      </div>

      <form onSubmit={handleSearch} style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', marginBottom: '24px' }}>
        <div style={{ flex: 1, maxWidth: '400px' }}>
          <Input 
            label="Pencarian Data RM" 
            value={keyword} 
            onChange={e => setKeyword(e.target.value)} 
            placeholder="Cari Nomor RM atau Nama Pasien..."
          />
        </div>
        <div style={{ paddingBottom: '2px', display: 'flex', gap: '8px' }}>
          <Button type="submit" variant="primary" disabled={isLoading}>
            Cari
          </Button>
          {keyword && (
            <Button type="button" variant="secondary" onClick={handleReset} disabled={isLoading}>
              Reset
            </Button>
          )}
        </div>
      </form>

      {errorMsg && (
        <div style={{ padding: '12px', background: '#ffebee', color: '#c62828', borderRadius: '4px', marginBottom: '24px' }}>
          {errorMsg}
        </div>
      )}

      {isLoading ? (
        <LoadingState message="Memuat Master Data RM..." />
      ) : data.length === 0 ? (
        <EmptyState 
          icon={<Icons.DataRM />}
          title="Data RM Tidak Ditemukan"
          description={keyword ? `Tidak ada pasien yang cocok dengan pencarian "${keyword}".` : "Belum ada master data rekam medis terdaftar."}
          action={keyword ? <Button onClick={handleReset} variant="secondary">Hapus Pencarian</Button> : undefined}
        />
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e5e7eb', color: '#4b5563', fontSize: '14px' }}>
                <th style={{ padding: '12px' }}>Nomor RM</th>
                <th style={{ padding: '12px' }}>Nama Pasien</th>
                <th style={{ padding: '12px', textAlign: 'center' }}>Total Transaksi</th>
                <th style={{ padding: '12px', textAlign: 'right' }}>Aksi</th>
              </tr>
            </thead>
            <tbody style={{ fontSize: '14px' }}>
              {data.map(row => (
                <tr key={row.nomorRm} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '12px', fontWeight: 600 }}>{row.nomorRm}</td>
                  <td style={{ padding: '12px' }}>{row.namaPasien}</td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    {row.totalTransaksi > 0 ? (
                      <Badge variant="success">{row.totalTransaksi} Transaksi</Badge>
                    ) : (
                      <Badge variant="warning">0 Transaksi</Badge>
                    )}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                      <Button variant="ghost" onClick={() => setSelectedRow(row)}>Detail</Button>
                      <Button variant="secondary" onClick={() => onNavigate('riwayat-rm', row.nomorRm)}>Buka Riwayat</Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {(showForm || showSuccess || selectedRow) && (
        <div
          role="presentation"
          onMouseDown={event => {
            if (event.target === event.currentTarget && !isSaving) {
              setShowForm(false);
              setShowSuccess(false);
              setSelectedRow(null);
            }
          }}
          style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', background: 'rgba(15, 23, 42, 0.35)' }}
        >
          {showForm && (
            <form onSubmit={handleSave} style={{ width: '100%', maxWidth: '520px', padding: '28px', borderRadius: '16px', background: '#fff', boxShadow: '0 20px 50px rgba(15, 23, 42, 0.2)' }} onMouseDown={event => event.stopPropagation()}>
              <h3 style={{ marginBottom: '6px' }}>Tambah Rekam Medis Baru</h3>
              <p style={{ marginBottom: '24px' }}>Masukkan identitas dasar pasien untuk membuat nomor rekam medis.</p>
              <div style={{ display: 'grid', gap: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <Input label="Nomor RM" requiredIndicator value={form.nomorRm} onChange={event => setForm(current => ({ ...current, nomorRm: event.target.value }))} placeholder="Contoh: 01-24-0894" />
                  <Input label="NIK (16 Digit)" requiredIndicator value={form.nik} onChange={event => setForm(current => ({ ...current, nik: event.target.value }))} placeholder="16 digit NIK" />
                </div>

                <Input label="Nama Lengkap Pasien" requiredIndicator value={form.namaPasien} onChange={event => setForm(current => ({ ...current, namaPasien: event.target.value }))} placeholder="Masukkan nama pasien" />

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label>Jenis Kelamin <span style={{ color: '#dc2626' }}>*</span></label>
                    <select
                      value={form.jenisKelamin}
                      onChange={event => setForm(current => ({ ...current, jenisKelamin: event.target.value }))}
                      style={{ height: '42px', padding: '0 12px', borderRadius: '8px', border: '1px solid #d1d5db', background: '#fff' }}
                    >
                      <option value="Laki-laki">Laki-laki</option>
                      <option value="Perempuan">Perempuan</option>
                    </select>
                  </div>

                  <Input label="Tanggal Lahir" requiredIndicator type="date" value={form.tanggalLahir} onChange={event => setForm(current => ({ ...current, tanggalLahir: event.target.value }))} />
                </div>

                <Input label="Alamat" requiredIndicator value={form.alamat} onChange={event => setForm(current => ({ ...current, alamat: event.target.value }))} placeholder="Masukkan alamat lengkap" />
              </div>
              {formError && <div style={{ marginTop: '16px', padding: '12px', color: '#c62828', background: '#ffebee', borderRadius: '6px' }}>{formError}</div>}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '24px' }}>
                <Button type="button" variant="secondary" onClick={closeForm} disabled={isSaving}>Batal</Button>
                <Button type="submit" isLoading={isSaving}>Simpan RM</Button>
              </div>
            </form>
          )}

          {showSuccess && (
            <div style={{ width: '100%', maxWidth: '360px', padding: '32px 28px 28px', textAlign: 'center', borderRadius: '16px', background: '#fff', boxShadow: '0 20px 50px rgba(15, 23, 42, 0.2)' }} onMouseDown={event => event.stopPropagation()}>
              <div style={{ width: '56px', height: '56px', margin: '0 auto 16px', display: 'grid', placeItems: 'center', borderRadius: '50%', color: '#fff', background: '#16a34a', fontSize: '28px' }}>✓</div>
              <h3>Data Berhasil Disimpan</h3>
              <p style={{ marginTop: '8px' }}>Data RM baru telah berhasil ditambahkan dan tersimpan ke dalam sistem.</p>
              <Button type="button" className="mt-6 w-full" onClick={() => setShowSuccess(false)}>Selesai</Button>
            </div>
          )}

          {selectedRow && (
            <div style={{ width: '100%', maxWidth: '480px', padding: '28px', borderRadius: '16px', background: '#fff', boxShadow: '0 20px 50px rgba(15, 23, 42, 0.2)' }} onMouseDown={event => event.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
                <div><h3>Detail Rekam Medis</h3><p style={{ marginTop: '4px' }}>Informasi master pasien dan aktivitas berkas.</p></div>
                <Button type="button" variant="ghost" onClick={() => setSelectedRow(null)} aria-label="Tutup detail">×</Button>
              </div>
              <div style={{ marginTop: '24px', padding: '16px', borderRadius: '8px', background: '#f8fafc' }}>
                <strong style={{ display: 'block', color: '#2563eb', fontSize: '20px' }}>{selectedRow.nomorRm}</strong>
                <span style={{ color: '#64748b' }}>Nomor Rekam Medis</span>
              </div>
              <dl style={{ display: 'grid', gap: '12px', marginTop: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', borderBottom: '1px solid #e5e7eb', paddingBottom: '10px' }}><dt style={{ color: '#64748b' }}>Nama Pasien</dt><dd style={{ fontWeight: 600 }}>{selectedRow.namaPasien}</dd></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', borderBottom: '1px solid #e5e7eb', paddingBottom: '10px' }}><dt style={{ color: '#64748b' }}>NIK</dt><dd style={{ fontWeight: 600 }}>{selectedRow.nik || '-'}</dd></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', borderBottom: '1px solid #e5e7eb', paddingBottom: '10px' }}><dt style={{ color: '#64748b' }}>Jenis Kelamin</dt><dd style={{ fontWeight: 600 }}>{selectedRow.jenisKelamin || '-'}</dd></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', borderBottom: '1px solid #e5e7eb', paddingBottom: '10px' }}><dt style={{ color: '#64748b' }}>Tanggal Lahir</dt><dd style={{ fontWeight: 600 }}>{selectedRow.tanggalLahir ? new Date(selectedRow.tanggalLahir).toLocaleDateString('id-ID') : '-'}</dd></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px' }}><dt style={{ color: '#64748b' }}>Alamat</dt><dd style={{ fontWeight: 600, textAlign: 'right', maxWidth: '60%' }}>{selectedRow.alamat || '-'}</dd></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px' }}><dt style={{ color: '#64748b' }}>Total Transaksi</dt><dd style={{ fontWeight: 600 }}>{selectedRow.totalTransaksi} transaksi</dd></div>
              </dl>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '24px' }}>
                <Button type="button" variant="secondary" onClick={() => setSelectedRow(null)}>Tutup</Button>
                <Button type="button" onClick={() => onNavigate('riwayat-rm', selectedRow.nomorRm)}>Buka Riwayat</Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
