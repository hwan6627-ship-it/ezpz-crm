import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ===== 고객 관련 DB 함수 =====

/** 모든 고객 목록 가져오기 */
export const fetchCustomers = async () => {
  const { data: customers, error } = await supabase
    .from('customers')
    .select('*')
    .order('ezpz_date', { ascending: false });
  if (error) { console.error('고객 조회 오류:', error); return []; }

  // 각 고객의 액션(히스토리) 가져오기
  const { data: actions, error: actErr } = await supabase
    .from('actions')
    .select('*')
    .order('action_date', { ascending: true });
  if (actErr) console.error('액션 조회 오류:', actErr);

  // DB 컬럼명 → 프론트엔드 변수명으로 변환
  return customers.map((c) => ({
    id: c.id,
    name: c.name,
    phone: c.phone || '',
    address: c.address || '',
    ezpzStatus: c.ezpz_status,
    ezpzDate: c.ezpz_date ? c.ezpz_date.replace('T', ' ').slice(0, 16) : '',
    crmStatus: c.crm_status,
    assignee: c.assignee || '',
    estimateCount: c.estimate_count,
    firstFilter: c.first_filter,
    updatedAt: c.updated_at ? c.updated_at.replace('T', ' ').slice(0, 16) : '',
    actions: (actions || [])
      .filter((a) => a.customer_id === c.id)
      .map((a) => ({
        dbId: a.id,
        date: a.action_date ? a.action_date.replace('T', ' ').slice(0, 16) : '',
        type: a.action_type,
        note: a.note || '',
        author: a.author || '',
        file: a.file_name ? { name: a.file_name, type: a.file_type, data: a.file_data } : null,
      })),
  }));
};

/** 고객 1명 추가 */
export const insertCustomer = async (c) => {
  const { data, error } = await supabase.from('customers').insert({
    name: c.name,
    phone: c.phone,
    address: c.address,
    ezpz_status: c.ezpzStatus,
    ezpz_date: c.ezpzDate || new Date().toISOString(),
    crm_status: c.crmStatus,
    assignee: c.assignee,
    estimate_count: c.estimateCount || 1,
    first_filter: c.firstFilter,
  }).select().single();
  if (error) { console.error('고객 추가 오류:', error); return null; }
  return data;
};

/** 고객 여러 명 추가 (대량 등록) */
export const insertCustomersBulk = async (customers) => {
  const rows = customers.map((c) => ({
    name: c.name,
    phone: c.phone,
    address: c.address,
    ezpz_status: c.ezpzStatus || '견적만 완료',
    ezpz_date: c.ezpzDate || new Date().toISOString(),
    crm_status: c.crmStatus || '미등록',
    assignee: c.assignee || '',
    estimate_count: c.estimateCount || 1,
    first_filter: c.firstFilter || '미진행',
  }));
  const { data, error } = await supabase.from('customers').insert(rows).select();
  if (error) { console.error('대량 등록 오류:', error); return []; }
  return data;
};

/** 고객 정보 수정 */
export const updateCustomer = async (id, updates) => {
  const dbUpdates = {};
  if (updates.name !== undefined) dbUpdates.name = updates.name;
  if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
  if (updates.address !== undefined) dbUpdates.address = updates.address;
  if (updates.ezpzStatus !== undefined) dbUpdates.ezpz_status = updates.ezpzStatus;
  if (updates.crmStatus !== undefined) dbUpdates.crm_status = updates.crmStatus;
  if (updates.assignee !== undefined) dbUpdates.assignee = updates.assignee;
  if (updates.firstFilter !== undefined) dbUpdates.first_filter = updates.firstFilter;
  if (updates.estimateCount !== undefined) dbUpdates.estimate_count = updates.estimateCount;
  dbUpdates.updated_at = new Date().toISOString();

  const { error } = await supabase.from('customers').update(dbUpdates).eq('id', id);
  if (error) console.error('고객 수정 오류:', error);
  return !error;
};

// ===== 액션(영업 히스토리) 관련 DB 함수 =====

/** 액션 추가 */
export const insertAction = async (customerId, action) => {
  const { data, error } = await supabase.from('actions').insert({
    customer_id: customerId,
    action_date: new Date().toISOString(),
    action_type: action.type,
    note: action.note,
    author: action.author,
    file_name: action.file?.name || null,
    file_type: action.file?.type || null,
    file_data: action.file?.data || null,
  }).select().single();
  if (error) { console.error('액션 추가 오류:', error); return null; }
  return data;
};

/** 액션 수정 */
export const updateAction = async (actionId, note) => {
  const { error } = await supabase.from('actions').update({ note }).eq('id', actionId);
  if (error) console.error('액션 수정 오류:', error);
  return !error;
};

/** 액션 삭제 */
export const deleteAction = async (actionId) => {
  const { error } = await supabase.from('actions').delete().eq('id', actionId);
  if (error) console.error('액션 삭제 오류:', error);
  return !error;
};

// ===== 계정 관련 DB 함수 =====

/** 로그인 확인 */
export const loginCheck = async (loginId, password) => {
  const { data, error } = await supabase
    .from('accounts')
    .select('*')
    .eq('login_id', loginId)
    .eq('password', password)
    .single();
  if (error || !data) return null;
  return { username: data.username, loginId: data.login_id, password: data.password, role: data.role };
};

/** 계정 목록 가져오기 */
export const fetchAccounts = async () => {
  const { data, error } = await supabase.from('accounts').select('*').order('created_at');
  if (error) { console.error('계정 조회 오류:', error); return []; }
  return data.map((a) => ({ id: a.id, username: a.username, loginId: a.login_id, password: a.password, role: a.role }));
};

/** 계정 추가 */
export const insertAccount = async (account) => {
  const { data, error } = await supabase.from('accounts').insert({
    username: account.username,
    login_id: account.loginId,
    password: account.password,
    role: account.role || 'user',
  }).select().single();
  if (error) { console.error('계정 추가 오류:', error); return null; }
  return data;
};

/** 계정 삭제 */
export const deleteAccount = async (loginId) => {
  const { error } = await supabase.from('accounts').delete().eq('login_id', loginId);
  if (error) console.error('계정 삭제 오류:', error);
  return !error;
};
