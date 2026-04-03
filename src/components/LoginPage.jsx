import { useState, useEffect } from 'react';
import { loginCheck } from '../utils/supabase';

function LoginPage({ onLogin }) {
  const [id, setId] = useState('');
  const [pw, setPw] = useState('');
  const [err, setErr] = useState('');
  const [remember, setRemember] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // 페이지 로드 시 저장된 아이디/비밀번호 불러오기
  useEffect(() => {
    try {
      const saved = localStorage.getItem('ezpz_saved_login');
      if (saved) {
        const { loginId, password } = JSON.parse(saved);
        setId(loginId || '');
        setPw(password || '');
        setRemember(true);
      }
    } catch (e) {
      // ignore
    }
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    setIsLoading(true);
    try {
      const acc = await loginCheck(id, pw);
      if (acc) {
        handleRemember();
        onLogin(acc);
      } else {
        setErr('아이디 또는 비밀번호가 올바르지 않습니다.');
      }
    } catch (ex) {
      setErr('로그인 처리 중 오류가 발생했습니다.');
    }
    setIsLoading(false);
  };

  // 로그인 정보 저장/삭제
  const handleRemember = () => {
    try {
      if (remember) {
        localStorage.setItem('ezpz_saved_login', JSON.stringify({ loginId: id, password: pw }));
      } else {
        localStorage.removeItem('ezpz_saved_login');
      }
    } catch (e) {
      // ignore
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <div className="logo-box" style={{ margin: '0 auto 12px' }}>EZ</div>
          <h1>EZPZ 고객관리</h1>
          <p>창호 교체 무료견적 플랫폼 CRM</p>
        </div>
        <form onSubmit={submit}>
          <div className="login-field">
            <label>아이디</label>
            <input
              value={id}
              onChange={(e) => setId(e.target.value)}
              placeholder="아이디를 입력하세요"
              autoFocus
            />
          </div>
          <div className="login-field">
            <label>비밀번호</label>
            <input
              type="password"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              placeholder="비밀번호를 입력하세요"
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16 }}>
            <input
              type="checkbox"
              id="remember"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              style={{ width: 16, height: 16, cursor: 'pointer' }}
            />
            <label htmlFor="remember" style={{ fontSize: 12, color: '#64748b', cursor: 'pointer', userSelect: 'none' }}>
              아이디/비밀번호 저장
            </label>
          </div>
          {err && <div className="login-error">{err}</div>}
          <button type="submit" className="login-btn" disabled={!id || !pw || isLoading}>
            {isLoading ? '로그인 중...' : '로그인'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default LoginPage;
