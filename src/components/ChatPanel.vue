<template>
  <div class="flex flex-col h-full bg-gray-50">
    <!-- Messages - Scrollable Area -->
    <div
      ref="messagesContainer"
      class="flex-1 overflow-y-auto p-6 space-y-4"
    >
      <div
        v-for="(message, index) in messages"
        :key="index"
        :class="[
          'flex',
          message.role === 'user' ? 'justify-end' : 'justify-start'
        ]"
      >
        <div
          :class="[
            'max-w-[80%] rounded-2xl px-4 py-3',
            message.role === 'user'
              ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
              : 'bg-white border border-gray-200 text-gray-900'
          ]"
        >
          <div v-if="message.role === 'assistant'">
            <!-- 思考内容折叠展示 -->
            <details v-if="message.reasoning" class="mb-3">
              <summary class="flex items-center gap-2 cursor-pointer text-sm text-gray-500 hover:text-gray-700 transition-colors">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
                </svg>
                <span>思考过程</span>
              </summary>
              <div class="mt-2 pl-6 border-l-2 border-gray-200 text-sm text-gray-600 whitespace-pre-wrap">{{ message.reasoning }}</div>
            </details>
            <!-- 渲染文本和代码块 -->
            <div v-html="renderMessageContent(message.content)"></div>
          </div>
          <div v-else class="whitespace-pre-wrap">{{ message.content }}</div>
        </div>
      </div>

      <!-- Streaming Reasoning -->
      <div
        v-if="streamingReasoning && isStreaming"
        class="flex justify-start"
      >
        <div class="max-w-[80%] bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3">
          <div class="flex items-center gap-2 text-sm text-amber-700 mb-2">
            <svg class="w-4 h-4 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
            </svg>
            <span>正在思考...</span>
          </div>
          <div class="text-sm text-amber-800 whitespace-pre-wrap max-h-40 overflow-y-auto">{{ streamingReasoning }}</div>
        </div>
      </div>

      <!-- Streaming Message -->
      <div
        v-if="streamingContent"
        class="flex justify-start"
      >
        <div class="max-w-[80%] bg-white border border-gray-200 rounded-2xl px-4 py-3">
          <div v-html="renderMessageContent(streamingContent)"></div>
          <div class="flex items-center gap-2 mt-2">
            <div class="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
            <div class="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style="animation-delay: 0.1s"></div>
            <div class="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
          </div>
        </div>
      </div>

      <!-- Error Message -->
      <div
        v-if="error"
        class="flex justify-start"
      >
        <div class="max-w-[80%] bg-red-50 border border-red-200 rounded-2xl px-4 py-3">
          <div class="flex items-start gap-2">
            <ExclamationCircleIcon class="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p class="text-sm font-medium text-red-800">{{ error }}</p>
              <button
                @click="retry"
                class="text-sm text-red-600 hover:text-red-700 font-medium mt-2 flex items-center gap-1"
              >
                <ArrowPathIcon class="w-4 h-4" />
                重试
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Input Area - Fixed at Bottom -->
    <div class="flex-shrink-0 border-t border-gray-200 bg-white p-4">
      <div class="flex gap-3">
        <textarea
          v-model="inputMessage"
          placeholder="描述您想要的修改..."
          class="flex-1 resize-none border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent max-h-32"
          rows="1"
          @keydown.enter.ctrl="sendMessage"
          @input="autoResize"
        ></textarea>
        <button
          @click="sendMessage"
          :disabled="!inputMessage.trim() || isStreaming"
          class="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-gray-300 disabled:to-gray-400 text-white rounded-xl font-medium transition-all hover:shadow-lg disabled:hover:shadow-none flex items-center gap-2 flex-shrink-0"
        >
          <PaperAirplaneIcon class="w-5 h-5" />
          <span class="hidden sm:inline">发送</span>
        </button>
      </div>
      <p class="text-xs text-gray-500 mt-2">
        Ctrl+Enter 快速发送
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick, watch } from 'vue';
import { marked } from 'marked';
import {
  PaperAirplaneIcon,
  ExclamationCircleIcon,
  ArrowPathIcon
} from '@heroicons/vue/24/outline';
import { extractHTMLFromText } from '../utils/htmlExtractor';

const props = defineProps({
  messages: {
    type: Array,
    default: () => []
  },
  isStreaming: {
    type: Boolean,
    default: false
  },
  streamingContent: {
    type: String,
    default: ''
  },
  streamingReasoning: {
    type: String,
    default: ''
  },
  error: {
    type: String,
    default: ''
  }
});

const emit = defineEmits(['send-message', 'retry']);

const messagesContainer = ref(null);
const inputMessage = ref('');

// 配置 marked
marked.setOptions({
  breaks: true,
  gfm: true
});

watch(() => [props.messages.length, props.streamingContent], () => {
  scrollToBottom();
});

function renderMessageContent(content) {
  if (!content) return '';

  // 判断是否是流式输出：如果当前内容等于streamingContent且正在流式传输
  const isStreaming = props.isStreaming && content === props.streamingContent;

  // 提取 HTML 代码块
  const htmlCode = extractHTMLFromText(content);
  
  // 如果没有提取到HTML，但内容包含 ```html 开始标记，说明正在流式输出HTML
  const hasHtmlCodeBlock = content.includes('```html');
  
  if (hasHtmlCodeBlock) {
    // 有HTML代码块（完整或不完整）
    const htmlStartIndex = content.indexOf('```html');
    const htmlEndIndex = content.lastIndexOf('```');
    
    const textBeforeCode = htmlStartIndex >= 0 ? content.substring(0, htmlStartIndex) : '';
    const textAfterCode = htmlEndIndex > htmlStartIndex + 7 ? content.substring(htmlEndIndex + 3) : '';
    
    // 渲染文本部分
    let result = '';
    if (textBeforeCode.trim()) {
      result += marked.parse(textBeforeCode);
    }
    
    if (htmlCode) {
      // 有完整的HTML代码
      const lineCount = htmlCode.split('\n').length;
      
      if (!isStreaming) {
        // 完成后只显示行数
        result += `
          <div class="my-2 bg-gray-50 rounded-lg border border-gray-200 p-3">
            <div class="flex items-center gap-2 text-sm text-gray-600">
              <svg class="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path>
              </svg>
              <span>HTML 代码</span>
              <span class="font-medium text-gray-900">${lineCount} 行</span>
            </div>
          </div>
        `;
      } else {
        // 流式输出中，显示完整代码块预览
        const lines = htmlCode.split('\n');
        const lastThreeLines = lines.slice(-3).join('\n');
        
        result += `
          <div class="my-2 bg-gray-900 rounded-lg overflow-hidden border border-gray-700">
            <div class="bg-gray-800 px-3 py-2 flex items-center justify-between border-b border-gray-700">
              <div class="flex items-center gap-2">
                <svg class="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path>
                </svg>
                <span class="text-xs text-gray-300">HTML</span>
                <span class="text-xs text-gray-500">${lineCount} 行</span>
              </div>
            </div>
            <div class="px-3 py-2">
              <pre class="text-xs text-gray-400 leading-relaxed overflow-hidden">${escapeHtml(lastThreeLines)}</pre>
            </div>
          </div>
        `;
      }
    } else if (isStreaming) {
      // 正在流式输出HTML，但还没有完整的代码块
      // 提取已有的HTML内容（即使不完整）
      const htmlStart = content.indexOf('```html') + 7;
      const partialHtml = content.substring(htmlStart);
      const lines = partialHtml.split('\n').filter(line => line.trim());
      const lineCount = lines.length;
      const lastThreeLines = lines.slice(-3).join('\n');
      
      result += `
        <div class="my-2 bg-gray-900 rounded-lg overflow-hidden border border-gray-700">
          <div class="bg-gray-800 px-3 py-2 flex items-center justify-between border-b border-gray-700">
            <div class="flex items-center gap-2">
              <svg class="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path>
              </svg>
              <span class="text-xs text-gray-300">HTML</span>
              <span class="text-xs text-gray-500">${lineCount > 0 ? lineCount + ' 行' : '生成中...'}</span>
            </div>
          </div>
          <div class="px-3 py-2">
            <pre class="text-xs text-gray-400 leading-relaxed overflow-hidden">${escapeHtml(lastThreeLines || '正在生成...')}</pre>
          </div>
        </div>
      `;
    }
    
    if (textAfterCode.trim()) {
      result += marked.parse(textAfterCode);
    }
    
    return result;
  } else {
    // 没有 HTML 代码，正常渲染 Markdown
    return marked.parse(content);
  }
}

function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

function autoResize(event) {
  const textarea = event.target;
  textarea.style.height = 'auto';
  textarea.style.height = Math.min(textarea.scrollHeight, 128) + 'px';
}

function sendMessage() {
  if (!inputMessage.value.trim() || props.isStreaming) return;
  
  emit('send-message', inputMessage.value);
  inputMessage.value = '';
}

function retry() {
  emit('retry');
}

async function scrollToBottom() {
  await nextTick();
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
  }
}
</script>

<style scoped>
/* Markdown 样式 */
:deep(.prose) {
  color: inherit;
}

:deep(.prose code) {
  background-color: #f3f4f6;
  padding: 0.125rem 0.25rem;
  border-radius: 0.25rem;
  font-size: 0.875em;
}

:deep(.prose pre) {
  background-color: #1f2937;
  color: #f9fafb;
  padding: 1rem;
  border-radius: 0.5rem;
  overflow-x: auto;
}

:deep(.prose pre code) {
  background-color: transparent;
  padding: 0;
  color: inherit;
}

:deep(.prose a) {
  color: #3b82f6;
  text-decoration: underline;
}

:deep(.prose h1, .prose h2, .prose h3, .prose h4, .prose h5, .prose h6) {
  margin-top: 1em;
  margin-bottom: 0.5em;
  font-weight: 600;
}

:deep(.prose ul, .prose ol) {
  margin: 0.5em 0;
  padding-left: 1.5em;
}

:deep(.prose li) {
  margin: 0.25em 0;
}
</style>
