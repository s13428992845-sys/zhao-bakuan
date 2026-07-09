/* 找爆款 Web 前端逻辑 */

const PALETTE = ['#ff5e62', '#ff9f43', '#54a0ff', '#5f27cd', '#10ac84', '#ee5253', '#0abde3', '#f368e0'];

const state = {
  report: null,
  tab: 'new',     // 'new' = 新增爆款, 'low' = 低粉爆款
  active: null    // 当前弹窗中的条目
};

const $ = (s) => document.querySelector(s);

function show(el) { el.classList.remove('hidden'); }
function hide(el) { el.classList.add('hidden'); }

/* ---------- 渲染 ---------- */
function render() {
  const r = state.report;
  if (!r) return;

  // 选题分布
  const topicsEl = $('#topics');
  topicsEl.innerHTML = (r.topicTypes || []).map((t, i) => `
    <div class="topic-item">
      <div class="topic-name">${esc(t.name)}</div>
      <div class="topic-bar-wrap">
        <div class="topic-bar" style="width:${t.percent}%;background:${PALETTE[i % PALETTE.length]}"></div>
      </div>
      <div class="topic-percent">${t.percent}%</div>
    </div>`).join('');

  renderList();
}

function currentList() {
  const r = state.report;
  const key = state.tab === 'new' ? 'newViral' : 'lowFanViral';
  return (r[key] || []).map((it, i) => ({ ...it, rank: i + 1, id: (state.tab === 'new' ? 'n' : 'l') + (i + 1) }));
}

/* 封面/头像：有真实图片链接时显示图片，否则用渐变+图标占位 */
const EMOJI_MAP = {
  '酒吧': '🍸', '清吧': '🥃', '酒馆': '🍺', '精酿': '🍻', '夜生活': '🌃',
  '美食': '🍜', '餐厅': '🍽️', '探店': '🍴', '火锅': '🍲', '咖啡': '☕', '奶茶': '🧋',
  '旅游': '🧳', '旅行': '✈️', '攻略': '🗺️', '景点': '🏞️', '酒店': '🏨', '民宿': '🏡', '打卡': '📍',
  '美妆': '💄', '护肤': '🧴', '化妆': '💅', '穿搭': '👗', '时尚': '👜', '减肥': '🏃',
  'AI': '🤖', '自媒体': '📱', '运营': '📊', '剪辑': '🎬', '涨粉': '📈', '创业': '💡'
};

function coverEmoji(it) {
  for (const k in EMOJI_MAP) {
    if ((it.topic && it.topic.indexOf(k) >= 0) || (it.title && it.title.indexOf(k) >= 0)) return EMOJI_MAP[k];
  }
  return it.format === 'video' ? '🎬' : '🖼️';
}

function coverBg(it) {
  const c1 = PALETTE[(it.rank - 1) % PALETTE.length];
  const c2 = PALETTE[it.rank % PALETTE.length];
  return `linear-gradient(135deg, ${c1} 0%, ${c2} 100%)`;
}

function avatarColor(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return PALETTE[Math.abs(hash) % PALETTE.length];
}

const LINK_ICON = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>`;
const HEART_ICON = `<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>`;

function coverFallbackHTML(it) {
  return `<span class="cover-emoji">${coverEmoji(it)}</span>`;
}

function coverCardHTML(it) {
  const img = it.image ? `<img src="${esc(it.image)}" alt="" loading="lazy" onerror="this.parentElement.classList.add('noimg')">` : '';
  const play = it.format === 'video' ? `<div class="cover-play"><span class="play-icon">▶</span><span>视频</span></div>` : '';
  const link = it.sourceUrl ? `<a class="cover-link" href="${esc(it.sourceUrl)}" target="_blank" rel="noopener" aria-label="打开原帖">${LINK_ICON}</a>` : '';
  const rank = `<div class="cover-rank ${it.rank <= 3 ? 'top' : ''}">${it.rank}</div>`;
  return `
    <div class="cover-card ${it.image ? '' : 'noimg'}" style="${it.image ? '' : 'background:' + coverBg(it)}">
      ${img}
      <div class="cover-fallback">${coverFallbackHTML(it)}</div>
      ${rank}
      ${link}
      ${play}
    </div>
  `;
}

function coverModalHTML(it) {
  const img = it.image ? `<img src="${esc(it.image)}" alt="" onerror="this.parentElement.classList.add('noimg')">` : '';
  return `
    <div class="m-cover ${it.image ? '' : 'noimg'}" style="${it.image ? '' : 'background:' + coverBg(it)}">
      ${img}
      <div class="cover-fallback">${coverFallbackHTML(it)}</div>
    </div>
  `;
}

function renderList() {
  const list = currentList();
  $('#tabHint').textContent = state.tab === 'new'
    ? '近一周流量表现最好的 10 条内容'
    : '1000粉以下、靠选题和内容起量的 10 条内容';

  $('#list').innerHTML = list.map((it) => `
    <div class="item" data-id="${it.id}">
      ${coverCardHTML(it)}
      <div class="item-title">${esc(it.title)}</div>
      <div class="item-footer">
        <div class="item-author">
          <div class="item-avatar" style="background:${avatarColor(it.author)}">${it.author.charAt(0)}</div>
          <span class="item-author-name">${esc(it.author)}</span>
        </div>
        <div class="item-likes">${HEART_ICON}<span>${esc(it.heat)}</span></div>
      </div>
    </div>`).join('');

  document.querySelectorAll('#list .item').forEach((el) => {
    el.addEventListener('click', () => openDetail(el.dataset.id));
  });
  document.querySelectorAll('.cover-link').forEach((el) => {
    el.addEventListener('click', (e) => e.stopPropagation());
  });
}

function openDetail(id) {
  const item = currentList().find((x) => x.id === id);
  if (!item) return;
  state.active = item;

  $('#modalBody').innerHTML = `
    ${coverModalHTML(item)}
    <div class="m-head">
      <div class="m-badges">
        <span class="badge badge-${item.format}">${item.format === 'video' ? '视频' : '图文'}</span>
        <span class="m-topic">${esc(item.topic)}</span>
      </div>
      <div class="m-title">${esc(item.title)}</div>
      <div class="m-meta">
        <span class="m-author">${esc(item.author)}</span>
        ${item.fans ? `<span class="m-fans">${esc(item.fans)}粉</span>` : ''}
        <span class="m-heat">🔥 ${esc(item.heat)}</span>
      </div>
    </div>

    <div class="card" style="margin-top:16px">
      <div class="card-title">案例拆解</div>
      ${(item.breakdown || []).map((p) => `
        <div class="breakdown"><div class="dot"></div><div class="para">${esc(p)}</div></div>`).join('')}
    </div>

    <div class="card" style="margin-top:16px">
      <div class="card-title">评论区热议</div>
      ${(item.hotComments || []).map((c) => `
        <div class="comment">
          <div class="comment-user">${esc(c.user)}</div>
          <div class="comment-text">${esc(c.text)}</div>
          <div class="comment-like">👍 ${esc(c.like)}</div>
        </div>`).join('')}
    </div>

    <div class="card" style="margin-top:16px">
      <div class="card-title">选题推荐</div>
      <div class="chips">
        ${(item.topicRecommend || []).map((t) => `<span class="chip">${esc(t)}</span>`).join('')}
      </div>
    </div>

    <button class="copy-btn" id="openBtn">打开原帖 ↗</button>
    <div class="action-tip">Web 端可直接跳转原帖（已新开标签页打开）</div>
  `;

  $('#openBtn').addEventListener('click', () => window.open(item.sourceUrl, '_blank'));
  show($('#modal'));
}

function closeModal() { hide($('#modal')); state.active = null; }
$('#modalClose').addEventListener('click', closeModal);
$('#modal').addEventListener('click', (e) => { if (e.target === $('#modal')) closeModal(); });

/* ---------- 交互 ---------- */
document.querySelectorAll('.tab').forEach((t) => {
  t.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach((x) => x.classList.remove('tab-active'));
    t.classList.add('tab-active');
    state.tab = t.dataset.tab;
    renderList();
  });
});

/* ---------- 数据获取 ---------- */
async function generate() {
  const track = $('#track').value.trim() || '自媒体AI工具';
  const date = $('#date').value.trim();
  hide($('#error'));
  show($('#loading'));
  hide($('#content'));

  try {
    const params = new URLSearchParams(location.search);
    const forceMock = params.has('mock');
    let report;

    // 默认使用内置示例数据，打开网页即可用、无需任何后端。
    // 仅当存在 config.js 且填了 PAT 时，才尝试直连 Coze（失败自动回退示例）。
    if (!forceMock && window.COZE_CONFIG && window.COZE_CONFIG.PAT) {
      try {
        report = await callCoze(track, date);
        setSource(true);
      } catch (e) {
        console.warn('Coze 调用失败，已回退到示例数据：', e);
        report = window.MOCK_REPORT;
        setSource(false);
      }
    } else {
      report = window.MOCK_REPORT;
      setSource(false);
    }

    state.report = report;
    state.tab = 'new';
    document.querySelectorAll('.tab').forEach((x) => x.classList.toggle('tab-active', x.dataset.tab === 'new'));
    render();
    hide($('#loading'));
    show($('#content'));
  } catch (e) {
    hide($('#loading'));
    $('#error').textContent = e.message + '（可在网址后加 ?mock=1 查看示例界面）';
    show($('#error'));
  }
}

function setSource(isLive) {
  const el = $('#sourceTag');
  if (!el) return;
  el.textContent = isLive ? '数据来源：Coze 实时生成' : '数据来源：示例数据（在 config.js 配置后切换为真实数据）';
  el.classList.toggle('live', isLive);
}

/* 可选：直连 Coze（仅个人使用，PAT 会暴露在浏览器中） */
async function callCoze(track, date) {
  const base = (window.COZE_CONFIG.BASE || 'https://api.coze.cn').replace(/\/$/, '');
  const res = await fetch(`${base}/v1/workflow/run`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${window.COZE_CONFIG.PAT}`
    },
    body: JSON.stringify({
      workflow_id: window.COZE_CONFIG.WORKFLOW_ID,
      parameters: { track, date }
    })
  });
  const j = await res.json();
  if (j.code !== 0) throw new Error(j.msg || 'Coze 返回错误');
  const raw = (j.data && j.data.data) ? j.data.data : j.data;
  return typeof raw === 'string' ? JSON.parse(raw) : raw;
}

$('#genBtn').addEventListener('click', generate);

/* ---------- 工具 ---------- */
function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
