<template>
  <div class="my-2 bg-gray-900 rounded-lg overflow-hidden border border-gray-700">
    <!-- Header -->
    <div class="bg-gray-800 px-3 py-2 flex items-center justify-between border-b border-gray-700">
      <div class="flex items-center gap-2">
        <CodeBracketIcon class="w-4 h-4 text-blue-400" />
        <span class="text-xs text-gray-300">HTML</span>
        <span class="text-xs text-gray-500">{{ lineCount }} 行</span>
      </div>
      <button
        @click="toggleExpand"
        class="text-xs text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1"
      >
        <component :is="isExpanded ? ChevronUpIcon : ChevronDownIcon" class="w-4 h-4" />
        {{ isExpanded ? '收起' : '展开' }}
      </button>
    </div>

    <!-- Code Content -->
    <div v-if="isExpanded" class="relative">
      <pre class="p-3 overflow-x-auto text-xs leading-relaxed"><code class="text-gray-300">{{ displayCode }}</code></pre>
      <button
        @click="copyCode"
        class="absolute top-2 right-2 p-1.5 bg-gray-800 hover:bg-gray-700 rounded transition-colors"
        :title="copied ? '已复制' : '复制代码'"
      >
        <component :is="copied ? CheckIcon : ClipboardIcon" class="w-4 h-4 text-gray-400" />
      </button>
    </div>
    
    <!-- Collapsed Preview (last 3 lines) -->
    <div v-else class="px-3 py-2">
      <pre class="text-xs text-gray-500 leading-relaxed overflow-hidden">{{ previewLines }}</pre>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import {
  CodeBracketIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  ClipboardIcon,
  CheckIcon
} from '@heroicons/vue/24/outline';

const props = defineProps({
  code: {
    type: String,
    required: true
  },
  defaultExpanded: {
    type: Boolean,
    default: false
  }
});

const isExpanded = ref(props.defaultExpanded);
const copied = ref(false);

const lines = computed(() => props.code.split('\n'));
const lineCount = computed(() => lines.value.length);

const previewLines = computed(() => {
  const lastThreeLines = lines.value.slice(-3);
  return lastThreeLines.join('\n');
});

const displayCode = computed(() => props.code);

function toggleExpand() {
  isExpanded.value = !isExpanded.value;
}

async function copyCode() {
  try {
    await navigator.clipboard.writeText(props.code);
    copied.value = true;
    setTimeout(() => {
      copied.value = false;
    }, 2000);
  } catch (error) {
    console.error('复制失败:', error);
  }
}
</script>
