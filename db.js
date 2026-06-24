import { createClient } from '@supabase/supabase-js';

(function () {
  const client = createClient(window.PULSELOG_SUPABASE_URL, window.PULSELOG_SUPABASE_KEY);

  function todayStr() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  async function signUp(email, password) {
    const { error } = await client.auth.signUp({ email, password });
    if (error) throw error;
  }

  async function signIn(email, password) {
    const { error } = await client.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }

  async function signOut() {
    await client.auth.signOut();
  }

  async function getSession() {
    const { data } = await client.auth.getSession();
    return data.session;
  }

  function onAuthChange(cb) {
    client.auth.onAuthStateChange((_event, session) => cb(session));
  }

  async function getLogByDate(dateStr) {
    const { data, error } = await client
      .from('logs')
      .select('*')
      .eq('log_date', dateStr)
      .maybeSingle();
    if (error) throw error;
    return data;
  }

  async function saveLog(entry) {
    const session = await getSession();
    if (!session) throw new Error('Not authenticated');
    const row = { ...entry, user_id: session.user.id, log_date: entry.log_date || todayStr() };
    const { error } = await client.from('logs').upsert(row, { onConflict: 'user_id,log_date' });
    if (error) throw error;
  }

  async function listLogs() {
    const { data, error } = await client
      .from('logs')
      .select('*')
      .order('log_date', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  window.PulseLogDB = {
    todayStr, signUp, signIn, signOut, getSession, onAuthChange,
    getLogByDate, saveLog, listLogs,
  };
})();
