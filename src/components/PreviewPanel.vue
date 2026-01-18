<template>
  <div class="flex flex-col h-full bg-gray-50">
    <!-- Header -->
    <div class="bg-white border-b border-gray-200 px-6 py-4">
      <div class="flex items-center justify-between">
        <h3 class="font-semibold text-gray-900">实时预览</h3>
        <div class="flex items-center gap-2">
          <!-- Size Warning -->
          <div
            v-if="sizeWarning"
            class="flex items-center gap-2 px-3 py-1.5 bg-yellow-50 border border-yellow-200 rounded-lg"
          >
            <ExclamationTriangleIcon class="w-4 h-4 text-yellow-600" />
            <span class="text-xs text-yellow-800">
              {{ sizeInfo }}
            </span>
          </div>
          
          <!-- Refresh Button -->
          <button
            v-if="hasContent"
            @click="refreshPreview"
            class="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="刷新预览"
          >
            <ArrowPathIcon class="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>
    </div>

    <!-- Preview Area -->
    <div class="flex-1 overflow-hidden">
      <!-- Empty State -->
      <div
        v-if="!hasContent"
        class="h-full flex items-center justify-center bg-white m-6 rounded-2xl border-2 border-dashed border-gray-300"
      >
        <div class="text-center">
          <DocumentIcon class="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p class="text-gray-500 font-medium">等待生成 HTML...</p>
          <p class="text-sm text-gray-400 mt-1">AI 生成的页面将在此处实时预览</p>
        </div>
      </div>

      <!-- Preview Frame -->
      <div
        v-else
        class="h-full bg-white m-6 rounded-2xl shadow-lg overflow-auto border border-gray-200"
      >
        <iframe
          ref="previewFrame"
          :srcdoc="htmlContent"
          sandbox="allow-scripts allow-same-origin allow-forms"
          class="w-full h-full"
          @load="onFrameLoad"
        ></iframe>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import {
  DocumentIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon
} from '@heroicons/vue/24/outline';
import { checkHTMLSize, formatFileSize } from '../utils/htmlExtractor';

const props = defineProps({
  htmlContent: {
    type: String,
    default: ''
  }
});

const previewFrame = ref(null);
const frameKey = ref(0);

const hasContent = computed(() => {
  return props.htmlContent && props.htmlContent.trim().length > 0;
});

const sizeCheck = computed(() => {
  if (!hasContent.value) {
    return { isValid: true, sizeInMB: '0' };
  }
  return checkHTMLSize(props.htmlContent);
});

const sizeWarning = computed(() => {
  return hasContent.value && !sizeCheck.value.isValid;
});

const sizeInfo = computed(() => {
  if (!hasContent.value) return '';
  return `大小: ${sizeCheck.value.sizeInMB}MB / ${sizeCheck.value.maxSizeInMB}MB`;
});

watch(() => props.htmlContent, () => {
  // HTML 内容变化时，iframe 会自动更新（因为 srcdoc 是响应式的）
});

function refreshPreview() {
  frameKey.value++;
  // 强制重新加载 iframe
  if (previewFrame.value) {
    previewFrame.value.srcdoc = props.htmlContent;
  }
}

function onFrameLoad() {
  // iframe 加载完成
  console.log('Preview loaded');
}
</script>
