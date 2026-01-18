import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router'
import { getOfficialConfig } from './services/configService'

// 预加载官方配置
getOfficialConfig().then(config => {
  if (config) {
    console.log('官方配置已加载');
  }
}).catch(err => {
  console.error('加载官方配置失败:', err);
});

createApp(App)
  .use(router)
  .mount('#app')
