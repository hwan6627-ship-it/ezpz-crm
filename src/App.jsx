import { useState, useEffect, useMemo, useCallback } from 'react';
import { EZPZ_STATUSES, CRM_STATUSES, FIRST_FILTERS } from './utils/constants';
import { now, getWeek, weekLabel } from './utils/helpers';
import { fetchCustomers, insertCustomer, insertCustomersBulk, updateCustomer } from './utils/supabase';

import LoginPage from './components/LoginPage';
import AccountSettings from './components/AccountSettings';
import Dashboard from './components/Dashboard';
import CustomerTable from './components/CustomerTable';
import CustomerDetailModal from './components/CustomerDetailModal';
import AddCustomerModal from './components/AddCustomerModal';
import BulkUploadModal from './components/BulkUploadModal';

function App() {
  const [user, setUser] = useState(null);
  const [pg, setPg] = useState('dashboard');
  const [cust, setCust] = useState([]);
  const [loading, setLoading] = useState(true);

  // 필터 상태
  const [search, setSearch] = useState('');
  const [fE, setFE] = useState('전체');
  const [fC, setFC] = useState('전체');
  const [fF, setFF] = useState('전체');
  const [fW, setFW] = useState('전체');

  // 정렬 상태
  const [sF, setSF] = useState('ezpzDate');
  const [sD, setSD] = useState('desc');

  // 모달 상태
  const [sel, setSel] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [showBulk, setShowBulk] = useState(false);
  const [showAcct, setShowAcct] = useState(false);

  // 신규 등록 폼
  const [addForm, setAddForm] = useState({
    name: '', phone: '', address: '',
    ezpzStatus: '견적만 완료', crmStatus: '미등록', assignee: '', firstFilter: '미진행',
  });

  // DB에서 고객 데이터 불러오기
  const loadData = useCallback(async () => {
    setLoading(true);
    const data = await fetchCustomers();
    setCust(data);
    setLoading(false);
  }, []);

  // 로그인 후 데이터 로드
  useEffect(() => {
    if (user) loadData();
  }, [user, loadData]);

  const closeSel = () => setSel(null);

  // 주차 목록
  const wList = useMemo(() => {
    const ws = new Set();
    cust.forEach((c) => {
      const w = getWeek(c.ezpzDate);
      if (w) ws.add(w);
    });
    return ['전체', ...[...ws].sort((a, b) => a - b).map(String)];
  }, [cust]);

  // 필터링 + 정렬
  const filtered = useMemo(() => {
    let l = [...cust];
    if (search) {
      const q = search.toLowerCase();
      l = l.filter((c) => c.name.toLowerCase().includes(q) || c.phone.includes(q) || c.address.toLowerCase().includes(q));
    }
    if (fE !== '전체') l = l.filter((c) => c.ezpzStatus === fE);
    if (fC !== '전체') l = l.filter((c) => c.crmStatus === fC);
    if (fF !== '전체') l = l.filter((c) => c.firstFilter === fF);
    if (fW !== '전체') l = l.filter((c) => getWeek(c.ezpzDate) === +fW);
    l.sort((a, b) => {
      let va = a[sF] || '';
      let vb = b[sF] || '';
      if (sF === 'estimateCount') { va = +va; vb = +vb; }
      if (va < vb) return sD === 'asc' ? -1 : 1;
      if (va > vb) return sD === 'asc' ? 1 : -1;
      return 0;
    });
    return l;
  }, [cust, search, fE, fC, fF, fW, sF, sD]);

  // 정렬 토글
  const tgSort = (f) => {
    if (sF === f) setSD((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSF(f); setSD('desc'); }
  };

  // 고객 데이터 업데이트 (DB 연동)
  const upd = useCallback(async (id, u) => {
    const ts = now();
    // 화면 즉시 반영
    setCust((p) => p.map((c) => (c.id === id ? { ...c, ...u, updatedAt: ts } : c)));
    setSel((p) => (p?.id === id ? { ...p, ...u, updatedAt: ts } : p));
    // DB에 저장 (actions 제외)
    const dbUpdates = { ...u };
    delete dbUpdates.actions;
    await updateCustomer(id, dbUpdates);
  }, []);

  // CSV 다운로드
  const downloadCSV = () => {
    const h = ['NO', '고객명', '연락처', '주소', 'EZPZ상태', '1차필터링', '유입일시', 'CRM상태', '담당자', '최종업데이트', '견적수'];
    const rows = filtered.map((c, i) => [
      i + 1, c.name, c.phone, c.address, c.ezpzStatus, c.firstFilter,
      c.ezpzDate, c.crmStatus, c.assignee, c.updatedAt, c.estimateCount,
    ]);
    const bom = '\uFEFF';
    const csv = bom + [h, ...rows].map((r) => r.map((v) => '"' + (v || '').toString().replace(/"/g, '""') + '"').join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ezpz_customers_' + now().replace(/[: ]/g, '_') + '.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  // 신규 단건 등록 (DB 연동)
  const addSingle = async () => {
    if (!addForm.name.trim()) return;
    const result = await insertCustomer({
      ...addForm,
      estimateCount: 1,
    });
    if (result) {
      await loadData(); // DB에서 다시 불러오기
    }
    setAddForm({ name: '', phone: '', address: '', ezpzStatus: '견적만 완료', crmStatus: '미등록', assignee: '', firstFilter: '미진행' });
    setShowAdd(false);
  };

  // 대량 등록 (DB 연동)
  const addBulkItems = async (items) => {
    const dbItems = items.map((item) => ({
      name: item.name,
      phone: item.phone,
      address: item.address,
      ezpzStatus: item.ezpzStatus,
      ezpzDate: item.ezpzDate,
      crmStatus: item.crmStatus,
      assignee: item.assignee,
      estimateCount: item.estimateCount || 1,
      firstFilter: item.firstFilter || '미진행',
    }));
    await insertCustomersBulk(dbItems);
    await loadData(); // DB에서 다시 불러오기
  };

  // 로그인 전
  if (!user) return <LoginPage onLogin={setUser} />;

  const isAdmin = user.role === 'admin';

  return (
    <div>
      {/* 헤더 */}
      <header className="hd">
        <div className="hd-inner">
          <div className="logo-area">
            <div className="logo-box">EZ</div>
            <div className="logo-text">
              <h1>EZPZ 고객관리</h1>
              <p>창호 교체 무료견적 플랫폼 CRM</p>
            </div>
          </div>
          <div className="nav-tabs">
            <button className={`nav-tab ${pg === 'dashboard' ? 'active' : ''}`} onClick={() => setPg('dashboard')}>
              대시보드
            </button>
            <button className={`nav-tab ${pg === 'customers' ? 'active' : ''}`} onClick={() => setPg('customers')}>
              고객관리
            </button>
          </div>
          <div className="hd-right">
            <span className="user-info">{user.username}</span>
            {isAdmin && <button className="btn bo bs" onClick={() => setShowAcct(true)}>계정설정</button>}
            <button className="btn bgh" onClick={() => setUser(null)}>로그아웃</button>
          </div>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <div className="main">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8', fontSize: 14 }}>
            데이터를 불러오는 중...
          </div>
        ) : (
          <>
            {pg === 'dashboard' && <Dashboard customers={cust} />}

            {pg === 'customers' && (
              <CustomerTable
                filtered={filtered}
                search={search} setSearch={setSearch}
                fE={fE} setFE={setFE}
                fC={fC} setFC={setFC}
                fF={fF} setFF={setFF}
                fW={fW} setFW={setFW}
                wList={wList}
                sF={sF} sD={sD}
                tgSort={tgSort}
                upd={upd}
                onSelectCustomer={(c) => setSel(c)}
                onShowAdd={() => setShowAdd(true)}
                onShowBulk={() => setShowBulk(true)}
                downloadCSV={downloadCSV}
              />
            )}
          </>
        )}
      </div>

      {/* 고객 상세 모달 */}
      {sel && <CustomerDetailModal sel={sel} upd={upd} onClose={closeSel} onReload={loadData} />}

      {/* 신규 등록 모달 */}
      {showAdd && (
        <AddCustomerModal
          addForm={addForm}
          setAddForm={setAddForm}
          onAdd={addSingle}
          onClose={() => setShowAdd(false)}
        />
      )}

      {/* 대량 등록 모달 */}
      {showBulk && <BulkUploadModal onAdd={addBulkItems} onClose={() => setShowBulk(false)} />}

      {/* 계정 설정 모달 */}
      {showAcct && <AccountSettings onClose={() => setShowAcct(false)} />}
    </div>
  );
}

export default App;
