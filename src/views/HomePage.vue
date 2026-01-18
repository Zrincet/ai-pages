<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-50 via-sky-50 to-cyan-50 flex flex-col">
    <!-- Header -->
    <header class="p-6">
      <div class="max-w-7xl mx-auto flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center">
            <SparklesIcon class="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 class="text-2xl font-bold text-gray-900">AI Pages</h1>
            <p class="text-sm text-gray-600">通过自然语言描述，生成优雅的单页应用</p>
          </div>
        </div>

        <div class="flex items-center gap-3">
          <button
            @click="showHistory = true"
            class="p-3 bg-white hover:bg-gray-50 rounded-xl shadow-soft transition-all hover:shadow-lg hover:scale-105 flex items-center gap-2"
            title="历史记录"
          >
            <ClockIcon class="w-5 h-5 text-gray-700" />
            <span class="text-sm font-medium text-gray-700 hidden sm:inline">历史记录</span>
          </button>
          <button
            @click="showSettings = true"
            class="p-3 bg-white hover:bg-gray-50 rounded-xl shadow-soft transition-all hover:shadow-lg hover:scale-105"
            title="模型设置"
          >
            <Cog6ToothIcon class="w-5 h-5 text-gray-700" />
          </button>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="flex-1 flex items-center justify-center p-6">
      <div class="max-w-3xl w-full">
        <!-- Title -->
        <div class="text-center mb-12">
          <h2 class="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            描述您的想法
          </h2>
          <p class="text-lg text-gray-600">
            用自然语言描述您想要的页面，AI 将为您生成完整的 HTML
          </p>
        </div>

        <!-- Input Card -->
        <div class="bg-white rounded-3xl shadow-2xl p-8 mb-6">
          <textarea
            v-model="description"
            placeholder="例如：创建一个优雅的个人简历页面，包含头像、姓名、技能列表和联系方式..."
            class="w-full h-40 resize-none border-0 focus:outline-none text-gray-900 placeholder-gray-400 text-lg"
            @keydown.enter.ctrl="handleGenerate"
          ></textarea>

          <div class="flex items-center justify-between mt-6 pt-6 border-t border-gray-200">
            <p class="text-sm text-gray-500">
              按 Ctrl+Enter 快速生成
            </p>
            <button
              @click="handleGenerate"
              :disabled="!description.trim()"
              class="px-8 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-gray-300 disabled:to-gray-400 text-white rounded-xl font-medium transition-all hover:shadow-lg hover:scale-105 disabled:hover:scale-100 disabled:hover:shadow-none flex items-center gap-2"
            >
              <SparklesIcon class="w-5 h-5" />
              开始生成
            </button>
          </div>
        </div>

        <!-- Examples -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <button
            v-for="example in examples"
            :key="example.title"
            @click="useExample(example.description)"
            class="text-left p-4 bg-white bg-opacity-60 hover:bg-opacity-100 rounded-2xl border border-gray-200 hover:border-primary-300 transition-all hover:shadow-lg group"
          >
            <component :is="example.icon" class="w-6 h-6 text-primary-600 mb-2" />
            <h3 class="font-medium text-gray-900 mb-1 group-hover:text-primary-600 transition-colors">
              {{ example.title }}
            </h3>
            <p class="text-sm text-gray-600">{{ example.subtitle }}</p>
          </button>
        </div>
      </div>
    </main>

    <!-- Footer -->
    <footer class="p-6 text-center text-sm text-gray-500">
      <p>
        Powered by AI • 基于阿里云 ESA 边缘存储
      </p>
    </footer>

    <!-- Modals -->
    <ModelSettingsModal
      :show="showSettings"
      @close="showSettings = false"
      @saved="onModelSaved"
    />

    <HistoryPanel
      :show="showHistory"
      @close="showHistory = false"
      @open-page="onOpenPage"
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
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { getOfficialConfig } from '../services/configService';
import {
  SparklesIcon,
  Cog6ToothIcon,
  ClockIcon,
  UserCircleIcon,
  ShoppingBagIcon,
  PresentationChartLineIcon
} from '@heroicons/vue/24/outline';
import ModelSettingsModal from '../components/ModelSettingsModal.vue';
import HistoryPanel from '../components/HistoryPanel.vue';
import ToastNotification from '../components/ToastNotification.vue';
import { hasAnyConfig } from '../utils/storage';

const router = useRouter();

const description = ref('');
const showSettings = ref(false);
const showHistory = ref(false);
const toast = ref({
  show: false,
  type: 'info',
  title: '',
  message: ''
});

const examples = [
  {
    title: '个人简历',
    subtitle: '优雅的简历页面',
    description: '创建一个现代简约风格的个人简历页面，包含个人信息、工作经历、技能列表和联系方式',
    icon: UserCircleIcon
  },
  {
    title: '产品展示',
    subtitle: '产品介绍落地页',
    description: '创建一个产品展示落地页，包含产品特性介绍、定价表格和立即购买按钮',
    icon: ShoppingBagIcon
  },
  {
    title: '数据仪表盘',
    subtitle: '可视化数据面板',
    description: '创建一个数据可视化仪表盘页面，包含多个数据卡片、图表展示和统计信息',
    icon: PresentationChartLineIcon
  }
];

onMounted(async () => {
  // 检查是否有可用的配置（用户配置或官方配置）
  const hasConfig = await hasAnyConfig();
  
  // 只有在没有任何配置时才弹窗提示
  if (!hasConfig) {
    setTimeout(() => {
      showSettings.value = true;
      showToast('info', '欢迎使用', '请先配置大模型 API 以开始使用');
    }, 500);
  }
});

function useExample(text) {
  description.value = text;
}

async function handleGenerate() {
  if (!description.value.trim()) return;

  // 检查是否已配置模型（用户配置或官方配置）
  const hasConfig = await hasAnyConfig();
  if (!hasConfig) {
    showSettings.value = true;
    showToast('warning', '请先配置模型', '需要配置大模型 API 才能生成页面');
    return;
  }

  // 跳转到设计页面
  router.push({
    name: 'design',
    query: {
      prompt: description.value
    }
  });
}

function onModelSaved() {
  showToast('success', '配置已保存', '模型配置已成功保存');
}

function onOpenPage(item) {
  if (item.isDraft) {
    // 草稿：直接跳到设计页面，会自动加载保存的对话
    router.push('/design');
  } else {
    // 已发布：跳转到设计页面查看
    router.push({
      name: 'design',
      query: {
        uuid: item.uuid
      }
    });
  }
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
