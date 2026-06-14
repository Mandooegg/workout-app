import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = 'https://wiqbzwcuaodryxkrfcfj.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndpcWJ6d2N1YW9kcnl4a3JmY2ZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE0MzIyOTgsImV4cCI6MjA5NzAwODI5OH0.YLRL3hkfRGdPglr1VcH80YoD9_VIxPD3VNHNKJi1VXU'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

export async function getUser() {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function loginWithGoogle() {
  await supabase.auth.signInWithOAuth({ provider: 'google' })
}

export async function loginWithEmail(email, password) {
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
}

export async function signUp(email, password) {
  const { error } = await supabase.auth.signUp({ email, password })
  if (error) throw error
}

export async function logout() {
  await supabase.auth.signOut()
}

export async function loadChecks(date) {
  const user = await getUser()
  if (!user) return []
  const { data } = await supabase
    .from('workout_checks')
    .select('*')
    .eq('user_id', user.id)
    .eq('date', date)
  return data || []
}

export async function saveCheck(date, exerciseIndex, isDone) {
  const user = await getUser()
  if (!user) return
  await supabase.from('workout_checks').upsert({
    user_id: user.id,
    date,
    exercise_index: exerciseIndex,
    is_done: isDone
  }, { onConflict: 'user_id,date,exercise_index' })
}

export async function loadWeights() {
  const user = await getUser()
  if (!user) return []
  const { data } = await supabase
    .from('weight_logs')
    .select('*')
    .eq('user_id', user.id)
    .order('date', { ascending: false })
    .limit(30)
  return data || []
}

export async function saveWeight(weightKg) {
  const user = await getUser()
  if (!user) return
  const today = new Date().toISOString().split('T')[0]
  await supabase.from('weight_logs').insert({
    user_id: user.id,
    date: today,
    weight_kg: weightKg
  })
}

export async function loadMemo(date) {
  const user = await getUser()
  if (!user) return ''
  const { data } = await supabase
    .from('workout_memos')
    .select('memo')
    .eq('user_id', user.id)
    .eq('date', date)
    .single()
  return data?.memo || ''
}

export async function saveMemo(date, memo) {
  const user = await getUser()
  if (!user) return
  await supabase.from('workout_memos').upsert({
    user_id: user.id,
    date,
    memo
  }, { onConflict: 'user_id,date' })
}

export async function loadWeekDone() {
  const user = await getUser()
  if (!user) return []
  const { data } = await supabase
    .from('week_done')
    .select('date')
    .eq('user_id', user.id)
  return (data || []).map(r => r.date)
}

export async function saveWeekDone(date) {
  const user = await getUser()
  if (!user) return
  await supabase.from('week_done').upsert({
    user_id: user.id,
    date,
    is_done: true
  }, { onConflict: 'user_id,date' })
}
