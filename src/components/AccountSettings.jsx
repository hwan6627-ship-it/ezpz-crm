import { useState, useEffect } from 'react';
import { fetchAccounts, insertAccount, deleteAccount } from '../utils/supabase';

function AccountSettings({ onClose }) {
  const [accounts, setAccounts] = useState([]);
  const [un, setUn] = useState('');
  const [li, setLi] = useState('');
  const [pw2, setPw2] = useState('');
  const [msg, setMsg] = useState('');

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    const data = await fetchAccounts();
    setAccounts(data);
  };

  const create = async () => {
    if (!un.trim() || !li.trim() || !pw2.trim()) {
      return setMsg('모든 필드를 입력해주세요.');
    }
    if (accounts.some((a) => a.loginId === li.trim())) {
      return setMsg('이미 존재하는 아이디입니다.');
    }
    const result = await insertAccount({
      username: un.trim(),
      loginId: li.trim(),
      password: pw2,
      role: 'user',
    });
    if (result) {
      setMsg('계정이 생성되었습니다.');
      setUn('');
      setLi('');
      setPw2('');
      await loadAccounts();
    } else {
      setMsg('계정 생성에 실패했습니다.');
    }
  };

  const del = async (lid) => {
    if (lid === 'admin') return setMsg('관리자 계정은 삭제할 수 없습니다.');
    if (!confirm(`"${lid}" 계정을 삭제하시겠습니까?`)) return;
    await deleteAccount(lid);
    await loadAccounts();
  };

  return (
    <div className="ov" onClick={onClose}>
      <div className="smod" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 560 }}>
        <h3>계정 설정</h3>
        <p>관리자만 계정을 생성하고 관리할 수 있습니다.</p>

        <div style={{ marginBottom: 20 }}>
          <div className="card-title" style={{ marginBottom: 10 }}>신규 계정 생성</div>
          <div className="ar">
            <div className="arf">
              <label>사용자 이름</label>
              <input value={un} onChange={(e) => setUn(e.target.value)} placeholder="홍길동" />
            </div>
            <div className="arf">
              <label>아이디</label>
              <input value={li} onChange={(e) => setLi(e.target.value)} placeholder="user01" />
            </div>
          </div>
          <div className="ar">
            <div className="arf">
              <label>비밀번호</label>
              <input type="password" value={pw2} onChange={(e) => setPw2(e.target.value)} placeholder="비밀번호" />
            </div>
            <div className="arf" style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button className="btn bp" onClick={create}>계정 생성</button>
            </div>
          </div>
          {msg && (
            <div style={{ fontSize: 12, color: msg.includes('생성') ? '#059669' : '#dc2626', marginTop: 6 }}>
              {msg}
            </div>
          )}
        </div>

        <div>
          <div className="card-title" style={{ marginBottom: 10 }}>계정 목록</div>
          <table className="st" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th>사용자</th>
                <th>아이디</th>
                <th>역할</th>
                <th style={{ textAlign: 'right' }}>관리</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((a) => (
                <tr key={a.loginId}>
                  <td>{a.username}</td>
                  <td>{a.loginId}</td>
                  <td>
                    <span className={`badge ${a.role === 'admin' ? 'be1' : 'be0'}`}>
                      {a.role === 'admin' ? '관리자' : '사용자'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    {a.loginId !== 'admin' && (
                      <button className="bdx" onClick={() => del(a.loginId)}>삭제</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="afoot">
          <button className="btn bo" onClick={onClose}>닫기</button>
        </div>
      </div>
    </div>
  );
}

export default AccountSettings;
