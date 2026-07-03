const NOTION_API = 'https://api.notion.com/v1';
const NOTION_VERSION = '2022-06-28';

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

async function notionFetch(env, path, method, body) {
  const res = await fetch(`${NOTION_API}${path}`, {
    method,
    headers: {
      'Authorization': `Bearer ${env.NOTION_TOKEN}`,
      'Notion-Version': NOTION_VERSION,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  return new Response(JSON.stringify(data), {
    status: res.status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders() },
  });
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders() });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    try {
      // 데이터베이스 조회: POST /databases/:id/query
      const queryMatch = path.match(/^\/databases\/([^/]+)\/query$/);
      if (queryMatch && request.method === 'POST') {
        const body = await request.json().catch(() => ({}));
        return notionFetch(env, `/databases/${queryMatch[1]}/query`, 'POST', body);
      }

      // 페이지 생성: POST /pages
      if (path === '/pages' && request.method === 'POST') {
        const body = await request.json();
        return notionFetch(env, '/pages', 'POST', body);
      }

      // 페이지 조회: GET /pages/:id
      const pageMatch = path.match(/^\/pages\/([^/]+)$/);
      if (pageMatch && request.method === 'GET') {
        return notionFetch(env, `/pages/${pageMatch[1]}`, 'GET');
      }

      // 페이지 수정: PATCH /pages/:id
      if (pageMatch && request.method === 'PATCH') {
        const body = await request.json();
        return notionFetch(env, `/pages/${pageMatch[1]}`, 'PATCH', body);
      }

      return new Response(JSON.stringify({ error: 'Not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', ...corsHeaders() },
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders() },
      });
    }
  },
};
