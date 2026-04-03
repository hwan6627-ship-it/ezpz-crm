import { useMemo } from 'react';
import { CRM_STATUSES, FIRST_FILTERS } from '../utils/constants';
import { pct, getWeek, weekLabel, getCrmBadgeClass, getFilterBadgeClass } from '../utils/helpers';

function Dashboard({ customers }) {
  const M = useMemo(() => {
    const c = customers;
    const t = c.length;
    const eO = c.filter((x) => x.ezpzStatus === '견적만 완료').length;
    const eC = c.filter((x) => x.ezpzStatus === '견적+상담신청').length;
    const dr = c.filter((x) => x.ezpzStatus === '직접상담신청').length;
    const co = eC + dr;
    const rg = c.filter((x) => x.crmStatus !== '미등록').length;
    const ur = c.filter((x) => x.crmStatus === '미등록').length;
    const vi = c.filter((x) => ['방문완료', '계약완료'].includes(x.crmStatus)).length;

    const cb = {};
    CRM_STATUSES.filter((s) => s !== '전체').forEach((s) => {
      cb[s] = c.filter((x) => x.crmStatus === s).length;
    });

    const fb = {};
    FIRST_FILTERS.filter((s) => s !== '전체').forEach((s) => {
      fb[s] = c.filter((x) => x.firstFilter === s).length;
    });

    const wm = {};
    c.forEach((x) => {
      const w = getWeek(x.ezpzDate);
      if (w) {
        if (!wm[w]) wm[w] = { total: 0, consult: 0, direct: 0 };
        wm[w].total++;
        if (x.ezpzStatus === '견적+상담신청') wm[w].consult++;
        else if (x.ezpzStatus === '직접상담신청') wm[w].direct++;
      }
    });

    return { total: t, eO, eC, dr, co, rg, ur, vi, cb, fb, wm };
  }, [customers]);

  const summaryCards = [
    { l: '총 고객', n: M.total, s: '명', bg: 'linear-gradient(135deg,#475569,#1e293b)' },
    { l: '상담 신청', n: M.co, s: pct(M.co, M.total), bg: 'linear-gradient(135deg,#3b82f6,#1d4ed8)' },
    { l: 'CRM 등록', n: M.rg, s: pct(M.rg, M.total), bg: 'linear-gradient(135deg,#10b981,#059669)' },
    { l: 'CRM 미등록', n: M.ur, s: pct(M.ur, M.total), bg: 'linear-gradient(135deg,#f87171,#dc2626)' },
    { l: '방문완료+', n: M.vi, s: '명', bg: 'linear-gradient(135deg,#8b5cf6,#6d28d9)' },
  ];

  const base = M.total || 1;
  const funnelData = [
    { step: '1. 총 고객', cnt: M.total, w: '100%', c: '#3b82f6' },
    { step: '2. 상담 신청', cnt: M.co, w: Math.max(M.co / base * 100, M.co > 0 ? 4 : 0) + '%', c: '#6366f1' },
    { step: '3. CRM 등록', cnt: M.rg, w: Math.max(M.rg / base * 100, M.rg > 0 ? 4 : 0) + '%', c: '#8b5cf6' },
    { step: '4. 방문완료+', cnt: M.vi, w: Math.max(M.vi / base * 100, M.vi > 0 ? 4 : 0) + '%', c: '#10b981' },
  ];

  return (
    <>
      {/* 상단 요약 카드 */}
      <div className="dash-grid dr5">
        {summaryCards.map((m, i) => (
          <div key={i} className="card mb">
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
              <span style={{
                background: m.bg, width: 28, height: 28, borderRadius: 8,
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontSize: 11, fontWeight: 800
              }}>
                {i + 1}
              </span>
            </div>
            <div className="num">{m.n}</div>
            <div className="lbl">{m.l}</div>
            <div className="sub">{m.s}</div>
          </div>
        ))}
      </div>

      {/* 퍼널 + EZPZ 상태 분포 */}
      <div className="dash-grid dr2" style={{ marginBottom: 16 }}>
        <div className="card">
          <div className="card-title">고객 유입 퍼널</div>
          {funnelData.map((f, i) => (
            <div key={i} className="fr">
              <div className="fs">{f.step}</div>
              <div className="fbw">
                <div className="fb" style={{ width: f.w, background: f.c }}></div>
              </div>
              <div className="fn">{f.cnt}<span className="p">{pct(f.cnt, M.total)}</span></div>
            </div>
          ))}
        </div>

        <div className="card">
          <div className="card-title">EZPZ 상태 분포 (전체 {M.total}건)</div>
          <table className="st">
            <thead><tr><th>상태</th><th>건수</th><th>비율</th></tr></thead>
            <tbody>
              <tr><td><span className="badge be0">견적만 완료</span></td><td>{M.eO}건</td><td>{pct(M.eO, M.total)}</td></tr>
              <tr><td><span className="badge be1">견적+상담신청</span></td><td>{M.eC}건</td><td>{pct(M.eC, M.total)}</td></tr>
              <tr><td><span className="badge be2">직접상담신청</span></td><td>{M.dr}건</td><td>{pct(M.dr, M.total)}</td></tr>
            </tbody>
          </table>
          <div className="card-title" style={{ marginTop: 20 }}>CRM 등록 현황</div>
          <table className="st">
            <tbody>
              <tr><td>CRM 등록</td><td style={{ fontWeight: 700 }}>{M.rg}건 ({pct(M.rg, M.total)})</td></tr>
              <tr><td>CRM 미등록</td><td style={{ fontWeight: 700, color: 'var(--red)' }}>{M.ur}건 ({pct(M.ur, M.total)})</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* CRM 진행상태 + 1차 필터링 */}
      <div className="dash-grid dr2" style={{ marginBottom: 16 }}>
        <div className="card">
          <div className="card-title">CRM 진행상태 상세</div>
          <table className="st">
            <thead><tr><th>상태</th><th>건수</th></tr></thead>
            <tbody>
              {Object.entries(M.cb)
                .filter(([, v]) => v > 0)
                .sort((a, b) => b[1] - a[1])
                .map(([k, v]) => (
                  <tr key={k}><td><span className={getCrmBadgeClass(k)}>{k}</span></td><td>{v}건</td></tr>
                ))}
            </tbody>
          </table>
        </div>

        <div className="card">
          <div className="card-title">1차 필터링 현황</div>
          <table className="st">
            <thead><tr><th>구분</th><th>건수</th><th>비율</th></tr></thead>
            <tbody>
              {Object.entries(M.fb)
                .filter(([, v]) => v > 0)
                .sort((a, b) => b[1] - a[1])
                .map(([k, v]) => (
                  <tr key={k}>
                    <td><span className={getFilterBadgeClass(k)}>{k}</span></td>
                    <td>{v}건</td>
                    <td>{pct(v, M.total)}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 주차별 추이 */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-title">주차별 추이</div>
        <div className="dash-grid dr3" style={{ marginBottom: 0 }}>
          {Object.entries(M.wm)
            .sort((a, b) => a[0] - b[0])
            .map(([w, d]) => {
              const r = d.total > 0 ? ((d.consult + d.direct) / d.total * 100).toFixed(1) : 0;
              return (
                <div key={w} className="card wc" style={{ border: '1px solid #f1f5f9' }}>
                  <div className="wl">{weekLabel(+w)}</div>
                  <div className="wn">{d.total}</div>
                  <div className="wnl">전체 건수</div>
                  <div className="wd"><span>상담신청 {d.consult + d.direct}건</span></div>
                  <div className={`wr ${+r >= 20 ? 'ru' : +r >= 15 ? 'rn' : 'rd'}`}>
                    상담전환율 {r}%
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </>
  );
}

export default Dashboard;
