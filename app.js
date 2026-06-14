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

const EXERCISE_INFO = {
  '체스트프레스 머신': {
    target: '가슴 (대흉근)',
    steps: [
      '등받이에 등 전체를 밀착하고 발바닥을 바닥에 고정',
      '손잡이를 어깨너비보다 약간 넓게 잡기',
      '숨을 들이마시며 천천히 당기고, 내쉬며 밀어내기',
      '팔꿈치가 완전히 펴지기 직전에서 멈추고 수축 느끼기',
    ],
    tips: '등이 등받이에서 떨어지지 않도록 주의. 무게보다 정확한 자세 우선.',
    youtube: '체스트프레스 머신 올바른 자세',
  },
  '인클라인 체스트프레스': {
    target: '상부 가슴 (대흉근 상부)',
    steps: [
      '등받이 각도 30~45도로 설정',
      '손잡이를 잡고 가슴 상단(쇄골 아래)에 위치 맞추기',
      '숨 내쉬며 밀어올리고, 들이마시며 천천히 내리기',
      '내릴 때 가슴이 충분히 스트레칭 되도록',
    ],
    tips: '각도가 너무 높으면 어깨 운동이 됨. 30~45도가 최적.',
    youtube: '인클라인 체스트프레스 머신 자세',
  },
  '펙덱 플라이': {
    target: '가슴 안쪽 (대흉근 내측)',
    steps: [
      '등과 머리를 패드에 밀착, 팔꿈치를 패드에 올려놓기',
      '팔꿈치가 어깨 높이가 되도록 시트 높이 조정',
      '숨 내쉬며 팔을 모아 가슴 중앙에서 수축',
      '숨 들이마시며 천천히 벌려 가슴 스트레칭',
    ],
    tips: '팔꿈치를 구부린 채로 패드를 밀어야 함. 손목 힘으로 하지 말 것.',
    youtube: '펙덱 플라이 올바른 자세',
  },
  '케이블 크로스오버': {
    target: '가슴 전체 (특히 내측·하부)',
    steps: [
      '케이블을 어깨 높이 또는 위쪽으로 설정',
      '양손 손잡이 잡고 한 발 앞으로 나와 균형 잡기',
      '팔꿈치 약간 굽힌 채 가슴 앞에서 양손 교차',
      '수축 1~2초 유지 후 천천히 원위치',
    ],
    tips: '몸통이 흔들리지 않도록. 팔이 아닌 가슴으로 당기는 느낌 집중.',
    youtube: '케이블 크로스오버 자세 설명',
  },
  '랫풀다운': {
    target: '등 (광배근)',
    steps: [
      '허벅지 패드를 몸에 맞게 조정 후 바를 넓게 잡기',
      '가슴을 약간 들고 복부에 힘 준 상태 유지',
      '숨 내쉬며 바를 가슴 위쪽까지 당기기',
      '어깨뼈를 아래로 모으며 광배근 수축 느끼기',
    ],
    tips: '바를 목 뒤로 당기지 말 것. 팔꿈치를 몸 옆구리로 내리는 느낌.',
    youtube: '랫풀다운 올바른 자세 광배근',
  },
  '시티드 케이블 로우': {
    target: '등 중앙 (승모근·능형근)',
    steps: [
      '발을 발판에 올리고 무릎 약간 굽혀 앉기',
      '상체를 살짝 앞으로 기울여 케이블 잡기',
      '숨 내쉬며 손잡이를 배꼽 쪽으로 당기며 등 수축',
      '어깨뼈를 뒤로 모으는 느낌으로 마무리',
    ],
    tips: '당길 때 상체가 뒤로 눕지 않도록. 등 근육으로만 당기기.',
    youtube: '시티드 케이블 로우 자세',
  },
  '체스트 서포티드 로우': {
    target: '등 중상부',
    steps: [
      '가슴 패드에 가슴을 밀착하고 발끝으로 지탱',
      '손잡이를 잡고 팔을 자연스럽게 내림',
      '숨 내쉬며 손잡이를 몸통 쪽으로 당기기',
      '등 중앙에서 수축 느끼고 천천히 원위치',
    ],
    tips: '가슴이 패드에서 떨어지지 않아야 등 운동 효과 극대화.',
    youtube: '체스트 서포티드 로우 머신 자세',
  },
  '케이블 풀오버': {
    target: '광배근·대흉근 하부',
    steps: [
      '케이블을 높게 설정, 로프 손잡이 부착',
      '케이블을 등지고 서거나 무릎 꿇고 앉기',
      '팔꿈치 살짝 굽힌 채 팔을 위에서 허벅지 앞으로 내리기',
      '광배근 수축 느끼며 천천히 원위치',
    ],
    tips: '팔꿈치 각도를 유지하며 어깨 회전 없이 광배근만 사용.',
    youtube: '케이블 풀오버 광배근 자세',
  },
  '숄더프레스 머신': {
    target: '어깨 (삼각근 전·중부)',
    steps: [
      '시트 높이 조정: 손잡이가 어깨 높이에 오도록',
      '등을 등받이에 밀착, 복부 긴장 유지',
      '숨 내쉬며 위로 밀어올리되 팔꿈치 완전히 펴지 않기',
      '천천히 내리며 어깨 스트레칭',
    ],
    tips: '목을 앞으로 빼거나 허리를 꺾지 말 것. 코어 단단히 유지.',
    youtube: '숄더프레스 머신 올바른 자세',
  },
  '케이블 사이드 레터럴': {
    target: '어깨 측면 (삼각근 중부)',
    steps: [
      '케이블을 낮게 설정, 한쪽 손으로 반대쪽 손잡이 잡기',
      '몸통 고정 후 팔꿈치 약간 굽혀 옆으로 들어올리기',
      '어깨 높이까지만 올리고 1초 수축',
      '천천히 내리며 반복',
    ],
    tips: '손목을 비틀거나 몸을 기울이지 말 것. 가벼운 무게로 정확하게.',
    youtube: '케이블 사이드 레터럴 레이즈 자세',
  },
  '케이블 페이스풀': {
    target: '어깨 후면·회전근개',
    steps: [
      '케이블을 눈 높이로 설정, 로프 손잡이 부착',
      '한 발 앞으로 나와 균형 잡기',
      '팔꿈치를 귀 옆으로 당기며 로프를 얼굴 쪽으로 잡아당기기',
      '수축 1초 유지 후 천천히 원위치',
    ],
    tips: '어깨 건강에 매우 중요한 운동. 무게보다 정확한 자세.',
    youtube: '케이블 페이스풀 올바른 자세',
  },
  '리어델트 머신': {
    target: '어깨 후면 (후삼각근)',
    steps: [
      '가슴을 패드에 대고 손잡이를 어깨 높이에 맞추기',
      '팔꿈치 약간 굽힌 채 손잡이 잡기',
      '숨 내쉬며 팔을 뒤로 최대한 벌리기',
      '후삼각근 수축 느끼며 천천히 원위치',
    ],
    tips: '가슴이 패드에서 떨어지지 않도록. 팔꿈치를 구부리지 말 것.',
    youtube: '리어델트 머신 후면 삼각근 자세',
  },
  '레그프레스': {
    target: '허벅지 전면·후면·둔근',
    steps: [
      '등과 엉덩이를 시트에 밀착, 발판에 어깨너비로 발 올리기',
      '안전 잠금 해제 후 무릎을 90도까지 천천히 굽히기',
      '발꿈치로 밀어내며 숨 내쉬기 (발끝 밀지 말 것)',
      '무릎이 완전히 펴지기 전에 멈추고 반복',
    ],
    tips: '무릎이 발끝 안쪽으로 모이지 않도록. 허리가 들리면 무게 줄이기.',
    youtube: '레그프레스 올바른 자세 하체',
  },
  '레그 익스텐션': {
    target: '허벅지 전면 (대퇴사두근)',
    steps: [
      '시트 깊숙이 앉아 발목 패드를 발목 위에 위치',
      '손잡이를 잡고 허리를 등받이에 밀착',
      '숨 내쉬며 무릎을 완전히 펴며 수축',
      '1초 유지 후 천천히 내리기',
    ],
    tips: '무릎 관절에 부담이 큰 동작. 무게는 가볍게 시작.',
    youtube: '레그 익스텐션 머신 자세',
  },
  '레그컬': {
    target: '허벅지 후면 (햄스트링)',
    steps: [
      '엎드리거나 앉아서 발목 패드를 종아리 위에 위치',
      '엉덩이가 들리지 않도록 고정',
      '숨 내쉬며 무릎을 최대한 굽히기',
      '햄스트링 수축 1초 유지 후 천천히 내리기',
    ],
    tips: '엉덩이가 들리면 무게 과다. 발목을 굽히면 효과 증가.',
    youtube: '레그컬 머신 햄스트링 자세',
  },
  '힙어브덕션 머신': {
    target: '엉덩이 외측 (중둔근)',
    steps: [
      '시트에 앉아 등받이에 등 밀착, 발판에 발 올리기',
      '무릎 패드를 무릎 바깥쪽에 위치',
      '숨 내쉬며 무릎을 바깥으로 최대한 벌리기',
      '중둔근 수축 느끼며 천천히 원위치',
    ],
    tips: '상체가 앞으로 숙여지지 않도록. 코어 긴장 유지.',
    youtube: '힙어브덕션 머신 중둔근 자세',
  },
  '카프레이즈 머신': {
    target: '종아리 (비복근·가자미근)',
    steps: [
      '어깨 패드 아래 서서 발앞꿈치를 발판 끝에 올리기',
      '발꿈치를 최대한 낮게 내려 스트레칭',
      '숨 내쉬며 발꿈치를 최대한 높이 들어올리기',
      '최고점에서 1~2초 수축 후 천천히 내리기',
    ],
    tips: '빠르게 튕기지 말고 천천히. 내릴 때 스트레칭이 핵심.',
    youtube: '카프레이즈 종아리 운동 자세',
  },
  '케이블 컬': {
    target: '이두근',
    steps: [
      '케이블을 낮게 설정, 바 또는 로프 손잡이 부착',
      '팔꿈치를 몸통 옆에 고정 (절대 움직이지 않음)',
      '숨 내쉬며 천천히 당겨 올리기',
      '이두근 최대 수축 후 천천히 내리기',
    ],
    tips: '팔꿈치가 앞뒤로 움직이면 어깨 운동이 됨. 팔꿈치 고정이 핵심.',
    youtube: '케이블 컬 이두근 자세',
  },
  '이두 머신컬': {
    target: '이두근 집중',
    steps: [
      '팔꿈치를 패드 위에 올리고 상완 밀착',
      '손잡이를 언더그립으로 잡기',
      '숨 내쉬며 천천히 당겨 수축',
      '천천히 내리며 이두근 스트레칭',
    ],
    tips: '패드에 팔꿈치를 완전히 밀착해야 이두근만 고립됨.',
    youtube: '이두 머신컬 자세 올바른',
  },
  '케이블 푸시다운': {
    target: '삼두근',
    steps: [
      '케이블을 높게 설정, 로프 또는 바 손잡이 부착',
      '팔꿈치를 몸통 옆에 고정',
      '숨 내쉬며 아래로 밀어내기',
      '팔꿈치 완전히 펴서 삼두 수축 후 천천히 원위치',
    ],
    tips: '팔꿈치가 앞으로 나오면 어깨 개입. 팔꿈치를 옆구리에 붙이기.',
    youtube: '케이블 푸시다운 삼두근 자세',
  },
  '트라이셉스 머신': {
    target: '삼두근 집중',
    steps: [
      '시트 높이 조정: 손잡이가 어깨 높이',
      '등받이에 등 밀착, 팔꿈치를 패드에 올리기',
      '숨 내쉬며 팔꿈치를 완전히 펴며 밀어내기',
      '수축 1초 후 천천히 굽히기',
    ],
    tips: '등이 들리지 않도록. 수축 끝에서 잠깐 멈추면 효과 증가.',
    youtube: '트라이셉스 머신 삼두근 자세',
  },
  '케이블 우드찹': {
    target: '복사근·코어 전체',
    steps: [
      '케이블을 높게 설정, 로프 손잡이 부착',
      '케이블 옆으로 서서 양손으로 손잡이 잡기',
      '복부를 비틀며 대각선 아래로 당기기',
      '천천히 원위치 후 반복 (좌우 세트 나누기)',
    ],
    tips: '팔이 아닌 복부 회전으로. 무릎을 살짝 굽히고 하체 고정.',
    youtube: '케이블 우드찹 복사근 코어 자세',
  },
  '코어 머신': {
    target: '복직근·코어',
    steps: [
      '시트에 앉아 손잡이 또는 패드를 가슴 앞에 고정',
      '발을 발판에 올려 허벅지가 90도',
      '숨 내쉬며 상체를 앞으로 굽히며 수축',
      '허리가 아닌 복부로 구부리는 느낌',
    ],
    tips: '목으로 당기지 말고 복부로. 내릴 때 천천히 저항.',
    youtube: '코어 머신 복근 운동 자세',
  },
  '플랭크 1분×3세트': {
    target: '코어 전체·척추 안정',
    steps: [
      '팔꿈치를 어깨 바로 아래에 위치',
      '발끝과 팔꿈치로 지지, 몸이 일직선이 되도록',
      '엉덩이가 올라가거나 내려가지 않게 복부 긴장',
      '1분 유지 → 30초 휴식 → 반복',
    ],
    tips: '허리가 처지는 순간 자세 붕괴. 무릎 내리고 다시 자세 잡기.',
    youtube: '플랭크 올바른 자세 코어',
  },
  '크런치': {
    target: '복직근 (윗배)',
    steps: [
      '등을 바닥에 대고 무릎 세우기',
      '손을 가슴 위에 올리거나 귀 옆에 살짝 대기',
      '숨 내쉬며 어깨를 바닥에서 20~30cm 올리기',
      '복부 수축 느끼며 천천히 내리기',
    ],
    tips: '목을 당기거나 머리를 올리는 게 아님. 복부 수축이 목적.',
    youtube: '크런치 올바른 자세 복근',
  },
  'HIIT 서킷': {
    target: '전신·심폐지구력·지방연소',
    steps: [
      '20초 전력운동 + 10초 휴식 = 1라운드',
      '추천 동작: 버피·점프스쿼트·마운틴클라이머·점핑잭',
      '4~8라운드 반복 (총 2~4분)',
      '라운드 사이 1분 휴식',
    ],
    tips: '짧고 강하게. 20분 HIIT = 유산소 1시간 효과. 워밍업 필수.',
    youtube: 'HIIT 서킷 트레이닝 초보 20분',
  },
}

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
      li.innerHTML = `
        <label><input type="checkbox" data-index="${i}" ${done ? 'checked' : ''}><span>${name}</span></label>
        ${EXERCISE_INFO[name] ? `<button class="info-btn" data-name="${name}">?</button>` : ''}
      `
      const infoBtn = li.querySelector('.info-btn')
      if (infoBtn) infoBtn.addEventListener('click', e => { e.preventDefault(); openExerciseModal(name) })
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
        ? `<ul>${plan.exercises.map(e => `<li class="${EXERCISE_INFO[e] ? 'has-info' : ''}" ${EXERCISE_INFO[e] ? `data-name="${e}"` : ''}><span>${e}</span>${EXERCISE_INFO[e] ? '<span class="routine-info-btn">?</span>' : ''}</li>`).join('')}</ul>`
        : '<p class="rest-note">휴식 · 가벼운 스트레칭</p>'}
    `
    wrap.appendChild(div)
  })
  wrap.querySelectorAll('li.has-info').forEach(li => {
    li.addEventListener('click', () => openExerciseModal(li.dataset.name))
  })
}

// ---------- Tab ----------
function switchTab(tab) {
  state.currentTab = tab
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === tab))
  document.querySelectorAll('.tab-pane').forEach(p => p.classList.toggle('active', p.id === 'tab-' + tab))
}

// ---------- Modal ----------
function openExerciseModal(name) {
  const info = EXERCISE_INFO[name]
  if (!info) return
  document.getElementById('modal-title').textContent = name
  document.getElementById('modal-target').textContent = info.target
  document.getElementById('modal-steps').innerHTML = info.steps.map((s, i) => `<li><span class="step-num">${i+1}</span>${s}</li>`).join('')
  document.getElementById('modal-tips').textContent = info.tips
  const youtubeUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(info.youtube)}`
  document.getElementById('modal-youtube').href = youtubeUrl
  document.getElementById('exercise-modal').classList.add('open')
  document.body.style.overflow = 'hidden'
}

function closeModal() {
  document.getElementById('exercise-modal').classList.remove('open')
  document.body.style.overflow = ''
}

document.getElementById('modal-close').addEventListener('click', closeModal)
document.getElementById('exercise-modal').addEventListener('click', e => {
  if (e.target === e.currentTarget) closeModal()
})

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
