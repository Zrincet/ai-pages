/**
 * 阿里云 ESA 边缘函数 - HTML 存储服务
 * 
 * 功能：
 * 1. POST /api/storage - 存储 HTML 到 EdgeKV
 * 2. GET /pages/{uuid} - 读取并返回 HTML 页面
 */

// EdgeKV namespace（需要在 ESA 控制台预先创建）
const NAMESPACE = 'html_pages';

export default {
  async fetch(request) {
    return handleRequest(request);
  }
};

async function handleRequest(request) {
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;

  // CORS 预检请求
  if (method === 'OPTIONS') {
    return handleCORS();
  }

  try {
    // POST /api/storage - 存储 HTML
    if (method === 'POST' && path === '/api/storage') {
      return await handleStorage(request);
    }

    // GET /pages/{uuid} - 读取 HTML
    if (method === 'GET' && path.startsWith('/pages/')) {
      return await handleGetPage(path);
    }

    return new Response('Not Found', { 
      status: 404,
      headers: getCORSHeaders()
    });
  } catch (error) {
    console.error('Request error:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Internal Server Error' 
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...getCORSHeaders()
      }
    });
  }
}

/**
 * 处理 HTML 存储请求
 */
async function handleStorage(request) {
  try {
    // 解析请求体
    const body = await request.json();
    const { key, html, title } = body;

    if (!key || !html) {
      return new Response(JSON.stringify({ 
        error: 'Missing required fields: key and html' 
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          ...getCORSHeaders()
        }
      });
    }

    // 创建 EdgeKV 实例
    const edgeKV = new EdgeKV({ namespace: NAMESPACE });

    // 存储 HTML
    await edgeKV.put(key, html);

    return new Response(JSON.stringify({ 
      success: true,
      message: 'HTML stored successfully',
      key
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...getCORSHeaders()
      }
    });
  } catch (error) {
    console.error('Storage error:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Failed to store HTML' 
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...getCORSHeaders()
      }
    });
  }
}

/**
 * 处理获取 HTML 页面请求
 */
async function handleGetPage(path) {
  try {
    // 提取 UUID
    const uuid = path.split('/').pop();

    if (!uuid) {
      return new Response('Invalid UUID', { 
        status: 400,
        headers: getCORSHeaders()
      });
    }

    // 创建 EdgeKV 实例
    const edgeKV = new EdgeKV({ namespace: NAMESPACE });

    // 读取 HTML
    const html = await edgeKV.get(uuid, { type: 'text' });

    if (html === undefined) {
      return new Response('Page not found', { 
        status: 404,
        headers: getCORSHeaders()
      });
    }

    // 返回 HTML 页面
    return new Response(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html;charset=UTF-8',
        'Cache-Control': 'public, max-age=3600',
        ...getCORSHeaders()
      }
    });
  } catch (error) {
    console.error('Get page error:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Failed to retrieve page' 
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...getCORSHeaders()
      }
    });
  }
}

/**
 * 处理 CORS 预检请求
 */
function handleCORS() {
  return new Response(null, {
    status: 204,
    headers: getCORSHeaders()
  });
}

/**
 * 获取 CORS 响应头
 */
function getCORSHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400'
  };
}
