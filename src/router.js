import { createRouter, createWebHistory } from "vue-router";
import Home from "./views/Home.vue";
import Submit from "./views/Submit.vue";
import Challenges from "./views/Challenges.vue";

const routes = [
  { path: "/", component: Home },
  { path: "/submit", component: Submit },
  { path: "/challenges", component: Challenges },
];

export const router = createRouter({
  history: createWebHistory(),
  routes,
});
