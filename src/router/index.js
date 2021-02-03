import Vue from "vue";
import Router from "vue-router";
import Home from "../views/Home.vue";
import UploadFiles from "../views/UploadFiles.vue";
import { authGuard } from "../auth";

Vue.use(Router);

const router = new Router({
  mode: "history",
  base: process.env.BASE_URL,
  routes: [
    {
      path: "/",
      name: "home",
      component: Home
    },
    {
      path: "/upload",
      name: "UploadFiles",
      component: UploadFiles,
      beforeEnter: authGuard
    }
  ]
});

export default router;
