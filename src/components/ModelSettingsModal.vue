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
            class="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <!-- Header -->
            <div class="sticky top-0 bg-white border-b border-gray-200 px-8 py-6 rounded-t-3xl">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <div class="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center">
                    <Cog6ToothIcon class="w-7 h-7 text-white" />
                  </div>
                  <h2 class="text-2xl font-semibold text-gray-900">模型配置</h2>
                </div>
                <button
                  @click="closeModal"
                  class="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XMarkIcon class="w-6 h-6" />
                </button>
              </div>
            </div>

            <!-- Content -->
            <div class="px-8 py-6 space-y-6">
              <!-- 预设模型选择 -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  预设模型
                </label>
                <select
                  v-model="selectedPreset"
                  @change="applyPreset"
                  class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                >
                  <option value="">自定义配置</option>
                  <option
                    v-for="preset in presets"
                    :key="preset.name"
                    :value="preset.name"
                  >
                    {{ preset.name }}
                  </option>
                </select>
              </div>

              <!-- API 地址 -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  API 地址 *
                </label>
                <input
                  v-model="form.apiUrl"
                  type="url"
                  placeholder="https://api.openai.com/v1"
                  class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                />
                <p class="mt-1 text-xs text-gray-500">
                  OpenAI 标准 API 接口地址（不包含 /chat/completions）
                </p>
              </div>

              <!-- API Key -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  API Key *
                </label>
                <div class="relative">
                  <input
                    v-model="form.apiKey"
                    :type="showApiKey ? 'text' : 'password'"
                    placeholder="sk-..."
                    class="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all font-mono text-sm"
                  />
                  <button
                    @click="showApiKey = !showApiKey"
                    class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <EyeIcon v-if="!showApiKey" class="w-5 h-5" />
                    <EyeSlashIcon v-else class="w-5 h-5" />
                  </button>
                </div>
              </div>

              <!-- 模型名称 -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  模型名称 *
                </label>
                <input
                  v-model="form.modelName"
                  type="text"
                  placeholder="gpt-4o"
                  class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                />
              </div>

              <!-- 测试连接按钮 -->
              <button
                @click="testConnection"
                :disabled="testing || !isFormValid"
                class="w-full py-3 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 text-gray-700 rounded-xl font-medium transition-all flex items-center justify-center gap-2"
              >
                <SignalIcon v-if="!testing" class="w-5 h-5" />
                <ArrowPathIcon v-else class="w-5 h-5 animate-spin" />
                {{ testing ? '测试中...' : '测试连接' }}
              </button>

              <!-- 测试结果 -->
              <div
                v-if="testResult"
                :class="[
                  'p-4 rounded-xl border',
                  testResult.success
                    ? 'bg-green-50 border-green-200'
                    : 'bg-red-50 border-red-200'
                ]"
              >
                <div class="flex items-start gap-2">
                  <CheckCircleIcon
                    v-if="testResult.success"
                    class="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5"
                  />
                  <XCircleIcon
                    v-else
                    class="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5"
                  />
                  <div class="flex-1">
                    <p
                      :class="[
                        'text-sm font-medium',
                        testResult.success ? 'text-green-800' : 'text-red-800'
                      ]"
                    >
                      {{ testResult.message }}
                    </p>
                    <p
                      v-if="testResult.modelInfo"
                      class="text-xs text-green-700 mt-1"
                    >
                      模型: {{ testResult.modelInfo.model }}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Footer -->
            <div class="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-8 py-6 rounded-b-3xl flex gap-3">
              <button
                @click="closeModal"
                class="flex-1 px-6 py-3 border border-gray-300 hover:border-gray-400 text-gray-700 rounded-xl font-medium transition-all hover:bg-white"
              >
                取消
              </button>
              <button
                @click="saveConfig"
                :disabled="!isFormValid"
                class="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-gray-300 disabled:to-gray-400 text-white rounded-xl font-medium transition-all hover:shadow-lg hover:scale-105 disabled:hover:scale-100 disabled:hover:shadow-none"
              >
                保存配置
              </button>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import {
  Cog6ToothIcon,
  XMarkIcon,
  EyeIcon,
  EyeSlashIcon,
  SignalIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/vue/24/outline';
import { testModelConnection } from '../services/aiService';
import { saveModelConfig, getModelConfig } from '../utils/storage';

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['close', 'saved']);

// 预设模型配置
const presets = [
  {
    name: 'OpenAI GPT-4',
    apiUrl: 'https://api.openai.com/v1',
    modelName: 'gpt-4o',
    apiKey: ''
  },
  {
    name: 'OpenAI GPT-3.5',
    apiUrl: 'https://api.openai.com/v1',
    modelName: 'gpt-3.5-turbo',
    apiKey: ''
  },
  {
    name: 'Deepseek',
    apiUrl: 'https://api.deepseek.com/v1',
    modelName: 'deepseek-chat',
    apiKey: ''
  },
  {
    name: 'OpenAI Compatible',
    apiUrl: 'http://localhost:11434/v1',
    modelName: 'llama3',
    apiKey: 'ollama'
  }
];

const selectedPreset = ref('');
const showApiKey = ref(false);
const testing = ref(false);
const testResult = ref(null);

const form = ref({
  apiUrl: '',
  apiKey: '',
  modelName: ''
});

const isFormValid = computed(() => {
  return form.value.apiUrl && form.value.apiKey && form.value.modelName;
});

// 监听 show 变化，加载已保存的配置
watch(() => props.show, (newValue) => {
  if (newValue) {
    loadConfig();
    testResult.value = null;
  }
});

function loadConfig() {
  const config = getModelConfig();
  if (config) {
    form.value = { ...config };
    // 检查是否匹配预设
    const matchedPreset = presets.find(
      p => p.apiUrl === config.apiUrl && p.modelName === config.modelName
    );
    selectedPreset.value = matchedPreset ? matchedPreset.name : '';
  }
}

function applyPreset() {
  if (!selectedPreset.value) return;
  
  const preset = presets.find(p => p.name === selectedPreset.value);
  if (preset) {
    form.value.apiUrl = preset.apiUrl;
    form.value.modelName = preset.modelName;
    // 保留用户之前的 API Key（如果有）
    if (!form.value.apiKey) {
      form.value.apiKey = preset.apiKey;
    }
  }
  testResult.value = null;
}

async function testConnection() {
  if (!isFormValid.value || testing.value) return;
  
  testing.value = true;
  testResult.value = null;
  
  try {
    const result = await testModelConnection(form.value);
    testResult.value = result;
  } catch (error) {
    testResult.value = {
      success: false,
      message: error.message
    };
  } finally {
    testing.value = false;
  }
}

function saveConfig() {
  if (!isFormValid.value) return;
  
  saveModelConfig(form.value);
  emit('saved', form.value);
  closeModal();
}

function closeModal() {
  emit('close');
}
</script>
