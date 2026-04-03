import { EZPZ_STATUSES, CRM_STATUSES, FIRST_FILTERS } from '../utils/constants';
import { getEzpzBadgeClass, getCrmBadgeClass, shortAddr, weekLabel } from '../utils/helpers';

function CustomerTable({
  filtered,
  search, setSearch,
  fE, setFE,
  fC, setFC,
  fF, setFF,
  fW, setFW,
  wList,
  sF, sD,
  tgSort,
  upd,
  onSelectCustomer,
  onShowAdd,
  onShowBulk,
  downloadCSV,
}) {
  const sArr = (f) => {
    if (sF !== f) return <span style={{ marginLeft: 4, fontSize: 10, color: '#cbd5e1' }}>&#8597;</span>;
    return <span style={{ marginLeft: 4, fontSize: 10, color: 'var(--blue)' }}>{sD === 'asc' ? '\u2191' : '\u2193'}</span>;
  };

  const columns = [
    { k: 'name', l: '고객명' },
    { k: 'phone', l: '연락처' },
    { k: 'address', l: '주소' },
    { k: 'ezpzStatus', l: 'EZPZ상태' },
    { k: 'firstFilter', l: '1차필터링' },
    { k: 'ezpzDate', l: '유입일시' },
    { k: 'crmStatus', l: 'CRM상태' },
    { k: 'assignee', l: '담당자' },
    { k: 'updatedAt', l: '최종업데이트' },
    { k: 'estimateCount', l: '견적' },
    { k: '_a', l: '액션' },
  ];

  return (
    <>
      {/* 툴바 */}
      <div className="tb">
        <div className="sb">
          <input
            placeholder="고객명, 연락처, 주소 검색..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="fg">
          <label>EZPZ</label>
          <select value={fE} onChange={(e) => setFE(e.target.value)}>
            {EZPZ_STATUSES.map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div className="fg">
          <label>CRM</label>
          <select value={fC} onChange={(e) => setFC(e.target.value)}>
            {CRM_STATUSES.map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div className="fg">
          <label>1차필터</label>
          <select value={fF} onChange={(e) => setFF(e.target.value)}>
            {FIRST_FILTERS.map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div className="fg">
          <label>주차</label>
          <select value={fW} onChange={(e) => setFW(e.target.value)}>
            {wList.map((s) => (
              <option key={s} value={s}>{s === '전체' ? '전체' : weekLabel(+s)}</option>
            ))}
          </select>
        </div>
        <span className="cb">{filtered.length}건</span>
        <button className="btn bp" onClick={onShowAdd}>+ 신규 등록</button>
        <button className="btn bo" onClick={onShowBulk}>대량 등록</button>
        <button className="btn bg" onClick={downloadCSV}>CSV 다운로드</button>
      </div>

      {/* 테이블 */}
      <div className="tw">
        <div className="ts">
          <table className="mt">
            <thead>
              <tr>
                <th style={{ cursor: 'default', width: 40, textAlign: 'center' }}>NO</th>
                {columns.map((c) => (
                  <th
                    key={c.k}
                    onClick={() => c.k !== '_a' && tgSort(c.k)}
                    style={c.k === '_a' ? { cursor: 'default' } : {}}
                  >
                    {c.l}{c.k !== '_a' && sArr(c.k)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((c, idx) => (
                <tr key={c.id} onClick={() => onSelectCustomer(c)}>
                  <td className="no-col">{idx + 1}</td>
                  <td className="cn">{c.name}</td>
                  <td className="cp">{c.phone}</td>
                  <td>
                    <span className="tip" data-tip={c.address}>{shortAddr(c.address)}</span>
                  </td>
                  <td>
                    <span className={getEzpzBadgeClass(c.ezpzStatus)}>{c.ezpzStatus}</span>
                  </td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <select
                      value={c.firstFilter}
                      onChange={(e) => upd(c.id, { firstFilter: e.target.value })}
                      style={{
                        padding: '2px 6px', border: '1px solid #e2e8f0',
                        borderRadius: 6, fontSize: 11, background: '#fff', cursor: 'pointer',
                      }}
                    >
                      {FIRST_FILTERS.filter((s) => s !== '전체').map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                  </td>
                  <td className="cd">{c.ezpzDate}</td>
                  <td><span className={getCrmBadgeClass(c.crmStatus)}>{c.crmStatus}</span></td>
                  <td>{c.assignee || <span className="ce">-</span>}</td>
                  <td className="cd">{c.updatedAt?.slice(5) || ''}</td>
                  <td style={{ textAlign: 'center' }}>{c.estimateCount}</td>
                  <td style={{ textAlign: 'center' }}>
                    <span className={`ac ${(c.actions?.length || 0) > 0 ? 'ay' : 'an'}`}>
                      {c.actions?.length || 0}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text4)' }}>
            검색 결과가 없습니다
          </div>
        )}
      </div>
    </>
  );
}

export default CustomerTable;
