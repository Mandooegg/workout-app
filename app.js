import {
  supabase, getUser, loginWithGoogle, loginWithEmail,
  signUp, logout,
  loadChecks, saveCheck,
  loadWeights, saveWeight,
  loadMemo, saveMemo,
  loadWeekDone, saveWeekDone
} from './supabase.js'

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
  checks: [],       // [{exercise_index, is_done}]
  weights: [],      // [{date, weight_kg}]
  memo: '',
  weekDone: [],     // [date strings]
}

// --- Auth ---
async function initAuth() {
  const user = await getUser()
  if (user) {
    showApp()
    await loadAll()
  } else {
    showLogin()
  }

  supabase.auth.onAuthStateChange((_event, session) => {
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

// --- Data Loading ---
async function loadAll() {
  setLoading(true)
  try {
    const [checks, weights, memo, weekDone] = await Promise.all([
      loadChecks(state.today),
      loadWeights(),
      loadMemo(state.today),
      loadWeekDone(),
    ])
    state.checks = checks
    state.weights = weights
    state.memo = memo
    state.weekDone = weekDone
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
      await saveCheck(state.today, i, e.target.checked)
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
    await saveWeekDone(state.today)
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

  for (let i = 0; i < firstDay; i++) {
    cal.appendChild(document.createElement('div'))
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`
    const div = document.createElement('div')
    div.className = 'cal-day'
    if (dateStr === state.today) div.classList.add('today')
    if (state.weekDone.includes(dateStr)) div.classList.add('done')
    div.textContent = d
    div.addEventListener('click', async () => {
      state.today = dateStr
      const [checks, memo] = await Promise.all([
        loadChecks(dateStr),
        loadMemo(dateStr),
      ])
      state.checks = checks
      state.memo = memo
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

// --- Event Bindings ---
document.getElementById('btn-google').addEventListener('click', loginWithGoogle)

document.getElementById('btn-email-login').addEventListener('click', async () => {
  const email = document.getElementById('input-email').value
  const pw = document.getElementById('input-password').value
  try {
    await loginWithEmail(email, pw)
  } catch (e) {
    showToast('로그인 실패: ' + e.message)
  }
})

document.getElementById('btn-signup').addEventListener('click', async () => {
  const email = document.getElementById('input-email').value
  const pw = document.getElementById('input-password').value
  try {
    await signUp(email, pw)
    showToast('회원가입 완료! 이메일을 확인해주세요.')
  } catch (e) {
    showToast('가입 실패: ' + e.message)
  }
})

document.getElementById('btn-logout').addEventListener('click', logout)

document.getElementById('btn-save-weight').addEventListener('click', async () => {
  const val = parseFloat(document.getElementById('weight-input').value)
  if (isNaN(val) || val < 20 || val > 300) {
    showToast('올바른 몸무게를 입력해주세요')
    return
  }
  await saveWeight(val)
  document.getElementById('weight-input').value = ''
  state.weights = await loadWeights()
  renderWeight()
  showToast('몸무게 저장 완료!')
})

let memoTimer = null
document.getElementById('memo-input').addEventListener('input', e => {
  clearTimeout(memoTimer)
  memoTimer = setTimeout(async () => {
    state.memo = e.target.value
    await saveMemo(state.today, state.memo)
  }, 800)
})

document.getElementById('btn-prev-month').addEventListener('click', async () => {
  const d = new Date(state.today + 'T00:00:00')
  d.setMonth(d.getMonth() - 1)
  state.today = d.toISOString().split('T')[0]
  const [checks, memo] = await Promise.all([loadChecks(state.today), loadMemo(state.today)])
  state.checks = checks
  state.memo = memo
  render()
})

document.getElementById('btn-next-month').addEventListener('click', async () => {
  const d = new Date(state.today + 'T00:00:00')
  d.setMonth(d.getMonth() + 1)
  state.today = d.toISOString().split('T')[0]
  const [checks, memo] = await Promise.all([loadChecks(state.today), loadMemo(state.today)])
  state.checks = checks
  state.memo = memo
  render()
})

// --- Start ---
initAuth()
