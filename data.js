/* ═══════════════ 일로 · ILRO — 데모 데이터 ═══════════════ */
/* 규칙: 기여 1건 = 내가 남긴 것 + 그 뒤에 생긴 일. 점수·순위 없음. */

const USERS = {
  u_kim:  { id:"u_kim",  name:"김민수", title:"백엔드 개발자",      track:"developer", level:"시니어", exp:"경력 6년", role:"employee" },
  u_lee:  { id:"u_lee",  name:"이지은", title:"프로덕트 디자이너",  track:"designer",  level:"미들",   exp:"경력 4년", role:"employee" },
  u_park: { id:"u_park", name:"박지훈", title:"프로덕트 매니저(PM)", track:"pm",        level:"시니어", exp:"경력 8년", role:"employee" },
  u_choi: { id:"u_choi", name:"최영희", title:"프론트엔드 개발자",  track:"developer", level:"주니어", exp:"2년차",    role:"employee" },
  u_jung: { id:"u_jung", name:"정소라", title:"QA 엔지니어",        track:"qa",        level:"미들",   exp:"경력 3년", role:"employee" },
  u_eval: { id:"u_eval", name:"김영희", title:"개발팀 리드",        track:"developer", level:"리드",   exp:"경력 11년", role:"evaluator" },
  u_admin:{ id:"u_admin",name:"관리자", title:"인사 운영",          track:"hr",        level:"",       exp:"",         role:"admin" },
};
/* 조직 트리 — 본부 > 팀 > 사람 (사내 계정에서 불러온다고 가정) */
const ORG = [
  { dept:"프로덕트본부", teams:[
    { team:"프로덕트팀", members:[["u_park","박지훈","프로덕트 매니저(PM)","pm","시니어","경력 8년"],["u_p02","한서준","프로덕트 매니저(PM)","pm","미들","경력 5년"],["u_p03","윤가은","프로덕트 매니저(PM)","pm","주니어","2년차"],["u_p04","오도현","그로스 PM","pm","시니어","경력 9년"]] },
    { team:"디자인팀", members:[["u_lee","이지은","프로덕트 디자이너","designer","미들","경력 4년"],["u_d02","강하늘","프로덕트 디자이너","designer","시니어","경력 7년"],["u_d03","송민재","UX 리서처","designer","미들","경력 4년"],["u_d04","배수아","비주얼 디자이너","designer","주니어","1년차"],["u_d05","임채원","디자인 시스템 디자이너","designer","시니어","경력 8년"]] },
    { team:"기획팀", members:[["u_k01","조예린","서비스 기획자","planner","미들","경력 5년"],["u_k02","신재혁","서비스 기획자","planner","시니어","경력 10년"],["u_k03","문다희","서비스 기획자","planner","주니어","2년차"],["u_k04","권태양","데이터 기획자","planner","미들","경력 4년"]] },
  ]},
  { dept:"개발본부", teams:[
    { team:"백엔드팀", members:[["u_kim","김민수","백엔드 개발자","developer","시니어","경력 6년"],["u_b02","장우진","백엔드 개발자","developer","미들","경력 4년"],["u_b03","서지호","백엔드 개발자","developer","주니어","1년차"],["u_b04","노아람","백엔드 개발자","developer","시니어","경력 9년"],["u_b05","황인범","백엔드 개발자","developer","미들","경력 3년"],["u_b06","유나경","백엔드 개발자","developer","주니어","2년차"]] },
    { team:"프론트엔드팀", members:[["u_choi","최영희","프론트엔드 개발자","developer","주니어","2년차"],["u_f02","안도윤","프론트엔드 개발자","developer","시니어","경력 7년"],["u_f03","구서연","프론트엔드 개발자","developer","미들","경력 4년"],["u_f04","류지안","프론트엔드 개발자","developer","미들","경력 5년"],["u_f05","표하은","프론트엔드 개발자","developer","주니어","1년차"]] },
    { team:"플랫폼팀", members:[["u_i01","차승우","플랫폼 엔지니어","developer","시니어","경력 11년"],["u_i02","홍예준","SRE","developer","미들","경력 5년"],["u_i03","백시우","플랫폼 엔지니어","developer","주니어","2년차"],["u_i04","엄지후","보안 엔지니어","developer","시니어","경력 8년"]] },
    { team:"데이터팀", members:[["u_t01","남궁현","데이터 엔지니어","developer","미들","경력 4년"],["u_t02","제갈윤","ML 엔지니어","developer","시니어","경력 7년"],["u_t03","방은서","데이터 분석가","planner","주니어","1년차"]] },
  ]},
  { dept:"품질본부", teams:[
    { team:"QA팀", members:[["u_jung","정소라","QA 엔지니어","qa","미들","경력 3년"],["u_q02","양준호","QA 엔지니어","qa","시니어","경력 8년"],["u_q03","심유진","QA 자동화 엔지니어","qa","미들","경력 5년"],["u_q04","탁민","QA 엔지니어","qa","주니어","1년차"]] },
    { team:"운영팀", members:[["u_o01","고은채","서비스 운영","planner","미들","경력 6년"],["u_o02","변하준","CS 운영 리드","planner","시니어","경력 9년"],["u_o03","추예나","서비스 운영","planner","주니어","2년차"]] },
  ]},
];
ORG.forEach(dp => dp.teams.forEach(t => t.members.forEach(m => { const [id,name,title,track,level,exp] = m; USERS[id] = Object.assign(USERS[id] || {}, { id, name, title, track, level, exp, role:"employee", dept:dp.dept, team:t.team }); })));
const BYNAME = Object.fromEntries(Object.values(USERS).map(u => [u.name, u]));

const TRACK_KO = { developer:"개발자", designer:"디자이너", pm:"프로덕트 매니저", planner:"기획자", qa:"QA", hr:"인사" };

/* 경력 수준별 기대 (핸드오프 문서 §5) */
const EXPECT = {
  "주니어": ["맡은 범위를 빠짐없이 끝냈나", "문제와 도움 요청을 제때 공유했나", "피드백을 반영해 품질을 올렸나", "테스트 · 문서 · 인수인계를 마쳤나", "지원 의존도가 줄었나"],
  "미들":   ["맡은 범위를 독립적으로 끝냈나", "문제를 먼저 찾아 공유했나", "검토로 결정이나 결과물을 바꿨나", "다른 사람 작업과 연결했나"],
  "시니어": ["모호한 문제를 실행 가능한 구조로 만들었나", "위험을 사전에 발견했나", "중요한 결정을 내리거나 개선했나", "다른 구성원이 일할 구조를 만들었나", "팀의 재작업을 줄였나"],
  "리드":   ["팀 간 영향을 만들었나", "결정의 품질을 높였나"],
};
/* 직무별 역량 항목 (핸드오프 문서) */
const TRACK_ITEMS = {
  developer:"기술 문제 해결 · 아키텍처 · 구현 품질 · 리스크 관리 · 협업",
  designer:"문제 정의 · 사용자 경험 사고 · 디자인 품질 · 디자인 시스템 · 개발 인계",
  pm:"우선순위 결정 · 의사결정 · 리스크 관리 · 이해관계자 정렬 · 일정 완수",
  planner:"문제 정의 · 리서치 · 요구사항 정의 · 구조화 · 의사결정 지원",
  qa:"테스트 설계 · 결함 재현 · 배포 판정 · 자동화 · 협업",
};

/* 6단계 */
const STAGES = ["problem","proposal","review","decision","execution","result"];
const STAGE_KO = { problem:"시작", proposal:"해결 제안", review:"검토", decision:"결정", execution:"만듦", result:"결과" };
const STAGE_SHORT = { problem:"시작", proposal:"제안", review:"검토", decision:"결정", execution:"만듦", result:"결과" };
const KIND_KO = { req:"기획", issue:"이슈" };
const SRC_KO = { slack:"Slack", github:"GitHub", jira:"Jira", figma:"Figma", confluence:"Confluence", minutes:"회의록", file:"첨부", deploy:"배포" };

/* 증거: 세 질문 → 있음 · 약함 · 없음 */
const CONF_RULE = k => !k ? "없음" : (k.changed && k.contains) ? "있음" : (k.changed || k.contains || k.used) ? "약함" : "없음";
const CONF_LABEL = { "있음":"증거 있음", "약함":"증거 약함", "없음":"증거 없음" };
const CONF_TONE  = { "있음":"green", "약함":"yellow", "없음":"gray" };
const CONF_HINT  = { "있음":"① 뒤에 바뀌었고 ② 내 말이 담겨 있다", "약함":"둘 중 하나만, 또는 남이 내 말을 가져다 썼다", "없음":"말만 있다 → 자료 부족" };

/* 상태 (내부값 → 화면 말) */
const STATUS_KO   = { "자료 필요":"자료 부족", "진행":"만드는 중", "잠정":"결과 전", "확정":"끝남" };
const STATUS_TONE = { "자료 필요":"orange", "진행":"accent", "잠정":"teal", "확정":"green" };
const STATUS_HINT = { "자료 필요":"기록이 모자람 — 자료를 붙이면 다시 봄", "진행":"중간 결과물 있음, 아직 배포 전", "잠정":"실행됐고 결과 전", "확정":"배포 · 결과 숫자 있음" };

/* ── 3차: 현재 상태 꼬리표 (만듦 · 결과 단계에만). 기록이 있을 때만 붙이고, 없으면 "확인 안 됨" ── */
const NOW_KO   = { use:"사용 중", changed:"변경됨", reverted:"되돌려짐", replaced:"대체됨", ended:"종료됨", unknown:"확인 안 됨" };
const NOW_TONE = { use:"green", changed:"teal", reverted:"orange", replaced:"gray", ended:"gray", unknown:"gray" };
const NOW_RULE = { use:"기준일 이후 그 코드 · 문서를 고친 커밋이 없음", changed:"그 부분을 다른 사람이 고친 커밋 · 수정 이력이 있음", reverted:"revert 커밋 또는 되돌린 PR이 있음", replaced:"새 결과물에 \"X 대신\" · \"#번호 대체\"처럼 옛 것을 가리키는 문장이 있음", ended:"삭제 커밋 · 기능 플래그 끔 · \"종료\" 결론 줄이 있음", unknown:"위 기록이 하나도 없음 — 추측으로 채우지 않음" };
/* 3차: 결과 숫자 비교 가능성 — 형식만 확인 (좋고 나쁨은 보지 않음) */
const CMP_KO = { metric:"같은 지표인가", source:"같은 데이터 출처인가", target:"측정 대상이 같은가", period:"측정 기간이 표시돼 있는가", order:"배포 전후의 시간 순서가 맞는가", afterDeploy:"후 숫자가 배포 이후에 기록됐는가" };
/* 3차: 정정 요청 — 오류 유형 · 처리 결과 */
const ERR_TYPES = ["잘못된 사람", "잘못된 업무 묶음", "잘못된 단계", "잘못된 기록 연결", "중복 기록", "누락된 기록"];
const RESOLVE_TYPES = ["수용", "일부 수용", "근거 부족", "다른 기록으로 재연결"];
/* 3차: 본인 확인 선택지 · 업무 묶음 수정 선택지 ("평가에 동의"는 쓰지 않는다) */
const SELF_CHOICES = ["사실관계가 맞음", "내 업무가 아님", "기록 연결이 틀림", "업무 묶음이 틀림", "빠진 자료 추가", "설명 추가"];
const BUNDLE_EDITS = ["같은 일 맞음", "다른 일로 분리", "다른 업무 묶음과 합치기", "내 업무가 아님", "일부 기록만 내 업무", "누락된 기록 추가"];
/* 3차: 평가자 화면에서 제공하지 않는 것 */
const NOT_PROVIDED = ["팀 내 상위 기여자", "평균보다 많음 · 적음", "기여 건수 순위", "참여 단계 점수", "사람별 기여 비율", "고성과자 자동 추천"];
/* 3차: 관리자 — 판정 규칙 버전 */
const RULE_INFO = { version:"v3 (3차)", at:"2026.09.13", prev:"v2 (2차) 2026.08.30", formats:['회의록 결정: "결론 :" 줄', "요구사항: 목표 · 배경", "이슈: 숫자 · 링크 · 재현 방법 + 어느 요구사항의 후속인지", "결과: 전 숫자 + 후 숫자, 각각 어디서 · 언제"], sources:"Slack 허용 채널 · GitHub · Jira · Confluence · Figma", dm:"개인 메시지 · 비공개 채널 수집 차단 (변경 불가)", raw:"원문 접근 가능 — 모든 연결에 원문 링크", sync:"2026.09.13 06:00", del:"연동 해제만 가능. 기록 · 이력은 지우지 않는다" };

/* 평가기간 */
const PERIODS = {
  per_h1: { id:"per_h1", name:"2026 상반기 최종", type:"최종", half:"상반기", start:"2026.01.01", end:"2026.06.30", locked:true,  snapshotAt:"2026.01.01" },
  per_h2: { id:"per_h2", name:"2026 하반기 중간", type:"중간", half:"하반기", start:"2026.07.01", end:"2026.12.31", locked:true,  snapshotAt:"2026.07.01" },
};

/* 프로젝트 — 관리 정보는 관리자가 설정 (대상자는 입력하지 않음) */
const PROJECTS = [
  { id:"p_orion", name:"프로젝트 오리온", desc:"AI 고객지원 서비스 구축", status:"진행 중", period:"per_h2", from:"2026.07.01", to:"2026.09.30", cutoff:"2026.09.30",
    problem:"CS 응답 지연과 반복 문의로 상담 품질이 떨어짐", outcome:"AI 초안으로 평균 응답 시간 40% 단축",
    members:["u_kim","u_lee","u_park","u_choi","u_jung"], myRole:"관리자",
    tools:{ slack:"ok", github:"ok", figma:"ok", jira:"ok", confluence:"ok" },
    conn:{ text:"5개 연결됨", tone:"green" }, review:{ text:"검토 중", tone:"teal" }, next:{ text:"평가 확인", to:"#/evaluation/p_orion" },
    milestones:["8/28 초안 엔진 v1 내부 배포", "9/18 인증 개선 v2.4.1 배포", "9/30 중간 평가 기준일"] },
  { id:"p_pilot", name:"CS 파일럿", desc:"CS 챗봇 파일럿", status:"종료", period:"per_h1", from:"2026.02.01", to:"2026.06.30", cutoff:"2026.06.30",
    problem:"CS 자동응답 도입 가능성 검증", outcome:"파일럿 결과로 오리온 추진 결정",
    members:["u_kim","u_park"], myRole:"관리자",
    tools:{ slack:"ok", github:"ok", confluence:"ok" },
    conn:{ text:"3개 연결됨", tone:"green" }, review:{ text:"평가 완료", tone:"green" }, next:{ text:"결과 보기", to:"#/evaluation/p_pilot" },
    milestones:["3/20 파일럿 설계 승인", "5/10 파일럿 배포", "6/30 최종 평가"] },
  { id:"p_pay", name:"결제 리뉴얼", desc:"결제 리뉴얼", status:"진행 중", period:"per_h2", from:"2026.09.01", to:"2026.12.31", cutoff:"2026.12.31",
    problem:"결제 플로우 이탈률 15%", outcome:"이탈률 10% 이하",
    members:["u_park","u_k01","u_kim","u_choi","u_lee","u_jung","u_o01","u_i02"], myRole:"관리자",
    tools:{ slack:"ok", github:"ok", jira:"ok", confluence:"ok", figma:"ok" },
    conn:{ text:"5개 연결됨", tone:"green" }, review:{ text:"검토 중", tone:"teal" }, next:{ text:"평가 확인", to:"#/evaluation/p_pay" },
    milestones:["10/15 결제 화면 리뉴얼 배포", "12/31 중간 평가 기준일"] },
  { id:"p_wiki", name:"위키 이전", desc:"사내 위키 이전", status:"진행 중", period:"per_h2", from:"2026.08.01", to:"2026.10.15", cutoff:"2026.10.15",
    problem:"구 위키 검색 불가 · 문서 유실", outcome:"Confluence로 전량 이전",
    members:["u_lee","u_park","u_kim"], myRole:"관리자",
    tools:{ slack:"ok", confluence:"ok" },
    conn:{ text:"2개 연결됨", tone:"green" }, review:{ text:"자료 필요", tone:"orange" }, next:{ text:"자료 제출", to:"#/requests", primary:true },
    milestones:["9/10 이전 범위 확정", "10/15 이전 완료"] },
];
const PROJ = Object.fromEntries(PROJECTS.map(p => [p.id, p]));

/* ── 기록(entry) 생성 도우미 ── */
let _eid = 0;
function E(stage, person, date, source, quote, after, checks, status, extra) {
  return Object.assign({ id:"e"+(++_eid), stage, person, date, source, quote, after: after || null,
    checks: checks || { changed:false, contains:false, used:false }, status: status || "자료 필요" }, extra || {});
}
const Y = (c, n, u) => ({ changed:!!c, contains:!!n, used:!!u });

/* 결정 줄의 결정자: "결론 (이름) :" 처럼 이름이 있을 때만. 없으면 "팀" */
function deciderOf(line) { const m = /결론\s*\(([^)]+)\)/.exec(line || ""); return m ? m[1].trim() : "팀"; }

/* ── 프로젝트별 작업 묶음 ── */
const BUNDLES = {
  p_orion: [
    { id:"wb_engine", kind:"req", title:"답변 초안 생성 엔진 v1", deployed:"8/28", common:"초안 엔진 · 수정 비율", entries:[
      E("problem","박지훈","7/02","confluence","요구사항: 상담 평균 응답 시간 6분 → 3.5분(40% 단축). AI 초안을 상담사가 수정해 보내는 구조",
        { quote:"PROJ-301 생성: 답변 초안 엔진 v1 — 평균 응답 시간 40% 단축 목표 (담당 김민수)", source:"jira", date:"7/03" }, Y(1,1,1), "확정", { kind:"req", evidence:"목표 수치 있음", cite:"40% 단축" }),
      E("proposal","김민수","7/05","slack","초안은 최근 100건 유사 상담을 검색해 뽑고, 상담사 수정 비율을 로그로 남기는 방식이면 어떨까요",
        { quote:"결론 : 유사 상담 검색 + 수정 비율 로그 방식으로 v1 진행", source:"minutes", date:"7/07" }, Y(1,1,1), "확정", { cite:"유사 상담 검색", shape:"그대로 채택" }),
      E("review","이지은","7/06","figma","초안이 그대로 나가면 상담사가 못 고칩니다. 수정 영역을 먼저 띄우는 화면으로 바꿔야 해요 (시안 v2)",
        { quote:"결론 : 수정 영역 우선 노출 — 이지은 시안 v2 기준", source:"minutes", date:"7/07" }, Y(1,1,1), "확정", { cite:"수정 영역", changedWhat:"결정" }),
      E("decision","팀","7/07","minutes","결론 : 유사 상담 검색 + 수정 비율 로그 방식으로 v1 진행, 수정 영역 우선 노출 — 이지은 시안 v2 기준",
        { quote:"PR #471 — 초안 엔진 v1 (검색 + 수정 로그)", source:"github", date:"8/05" }, Y(1,1,0), "확정"),
      E("execution","김민수","8/05","github","PR #471 — 초안 엔진 v1 (검색 + 수정 로그)",
        { quote:"v1 내부 배포 — PR #471 포함, 기준일까지 되돌림 없음", source:"deploy", date:"8/28" }, Y(1,1,0), "확정", { remains:"지금도 쓰임", now:{ k:"use", rec:"8/28 이후 draft-engine/ 수정 커밋 없음" } }),
      E("result","팀","8/28","confluence","결과: 초안 채택률 78%, 평균 응답 시간 6.0분 → 3.9분",
        null, Y(1,1,0), "확정", { before:"6.0분", afterValue:"3.9분", where:"Confluence 8/28", period:"배포 전 2주 · 후 2주", now:{ k:"use", rec:"9월 주간 리포트에 같은 지표 계속 기록" } }),
      E("proposal","박지훈","7/05","slack","좋아요, 그 방향으로 가죠", null, Y(0,0,0), "잠정", { skip:"승인 답장" }),
    ]},
    { id:"wb_auth", kind:"issue", parent:"wb_engine", title:"로그인 세션 만료 시 반복 로그아웃 개선", deployed:"9/18", common:"세션 만료 · 반복 로그아웃 · PROJ-388", entries:[
      E("problem","김민수","9/12","slack","로그인 세션 만료 시 반복 로그아웃이 나요. 이번 주 CS 문의 9건, 원인은 토큰 갱신 타이밍으로 보입니다",
        { quote:"PROJ-388 생성: 세션 만료 반복 로그아웃 (담당 김민수)", source:"jira", date:"9/12" }, Y(1,1,1), "확정", { evidence:"숫자 있음", cite:"세션 만료 시 반복 로그아웃", citeAfter:"세션 만료 반복 로그아웃" }),
      E("problem","김민수","9/12","slack","원인 찾았습니다. 갱신 토큰이 탭마다 따로 돌아요",
        { quote:"PROJ-388: 세션 만료 반복 로그아웃", source:"jira", date:"9/12" }, Y(1,1,0), "확정", { dup:true }),
      E("problem","최영희","9/16","github","이슈 #93 — 두 탭에서 동시에 갱신하면 하나가 실패 (재현 순서 첨부)",
        { quote:"PR #492 — 두 탭 동시에 갱신 시 경쟁 상태 처리 추가", source:"github", date:"9/16" }, Y(1,1,0), "확정", { evidence:"재현 방법 있음", cite:"동시에 갱신" }),
      E("proposal","김민수","9/13","slack","Refresh Token을 서버에서 한 번만 갱신하고 탭은 공유 저장소를 보게 하면 어떨까요",
        { quote:"결론 (박지훈) : Refresh Token 서버 단일 갱신으로 간다. 김민수 백엔드, 최영희 프론트", source:"minutes", date:"9/14" }, Y(1,1,1), "확정", { cite:"Refresh Token을 서버에서 한 번만 갱신", citeAfter:"Refresh Token 서버 단일 갱신", shape:"그대로 채택" }),
      E("review","이지은","9/14","figma","갱신 중에는 화면이 멈춘 것처럼 보여요. 갱신 흐름에 로딩 상태를 넣은 시안 공유합니다",
        { quote:"결론 (박지훈) : … 갱신 중 로딩 상태 포함", source:"minutes", date:"9/14" }, Y(1,1,0), "확정", { cite:"갱신 흐름에 로딩 상태", citeAfter:"갱신 중 로딩 상태 포함", changedWhat:"결과물" }),
      E("decision","박지훈","9/14","minutes","결론 (박지훈) : Refresh Token 서버 단일 갱신으로 간다. 김민수 백엔드, 최영희 프론트, 갱신 중 로딩 상태 포함",
        { quote:"PR #492 — 서버 단일 갱신 + 경쟁 상태 처리", source:"github", date:"9/15" }, Y(1,1,0), "확정"),
      E("execution","김민수","9/15","github","PR #492 — 서버 단일 갱신 + 경쟁 상태 처리",
        { quote:"v2.4.1 배포 — PR #492, #495 포함, 기준일까지 되돌림 없음", source:"deploy", date:"9/18" }, Y(1,1,0), "확정", { remains:"지금도 쓰임", now:{ k:"use", rec:"9/18 이후 auth/refresh.ts 수정 커밋 없음" } }),
      E("execution","최영희","9/16","github","PR #495 — 프론트 갱신 흐름 · 로딩 상태 · 탭 공유 저장소",
        { quote:"v2.4.1 배포 — PR #492, #495 포함", source:"deploy", date:"9/18" }, Y(1,1,0), "확정", { remains:"지금도 쓰임", shared:"김민수 PR #492와 같은 기능 — 범위 경계 확인", now:{ k:"changed", rec:"10/02 PR #510 (이지은) 로딩 문구 수정" } }),
      E("review","정소라","9/17","jira","PROJ-388 검증: 3개 탭 동시 갱신 20회 통과, 세션 만료 재현 0건",
        { quote:"v2.4.1 배포 판정 완료 — PROJ-388 검증 통과 기준", source:"deploy", date:"9/18" }, Y(1,1,0), "확정", { changedWhat:"테스트" }),
      E("result","팀","9/25","slack","배포 후 1주: 반복 로그아웃 CS 문의 9건 → 0건",
        null, Y(1,1,0), "확정", { before:"9건", afterValue:"0건", where:"Slack #orion-cs 9/25", period:"배포 전 1주 · 후 1주", now:{ k:"use", rec:"10월 CS 리포트에 같은 지표 계속 기록" } }),
    ]},
    { id:"wb_latency", kind:"issue", parent:"wb_engine", title:"답변 생성 지연 원인 분석", common:"생성 지연 · p95 · 인덱스", uncertain:"엔진 v1의 후속인지, 별도 일인지 — 요구사항 표시 없음", entries:[
      E("problem","김민수","9/06","confluence","p95 생성 시간 8.2초. 검색 단계가 6초 차지 — 인덱스 구조 문제로 추정 (측정 로그 첨부)",
        { quote:"PROJ-402 생성: 생성 지연 분석 — p95 8.2초, 검색 단계 6초 (담당 김민수)", source:"jira", date:"9/06" }, Y(1,1,1), "확정", { evidence:"숫자 있음", cite:"p95" }),
      E("proposal","김민수","9/06","slack","검색 인덱스를 상담 유형별로 분리하면 2초대까지 줄일 수 있을 것 같습니다. 다음 스프린트에 실험 제안",
        { quote:"결론 : 인덱스 분리는 10월 스프린트로 이월", source:"minutes", date:"9/07" }, Y(1,1,0), "잠정", { cite:"인덱스를 상담 유형별로 분리" }),
      E("decision","팀","9/07","minutes","결론 : 인덱스 분리는 10월 스프린트로 이월",
        null, Y(0,1,0), "잠정", { note:"10월 스프린트로 — 결과 전" }),
    ]},
    { id:"wb_history", kind:"req", title:"상담 이력 화면 개편", entries:[
      E("problem","박지훈","7/20","confluence","요구사항: 상담사가 이전 대화를 3클릭 안에 찾을 수 있게 (현재 평균 7클릭)",
        { quote:"PROJ-320 생성: 상담 이력 화면 개편 — 이전 대화 3클릭 안에 (담당 이지은 · 최영희)", source:"jira", date:"7/21" }, Y(1,1,1), "확정", { kind:"req", evidence:"목표 수치 있음", cite:"3클릭" }),
      E("proposal","이지은","7/24","figma","타임라인형 이력 + 고정 검색창 시안 v1",
        { quote:"결론 : 타임라인형으로 진행 (이지은 시안 v1)", source:"minutes", date:"7/26" }, Y(1,1,1), "확정", { cite:"타임라인형", shape:"고쳐서 채택" }),
      E("review","최영희","7/25","slack","타임라인은 1,000건 넘는 고객에서 느려집니다. 가상 스크롤 전제로 가야 해요",
        { quote:"결론 : 타임라인형으로 진행 — 가상 스크롤 전제", source:"minutes", date:"7/26" }, Y(1,1,0), "확정", { cite:"가상 스크롤", changedWhat:"결정" }),
      E("decision","팀","7/26","minutes","결론 : 타임라인형으로 진행 (이지은 시안 v1) — 가상 스크롤 전제",
        { quote:"PR #480 — 이력 타임라인 (가상 스크롤)", source:"github", date:"8/19" }, Y(1,1,0), "확정"),
      E("execution","최영희","8/19","github","PR #480 — 이력 타임라인 (가상 스크롤)",
        { quote:"스테이징 배포 — PR #480 포함, 결과 측정 전", source:"deploy", date:"9/02" }, Y(1,1,0), "잠정", { remains:"지금도 쓰임", now:{ k:"unknown", rec:"스테이징만 — 운영 배포 · 수정 기록 없음" } }),
      E("review","정소라","9/03","jira","PROJ-320 검증: 1,500건 고객 스크롤 60fps 유지, 검색 3클릭 확인",
        { quote:"스테이징 통과 — PROJ-320 검증 기준", source:"jira", date:"9/03" }, Y(1,1,0), "잠정", { changedWhat:"테스트" }),
    ]},
    { id:"wb_upload", kind:"issue", parent:"wb_history", title:"첨부 이미지 업로드 실패", deployed:"9/10", entries:[
      E("problem","정소라","9/04","jira","PROJ-410: 5MB 이상 이미지 첨부 시 실패. 재현 순서 · 로그 첨부",
        { quote:"PR #488 — 5MB 넘는 파일 분할 전송", source:"github", date:"9/08" }, Y(1,1,1), "확정", { evidence:"재현 방법 있음", cite:"5MB" }),
      E("proposal","최영희","9/05","slack","분할 전송으로 바꾸면 됩니다. 라이브러리 교체 없이 가능해요",
        { quote:"PR #488 — 5MB 넘는 파일 분할 전송", source:"github", date:"9/08" }, Y(1,1,0), "확정", { cite:"분할 전송" }),
      E("execution","최영희","9/08","github","PR #488 — 5MB 넘는 파일 분할 전송",
        { quote:"v2.4.0 배포 — PR #488 포함", source:"deploy", date:"9/10" }, Y(1,1,0), "확정", { remains:"지금도 쓰임", now:{ k:"use", rec:"9/10 이후 upload/ 수정 커밋 없음" } }),
      E("result","팀","9/12","jira","업로드 실패 0건 (배포 후 2일)", null, Y(1,1,0), "확정", { before:"실패 12건/일", afterValue:"0건", where:"Jira 9/12", cmp:{ period:false }, note:"후 숫자가 배포 뒤 2일치 — 전 숫자(일 평균)와 기간이 다름" }),
    ]},
    { id:"wb_alert", kind:"issue", title:"상담사 알림 지연", entries:[
      E("problem","박지훈","9/20","slack","알림이 좀 늦는 것 같아요, 확인 부탁드려요", null, Y(0,0,0), "자료 필요", { evidence:"근거 없음", note:"숫자 · 링크 · 다시 해보는 방법이 없고 뒤 기록도 없음" }),
    ]},
  ],
  p_pilot: [
    { id:"wb_design", kind:"req", title:"CS 파일럿 설계", deployed:"5/10", entries:[
      E("problem","박지훈","2/03","confluence","요구사항: 자동응답으로 1차 응답 1분 이내 (현재 평균 11분)",
        { quote:"PROJ-120 생성: CS 파일럿 — 1분 이내 자동 응답 목표 (담당 김민수)", source:"jira", date:"2/04" }, Y(1,1,1), "확정", { kind:"req", evidence:"목표 수치 있음", cite:"1분 이내" }),
      E("proposal","김민수","2/10","confluence","FAQ 검색 + 상담사 승인 구조로 2주 파일럿 제안",
        { quote:"결론 (박지훈) : FAQ 검색 + 승인 구조로 파일럿 진행", source:"minutes", date:"2/12" }, Y(1,1,1), "확정", { cite:"FAQ 검색", shape:"그대로 채택" }),
      E("decision","박지훈","2/12","minutes","결론 (박지훈) : FAQ 검색 + 승인 구조로 파일럿 진행",
        { quote:"PR #210 — 파일럿 백엔드 (FAQ 검색 + 승인 구조)", source:"github", date:"4/20" }, Y(1,1,0), "확정"),
      E("execution","김민수","4/20","github","PR #210 — 파일럿 백엔드",
        { quote:"파일럿 배포 — PR #210 포함", source:"deploy", date:"5/10" }, Y(1,1,0), "확정", { remains:"지금도 쓰임", now:{ k:"replaced", rec:"8/05 PR #471 설명에 \"파일럿 템플릿 대신 초안 엔진 v1\"" } }),
      E("result","팀","6/20","confluence","1차 응답 11분 → 0.8분, 승인률 64%", null, Y(1,1,0), "확정", { before:"11분", afterValue:"0.8분", where:"Confluence 6/20", period:"배포 전 4주 · 후 4주", now:{ k:"replaced", rec:"8/05 PR #471 설명에 \"파일럿 템플릿 대신 초안 엔진 v1\"" } }),
    ]},
  ],
  p_pay: [
    { id:"wb_pg", kind:"req", title:"PG 연동 — 네이버페이 포함 여부", deployed:"10/15", entries:[
      E("problem","박지훈","9/01","confluence","요구사항: PG 1차 연동은 카드 · 계좌이체 · 카카오페이. 네이버페이는 수수료 3.4%(카드 2.9%)와 스마트스토어 연동 여부 때문에 보류 중",
        { quote:"PAY-30 생성: PG 연동 1차 — 네이버페이 포함 (담당 김민수 · 최영희)", source:"jira", date:"9/02" }, Y(1,1,1), "확정", { kind:"req", evidence:"목표 수치 있음", cite:"네이버페이" }),
      E("review","조예린","9/03","confluence","경쟁사 조사: 상위 5개 몰 모두 네이버페이 제공, 모바일 결제 중 네이버페이 비중 평균 31%",
        { quote:"결론 (박지훈) : … 네이버페이는 가맹 심사를 지금 신청하고 2차(11/15)에 추가", source:"minutes", date:"9/08" }, Y(1,1,0), "확정", { cite:"네이버페이", changedWhat:"결정" }),
      E("review","김민수","9/04","slack","네이버페이는 별도 가맹 심사 2주 + 결제창 분리가 필요해서 1차 배포(10/15)에는 못 맞춥니다",
        { quote:"결론 (박지훈) : 1차는 카드 · 계좌 · 카카오페이로 배포, 네이버페이는 2차(11/15)", source:"minutes", date:"9/08" }, Y(1,1,0), "확정", { cite:"2차", changedWhat:"결정" }),
      E("problem","고은채","9/05","jira","OPS-88: '네이버페이 되나요' CS 문의 월 46건",
        { quote:"결론 (박지훈) : … 네이버페이는 가맹 심사를 지금 신청", source:"minutes", date:"9/08" }, Y(1,1,0), "확정", { evidence:"숫자 있음", cite:"네이버페이" }),
      E("decision","박지훈","9/08","minutes","결론 (박지훈) : 1차는 카드 · 계좌 · 카카오페이로 배포, 네이버페이는 가맹 심사를 지금 신청하고 2차(11/15)에 추가",
        { quote:"PR #512 — PG 공통 결제 모듈 (카드 · 계좌 · 카카오페이, 결제수단 설정으로 켜고 끔)", source:"github", date:"10/02" }, Y(1,1,0), "확정"),
      E("proposal","이지은","9/09","figma","결제수단 선택 화면 시안 — 2차에 네이버페이 버튼이 들어갈 자리를 비워 두는 구조",
        { quote:"PR #530 — 결제수단 선택 UI (네이버페이 자리 예약)", source:"github", date:"10/06" }, Y(1,1,1), "확정", { cite:"자리", shape:"그대로 채택" }),
      E("execution","김민수","10/02","github","PR #512 — PG 공통 결제 모듈, 결제수단을 설정으로 켜고 끌 수 있게",
        { quote:"1차 배포 — PR #512, #530 포함, 기준일까지 되돌림 없음", source:"deploy", date:"10/15" }, Y(1,1,0), "확정", { remains:"지금도 쓰임", now:{ k:"use", rec:"10/15 이후 pg/ 수정 커밋 없음" } }),
      E("execution","최영희","10/06","github","PR #530 — 결제수단 선택 UI · 결제창 호출 · 실패 시 재시도 안내",
        { quote:"1차 배포 — PR #512, #530 포함", source:"deploy", date:"10/15" }, Y(1,1,0), "확정", { remains:"지금도 쓰임", now:{ k:"use", rec:"10/15 이후 수정 커밋 없음" } }),
      E("review","정소라","10/12","jira","PAY-41 검증: 결제수단별 성공 · 실패 · 취소 36개 케이스 통과, 금액 불일치 버그 1건 발견",
        { quote:"금액 불일치 수정 커밋 (김민수)", source:"github", date:"10/13" }, Y(1,1,0), "확정", { changedWhat:"테스트" }),
      E("execution","홍예준","10/15","deploy","1차 배포 실행 (결제 모듈 v1.0)",
        { quote:"1차 배포 후 결제 성공률 97.8% (결제 모듈 v1.0)", source:"deploy", date:"10/15" }, Y(1,1,0), "확정", { remains:"지금도 쓰임", now:{ k:"use", rec:"10/15 이후 수정 커밋 없음" } }),
      E("result","팀","10/15","deploy","1차 배포 — 결제 성공률 97.8% (카드 · 계좌 · 카카오페이)", null, Y(1,1,0), "확정", { before:"결제수단 1종(카드)", afterValue:"3종 · 성공률 97.8%", where:"배포 기록 10/15", cmp:{ metric:false }, note:"전(결제수단 수)과 후(성공률)가 다른 지표" }),
      E("proposal","박지훈","9/04","slack","네, 그럼 2차로 가죠", null, Y(0,0,0), "잠정", { skip:"승인 답장" }),
    ]},
    { id:"wb_pg2", kind:"issue", parent:"wb_pg", title:"PG 연동 2차 — 네이버페이 추가", deployed:"11/15", common:"네이버페이 · OPS-88 · PAY-30 후속", entries:[
      E("problem","고은채","10/20","jira","OPS-88: 네이버페이 가맹 심사 통과",
        { quote:"네이버페이 설정 ON — 2차 배포", source:"deploy", date:"11/15" }, Y(1,1,0), "확정", { evidence:"티켓으로 이어짐", cite:"네이버페이" }),
      E("execution","김민수","11/15","github","네이버페이 결제수단 설정 ON (코드 변경 없음, 설정 PR #588)",
        { quote:"2차 배포 — 네이버페이 설정 PR #588 포함", source:"deploy", date:"11/15" }, Y(1,1,0), "확정", { remains:"지금도 쓰임", now:{ k:"use", rec:"11/15 이후 수정 커밋 없음" } }),
      E("result","팀","11/29","confluence","2차 배포 2주 — 네이버페이 결제 비중 24%, '네이버페이 되나요' 문의 월 46건 → 3건", null, Y(1,1,0), "확정", { before:"문의 46건/월", afterValue:"3건/월 · 네이버페이 비중 24%", where:"Confluence 11/29", cmp:{ period:false }, note:"후 숫자는 배포 뒤 2주치를 월로 환산 — 전 숫자(월)와 기간이 다름" }),
    ]},
    { id:"wb_retry", kind:"req", title:"정기결제 재시도", entries:[
      E("problem","김민수","9/02","slack","정기결제 실패가 하루 40건씩 쌓여요. 로그 보면 PG 타임아웃이에요",
        { quote:"PROJ-510 생성: 정기결제 재시도 — 실패 40건/주 (담당 김민수)", source:"jira", date:"9/02" }, Y(1,1,1), "확정", { evidence:"숫자 있음", cite:"40건" }),
      E("proposal","김민수","9/05","slack","실패하면 3회 재시도 후 CS 큐로 넘기는 방식이면 어떨까요",
        null, Y(0,0,0), "자료 필요", { cite:"3회 재시도", note:"회의록 · GitHub 연결이 확인되지 않아 뒤 기록을 찾지 못함" }),
    ]},
    { id:"wb_checkout", kind:"req", title:"결제 화면 리뉴얼", entries:[
      E("problem","최영희","9/08","slack","결제 2단계에서 이탈 15%. 입력칸 11개가 원인으로 보여요",
        null, Y(0,0,0), "자료 필요", { evidence:"숫자 있음", note:"Slack 채널 권한 확인 필요 — 뒤 기록 수집 안 됨" }),
    ]},
  ],
  p_wiki: [
    { id:"wb_scope", kind:"req", title:"이전 범위 확정", entries:[
      E("problem","박지훈","8/04","confluence","요구사항: 3년 이상 미수정 문서는 보관, 나머지 1,240건 이전",
        { quote:"결론 (박지훈) : 1,240건 이전, 보관 문서는 읽기 전용", source:"minutes", date:"8/12" }, Y(1,1,0), "확정", { kind:"req", evidence:"목표 수치 있음", cite:"1,240건" }),
      E("decision","박지훈","8/12","minutes","결론 (박지훈) : 1,240건 이전, 보관 문서는 읽기 전용",
        { quote:"이전 스크립트 1차 실행 — 1,240건 중 620건", source:"confluence", date:"9/10" }, Y(1,1,0), "진행"),
    ]},
    { id:"wb_template", kind:"req", title:"문서 템플릿 정리", entries:[
      E("proposal","이지은","8/20","figma","템플릿 4종으로 통합 시안", null, Y(0,0,0), "자료 필요", { note:"시안은 있으나 결정 · 적용 기록이 연결되지 않음 — 자료 요청" }),
    ]},
    { id:"wb_script", kind:"issue", parent:"wb_scope", title:"이전 스크립트 — 링크 깨짐", deployed:"9/10", common:"이전 스크립트 · 깨진 링크 · WIKI-41", entries:[
      E("problem","김민수","8/26","slack","구 위키 문서 안의 내부 링크가 이전 후 깨집니다. 샘플 50건 중 31건, 경로 형식이 다른 게 원인",
        { quote:"WIKI-41 생성: 이전 후 내부 링크 깨짐 (담당 김민수)", source:"jira", date:"8/26" }, Y(1,1,1), "확정", { evidence:"숫자 있음", cite:"내부 링크가 이전 후 깨집니다", citeAfter:"이전 후 내부 링크 깨짐" }),
      E("proposal","김민수","8/27","slack","링크는 스크립트에서 경로표로 일괄 변환하고, 못 찾은 링크만 목록으로 뽑아 사람이 보면 어떨까요",
        { quote:"결론 (박지훈) : 경로표 일괄 변환 + 미해결 링크 목록으로 간다", source:"minutes", date:"8/28" }, Y(1,1,1), "확정", { cite:"경로표로 일괄 변환", citeAfter:"경로표 일괄 변환", shape:"그대로 채택" }),
      E("decision","박지훈","8/28","minutes","결론 (박지훈) : 경로표 일괄 변환 + 미해결 링크 목록으로 간다",
        { quote:"PR #12 — 링크 경로표 일괄 변환 + 미해결 링크 목록 출력", source:"github", date:"9/03" }, Y(1,1,0), "확정"),
      E("execution","김민수","9/03","github","PR #12 — 링크 경로표 변환 + 미해결 목록 출력",
        { quote:"이전 스크립트 1차 실행 — 620건 (PR #12 반영)", source:"confluence", date:"9/10" }, Y(1,1,0), "확정", { remains:"지금도 쓰임", now:{ k:"use", rec:"9/10 이후 migrate/ 수정 커밋 없음" } }),
      E("result","김민수","9/12","slack","1차 실행 결과: 깨진 링크 31건 → 4건 (샘플 50건 기준)",
        null, Y(0,0,0), "자료 필요", { before:"31건", afterValue:"4건", where:"Slack 9/12 — 전 · 후 숫자를 어디서 쟀는지 기록 없음", period:"미기재", note:"후 숫자 측정 위치 · 날짜가 없어 결과로 확정하지 않음" }),
      E("proposal","김민수","8/29","slack","네, 그렇게 가죠", null, Y(0,0,0), "잠정", { skip:"승인 답장" }),
    ]},
  ],
};
for (const pid in BUNDLES) BUNDLES[pid].forEach(b => b.entries.forEach(e => { e.bundle = b.id; e.project = pid; }));
const WB_SCRIPT_RESULT_ID = BUNDLES.p_wiki.find(b => b.id === "wb_script").entries.find(e => e.stage === "result").id;

/* 데이터 연동 정책 · 접근 기록 */
/* ── 데모용 가라 데이터: 오리온 결과 100개 ── */
(function seedOrion() {
  const people = ["김민수","이지은","박지훈","최영희","정소라"];
  const topics = ["답변 초안 품질","상담 이력 검색","첨부 업로드","세션 갱신","알림 발송","상담사 대시보드","FAQ 자동 분류","응답 지연 알림","고객 태그","CS 리포트","번역 초안","음성 메모 요약","상담 템플릿","만족도 조사","재문의 감지","채널 통합","권한 화면","로그 수집","배치 재시도","캐시 정리"];
  const metrics = [["응답 시간","분",[8,4],[6,3]],["문의","건",[40,12],[25,5]],["오류","건/일",[30,10],[12,0]],["처리율","%",[70,85],[80,97]],["대기","초",[20,9],[12,3]]];
  const src = ["slack","jira","confluence","github"];
  let seq = 0;
  for (let i = 0; i < 100; i++) {
    const m = (i * 7 + 3) % 10 + 7, dd = (i * 13 + 5) % 26 + 2; const md = Math.min(m, 9); const date = `${md}/${String(dd).padStart(2,"0")}`;
    const d2 = `${md}/${String(Math.min(dd + 2, 28)).padStart(2,"0")}`, d3 = `${md}/${String(Math.min(dd + 5, 28)).padStart(2,"0")}`;
    const t = topics[i % topics.length], v = Math.floor(i / topics.length) + 1; const title = `${t} 개선 ${v}차`;
    const n = 1 + (i % 3); const ps = []; for (let k = 0; k < n; k++) ps.push(people[(i + k * 2) % people.length]);
    const kind = i % 7 === 3 ? "dep" : i % 11 === 5 ? "check" : "num"; const mt = metrics[i % metrics.length];
    const before = `${mt[2][0] + (i % 3)}${mt[1]}`, after = `${mt[3][0] + (i % 2)}${mt[1]}`;
    const es = [];
    es.push(E("problem", ps[0], date, src[i % 4], `${t} 문제 — ${mt[0]} ${before} (측정 링크 첨부)`, { quote:`PROJ-${500 + i} 생성: ${title} — ${mt[0]} ${before}`, source:"jira", date }, Y(1,1,1), "확정", { evidence:"숫자 있음", cite:mt[0] }));
    if (ps[1]) es.push(E("proposal", ps[1], date, "slack", `${t}은 ${["캐시","배치","인덱스","큐"][i % 4]} 방식으로 바꾸면 ${mt[0]}을 줄일 수 있습니다`, { quote:`결론 : ${t} ${["캐시","배치","인덱스","큐"][i % 4]} 방식으로 진행`, source:"minutes", date:d2 }, Y(1,1,0), "확정", { cite:["캐시","배치","인덱스","큐"][i % 4] }));
    es.push(E("execution", ps[ps.length - 1], d2, "github", `PR #${600 + i} — ${title}`, { quote:`v2.${5 + (i % 9)}.${i % 10} 배포 — PR #${600 + i} 포함`, source:"deploy", date:d3 }, Y(1,1,0), kind === "dep" ? "잠정" : "확정", { remains:"지금도 쓰임", now:{ k: i % 5 === 4 ? "changed" : "use", rec: i % 5 === 4 ? `${d3} 이후 다른 사람 수정 커밋 1건` : `${d3} 이후 수정 커밋 없음` } }));
    if (kind !== "dep") es.push(E("result", "팀", d3, "confluence", `${mt[0]} ${before} → ${after}`, null, Y(1,1,0), "확정", Object.assign({ before, afterValue: after, where:`Confluence ${d3}`, period:"배포 전 2주 · 후 2주" }, kind === "check" ? { cmp:{ period:false }, note:"후 숫자 측정 기간이 전과 다름" } : {})));
    const id = "g" + (++seq); const firstOf = {};
    BUNDLES.p_orion.push({ id, kind: i % 4 === 0 ? "req" : "issue", title, deployed: d3, common: t, entries: es, _topic: t, _v: v });
  }
  /* 후속 링크: 같은 주제의 2차 · 3차는 1차의 후속. 2차 티켓 설명에 "PROJ-xxx 후속"이 적혀 있는 경우로 본다 */
  const first = {};
  BUNDLES.p_orion.forEach(b => { if (!b._topic) return; if (b._v === 1) first[b._topic] = b; });
  BUNDLES.p_orion.forEach(b => { if (!b._topic || b._v === 1) return; const p = first[b._topic]; if (!p) return; b.parent = p.id;
    const pe = p.entries.find(e => e.after && /PROJ-\d+/.test(e.after.quote)); const pk = pe ? pe.after.quote.match(/PROJ-\d+/)[0] : "";
    const e0 = b.entries[0]; if (e0 && e0.after) { e0.after.quote += ` — ${pk} 후속`; e0.citeAfter = e0.citeAfter || `${pk} 후속`; } });
  BUNDLES.p_orion.forEach(b => { delete b._topic; delete b._v; });
})();

const POLICY = [
  ["개인 메시지 수집", "금지 (변경 불가)"],
  ["프로젝트 외 채널", "수집 안 함"],
  ["수집 범위", "명시적으로 허용된 채널 · 저장소 · 스페이스만"],
  ["수집 기간", "평가기간 시작일 – 기준일"],
  ["원문 열람", "근거마다 저장 · 열람 시 감사 기록 남김"],
  ["보관 기간", "평가 종료 후 24개월 · 삭제 요청 시 30일 내 처리"],
];
const ACCESS_LOG = [
  { at:"2026.07.01 09:20", kind:"연동", text:"김민수 · Slack #orion-development 연결 · 개인 DM 수집 안 함" },
  { at:"2026.08.21 09:00", kind:"첨부", text:"이지은 · 사용성 테스트 결과.pptx 업로드 → 기록 생성" },
  { at:"2026.09.19 08:15", kind:"수집", text:"시스템 · 오리온 5개 소스 동기화 · 기록 31건 · 개인 DM 0건 · 중복 2건 병합" },
  { at:"2026.09.20 09:58", kind:"접근", text:"김영희 · 세션 만료 묶음 원문 9건 열람 (검토)" },
  { at:"2026.09.22 14:10", kind:"요청", text:"김영희 → 박지훈 · 상담사 알림 지연 자료 요청" },
];
const PERMS = [
  { role:"평가 대상자", can:"데이터 연결 · 파일 첨부 · 수집 범위 확인 · 내 기여 열람 · 요청에 설명과 자료 추가", cannot:"목표 · 기간 · 역할 입력, 다른 사람 기록 열람" },
  { role:"평가자",      can:"근거 열람 · 틀린 기록에 요청(전 · 후 · 사유 · 근거) · 검토 완료 · 이력 열람", cannot:"기록 직접 수정 (요청으로만), 가중치 · 기간 변경" },
  { role:"관리자",      can:"프로젝트 · 참여자 · 역할 · 기간 설정 · 연동 정책 · 접근 권한 · 기준 스냅샷 잠금", cannot:"개인 메시지 수집 허용, 평가 시작 후 기준 변경" },
  { role:"시스템 · AI", can:"기록 수집 · 중복 병합 · 작업 묶음 구성 · 뒤에 생긴 일 잇기(인용 있을 때만) · 증거 · 상태 붙이기", cannot:"잘했나 · 못했나 판단, 레벨 · 점수 확정" },
];
const MEMBERS_TABLE = [
  { user:"u_admin", roleKo:"관리자",      projects:"전체",            since:"2026.01.01" },
  { user:"u_eval",  roleKo:"평가자",      projects:"오리온 · 결제 리뉴얼", since:"2026.07.01" },
  { user:"u_kim",   roleKo:"평가 대상자", projects:"오리온 · 결제 리뉴얼 · CS 파일럿", since:"2026.02.01" },
  { user:"u_lee",   roleKo:"평가 대상자", projects:"오리온 · 위키 이전",  since:"2026.07.01" },
  { user:"u_park",  roleKo:"평가 대상자", projects:"오리온 · 위키 이전 · CS 파일럿", since:"2026.02.01" },
  { user:"u_choi",  roleKo:"평가 대상자", projects:"오리온 · 결제 리뉴얼", since:"2026.07.01" },
  { user:"u_jung",  roleKo:"평가 대상자", projects:"오리온",            since:"2026.07.01" },
];

/* 초기 요청(평가자 → 대상자) — 틀린 기록에만 */
const SEED_REQUESTS = [
  { id:"rq1", project:"p_orion", entry:null, bundle:"wb_alert", to:"박지훈", from:"김영희", type:"누락된 기록", before:"'알림이 좀 늦는 것 같아요' — 뒤 기록 없음", after:"지연 시간 · 건수와 관련 티켓 링크", reason:"숫자 · 링크 · 재현 방법 중 하나가 없어 증거 없음", link:"", at:"2026.09.22 14:10", status:"requested" },
  { id:"rq3", project:"p_wiki",  entry:"__wb_script_result", bundle:"wb_script", to:"김민수", from:"김영희", type:"누락된 기록", before:"'깨진 링크 31건 → 4건' — 후 숫자를 어디서 · 언제 쟀는지 없음", after:"후 숫자의 측정 위치(집계 쿼리 · 리포트 링크)와 날짜, 전 숫자와 같은 범위(샘플 50건)인지", reason:"전 · 후 숫자는 있으나 측정 출처가 없어 결과로 확정할 수 없음", link:"", at:"2026.09.24 09:30", status:"requested" },
  { id:"rq2", project:"p_wiki",  entry:null, bundle:"wb_template", to:"이지은", from:"김영희", type:"누락된 기록", before:"템플릿 4종 시안 — 결정 · 적용 기록 없음", after:"시안이 채택된 회의록 결론 줄 또는 적용된 문서 링크", reason:"시안만 있고 뒤에 생긴 일이 연결되지 않음", link:"", at:"2026.09.23 10:00", status:"requested" },
];

/* 연동 카탈로그 (데모) — 연결하면 계정의 채널 · 저장소 · 파일 · 프로젝트 · 스페이스 목록을 받아온다 */
const CATALOG = {
  slack:      { account:"ilro-company.slack.com", label:"채널", ask:["채널 목록 읽기","공개 채널 메시지 읽기 (허용한 채널만)","사용자 이름 조회"], never:["개인 메시지(DM) 읽기","비공개 채널 읽기","메시지 보내기"],
                items:[{id:"#orion-development",note:"C01A2B3D · 공개 · 128명"},{id:"#orion-cs",note:"C01A2B4E · 공개 · 41명"},{id:"#orion-design",note:"C01A2B5F · 공개 · 23명"},{id:"#payments",note:"C01A2C10 · 공개 · 37명 — 다른 프로젝트"},{id:"#general",note:"C01A0001 · 공개 · 전사 — 권장 안 함"},{id:"#pm-leads",note:"비공개 — 권한 없음, 수집 불가",off:true},{id:"DM · 그룹 DM",note:"개인 메시지 — 권한을 요청하지 않음 (변경 불가)",off:true}] },
  github:     { account:"github.com/ilro-company", label:"저장소", ask:["저장소 목록 읽기","이슈 · PR · 리뷰 읽기 (허용한 저장소만)","릴리즈 · 배포 상태 읽기"], never:["코드 쓰기","비공개 저장소 전체 읽기"],
                items:[{id:"orion-api",note:"공개"},{id:"orion-web",note:"공개"},{id:"payments-core",note:"내부"},{id:"wiki-tools",note:"내부"},{id:"infra",note:"내부 · 플랫폼팀"},{id:"hr-system",note:"접근 권한 없음",off:true}] },
  figma:      { account:"ILRO 팀 (figma.com)", label:"파일", ask:["파일 목록 읽기","버전 이력 · 코멘트 읽기 (허용한 파일만)"], never:["파일 편집","개인 초안 읽기"],
                items:[{id:"오리온 디자인",note:"팀 파일"},{id:"결제 리뉴얼",note:"팀 파일"},{id:"디자인 시스템",note:"팀 파일"},{id:"개인 초안",note:"개인 — 수집 안 함",off:true}] },
  jira:       { account:"ilro.atlassian.net", label:"프로젝트", ask:["프로젝트 목록 읽기","이슈 · 상태 변경 이력 읽기 (허용한 프로젝트만)"], never:["이슈 생성 · 수정"],
                items:[{id:"PROJ · 오리온",note:"공개"},{id:"PAY · 결제",note:"공개"},{id:"WIKI · 위키 이전",note:"공개"},{id:"OPS · 운영",note:"공개"},{id:"HR · 인사",note:"접근 권한 없음",off:true}] },
  confluence: { account:"ilro.atlassian.net/wiki", label:"스페이스", ask:["스페이스 목록 읽기","페이지 · 회의록 읽기 (허용한 스페이스만)"], never:["페이지 편집","개인 공간 읽기"],
                items:[{id:"오리온",note:"팀 스페이스"},{id:"결제",note:"팀 스페이스"},{id:"위키 이전",note:"팀 스페이스"},{id:"운영",note:"팀 스페이스"},{id:"개인 공간",note:"개인 — 수집 안 함",off:true}] },
};
const TOOL_ORDER = ["slack","github","figma","jira","confluence"];
