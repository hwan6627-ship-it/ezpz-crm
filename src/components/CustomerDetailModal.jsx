import { useState, useRef } from 'react';
import { EZPZ_STATUSES, CRM_STATUSES, FIRST_FILTERS, ACTION_TYPES } from '../utils/constants';
import { getEzpzBadgeClass, getCrmBadgeClass, getFilterBadgeClass, now } from '../utils/helpers';
import { insertAction, updateAction, deleteAction } from '../utils/supabase';

function CustomerDetailModal({ sel, upd, onClose, onReload }) {
  const [showAF, setShowAF] = useState(false);
  const [editCrm, setEditCrm] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({});
  const [newAct, setNewAct] = useState({ type: '전화', note: '', author: '', file: null, filePreview: null });
  const [eaIdx, setEaIdx] = useState(null);
  const [eaNote, setEaNote] = useState('');
  const [previewImg, setPreviewImg] = useState(null);
  const fileRef = useRef(null);

  const startEdit = () => {
    setEditData({
      name: sel.name,
      phone: sel.phone,
      address: sel.address,
      ezpzStatus: sel.ezpzStatus,
      crmStatus: sel.crmStatus,
      assignee: sel.assignee,
      firstFilter: sel.firstFilter,
      estimateCount: sel.estimateCount,
    });
    setEditMode(true);
  };

  const saveEdit = () => {
    upd(sel.id, editData);
    setEditMode(false);
  };

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setNewAct((p) => ({
        ...p,
        file: { name: f.name, type: f.type, data: ev.target.result },
        filePreview: f.type.startsWith('image/') ? ev.target.result : null,
      }));
    };
    reader.readAsDataURL(f);
  };

  const addActionHandler = async () => {
    if (!newAct.note.trim()) return;
    await insertAction(sel.id, {
      type: newAct.type,
      note: newAct.note,
      author: newAct.author,
      file: newAct.file || null,
    });
    setNewAct({ type: '전화', note: '', author: '', file: null, filePreview: null });
    setShowAF(false);
    if (onReload) await onReload();
  };

  const delActionHandler = async (idx) => {
    const action = sel.actions[idx];
    if (action && action.dbId) {
      await deleteAction(action.dbId);
    }
    // fallback: 로컬에서도 제거
    const updated = sel.actions.filter((_, i) => i !== idx);
    upd(sel.id, { actions: updated });
    setEaIdx(null);
    if (onReload) await onReload();
  };

  const saveEditActHandler = async () => {
    if (eaIdx === null) return;
    const action = sel.actions[eaIdx];
    if (action && action.dbId) {
      await updateAction(action.dbId, eaNote);
    }
    const updated = sel.actions.map((a, i) => (i === eaIdx ? { ...a, note: eaNote } : a));
    upd(sel.id, { actions: updated });
    setEaIdx(null);
    if (onReload) await onReload();
  };

  return (
    <>
      <div className="ov">
        <div className="modal" onClick={(e) => e.stopPropagation()}>
          {/* 헤더 */}
          <div className="mh">
            <div className="mh-l">
              <div className="av">{sel.name.charAt(0)}</div>
              <div>
                <div className="mn">{sel.name}</div>
                <div className="ms">{sel.phone}</div>
              </div>
            </div>
            <button className="xb" onClick={onClose}>x</button>
          </div>

          {/* 수정 버튼 */}
          <div className="ebar">
            {!editMode ? (
              <button className="btn bo bs" onClick={startEdit}>정보 수정</button>
            ) : (
              <>
                <button className="btn bgh bs" onClick={() => setEditMode(false)}>취소</button>
                <button className="btn bp bs" onClick={saveEdit}>저장</button>
              </>
            )}
          </div>

          {/* 고객 상세 정보 */}
          <div className="mi">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <div className="il">고객명</div>
                {editMode ? (
                  <input value={editData.name} onChange={(e) => setEditData((p) => ({ ...p, name: e.target.value }))} />
                ) : (
                  <div className="iv">{sel.name}</div>
                )}
              </div>
              <div>
                <div className="il">연락처</div>
                {editMode ? (
                  <input value={editData.phone} onChange={(e) => setEditData((p) => ({ ...p, phone: e.target.value }))} />
                ) : (
                  <div className="iv">{sel.phone}</div>
                )}
              </div>
              <div>
                <div className="il">주소</div>
                {editMode ? (
                  <input value={editData.address} onChange={(e) => setEditData((p) => ({ ...p, address: e.target.value }))} />
                ) : (
                  <div className="iv" style={{ fontSize: 12, lineHeight: 1.4 }}>{sel.address}</div>
                )}
              </div>
              <div>
                <div className="il">EZPZ 상태</div>
                {editMode ? (
                  <select value={editData.ezpzStatus} onChange={(e) => setEditData((p) => ({ ...p, ezpzStatus: e.target.value }))}>
                    {EZPZ_STATUSES.filter((s) => s !== '전체').map((s) => <option key={s}>{s}</option>)}
                  </select>
                ) : (
                  <span className={getEzpzBadgeClass(sel.ezpzStatus)}>{sel.ezpzStatus}</span>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <div className="il">CRM 진행상태</div>
                {editMode ? (
                  <select value={editData.crmStatus} onChange={(e) => setEditData((p) => ({ ...p, crmStatus: e.target.value }))}>
                    {CRM_STATUSES.filter((s) => s !== '전체').map((s) => <option key={s}>{s}</option>)}
                  </select>
                ) : (
                  <>
                    <span className={getCrmBadgeClass(sel.crmStatus) + ' badge-click'} onClick={() => setEditCrm(true)}>
                      {sel.crmStatus}
                    </span>
                    {editCrm && (
                      <select
                        style={{ marginTop: 4, padding: '5px 8px', border: '1px solid var(--blue)', borderRadius: 8, fontSize: 12, width: '100%' }}
                        autoFocus
                        value={sel.crmStatus}
                        onChange={(e) => { upd(sel.id, { crmStatus: e.target.value }); setEditCrm(false); }}
                        onBlur={() => setEditCrm(false)}
                      >
                        {CRM_STATUSES.filter((s) => s !== '전체').map((s) => <option key={s}>{s}</option>)}
                      </select>
                    )}
                  </>
                )}
              </div>
              <div>
                <div className="il">담당자</div>
                {editMode ? (
                  <input value={editData.assignee} onChange={(e) => setEditData((p) => ({ ...p, assignee: e.target.value }))} placeholder="담당자명" />
                ) : (
                  <div className="iv">{sel.assignee || <span className="ce">미배정</span>}</div>
                )}
              </div>
              <div>
                <div className="il">1차 필터링</div>
                {editMode ? (
                  <select value={editData.firstFilter} onChange={(e) => setEditData((p) => ({ ...p, firstFilter: e.target.value }))}>
                    {FIRST_FILTERS.filter((s) => s !== '전체').map((s) => <option key={s}>{s}</option>)}
                  </select>
                ) : (
                  <span className={getFilterBadgeClass(sel.firstFilter)}>{sel.firstFilter}</span>
                )}
              </div>
              <div>
                <div className="il">최종 업데이트</div>
                <div className="iv">{sel.updatedAt}</div>
              </div>
            </div>
          </div>

          {/* 영업 히스토리 */}
          <div className="ma">
            <div className="mah">
              <span className="mat">영업 히스토리</span>
              <button className="btn bp bs" onClick={() => setShowAF(!showAF)}>+ 추가</button>
            </div>

            {showAF && (
              <div className="af">
                <div className="afr">
                  <div className="aff">
                    <label>유형</label>
                    <select value={newAct.type} onChange={(e) => setNewAct((p) => ({ ...p, type: e.target.value }))}>
                      {ACTION_TYPES.map((t) => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="aff">
                    <label>담당자</label>
                    <input value={newAct.author} onChange={(e) => setNewAct((p) => ({ ...p, author: e.target.value }))} placeholder="이름 입력" />
                  </div>
                </div>
                <div className="aff" style={{ marginBottom: 10 }}>
                  <label>메모</label>
                  <textarea
                    rows={2}
                    value={newAct.note}
                    onChange={(e) => setNewAct((p) => ({ ...p, note: e.target.value }))}
                    placeholder="통화 내용, 방문 결과 등을 기록하세요..."
                  />
                </div>
                <div className="aff" style={{ marginBottom: 10 }}>
                  <label>첨부파일</label>
                  <input ref={fileRef} type="file" accept="image/*,.pdf,.doc,.docx,.xlsx" onChange={handleFile} style={{ fontSize: 11 }} />
                  {newAct.filePreview && (
                    <img
                      src={newAct.filePreview}
                      className="thumb"
                      style={{ marginTop: 6 }}
                      onClick={() => setPreviewImg(newAct.filePreview)}
                    />
                  )}
                </div>
                <div className="afb">
                  <button className="bgh" onClick={() => { setShowAF(false); setNewAct({ type: '전화', note: '', author: '', file: null, filePreview: null }); }}>
                    취소
                  </button>
                  <button className="btn bp bs" disabled={!newAct.note.trim()} onClick={addActionHandler}>저장</button>
                </div>
              </div>
            )}

            <div className="tl">
              {(sel.actions?.length || 0) === 0 ? (
                <div className="tle">아직 기록된 히스토리가 없습니다</div>
              ) : (
                [...sel.actions].map((a, idx) => {
                  const rI = idx;
                  return eaIdx === rI ? (
                    <div key={rI} className="eaw">
                      <div style={{ display: 'flex', gap: 6, marginBottom: 6, fontSize: 11, color: 'var(--text3)' }}>
                        <b>{a.type}</b> &middot; {a.author || '-'} &middot; {a.date}
                      </div>
                      <textarea rows={2} value={eaNote} onChange={(e) => setEaNote(e.target.value)} />
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', marginTop: 6 }}>
                        <button className="bgh" style={{ fontSize: 11 }} onClick={() => setEaIdx(null)}>취소</button>
                        <button className="btn bp bx" onClick={saveEditActHandler}>저장</button>
                      </div>
                    </div>
                  ) : (
                    <div key={rI} className="tli">
                      <div className="tic">{rI + 1}</div>
                      <div style={{ flex: 1 }}>
                        <div className="tlm">
                          <span className="tltp">{a.type}</span>
                          {a.author && <span className="tlau">&middot; {a.author}</span>}
                        </div>
                        <div className="tln">{a.note}</div>
                        {a.file && a.file.type && a.file.type.startsWith('image/') && (
                          <img src={a.file.data} className="thumb" onClick={() => setPreviewImg(a.file.data)} />
                        )}
                        {a.file && a.file.type && !a.file.type.startsWith('image/') && (
                          <div style={{ fontSize: 10, color: 'var(--blue)', marginTop: 4 }}>{a.file.name}</div>
                        )}
                        <div className="tld">{a.date}</div>
                      </div>
                      <div className="tlb">
                        <button className="bgh" style={{ fontSize: 10, padding: '2px 6px' }} onClick={(e) => { e.stopPropagation(); setEaIdx(rI); setEaNote(a.note); }}>
                          수정
                        </button>
                        <button className="bdx" onClick={(e) => { e.stopPropagation(); if (confirm('삭제하시겠습니까?')) delActionHandler(rI); }}>
                          삭제
                        </button>
                      </div>
                    </div>
                  );
                }).reverse()
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 이미지 프리뷰 */}
      {previewImg && (
        <div className="ov" style={{ alignItems: 'center', zIndex: 60 }} onClick={() => setPreviewImg(null)}>
          <img
            src={previewImg}
            style={{ maxWidth: '90%', maxHeight: '80vh', borderRadius: 12, boxShadow: '0 20px 60px rgba(0,0,0,.3)' }}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}

export default CustomerDetailModal;
