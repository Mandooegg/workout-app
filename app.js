const SUPABASE_URL = 'https://wiqbzwcuaodryxkrfcfj.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndpcWJ6d2N1YW9kcnl4a3JmY2ZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE0MzIyOTgsImV4cCI6MjA5NzAwODI5OH0.YLRL3hkfRGdPglr1VcH80YoD9_VIxPD3VNHNKJi1VXU'

const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

const EXERCISES = [
  '스쿼트 3세트',
  '런지 3세트',
  '플랭크 3세트',
  '팔굽혀펴기 3세트',
  '버피 3세트',
  '크런치 3세트',
]

let state = {
  today: new Date().toISOString().split('T')[0],
  checks: [],
  weights: [],
  memo: '',
  weekDone: [],
}

// --- Auth ---
async function initAuth() {
  const { data: { user } } = await sb.auth.getUser()
  if (user) {
    showApp()
    await loadAll()
  } else {
    showLogin()
  }

  sb.auth.onAuthStateChange((_event, session) => {
    if (session?.user) {
      showApp()
      loadAll()
    } else {
      showLogin()
    }
  })
}

function showLogin() {
  document.getElementById('login-screen').style.display = 'flex'
  document.getElementById('app-screen').style.display = 'none'
}

function showApp() {
  document.getElementById('login-screen').style.display = 'none'
  document.getElementById('app-screen').style.display = 'block'
}

// --- Data ---
async function loadAll() {
  setLoading(true)
  try {
    const { data: { user } } = await sb.auth.getUser()
    if (!user) return

    const [checksRes, weightsRes, memoRes, weekDoneRes] = await Promise.all([
      sb.from('workout_checks').select('*').eq('user_id', user.id).eq('date', state.today),
      sb.from('weight_logs').select('*').eq('user_id', user.id).order('date', { ascending: false }).limit(30),
      sb.from('workout_memos').select('memo').eq('user_id', user.id).eq('date', state.today).maybeSingle(),
      sb.from('week_done').select('date').eq('user_id', user.id),
    ])

    state.checks = checksRes.data || []
    state.weights = weightsRes.data || []
    state.memo = memoRes.data?.memo || ''
    state.weekDone = (weekDoneRes.data || []).map(r => r.date)
    render()
  } finally {
    setLoading(false)
  }
}

function setLoading(on) {
  document.getElementById('app-screen').style.opacity = on ? '0.5' : '1'
}

// --- Render ---
function render() {
  renderDate()
  renderExercises()
  renderWeight()
  renderMemo()
  renderCalendar()
}

function renderDate() {
  const d = new Date(state.today + 'T00:00:00')
  const days = ['일', '월', '화', '수', '목', '금', '토']
  document.getElementById('today-label').textContent =
    `${d.getFullYear()}년 ${d.getMonth()+1}월 ${d.getDate()}일 (${days[d.getDay()]})`
}

function renderExercises() {
  const list = document.getElementById('exercise-list')
  list.innerHTML = ''
  EXERCISES.forEach((name, i) => {
    const done = state.checks.find(c => c.exercise_index === i)?.is_done || false
    const li = document.createElement('li')
    li.className = 'exercise-item' + (done ? ' done' : '')
    li.innerHTML = `
      <label>
        <input type="checkbox" data-index="${i}" ${done ? 'checked' : ''}>
        <span>${name}</span>
      </label>
    `
    li.querySelector('input').addEventListener('change', async e => {
      const { data: { user } } = await sb.auth.getUser()
      if (!user) return
      await sb.from('workout_checks').upsert({
        user_id: user.id,
        date: state.today,
        exercise_index: i,
        is_done: e.target.checked
      }, { onConflict: 'user_id,date,exercise_index' })
      const existing = state.checks.find(c => c.exercise_index === i)
      if (existing) existing.is_done = e.target.checked
      else state.checks.push({ exercise_index: i, is_done: e.target.checked })
      renderExercises()
      checkAllDone()
    })
    list.appendChild(li)
  })

  const done = state.checks.filter(c => c.is_done).length
  document.getElementById('progress-text').textContent = `${done} / ${EXERCISES.length} 완료`
  document.getElementById('progress-bar').style.width = `${(done / EXERCISES.length) * 100}%`
}

async function checkAllDone() {
  const allDone = state.checks.filter(c => c.is_done).length === EXERCISES.length
  if (allDone && !state.weekDone.includes(state.today)) {
    const { data: { user } } = await sb.auth.getUser()
    await sb.from('week_done').upsert({ user_id: user.id, date: state.today, is_done: true }, { onConflict: 'user_id,date' })
    state.weekDone.push(state.today)
    renderCalendar()
    showToast('오늘 운동 완료! 🎉')
  }
}

function renderWeight() {
  const latest = state.weights[0]
  document.getElementById('weight-display').textContent =
    latest ? `현재 몸무게: ${latest.weight_kg} kg` : '몸무게를 기록해보세요'
  const tbody = document.getElementById('weight-tbody')
  tbody.innerHTML = ''
  state.weights.slice(0, 7).forEach(w => {
    const tr = document.createElement('tr')
    tr.innerHTML = `<td>${w.date}</td><td>${w.weight_kg} kg</td>`
    tbody.appendChild(tr)
  })
}

function renderMemo() {
  document.getElementById('memo-input').value = state.memo
}

function renderCalendar() {
  const cal = document.getElementById('calendar')
  cal.innerHTML = ''
  const now = new Date(state.today + 'T00:00:00')
  const year = now.getFullYear()
  const month = now.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  document.getElementById('cal-title').textContent = `${year}년 ${month+1}월`

  for (let i = 0; i < firstDay; i++) cal.appendChild(document.createElement('div'))

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`
    const div = document.createElement('div')
    div.className = 'cal-day'
    if (dateStr === state.today) div.classList.add('today')
    if (state.weekDone.includes(dateStr)) div.classList.add('done')
    div.textContent = d
    div.addEventListener('click', async () => {
      state.today = dateStr
      const { data: { user } } = await sb.auth.getUser()
      if (!user) return
      const [checksRes, memoRes] = await Promise.all([
        sb.from('workout_checks').select('*').eq('user_id', user.id).eq('date', dateStr),
        sb.from('workout_memos').select('memo').eq('user_id', user.id).eq('date', dateStr).maybeSingle(),
      ])
      state.checks = checksRes.data || []
      state.memo = memoRes.data?.memo || ''
      render()
    })
    cal.appendChild(div)
  }
}

function showToast(msg) {
  const t = document.getElementById('toast')
  t.textContent = msg
  t.classList.add('show')
  setTimeout(() => t.classList.remove('show'), 3000)
}

// --- Events ---
document.getElementById('btn-email-login').addEventListener('click', async () => {
  const email = document.getElementById('input-email').value.trim()
  const pw = document.getElementById('input-password').value
  if (!email || !pw) { showToast('이메일과 비밀번호를 입력해주세요'); return }
  const { error } = await sb.auth.signInWithPassword({ email, password: pw })
  if (error) showToast('로그인 실패: ' + error.message)
})

document.getElementById('btn-signup').addEventListener('click', async () => {
  const email = document.getElementById('input-email').value.trim()
  const pw = document.getElementById('input-password').value
  if (!email || !pw) { showToast('이메일과 비밀번호를 입력해주세요'); return }
  const { error } = await sb.auth.signUp({ email, password: pw })
  if (error) showToast('가입 실패: ' + error.message)
  else showToast('회원가입 완료! 로그인 해주세요.')
})

document.getElementById('btn-logout').addEventListener('click', async () => {
  await sb.auth.signOut()
})

document.getElementById('btn-save-weight').addEventListener('click', async () => {
  const val = parseFloat(document.getElementById('weight-input').value)
  if (isNaN(val) || val < 20 || val > 300) { showToast('올바른 몸무게를 입력해주세요'); return }
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return
  const today = new Date().toISOString().split('T')[0]
  await sb.from('weight_logs').insert({ user_id: user.id, date: today, weight_kg: val })
  document.getElementById('weight-input').value = ''
  const { data } = await sb.from('weight_logs').select('*').eq('user_id', user.id).order('date', { ascending: false }).limit(30)
  state.weights = data || []
  renderWeight()
  showToast('몸무게 저장 완료!')
})

let memoTimer = null
document.getElementById('memo-input').addEventListener('input', async e => {
  clearTimeout(memoTimer)
  memoTimer = setTimeout(async () => {
    const { data: { user } } = await sb.auth.getUser()
    if (!user) return
    state.memo = e.target.value
    await sb.from('workout_memos').upsert({ user_id: user.id, date: state.today, memo: state.memo }, { onConflict: 'user_id,date' })
  }, 800)
})

document.getElementById('btn-prev-month').addEventListener('click', async () => {
  const d = new Date(state.today + 'T00:00:00')
  d.setMonth(d.getMonth() - 1)
  state.today = d.toISOString().split('T')[0]
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return
  const [checksRes, memoRes] = await Promise.all([
    sb.from('workout_checks').select('*').eq('user_id', user.id).eq('date', state.today),
    sb.from('workout_memos').select('memo').eq('user_id', user.id).eq('date', state.today).maybeSingle(),
  ])
  state.checks = checksRes.data || []
  state.memo = memoRes.data?.memo || ''
  render()
})

document.getElementById('btn-next-month').addEventListener('click', async () => {
  const d = new Date(state.today + 'T00:00:00')
  d.setMonth(d.getMonth() + 1)
  state.today = d.toISOString().split('T')[0]
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return
  const [checksRes, memoRes] = await Promise.all([
    sb.from('workout_checks').select('*').eq('user_id', user.id).eq('date', state.today),
    sb.from('workout_memos').select('memo').eq('user_id', user.id).eq('date', state.today).maybeSingle(),
  ])
  state.checks = checksRes.data || []
  state.memo = memoRes.data?.memo || ''
  render()
})

// --- Start ---
initAuth()
