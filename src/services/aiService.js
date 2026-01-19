/**
 * AI 服务 - OpenAI 标准 API 集成
 */

import { fetchEventSource } from '@microsoft/fetch-event-source';
import { getModelConfig } from '../utils/storage';
import { getOfficialConfig } from './configService';

/**
 * 获取有效的模型配置（优先用户配置，其次官方配置）
 * @returns {Promise<object|null>} 配置对象或 null
 */
async function getEffectiveConfig() {
  // 先尝试获取用户配置
  const userConfig = getModelConfig();
  if (userConfig && userConfig.apiUrl && userConfig.apiKey && userConfig.modelName) {
    return userConfig;
  }

  // 如果没有用户配置，尝试获取官方配置
  const officialConfig = await getOfficialConfig();
  return officialConfig;
}

/**
 * 发送流式聊天请求
 * @param {array} messages - 消息数组 [{ role: 'system'|'user'|'assistant', content: string }]
 * @param {function} onMessage - 接收消息片段的回调函数
 * @param {function} onError - 错误回调函数
 * @param {function} onComplete - 完成回调函数
 * @param {function} onReasoning - 接收思考内容片段的回调函数（可选）
 * @returns {object} 包含 abort 方法的对象
 */
export async function streamChat(messages, onMessage, onError, onComplete, onReasoning = null) {
  const config = await getEffectiveConfig();

  if (!config || !config.apiUrl || !config.apiKey || !config.modelName) {
    onError(new Error('模型配置不完整，请先配置模型'));
    return { abort: () => { } };
  }

  const controller = new AbortController();
  let isAborted = false;

  try {
    await fetchEventSource(`${config.apiUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.modelName,
        messages,
        stream: true,
        temperature: 0.7,
      }),
      signal: controller.signal,

      async onopen(response) {
        if (response.ok) {
          return; // 成功，继续处理
        }

        if (response.status === 401) {
          throw new Error('API Key 无效，请检查配置');
        } else if (response.status === 429) {
          throw new Error('请求过于频繁，请稍后再试');
        } else if (response.status >= 500) {
          throw new Error('服务器错误，请稍后再试');
        } else {
          const errorText = await response.text();
          throw new Error(`请求失败: ${response.status} ${errorText}`);
        }
      },

      onmessage(event) {
        if (isAborted) return;

        // OpenAI 使用 [DONE] 标记流结束
        if (event.data === '[DONE]') {
          onComplete();
          return;
        }

        try {
          const data = JSON.parse(event.data);
          const delta = data.choices?.[0]?.delta;

          // 处理思考内容 (reasoning_content)
          if (delta?.reasoning_content && onReasoning) {
            onReasoning(delta.reasoning_content);
          }

          // 处理正常内容
          if (delta?.content) {
            onMessage(delta.content);
          }

          // 检查是否完成
          if (data.choices?.[0]?.finish_reason) {
            onComplete();
          }
        } catch (error) {
          console.error('解析消息失败:', error, event.data);
        }
      },

      onerror(error) {
        if (isAborted) return;

        console.error('流式请求错误:', error);

        if (error.message) {
          onError(error);
        } else {
          onError(new Error('网络连接失败，请检查网络或 API 地址'));
        }

        throw error; // 停止重试
      },
    });
  } catch (error) {
    if (!isAborted && error.name !== 'AbortError') {
      onError(error);
    }
  }

  return {
    abort: () => {
      isAborted = true;
      controller.abort();
    }
  };
}

/**
 * 测试模型连接
 * @param {object} config - 模型配置 { apiUrl, apiKey, modelName }
 * @returns {Promise<object>} { success: boolean, message: string, modelInfo?: object }
 */
export async function testModelConnection(config) {
  try {
    const response = await fetch(`${config.apiUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.modelName,
        messages: [
          {
            role: 'user',
            content: 'Hello'
          }
        ],
        max_tokens: 5,
        stream: false,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      return {
        success: true,
        message: '连接成功！模型可正常使用',
        modelInfo: {
          model: data.model,
          usage: data.usage
        }
      };
    } else if (response.status === 401) {
      return {
        success: false,
        message: 'API Key 无效，请检查配置'
      };
    } else if (response.status === 404) {
      return {
        success: false,
        message: 'API 地址或模型名称错误'
      };
    } else {
      const errorText = await response.text();
      return {
        success: false,
        message: `连接失败: ${response.status} ${errorText}`
      };
    }
  } catch (error) {
    return {
      success: false,
      message: `网络错误: ${error.message}`
    };
  }
}
