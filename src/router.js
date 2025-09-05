import { createRouter, createWebHistory } from "vue-router";
import Home from "./views/Home.vue";
import Submit from "./views/Submit.vue";

const routes = [
  { path: "/", component: Home },
  { path: "/submit", component: Submit },
];

export const router = createRouter({
  history: createWebHistory(),
  routes,
});
