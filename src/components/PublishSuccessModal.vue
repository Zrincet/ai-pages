<template>
  <Teleport to="body">
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
        class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
        @click.self="closeModal"
      >
        <Transition
          enter-active-class="transition-all duration-300"
          enter-from-class="opacity-0 scale-95"
          enter-to-class="opacity-100 scale-100"
          leave-active-class="transition-all duration-200"
          leave-from-class="opacity-100 scale-100"
          leave-to-class="opacity-0 scale-95"
        >
          <div
            v-if="show"
            class="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-8"
          >
            <!-- Header -->
            <div class="flex items-start justify-between mb-6">
              <div class="flex items-center gap-3">
                <div class="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center">
                  <CheckCircleIcon class="w-7 h-7 text-green-600" />
                </div>
                <h3 class="text-2xl font-semibold text-gray-900">发布成功！</h3>
              </div>
              <button
                @click="closeModal"
                class="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XMarkIcon class="w-6 h-6" />
              </button>
            </div>

            <!-- Content -->
            <div class="space-y-4">
              <p class="text-gray-600">
                您的页面已成功发布到边缘存储，可以通过以下链接访问：
              </p>

              <!-- URL Display -->
              <div class="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <div class="flex items-center gap-2 mb-2">
                  <LinkIcon class="w-5 h-5 text-gray-500" />
                  <span class="text-sm font-medium text-gray-700">访问链接</span>
                </div>
                <div class="flex items-center gap-2">
                  <input
                    ref="urlInput"
                    type="text"
                    :value="url"
                    readonly
                    class="flex-1 bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <button
                    @click="copyURL"
                    class="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex items-center gap-2"
                  >
                    <ClipboardDocumentIcon class="w-5 h-5" />
                    <span class="text-sm font-medium">{{ copied ? '已复制' : '复制' }}</span>
                  </button>
                </div>
              </div>

              <!-- Actions -->
              <div class="flex gap-3 pt-4">
                <a
                  :href="url"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="flex-1 bg-primary-600 hover:bg-primary-700 text-white rounded-xl py-3 px-4 font-medium transition-all hover:shadow-lg hover:scale-105 flex items-center justify-center gap-2"
                >
                  <ArrowTopRightOnSquareIcon class="w-5 h-5" />
                  在新标签页中打开
                </a>
                <button
                  @click="closeModal"
                  class="px-6 py-3 border border-gray-300 hover:border-gray-400 text-gray-700 rounded-xl font-medium transition-all hover:bg-gray-50"
                >
                  关闭
                </button>
              </div>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref } from 'vue';
import {
  CheckCircleIcon,
  XMarkIcon,
  LinkIcon,
  ClipboardDocumentIcon,
  ArrowTopRightOnSquareIcon
} from '@heroicons/vue/24/outline';

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  url: {
    type: String,
    required: true
  }
});

const emit = defineEmits(['close']);

const urlInput = ref(null);
const copied = ref(false);

function closeModal() {
  emit('close');
}

async function copyURL() {
  try {
    await navigator.clipboard.writeText(props.url);
    copied.value = true;
    setTimeout(() => {
      copied.value = false;
    }, 2000);
  } catch (error) {
    console.error('复制失败:', error);
    // 降级方案：选中文本
    urlInput.value?.select();
    document.execCommand('copy');
    copied.value = true;
    setTimeout(() => {
      copied.value = false;
    }, 2000);
  }
}
</script>
