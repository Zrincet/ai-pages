/**
 * 阿里云 ESA 边缘存储服务
 */

import { v4 as uuidv4 } from 'uuid';

// 线上环境使用相对路径，会自动路由到边缘函数
// 本地开发可通过 VITE_ESA_DOMAIN 环境变量指定测试域名
const ESA_DOMAIN = import.meta.env.VITE_ESA_DOMAIN || '';

/**
 * 发布 HTML 到边缘存储
 * @param {string} html - HTML 内容
 * @param {string} title - 页面标题（可选）
 * @returns {Promise<object>} { success: boolean, uuid: string, url: string, message?: string }
 */
export async function publishHTML(html, title = '') {
  try {
    // 生成唯一标识
    const uuid = uuidv4();
    const key = uuid;

    // 调用边缘函数 API 存储 HTML
    const response = await fetch(`${ESA_DOMAIN}/api/storage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        key,
        html,
        title
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`发布失败: ${response.status} ${errorText}`);
    }

    const data = await response.json();

    // 构建访问 URL
    const pageUrl = `${ESA_DOMAIN}/pages/${uuid}`;

    return {
      success: true,
      uuid,
      url: pageUrl,
      message: '发布成功！'
    };
  } catch (error) {
    console.error('发布 HTML 失败:', error);
    return {
      success: false,
      message: error.message || '发布失败，请检查网络连接'
    };
  }
}

/**
 * 从边缘存储获取 HTML
 * @param {string} uuid - 页面的 UUID
 * @returns {Promise<object>} { success: boolean, html?: string, message?: string }
 */
export async function getHTML(uuid) {
  try {
    const response = await fetch(`${ESA_DOMAIN}/pages/${uuid}`, {
      method: 'GET',
    });

    if (response.status === 404) {
      return {
        success: false,
        message: '页面不存在或已被删除'
      };
    }

    if (!response.ok) {
      throw new Error(`获取失败: ${response.status}`);
    }

    const html = await response.text();

    return {
      success: true,
      html
    };
  } catch (error) {
    console.error('获取 HTML 失败:', error);
    return {
      success: false,
      message: error.message || '获取失败，请检查网络连接'
    };
  }
}

/**
 * 检查 ESA 域名是否配置
 * @returns {boolean} 是否已配置
 */
export function isESAConfigured() {
  return ESA_DOMAIN && !ESA_DOMAIN.includes('your-esa-domain');
}

/**
 * 获取 ESA 域名
 * @returns {string} ESA 域名
 */
export function getESADomain() {
  return ESA_DOMAIN;
}
