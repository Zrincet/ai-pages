<template>
  <Transition
    enter-active-class="transition ease-out duration-300"
    enter-from-class="opacity-0 translate-y-4"
    enter-to-class="opacity-100 translate-y-0"
    leave-active-class="transition ease-in duration-200"
    leave-from-class="opacity-100 translate-y-0"
    leave-to-class="opacity-0 translate-y-4"
  >
    <div
      v-if="visible"
      class="fixed top-4 right-4 z-50 max-w-md w-full"
    >
      <div
        :class="[
          'rounded-2xl shadow-2xl p-4 flex items-start gap-3',
          typeClasses
        ]"
      >
        <component :is="icon" class="w-6 h-6 flex-shrink-0" />
        
        <div class="flex-1 min-w-0">
          <p class="font-medium text-sm">{{ title }}</p>
          <p v-if="message" class="text-sm opacity-90 mt-1">{{ message }}</p>
        </div>
        
        <button
          @click="close"
          class="flex-shrink-0 opacity-70 hover:opacity-100 transition-opacity"
        >
          <XMarkIcon class="w-5 h-5" />
        </button>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  InformationCircleIcon,
  XMarkIcon
} from '@heroicons/vue/24/outline';

const props = defineProps({
  type: {
    type: String,
    default: 'info',
    validator: (value) => ['success', 'error', 'warning', 'info'].includes(value)
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    default: ''
  },
  duration: {
    type: Number,
    default: 3000 // 3秒后自动关闭
  },
  show: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['close']);

const visible = ref(false);
let timer = null;

const icon = computed(() => {
  const icons = {
    success: CheckCircleIcon,
    error: XCircleIcon,
    warning: ExclamationTriangleIcon,
    info: InformationCircleIcon
  };
  return icons[props.type];
});

const typeClasses = computed(() => {
  const classes = {
    success: 'bg-green-50 text-green-800 border border-green-200',
    error: 'bg-red-50 text-red-800 border border-red-200',
    warning: 'bg-yellow-50 text-yellow-800 border border-yellow-200',
    info: 'bg-blue-50 text-blue-800 border border-blue-200'
  };
  return classes[props.type];
});

watch(() => props.show, (newValue) => {
  if (newValue) {
    visible.value = true;
    startTimer();
  }
});

onMounted(() => {
  if (props.show) {
    visible.value = true;
    startTimer();
  }
});

function startTimer() {
  if (timer) {
    clearTimeout(timer);
  }
  
  if (props.duration > 0) {
    timer = setTimeout(() => {
      close();
    }, props.duration);
  }
}

function close() {
  visible.value = false;
  if (timer) {
    clearTimeout(timer);
  }
  emit('close');
}
</script>
