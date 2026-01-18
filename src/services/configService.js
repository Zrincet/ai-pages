import RC4 from 'rc4';

const OFFICIAL_CONFIG_KEY = 'config';
let cachedConfig = null;
let officialConfigAvailable = null; // null: 未检测, true: 可用, false: 不可用

/**
 * RC4 解密
 * @param {string} encrypted - 加密的字符串
 * @param {string} key - RC4 密钥
 * @returns {string} 解密后的字符串
 */
function rc4Decrypt(encrypted, key) {
  try {
    const cipher = new RC4(key);
    const decrypted = cipher.decode(encrypted);
    return decrypted;
  } catch (error) {
    console.error('RC4 解密失败:', error);
    throw error;
  }
}

/**
 * 从 ESA 获取加密的官方配置
 * @returns {Promise<string|null>} 加密的配置字符串
 */
async function fetchEncryptedConfig() {
  try {
    const apiUrl = `/api/storage?key=${OFFICIAL_CONFIG_KEY}`;
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      if (response.status === 404) {
        console.log('未找到官方配置');
        return null;
      }
      throw new Error(`获取官方配置失败: ${response.status}`);
    }
    
    const data = await response.json();
    return data.value || null;
  } catch (error) {
    console.error('获取官方配置失败:', error);
    return null;
  }
}

/**
 * 获取并解密官方配置
 * @returns {Promise<Object|null>} 官方配置对象 { apiUrl, apiKey, modelName }
 */
export async function getOfficialConfig() {
  // 如果已缓存，直接返回
  if (cachedConfig !== null) {
    return cachedConfig;
  }

  try {
    // 获取 RC4 密钥
    const rc4Key = import.meta.env.VITE_RC4_KEY;
    if (!rc4Key) {
      console.warn('未配置 RC4 密钥，无法解密官方配置');
      cachedConfig = null;
      officialConfigAvailable = false;
      return null;
    }

    // 获取加密的配置
    const encryptedConfig = await fetchEncryptedConfig();
    if (!encryptedConfig) {
      cachedConfig = null;
      officialConfigAvailable = false;
      return null;
    }

    // 解密配置
    const decryptedConfig = rc4Decrypt(encryptedConfig, rc4Key);
    const config = JSON.parse(decryptedConfig);

    // 验证配置格式
    if (!config.apiUrl || !config.apiKey || !config.modelName) {
      console.warn('官方配置格式不正确');
      cachedConfig = null;
      officialConfigAvailable = false;
      return null;
    }

    cachedConfig = {
      apiUrl: config.apiUrl,
      apiKey: config.apiKey,
      modelName: config.modelName
    };
    officialConfigAvailable = true;

    return cachedConfig;
  } catch (error) {
    console.error('解析官方配置失败:', error);
    cachedConfig = null;
    officialConfigAvailable = false;
    return null;
  }
}

/**
 * 检查是否使用官方 API
 * @returns {boolean} 是否使用官方 API
 */
export function isUsingOfficialAPI() {
  const userApiUrl = localStorage.getItem('apiUrl');
  const userApiKey = localStorage.getItem('apiKey');
  
  // 如果用户没有设置 API，则认为使用官方 API
  return !userApiUrl && !userApiKey;
}

/**
 * 检查官方配置是否可用
 * @returns {Promise<boolean>} 官方配置是否可用
 */
export async function isOfficialConfigAvailable() {
  // 如果已经检测过，直接返回结果
  if (officialConfigAvailable !== null) {
    return officialConfigAvailable;
  }
  
  // 尝试获取配置以确定可用性
  const config = await getOfficialConfig();
  return officialConfigAvailable === true;
}

/**
 * 清除缓存的官方配置（用于刷新配置）
 */
export function clearOfficialConfigCache() {
  cachedConfig = null;
  officialConfigAvailable = null;
}
