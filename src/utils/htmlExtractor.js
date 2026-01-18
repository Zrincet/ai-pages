/**
 * HTML 提取和处理工具函数
 */

// EdgeKV 单个 value 的大小限制（字节）
const MAX_HTML_SIZE = 1.8 * 1024 * 1024; // 1.8 MB

/**
 * 从文本中提取 HTML 代码
 * @param {string} text - 包含 HTML 的文本（可能在 markdown 代码块中）
 * @returns {string|null} 提取的 HTML 代码，如果未找到则返回 null
 */
export function extractHTMLFromText(text) {
  if (!text) return null;

  // 1. 尝试从 markdown 代码块中提取
  const codeBlockRegex = /```html\s*([\s\S]*?)```/i;
  const codeBlockMatch = text.match(codeBlockRegex);
  
  if (codeBlockMatch && codeBlockMatch[1]) {
    const html = codeBlockMatch[1].trim();
    if (isValidHTML(html)) {
      return html;
    }
  }

  // 2. 尝试直接匹配完整的 HTML 文档
  const htmlDocRegex = /<!DOCTYPE\s+html[\s\S]*?<\/html>/i;
  const htmlDocMatch = text.match(htmlDocRegex);
  
  if (htmlDocMatch && htmlDocMatch[0]) {
    return htmlDocMatch[0].trim();
  }

  // 3. 尝试匹配 <html> 标签（可能缺少 DOCTYPE）
  const htmlTagRegex = /<html[\s\S]*?<\/html>/i;
  const htmlTagMatch = text.match(htmlTagRegex);
  
  if (htmlTagMatch && htmlTagMatch[0]) {
    return htmlTagMatch[0].trim();
  }

  return null;
}

/**
 * 检查是否是有效的 HTML 文档
 * @param {string} html - HTML 代码
 * @returns {boolean} 是否有效
 */
export function isValidHTML(html) {
  if (!html || typeof html !== 'string') return false;
  
  // 检查基本结构
  const hasHtmlTag = /<html/i.test(html);
  const hasHead = /<head/i.test(html);
  const hasBody = /<body/i.test(html);
  
  return hasHtmlTag && hasHead && hasBody;
}

/**
 * 计算 HTML 大小（字节）
 * @param {string} html - HTML 代码
 * @returns {number} 字节数
 */
export function getHTMLSize(html) {
  if (!html) return 0;
  return new Blob([html]).size;
}

/**
 * 检查 HTML 是否超过大小限制
 * @param {string} html - HTML 代码
 * @returns {object} { isValid: boolean, size: number, maxSize: number, sizeInMB: string }
 */
export function checkHTMLSize(html) {
  const size = getHTMLSize(html);
  const sizeInMB = (size / (1024 * 1024)).toFixed(2);
  
  return {
    isValid: size <= MAX_HTML_SIZE,
    size,
    maxSize: MAX_HTML_SIZE,
    sizeInMB,
    maxSizeInMB: '1.8'
  };
}

/**
 * 格式化文件大小
 * @param {number} bytes - 字节数
 * @returns {string} 格式化后的大小字符串
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * 优化 HTML 大小（移除注释和多余空白）
 * @param {string} html - HTML 代码
 * @returns {string} 优化后的 HTML
 */
export function optimizeHTML(html) {
  if (!html) return '';
  
  return html
    // 移除 HTML 注释
    .replace(/<!--[\s\S]*?-->/g, '')
    // 移除多余的空白行
    .replace(/\n\s*\n/g, '\n')
    // 移除行首行尾空白
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .join('\n');
}
