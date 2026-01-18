<template>
  <Transition
    enter-active-class="transition-transform duration-300"
    enter-from-class="translate-x-full"
    enter-to-class="translate-x-0"
    leave-active-class="transition-transform duration-200"
    leave-from-class="translate-x-0"
    leave-to-class="translate-x-full"
  >
    <div
      v-if="show"
      class="fixed right-0 top-0 bottom-0 w-96 bg-white shadow-2xl z-40 overflow-y-auto"
    >
      <!-- Header -->
      <div class="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <ClockIcon class="w-6 h-6 text-gray-700" />
            <h3 class="text-lg font-semibold text-gray-900">历史记录</h3>
          </div>
          <button
            @click="$emit('close')"
            class="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon class="w-6 h-6" />
          </button>
        </div>
      </div>

      <!-- Content -->
      <div class="p-6">
        <!-- Empty State -->
        <div
          v-if="history.length === 0"
          class="text-center py-12"
        >
          <DocumentIcon class="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p class="text-gray-500">暂无历史记录</p>
          <p class="text-sm text-gray-400 mt-1">开始创建您的第一个页面吧</p>
        </div>

        <!-- History List -->
        <div v-else class="space-y-3">
          <div
            v-for="item in history"
            :key="item.uuid"
            class="group bg-white border border-gray-200 rounded-2xl p-4 hover:shadow-lg hover:border-primary-300 transition-all cursor-pointer"
            @click="openPage(item)"
          >
            <div class="flex items-start gap-3">
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2">
                  <h4 class="font-medium text-gray-900 truncate group-hover:text-primary-600 transition-colors">
                    {{ item.title }}
                  </h4>
                  <span
                    v-if="item.isDraft"
                    class="flex-shrink-0 px-2 py-0.5 text-xs bg-yellow-100 text-yellow-800 rounded-full"
                  >
                    草稿
                  </span>
                </div>
                <p class="text-sm text-gray-500 mt-1">
                  {{ formatDate(item.updatedAt || item.createdAt) }}
                </p>
                <p class="text-xs text-gray-400 mt-1 font-mono truncate">
                  {{ item.isDraft ? '未发布' : item.uuid }}
                </p>
              </div>
              
              <button
                @click.stop="deleteItem(item.uuid)"
                class="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-600 transition-all p-1"
                title="删除"
              >
                <TrashIcon class="w-5 h-5" />
              </button>
            </div>

            <!-- Actions -->
            <div class="flex gap-2 mt-3">
              <button
                v-if="!item.isDraft"
                @click.stop="viewPage(item)"
                class="flex-1 text-xs py-2 px-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors flex items-center justify-center gap-1"
              >
                <ArrowTopRightOnSquareIcon class="w-4 h-4" />
                预览
              </button>
              <button
                v-if="!item.isDraft"
                @click.stop="copyLink(item)"
                class="flex-1 text-xs py-2 px-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors flex items-center justify-center gap-1"
              >
                <LinkIcon class="w-4 h-4" />
                复制链接
              </button>
              <button
                v-if="item.isDraft"
                @click.stop="openPage(item)"
                class="flex-1 text-xs py-2 px-3 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors flex items-center justify-center gap-1"
              >
                <ArrowTopRightOnSquareIcon class="w-4 h-4" />
                继续编辑
              </button>
            </div>
          </div>
        </div>

        <!-- Clear All -->
        <div
          v-if="history.length > 0"
          class="mt-6 pt-6 border-t border-gray-200"
        >
          <button
            @click="clearAll"
            class="w-full py-2 text-sm text-red-600 hover:text-red-700 font-medium transition-colors"
          >
            清空所有记录
          </button>
        </div>
      </div>
    </div>
  </Transition>

  <!-- Backdrop -->
  <Transition
    enter-active-class="transition-opacity duration-300"
    enter-from-class="opacity-0"
    enter-to-class="opacity-100"
    leave-active-class="transition-opacity duration-200"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0"
  >
    <div
      v-if="show"
      class="fixed inset-0 bg-black bg-opacity-30 z-30"
      @click="$emit('close')"
    ></div>
  </Transition>
</template>

<script setup>
import { ref, watch } from 'vue';
import {
  ClockIcon,
  XMarkIcon,
  DocumentIcon,
  TrashIcon,
  ArrowTopRightOnSquareIcon,
  LinkIcon
} from '@heroicons/vue/24/outline';
import { getHistory, removeFromHistory, clearHistory } from '../utils/storage';
import { getESADomain } from '../services/esaService';

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['close', 'open-page']);

const history = ref([]);

watch(() => props.show, (newValue) => {
  if (newValue) {
    loadHistory();
  }
});

function loadHistory() {
  history.value = getHistory();
}

function formatDate(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now - date;
  
  // 小于1分钟
  if (diff < 60000) {
    return '刚刚';
  }
  
  // 小于1小时
  if (diff < 3600000) {
    const minutes = Math.floor(diff / 60000);
    return `${minutes}分钟前`;
  }
  
  // 小于1天
  if (diff < 86400000) {
    const hours = Math.floor(diff / 3600000);
    return `${hours}小时前`;
  }
  
  // 小于7天
  if (diff < 604800000) {
    const days = Math.floor(diff / 86400000);
    return `${days}天前`;
  }
  
  // 否则显示完整日期
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function openPage(item) {
  emit('open-page', item);
  emit('close');
}

function viewPage(item) {
  const url = `${getESADomain()}/pages/${item.uuid}`;
  window.open(url, '_blank');
}

function copyLink(item) {
  const url = `${getESADomain()}/pages/${item.uuid}`;
  navigator.clipboard.writeText(url).then(() => {
    // 可以添加 toast 提示
    alert('链接已复制到剪贴板');
  }).catch(err => {
    console.error('复制失败:', err);
  });
}

function deleteItem(uuid) {
  if (confirm('确定要删除这条记录吗？')) {
    removeFromHistory(uuid);
    loadHistory();
  }
}

function clearAll() {
  if (confirm('确定要清空所有历史记录吗？此操作不可恢复。')) {
    clearHistory();
    loadHistory();
  }
}
</script>
