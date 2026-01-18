<template>
  <div class="h-screen flex flex-col bg-gray-100">
    <!-- Header -->
    <header class="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
          <button
            @click="goBack"
            class="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeftIcon class="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 class="text-lg font-semibold text-gray-900">设计页面</h1>
            <p class="text-sm text-gray-500">与 AI 对话，设计您的页面</p>
          </div>
        </div>

        <div class="flex items-center gap-3">
          <!-- New Chat -->
          <button
            @click="startNewChat"
            class="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex items-center gap-2"
          >
            <PlusIcon class="w-5 h-5" />
            <span class="text-sm font-medium">新对话</span>
          </button>

          <!-- Publish Button -->
          <button
            @click="handlePublish"
            :disabled="!currentHTML || publishing"
            class="px-6 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-gray-300 disabled:to-gray-400 text-white rounded-lg font-medium transition-all hover:shadow-lg disabled:hover:shadow-none flex items-center gap-2"
          >
            <CloudArrowUpIcon v-if="!publishing" class="w-5 h-5" />
            <ArrowPathIcon v-else class="w-5 h-5 animate-spin" />
            {{ publishing ? '发布中...' : '发布页面' }}
          </button>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="flex-1 overflow-hidden">
      <div class="h-full grid grid-cols-1 lg:grid-cols-2 gap-0">
        <!-- Left: Chat Panel -->
        <div class="border-r border-gray-200 h-full overflow-hidden">
          <ChatPanel
            :messages="messages"
            :is-streaming="isStreaming"
            :streaming-content="streamingContent"
            :error="errorMessage"
            @send-message="handleSendMessage"
            @retry="retryLastMessage"
          />
        </div>

        <!-- Right: Preview Panel -->
        <div class="h-full overflow-hidden">
          <PreviewPanel :html-content="currentHTML" />
        </div>
      </div>
    </main>

    <!-- Modals -->
    <PublishSuccessModal
      :show="showPublishSuccess"
      :url="publishedUrl"
      @close="showPublishSuccess = false"
    />

    <ToastNotification
      :show="toast.show"
      :type="toast.type"
      :title="toast.title"
      :message="toast.message"
      @close="toast.show = false"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  ArrowLeftIcon,
  CloudArrowUpIcon,
  ArrowPathIcon,
  PlusIcon
} from '@heroicons/vue/24/outline';
import ChatPanel from '../components/ChatPanel.vue';
import PreviewPanel from '../components/PreviewPanel.vue';
import PublishSuccessModal from '../components/PublishSuccessModal.vue';
import ToastNotification from '../components/ToastNotification.vue';
import { streamChat } from '../services/aiService';
import { publishHTML, getHTML } from '../services/esaService';
import { extractHTMLFromText, checkHTMLSize } from '../utils/htmlExtractor';
import { buildInitialPrompt, SYSTEM_PROMPT, extractPageTitle } from '../utils/prompts';
import { saveCurrentChat, getCurrentChat, clearCurrentChat, saveToHistory, removeFromHistory, saveSessionId, getSessionId } from '../utils/storage';

const route = useRoute();
const router = useRouter();

const messages = ref([]);
const isStreaming = ref(false);
const streamingContent = ref('');
const errorMessage = ref('');
const currentHTML = ref('');
const publishing = ref(false);
const showPublishSuccess = ref(false);
const publishedUrl = ref('');
const sessionId = ref(getSessionId() || Date.now()); // 尝试从存储恢复，否则生成新ID
const currentUUID = ref(null); // 当前页面的 UUID（草稿或已发布）
const toast = ref({
  show: false,
  type: 'info',
  title: '',
  message: ''
});

let currentStreamController = null;

onMounted(() => {
  // 检查是否有初始提示词
  if (route.query.prompt) {
    // 新对话，使用草稿 UUID
    currentUUID.value = `draft-${sessionId.value}`;
    startInitialChat(route.query.prompt);
  } else if (route.query.uuid) {
    // 从历史记录加载
    currentUUID.value = route.query.uuid;
    loadFromHistory(route.query.uuid);
  } else {
    // 尝试加载上次的对话（草稿）
    currentUUID.value = `draft-${sessionId.value}`;
    const savedChat = getCurrentChat(currentUUID.value);
    if (savedChat && savedChat.length > 0) {
      messages.value = savedChat;
      updateHTMLFromMessages();
    }
  }
});

// 自动保存对话
let draftUUID = `draft-${sessionId.value}`; // 使用session ID作为草稿UUID
let lastSavedHTML = ''; // 跟踪上次保存的HTML

// 保存sessionId到localStorage
saveSessionId(sessionId.value);

watch(messages, (newMessages) => {
  // 使用 currentUUID 保存聊天记录
  if (currentUUID.value) {
    saveCurrentChat(newMessages, currentUUID.value);
  }
  
  // 如果有消息且有HTML内容，且HTML有变化，保存到历史记录
  if (newMessages.length > 0 && currentHTML.value && currentHTML.value !== lastSavedHTML) {
    lastSavedHTML = currentHTML.value;
    let title = '未命名页面';
    
    try {
      title = extractPageTitle(currentHTML.value) || '未命名页面';
      // 清理标题：移除HTML标签和特殊字符
      title = title.replace(/<[^>]*>/g, '').replace(/[\r\n\t]/g, ' ').trim();
      if (!title || title.length > 100) {
        title = title.substring(0, 100) || '未命名页面';
      }
    } catch (e) {
      console.error('提取标题失败:', e);
      title = '未命名页面';
    }
    
    saveToHistory({
      uuid: draftUUID,
      title,
      createdAt: new Date().toISOString(),
      isDraft: true
    });
  }
}, { deep: true });

function startInitialChat(prompt) {
  const userMessage = buildInitialPrompt(prompt);
  sendMessage(userMessage);
}

async function loadFromHistory(uuid) {
  try {
    showToast('info', '加载中', '正在加载历史记录...');
    
    // 从 localStorage 加载聊天记录
    const savedChat = getCurrentChat(uuid);
    
    if (savedChat && savedChat.length > 0) {
      messages.value = savedChat;
      // 从消息中恢复 HTML
      updateHTMLFromMessages();
      showToast('success', '加载成功', '历史记录已恢复');
    } else {
      // 如果 localStorage 没有，尝试从 ESA 获取（针对已发布的页面）
      if (!uuid.startsWith('draft-')) {
        const html = await getHTML(uuid);
        
        if (html) {
          currentHTML.value = html;
          // 解析 HTML 中的聊天记录
          const parser = new DOMParser();
          const doc = parser.parseFromString(html, 'text/html');
          const chatDataElement = doc.getElementById('chat-data');
          
          if (chatDataElement) {
            try {
              const chatData = JSON.parse(chatDataElement.textContent);
              messages.value = chatData.messages || [];
              // 保存到 localStorage 以便下次快速加载
              if (messages.value.length > 0) {
                saveCurrentChat(messages.value, uuid);
              }
              showToast('success', '加载成功', '历史记录已恢复');
            } catch (e) {
              console.error('解析聊天数据失败:', e);
              showToast('warning', '部分加载', 'HTML 已加载，但无法恢复聊天记录');
            }
          } else {
            showToast('info', '加载完成', 'HTML 已加载');
          }
        } else {
          showToast('error', '加载失败', '未找到该历史记录');
        }
      } else {
        showToast('info', '无聊天记录', '该草稿暂无聊天记录');
      }
    }
  } catch (error) {
    console.error('加载历史记录失败:', error);
    showToast('error', '加载失败', error.message || '加载历史记录时出错');
  }
}

async function handleSendMessage(content) {
  sendMessage(content);
}

async function sendMessage(content) {
  if (isStreaming.value) return;

  // 添加用户消息
  messages.value.push({
    role: 'user',
    content
  });

  // 开始流式响应
  isStreaming.value = true;
  streamingContent.value = '';
  errorMessage.value = '';

  // 构建消息历史（包含系统提示词）
  const chatMessages = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...messages.value
  ];

  currentStreamController = await streamChat(
    chatMessages,
    (chunk) => {
      streamingContent.value += chunk;
    },
    (error) => {
      isStreaming.value = false;
      errorMessage.value = error.message || '发生错误，请重试';
      showToast('error', '错误', errorMessage.value);
    },
    () => {
      // 流式完成
      isStreaming.value = false;
      
      // 将流式内容添加到消息历史
      if (streamingContent.value) {
        messages.value.push({
          role: 'assistant',
          content: streamingContent.value
        });
        
        // 尝试提取 HTML
        const html = extractHTMLFromText(streamingContent.value);
        if (html) {
          currentHTML.value = html;
          
          // 检查大小
          const sizeCheck = checkHTMLSize(html);
          if (!sizeCheck.isValid) {
            showToast(
              'warning',
              '文件过大',
              `HTML 大小为 ${sizeCheck.sizeInMB}MB，超过 ${sizeCheck.maxSizeInMB}MB 限制，可能无法发布`
            );
          }
        }
        
        streamingContent.value = '';
      }
    }
  );
}

function retryLastMessage() {
  if (messages.value.length === 0) return;
  
  // 移除最后一条用户消息并重新发送
  const lastUserMessage = messages.value
    .filter(m => m.role === 'user')
    .pop();
  
  if (lastUserMessage) {
    // 移除最后的错误消息
    errorMessage.value = '';
    sendMessage(lastUserMessage.content);
  }
}

function updateHTMLFromMessages() {
  // 从消息历史中提取最新的 HTML
  for (let i = messages.value.length - 1; i >= 0; i--) {
    if (messages.value[i].role === 'assistant') {
      const html = extractHTMLFromText(messages.value[i].content);
      if (html) {
        currentHTML.value = html;
        break;
      }
    }
  }
}

async function handlePublish() {
  if (!currentHTML.value || publishing.value) return;

  // 检查大小
  const sizeCheck = checkHTMLSize(currentHTML.value);
  if (!sizeCheck.isValid) {
    showToast(
      'error',
      '无法发布',
      `HTML 大小为 ${sizeCheck.sizeInMB}MB，超过 ${sizeCheck.maxSizeInMB}MB 限制`
    );
    return;
  }

  publishing.value = true;

  try {
    // 提取页面标题
    const title = extractPageTitle(currentHTML.value);
    
    // 发布到 ESA
    const result = await publishHTML(currentHTML.value, title);

    if (result.success) {
      publishedUrl.value = result.url;
      showPublishSuccess.value = true;
      
      // 移除草稿记录
      removeFromHistory(draftUUID);
      
      // 保存到历史记录（更新为正式UUID）
      saveToHistory({
        uuid: result.uuid,
        title,
        createdAt: new Date().toISOString(),
        isDraft: false // 正式发布
      });
      
      showToast('success', '发布成功', '您的页面已成功发布到边缘存储');
    } else {
      showToast('error', '发布失败', result.message || '未知错误');
    }
  } catch (error) {
    showToast('error', '发布失败', error.message);
  } finally {
    publishing.value = false;
  }
}

function startNewChat() {
  if (isStreaming.value) {
    currentStreamController?.abort();
  }
  
  // 清除当前 UUID 的聊天记录
  if (currentUUID.value) {
    clearCurrentChat(currentUUID.value);
  }
  
  messages.value = [];
  currentHTML.value = '';
  streamingContent.value = '';
  errorMessage.value = '';
  sessionId.value = Date.now(); // 重置会话 ID
  currentUUID.value = `draft-${sessionId.value}`; // 更新当前 UUID
  saveSessionId(sessionId.value); // 保存新sessionId
  draftUUID = `draft-${sessionId.value}`; // 重置草稿UUID
  lastSavedHTML = ''; // 重置保存状态
  
  showToast('info', '新对话', '已开始新的对话');
}

function goBack() {
  router.push('/');
}

function showToast(type, title, message) {
  toast.value = {
    show: true,
    type,
    title,
    message
  };
}
</script>
