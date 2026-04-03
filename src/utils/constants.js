// EZPZ 상태 옵션
export const EZPZ_STATUSES = ['전체', '견적만 완료', '견적+상담신청', '직접상담신청'];

// CRM 상태 옵션
export const CRM_STATUSES = [
  '전체', '미등록', '신규고객', '부재', '단순문의', '콜백예정',
  '담당자배정', '방문예정', '방문대기', '방문완료', '방문거절',
  '계약완료', '잘못된등록',
];

// 1차 필터링 옵션
export const FIRST_FILTERS = ['전체', '미진행', 'AI상담', '전화상담', '문자전송', '기타'];

// 액션 유형
export const ACTION_TYPES = ['전화', '문자/카톡', '방문', '견적서발송', '계약', '기타'];

// 기본 계정
export const DEFAULT_ACCOUNTS = [
  { username: '관리자', loginId: 'admin', password: 'admin1234', role: 'admin' },
];

// 주차 기준 시작일
export const WEEK_START_DATE = '2026-03-19';
