import { useState, useEffect } from "react";
import { Icons } from "../../components/Icons";
import { EmptyState } from "../../components/ui/EmptyState";
import { LoadingState } from "../../components/ui/LoadingState";
import { Badge } from "../../components/ui/Badge";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { 
  getAllDataRm, 
  searchDataRm, 
  MasterDataRmRow 
} from "../../lib/database/dataRmService";

export function MasterDataRm({ onNavigate }: { onNavigate: (page: string, nomorRm?: string) => void }) {
  const [data, setData] = useState<MasterDataRmRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [keyword, setKeyword] = useState("");

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

  return (
    <div className="card p-6">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Icons.DataRM />
          <h2 style={{ margin: 0 }}>Master Data RM</h2>
        </div>
        {/* Placeholder if we ever want to add "New RM" button, left empty per requirement */}
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
                    <Button 
                      variant="secondary" 
                      onClick={() => onNavigate('riwayat-rm', row.nomorRm)}
                    >
                      Buka Riwayat
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
