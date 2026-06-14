const SUPABASE_URL = 'https://wiqbzwcuaodryxkrfcfj.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndpcWJ6d2N1YW9kcnl4a3JmY2ZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE0MzIyOTgsImV4cCI6MjA5NzAwODI5OH0.YLRL3hkfRGdPglr1VcH80YoD9_VIxPD3VNHNKJi1VXU'
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

const START_WEIGHT = 94
const GOAL_WEIGHT = 66.5

const WEEKLY_PLAN = {
  0: { label: '일', part: '휴식', exercises: [] },
  1: { label: '월', part: '가슴', exercises: ['체스트프레스 머신', '인클라인 체스트프레스', '펙덱 플라이', '케이블 크로스오버'] },
  2: { label: '화', part: '등', exercises: ['랫풀다운', '시티드 케이블 로우', '체스트 서포티드 로우', '케이블 풀오버'] },
  3: { label: '수', part: '어깨', exercises: ['숄더프레스 머신', '케이블 사이드 레터럴', '케이블 페이스풀', '리어델트 머신'] },
  4: { label: '목', part: '하체', exercises: ['레그프레스', '레그 익스텐션', '레그컬', '힙어브덕션 머신', '카프레이즈 머신'] },
  5: { label: '금', part: '팔 (이두·삼두)', exercises: ['케이블 컬', '이두 머신컬', '케이블 푸시다운', '트라이셉스 머신'] },
  6: { label: '토', part: '전신·코어', exercises: ['케이블 우드찹', '코어 머신', '플랭크 1분×3세트', '크런치', 'HIIT 서킷'] },
}

const CARDIO_MIN = 50

let state = {
  today: new Date().toISOString().split('T')[0],
  todayDow: new Date().getDay(),
  checks: [],
  cardioTimer: { running: false, elapsed: 0, intervalId: null },
  memo: '',
  weights: [],
  weekDone: [],
  currentTab: 'today',
  currentWeekStart: getWeekStart(new Date()),
}

function getWeekStart(date) {
  const d = new Date(date)
  d.setDate(d.getDate() - d.getDay() + 1) // 월요일 기준
  return d.toISOString().split('T')[0]
}

// ---------- Auth ----------
async function initAuth() {
  const { data: { user } } = await sb.auth.getUser()
  if (user) { showApp(); await loadAll() } else { showLogin() }
  sb.auth.onAuthStateChange((_e, session) => {
    if (session?.user) { showApp(); loadAll() } else { showLogin() }
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

// ---------- Data ----------
async function loadAll() {
  setLoading(true)
  try {
    const { data: { user } } = await sb.auth.getUser()
    if (!user) return
    const weekEnd = new Date(state.currentWeekStart)
    weekEnd.setDate(weekEnd.getDate() + 6)
    const weekEndStr = weekEnd.toISOString().split('T')[0]

    const [checksRes, memoRes, weightsRes, weekDoneRes] = await Promise.all([
      sb.from('workout_checks').select('*').eq('user_id', user.id).eq('date', state.today),
      sb.from('workout_memos').select('memo').eq('user_id', user.id).eq('date', state.today).maybeSingle(),
      sb.from('weight_logs').select('*').eq('user_id', user.id).order('date', { ascending: false }).limit(60),
      sb.from('week_done').select('date').eq('user_id', user.id).gte('date', state.currentWeekStart).lte('date', weekEndStr),
    ])
    state.checks = checksRes.data || []
    state.memo = memoRes.data?.memo || ''
    state.weights = weightsRes.data || []
    state.weekDone = (weekDoneRes.data || []).map(r => r.date)
    renderAll()
  } finally { setLoading(false) }
}

function setLoading(on) {
  document.getElementById('app-screen').style.opacity = on ? '0.5' : '1'
}

// ---------- Render ----------
function renderAll() {
  renderToday()
  renderWeekly()
  renderWeight()
  renderRoutine()
}

// ---- 오늘 탭 ----
function renderToday() {
  const dow = state.todayDow
  const plan = WEEKLY_PLAN[dow]
  const d = new Date(state.today + 'T00:00:00')
  const days = ['일','월','화','수','목','금','토']
  document.getElementById('today-date').textContent =
    `${d.getMonth()+1}월 ${d.getDate()}일 (${days[dow]})`
  document.getElementById('today-part').textContent = `${plan.label}요일 · ${plan.part}`

  const list = document.getElementById('exercise-list')
  list.innerHTML = ''

  if (plan.exercises.length === 0) {
    list.innerHTML = '<li class="rest-day">🛌 오늘은 휴식일입니다. 가벼운 스트레칭만!</li>'
    document.getElementById('progress-wrap').style.display = 'none'
  } else {
    document.getElementById('progress-wrap').style.display = 'block'
    plan.exercises.forEach((name, i) => {
      const done = state.checks.find(c => c.exercise_index === i)?.is_done || false
      const li = document.createElement('li')
      li.className = 'exercise-item' + (done ? ' done' : '')
      li.innerHTML = `<label><input type="checkbox" data-index="${i}" ${done ? 'checked' : ''}><span>${name}</span></label>`
      li.querySelector('input').addEventListener('change', async e => {
        const { data: { user } } = await sb.auth.getUser()
        if (!user) return
        await sb.from('workout_checks').upsert({
          user_id: user.id, date: state.today, exercise_index: i, is_done: e.target.checked
        }, { onConflict: 'user_id,date,exercise_index' })
        const ex = state.checks.find(c => c.exercise_index === i)
        if (ex) ex.is_done = e.target.checked
        else state.checks.push({ exercise_index: i, is_done: e.target.checked })
        renderToday()
        await checkAllDone()
      })
      list.appendChild(li)
    })

    const done = state.checks.filter(c => c.is_done).length
    const total = plan.exercises.length
    document.getElementById('progress-text').textContent = `${done} / ${total} 완료`
    document.getElementById('progress-bar').style.width = `${(done / total) * 100}%`
  }

  renderCardioTimer()
  document.getElementById('memo-input').value = state.memo
}

async function checkAllDone() {
  const dow = state.todayDow
  const plan = WEEKLY_PLAN[dow]
  if (plan.exercises.length === 0) return
  const allDone = state.checks.filter(c => c.is_done).length === plan.exercises.length
  if (allDone && !state.weekDone.includes(state.today)) {
    const { data: { user } } = await sb.auth.getUser()
    await sb.from('week_done').upsert({ user_id: user.id, date: state.today, is_done: true }, { onConflict: 'user_id,date' })
    state.weekDone.push(state.today)
    renderWeekly()
    showToast('오늘 근력운동 완료! 🎉')
  }
}

// ---- 유산소 타이머 ----
function renderCardioTimer() {
  const elapsed = state.cardioTimer.elapsed
  const target = CARDIO_MIN * 60
  const remaining = Math.max(0, target - elapsed)
  const mm = String(Math.floor(remaining / 60)).padStart(2, '0')
  const ss = String(remaining % 60).padStart(2, '0')
  document.getElementById('cardio-display').textContent = `${mm}:${ss}`
  const pct = Math.min(100, (elapsed / target) * 100)
  document.getElementById('cardio-bar').style.width = pct + '%'

  const btn = document.getElementById('btn-cardio-toggle')
  btn.textContent = state.cardioTimer.running ? '⏸ 일시정지' : (elapsed > 0 ? '▶ 재시작' : '▶ 유산소 시작')

  if (remaining === 0 && elapsed > 0) {
    document.getElementById('cardio-display').textContent = '완료! 🎉'
    showToast('유산소 50분 완료! 수고했어요 💪')
  }
}

function toggleCardio() {
  if (state.cardioTimer.running) {
    clearInterval(state.cardioTimer.intervalId)
    state.cardioTimer.running = false
  } else {
    if (state.cardioTimer.elapsed >= CARDIO_MIN * 60) { resetCardio(); return }
    state.cardioTimer.running = true
    state.cardioTimer.intervalId = setInterval(() => {
      state.cardioTimer.elapsed++
      renderCardioTimer()
      if (state.cardioTimer.elapsed >= CARDIO_MIN * 60) {
        clearInterval(state.cardioTimer.intervalId)
        state.cardioTimer.running = false
      }
    }, 1000)
  }
  renderCardioTimer()
}

function resetCardio() {
  clearInterval(state.cardioTimer.intervalId)
  state.cardioTimer = { running: false, elapsed: 0, intervalId: null }
  renderCardioTimer()
}

// ---- 주간 탭 ----
async function loadWeekDoneAll() {
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return
  const weekEnd = new Date(state.currentWeekStart)
  weekEnd.setDate(weekEnd.getDate() + 6)
  const { data } = await sb.from('week_done').select('date')
    .eq('user_id', user.id)
    .gte('date', state.currentWeekStart)
    .lte('date', weekEnd.toISOString().split('T')[0])
  state.weekDone = (data || []).map(r => r.date)
  renderWeekly()
}

function renderWeekly() {
  const ws = new Date(state.currentWeekStart + 'T00:00:00')
  const we = new Date(ws); we.setDate(we.getDate() + 6)
  document.getElementById('week-label').textContent =
    `${ws.getMonth()+1}/${ws.getDate()} ~ ${we.getMonth()+1}/${we.getDate()}`

  const grid = document.getElementById('week-grid')
  grid.innerHTML = ''
  let workoutDays = 0

  for (let i = 0; i < 7; i++) {
    const d = new Date(ws); d.setDate(d.getDate() + i)
    const dateStr = d.toISOString().split('T')[0]
    const dow = d.getDay()
    const plan = WEEKLY_PLAN[dow]
    const isDone = state.weekDone.includes(dateStr)
    const isRest = plan.exercises.length === 0
    const isToday = dateStr === state.today

    if (!isRest) workoutDays++

    const div = document.createElement('div')
    div.className = 'week-day' + (isDone ? ' done' : '') + (isRest ? ' rest' : '') + (isToday ? ' today' : '')
    div.innerHTML = `
      <span class="week-day-label">${plan.label}</span>
      <span class="week-day-part">${plan.part}</span>
      <span class="week-day-icon">${isDone ? '✅' : isRest ? '😴' : '○'}</span>
    `
    grid.appendChild(div)
  }

  const doneDays = state.weekDone.length
  const pct = workoutDays > 0 ? Math.round((doneDays / workoutDays) * 100) : 0
  document.getElementById('week-rate').textContent = `${doneDays} / ${workoutDays}일 달성 (${pct}%)`
  document.getElementById('week-rate-bar').style.width = pct + '%'
}

// ---- 몸무게 탭 ----
function renderWeight() {
  const latest = state.weights[0]
  const current = latest ? parseFloat(latest.weight_kg) : START_WEIGHT
  const lost = (START_WEIGHT - current).toFixed(1)
  const toGoal = (current - GOAL_WEIGHT).toFixed(1)

  document.getElementById('w-current').textContent = latest ? `${current} kg` : '미기록'
  document.getElementById('w-lost').textContent = lost > 0 ? `-${lost} kg` : '0 kg'
  document.getElementById('w-togoal').textContent = toGoal > 0 ? `${toGoal} kg 남음` : '목표 달성! 🎉'

  const progressPct = Math.min(100, Math.max(0, ((START_WEIGHT - current) / (START_WEIGHT - GOAL_WEIGHT)) * 100))
  document.getElementById('w-goal-bar').style.width = progressPct + '%'
  document.getElementById('w-goal-pct').textContent = `목표까지 ${progressPct.toFixed(1)}% 진행`

  const tbody = document.getElementById('weight-tbody')
  tbody.innerHTML = ''
  state.weights.slice(0, 10).forEach(w => {
    const tr = document.createElement('tr')
    tr.innerHTML = `<td>${w.date}</td><td>${w.weight_kg} kg</td>`
    tbody.appendChild(tr)
  })
}

// ---- 루틴 탭 ----
function renderRoutine() {
  const wrap = document.getElementById('routine-wrap')
  wrap.innerHTML = ''
  Object.entries(WEEKLY_PLAN).forEach(([dow, plan]) => {
    const div = document.createElement('div')
    div.className = 'routine-day'
    div.innerHTML = `
      <div class="routine-header">
        <span class="routine-dow">${plan.label}요일</span>
        <span class="routine-part">${plan.part}</span>
      </div>
      ${plan.exercises.length > 0
        ? `<ul>${plan.exercises.map(e => `<li>${e}</li>`).join('')}</ul>`
        : '<p class="rest-note">휴식 · 가벼운 스트레칭</p>'}
    `
    wrap.appendChild(div)
  })
}

// ---------- Tab ----------
function switchTab(tab) {
  state.currentTab = tab
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === tab))
  document.querySelectorAll('.tab-pane').forEach(p => p.classList.toggle('active', p.id === 'tab-' + tab))
}

// ---------- Toast ----------
function showToast(msg) {
  const t = document.getElementById('toast')
  t.textContent = msg
  t.classList.add('show')
  setTimeout(() => t.classList.remove('show'), 3000)
}

// ---------- Events ----------
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

document.getElementById('btn-logout').addEventListener('click', () => sb.auth.signOut())

document.getElementById('btn-cardio-toggle').addEventListener('click', toggleCardio)
document.getElementById('btn-cardio-reset').addEventListener('click', resetCardio)

document.getElementById('btn-save-weight').addEventListener('click', async () => {
  const val = parseFloat(document.getElementById('weight-input').value)
  if (isNaN(val) || val < 20 || val > 300) { showToast('올바른 몸무게를 입력해주세요'); return }
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return
  await sb.from('weight_logs').insert({ user_id: user.id, date: state.today, weight_kg: val })
  document.getElementById('weight-input').value = ''
  const { data } = await sb.from('weight_logs').select('*').eq('user_id', user.id).order('date', { ascending: false }).limit(60)
  state.weights = data || []
  renderWeight()
  showToast('몸무게 저장!')
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

document.getElementById('btn-prev-week').addEventListener('click', async () => {
  const d = new Date(state.currentWeekStart + 'T00:00:00')
  d.setDate(d.getDate() - 7)
  state.currentWeekStart = d.toISOString().split('T')[0]
  await loadWeekDoneAll()
})

document.getElementById('btn-next-week').addEventListener('click', async () => {
  const d = new Date(state.currentWeekStart + 'T00:00:00')
  d.setDate(d.getDate() + 7)
  state.currentWeekStart = d.toISOString().split('T')[0]
  await loadWeekDoneAll()
})

document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => switchTab(btn.dataset.tab))
})

// ---------- Start ----------
initAuth()
