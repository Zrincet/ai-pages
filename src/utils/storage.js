/**
 * localStorage 封装工具
 */

const STORAGE_KEYS = {
  MODEL_CONFIG: 'ai_html_generator_model_config',
  HISTORY: 'ai_html_generator_history',
  CURRENT_CHAT: 'ai_html_generator_current_chat'
};

/**
 * 保存模型配置
 * @param {object} config - 模型配置对象
 */
export function saveModelConfig(config) {
  try {
    localStorage.setItem(STORAGE_KEYS.MODEL_CONFIG, JSON.stringify(config));
    return true;
  } catch (error) {
    console.error('保存模型配置失败:', error);
    return false;
  }
}

/**
 * 获取模型配置
 * @returns {object|null} 模型配置对象或 null
 */
export function getModelConfig() {
  try {
    const config = localStorage.getItem(STORAGE_KEYS.MODEL_CONFIG);
    return config ? JSON.parse(config) : null;
  } catch (error) {
    console.error('读取模型配置失败:', error);
    return null;
  }
}

/**
 * 检查是否已配置模型
 * @returns {boolean} 是否已配置
 */
export function hasModelConfig() {
  const config = getModelConfig();
  return !!(config && config.apiUrl && config.apiKey && config.modelName);
}

/**
 * 保存历史记录
 * @param {object} item - 历史记录项 { uuid, title, createdAt, isDraft }
 */
export function saveToHistory(item) {
  try {
    const history = getHistory();
    
    // 查找是否已存在
    const existingIndex = history.findIndex(h => h.uuid === item.uuid);
    
    if (existingIndex >= 0) {
      // 如果存在，更新记录
      history[existingIndex] = {
        ...history[existingIndex],
        ...item,
        updatedAt: new Date().toISOString()
      };
    } else {
      // 如果不存在，添加到开头
      history.unshift({
        ...item,
        updatedAt: new Date().toISOString()
      });
    }
    
    // 限制历史记录数量（最多保存 50 条）
    const maxHistory = 50;
    if (history.length > maxHistory) {
      history.splice(maxHistory);
    }
    
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history));
    return true;
  } catch (error) {
    console.error('保存历史记录失败:', error);
    return false;
  }
}

/**
 * 获取历史记录列表
 * @returns {array} 历史记录数组
 */
export function getHistory() {
  try {
    const history = localStorage.getItem(STORAGE_KEYS.HISTORY);
    return history ? JSON.parse(history) : [];
  } catch (error) {
    console.error('读取历史记录失败:', error);
    return [];
  }
}

/**
 * 从历史记录中删除项
 * @param {string} uuid - 要删除的项的 UUID
 */
export function removeFromHistory(uuid) {
  try {
    const history = getHistory();
    const filtered = history.filter(item => item.uuid !== uuid);
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(filtered));
    return true;
  } catch (error) {
    console.error('删除历史记录失败:', error);
    return false;
  }
}

/**
 * 清空历史记录
 */
export function clearHistory() {
  try {
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify([]));
    return true;
  } catch (error) {
    console.error('清空历史记录失败:', error);
    return false;
  }
}

/**
 * 保存当前对话记录
 * @param {array} messages - 消息数组
 */
export function saveCurrentChat(messages) {
  try {
    localStorage.setItem(STORAGE_KEYS.CURRENT_CHAT, JSON.stringify(messages));
    return true;
  } catch (error) {
    console.error('保存对话记录失败:', error);
    return false;
  }
}

/**
 * 获取当前对话记录
 * @returns {array} 消息数组
 */
export function getCurrentChat() {
  try {
    const chat = localStorage.getItem(STORAGE_KEYS.CURRENT_CHAT);
    return chat ? JSON.parse(chat) : [];
  } catch (error) {
    console.error('读取对话记录失败:', error);
    return [];
  }
}

/**
 * 清空当前对话记录
 */
export function clearCurrentChat() {
  try {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_CHAT);
    localStorage.removeItem(STORAGE_KEYS.SESSION_ID);
    return true;
  } catch (error) {
    console.error('清空对话记录失败:', error);
    return false;
  }
}

/**
 * 保存当前会话ID
 * @param {number} sessionId - 会话ID
 */
export function saveSessionId(sessionId) {
  try {
    localStorage.setItem(STORAGE_KEYS.SESSION_ID, sessionId.toString());
    return true;
  } catch (error) {
    console.error('保存会话ID失败:', error);
    return false;
  }
}

/**
 * 获取当前会话ID
 * @returns {number|null} 会话ID
 */
export function getSessionId() {
  try {
    const sessionId = localStorage.getItem(STORAGE_KEYS.SESSION_ID);
    return sessionId ? parseInt(sessionId, 10) : null;
  } catch (error) {
    console.error('获取会话ID失败:', error);
    return null;
  }
}
