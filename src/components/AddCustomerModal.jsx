import { EZPZ_STATUSES, CRM_STATUSES, FIRST_FILTERS } from '../utils/constants';

function AddCustomerModal({ addForm, setAddForm, onAdd, onClose }) {
  return (
    <div className="ov" onClick={onClose}>
      <div className="smod" onClick={(e) => e.stopPropagation()}>
        <h3>신규 고객 등록</h3>

        <div className="ar">
          <div className="arf">
            <label>고객명 *</label>
            <input
              value={addForm.name}
              onChange={(e) => setAddForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="홍길동"
            />
          </div>
          <div className="arf">
            <label>연락처</label>
            <input
              value={addForm.phone}
              onChange={(e) => setAddForm((p) => ({ ...p, phone: e.target.value }))}
              placeholder="010-1234-5678"
            />
          </div>
        </div>

        <div className="ar">
          <div className="arf">
            <label>주소</label>
            <input
              value={addForm.address}
              onChange={(e) => setAddForm((p) => ({ ...p, address: e.target.value }))}
              placeholder="서울 강남구 테헤란로 123"
            />
          </div>
          <div className="arf">
            <label>담당자</label>
            <input
              value={addForm.assignee}
              onChange={(e) => setAddForm((p) => ({ ...p, assignee: e.target.value }))}
              placeholder="담당자명"
            />
          </div>
        </div>

        <div className="ar">
          <div className="arf">
            <label>EZPZ 상태</label>
            <select
              value={addForm.ezpzStatus}
              onChange={(e) => setAddForm((p) => ({ ...p, ezpzStatus: e.target.value }))}
            >
              {EZPZ_STATUSES.filter((s) => s !== '전체').map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>
          <div className="arf">
            <label>CRM 상태</label>
            <select
              value={addForm.crmStatus}
              onChange={(e) => setAddForm((p) => ({ ...p, crmStatus: e.target.value }))}
            >
              {CRM_STATUSES.filter((s) => s !== '전체').map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="ar">
          <div className="arf">
            <label>1차 필터링</label>
            <select
              value={addForm.firstFilter}
              onChange={(e) => setAddForm((p) => ({ ...p, firstFilter: e.target.value }))}
            >
              {FIRST_FILTERS.filter((s) => s !== '전체').map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="afoot">
          <button className="bgh" onClick={onClose}>취소</button>
          <button className="btn bp" disabled={!addForm.name.trim()} onClick={onAdd}>등록</button>
        </div>
      </div>
    </div>
  );
}

export default AddCustomerModal;
