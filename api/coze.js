/**
 * Vercel 服务端函数：代理调用 Coze 工作流（隐藏 PAT，避免暴露在前端）
 * 部署后前端只需 POST /api/coze  { track, date }
 *
 * 环境变量（在 Vercel 项目设置里配置）：
 *   COZE_PAT           你的 Coze 个人访问令牌
 *   COZE_WORKFLOW_ID   你建好的「找爆款」工作流 ID
 *   COZE_API_BASE      可选，默认 https://api.coze.cn （国内站）
 *                             国际站用 https://api.coze.com
 */
const COZE_API_BASE = process.env.COZE_API_BASE || 'https://api.coze.cn';

function readBody(req) {
  return new Promise((resolve) => {
    let data = '';
    req.on('data', (chunk) => (data += chunk));
    req.on('end', () => resolve(data));
  });
}

function extractReport(raw) {
  // Coze workflow/run 返回的 data 可能是 JSON 字符串，也可能包了一层 {report: "..."}
  let data = raw;
  if (typeof data === 'string') {
    try { data = JSON.parse(data); } catch (e) { return raw; }
  }
  if (data && typeof data === 'object' && data.report) {
    let r = data.report;
    if (typeof r === 'string') {
      try { r = JSON.parse(r); } catch (e) { /* keep string */ }
    }
    return r;
  }
  return data;
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: '只支持 POST' });

  const PAT = process.env.COZE_PAT;
  const WORKFLOW_ID = process.env.COZE_WORKFLOW_ID;
  if (!PAT || !WORKFLOW_ID) {
    return res.status(500).json({ error: 'Coze 未配置：请在环境变量设置 COZE_PAT 与 COZE_WORKFLOW_ID' });
  }

  let body;
  try { body = JSON.parse(await readBody(req) || '{}'); }
  catch (e) { return res.status(400).json({ error: '请求体不是合法 JSON' }); }

  if (!body.track) return res.status(400).json({ error: '缺少 track 参数' });

  try {
    const resp = await fetch(`${COZE_API_BASE}/v1/workflow/run`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${PAT}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        workflow_id: WORKFLOW_ID,
        parameters: { track: body.track, date: body.date || '' },
        is_async: false
      })
    });
    const json = await resp.json();
    if (json.code !== 0) {
      return res.status(500).json({ error: 'Coze 返回错误: ' + (json.msg || JSON.stringify(json)) });
    }
    res.status(200).json({ ok: true, report: extractReport(json.data) });
  } catch (e) {
    res.status(500).json({ error: '调用 Coze 失败: ' + e.message });
  }
};
