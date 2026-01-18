import { createRouter, createWebHashHistory } from 'vue-router';
import HomePage from '../views/HomePage.vue';
import DesignPage from '../views/DesignPage.vue';

const routes = [
  {
    path: '/',
    name: 'home',
    component: HomePage
  },
  {
    path: '/design',
    name: 'design',
    component: DesignPage
  }
];

const router = createRouter({
  history: createWebHashHistory(),
  routes
});

export default router;
