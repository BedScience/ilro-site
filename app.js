/* ═══════════════ 일로 · ILRO — 앱 ═══════════════ */
const $ = (s, el = document) => el.querySelector(s);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[c]));
const badge = (txt, tone = "gray", dot = true) => `<span class="badge ${tone}${dot ? "" : " nodot"}">${esc(txt)}</span>`;
const pill = (txt, tone = "gray") => `<span class="pill ${tone}">${esc(txt)}</span>`;
const avatar = (name, size = 28) => `<span class="av" style="width:${size}px;height:${size}px;font-size:${Math.round(size*0.42)}px">${esc(String(name).slice(0,1))}</span>`;

/* ── 저장소 (이 브라우저에만) ── */
/* 규칙 검증 — 페이지가 열릴 때마다 모든 기록을 규칙에 맞춘다.
   ① 뒤 기록이 있어야 "예" · ② 앞 · 뒤 원문에 같은 말(문장 또는 PR # · 티켓 키 · 버전) 이 실제로 있어야 "예" · 결과는 전 · 후 숫자 + 어디서 · 언제 + 측정 기간이 있어야 끝남 */
function commonPhrase(a, b) {
  const norm = s => String(s || "").replace(/\s+/g, " ");
  a = norm(a); b = norm(b);
  const ids = a.match(/#\d+|[A-Z]{2,}-\d+|v\d+(?:\.\d+)+/g) || [];
  for (const id of ids) if (b.includes(id)) return id;
  let best = "";
  for (let i = 0; i < a.length; i++) for (let j = i + 4; j <= a.length; j++) { const sub = a.slice(i, j); if (sub.length <= best.length) break; if (b.includes(sub)) best = sub; else break; }
  best = best.replace(/^[\s"“”'(),.:·—-]+|[\s"“”'(),.:·—-]+$/g, "");
  return best.length >= 4 && /[가-힣A-Za-z0-9]{2,}/.test(best) ? best : "";
}
const APPROVAL_RE = /^(좋아요|네,? 그렇게|넵|좋습니다|감사합니다|동의합니다|오케이|그렇게 가죠)/;
(function verifyRules() {
  for (const pid in BUNDLES) BUNDLES[pid].forEach(b => b.entries.forEach(e => {
    if (!e.checks) e.checks = { changed:false, contains:false, used:false };
    if (!e.skip && !e.dup && String(e.quote).trim().length < 40 && APPROVAL_RE.test(String(e.quote).trim())) { e.skip = "승인 답장"; e.checks = { changed:false, contains:false, used:false }; }
    if (e.skip || e.dup) return;
    if (e.stage === "result") {
      /* 결과: ① 전 · 후 숫자 ② 어디서 · 언제 + 측정 기간 ③ 다른 곳에서 가져다 씀 */
      e.checks.changed = !!(e.before && e.afterValue);
      e.checks.contains = !!(e.checks.changed && e.where && /\d/.test(e.where) && e.period && !/미기재/.test(e.period));
      if (!e.checks.contains && e.status === "확정") { e.status = "자료 필요"; e.note = e.note || "전 · 후 숫자의 측정 출처 또는 기간이 없어 결과로 확정하지 않음"; }
      e.cite = null; e.citeAfter = null; return;
    }
    const q = String(e.quote), aq = e.after ? String(e.after.quote) : "";
    e.checks.changed = !!e.after;
    if (!e.after) { e.checks.contains = false; e.checks.used = false; e.citeAfter = null; return; }
    if (e.cite && !q.includes(e.cite)) e.cite = null;
    let ca = e.cite ? (e.citeAfter && aq.includes(e.citeAfter) ? e.citeAfter : aq.includes(e.cite) ? e.cite : "") : "";
    if (!ca) { const c = commonPhrase(q, aq); if (c) { e.cite = c; ca = c; } }
    if (ca) { e.citeAfter = ca; e.checks.contains = true; } else { e.citeAfter = null; e.checks.contains = false; }
  }));
})();

const DEFAULT_STORE = { customProjects:[], draft:null, integ:{}, role:"admin", me:"u_kim", cutoff:{}, requests:SEED_REQUESTS.map(r => ({ ...r })), reviews:{}, history:[], attachments:{}, heroHidden:false, toolsOverride:{}, selfChecks:{}, bundleEdits:[], conclusions:{} };
let STORE;
try { STORE = Object.assign({}, DEFAULT_STORE, JSON.parse(localStorage.getItem("ilro.v4") || "{}")); } catch (e) { STORE = { ...DEFAULT_STORE }; }
(STORE.customProjects || []).forEach(p => { if (!PROJ[p.id]) { PROJECTS.push(p); PROJ[p.id] = p; } });
/* 기본 요청이 새로 추가되면 저장된 목록에 합친다 */
SEED_REQUESTS.forEach(r => { if (!STORE.requests.some(x => x.id === r.id)) STORE.requests.push({ ...r }); });
STORE.requests.forEach(r => { if (r.entry === "__wb_script_result") r.entry = WB_SCRIPT_RESULT_ID; });
/* 로그인 상태는 탭 안에서만 유지 — 사이트에 새로 들어오면 항상 로그인 화면부터 */
const save = () => { try { const { loggedIn, ...rest } = STORE; localStorage.setItem("ilro.v4", JSON.stringify(rest)); sessionStorage.setItem("ilro.login", loggedIn ? "1" : ""); } catch (e) {} };
try { STORE.loggedIn = sessionStorage.getItem("ilro.login") === "1"; } catch (e) { STORE.loggedIn = false; }
const now = () => { const d = new Date(); const p = n => String(n).padStart(2,"0"); return `${d.getFullYear()}.${p(d.getMonth()+1)}.${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`; };
const log = (type, text, pid) => { STORE.history.unshift({ at: now(), type, text, pid }); save(); };

function syncDraft() { const f = $("#npf"); if (!f) return; const fd = new FormData(f); const dr = STORE.draft = STORE.draft || DRAFT0(); ["name","desc","problem","outcome","period","status","from","to","milestones"].forEach(k => dr[k] = fd.get(k) || ""); save(); }
function createFromDraft() {
      const dr = STORE.draft; if (!dr || !dr.name || !dr.from || !dr.to) { location.hash = "#/projects/new"; return; } if (!dr.members.length) { alert("참여자를 1명 이상 추가하세요."); return; }
      const dot = v => (v || "").replace(/-/g, "."); const id = "p_" + Date.now().toString(36);
      const tools = integToTools(dr.integ); STORE.integ = STORE.integ || {};
      const p = { id, name: dr.name.trim(), desc: dr.desc.trim(), status: dr.status, period: dr.period, from: dot(dr.from), to: dot(dr.to), cutoff: dot(dr.to), problem: dr.problem, outcome: dr.outcome, members: dr.members.slice(), memberRoles: { ...dr.roles }, myRole: "관리자", tools,
        conn: { text: "연결 전", tone: "gray" }, review: { text: "평가 준비", tone: "yellow" }, next: { text: "정보 연결", to: "#/projects/" + id + "/connect", primary: true }, milestones: (dr.milestones || "").split("\n").map(x => x.trim()).filter(Boolean), custom: true };
      STORE.integ[id] = JSON.parse(JSON.stringify(dr.integ || {})); STORE.customProjects.push(p); PROJECTS.push(p); PROJ[id] = p; BUNDLES[id] = []; STORE.draft = null; STORE._created = id;
      log("프로젝트", `${meUser().name} · ${p.name} 생성 (참여자 ${p.members.length}명 · 수집 ${Object.keys(tools).map(t => SRC_KO[t]).join(" · ") || "첨부만"}) · 기준 스냅샷 잠금`, id); location.hash = "#/projects/" + id; }
const ROLE_KO = { admin:"관리자", evaluator:"평가자", employee:"대상자" };
const roleIs = r => STORE.role === r;
const meUser = () => STORE.role === "admin" ? USERS.u_admin : STORE.role === "evaluator" ? USERS.u_eval : USERS[STORE.me];

/* ── 날짜 ── */
const dnum = s => { const m = /^(\d{1,2})\/(\d{1,2})$/.exec(s); return m ? (+m[1])*100 + (+m[2]) : 0; };
const cutoffNum = pid => { const c = STORE.cutoff[pid]; if (!c) return 9999; const m = /(\d{1,2})\.(\d{1,2})$/.exec(c); return m ? (+m[1])*100 + (+m[2]) : 9999; };
const cutoffLabel = pid => STORE.cutoff[pid] || PROJ[pid].cutoff;

/* ── 기록 계산 ── */
const bundlesOf = pid => BUNDLES[pid] || [];
const counted = (pid) => { const c = cutoffNum(pid); const out = []; bundlesOf(pid).forEach(b => b.entries.forEach(e => { if (e.dup || e.skip) return; if (dnum(e.date) > c) return; out.push(e); })); return out; };
const excludedCount = pid => bundlesOf(pid).reduce((n, b) => n + b.entries.filter(e => e.dup || e.skip).length, 0);
const personEntries = (pid, name) => counted(pid).filter(e => e.person === name);
const bundleById = (pid, bid) => bundlesOf(pid).find(b => b.id === bid);

function personStats(pid, name) {
  const es = personEntries(pid, name);
  const stage = Object.fromEntries(STAGES.map(s => [s, es.filter(e => e.stage === s).length]));
  const stageOk = Object.fromEntries(STAGES.map(s => [s, es.filter(e => e.stage === s && CONF_RULE(e.checks) === "있음").length]));
  const conf = { "있음":0, "약함":0, "없음":0 }; es.forEach(e => conf[CONF_RULE(e.checks)]++);
  const status = {}; es.forEach(e => { status[effStatus(e)] = (status[effStatus(e)] || 0) + 1; });
  const bundles = [...new Set(es.map(e => e.bundle))].map(id => bundleById(pid, id));
  const traits = [];
  if (es.some(e => e.stage === "execution" && e.remains === "지금도 쓰임")) traits.push("만든 것이 지금도 쓰이는 편");
  if (es.some(e => e.stage === "proposal" && e.shape)) traits.push("제안을 내면 채택되는 편");
  if (stage.problem >= 2) traits.push("문제를 먼저 찾아내는 편");
  if (es.some(e => e.stage === "review" && e.changedWhat)) traits.push("검토로 결정이나 결과물을 바꾸는 편");
  if (es.some(e => e.stage === "decision")) traits.push("이름을 걸고 결정하는 편");
  const kinds = { req: bundles.filter(b => b && b.kind === "req").length, issue: bundles.filter(b => b && b.kind === "issue").length };
  return { es, stage, stageOk, conf, status, bundles, traits, kinds, total: es.length };
}
const openRequests = (pid, name) => STORE.requests.filter(r => r.project === pid && (!name || r.to === name) && r.status !== "resolved");
const reviewState = (pid, name) => (STORE.reviews[pid] && STORE.reviews[pid][name]) ? "final" : "open";

/* ── 공통 조각 ── */
function stageBar(stats, total) {
  // 단계별 건수 칩 — 증거 있음 기록만 센다. 합산한 하나의 숫자는 만들지 않는다.
  return `<div class="schips">${STAGES.map(s => { const n = stats.stageOk[s]; return `<span class="schip ${n ? "on" : ""}"><b>${n}</b>${STAGE_SHORT[s]}</span>`; }).join("")}</div>`;
}
function stageStrip(entries, name) {
  const mine = new Set(entries.filter(e => e.person === name).map(e => e.stage));
  const any = new Set(entries.map(e => e.stage));
  return `<div class="strip">${STAGES.map((s, i) => `<i class="dot ${mine.has(s) ? "on" : any.has(s) ? "half" : ""}" title="${STAGE_KO[s]}"></i>${i < 5 ? `<i class="ln ${mine.has(s) && mine.has(STAGES[i+1]) ? "on" : ""}"></i>` : ""}`).join("")}</div><div class="striplbl">${STAGES.map(s => `<span>${STAGE_SHORT[s]}</span>`).join("")}</div>`;
}
const confTag = e => { const c = CONF_RULE(e.checks); return badge(CONF_LABEL[c], CONF_TONE[c]); };
const statusTag = s => badge(STATUS_KO[s] || s, STATUS_TONE[s] || "gray");
const marks = (k, stage) => `<span class="marks" title="${stage === "result" ? "① 전 · 후 숫자 ② 어디서 · 언제 쟀나 ③ 남이 가져다 썼나" : "① 뒤에 바뀌었나 ② 내 말이 담겼나 ③ 남이 가져다 썼나"}"><b class="${k.changed ? "y" : "n"}">${k.changed ? "✓" : "✗"}</b><b class="${k.contains ? "y" : "n"}">${k.contains ? "✓" : "✗"}</b><b class="${k.used ? "y" : "n"}">${k.used ? "✓" : "✗"}</b></span>`;
const srcTag = s => `<span class="src">${esc(SRC_KO[s] || s)}</span>`;
/* ── 3차 도우미 ── */
const nowTag = e => e.now ? `<span class="badge ${NOW_TONE[e.now.k]} nodot" title="${esc(e.now.rec)}">${NOW_KO[e.now.k]}</span>` : "";
const cmpOf = e => { const v = Object.assign({ metric:true, source:true, target:true, period:!!(e.period), order:true, afterDeploy:true }, e.cmp || {}); return Object.keys(CMP_KO).map(k => [k, CMP_KO[k], v[k]]); };
const effStatus = e => (e.stage === "result" && e.before && cmpFails(e).length) ? "잠정" : e.status;
const cmpFails = e => [];
function bundleBasis(pid, b) {
  const es = b.entries.filter(e => !e.dup && !e.skip); const links = new Set();
  es.forEach(e => [e.quote, e.after && e.after.quote].forEach(q => (String(q || "").match(/PROJ-\d+|PR #\d+|이슈 #\d+/g) || []).forEach(x => links.add(x))));
  const ds = es.map(e => e.date); const first = ds.reduce((x, c) => dnum(c) < dnum(x) ? c : x, ds[0] || ""); const last = ds.reduce((x, c) => dnum(c) > dnum(x) ? c : x, ds[0] || "");
  const dec = es.find(e => e.stage === "decision"); const parent = b.parent ? bundleById(pid, b.parent) : null;
  const out = [[b.kind === "req" ? "같은 요구사항" : "같은 이슈", parent ? `${b.title} — ${parent.title}의 후속` : b.title]];
  if (links.size) out.push(["직접 연결된 링크", [...links].join(" · ")]);
  out.push(["연속된 기간", `${first} – ${last}`]);
  if (dec) out.push(["같은 결정", dec.quote]); if (b.deployed) out.push(["같은 결과물", "배포 " + b.deployed]);
  out.push(["묶기에 쓴 공통 원문", b.common || b.title]);
  if (b.uncertain) out.push(["확인 필요", b.uncertain]);
  return out;
}
/* 본인이 먼저 볼 기록 — 이유가 하나라도 있으면 */
function checkReasons(pid, e) {
  const b = bundlesOf(pid).find(x => x.entries.includes(e)); const r = [];
  if (CONF_RULE(e.checks) === "약함") r.push("인용 문장의 연결이 약함");
  if (e.status === "자료 필요") r.push("자료 부족");
  if (b && b.uncertain) r.push("같은 일 묶기가 불확실");
  if (e.shared) r.push("공동 참여 범위 확인 — " + e.shared);
  if (e.stage === "result" && e.before && !e.where) r.push("결과 숫자의 기준 시점 없음");
  if (cmpFails(e).length) r.push("결과 숫자 비교 확인 필요 — " + cmpFails(e).map(c => c[1]).join(", "));
  if (e.conflict) r.push("출처 간 내용 충돌 — " + e.conflict);
  return r;
}
const toCheck = (pid, name) => personEntries(pid, name).filter(e => checkReasons(pid, e).length && !STORE.selfChecks[e.id]);
const lateEntries = (pid, name) => { const c = cutoffNum(pid); const out = []; bundlesOf(pid).forEach(b => b.entries.forEach(e => { if (!e.dup && !e.skip && (!name || e.person === name) && dnum(e.date) > c) out.push(e); })); return out; };
const editsOf = (pid, bid) => STORE.bundleEdits.filter(x => x.pid === pid && (!bid || x.bid === bid));
const reqTag = (pid, e) => { const r = STORE.requests.find(x => x.project === pid && (x.entry === e.id || (!x.entry && x.bundle === e.bundle && x.to === e.person)) && x.status !== "resolved"); return r ? badge(r.status === "answered" ? "답변 옴" : "요청 중", r.status === "answered" ? "teal" : "orange") : `<span class="dimtxt">—</span>`; };

/* ═══════════ 화면 ═══════════ */
const views = {};

/* 프로젝트 목록 */
views.projects = () => {
  const q = STORE._q || "", fp = STORE._fp || "", fs = STORE._fs || "", fr = STORE._fr || "";
  const list = PROJECTS.filter(p => (!q || p.name.includes(q) || p.desc.includes(q) || p.members.some(m => USERS[m].name.includes(q))) && (!fp || p.period === fp) && (!fs || p.status === fs) && (!fr || fr.startsWith("__") || p.review.text === fr)
    && (fr !== "__warn" || Object.values(Object.assign({}, p.tools, integToTools(integOf(p.id)))).some(v => v === "warn") || p.conn.tone !== "green")
    && (fr !== "__soon" || (p.status === "진행 중" && (() => { const [y, m, d] = cutoffLabel(p.id).split(".").map(Number); const diff = (new Date(y, m - 1, d) - new Date()) / 864e5; return diff >= 0 && diff <= 14; })())));
  const warnN = PROJECTS.filter(p => Object.values(Object.assign({}, p.tools, integToTools(integOf(p.id)))).some(v => v === "warn") || p.conn.tone !== "green").length;
  const soonN = PROJECTS.filter(p => p.status === "진행 중" && (() => { const [y, m, d] = cutoffLabel(p.id).split(".").map(Number); const diff = (new Date(y, m - 1, d) - new Date()) / 864e5; return diff >= 0 && diff <= 14; })()).length;
  const stats = roleIs("admin") ? [
    ["평가 진행 중", PROJECTS.filter(p => ["검토 중","평가 준비"].includes(p.review.text)).length, "검토 중 · 평가 준비", "검토 중"],
    ["기준일 2주 내", soonN, "곧 분석 기준일", "__soon"],
    ["평가 완료", PROJECTS.filter(p => p.review.text === "평가 완료").length, "결과 보고서 열람 가능", "평가 완료"],
  ] : [
    ["연결된 프로젝트", PROJECTS.filter(p => p.conn.tone === "green").length, "데이터가 연결된 프로젝트", ""],
    ["평가 대기", PROJECTS.filter(p => ["검토 중","평가 준비"].includes(p.review.text)).length, "검토 중 · 평가 준비", "검토 중"],
    ["자료 필요", PROJECTS.filter(p => p.review.text === "자료 필요").length, "판단 근거가 더 필요한 기여", "자료 필요"],
    ["검토 완료", PROJECTS.filter(p => p.review.text === "평가 완료").length, "평가 완료된 프로젝트", "평가 완료"],
  ];
  const adminNext = p => { const t = Object.assign({}, p.tools, integToTools(integOf(p.id))); if (!Object.values(t).some(v => v === "ok")) return { text:"정보 연결", to:`#/projects/${p.id}/connect`, primary:true }; if (Object.values(t).some(v => v === "warn")) return { text:"범위 고르기", to:`#/projects/${p.id}/connect`, primary:true }; if (p.review.text === "평가 완료") return { text:"결과 보기", to:`#/evaluation/${p.id}`, primary:false }; if (!STORE.cutoff[p.id] && !p.cutoff && p.status === "진행 중") return { text:"기준일 설정", to:`#/evaluation/${p.id}`, primary:false }; return { text:"평가 보기", to:`#/evaluation/${p.id}`, primary:false }; };
  return `
  
  <section class="stats">${stats.map(s => `<button class="stat ${fr === s[3] && s[3] ? "on" : ""}" data-act="stat" data-v="${s[3]}"><span class="label">${s[0]}</span><b>${s[1]}</b><span class="sub">${s[2]}</span></button>`).join("")}</section>
  <section class="panel">
    <div class="toolbar">
      <input id="q" class="search" type="search" placeholder="프로젝트명 · 참여자 검색" value="${esc(q)}" />
      <select id="f-period"><option value="">평가기간 전체</option>${Object.values(PERIODS).map(p => `<option value="${p.id}" ${fp === p.id ? "selected" : ""}>${p.name}</option>`).join("")}</select>
      <select id="f-status"><option value="">프로젝트 상태</option>${["진행 중","종료"].map(s => `<option ${fs === s ? "selected" : ""}>${s}</option>`).join("")}</select>
      <select id="f-review"><option value="">평가 상태</option>${["검토 중","평가 완료","평가 준비","자료 필요"].map(s => `<option ${fr === s ? "selected" : ""}>${s}</option>`).join("")}</select>
      <span class="count">${list.length}개 프로젝트</span>
    </div>
    <table class="table"><thead><tr><th>프로젝트명</th>${roleIs("admin") ? "" : "<th>나의 역할</th>"}<th>프로젝트 상태</th><th>평가기간</th><th>데이터 연결 상태</th><th>검토 상태</th><th>${roleIs("admin") ? "관리자 할 일" : "다음 작업"}</th></tr></thead>
    <tbody id="rows">${list.length ? list.map(p => `<tr class="row" data-href="#/projects/${p.id}">
      <td class="name"><b>${esc(p.name)}</b><small>${esc(p.desc)}</small></td>
      ${roleIs("admin") ? "" : `<td>${ROLE_KO[STORE.role]}</td>`}
      <td>${badge(p.status, p.status === "진행 중" ? "accent" : "gray")}</td>
      <td class="period"><b>${PERIODS[p.period].name}</b><code>${p.from} – ${p.to}</code></td>
      <td>${badge(p.conn.text, p.conn.tone)}</td>
      <td>${badge(p.review.text, p.review.tone)}</td>
      <td>${(() => { const nx = roleIs("admin") ? adminNext(p) : roleIs("employee") ? p.next : (p.next.text === "자료 제출" ? { text:"요청 보기", to:"#/requests", primary:false } : p.next); return `<a class="btn ${nx.primary ? "primary" : ""}" href="${nx.to}">${nx.text}</a>`; })()}</td></tr>`).join("") : `<tr><td colspan="7" class="empty">조건에 맞는 프로젝트가 없습니다</td></tr>`}</tbody></table>
  </section>`;
};

/* 프로젝트 상세 */
views.project = (pid) => {
  const p = PROJ[pid]; if (!p) return views.projects();
  const tools = Object.assign({}, p.tools, integToTools(integOf(pid)));
  const files = STORE.attachments[pid] || [];
  const reqs = STORE.requests.filter(r => r.project === pid && r.status !== "resolved");
  const n = counted(pid).length, ex = excludedCount(pid);
  const admin = roleIs("admin") || roleIs("evaluator");
  const created = STORE._created === pid;
  const notconn = !Object.values(tools).some(v => v === "ok") && !files.length;
  return `
  ${created ? `<div class="notice green"><b>프로젝트를 만들었습니다.</b> <button class="btn primary" data-act="invite" data-pid="${pid}">참여자 ${p.members.length}명에게 연결 요청 보내기</button></div>` : notconn ? `<div class="notice">${badge("연결 전", "gray")} <button class="btn" data-act="invite" data-pid="${pid}">연결 요청 다시 보내기</button></div>` : ""}
  <div class="pagehead"><div><h1>${esc(p.name)}</h1><p class="sub">${esc(p.desc)} · ${badge(p.status, p.status === "진행 중" ? "accent" : "gray")} ${badge(p.review.text, p.review.tone)}</p></div>
    <div class="actions"><a class="btn" href="#/projects/${pid}/connect">정보 연결</a><a class="btn primary" href="#/evaluation/${pid}">${p.review.text === "평가 완료" ? "결과 보기" : "평가 보기"}</a></div></div>
  <div class="grid2">
    <section class="card span2"><h3>평가 진행</h3>
      <ul class="kv"><li><span>평가기간</span><b>${PERIODS[p.period].name} (${p.from} – ${p.to})</b></li><li><span>기준일</span><b>${cutoffLabel(pid)}</b></li><li><span>검토 상태</span><b>${p.review.text}</b></li><li><span>열린 요청</span><b>${reqs.length}건</b></li></ul></section>
    ${admin ? `<section class="card span2"><h3>관리 정보</h3>
      <ul class="kv"><li><span>해결할 문제</span><b>${esc(p.problem)}</b></li><li><span>기대 결과</span><b>${esc(p.outcome)}</b></li><li><span>마일스톤</span><b>${p.milestones.map(esc).join(" · ")}</b></li><li><span>수집 범위</span><b>허용된 채널 · 저장소 · 스페이스만, 개인 메시지 제외</b></li><li><span>기준 스냅샷</span><b>${PERIODS[p.period].snapshotAt} 잠금 — 평가 중 변경 불가</b></li></ul></section>` : ""}
    ${roleIs("admin") ? `<section class="card"><h3>진행 단계</h3>${stepBar(pid)}</section>` : `<section class="card"><h3>필요한 추가 자료</h3>${reqs.length ? `<ul class="list">${reqs.map(r => `<li><b>${esc(r.to)}</b> · ${esc(r.after)} <span class="dimtxt">— ${esc(r.reason)}</span></li>`).join("")}</ul>` : `<p class="muted">지금은 없습니다.</p>`}</section>`}
    <section class="card"><h3>참여자</h3><div class="people">${p.members.map(m => `<span class="person">${avatar(USERS[m].name)}<span><b>${USERS[m].name}</b><small>${USERS[m].title} · ${USERS[m].level}${p.memberRoles && p.memberRoles[m] ? " · " + p.memberRoles[m] : ""}</small></span></span>`).join("")}</div></section>
    <section class="card span2"><h3>연결된 데이터</h3>
      <div class="toolrow">${Object.entries(tools).map(([k, v]) => p.sources && p.sources[k] ? `<a class="toolchip ${v} link" href="${p.sources[k]}" target="_blank" rel="noopener">${SRC_KO[k]} ✓ ↗</a>` : `<span class="toolchip ${v}">${SRC_KO[k]} ${v === "ok" ? "✓" : v === "warn" ? "!" : "— 연결 전"}</span>`).join("")}${files.map(f => `<span class="toolchip ok">첨부 · ${esc(f)}</span>`).join("")}</div>
      <p class="muted">기록 ${n}건 셈 · 제외 ${ex}건 (중복 · 승인 답장) · 개인 메시지 0건 · 기준일 ${cutoffLabel(pid)}</p></section>
  </div>`;
};


/* 새 프로젝트 (관리자) — 한 화면: 기본 정보 + 참여자 + 수집 범위 */
const DRAFT0 = () => ({ name:"", desc:"", problem:"", outcome:"", period:"per_h2", status:"진행 중", from:"", to:"", members:[], roles:{}, integ:{}, milestones:"" });
function participantTree(q) {
  const d = STORE.draft || DRAFT0(); q = (q || "").trim().toLowerCase(); const open = STORE._tree || {};
  const match = u => !q || (u.name + u.title + TRACK_KO[u.track] + u.level + u.team + u.dept).toLowerCase().includes(q);
  let total = 0;
  const html = ORG.map(dp => {
    const teams = dp.teams.map(t => {
      const ms = t.members.map(m => USERS[m[0]]).filter(match); if (!ms.length) return "";
      total += ms.length; const key = t.team; const isOpen = q ? true : !!open[key];
      return `<div class="tnode"><button type="button" class="tteam" data-act="tree-toggle" data-k="${esc(key)}"><span class="chev">${isOpen ? "▾" : "▸"}</span>${esc(t.team)} <span class="dimtxt">${ms.length}명${ms.filter(u => d.members.includes(u.id)).length ? " · 고름 " + ms.filter(u => d.members.includes(u.id)).length : ""}</span></button>
        ${isOpen ? `<div class="tpeople">${ms.map(u => { const sel = d.members.includes(u.id); return `<button type="button" class="pres ${sel ? "sel" : ""}" data-act="${sel ? "draft-remove" : "draft-add"}" data-id="${u.id}">${avatar(u.name, 24)}<span><b>${u.name}</b><small>${u.title} · ${u.level} · ${u.exp}</small></span><span class="${sel ? "okt" : "dimtxt"}">${sel ? "✓ 고름" : "추가"}</span></button>`; }).join("")}</div>` : ""}</div>`;
    }).filter(Boolean).join("");
    return teams ? `<div class="tdept"><div class="tdname">${esc(dp.dept)}</div>${teams}</div>` : "";
  }).join("");
  return html || `<div class="dimtxt" style="padding:10px">"${esc(q)}"에 맞는 사람이 없습니다. 사내 계정에서만 고를 수 있습니다.</div>`;
}

/* ── 연동 패널: 연결(권한 요청) → 범위 고르기 → 상태 ── */
function integOf(key) { if (key === "draft") { STORE.draft = STORE.draft || DRAFT0(); STORE.draft.integ = STORE.draft.integ || {}; return STORE.draft.integ; } STORE.integ = STORE.integ || {}; if (!STORE.integ[key]) { const p = PROJ[key]; const seed = {}; if (p) Object.entries(p.tools || {}).forEach(([t, v]) => { if (v === "ok") seed[t] = { connected:true, scope: CATALOG[t].items.filter(i => !i.off).slice(0, 2).map(i => i.id), at: p.from }; else if (v === "warn") seed[t] = { connected:true, scope:[], at:p.from }; }); STORE.integ[key] = seed; } return STORE.integ[key]; }
function integStatus(it) { return !it || !it.connected ? ["미연결", "gray"] : it.scope && it.scope.length ? [`연결됨 · ${it.scope.length}개`, "green"] : ["범위 미선택", "orange"]; }
/* 연동 요약 — 고른 범위만 보여주고, "연동 설정"에서 서비스별 탭 · 검색으로 고른다 */
function integSummary(key) {
  const integ = integOf(key);
  return `<div class="isum"><div class="isum-h"><button type="button" class="btn primary" data-act="integ-setup" data-key="${key}">연동 설정</button></div>
    <div class="isum-list">${TOOL_ORDER.map(t => { const c = CATALOG[t], it = integ[t]; const co = companyOf()[t] && companyOf()[t].connected; const sc = (it && it.connected && it.scope) || [];
      return `<div class="isum-row"><b>${SRC_KO[t]}</b><div class="isum-chips">${!co ? `<span class="dimtxt">회사 연결 안 됨</span>` : sc.length ? sc.slice(0, 4).map(x => `<span class="badge green nodot">${esc(x)}</span>`).join("") + (sc.length > 4 ? `<span class="badge gray nodot">+${sc.length - 4}</span>` : "") : `<span class="dimtxt">고른 ${c.label} 없음</span>`}</div><span class="dimtxt cnt2">${co ? sc.length + "개" : ""}</span></div>`; }).join("")}</div></div>`;
}
function integSetupModal(key) {
  const st = STORE._isetup || {}; const t = st.t || "slack"; const q = (st.q || "").trim().toLowerCase(); const integ = integOf(key); const c = CATALOG[t]; const it = integ[t]; const co = companyOf()[t] && companyOf()[t].connected;
  const sel = new Set((it && it.scope) || []);
  const items = c.items.filter(i => !q || (i.id + " " + i.note).toLowerCase().includes(q));
  return `<div class="modal-bg" data-act="close"><div class="modal wide" data-stop><div class="mh"><div><b>연동 설정</b><small>서비스마다 이 프로젝트가 읽을 범위만 고릅니다. 고르지 않은 곳은 읽지 않습니다</small></div><button class="x" data-act="close">×</button></div>
    <div class="tabs small itabs">${TOOL_ORDER.map(x => { const n = ((integ[x] && integ[x].scope) || []).length; return `<a href="#" data-act="isetup-tab" data-v="${x}" class="${t === x ? "on" : ""}">${SRC_KO[x]}${n ? ` <b>${n}</b>` : ""}</a>`; }).join("")}</div>
    ${!co ? `<p class="muted">${SRC_KO[t]}는 회사 연결이 안 돼 있습니다. 관리자가 데이터 연동 관리에서 앱을 먼저 설치해야 합니다.</p>` : `
    <div class="isetup-top"><input id="isq" class="search" placeholder="${c.label} 이름으로 검색" value="${esc(st.q || "")}"><span class="dimtxt">${esc(c.account)} · ${c.label} ${c.items.filter(i => !i.off).length}개 중 <b>${sel.size}개</b> 고름${t === "slack" ? " · 체크하면 봇이 자동 초대됩니다" : ""}</span></div>
    <div class="iscope isetup-list" id="isetup-list">${items.length ? items.map(i => `<label class="${i.off ? "off" : ""} ${sel.has(i.id) ? "on" : ""}"><input type="checkbox" data-act="isetup-scope" data-key="${key}" data-t="${t}" data-id="${esc(i.id)}" ${sel.has(i.id) ? "checked" : ""} ${i.off ? "disabled" : ""}> <b>${esc(i.id)}</b><small>${esc(i.note)}</small>${sel.has(i.id) ? badge(t === "slack" ? "봇 초대됨" : "수집", "green") : ""}</label>`).join("") : `<div class="dimtxt">"${esc(st.q)}"에 맞는 ${c.label}이 없습니다</div>`}</div>`}
    <div class="right" style="margin-top:12px"><button class="btn primary" data-act="close">완료</button></div></div></div>`;
}
function integPanel(key) {
  const integ = integOf(key); const open = STORE._iopen || {};
  return `<div class="ilist">${TOOL_ORDER.map(t => { const c = CATALOG[t], it = integ[t]; const [st, tone] = integStatus(it); const isOpen = it && it.connected && (open[key + t] || !(it.scope || []).length);
    return `<div class="iitem ${it && it.connected ? "on" : ""}">
      <div class="ihead"><div class="iname"><b>${SRC_KO[t]}</b><small>${!(companyOf()[t] && companyOf()[t].connected) ? "회사 연결 안 됨 — 관리자가 먼저 앱을 설치해야 합니다" : it && it.connected ? esc(c.account) + " · 이 프로젝트가 읽을 " + c.label + " " + ((it.scope || []).length) + "개" : esc(c.account) + " · 회사 연결됨 — 이 프로젝트에서 아직 쓰지 않음"}</small></div>${badge(st, tone)}
        <div class="iact">${!(companyOf()[t] && companyOf()[t].connected) ? `<span class="dimtxt">회사 연결 필요 ${roleIs("admin") ? '<a class="link" href="#/integrations">연동 관리</a>' : ""}</span>` : it && it.connected ? `<button type="button" class="btn" data-act="integ-scope-toggle" data-key="${key}" data-t="${t}">${isOpen ? "범위 닫기" : "범위 고르기"}</button><button type="button" class="link" data-act="integ-disconnect" data-key="${key}" data-t="${t}">해제</button>` : `<button type="button" class="btn primary" data-act="integ-connect" data-key="${key}" data-t="${t}">${c.label} 고르기</button>`}</div></div>
      ${isOpen ? `<div class="iscope"><div class="dimtxt">체크한 ${c.label}만 이 프로젝트가 읽습니다${t === "slack" ? " · 체크하면 봇이 자동 초대됩니다" : ""}</div>${c.items.map(i => { const on = (it.scope || []).includes(i.id); return `<label class="${i.off ? "off" : ""} ${on ? "on" : ""}"><input type="checkbox" data-act="integ-scope" data-key="${key}" data-t="${t}" data-id="${esc(i.id)}" ${on ? "checked" : ""} ${i.off ? "disabled" : ""}> <b>${esc(i.id)}</b><small>${esc(i.note)}</small>${on ? badge(t === "slack" ? "봇 초대됨 · 수집 중" : "수집 중", "green") : ""}</label>`; }).join("")}</div>` : ""}
    </div>`; }).join("")}</div>`;
}
function integModal(key, t) {
  const c = CATALOG[t];
  return `<div class="modal-bg" data-act="close"><div class="modal" data-stop>
    <div class="mh"><div><b>${SRC_KO[t]} 연결 — 권한 요청</b><small>${esc(c.account)} 계정으로 로그인한 뒤 아래 권한만 허용합니다.</small></div><button class="x" data-act="close">×</button></div>
    <div class="two"><div class="box"><span class="lbl">요청하는 권한</span><ul class="list">${c.ask.map(x => `<li>✓ ${esc(x)}</li>`).join("")}</ul></div><span class="arrow"> </span><div class="box none"><span class="lbl">요청하지 않는 권한</span><ul class="list">${c.never.map(x => `<li class="dimtxt">✗ ${esc(x)}</li>`).join("")}</ul></div></div>
    
    <div class="right"><button class="btn" data-act="close">취소</button> <button class="btn primary" data-act="integ-allow" data-key="${key}" data-t="${t}">허용하고 연결</button></div>
  </div></div>`;
}
function integToTools(integ) { const tools = {}; Object.entries(integ || {}).forEach(([t, it]) => { if (it && it.connected) tools[t] = (it.scope || []).length ? "ok" : "warn"; }); return tools; }

views.newProject = () => {
  if (!roleIs("admin")) return `<section class="card"><a class="btn" href="#/projects">프로젝트 목록</a></section>`;
  const d = STORE.draft = STORE.draft || DRAFT0();
  return `<div class="pagehead"><div><h1>새 프로젝트</h1></div></div>
  <section class="card">${stepBar(null, 0)}</section>
  <form id="npf" class="np2" data-act="draft-create" autocomplete="off">
    <section class="card form">
      <h3 class="span2">기본 정보</h3>
      <label class="span2">프로젝트명<input name="name" required value="${esc(d.name)}" placeholder="예: 알림 센터 개편"></label>
      <label class="span2">한 줄 설명<input name="desc" required value="${esc(d.desc)}" placeholder="예: 푸시 · 이메일 알림 통합"></label>
      <label class="span2">해결하려는 문제<input name="problem" value="${esc(d.problem)}" placeholder="예: 알림이 채널마다 따로 와서 중복 수신 23%"></label>
      <label class="span2">기대 결과<input name="outcome" value="${esc(d.outcome)}" placeholder="예: 중복 수신 5% 이하"></label>
      <label>평가기간<select name="period">${Object.values(PERIODS).map(p => `<option value="${p.id}" ${p.id === d.period ? "selected" : ""}>${p.name} (${p.type})</option>`).join("")}</select></label>
      <label>프로젝트 상태<select name="status">${["진행 중","탐색 · 기획","종료","중단 · 보류"].map(s => `<option ${s === d.status ? "selected" : ""}>${s}</option>`).join("")}</select></label>
      <label>시작일<input type="date" name="from" required value="${esc(d.from)}"></label>
      <label>종료 예정일 (기준일)<input type="date" name="to" required value="${esc(d.to)}"></label>
      <label class="span2">마일스톤 (줄마다 하나)<textarea name="milestones" placeholder="예: 10/15 1차 배포&#10;12/31 중간 평가 기준일">${esc(d.milestones)}</textarea></label>
      <h3 class="span2">어디서 기록을 모을까요</h3>
      <div class="span2">${integSummary("draft")}</div>
      <p class="span2 dimtxt" style="margin:0">연결한 도구에서, 고른 곳만 수집합니다. 개인 메시지 · 비공개 채널은 어떤 경우에도 수집하지 않습니다. 지금 연결하지 않아도 만든 뒤 "정보 연결"에서 할 수 있습니다.</p>
    </section>
    <section class="card pcol">
      <h3>참여자 <span class="dimtxt">${d.members.length}명</span></h3>
      <div class="psearch"><input id="pq" type="search" placeholder="이름 · 직무 · 팀으로 검색 (예: 김민수, 디자이너, 백엔드)" value="${esc(STORE._pq || "")}"></div>
      <div id="ptree" class="tree">${participantTree(STORE._pq)}</div>
      ${d.members.length ? `<div class="plist">${d.members.map(id => { const u = USERS[id]; return `<div class="pitem">${avatar(u.name, 28)}<span><b>${u.name}</b><small>${u.team} · ${u.title} · ${u.level}</small></span>
        <select data-act="draft-role" data-id="${id}">${["참여","담당","리드","검토"].map(r => `<option ${(d.roles[id] || "참여") === r ? "selected" : ""}>${r}</option>`).join("")}</select><button type="button" class="link" data-act="draft-remove" data-id="${id}">빼기</button></div>`; }).join("")}</div>` : `<p class="muted">아직 없습니다. 검색해서 추가하세요. 1명 이상 필요합니다.</p>`}
      
      <div class="pfoot"><div><a class="btn" href="#/projects" data-act="draft-cancel">취소</a> <button class="btn primary">프로젝트 만들기</button></div></div>
    </section>
  </form>`;
};

/* 정보 연결 (대상자용 최소 흐름) */
views.connect = (pid) => {
  const p = PROJ[pid]; if (!p) return views.projects();
  const scope = { slack:"#orion-development · #orion-cs", github:"org/orion-api · org/orion-web", figma:"오리온 디자인 파일", jira:"PROJ 프로젝트", confluence:"오리온 스페이스" };
  const files = STORE.attachments[pid] || [];
  return `
  <div class="pagehead"><div><h1>정보 연결 — ${esc(p.name)}</h1></div></div>
  ${roleIs("admin") ? `<section class="card">${stepBar(pid, 1)}</section>` : ""}
  <div class="grid2">
    <section class="card span2"><h3>업무 기록 연결</h3>${integSummary(pid)}</section>
    <section class="card"><h3>연동되지 않은 자료 첨부</h3>
      <label class="drop">파일 선택 또는 끌어다 놓기<input type="file" multiple data-act="attach" data-pid="${pid}"></label>
      ${files.length ? `<ul class="list">${files.map((f, i) => `<li>${esc(f)} <button class="link" data-act="detach" data-pid="${pid}" data-i="${i}">삭제</button></li>`).join("")}</ul>` : ""}</section>
    <section class="card"><h3>개인정보 안내</h3><p>개인 메시지는 수집하지 않습니다. 평가에 필요한 기간과 공개된 프로젝트 범위만 확인합니다.</p><ul class="list muted"><li>수집 기간: ${p.from} – ${cutoffLabel(pid)}</li><li>같은 일의 여러 기록은 하나로 묶고, 승인 답장은 세지 않습니다</li><li>원문을 열람하면 감사 기록이 남습니다</li></ul></section>
    <div class="span2 right"><a class="btn" href="#/projects/${pid}">취소</a> <button class="btn primary" data-act="connect-done" data-pid="${pid}">연결 완료</button></div>
  </div>`;
};

/* 평가 목록 */
views.evaluation = () => `
  <div class="pagehead"><div><h1>평가</h1></div></div>
  <section class="panel"><table class="table"><thead><tr><th>프로젝트</th><th>평가 유형</th><th>기간</th><th>기준일</th><th>상태</th><th>검토 상태</th><th>참여자</th><th></th></tr></thead><tbody>
  ${PROJECTS.map(p => { const done = p.members.filter(m => reviewState(p.id, USERS[m].name) === "final").length; return `<tr class="row" data-href="#/evaluation/${p.id}">
    <td class="name"><b>${esc(p.name)}</b><small>${esc(p.desc)}</small></td><td>${PERIODS[p.period].type} 평가</td><td class="period"><code>${p.from} – ${p.to}</code></td><td><code>${cutoffLabel(p.id)}</code></td>
    <td>${badge(p.status, p.status === "진행 중" ? "accent" : "gray")}</td><td>${badge(p.review.text, p.review.tone)}<div class="dimtxt">${done}/${p.members.length} 검토 완료</div></td>
    <td><span class="avs">${p.members.map(m => avatar(USERS[m].name, 24)).join("")}</span></td><td><a class="btn" href="#/evaluation/${p.id}">${p.review.text === "평가 준비" ? "준비 상태 보기" : "결과 보기"}</a></td></tr>`; }).join("")}</tbody></table></section>`;

/* 3차: 해결되지 않은 것 먼저 — 건수 순위는 만들지 않는다 */
function issueBoard() {
  const items = { "본인 확인 미완료":[], "연결 오류 요청":[], "업무 묶음 확인 필요":[], "자료 부족":[], "공동 참여 범위 확인":[], "기준일 이후 추가된 기록":[], "완료 가능한 대상자":[] };
  PROJECTS.forEach(p => p.members.forEach(m => { const nm = USERS[m].name; const es = personEntries(p.id, nm);
    if (toCheck(p.id, nm).length) items["본인 확인 미완료"].push(`${nm} ${toCheck(p.id, nm).length}`);
    const oq = openRequests(p.id, nm).length; if (oq) items["연결 오류 요청"].push(`${nm} ${oq}`);
    const bu = bundlesOf(p.id).filter(b => b.uncertain && b.entries.some(e => e.person === nm)).length + editsOf(p.id).filter(x => bundleById(p.id, x.bid).entries.some(e => e.person === nm)).length; if (bu) items["업무 묶음 확인 필요"].push(`${nm} ${bu}`);
    const nd = es.filter(e => e.status === "자료 필요").length; if (nd) items["자료 부족"].push(`${nm} ${nd}`);
    const sh = es.filter(e => e.shared).length; if (sh) items["공동 참여 범위 확인"].push(`${nm} ${sh}`);
    const lt = lateEntries(p.id, nm).length; if (lt) items["기준일 이후 추가된 기록"].push(`${nm} ${lt}`);
    if (!oq && reviewState(p.id, nm) !== "final" && !toCheck(p.id, nm).length) items["완료 가능한 대상자"].push(nm);
  }));
  return `<section class="card"><div class="dhead"><h3>해결되지 않은 것 먼저</h3><span class="dimtxt">전체 건수보다 남은 오류를 먼저 봅니다. 사람을 건수로 정렬 · 비교하지 않습니다.</span></div>
    <div class="board">${Object.entries(items).map(([k, v]) => `<div class="bcell ${v.length ? (k === "완료 가능한 대상자" ? "ok" : "on") : ""}"><b>${v.length}</b><span>${k}</span><small>${v.length ? [...new Set(v)].slice(0, 4).map(esc).join(" · ") + (v.length > 4 ? " …" : "") : "없음"}</small></div>`).join("")}</div>
    </section>`;
}

/* 평가 결과: 요약 표 + 상세 패널 */
views.evalProject = (pid, params) => {
  const p = PROJ[pid]; if (!p) return views.evaluation();
  const sel = params.get("p") || (roleIs("employee") ? USERS[STORE.me].name : USERS[p.members[0]].name);
  const members = roleIs("employee") ? p.members.filter(m => m === STORE.me) : p.members;
  const rows = members.map(m => { const u = USERS[m]; const st = personStats(pid, u.name); const oq = openRequests(pid, u.name).length; const rs = reviewState(pid, u.name);
    const cells = { name:`<td class="name"><span class="person">${avatar(u.name)}<span><b>${u.name}</b><small>${u.title} · ${u.level}</small></span></span></td>`, stage:`<td class="stagecell">${stageBar(st, st.total)}</td>`, conf:`<td><span class="confs">${badge("있음 " + st.conf["있음"], "green")} ${st.conf["약함"] ? badge("약함 " + st.conf["약함"], "yellow") : ""} ${st.conf["없음"] ? badge("없음 " + st.conf["없음"], "gray") : ""}</span></td>`, status:`<td><span class="confs">${Object.entries(st.status).map(([k, v]) => badge(STATUS_KO[k] + " " + v, STATUS_TONE[k])).join(" ")}</span></td>`, review:`<td>${rs === "final" ? badge("검토 완료", "green") : badge("검토 중", "teal")}</td>`, req:`<td>${oq ? badge("요청 " + oq + "건", "orange") : "<span class='dimtxt'>없음</span>"}</td>` };
    const order = roleIs("admin") ? ["name","review","req","stage","conf","status"] : ["name","stage","conf","status","review"];
    return `<tr class="row" data-href="#/evaluation/${pid}/person?p=${encodeURIComponent(u.name)}">${order.map(k => cells[k]).join("")}<td class="more">›</td></tr>`; }).join("");
  return `
  <div class="pagehead"><div><h1>${esc(p.name)} <span class="dimtxt">· ${PERIODS[p.period].type} 평가 · ${PERIODS[p.period].name}</span></h1><p class="sub">${esc(p.desc)}</p></div></div>
  ${cutoffBar(pid)}
  ${conclSummary(pid)}
  <section class="panel"><div class="toolbar"><b>참여자 ${members.length}명</b></div><table class="table"><thead><tr>${(roleIs("admin") ? ["이름 · 역할","검토","열린 요청","참여한 단계 (증거 있음)","증거","어디까지"] : ["이름 · 역할","참여한 단계 (증거 있음)","증거","어디까지","검토"]).map(h => `<th>${h}</th>`).join("")}<th></th></tr></thead><tbody>${rows}</tbody></table></section>`;
};
/* 사람별 성과 — 별도 페이지 */
views.evalPerson = (pid, params) => {
  const p = PROJ[pid]; const name = params.get("p"); if (!p || !BYNAME[name]) return views.evalProject(pid, params);
  const members = roleIs("employee") ? p.members.filter(m => m === STORE.me) : p.members; const idx = members.findIndex(m => USERS[m].name === name);
  const prev = idx > 0 ? USERS[members[idx - 1]].name : null, next = idx < members.length - 1 ? USERS[members[idx + 1]].name : null;
  return `
  <div class="pagehead"><div><h1>${esc(name)} <span class="dimtxt">· ${esc(p.name)} · ${PERIODS[p.period].type} 평가</span></h1></div>
    <div class="actions"><a class="btn" href="#/evaluation/${pid}">← 참여자 목록</a>${prev ? `<a class="btn" href="#/evaluation/${pid}/person?p=${encodeURIComponent(prev)}">‹ ${esc(prev)}</a>` : ""}${next ? `<a class="btn" href="#/evaluation/${pid}/person?p=${encodeURIComponent(next)}">${esc(next)} ›</a>` : ""}</div></div>
  ${cutoffBar(pid)}
  ${detailPanel(pid, name)}`;
};
/* 이번 기간의 결과 — 요약 줄 + 팝업 */
function conclSummary(pid) {
  const items = [];
  bundlesOf(pid).forEach(b => { const es = b.entries.filter(e => !e.dup && !e.skip && dnum(e.date) <= cutoffNum(pid)); const res = es.find(e => e.stage === "result" && e.before); if (!res && !b.deployed) return;
    items.push({ b, res, people: [...new Set(es.filter(e => e.person !== "팀" && CONF_RULE(e.checks) === "있음").map(e => e.person))], fail: res ? cmpFails(res).length > 0 : false, last: Math.max(...es.map(e => dnum(e.date))) }); });
  if (!items.length) return "";
  const n = items.length, chk = items.filter(x => x.fail).length, num = items.filter(x => x.res && !x.fail).length;
  items.sort((x, y) => y.last - x.last); const top = items.slice(0, 3);
  return `<section class="card concl-s"><div class="dhead"><div><h3>이번 기간의 결과 ${n}개 — 누구의 기록으로 이루어졌나</h3><span class="dimtxt">숫자 있음 ${num} · 배포만 ${n - num} · 최근 3개만 표시</span></div>${n > 3 ? `<button class="btn primary" data-act="concl" data-pid="${pid}">전체 ${n}개 보기</button>` : ""}</div>
    <ul class="rlist">${top.map(x => `<li><div class="rr"><b>${x.res ? `${esc(x.res.before)} → ${esc(x.res.afterValue)}` : "배포 " + x.b.deployed + " (결과 전)"}</b><small>${esc(x.b.title)}${x.res && x.res.where ? " · " + esc(x.res.where) : ""} ${x.fail ? badge("비교 조건 확인 필요", "orange") : ""}</small></div><div class="rp">${x.people.slice(0, 5).map(nm => `<a href="#/evaluation/${pid}/person?p=${encodeURIComponent(nm)}" class="pchip">${avatar(nm, 20)}${esc(nm)}</a>`).join("")}${x.people.length > 5 ? `<span class="pchip">+${x.people.length - 5}</span>` : ""}${x.people.length ? "" : "<span class='dimtxt'>이름이 이어진 기록 없음</span>"}</div></li>`).join("")}</ul></section>`;
}
function conclModal(pid) { return `<div class="modal-bg" data-act="close"><div class="modal wide" data-stop><div class="mh"><div><b>${esc(PROJ[pid].name)} — 이번 기간의 결과</b><small>결과에서 출발합니다. 순위가 아니라 사슬에 이름이 있는지입니다</small></div><button class="x" data-act="close">×</button></div>${projectConclusion(pid).replace('<section class="card concl-p">', '<div class="concl-p inmodal">').replace(/<\/section>$/, "</div>")}</div></div>`; }

/* 프로젝트 결론: 결과에서 출발해 누구의 기록으로 이루어졌나 */
function projectConclusion(pid) {
  const items = [];
  bundlesOf(pid).forEach(b => { const es = b.entries.filter(e => !e.dup && !e.skip && dnum(e.date) <= cutoffNum(pid)); const res = es.find(e => e.stage === "result" && e.before); const dep = es.find(e => e.stage === "execution");
    if (!res && !b.deployed) return;
    const people = [...new Set(es.filter(e => e.person !== "팀" && CONF_RULE(e.checks) === "있음").map(e => e.person))];
    const last = Math.max(...es.map(e => dnum(e.date)));
    items.push({ b, res, dep, people, fail: res ? cmpFails(res).length > 0 : false, last, kind: res ? (cmpFails(res).length ? "check" : "num") : "dep" }); });
  if (!items.length) return "";
  items.sort((x, y) => y.last - x.last);
  const q = ""; const kf = STORE._ck || "all"; const showAll = true; const LIMIT = 5;
  const KIND = { all:"전체", num:"숫자 있음", dep:"배포만 · 결과 전" };
  const counts = { all: items.length, num: items.filter(x => x.kind === "num").length, dep: items.filter(x => x.kind === "dep").length };
  const filtered = items.filter(x => (kf === "all" || x.kind === kf) && (!q || `${x.b.title} ${x.res ? x.res.before + " " + x.res.afterValue + " " + (x.res.where || "") : ""} ${x.people.join(" ")}`.toLowerCase().includes(q)));
  const shown = showAll ? filtered : filtered.slice(0, LIMIT);
  return `<section class="card concl-p"><div class="dhead"><h3>이번 기간의 결과 ${items.length}개 — 누구의 기록으로 이루어졌나</h3></div>
    <div class="ctools"><div class="tabs small">${Object.keys(KIND).map(k => `<a href="#" data-act="ckind" data-v="${k}" class="${kf === k ? "on" : ""}">${KIND[k]} ${counts[k]}</a>`).join("")}</div></div>
    <ul class="rlist" id="clist">${shown.length ? shown.map(x => `<li><div class="rr"><b>${x.res ? `${esc(x.res.before)} → ${esc(x.res.afterValue)}` : "배포 " + x.b.deployed + " (결과 전)"}</b><small>${esc(x.b.title)}${x.res && x.res.where ? " · " + esc(x.res.where) : ""} ${x.fail ? badge("비교 조건 확인 필요", "orange") : ""}</small></div><div class="rp">${x.people.slice(0, 5).map(n => `<a href="#/evaluation/${pid}/person?p=${encodeURIComponent(n)}" class="pchip">${avatar(n, 20)}${esc(n)}</a>`).join("")}${x.people.length > 5 ? `<span class="pchip">+${x.people.length - 5}</span>` : ""}${x.people.length ? "" : "<span class='dimtxt'>이름이 이어진 기록 없음</span>"}</div></li>`).join("") : `<li class="dimtxt">조건에 맞는 결과가 없습니다</li>`}</ul>
    <div class="dimtxt" style="margin-top:8px">${filtered.length}개 전체 표시</div></section>`;
}
function cutoffBar(pid) {
  const p = PROJ[pid]; const c = STORE.cutoff[pid];
  const [y, m, d] = (c || p.cutoff).split(".");
  return `<div class="cutbar"><div><b>분석 기준일 — 이 날짜까지의 기록만 봅니다</b><small>기준일을 정하지 않으면 전체 기간을 봅니다. 수집은 계속됩니다.</small></div>
    <div class="cutctl">${roleIs("employee") ? `<span class="dimtxt">${PERIODS[p.period].type} 보고서 · 기준일</span><b>${c || p.cutoff}</b>` : `<span class="dimtxt">${PERIODS[p.period].type} 보고서</span><input type="date" id="cutoff" value="${y}-${m}-${d}" data-pid="${pid}"><button class="btn" data-act="cutoff-now" data-pid="${pid}">현재까지 분석</button><button class="btn primary" data-act="cutoff-final" data-pid="${pid}">종료 후 최종 분석</button>`}</div></div>`;
}

function detailPanel(pid, name) {
  const u = BYNAME[name]; if (!u) return "";
  const st = personStats(pid, name);
  const oq = openRequests(pid, name); const rs = reviewState(pid, name);
  const bundles = bundlesOf(pid).filter(b => b.entries.some(e => e.person === name && !e.dup && !e.skip && dnum(e.date) <= cutoffNum(pid)));
  const sortKey = STORE._sort || "recent";
  bundles.sort((a, b) => sortKey === "stages" ? (new Set(b.entries.filter(e => e.person === name).map(e => e.stage)).size - new Set(a.entries.filter(e => e.person === name).map(e => e.stage)).size) : sortKey === "need" ? (b.entries.some(e => e.status === "자료 필요") - a.entries.some(e => e.status === "자료 필요")) : (Math.max(...b.entries.map(e => dnum(e.date))) - Math.max(...a.entries.map(e => dnum(e.date)))));
  const open = STORE._open || {};
  const ordered = []; const seen = new Set();
  bundles.filter(b => !b.parent || !bundles.some(x => x.id === b.parent)).forEach(b => { ordered.push(b); seen.add(b.id); bundles.filter(c => c.parent === b.id).forEach(c => { if (!seen.has(c.id)) { ordered.push(c); seen.add(c.id); } }); });
  bundles.forEach(b => { if (!seen.has(b.id)) ordered.push(b); });
  const LIM = 10; const showAllB = !!STORE._bmore; const shownB = showAllB ? ordered : ordered.slice(0, LIM);
  return `
  <section class="card detail">
    <div class="dhead"><div class="person big">${avatar(name, 44)}<span><b>${esc(name)}</b><small>${u.title} · ${u.level} ${u.exp ? "· " + u.exp : ""} · 한 일 ${st.bundles.length}개 — 기획 ${st.kinds.req} · 이슈 ${st.kinds.issue}</small></span></div>
      <div class="actions">${rs === "final" ? badge("검토 완료", "green") : oq.length ? badge("요청 " + oq.length + "건 열림", "orange") : badge("검토 중", "teal")} <a class="btn primary" href="#/report/${pid}?p=${encodeURIComponent(name)}">결과 보고서</a></div></div>
    <div class="grid2 tight">
      <div><div class="lbl">참여한 단계 — 증거 있음 기록만 셉니다</div>${stageBar(st, st.total)}<div class="confs" style="margin-top:10px">${badge("증거 있음 " + st.conf["있음"], "green")} ${badge("약함 " + st.conf["약함"], "yellow")} ${badge("없음 " + st.conf["없음"], "gray")} </div></div>
      <div><div class="lbl">기록이 말해주는 것</div><ul class="traits">${st.traits.length ? st.traits.slice(0, 3).map(t => `<li>${t}</li>`).join("") : "<li class='dimtxt'>아직 기록이 적어 말하기 이릅니다</li>"}</ul></div>
    </div>
  </section>
  ${checkPanel(pid, name)}
  <section class="panel">
    <div class="toolbar"><b>한 일 ${bundles.length}개 · 증거 있음 ${st.conf["있음"]} · 약함 ${st.conf["약함"]} · 없음 ${st.conf["없음"]}</b>
      <span class="count"><label>정렬 <select id="sort"><option value="recent" ${sortKey === "recent" ? "selected" : ""}>최근 움직인 일 순</option><option value="stages" ${sortKey === "stages" ? "selected" : ""}>단계 많이 참여한 순</option><option value="need" ${sortKey === "need" ? "selected" : ""}>자료 부족 먼저</option></select></label></span></div>
    ${shownB.map(b => bundleRow(pid, b, name, !!open[b.id])).join("")}
    ${ordered.length > LIM ? `<div class="morebar"><button class="btn small" data-act="bmore">${showAllB ? "접기" : `${ordered.length - LIM}개 더 보기`}</button></div>` : ""}
  </section>
  ${reviewPanel(pid, name)}`;
}
/* 3차: 먼저 확인할 기록 (예외 중심) */
function checkPanel(pid, name) {
  const tc = toCheck(pid, name); const late = lateEntries(pid, name); const done = personEntries(pid, name).filter(e => STORE.selfChecks[e.id]);
  const mine = roleIs("employee") && USERS[STORE.me].name === name;
  if (!tc.length && !late.length && !done.length) return "";
  return `<section class="card"><div class="dhead"><h3>먼저 확인할 기록 ${tc.length ? badge(tc.length + "건", "orange") : badge("없음", "green")}</h3><span class="dimtxt">전부 보지 않습니다. 확인이 필요한 기록만 — ${mine ? "눌러서 사실관계를 확인하세요" : "본인이 확인합니다"}</span></div>
    ${tc.length ? `<ul class="chk">${tc.map(e => `<li data-act="entry" data-e="${e.id}" data-pid="${pid}">${pill(STAGE_KO[e.stage])} <b>“${esc(e.quote.length > 44 ? e.quote.slice(0, 44) + "…" : e.quote)}”</b><span class="reasons">${checkReasons(pid, e).map(r => `<span>${esc(r)}</span>`).join("")}</span></li>`).join("")}</ul>` : ""}
    ${late.length ? `<p class="muted">기준일 이후 기록 ${late.length}건은 이번 분석에 넣지 않았습니다 — ${late.map(e => `${e.date} ${STAGE_KO[e.stage]}`).join(" · ")}</p>` : ""}
    ${done.length ? `<details class="hist"><summary>본인이 확인한 기록 ${done.length}건</summary><ul class="list">${done.map(e => { const s = STORE.selfChecks[e.id]; return `<li><code>${s.at}</code> ${pill(s.choice, s.choice === "사실관계가 맞음" ? "green" : "orange")} “${esc(e.quote.slice(0, 40))}” ${s.note ? "— " + esc(s.note) : ""}</li>`; }).join("")}</ul></details>` : ""}
  </section>`;
}


/* ── Claude 직접 분석 (아티팩트 sample 기능) ── */
const AI = { sample: null, ready: false, runs: {}, results: {}, ctl: null };
(async () => {
  try { if (window.claude && typeof claude.use === "function") AI.sample = await claude.use("sample"); } catch (e) { AI.sample = null; }
  AI.ready = true; if (AI.sample && document.querySelector(".bundle.open")) render();
})();
const AI_RULES = `당신은 '일로'의 판정 AI입니다. 아래 기록들을 보고 각 기록이 "뒤에 생긴 일"과 이어지는지만 판단합니다. 잘했는지는 판단하지 않습니다.
규칙:
- 기여 1건 = 내가 남긴 것 + 뒤에 생긴 일. 둘 다 있어야 1건.
- 세 질문: ① 말한 뒤에 뭔가 생겼나(날짜 순서) ② 생긴 것 안에 이 말이 담겼나(앞·뒤 원문에서 인용할 문장이 실제로 있어야 함) ③ 다른 사람이 이 말을 가져다 썼나(링크·언급).
- 인용할 문장이 없으면 ②는 false. 추측하지 마세요.
- 승인 답장("좋아요" 등)과 같은 사람의 같은 말 반복은 세지 않습니다(skip).
- 점수·순위·확률·신뢰도 숫자는 절대 쓰지 않습니다. 쉬운 한국어로, 각 이유는 한 문장.
출력: JSON 하나만. {"entries":[{"id":"...","changed":true,"contains":true,"used":false,"skip":false,"cite_before":"앞 원문에서 그대로 인용","cite_after":"뒤 원문에서 그대로 인용","reason":"한 문장"}],"bundle":"이 묶음을 한 일로 보는 이유 한 문장","conclusion":"이 묶음에서 누구의 어떤 말이 어디까지 갔는지 두 문장"}`;
function aiPrompt(pid, b) {
  const rows = b.entries.map(e => ({ id: e.id, 단계: STAGE_KO[e.stage], 사람: e.person, 날짜: e.date, 출처: SRC_KO[e.source], 남긴_것: e.quote,
    뒤에_생긴_일: e.after ? { 내용: e.after.quote, 출처: SRC_KO[e.after.source], 날짜: e.after.date } : null }));
  return `${AI_RULES}\n\n프로젝트: ${PROJ[pid].name}\n업무 묶음: ${b.title}\n기록(JSON):\n${JSON.stringify(rows, null, 0)}`;
}
async function aiRun(pid, bid) {
  const b = bundleById(pid, bid); if (!b || !AI.sample) return;
  if (AI.ctl) AI.ctl.abort(); AI.ctl = new AbortController();
  AI.runs[bid] = { text: "", status: "thinking" }; delete AI.results[bid]; render();
  const box = () => document.getElementById("ai-stream-" + bid);
  try {
    const data = await AI.sample.json(aiPrompt(pid, b), { signal: AI.ctl.signal, cache: false,
      onText: ({ text }) => { AI.runs[bid].text = text; AI.runs[bid].status = "writing"; const el = box(); if (el) { el.textContent = text; el.scrollTop = el.scrollHeight; } } });
    AI.results[bid] = { data, at: now() }; delete AI.runs[bid]; log("AI 분석", `${meUser().name} · ${b.title} — Claude 직접 분석`, pid); render();
  } catch (e) {
    delete AI.runs[bid];
    if (e && e.code === "cancelled") { render(); return; }
    if (e && (e.code === "not_granted" || e.code === "sampling_disabled" || e.code === "not_declared")) { AI.sample = null; render(); return; }
    AI.results[bid] = { error: e && e.code === "invalid_json" ? "답을 JSON으로 읽지 못했습니다. 다시 눌러 주세요." : e && e.code === "rate_limited" ? "요청이 많아 잠시 뒤에 다시 시도해 주세요." : "분석이 끊겼습니다. 다시 눌러 주세요.", raw: e && e.text };
    render();
  }
}
function aiPanel(pid, b) {
  if (!AI.sample) return "";
  const run = AI.runs[b.id], res = AI.results[b.id];
  const head = `<div class="aihead"><div><b>Claude 직접 분석</b></div>
    <div class="actions">${run ? `<button class="btn small" data-act="ai-stop">중지</button>` : `<button class="btn small primary" data-act="ai-run" data-pid="${pid}" data-b="${b.id}">${res ? "다시 분석" : "Claude로 분석"}</button>`}</div></div>`;
  if (run) return `<div class="ai">${head}<div class="aistream" id="ai-stream-${b.id}">${run.status === "thinking" ? "생각하는 중… (처음 한 번은 Claude 사용 허용을 물어봅니다)" : esc(run.text)}</div></div>`;
  if (!res) return `<div class="ai">${head}</div>`;
  if (res.error) return `<div class="ai">${head}<div class="notice small">${esc(res.error)}</div>${res.raw ? `<pre class="aistream">${esc(res.raw)}</pre>` : ""}</div>`;
  const d = res.data || {}; const list = Array.isArray(d.entries) ? d.entries : [];
  const rows = b.entries.map(e => { const r = list.find(x => String(x.id) === e.id) || {}; const k = { changed: !!r.changed, contains: !!r.contains, used: !!r.used };
    const mine = CONF_RULE(e.checks), his = r.skip ? "제외" : CONF_RULE(k); const same = (e.skip || e.dup) ? his === "제외" : mine === his;
    return `<tr><td><code>${e.date}</code></td><td>${pill(STAGE_KO[e.stage])} ${esc(e.person)}</td><td class="q">“${esc(e.quote)}”</td>
      <td>${(e.skip || e.dup) ? badge("제외", "gray") : marks(e.checks, e.stage) + " " + badge(CONF_LABEL[mine], mine === "있음" ? "green" : mine === "약함" ? "yellow" : "gray")}</td>
      <td>${r.skip ? badge("제외", "gray") : marks(k) + " " + badge(CONF_LABEL[his] || his, his === "있음" ? "green" : his === "약함" ? "yellow" : "gray")}</td>
      <td class="why">${r.cite_before ? `<div><b>앞</b> “${esc(r.cite_before)}”</div>` : ""}${r.cite_after ? `<div><b>뒤</b> “${esc(r.cite_after)}”</div>` : ""}<div class="dimtxt">${esc(r.reason || "—")}</div></td><td>${same ? badge("일치", "green") : badge("다름", "orange")}</td></tr>`; }).join("");
  const agree = b.entries.filter(e => { const r = list.find(x => String(x.id) === e.id) || {}; const his = r.skip ? "제외" : CONF_RULE({ changed: !!r.changed, contains: !!r.contains, used: !!r.used }); return (e.skip || e.dup) ? his === "제외" : CONF_RULE(e.checks) === his; }).length;
  return `<div class="ai">${head}
    <p class="aisum"><b>${esc(d.bundle || "")}</b> ${esc(d.conclusion || "")}</p>
    <table class="etable aitable"><thead><tr><th>날짜</th><th>단계 · 사람</th><th>내가 남긴 것</th><th>저장된 판정</th><th>Claude 판정</th><th>Claude가 인용한 문장 · 이유</th><th></th></tr></thead><tbody>${rows}</tbody></table>
    <p class="dimtxt">${b.entries.length}건 중 ${agree}건 일치 · ${res.at}</p></div>`;
}

function bundleRow(pid, b, name, isOpen) {
  const es = b.entries.filter(e => !e.dup && !e.skip && dnum(e.date) <= cutoffNum(pid));
  const mine = es.filter(e => e.person === name);
  const conf = { "있음":0, "약함":0, "없음":0 }; mine.forEach(e => conf[CONF_RULE(e.checks)]++);
  const dates = es.map(e => e.date); const last = dates.reduce((a, c) => dnum(c) > dnum(a) ? c : a, dates[0] || "");
  const first = dates.reduce((a, c) => dnum(c) < dnum(a) ? c : a, dates[0] || "");
  const parent = b.parent ? bundleById(pid, b.parent) : null;
  const need = mine.some(e => e.status === "자료 필요");
  const stSet = [...new Set(mine.map(e => effStatus(e)))];
  return `<div class="bundle ${isOpen ? "open" : ""} ${parent ? "child" : ""}">
    <div class="bh" data-act="toggle" data-b="${b.id}">
      <span class="chev">${isOpen ? "▾" : "▸"}</span>
      <div class="bn">${pill(KIND_KO[b.kind], b.kind === "req" ? "accent" : "teal")} ${parent ? `<span class="dimtxt">후속 이슈 · ${esc(parent.title)}</span>` : ""}<b>${esc(b.title)}</b><small>${first} – ${last} ${b.deployed ? "· 배포 " + b.deployed : ""} ${b.prior ? "· 이전 기간 연결" : ""}</small></div>
      <div>${stageStrip(es, name)}</div>
      <div class="confs">${conf["있음"] ? badge("증거 " + conf["있음"], "green") : ""}${conf["약함"] ? badge("약함 " + conf["약함"], "yellow") : ""}${conf["없음"] ? badge("없음 " + conf["없음"], "gray") : ""} ${stSet.slice(0, 2).map(s => statusTag(s)).join(" ")}</div>
      <div class="cnt"><b>${mine.length}건</b><small>${new Set(mine.map(e => e.stage)).size}단계</small></div>
    </div>
    ${isOpen ? `<div class="basis"><div class="lbl">왜 한 묶음으로 봤나</div><ul class="kv">${bundleBasis(pid, b).map(x => `<li><span>${x[0]}</span><b>${esc(x[1])}</b></li>`).join("")}</ul>
      <div class="bedit">${editsOf(pid, b.id).map(x => `<span class="badge teal nodot" title="${esc(x.reason)}">${esc(x.type)} · ${esc(x.by)} ${x.at.slice(5)}</span>`).join(" ")}${roleIs("employee") && USERS[STORE.me].name === name ? `<button class="btn small" data-act="bedit" data-pid="${pid}" data-b="${b.id}">묶음 수정</button>` : ""}</div></div>
    ${aiPanel(pid, b)}
    <table class="etable"><thead><tr><th>날짜</th><th>단계</th><th>내가 남긴 것</th><th>뒤에 생긴 일</th><th>증거</th><th>어디까지</th><th>요청</th><th></th></tr></thead><tbody>
      ${mine.sort((a, c) => dnum(c.date) - dnum(a.date)).map(e => `<tr class="erow" data-act="entry" data-e="${e.id}" data-pid="${pid}"><td><code>${e.date}</code></td><td>${pill(STAGE_KO[e.stage])}</td><td class="q">“${esc(e.quote)}” ${srcTag(e.source)}</td><td class="aft">${e.after ? "→ <b>" + esc(e.after.quote) + "</b> " + srcTag(e.after.source) : "<span class='dimtxt'>(뒤에 생긴 일 없음)</span>"}</td><td>${marks(e.checks, e.stage)} ${confTag(e)}</td><td>${statusTag(effStatus(e))} ${nowTag(e)}</td><td>${reqTag(pid, e)}</td><td class="more">${e.url ? `<a class="src" href="${e.url}" target="_blank" rel="noopener" title="원문 열기">↗</a>` : ""} ›</td></tr>`).join("")}
    </tbody></table>` : ""}
  </div>`;
}

function reviewPanel(pid, name) {
  const oq = openRequests(pid, name); const rs = reviewState(pid, name);
  const hist = STORE.history.filter(h => h.pid === pid);
  if (roleIs("admin")) { const ev = (STORE.reviews[pid] || {})[name]; return `<section class="card"><div class="dhead"><h3>검토 상태</h3>${rs === "final" ? badge("검토 완료", "green") : oq.length ? badge("요청 " + oq.length + "건 열림", "orange") : badge("검토 중", "teal")}</div><ul class="kv"><li><span>평가자</span><b>${ev ? `${esc(ev.by)} · ${ev.at} 완료` : (staffOf().filter(s => s.role === "evaluator" && (s.all || s.projects.includes(pid))).map(s => USERS[s.user].name).join(" · ") || "미지정") + " · 검토 중"}</b></li><li><span>열린 요청</span><b>${oq.length}건</b></li></ul>${hist.length ? `<details class="hist"><summary>이력 ${hist.length}건</summary><ul class="list">${hist.map(h => `<li><code>${h.at}</code> ${pill(h.type)} ${esc(h.text)}</li>`).join("")}</ul></details>` : ""}</section>`; }
  if (roleIs("employee")) return `<section class="card"><h3>받은 요청</h3>${oq.length ? oq.map(r => requestCard(r)).join("") : `<p class="muted">열린 요청이 없습니다. 요청이 오면 설명과 자료를 여기서 붙일 수 있습니다.</p>`}</section>`;
  return `<section class="card"><div class="dhead"><h3>평가자 검토 — ${esc(name)}</h3>
    <div class="actions">${rs === "final" ? `<button class="btn" data-act="reopen" data-pid="${pid}" data-name="${esc(name)}">검토 다시 열기</button>` : `<button class="btn primary" data-act="final" data-pid="${pid}" data-name="${esc(name)}" ${oq.length || roleIs("admin") ? "disabled" : ""}>검토 완료</button>`}</div></div>
    
    ${oq.length ? oq.map(r => requestCard(r)).join("") : ""}
    ${hist.length ? `<details class="hist"><summary>이력 ${hist.length}건</summary><ul class="list">${hist.map(h => `<li><code>${h.at}</code> ${pill(h.type)} ${esc(h.text)}</li>`).join("")}</ul></details>` : ""}
  </section>`;
}

function requestCard(r) {
  const emp = roleIs("employee"), ev = roleIs("evaluator");
  return `<div class="req ${r.status}"><div class="reqh">${pill(r.type, "orange")} <b>${esc(r.from)} → ${esc(r.to)}</b> <code>${r.at}</code> ${r.status === "answered" ? badge("답변 옴", "teal") : r.status === "resolved" ? badge("요청 해결 · " + (r.result || "수용"), "green") : badge("요청 중", "orange")}</div>
    <div class="reqb"><div><span class="lbl">현재 내용 (전)</span>${esc(r.before)}</div><div><span class="lbl">바라는 내용 (후)</span>${esc(r.after)}</div><div><span class="lbl">사유</span>${esc(r.reason)}</div>${r.link ? `<div><span class="lbl">근거 링크</span>${esc(r.link)}</div>` : ""}${r.answer ? `<div class="ans"><span class="lbl">대상자 설명</span>${esc(r.answer)}${r.answerLink ? ` · <a href="${esc(r.answerLink)}" target="_blank" rel="noopener">${esc(r.answerLink)}</a>` : ""}${r.answerFile ? ` · 첨부 ${esc(r.answerFile)}` : ""}</div>` : ""}</div>
    <div class="reqa">${emp && r.status === "requested" ? `<form data-act="answer" data-id="${r.id}" class="ansform">
      <div class="ansh">설명 · 자료 보내기</div>
      <div class="ansf wide"><label>설명 <small>왜 그런지 · 필수</small></label><textarea name="answer" rows="2" placeholder="예: 후 숫자는 9/19 집계 쿼리로 다시 쟀습니다. 전 숫자와 같은 샘플 50건 기준입니다." required></textarea></div>
      <div class="ansf"><label>근거 링크 <small>선택</small></label><input name="link" placeholder="리포트 · 쿼리 · 티켓 주소"></div>
      <div class="ansf"><label>파일 첨부 <small>선택 · 여러 개 가능</small></label><div class="ansfile"><label class="filebtn"><input type="file" name="files" multiple data-act="pickfile"><span>📎 파일 고르기</span></label><span class="filelist dimtxt">첨부 없음</span></div></div>
      <div class="ansa"><button class="btn primary">설명 · 자료 보내기</button></div>
    </form>` : ""}
    ${ev && r.status !== "resolved" ? `<span class="inline"><select data-result="${r.id}">${RESOLVE_TYPES.map(t => `<option>${t}</option>`).join("")}</select><button class="btn" data-act="resolve" data-id="${r.id}">처리 결과 기록 · 요청 해결</button></span>` : ""}</div></div>`;
}

/* 기록 팝업 */
function entryModal(pid, eid) {
  const b = bundlesOf(pid).find(x => x.entries.some(e => e.id === eid)); const e = b.entries.find(x => x.id === eid);
  const c = CONF_RULE(e.checks);
  const why = [
    ["① 말한 뒤에 뭔가 생겼나", e.checks.changed, e.after ? `${e.date} 말함 → ${e.after.date} 생김` : "뒤 기록 없음"],
    ["② 생긴 것 안에 이 말이 담겼나", e.checks.contains, e.cite ? `앞 “${e.cite}” ↔ 뒤 “${e.citeAfter || e.cite}”` : e.checks.contains ? "뒤 기록이 이 내용을 그대로 담음" : "인용할 문장 없음"],
    ["③ 다른 사람이 이 말을 가져다 썼나", e.checks.used, e.checks.used ? "링크 · 언급 있음" : "확인되지 않음"],
  ];
  const cmp = (e.stage === "result" && e.before) ? cmpOf(e) : null; const fails = cmp ? cmp.filter(c => !c[2]) : [];
  const reasons = checkReasons(pid, e); const sc = STORE.selfChecks[e.id];
  const mine = roleIs("employee") && USERS[STORE.me].name === e.person;
  const detail = [];
  if (e.shape) detail.push(["채택", e.shape]); if (e.changedWhat) detail.push(["검토로 바꾼 것", e.changedWhat === "결정" ? "결정을 바꿈" : e.changedWhat === "결과물" ? "결과물을 바꿈" : "테스트를 추가함"]);
  if (e.remains) detail.push(["기준일에", e.remains]); if (e.now) detail.push(["현재 상태", `${NOW_KO[e.now.k]} — 근거: ${e.now.rec}`]); if (e.before) detail.push(["전 → 후", `${e.before} → ${e.afterValue} (${e.where})`, e.whereUrl]);
  if (e.evidence) detail.push(["말 안의 근거", e.evidence]); if (e.note) detail.push(["메모", e.note]); if (e.alt) detail.push(["같은 결정이 적힌 곳", e.alt.label, e.alt.url]);
  detail.push(["지금 상태", fails.length ? "결과 전 — 전 · 후 숫자는 있지만 비교 조건이 빠져 결과로 확정하지 않음" : `${STATUS_KO[e.status]} — ${STATUS_HINT[e.status]}`]);
  const ev = roleIs("evaluator");
  return `<div class="modal-bg" data-act="close"><div class="modal" data-stop>
    <div class="mh"><div>${pill(STAGE_KO[e.stage])} <b>${e.date} · ${SRC_KO[e.source]}</b><small>${esc(b.title)} · ${esc(e.person)}</small></div><button class="x" data-act="close">×</button></div>
    <div class="two"><div class="box"><span class="lbl">내가 남긴 것</span>“${esc(e.quote)}”<small>${SRC_KO[e.source]} · ${e.date}${e.url ? ` · <a href="${e.url}" target="_blank" rel="noopener">원문 열기 ↗</a>` : ""}</small></div><span class="arrow">→</span><div class="box ${e.after ? "" : "none"}"><span class="lbl">뒤에 생긴 일</span>${e.after ? `“${esc(e.after.quote)}”<small>${SRC_KO[e.after.source]} · ${e.after.date}${e.after.url ? ` · <a href="${e.after.url}" target="_blank" rel="noopener">원문 열기 ↗</a>` : ""}</small>` : "<span class='dimtxt'>아직 없음</span>"}</div></div>
    <div class="tags">${marks(e.checks, e.stage)} ${badge(CONF_LABEL[c], CONF_TONE[c])} ${statusTag(effStatus(e))}</div>
    ${e.cite ? `<div class="cites"><span class="lbl">AI가 연결에 사용한 원문</span><div><b>앞</b> “${esc(e.cite)}”</div><div><b>뒤</b> ${e.citeAfter ? `“${esc(e.citeAfter)}”` : `<span class="dimtxt">뒤 기록에 같은 말 없음 — 이어진 것으로 보지 않음</span>`}</div></div>` : ""}
    
    ${reasons.length ? `<div class="notice small">${badge("먼저 확인할 기록", "orange")} ${reasons.map(r => esc(r)).join(" · ")}</div>` : ""}
    ${sc ? `<div class="notice small">${badge("본인 확인", "green")} ${esc(sc.choice)} ${sc.note ? "— " + esc(sc.note) : ""} <span class="dimtxt">${sc.at}</span></div>` : mine ? `<h4>본인 — 사실관계 확인</h4><form class="reqform" data-act="selfcheck" data-e="${e.id}" data-pid="${pid}"><select name="choice">${SELF_CHOICES.map(c => `<option>${c}</option>`).join("")}</select><input name="note" placeholder="설명 · 빠진 자료 (선택)"><button class="btn primary">확인</button></form>` : ""}
    <h4>세부</h4><ul class="kv">${detail.map(d => `<li><span>${d[0]}</span><b>${esc(d[1])}${d[2] ? ` <a href="${d[2]}" target="_blank" rel="noopener">원문 열기 ↗</a>` : ""}</b></li>`).join("")}</ul>
    ${ev ? `<h4>평가자 — 이 기록이 틀렸다면</h4><form class="reqform" data-act="request" data-pid="${pid}" data-e="${e.id}" data-b="${b.id}" data-to="${esc(e.person)}">
      <select name="type">${ERR_TYPES.map(t => `<option>${t}</option>`).join("")}</select>
      <input name="before" value="${esc(e.after ? e.after.quote : "뒤 기록 없음")}" placeholder="현재 내용 (전)" required><input name="after" placeholder="수정할 내용 (후)" required><input name="reason" placeholder="사유" required><input name="link" placeholder="근거 링크 (선택)">
      <button class="btn primary">요청 보내기</button></form>` : ""}
    <div class="right"><button class="btn" data-act="flow" data-pid="${pid}" data-b="${b.id}">이 일의 전체 흐름 보기</button></div>
  </div></div>`;
}
function bundleEditModal(pid, bid) {
  const b = bundleById(pid, bid); const n = b.entries.filter(e => !e.dup && !e.skip).length; const others = bundlesOf(pid).filter(x => x.id !== bid);
  return `<div class="modal-bg" data-act="close"><div class="modal" data-stop>
    <div class="mh"><div>${pill(KIND_KO[b.kind], b.kind === "req" ? "accent" : "teal")} <b>${esc(b.title)}</b><small>AI가 기록 ${n}건을 한 일로 묶음 · 수정해도 처음 결과와 이력은 남습니다</small></div><button class="x" data-act="close">×</button></div>
    <ul class="kv">${bundleBasis(pid, b).map(x => `<li><span>${x[0]}</span><b>${esc(x[1])}</b></li>`).join("")}</ul>
    <form class="reqform" data-act="bedit-save" data-pid="${pid}" data-b="${bid}"><select name="type">${BUNDLE_EDITS.map(t => `<option>${t}</option>`).join("")}</select><select name="target"><option value="">(합칠 묶음 — 해당 시)</option>${others.map(o => `<option>${esc(o.title)}</option>`).join("")}</select><input name="reason" placeholder="사유 (필수) — 예: 배포 시점과 목적이 다름" required><input name="link" placeholder="근거 링크 (선택)"><button class="btn primary">수정 기록</button></form>
    ${editsOf(pid, bid).length ? `<h4>수정 이력</h4><ul class="list">${editsOf(pid, bid).map(x => `<li><code>${x.at}</code> ${pill(x.type, "teal")} ${esc(x.by)} — ${esc(x.reason)} ${x.target ? "→ " + esc(x.target) : ""}</li>`).join("")}</ul>` : ""}
  </div></div>`;
}
function flowModal(pid, bid) {
  const b = bundleById(pid, bid); const es = b.entries.filter(e => !e.dup && !e.skip).sort((a, c) => dnum(a.date) - dnum(c.date) || STAGES.indexOf(a.stage) - STAGES.indexOf(c.stage));
  return `<div class="modal-bg" data-act="close"><div class="modal wide" data-stop>
    <div class="mh"><div>${pill(KIND_KO[b.kind], b.kind === "req" ? "accent" : "teal")} <b>${esc(b.title)}</b><small>같은 사람 · 같은 단계 · 같은 일은 1건. 결과는 '팀'에 붙습니다.</small></div><button class="x" data-act="close">×</button></div>
    <div class="flow">${es.map((e, i) => `<div class="fnode ${e.person === "팀" ? "team" : ""}">${pill(STAGE_KO[e.stage])}<b>${esc(e.person)}</b><small>${SRC_KO[e.source]} · ${e.date}</small><p>“${esc(e.quote.length > 48 ? e.quote.slice(0, 48) + "…" : e.quote)}”</p></div>${i < es.length - 1 ? "<span class='farrow'>→</span>" : ""}`).join("")}</div>
  </div></div>`;
}

/* 내 기여 */
views.my = () => {
  const me = USERS[STORE.me]; const mine = PROJECTS.filter(p => p.members.includes(me.id));
  const cur = STORE._mypid && mine.find(p => p.id === STORE._mypid) ? STORE._mypid : mine[0].id;
  const oq = STORE.requests.filter(r => r.to === me.name && r.status !== "resolved");
  return `<div class="pagehead"><div><h1>내 기여</h1></div></div>
  ${oq.length ? `<div class="notice">${badge("요청 " + oq.length + "건", "orange")} 아래에서 설명과 자료를 붙이면 다시 봅니다.</div>` : ""}
  <div class="tabs">${mine.map(p => `<a class="${p.id === cur ? "on" : ""}" href="#/my?pid=${p.id}">${esc(p.name)}</a>`).join("")}</div>
  ${cutoffBar(cur)}
  ${detailPanel(cur, me.name)}`;
};

/* 관리자 진행 단계: 기본 정보 → 정보 연결 → 참여자 알림 → 기준일 → 결과 */
function stepBar(pid, cur) {
  const p = PROJ[pid]; const t = p ? Object.assign({}, p.tools, integToTools(integOf(pid))) : {};
  const done = [true, p && Object.values(t).some(v => v === "ok"), p && STORE.history.some(h => h.pid === pid && h.type === "연결 요청"), p && !!(STORE.cutoff[pid] || p.cutoff), p && p.review.text === "평가 완료"];
  const steps = ["기본 정보", "정보 연결", "참여자 알림", "기준일 설정", "결과 보고서"];
  return `<ol class="steps3">${steps.map((s, i) => `<li class="${done[i] ? "done" : ""} ${cur === i ? "cur" : ""}"><i>${done[i] ? "✓" : i + 1}</i>${s}</li>`).join("")}</ol>`;
}
/* 결과 보고서 — 평가가 끝나면 나오는 것. 점수 대신 결론 문장 + 근거 */
function reportData(pid, name) {
  const st = personStats(pid, name); const p = PROJ[pid];
  const bundles = st.bundles.filter(Boolean).map(b => {
    const es = b.entries.filter(e => !e.dup && !e.skip && dnum(e.date) <= cutoffNum(pid)); const mine = es.filter(e => e.person === name);
    const first = mine.slice().sort((x, y) => dnum(x.date) - dnum(y.date))[0];
    const exec = es.find(e => e.stage === "execution" && e.person === name) || es.find(e => e.stage === "execution");
    const res = es.find(e => e.stage === "result");
    const nowE = mine.find(e => e.now) || es.find(e => e.now);
    const ok = mine.filter(e => CONF_RULE(e.checks) === "있음").length;
    return { b, mine, first, exec, res, now: nowE ? nowE.now : null, ok, stages: [...new Set(mine.map(e => e.stage))], deployed: !!b.deployed, cmpFail: res ? cmpFails(res).length > 0 : false };
  });
  const deployed = bundles.filter(x => x.deployed).length, inUse = bundles.filter(x => x.now && x.now.k === "use").length, withResult = bundles.filter(x => x.res && !x.cmpFail).length;
  const checked = personEntries(pid, name).filter(e => STORE.selfChecks[e.id]).length, toC = toCheck(pid, name).length, oq = openRequests(pid, name).length, rs = reviewState(pid, name);
  return { st, p, bundles, deployed, inUse, withResult, checked, toC, oq, rs };
}
views.report = (pid, params) => {
  const name = params.get("p"); const u = BYNAME[name]; if (!PROJ[pid] || !u) return views.evaluation();
  const d = reportData(pid, name); const p = d.p;
  const ev = (STORE.reviews[pid] || {})[name];
  const eun = w => { const c = w.charCodeAt(w.length - 1); return (c >= 0xAC00 && c <= 0xD7A3 && (c - 0xAC00) % 28) ? "은" : "는"; };
  const concl = `${name}${eun(name)} ${PERIODS[p.period].name} ${esc(p.name)}에서 ${d.bundles.length}개 일에 참여했고, 그중 ${d.deployed}개가 배포됐으며 ${d.inUse}개는 기준일 현재도 그대로 쓰이고 있다. ${d.withResult ? `${d.withResult}개는 전 · 후 숫자가 남은 결과로 이어졌다.` : "결과 숫자가 남은 일은 아직 없다."} 이 판단의 근거는 증거 있음 ${d.st.conf["있음"]}건이고, 증거 약함 ${d.st.conf["약함"]}건 · 자료 부족 ${d.st.conf["없음"]}건은 따로 둔다.`;
  const SK = { problem:"문제 · 요구사항을 올림", proposal:"해결안을 냄", review:"검토로 바꿈", decision:"결정", execution:"만듦", result:"결과" };
  return `
  <div class="pagehead"><div><h1>기여 결과 보고서 <span class="dimtxt">· ${esc(name)}</span></h1><p class="sub">${esc(p.name)} · ${PERIODS[p.period].type} 평가 · 기준일 ${cutoffLabel(pid)}</p></div>
    <div class="actions"><a class="btn" href="#/evaluation/${pid}/person?p=${encodeURIComponent(name)}">상세로</a><button class="btn primary" data-act="print">인쇄 · PDF</button></div></div>
  <section class="card rpt">
    <div class="rhead"><div class="person big">${avatar(name, 44)}<span><b>${esc(name)}</b><small>${u.title} · ${u.level} · ${esc(p.name)} ${p.from} – ${p.to}</small></span></div><div class="confs">${badge("증거 있음 " + d.st.conf["있음"], "green")} ${badge("약함 " + d.st.conf["약함"], "yellow")} ${badge("자료 부족 " + d.st.conf["없음"], "gray")}</div></div>
    <div class="concl"><span class="lbl">결론</span><p>${concl}</p><small>이 문단은 아래 기록에서 자동으로 만든 것이고, 모든 문장은 원문으로 돌아갈 수 있다. 잘했나 · 못했나는 판단하지 않는다.</small></div>
    <h3>남긴 일 ${d.bundles.length}개</h3>
    ${d.bundles.map(x => `<div class="ritem"><div class="rt">${pill(KIND_KO[x.b.kind], x.b.kind === "req" ? "accent" : "teal")} <b>${esc(x.b.title)}</b> ${x.now ? nowTag({ now: x.now }) : ""} ${x.res ? statusTag(effStatus(x.res)) : x.exec ? statusTag(effStatus(x.exec)) : ""}</div>
      <ul class="kv"><li><span>한 것</span><b>${x.stages.map(s => SK[s]).join(" · ")} — “${esc((x.first || x.mine[0]).quote.length > 70 ? (x.first || x.mine[0]).quote.slice(0, 70) + "…" : (x.first || x.mine[0]).quote)}” <span class="dimtxt">(${SRC_KO[(x.first || x.mine[0]).source]} ${(x.first || x.mine[0]).date})</span></b></li>
      ${x.exec ? `<li><span>그 뒤</span><b>${esc(x.exec.after ? x.exec.after.quote : x.exec.quote)} <span class="dimtxt">(${SRC_KO[(x.exec.after || x.exec).source]} ${(x.exec.after || x.exec).date})</span></b></li>` : `<li><span>그 뒤</span><b class="dimtxt">배포 · 결과 기록 아직 없음</b></li>`}
      ${x.res ? `<li><span>결과</span><b>${x.res.before ? `${esc(x.res.before)} → ${esc(x.res.afterValue)} <span class="dimtxt">(${esc(x.res.where || "")})</span>` : esc(x.res.quote)}</b></li>` : ""}
      ${x.now ? `<li><span>지금</span><b>${NOW_KO[x.now.k]} — ${esc(x.now.rec)}</b></li>` : ""}
      <li><span>근거</span><b>${[...new Set(x.mine.map(e => `${SRC_KO[e.source]} ${e.date}`))].join(" · ")} · 기록 ${x.mine.length}건 중 증거 있음 ${x.ok}건</b></li></ul></div>`).join("")}
    <h3>사실관계 확인</h3>
    <ul class="kv"><li><span>본인</span><b>${d.toC ? `확인 필요한 기록 ${d.toC}건 남음` : `확인 완료 ${d.checked ? "(" + d.checked + "건 직접 확인)" : "— 확인이 필요한 기록 없음"}`}</b></li><li><span>평가자</span><b>${d.oq ? `열린 요청 ${d.oq}건` : "틀렸다고 본 기록 없음"} ${d.rs === "final" ? `· 검토 완료 (${ev.by}, ${ev.at})` : "· 검토 중"}</b></li><li><span>이력</span><b>요청 · 처리 · 묶음 수정은 모두 남아 있고, 본인과 평가자가 같은 것을 본다</b></li></ul>
    <h3>평가자 결론 — 사람이 씁니다</h3>
    ${(STORE.conclusions || {})[pid + "|" + name] ? `<div class="concl soft"><p>결론 : ${esc(STORE.conclusions[pid + "|" + name].text)}</p><small>${esc(STORE.conclusions[pid + "|" + name].by)} · ${STORE.conclusions[pid + "|" + name].at} · 인용: ${esc(STORE.conclusions[pid + "|" + name].cite)}</small></div>` : roleIs("evaluator") ? `<form class="reqform" data-act="conclude" data-pid="${pid}" data-name="${esc(name)}"><input name="text" placeholder="결론 : 한 줄로 (예: 세션 만료 개선을 만들어 CS 문의 0건까지 이었다)" required><select name="cite">${d.bundles.map(x => `<option>${esc(x.b.title)}</option>`).join("")}</select><button class="btn primary">결론 저장</button></form>` : `<p class="muted">아직 평가자 결론이 없습니다.</p>`}
    <h3>이 보고서로 하는 것</h3>
    <ul class="kv"><li><span>본인</span><b>성과 면담에서 "내가 남긴 것"을 말이 아니라 기록으로 보여준다</b></li><li><span>평가자</span><b>"왜 이 결과냐"에 느낌이 아니라 위 근거로 답한다</b></li><li><span>조직</span><b>승진 · 보상은 사람이 결정한다. 이 보고서는 그 결정의 근거 자료이지, 결정이 아니다</b></li></ul>
    
  </section>`;
};

/* 자료 요청 — 어느 일의 어느 기록에 대한 요청인지, 기여 판정 내용을 보면서 처리 */
function requestContext(r) {
  const b = bundleById(r.project, r.bundle); if (!b) return "";
  const es = b.entries.filter(x => !x.dup && !x.skip); const mine = es.filter(x => x.person === r.to).sort((x, y) => dnum(y.date) - dnum(x.date));
  const target = r.entry ? es.find(x => x.id === r.entry) : null;
  return `<div class="rctx">
    <div class="rctx-h">${pill(KIND_KO[b.kind], b.kind === "req" ? "accent" : "teal")} <b>${esc(b.title)}</b><span class="dimtxt">${esc(r.to)}의 기록 ${mine.length}건 · 요청 대상 ${target ? "1건" : "이 일 전체"}</span><span class="right-in">${stageStrip(es, r.to)}</span></div>
    <table class="etable"><thead><tr><th>날짜</th><th>단계</th><th>내가 남긴 것</th><th>뒤에 생긴 일</th><th>증거</th><th>어디까지</th><th></th></tr></thead><tbody>
    ${mine.map(x => `<tr class="erow ${target && target.id === x.id ? "hl" : (!target ? "hl" : "")}" data-act="entry" data-e="${x.id}" data-pid="${r.project}"><td><code>${x.date}</code></td><td>${pill(STAGE_KO[x.stage])}</td><td class="q">“${esc(x.quote.length > 60 ? x.quote.slice(0, 60) + "…" : x.quote)}” ${srcTag(x.source)}</td><td class="aft">${x.after ? "→ " + esc(x.after.quote.length > 50 ? x.after.quote.slice(0, 50) + "…" : x.after.quote) + " " + srcTag(x.after.source) : "<span class='dimtxt'>(뒤에 생긴 일 없음)</span>"}</td><td>${marks(x.checks)} ${confTag(x)}</td><td>${statusTag(effStatus(x))}</td><td class="more">›</td></tr>`).join("")}
    </tbody></table></div>`;
}
views.requests = () => {
  const f = STORE._rf || "open";
  const list = STORE.requests.filter(r => f === "all" || (f === "open" ? r.status !== "resolved" : r.status === "resolved")).filter(r => !roleIs("employee") || r.to === USERS[STORE.me].name);
  const byProj = {}; list.forEach(r => { (byProj[r.project] = byProj[r.project] || []).push(r); });
  return `<div class="pagehead"><div><h1>자료 요청</h1></div>
    <div class="tabs small">${[["open","열린 요청"],["resolved","해결됨"],["all","전체"]].map(t => `<a class="${f === t[0] ? "on" : ""}" href="#/requests?f=${t[0]}">${t[1]}</a>`).join("")}</div></div>
    ${list.length ? Object.entries(byProj).map(([pid, rs]) => `<section class="card reqproj"><div class="dhead"><h3>${esc(PROJ[pid].name)} <span class="dimtxt">· ${PERIODS[PROJ[pid].period].type} 평가 · 기준일 ${cutoffLabel(pid)} · 요청 ${rs.length}건</span></h3><a class="btn" href="${roleIs("employee") ? "#/my?pid=" + pid : "#/evaluation/" + pid}">${roleIs("employee") ? "내 기여 전체 보기" : "평가 화면"}</a></div>
      ${rs.map(r => `<div class="reqblock">${requestContext(r)}${requestCard(r)}</div>`).join("")}</section>`).join("") : `<section class="card"><p class="muted">해당하는 요청이 없습니다.</p></section>`}`;
};

/* 평가 기준 */
views.criteria = () => { const t = STORE._ct || "base"; return `
  <div class="pagehead"><div><h1>평가 기준</h1><p class="sub">기여 1건 = 내가 남긴 것 + 그 뒤에 생긴 일. 점수 · 순위 · 감점은 없습니다.</p></div>
    <div class="tabs small">${[["base","기본 규칙"],["v3","3차에서 더한 것"],["keep","바뀌지 않는 것"]].map(x => `<a href="#" data-act="ctab" data-v="${x[0]}" class="${t === x[0] ? "on" : ""}">${x[1]}</a>`).join("")}</div></div>
  <div class="grid2">
  ${t === "base" ? `<section class="card"><h3>기여 1건이 되려면</h3><div class="two"><div class="box"><span class="lbl">내가 남긴 것</span><b>요구사항 · 말 · 문서 · 코드</b><small>메시지 · 회의록 · PR · 시안 · 문서. 말투는 상관없다 — "로그인 안돼요"도 된다.</small></div><span class="arrow">+</span><div class="box"><span class="lbl">그 뒤에 생긴 일</span><b>티켓 · 결정 · 수정 · 배포 · 숫자</b><small>티켓 생성 · "결론 :" 줄 · PR 병합 · 배포 · 전 · 후 숫자. 내 말이 거기에 담겨 있어야 한다.</small></div></div><p class="muted">둘 다 있어야 1건. 남긴 것만 세면 말 많은 사람이 유리해진다. AI는 둘을 잇기만 하고, 이을 때마다 원문을 인용한다.</p></section>
    <section class="card"><h3>여섯 단계 — 무엇이 있어야 인정되나</h3><ul class="kv steps">
      <li><span>${pill("시작")}</span><b>요구사항(목표 · 배경)도, 문제(숫자 · 링크 · 재현 방법)도 시작이 된다. 이슈는 어느 요구사항의 후속인지 표시. 없으면 세긴 하지만 "증거 없음"</b></li>
      <li><span>${pill("해결 제안")}</span><b>결정이나 결과물에 그 내용이 담겨야. 숫자 · 링크 · 목표 중 하나 있어야. "좋아요" 답장은 증거가 아님</b></li>
      <li><span>${pill("검토")}</span><b>검토 뒤에 결정 · 결과물 · 테스트 중 하나가 바뀌어야. 기한 없음</b></li>
      <li><span>${pill("결정")}</span><b>회의록의 "결론 :" 줄만 결정으로 본다. 없으면 결정 없음</b></li>
      <li><span>${pill("만듦")}</span><b>기준일에 그대로 남아 있나 본다. 남이 되돌리면 "바뀜" 표시 (내가 고친 건 괜찮음)</b></li>
      <li><span>${pill("결과")}</span><b>전 숫자 + 후 숫자, 각각 어디서 · 언제. 후 숫자는 배포 뒤 기록이면 됨</b></li></ul></section>
    <section class="card"><h3>증거 — 세 질문</h3><ul class="why big">
      <li><b class="y">①</b> 내 말 다음에 뭔가 바뀌었나 <span class="dimtxt">— 시간 순서만 본다</span></li>
      <li><b class="y">②</b> 바뀐 것 안에 내 말이 들어 있나 <span class="dimtxt">— 두 글을 비교해 원문을 인용한다. 인용할 문장이 없으면 "아니오"</span></li>
      <li><b class="y">③</b> 다른 사람이 내 말을 가져다 썼나 <span class="dimtxt">— 링크 · 언급</span></li></ul>
      <div class="confs big">${badge("증거 있음 — ①② 둘 다", "green")} ${badge("증거 약함 — 하나만, 또는 ③만", "yellow")} ${badge("증거 없음 — 셋 다 없음 → 자료 부족", "gray")}</div>
      <p class="muted">AI는 "이어지나"만 본다. 잘했나 · 못했나는 보지 않고, 인용할 문장이 없으면 잇지 않는다. 같은 사람 · 같은 단계 · 같은 일은 1건. 승인 답장("좋아요")과 중복은 세지 않는다.</p></section>
    <section class="card"><h3>어디까지 왔나 (상태)</h3><div class="confs big">${Object.keys(STATUS_KO).map(k => statusTag(k)).join(" ")}</div><ul class="kv">${Object.entries(STATUS_HINT).map(([k, v]) => `<li><span>${STATUS_KO[k]}</span><b>${v}</b></li>`).join("")}</ul><p class="muted">기록이 더 오면 올라가기만 한다. 내려가는 일도, 감점도 없다. "자료 부족"은 0이 아니다 — 자료를 붙이면 다시 본다.</p></section>
    <section class="card"><h3>AI는 무엇을 하나</h3><ul class="kv"><li><span>${pill("1 모은다")}</span><b>허용된 곳의 기록만 — 시스템</b></li><li><span>${pill("2 묶는다")}</span><b>같은 일끼리 한 묶음 — AI</b></li><li><span>${pill("3 잇는다")}</span><b>내 말 뒤에 생긴 일 찾기, 세 질문으로 — AI. 인용할 문장이 있을 때만</b></li><li><span>${pill("4 넘긴다")}</span><b>증거 · 상태 붙여 본인에게 먼저 — 시스템</b></li></ul></section>
    <section class="card"><h3>사람이 보는 순서</h3><ul class="kv"><li><span>본인</span><b>먼저 본다. 틀리면 설명 · 파일 추가</b></li><li><span>평가자</span><b>사람별 토탈에서 틀린 기록만 요청 (전 · 후 · 사유 · 근거 링크). 요청 없으면 바로 완료</b></li><li><span>처리</span><b>본인 또는 AI가 다시 잇고 "요청 해결됨". 요청 · 처리는 이력에 남고 본인 화면에도 똑같이 보인다</b></li><li><span>시점</span><b>기준일을 정해 중간 분석. 수집은 계속</b></li></ul></section>
    ` : t === "v3" ? `<section class="card"><h3>${pill("3차", "accent")} 증거 세 숫자는 따로 센다</h3><ul class="kv"><li><span>증거 있음</span><b>앞 기록 + 뒤 기록 + 둘을 잇는 인용 문장. 단계별 집계에는 이것만 들어간다</b></li><li><span>증거 약함</span><b>앞뒤 중 일부만 있거나 연결 근거가 부족 — 연결 검토 필요</b></li><li><span>증거 없음</span><b>뒤 기록이나 인용 문장이 없음 — 자료 부족</b></li></ul><p class="muted">세 숫자를 더한 "공식 토탈"은 만들지 않는다. 하나의 숫자가 생기면 그것이 점수가 된다.</p></section>
    <section class="card"><h3>${pill("3차", "accent")} 현재 상태 꼬리표 — 만듦 · 결과에만</h3><div class="confs">${Object.keys(NOW_KO).map(k => `<span class="badge ${NOW_TONE[k]} nodot">${NOW_KO[k]}</span>`).join(" ")}</div><ul class="kv">${Object.keys(NOW_RULE).map(k => `<li><span>${NOW_KO[k]}</span><b>${esc(NOW_RULE[k])}</b></li>`).join("")}</ul><p class="muted">기록이 있을 때만 붙인다. 도달 단계는 그대로이고, 어떤 꼬리표든 감점이 아니다. 시작 · 제안 · 검토 · 결정은 말과 회의록이라 이 축이 없다.</p></section>
    <section class="card"><h3>${pill("3차", "accent")} 본인 확인 — 전부 보지 않는다</h3><p class="muted">확인이 필요한 기록만 먼저 보여준다: 내 업무인지 불확실 · 같은 일 묶기 불확실 · 인용 연결이 약함 · 출처끼리 충돌 · 결과 숫자 기준 시점 없음 · 공동 참여 범위 불분명 · 기준일 이후 기록.</p><div class="confs">${SELF_CHOICES.map(c => badge(c, c === "사실관계가 맞음" ? "green" : "gray")).join(" ")}</div><p class="muted">"평가에 동의"는 없다. 본인은 평가가 아니라 사실관계를 확인한다. 업무 묶음도 본인이 고칠 수 있고(분리 · 합치기 · 내 일 아님 · 누락 추가), 고쳐도 처음 AI 결과와 이력은 남는다.</p></section>
    <section class="card"><h3>${pill("3차", "accent")} 정정 요청 — 유형과 처리 결과</h3><div class="confs">${ERR_TYPES.map(t => badge(t, "orange")).join(" ")}</div><ul class="kv"><li><span>요청에 담는 것</span><b>현재 내용 · 바라는 내용 · 사유 · 근거 링크 · 요청자 · 시점</b></li><li><span>처리 결과</span><b>${RESOLVE_TYPES.join(" · ")} → 요청 해결</b></li></ul><p class="muted">본인과 평가자는 같은 변경 전후와 이력을 본다.</p></section>
    <section class="card"><h3>${pill("3차", "accent")} 평가자 · 관리자 화면</h3><ul class="kv"><li><span>평가자</span><b>전체 건수보다 해결되지 않은 오류를 먼저 본다. 사람을 건수로 정렬 · 비교하지 않는다</b></li><li><span>제공하지 않음</span><b>${NOT_PROVIDED.join(" · ")}</b></li><li><span>관리자</span><b>기여를 평가하지 않는다. 규칙 버전 · 공식 기록 형식 · 허용 소스 · 개인 메시지 차단 · 동기화 시점을 관리한다. 기록은 지우지 않는다</b></li></ul></section>
    ` : `<section class="card span2"><h3>규칙이 바뀌어도, 이것은 그대로</h3><div class="grid3 keep"><div><b>점수 · 순위 없음</b><small>누가 몇 점인지 보여주지 않는다</small></div><div><b>승진 · 보상 자동화 없음</b><small>결정은 사람이 한다</small></div><div><b>개인 메시지 수집 없음</b><small>허용된 채널만</small></div><div><b>AI 판단엔 반드시 인용</b><small>인용 없으면 잇지 않는다</small></div><div><b>본인이 먼저 본다</b><small>평가자는 그다음. 틀린 것만 요청, 이유 필수</small></div></div></section>
  `}
  </div>`; };

/* 데이터 연동 관리 */
views.integrations = () => {
  const q = (STORE._iq || "").trim().toLowerCase();
  const rows = PROJECTS.map(p => { const integ = integOf(p.id); const t = Object.assign({}, p.tools, integToTools(integ));
    const chips = TOOL_ORDER.filter(k => t[k]).map(k => ({ k, v:t[k], n:(integ[k] && integ[k].scope || []).length }));
    const okN = chips.filter(c => c.v === "ok").length, warnN = chips.filter(c => c.v === "warn").length;
    const members = p.members.map(m => USERS[m].name).join(" ");
    const hay = `${p.name} ${p.desc} ${members} ${chips.map(c => SRC_KO[c.k]).join(" ")}`.toLowerCase();
    return { p, chips, okN, warnN, hay, sync: RULE_INFO.sync }; })
    .filter(r => !q || r.hay.includes(q));
  const connected = rows.filter(r => r.chips.length);
  const co = companyOf();
  return `
  <div class="pagehead"><div><h1>데이터 연동 관리 <span class="tip" tabindex="0">ⓘ 기본 정책<span class="tipbox"><b>기본 정책</b><ul class="kv">${POLICY.map(x => `<li><span>${x[0]}</span><b>${x[1]}</b></li>`).join("")}</ul></span></span></h1></div></div>
  <section class="card"><div class="dhead"><h3>회사 연결</h3>${badge(TOOL_ORDER.filter(t => co[t] && co[t].connected).length + " / " + TOOL_ORDER.length + " 연결됨", "green")}</div>
    <div class="colist">${TOOL_ORDER.map(t => { const c = CATALOG[t], it = co[t]; return `<div class="coitem ${it && it.connected ? "on" : ""}"><div><b>${SRC_KO[t]}</b><small>${it && it.connected ? `${esc(c.account)} · 설치 ${esc(it.at)} · ${esc(it.by)}` : "설치 전"}</small></div><div class="dimtxt small">${it && it.connected ? "허용: " + c.ask.join(" · ") : "요청 안 함: " + c.never.join(" · ")}</div><div>${it && it.connected ? `${badge("토큰 정상", "green")} <button class="link" data-act="co-off" data-t="${t}">해제</button>` : `<button class="btn primary small" data-act="co-on" data-t="${t}">앱 설치 · 연결</button>`}</div></div>`; }).join("")}</div></section>
  <section class="panel">
    <div class="toolbar"><input id="iq" class="search" placeholder="프로젝트명 · 참여자 · 도구 검색" value="${esc(STORE._iq || "")}"><span class="count" id="icount">연동된 프로젝트 ${connected.length}개 · 전체 ${PROJECTS.length}개</span></div>
    <table class="table itbl"><thead><tr><th>프로젝트</th><th>연동 도구 · 읽는 범위</th><th class="c">상태</th><th class="c">마지막 동기화</th><th></th></tr></thead><tbody id="irows">
    ${rows.length ? rows.map(r => `<tr class="row" data-href="#/projects/${r.p.id}/connect"><td class="name"><b>${esc(r.p.name)}</b><small>${esc(r.p.desc)} · ${r.p.from} – ${r.p.to}</small></td>
      <td><div class="toolrow">${r.chips.length ? r.chips.map(c => `<span class="toolchip ${c.v}">${SRC_KO[c.k]}${c.n ? ` · ${c.n}개` : c.v === "warn" ? " · 범위 미선택" : ""}</span>`).join("") : `<span class="dimtxt">연동 전</span>`}</div></td>
      <td class="c">${r.warnN ? badge("범위 미선택 " + r.warnN, "orange") : r.okN ? badge("수집 중 · " + r.okN + "개", "green") : badge("연동 전", "gray")}</td>
      <td class="c"><code>${r.chips.length ? r.sync : "—"}</code></td><td><a class="btn" href="#/projects/${r.p.id}/connect">관리</a></td></tr>`).join("") : `<tr><td colspan="5" class="dimtxt">검색 결과가 없습니다</td></tr>`}
    </tbody></table></section>
  <section class="card"><details class="hist"><summary>데이터 접근 기록 ${ACCESS_LOG.length + STORE.history.filter(h => h.type === "연결" || h.type === "첨부").length}건</summary><ul class="list">${ACCESS_LOG.map(x => `<li><code>${x.at}</code> ${pill(x.kind)} ${esc(x.text)}</li>`).join("")}${STORE.history.filter(h => h.type === "연결" || h.type === "첨부").map(h => `<li><code>${h.at}</code> ${pill(h.type)} ${esc(h.text)}</li>`).join("")}</ul></details></section>`;
};

/* 권한 관리 — 역할 권한 설정 + 구성원(관리자 · 평가자만) */
const CAPS = [
  { id:"proj", name:"프로젝트 만들기 · 참여자 · 기간 설정" }, { id:"scope", name:"연동 범위 고르기 · 해제" }, { id:"cutoff", name:"분석 기준일 정하기" },
  { id:"request", name:"틀린 기록에 정정 요청" }, { id:"final", name:"검토 완료 누르기" }, { id:"conclude", name:"평가자 결론 한 줄 쓰기" },
  { id:"report", name:"결과 보고서 열람 · 인쇄" }, { id:"log", name:"데이터 접근 기록 열람" }, { id:"rule", name:"판정 규칙 버전 · 공식 기록 형식 관리" } ];
const CAP_DEFAULT = { admin:{ proj:1, scope:1, cutoff:1, request:0, final:0, conclude:0, report:1, log:1, rule:1 }, evaluator:{ proj:0, scope:0, cutoff:1, request:1, final:1, conclude:1, report:1, log:0, rule:0 } };
const CAP_LOCK = { admin:{ final:"관리자는 평가하지 않습니다", conclude:"관리자는 평가하지 않습니다" }, evaluator:{ rule:"규칙은 관리자만", proj:"프로젝트 설정은 관리자만" } };
const NEVER_CAPS = ["점수 · 순위 · 등급 보기 (존재하지 않음)", "개인 메시지 · 비공개 채널 수집 허용", "기록 · 이력 삭제", "승진 · 보상 자동 결정"];
const companyOf = () => { if (!STORE.company) STORE.company = Object.fromEntries(TOOL_ORDER.map(t => [t, { connected:true, at:"2026.07.01", by:"관리자" }])); return STORE.company; };
const capsOf = () => { STORE.caps = STORE.caps || JSON.parse(JSON.stringify(CAP_DEFAULT)); return STORE.caps; };
const staffOf = () => { if (STORE.staff) STORE.staff.forEach(m => { if (!Array.isArray(m.projects)) { const s = String(m.projects || ""); m.all = s === "전체" || !!m.all; m.projects = PROJECTS.filter(p => s.split(" · ").some(n => n && p.name.includes(n))).map(p => p.id); } if (typeof m.all !== "boolean") m.all = m.role === "admin"; }); if (!STORE.staff) STORE.staff = MEMBERS_TABLE.filter(m => m.roleKo !== "평가 대상자").map(m => ({ user:m.user, role:m.roleKo === "관리자" ? "admin" : "evaluator", all: m.projects === "전체", projects: PROJECTS.filter(p => m.projects.split(" · ").some(n => p.name.includes(n))).map(p => p.id), since:m.since })); return STORE.staff; };
const projCell = (m, i) => { const openP = STORE._projpick === i; const names = m.all ? ["전체"] : m.projects.map(id => PROJ[id] ? PROJ[id].name : id);
  return `<div class="pcell"><div class="pchips">${names.length ? names.map(n => `<span class="badge gray nodot pchip" title="${esc(n)}">${esc(n)}</span>`).join("") : "<span class='dimtxt'>없음</span>"}</div><button type="button" class="btn small paddbtn" data-act="projpick" data-i="${i}">${openP ? "닫기" : "+ 프로젝트 추가"}</button>
    ${openP ? `<div class="ppop"><label><input type="checkbox" data-act="staff-all" data-i="${i}" ${m.all ? "checked" : ""}> <b>전체 프로젝트</b></label>${PROJECTS.map(p => `<label class="${m.all ? "off" : ""}"><input type="checkbox" data-act="staff-projs" data-i="${i}" data-pid="${p.id}" ${m.projects.includes(p.id) ? "checked" : ""} ${m.all ? "disabled" : ""}> ${esc(p.name)} <small class="dimtxt">${p.from} – ${p.to}</small></label>`).join("")}</div>` : ""}</div>`; };
function staffPicker(q) {
  q = (q || "").trim().toLowerCase(); if (!q) return "";
  const cur = new Set(staffOf().map(s => s.user));
  const found = Object.values(USERS).filter(u => u.id !== "u_admin" && !cur.has(u.id) && (u.name + u.title + (u.team || "")).toLowerCase().includes(q)).slice(0, 6);
  return found.length ? found.map(u => `<div class="pres"><span class="person">${avatar(u.name, 24)}<span><b>${u.name}</b><small>${u.title}${u.team ? " · " + u.team : ""}</small></span></span><span class="inline right"><button type="button" class="btn small" data-act="staff-add" data-id="${u.id}" data-role="admin">관리자</button><button type="button" class="btn small primary" data-act="staff-add" data-id="${u.id}" data-role="evaluator">평가자</button></span></div>`).join("") : `<div class="dimtxt" style="padding:8px">"${esc(q)}"에 맞는 사람이 없습니다</div>`;
}
views.permissions = () => {
  const caps = capsOf(); const staff = staffOf();
  return `
  <div class="pagehead"><div><h1>권한 관리</h1></div></div>
  <div class="grid2 permgrid">
    <section class="card"><h3>역할 권한</h3>
      <table class="table caps"><thead><tr><th>할 수 있는 일</th><th>관리자</th><th>평가자</th></tr></thead><tbody>
      ${CAPS.map(c => `<tr><td>${c.name}</td>${["admin","evaluator"].map(r => { const lock = CAP_LOCK[r][c.id]; return `<td><label class="sw ${lock ? "lock" : ""}" title="${lock ? esc(lock) : ""}"><input type="checkbox" data-act="cap" data-r="${r}" data-c="${c.id}" ${caps[r][c.id] ? "checked" : ""} ${lock ? "disabled" : ""}><span></span></label></td>`; }).join("")}</tr>`).join("")}
      </tbody></table>
      <div class="lbl" style="margin-top:14px">어느 역할도 할 수 없는 것</div><ul class="list never">${NEVER_CAPS.map(n => `<li>✗ ${esc(n)}</li>`).join("")}</ul>
      </section>
    <section class="card"><h3>구성원 — 관리자 · 평가자 ${badge(staff.length + "명", "gray")}</h3>
      <input id="sq" class="search" placeholder="이름 · 직무로 사내 계정 검색해 추가" value="${esc(STORE._sq || "")}" style="width:100%;margin-bottom:8px"><div id="spick" class="spick">${staffPicker(STORE._sq)}</div>
      <table class="table stafftbl"><thead><tr><th>이름</th><th>역할</th><th>담당 프로젝트 (여러 개)</th><th>등록일</th><th></th></tr></thead><tbody>
      ${staff.map((m, i) => { const u = USERS[m.user]; return `<tr><td><span class="person">${avatar(u.name)}<span><b>${u.name}</b><small>${u.title}</small></span></span></td>
        <td><select data-act="staff-role" data-i="${i}" ${m.user === "u_admin" ? "disabled" : ""}><option value="admin" ${m.role === "admin" ? "selected" : ""}>관리자</option><option value="evaluator" ${m.role === "evaluator" ? "selected" : ""}>평가자</option></select></td>
        <td>${m.role === "admin" ? "<span class='dimtxt'>전체</span>" : projCell(m, i)}</td>
        <td><code>${m.since}</code></td><td>${m.user === "u_admin" ? "" : `<button class="link" data-act="staff-remove" data-i="${i}">해제</button>`}</td></tr>`; }).join("")}
      </tbody></table>
      </section>
  </div>`;
};

/* 설정 */
views.settings = () => `
  <div class="pagehead"><div><h1>설정</h1></div></div>
  <div class="grid2">
    <section class="card"><div class="dhead"><h3>평가기간</h3><button class="btn small" data-act="period-add">+ 새 평가기간</button></div><ul class="kv">${Object.values(PERIODS).concat(STORE.periods || []).map(p => `<li><span>${esc(p.name)}</span><b>${p.start} – ${p.end} · ${p.type} ${p.locked ? badge("잠금 " + p.snapshotAt, "gray") : badge("열림", "teal")}</b></li>`).join("")}</ul></section>
    <section class="card"><h3>기준 스냅샷 · 판정 규칙</h3><ul class="kv"><li><span>적용일</span><b>${RULE_INFO.at} <span class="dimtxt">(이전 ${RULE_INFO.prev})</span></b></li><li><span>판정 규칙</span><b>세 질문 → 증거 있음 · 약함 · 없음. 세 숫자는 합치지 않음</b></li><li><span>상태 어휘</span><b>자료 부족 · 만드는 중 · 결과 전 · 끝남 + 현재 상태 꼬리표(만듦 · 결과)</b></li><li><span>공식 기록 형식</span><b>${RULE_INFO.formats.map(esc).join("<br>")}</b></li><li><span>제외</span><b>중복 · 승인 답장 · 개인 메시지</b></li></ul></section>
    <section class="card"><h3>데이터 환경 — 관리자는 기여를 평가하지 않습니다</h3><ul class="kv"><li><span>허용된 소스</span><b>${RULE_INFO.sources}</b></li><li><span>개인 메시지</span><b>${RULE_INFO.dm}</b></li><li><span>원문 접근</span><b>${RULE_INFO.raw}</b></li><li><span>마지막 동기화</span><b><code>${RULE_INFO.sync}</code></b></li><li><span>삭제</span><b>${RULE_INFO.del}</b></li></ul></section>
    <section class="card"><h3>알림</h3><ul class="kv">${[["req","자료 요청","대상자에게 즉시 · 3일 뒤 다시"],["final","검토 완료","대상자 · 관리자에게"],["cutoff","기준일 7일 전","평가자에게"],["report","결과 보고서 생성","대상자 · 평가자에게"]].map(n => `<li><span>${n[1]}</span><b class="inline"><label class="sw"><input type="checkbox" data-act="notif" data-k="${n[0]}" ${(STORE.notif || {})[n[0]] === false ? "" : "checked"}><span></span></label> ${n[2]}</b></li>`).join("")}</ul></section>
  </div>
  <p class="dimtxt" style="margin-top:14px"><button class="link" data-act="reset">저장 데이터 초기화</button></p>`;

/* ═══════════ 라우터 · 렌더 ═══════════ */
const NAV = [["#/criteria","평가 기준","01"],["#/integrations","데이터 연동 관리","02"],["#/permissions","권한 관리","03"],null,["#/projects","프로젝트","04"],["#/evaluation","평가","05"],["#/my","내 기여","06"],["#/requests","자료 요청","07"],["#/settings","설정","08"]];
const CRUMB = { newProject:"새 프로젝트", projects:"프로젝트", project:"프로젝트", connect:"정보 연결", evaluation:"평가", evalProject:"평가", evalPerson:"평가", report:"결과 보고서", my:"내 기여", requests:"자료 요청", criteria:"평가 기준", integrations:"데이터 연동 관리", permissions:"권한 관리", settings:"설정" };

function route() {
  const h = location.hash || "#/projects"; const [path, qs] = h.slice(1).split("?"); const params = new URLSearchParams(qs || ""); const seg = path.split("/").filter(Boolean);
  if (seg[0] === "projects" && seg[1] === "new") return { v:"newProject", params };
  if (seg[0] === "projects" && seg[1] && seg[2] === "connect") return { v:"connect", pid:seg[1], params };
  if (seg[0] === "projects" && seg[1]) return { v:"project", pid:seg[1], params };
  if (seg[0] === "evaluation" && seg[1] && seg[2] === "person") return { v:"evalPerson", pid:seg[1], params };
  if (seg[0] === "evaluation" && seg[1]) return { v:"evalProject", pid:seg[1], params };
  if (seg[0] === "report" && seg[1]) return { v:"report", pid:seg[1], params };
  if (seg[0] === "my") { if (params.get("pid")) STORE._mypid = params.get("pid"); return { v:"my", params }; }
  if (seg[0] === "requests") { STORE._rf = params.get("f") || "open"; return { v:"requests", params }; }
  return { v: views[seg[0]] ? seg[0] : "projects", params };
}

/* 로그인 — 첫 진입. 역할 버튼으로 해당 담당자 화면으로 */
function renderLogin() {
  $("#app").className = "app loginwrap"; $("#app").innerHTML = `<div class="login">
    <div class="login-side"><img src="brand.png" alt="보이는 업무가, 더 나은 기회를 만듭니다 — 말보다 일로, 성과는 일로."></div>
    <div class="login-main"><div class="login-box">
    <div class="brand big"><span class="logo"><i class="sq"></i><i class="dot"></i><i class="tri"></i></span><span class="brand-text"><b>일로</b><small>ILRO</small></span></div>
    <p class="login-sub">회사 계정으로 로그인하세요.</p>
    <form class="login-form" data-act="login"><label>회사 이메일<input type="email" name="email" placeholder="you@ilro-company.com" required autocomplete="username"></label><label>비밀번호<input type="password" name="pw" required autocomplete="current-password"></label><div class="login-err" id="login-err"></div><button class="btn primary big">로그인</button></form>
    <div class="login-roles"><span class="dimtxt">역할을 골라 바로 들어가기</span><div>${[["admin","관리자","프로젝트 · 연동 · 권한"],["evaluator","평가자","틀린 기록만 요청 · 결론"],["employee","대상자","내 기여 · 사실관계 확인"]].map(r => `<button type="button" class="rolecard" data-act="login-as" data-v="${r[0]}"><b>${r[1]}</b><small>${r[2]}</small></button>`).join("")}</div></div>
    </div></div></div>`;
}
function render() {
  if (!STORE.loggedIn) { renderLogin(); return; }
  $("#app").className = "app";
  const r = route();

  if (roleIs("employee") && ["criteria","integrations","permissions","settings"].includes(r.v) === false && ["evaluation"].includes(r.v)) { /* 대상자는 평가 목록 대신 내 기여 */ location.hash = "#/my"; return; }
  const me = meUser();
  const ROUTE_ROLE = { admin:["criteria","integrations","permissions","projects","project","newProject","connect","evaluation","evalProject","evalPerson","report","settings"], evaluator:["criteria","projects","project","evaluation","evalProject","evalPerson","report","requests"], employee:["criteria","projects","project","my","requests","report"] };
  if (!(ROUTE_ROLE[STORE.role] || ROUTE_ROLE.admin).includes(r.v)) { location.hash = STORE.role === "employee" ? "#/my" : "#/projects"; return; }
  const active = r.v === "project" || r.v === "connect" ? "#/projects" : r.v === "evalProject" || r.v === "evalPerson" || r.v === "report" ? (roleIs("employee") ? "#/my" : "#/evaluation") : "#/" + r.v;
  const NAV_BY_ROLE = { admin:["#/criteria","#/integrations","#/permissions","#/projects","#/evaluation","#/settings"], evaluator:["#/criteria","#/projects","#/evaluation","#/requests"], employee:["#/criteria","#/projects","#/my","#/requests"] };
  const allowed = NAV_BY_ROLE[STORE.role] || NAV_BY_ROLE.admin;
  const navHtml = NAV.filter(n => !n || allowed.includes(n[0])).map(n => n ? `<a href="${n[0]}" class="${active === n[0] ? "on" : ""}"><span class="k">${n[2]}</span>${n[1]}</a>` : `<div class="sec">일반</div>`).join("");
  $("#app").innerHTML = `
  <aside class="sidebar"><a class="brand" href="#/projects"><span class="logo"><i class="sq"></i><i class="dot"></i><i class="tri"></i></span><span class="brand-text"><b>일로</b><small>ILRO</small></span></a>
    <nav class="nav"><div class="sec">관리</div>${navHtml}</nav>
    ${roleIs("admin") ? `<div class="navfoot"><a class="btn primary ${r.v === "newProject" ? "on" : ""}" href="#/projects/new">+ 새 프로젝트</a></div>` : ""}
    <div class="me">${avatar(me.name, 30)}<span><b>${esc(me.name)}</b><small>${esc(me.title)} · ${ROLE_KO[STORE.role]}</small></span></div><div class="mefoot"><button class="btn small block" data-act="logout">로그아웃</button></div></aside>
  <main class="main"><header class="topbar"><span class="crumb">${CRUMB[r.v] || ""}${r.pid && PROJ[r.pid] ? ` <span class="dimtxt">›</span> ${esc(PROJ[r.pid].name)}` : ""}</span>
    <span class="roles">${["admin","evaluator","employee"].map(x => `<button class="rbtn ${STORE.role === x ? "on" : ""}" data-act="role" data-v="${x}">${ROLE_KO[x]}</button>`).join("")}</span></header>
    <div class="content">${views[r.v](r.pid, r.params)}</div></main>
  ${STORE._modalGen ? (typeof STORE._modalGen === "object" ? integSetupModal(STORE._modalGen.key) : conclModal(STORE._modalGen)) : (STORE._modal || "")}`;
  if (r.v === "projects" && !STORE.heroSeen) { STORE.heroSeen = true; save(); }
}

/* ═══════════ 이벤트 ═══════════ */
document.addEventListener("click", ev => {
  if (ev.target.closest("a[target=_blank]")) return; /* 원문 링크는 그대로 연다 */
  const a = ev.target.closest("[data-act]"); const row = ev.target.closest("tr.row[data-href]");
  if (!a && row && !ev.target.closest("a,button")) { location.hash = row.dataset.href; return; }
  if (!a) return;
  const act = a.dataset.act, d = a.dataset;
  if (act === "close" && a.classList.contains("modal-bg")) return; /* 바탕 클릭으로는 닫지 않음 — 닫기 버튼만 */
  switch (act) {
    case "ai-run": aiRun(d.pid, d.b); break;
    case "ai-stop": if (AI.ctl) AI.ctl.abort(); break;
    case "print": window.print(); break;
    case "period-add": STORE._modal = `<div class="modal-bg" data-act="close"><div class="modal" data-stop><div class="mh"><div><b>새 평가기간</b><small>평가가 시작되면 잠기고 끝날 때까지 바꿀 수 없습니다</small></div><button class="x" data-act="close">×</button></div>
      <form class="form" data-act="period-save"><label class="span2">이름<input name="name" required placeholder="예: 2027 상반기 중간"></label><label>시작일<input type="date" name="start" required value="2027-01-01"></label><label>종료일<input type="date" name="end" required value="2027-06-30"></label><label>유형<select name="type"><option>중간</option><option>최종</option></select></label><div class="span2 right"><button type="button" class="btn" data-act="close">취소</button> <button class="btn primary">만들기</button></div></form></div></div>`; render(); break;
    case "co-on": companyOf()[d.t] = { connected:true, at: now().slice(0, 10), by: meUser().name }; log("연결", `${meUser().name} · ${SRC_KO[d.t]} 회사 앱 설치 · 연결 (DM 권한 요청 안 함)`); save(); render(); break;
    case "co-off": companyOf()[d.t] = { connected:false }; log("연결", `${meUser().name} · ${SRC_KO[d.t]} 회사 앱 해제 — 기록은 유지`); save(); render(); break;
    case "projpick": STORE._projpick = STORE._projpick === +d.i ? null : +d.i; render(); break;
    case "staff-add": { const u = USERS[d.id]; staffOf().push({ user:d.id, role:d.role, all:d.role === "admin", projects:[], since: now().slice(0, 10) }); STORE._projpick = d.role === "admin" ? null : staffOf().length - 1; STORE._sq = ""; log("권한", `${meUser().name} · ${u.name}에게 ${d.role === "admin" ? "관리자" : "평가자"} 역할 부여`); save(); render(); break; }
    case "staff-remove": { const m = staffOf()[+d.i]; log("권한", `${meUser().name} · ${USERS[m.user].name} ${m.role === "admin" ? "관리자" : "평가자"} 역할 해제`); staffOf().splice(+d.i, 1); save(); render(); break; }
    case "ctab": ev.preventDefault(); STORE._ct = d.v; render(); break;
    case "ckind": ev.preventDefault(); STORE._ck = d.v; STORE._cmore = false; render(); break;
    case "cmore": STORE._cmore = !STORE._cmore; render(); break;
    case "bmore": STORE._bmore = !STORE._bmore; render(); break;
    case "login-as": STORE.role = d.v; STORE.loggedIn = true; save(); location.hash = d.v === "employee" ? "#/my" : "#/projects"; render(); break;
    case "logout": STORE.loggedIn = false; save(); location.hash = "#/"; render(); break;
    case "hero-close": STORE.heroHidden = true; save(); render(); break;
    case "stat": STORE._fr = STORE._fr === d.v ? "" : d.v; render(); break;
    case "role": STORE.role = d.v; save(); render(); break;
    case "toggle": STORE._open = STORE._open || {}; STORE._open[d.b] = !STORE._open[d.b]; render(); break;
    case "entry": STORE._modal = entryModal(d.pid, d.e); render(); break;
    case "flow": STORE._modal = flowModal(d.pid, d.b); render(); break;
    case "close": STORE._modal = ""; STORE._modalGen = null; render(); break;
    case "concl": STORE._modalGen = d.pid; STORE._cmore = false; render(); break;
    case "integ-setup": if (d.key === "draft") syncDraft(); STORE._isetup = { t:"slack", q:"" }; STORE._modalGen = { kind:"integ", key:d.key }; render(); break;
    case "isetup-tab": ev.preventDefault(); STORE._isetup = Object.assign(STORE._isetup || {}, { t:d.v, q:"" }); render(); break;
    case "final": STORE.reviews[d.pid] = STORE.reviews[d.pid] || {}; STORE.reviews[d.pid][d.name] = { by: meUser().name, at: now() }; log("검토 완료", `${meUser().name} · ${d.name} 검토 완료 (열린 요청 0건)`, d.pid); render(); break;
    case "reopen": if (STORE.reviews[d.pid]) delete STORE.reviews[d.pid][d.name]; log("다시 열기", `${meUser().name} · ${d.name} 검토 다시 열기`, d.pid); render(); break;
    case "resolve": { const r = STORE.requests.find(x => x.id === d.id); if (r) { const sel = $(`[data-result="${r.id}"]`); r.result = sel ? sel.value : "수용"; r.status = "resolved"; r.resolvedAt = now(); log("요청 해결", `${r.to} 요청 해결 — ${r.type} → ${r.result}: ${r.after}`, r.project); } render(); break; }
    case "bedit": STORE._modal = bundleEditModal(d.pid, d.b); render(); break;
    case "cutoff-now": { const v = $("#cutoff").value; if (v) { const [y, m, dd] = v.split("-"); STORE.cutoff[d.pid] = `${y}.${m}.${dd}`; log("기준일", `중간 분석 기준일 ${STORE.cutoff[d.pid]}`, d.pid); } render(); break; }
    case "cutoff-final": delete STORE.cutoff[d.pid]; log("기준일", "종료 후 최종 분석 (전체 기간)", d.pid); render(); break;
    case "detach": STORE.attachments[d.pid].splice(+d.i, 1); save(); render(); break;
    case "connect-done": { const tools = integToTools(integOf(d.pid)); const ok = Object.values(tools).some(v => v === "ok") || (STORE.attachments[d.pid] || []).length; if (!ok) { alert("도구 1개 이상 연결해 범위를 고르거나, 파일 1개 이상 첨부해 주세요."); return; } PROJ[d.pid].tools = tools; STORE.toolsOverride[d.pid] = tools; const n = Object.values(tools).filter(v => v === "ok").length; PROJ[d.pid].conn = Object.values(tools).some(v => v === "warn") ? { text:"연결 확인 필요", tone:"orange" } : { text:n + "개 연결됨", tone:"green" }; log("연결", `${meUser().name} · ${PROJ[d.pid].name} 연결 완료 — ${Object.keys(tools).map(t => SRC_KO[t]).join(" · ")} · 개인 DM 수집 안 함`, d.pid); save(); location.hash = "#/projects/" + d.pid; break; }
    case "integ-connect": if (d.key === "draft") syncDraft(); STORE._modal = integModal(d.key, d.t); render(); break;
    case "integ-allow": { const integ = integOf(d.key); integ[d.t] = { connected:true, scope:[], at: now().slice(0, 10) }; STORE._iopen = STORE._iopen || {}; STORE._iopen[d.key + d.t] = true; STORE._modal = ""; if (d.key === "draft") syncDraft(); else log("연결", `${meUser().name} · ${SRC_KO[d.t]} 연결 (${CATALOG[d.t].account}) · 개인 메시지 권한 요청 안 함`, d.key); save(); render(); break; }
    case "integ-disconnect": { const integ = integOf(d.key); delete integ[d.t]; if (d.key === "draft") syncDraft(); else log("연결", `${meUser().name} · ${SRC_KO[d.t]} 연결 해제`, d.key); save(); render(); break; }
    case "integ-scope-toggle": { STORE._iopen = STORE._iopen || {}; STORE._iopen[d.key + d.t] = !STORE._iopen[d.key + d.t]; if (d.key === "draft") syncDraft(); render(); break; }
    case "draft-cancel": STORE.draft = null; save(); break;
    case "draft-add": syncDraft(); STORE.draft.members.push(d.id); save(); render(); break;
    case "draft-remove": syncDraft(); STORE.draft.members = STORE.draft.members.filter(x => x !== d.id); delete STORE.draft.roles[d.id]; save(); render(); break;
    case "tree-toggle": STORE._tree = STORE._tree || {}; STORE._tree[d.k] = !STORE._tree[d.k]; { const r = $("#ptree"); if (r) r.innerHTML = participantTree(STORE._pq); } break;
    case "invite": log("연결 요청", `${meUser().name} · ${PROJ[d.pid].name} 참여자 ${PROJ[d.pid].members.length}명에게 정보 연결 요청`, d.pid); STORE._created = null; alert(PROJ[d.pid].members.map(m => USERS[m].name).join(", ") + " 님에게 정보 연결 요청을 보냈습니다."); render(); break;
    case "reset": localStorage.removeItem("ilro.v4"); location.reload(); break;
  }
});
document.addEventListener("change", ev => { const i = ev.target; if (i.type !== "file" || i.dataset.act !== "pickfile") return; const form = i.closest("form"); const el = form && form.querySelector(".filelist"); if (el) el.textContent = [...i.files].map(f => f.name).join(" · ") || "첨부 없음"; });
document.addEventListener("submit", ev => {
  const f = ev.target.closest("form[data-act]"); if (!f) return; ev.preventDefault(); const fd = new FormData(f); const d = f.dataset;
  if (d.act === "request") { const r = { id:"rq" + Date.now(), project:d.pid, entry:d.e, bundle:d.b, to:d.to, from:meUser().name, type:fd.get("type"), before:fd.get("before"), after:fd.get("after"), reason:fd.get("reason"), link:fd.get("link"), at:now(), status:"requested" }; STORE.requests.push(r); log("요청", `${r.from} → ${r.to} · ${r.type}: ${r.after} (${r.reason})`, d.pid); STORE._modal = ""; render(); }
  if (d.act === "draft-create") { syncDraft(); createFromDraft(); return; }
  if (d.act === "login") { const ok = String(fd.get("email") || "").trim().toLowerCase() === "illo2026@ilro-company.com" && fd.get("pw") === "illo"; if (!ok) { const er = $("#login-err"); if (er) er.textContent = "이메일 또는 비밀번호가 맞지 않습니다."; return; } STORE.loggedIn = true; STORE.role = STORE.role || "admin"; save(); location.hash = STORE.role === "employee" ? "#/my" : "#/projects"; render(); return; }
  if (d.act === "period-save") { STORE.periods = STORE.periods || []; const f2 = s => String(s).replace(/-/g, "."); STORE.periods.push({ id:"per_" + Date.now(), name:fd.get("name"), start:f2(fd.get("start")), end:f2(fd.get("end")), type:fd.get("type"), locked:false }); log("설정", `${meUser().name} · 평가기간 추가 — ${fd.get("name")}`); STORE._modal = ""; save(); render(); }
  if (d.act === "conclude") { STORE.conclusions = STORE.conclusions || {}; STORE.conclusions[d.pid + "|" + d.name] = { text: fd.get("text"), cite: fd.get("cite"), by: meUser().name, at: now() }; log("결론", `${meUser().name} · ${d.name} 결론 : ${fd.get("text")} (인용 ${fd.get("cite")})`, d.pid); render(); }
  if (d.act === "selfcheck") { STORE.selfChecks[d.e] = { choice:fd.get("choice"), note:fd.get("note"), at:now() }; log("본인 확인", `${meUser().name} · ${fd.get("choice")}${fd.get("note") ? " — " + fd.get("note") : ""}`, d.pid); STORE._modal = ""; render(); }
  if (d.act === "bedit-save") { const b = bundleById(d.pid, d.b); const x = { pid:d.pid, bid:d.b, type:fd.get("type"), target:fd.get("target"), reason:fd.get("reason"), link:fd.get("link"), by:meUser().name, at:now(), before:`AI 묶음 · 기록 ${b.entries.filter(e => !e.dup && !e.skip).length}건` }; STORE.bundleEdits.push(x); log("묶음 수정", `${x.by} · ${b.title} — ${x.type}${x.target ? " → " + x.target : ""} (${x.reason})`, d.pid); STORE._modal = ""; render(); }
  if (d.act === "answer") { const r = STORE.requests.find(x => x.id === d.id); if (r) { const files = [...(f.querySelector("input[type=file]").files || [])].map(x => x.name); r.answer = fd.get("answer"); r.answerLink = String(fd.get("link") || "").trim(); r.answerFile = files.join(", "); r.status = "answered"; r.answeredAt = now(); if (STORE._pick) delete STORE._pick[r.id]; log("설명 추가", `${r.to} · 설명 추가${r.answerFile ? " · 자료 " + r.answerFile : ""}${r.answerLink ? " · 링크" : ""}`, r.project); } render(); }
});
document.addEventListener("input", ev => {
  const t = ev.target;
  if (t.id === "cq") { STORE._cq = t.value; STORE._cmore = false; const r = $(".concl-p"); if (r) { const tmp = document.createElement("div"); tmp.innerHTML = projectConclusion(location.hash.split("/")[2].split("?")[0]); r.innerHTML = tmp.firstElementChild.innerHTML; const i = $("#cq"); if (i) { i.focus(); i.setSelectionRange(i.value.length, i.value.length); } } }
  if (t.id === "isq") { STORE._isetup = Object.assign(STORE._isetup || {}, { q:t.value }); const r = $("#isetup-list"); if (r) { const tmp = document.createElement("div"); tmp.innerHTML = integSetupModal(STORE._modalGen.key); r.innerHTML = tmp.querySelector("#isetup-list").innerHTML; } }
  if (t.id === "sq") { STORE._sq = t.value; const r = $("#spick"); if (r) r.innerHTML = staffPicker(t.value); }
  if (t.id === "iq") { STORE._iq = t.value; const tb = $("#irows"); if (tb) { const tmp = document.createElement("div"); tmp.innerHTML = views.integrations(); tb.innerHTML = tmp.querySelector("#irows").innerHTML; $("#icount").innerHTML = tmp.querySelector("#icount").innerHTML; } }
  if (t.id === "q") { STORE._q = t.value; const tb = $("#rows"); if (tb) { const tmp = document.createElement("div"); tmp.innerHTML = views.projects(); tb.innerHTML = tmp.querySelector("#rows").innerHTML; $(".count").innerHTML = tmp.querySelector(".count").innerHTML; } }
  if (t.id === "f-period") { STORE._fp = t.value; render(); } if (t.id === "f-status") { STORE._fs = t.value; render(); } if (t.id === "f-review") { STORE._fr = t.value; render(); }
  if (t.id === "sort") { STORE._sort = t.value; render(); }
  if (t.id === "pq") { STORE._pq = t.value; const r = $("#ptree"); if (r) r.innerHTML = participantTree(t.value); }
});
document.addEventListener("change", ev => {
  const t = ev.target;
  if (t.dataset.act === "notif") { STORE.notif = STORE.notif || {}; STORE.notif[t.dataset.k] = t.checked; save(); }
  if (t.dataset.act === "cap") { capsOf()[t.dataset.r][t.dataset.c] = t.checked ? 1 : 0; log("권한", `${meUser().name} · ${t.dataset.r === "admin" ? "관리자" : "평가자"} — ${CAPS.find(c => c.id === t.dataset.c).name} ${t.checked ? "허용" : "해제"}`); save(); }
  if (t.dataset.act === "staff-role") { const m = staffOf()[+t.dataset.i]; m.role = t.value; if (m.role === "admin") { m.all = true; } save(); render(); }
  if (t.dataset.act === "staff-all") { staffOf()[+t.dataset.i].all = t.checked; save(); render(); }
  if (t.dataset.act === "staff-projs") { const m = staffOf()[+t.dataset.i]; const s = new Set(m.projects); t.checked ? s.add(t.dataset.pid) : s.delete(t.dataset.pid); m.projects = [...s]; save(); render(); }
  if (t.dataset.act === "draft-role") { STORE.draft.roles[t.dataset.id] = t.value; save(); }
  if (t.dataset.act === "isetup-scope") { const integ = integOf(t.dataset.key); if (!integ[t.dataset.t] || !integ[t.dataset.t].connected) integ[t.dataset.t] = { connected:true, scope:[], at: now().slice(0, 10) }; const it = integ[t.dataset.t]; const s = new Set(it.scope || []); t.checked ? s.add(t.dataset.id) : s.delete(t.dataset.id); it.scope = [...s]; if (t.dataset.key === "draft") syncDraft(); else log("연결", `${meUser().name} · ${SRC_KO[t.dataset.t]} ${t.dataset.id} ${t.checked ? "수집 범위에 추가" : "범위에서 제외"}`, t.dataset.key); save(); render(); }
  if (t.dataset.act === "integ-scope") { const integ = integOf(t.dataset.key); const it = integ[t.dataset.t]; if (it) { const s = new Set(it.scope || []); t.checked ? s.add(t.dataset.id) : s.delete(t.dataset.id); it.scope = [...s]; const head = t.closest(".iitem").querySelector(".badge"); const [st, tone] = integStatus(it); head.className = "badge " + tone; head.textContent = st; save(); } } if (t.dataset.act === "attach") { const pid = t.dataset.pid; STORE.attachments[pid] = STORE.attachments[pid] || []; [...t.files].forEach(f => { STORE.attachments[pid].push(f.name); log("첨부", `${meUser().name} · ${f.name} 업로드 → 기록 생성`, pid); }); render(); }
});
window.addEventListener("hashchange", () => { STORE._modal = ""; STORE._modalGen = null; render(); });
render();
