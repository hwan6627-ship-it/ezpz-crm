import { DEFAULT_ACCOUNTS } from './constants';

let _cachedAccounts = null;

/**
 * 계정 목록 로드
 */
export const loadAccounts = () => {
  if (_cachedAccounts) return _cachedAccounts;
  try {
    const s = localStorage.getItem('ezpz_accounts');
    if (s) {
      const parsed = JSON.parse(s);
      if (Array.isArray(parsed) && parsed.length > 0) {
        if (!parsed.some((a) => a.loginId === 'admin')) {
          parsed.unshift(DEFAULT_ACCOUNTS[0]);
        }
        _cachedAccounts = parsed;
        return parsed;
      }
    }
  } catch (e) {
    // ignore
  }
  _cachedAccounts = [...DEFAULT_ACCOUNTS];
  return _cachedAccounts;
};

/**
 * 계정 목록 저장
 */
export const saveAccounts = (a) => {
  _cachedAccounts = a;
  try {
    localStorage.setItem('ezpz_accounts', JSON.stringify(a));
  } catch (e) {
    // ignore
  }
};
