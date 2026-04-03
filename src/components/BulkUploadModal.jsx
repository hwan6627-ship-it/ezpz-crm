import { useState, useRef } from 'react';
import { EZPZ_STATUSES, CRM_STATUSES } from '../utils/constants';
import { now, parseCSVText } from '../utils/helpers';

function BulkUploadModal({ onAdd, onClose }) {
  const [step, setStep] = useState('upload');
  const [parsed, setParsed] = useState([]);
  const [fname, setFname] = useState('');
  const fRef = useRef(null);

  const dlTemplate = () => {
    const h = ['고객명', '연락처', '주소', 'EZPZ상태', 'CRM상태', '담당자', '유입일시'];
    const ex = ['홍길동', '010-1234-5678', '서울 강남구 테헤란로 123', '견적만 완료', '미등록', '', '2026-04-03 14:30'];
    const bom = '\uFEFF';
    const csv = bom + [h, ex].map((r) => r.map((v) => '"' + v + '"').join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ezpz_bulk_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const onFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFname(f.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target.result;
      let rows;
      if (f.name.endsWith('.csv')) {
        rows = parseCSVText(text);
      } else {
        rows = text
          .split('\n')
          .filter((l) => l.trim())
          .map((line) => {
            const p = line.includes('\t') ? line.split('\t') : line.split(',');
            return {
              고객명: (p[0] || '').trim(),
              연락처: (p[1] || '').trim(),
              주소: (p[2] || '').trim(),
              EZPZ상태: (p[3] || '견적만 완료').trim(),
              CRM상태: (p[4] || '미등록').trim(),
              담당자: (p[5] || '').trim(),
              유입일시: (p[6] || '').trim(),
            };
          });
      }
      const mapped = rows
        .map((r) => ({
          name: r['고객명'] || r['이름'] || '',
          phone: r['연락처'] || r['전화번호'] || '',
          address: r['주소'] || '',
          ezpzStatus: r['EZPZ상태'] || '견적만 완료',
          crmStatus: r['CRM상태'] || '미등록',
          assignee: r['담당자'] || '',
          ezpzDate: r['유입일시'] || '',
        }))
        .filter((r) => r.name.trim());
      setParsed(mapped);
      if (mapped.length > 0) setStep('preview');
    };
    reader.readAsText(f, 'UTF-8');
  };

  const register = () => {
    const ts = now();
    const nc = parsed.map((r, i) => ({
      id: Date.now() + i,
      name: r.name,
      phone: r.phone,
      address: r.address,
      ezpzStatus: EZPZ_STATUSES.slice(1).includes(r.ezpzStatus) ? r.ezpzStatus : '견적만 완료',
      crmStatus: CRM_STATUSES.slice(1).includes(r.crmStatus) ? r.crmStatus : '미등록',
      assignee: r.assignee,
      estimateCount: 1,
      firstFilter: '미진행',
      ezpzDate: r.ezpzDate || ts,
      updatedAt: ts,
      actions: [],
    }));
    onAdd(nc);
    onClose();
  };

  return (
    <div className="ov" onClick={onClose}>
      <div className="smod" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 640 }}>
        <h3>대량 고객 등록</h3>

        {step === 'upload' && (
          <>
            <p>CSV 템플릿을 다운로드한 후, 고객 정보를 입력하여 업로드하세요.</p>
            <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
              <button className="btn bo" onClick={dlTemplate}>템플릿 다운로드 (.csv)</button>
            </div>
            <div className="drop-zone" onClick={() => fRef.current?.click()}>
              <div style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 8 }}>
                파일을 클릭하여 선택하세요
              </div>
              <div style={{ fontSize: 11, color: 'var(--text4)' }}>
                CSV, TXT 파일 지원 (탭/쉼표 구분)
              </div>
              <input ref={fRef} type="file" accept=".csv,.txt" onChange={onFile} style={{ display: 'none' }} />
            </div>
            <div className="afoot">
              <button className="bgh" onClick={onClose}>취소</button>
            </div>
          </>
        )}

        {step === 'preview' && (
          <>
            <p>
              {fname} - <b>{parsed.length}명</b> 감지됨. 아래 내용 확인 후 등록해 주세요.
            </p>
            <div className="preview-table">
              <table className="mt" style={{ fontSize: 11 }}>
                <thead>
                  <tr>
                    <th style={{ width: 30 }}>NO</th>
                    <th>고객명</th>
                    <th>연락처</th>
                    <th>주소</th>
                    <th>EZPZ상태</th>
                    <th>CRM상태</th>
                    <th>담당자</th>
                    <th>유입일시</th>
                  </tr>
                </thead>
                <tbody>
                  {parsed.map((r, i) => (
                    <tr key={i}>
                      <td style={{ textAlign: 'center', color: 'var(--text4)' }}>{i + 1}</td>
                      <td className="cn">{r.name}</td>
                      <td className="cp">{r.phone}</td>
                      <td style={{ fontSize: 11, maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {r.address}
                      </td>
                      <td>{r.ezpzStatus}</td>
                      <td>{r.crmStatus}</td>
                      <td>{r.assignee || '-'}</td>
                      <td className="cd">{r.ezpzDate || <span style={{ color: 'var(--text4)' }}>자동생성</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="afoot">
              <button className="bgh" onClick={() => { setStep('upload'); setParsed([]); setFname(''); }}>
                다시 선택
              </button>
              <button className="btn bp" onClick={register}>{parsed.length}명 일괄 등록</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default BulkUploadModal;
