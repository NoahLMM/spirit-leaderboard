import { createApp } from "vue";
import App from "./App.vue";
import { router } from "./router";
import { config } from "./config";
import "./style.css";

document.title = config.siteTitle;

const app = createApp(App);
app.use(router);
app.mount("#app");
