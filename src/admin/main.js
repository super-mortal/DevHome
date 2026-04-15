import { createApp } from "vue";
import { createPinia } from "pinia";
import ElementPlus from "element-plus";
import "element-plus/dist/index.css";
import AdminApp from "./AdminApp.vue";

const app = createApp(AdminApp);
app.use(createPinia());
app.use(ElementPlus);
app.mount("#admin-app");
