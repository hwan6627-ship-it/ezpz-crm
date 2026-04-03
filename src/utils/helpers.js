import { WEEK_START_DATE } from './constants';

/**
 * 현재 날짜/시간을 "YYYY-MM-DD HH:mm" 형식으로 반환
 */
export const now = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

/**
 * EZPZ 상태에 따른 배지 CSS 클래스 반환
 */
export const getEzpzBadgeClass = (status) => {
  if (status === '견적+상담신청') return 'badge be1';
  if (status === '직접상담신청') return 'badge be2';
  return 'badge be0';
};

/**
 * CRM 상태에 따른 배지 CSS 클래스 반환
 */
export const getCrmBadgeClass = (status) => `badge bc-${status}`;

/**
 * 1차필터링 상태에 따른 배지 CSS 클래스 반환
 */
export const getFilterBadgeClass = (status) => `badge bf-${status}`;

/**
 * 날짜 문자열로부터 주차 번호 계산
 */
export const getWeek = (dateStr) => {
  if (!dateStr) return null;
  const d = new Date(dateStr.replace(' ', 'T'));
  const s = new Date(WEEK_START_DATE);
  const diff = Math.floor((d - s) / 864e5);
  return diff < 0 ? null : Math.floor(diff / 7) + 1;
};

/**
 * 주차 번호에 대한 레이블 반환
 */
export const weekLabel = (w) => {
  const s = new Date(WEEK_START_DATE);
  s.setDate(s.getDate() + (w - 1) * 7);
  const e = new Date(s);
  e.setDate(e.getDate() + 6);
  return `${w}주차 (${s.getMonth() + 1}/${s.getDate()}~${e.getMonth() + 1}/${e.getDate()})`;
};

/**
 * 주소를 시/군/구 단위로 축약
 */
export const shortAddr = (a) => {
  if (!a) return '';
  const m = a.match(/^(.*?[시군구])/);
  return m ? m[1] : a.length > 12 ? a.slice(0, 12) + '…' : a;
};

/**
 * 백분율 계산 (문자열 반환)
 */
export const pct = (n, d) => (d ? ((n / d) * 100).toFixed(1) + '%' : '0%');

/**
 * CSV 텍스트 파싱
 */
export const parseCSVText = (text) => {
  const lines = text.split('\n').filter((l) => l.trim());
  if (lines.length < 2) return [];

  const parseRow = (line) => {
    const result = [];
    let cur = '';
    let inQ = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQ && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQ = !inQ;
        }
      } else if (ch === ',' && !inQ) {
        result.push(cur.trim());
        cur = '';
      } else {
        cur += ch;
      }
    }
    result.push(cur.trim());
    return result;
  };

  const headers = parseRow(lines[0]);
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = parseRow(lines[i]);
    if (!cols.length || (cols.length === 1 && !cols[0])) continue;
    const row = {};
    headers.forEach((h, idx) => {
      row[h] = cols[idx] || '';
    });
    rows.push(row);
  }
  return rows;
};
