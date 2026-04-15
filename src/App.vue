<template>
  <!-- 加载 -->
  <Loading />
  <!-- 壁纸 -->
  <Background @loadComplete="loadComplete" />
  <!-- 主界面 -->
  <Transition name="fade" mode="out-in">
    <main id="main" v-if="store.imgLoadStatus">
      <div class="container" v-show="!store.backgroundShow">
        <section class="all" v-show="!store.setOpenState">
          <MainLeft />
          <MainRight v-show="!store.boxOpenState" />
          <Box v-show="store.boxOpenState" />
        </section>
        <section class="more" v-show="store.setOpenState" @click="store.setOpenState = false">
          <MoreSet />
        </section>
      </div>
      <!-- 移动端菜单按钮 -->
      <Icon
        class="menu"
        size="24"
        v-show="!store.backgroundShow"
        @click="store.mobileOpenState = !store.mobileOpenState"
      >
        <component :is="store.mobileOpenState ? CloseSmall : HamburgerButton" />
      </Icon>
      <!-- 页脚 -->
      <Transition name="fade" mode="out-in">
        <Footer class="f-ter" v-show="!store.backgroundShow && !store.setOpenState" />
      </Transition>
    </main>
  </Transition>
</template>

<script setup>
import { helloInit, checkDays } from "@/utils/getTime.js";
import { HamburgerButton, CloseSmall } from "@icon-park/vue-next";
import { mainStore } from "@/store";
import { Icon } from "@vicons/utils";
import Loading from "@/components/Loading.vue";
import MainLeft from "@/views/Main/Left.vue";
import MainRight from "@/views/Main/Right.vue";
import Background from "@/components/Background.vue";
import Footer from "@/components/Footer.vue";
import Box from "@/views/Box/index.vue";
import MoreSet from "@/views/MoreSet/index.vue";
import cursorInit from "@/utils/cursor.js";
import { loadPublicConfig, usePublicConfig } from "@/utils/publicConfig";
import config from "@/../package.json";

const store = mainStore();
const publicConfig = usePublicConfig();

const injectUmamiTracking = (trackingCode) => {
  if (!trackingCode) return;

  const temp = document.createElement("div");
  temp.innerHTML = trackingCode;

  const sourceScript = temp.querySelector("script");
  if (!sourceScript) return;

  const websiteId = sourceScript.getAttribute("data-website-id");
  if (websiteId && document.querySelector(`script[data-website-id="${websiteId}"]`)) {
    return;
  }

  const script = document.createElement("script");
  for (const attr of sourceScript.attributes) {
    script.setAttribute(attr.name, attr.value);
  }

  document.head.appendChild(script);
};

// 页面宽度
const getWidth = () => {
  store.setInnerWidth(window.innerWidth);
};

// 加载完成事件
const loadComplete = () => {
  nextTick(() => {
    // 欢迎提示
    helloInit();
    // 默哀模式
    checkDays();
  });
};

// 监听宽度变化
watch(
  () => store.innerWidth,
  (value) => {
    if (value < 721) {
      store.boxOpenState = false;
      store.setOpenState = false;
    }
  },
);

onMounted(() => {
  loadPublicConfig().then(() => {
    document.title = publicConfig.siteSettings.site_name;
    const iconHref = publicConfig.siteSettings.site_logo;
    const umamiTrackingCode = publicConfig.siteSettings.umami_tracking_code;
    if (iconHref) {
      const linkEl =
        document.querySelector("link[rel='icon']") ||
        Object.assign(document.createElement("link"), { rel: "icon" });
      linkEl.setAttribute("href", iconHref);
      if (!linkEl.parentNode) {
        document.head.appendChild(linkEl);
      }
    }
    injectUmamiTracking(umamiTrackingCode);
  });

  // 自定义鼠标
  cursorInit();

  // 鼠标中键事件
  window.addEventListener("mousedown", (event) => {
    if (event.button == 1) {
      store.backgroundShow = !store.backgroundShow;
      ElMessage({
        message: `已${store.backgroundShow ? "开启" : "退出"}壁纸展示状态`,
        grouping: true,
      });
    }
  });

  // 监听当前页面宽度
  getWidth();
  window.addEventListener("resize", getWidth);

  // 控制台输出
  const styleContent = "color: rgb(30,152,255);";
  const content = `\n\n版本: ${config.version}\n博客: https://supermortal.cn\nGithub: ${config.github}`;
  console.info(`%c${content}`, styleContent);

});

onBeforeUnmount(() => {
  window.removeEventListener("resize", getWidth);
});

watch(
  () => [publicConfig.siteSettings.site_name, publicConfig.siteSettings.site_logo],
  ([siteName, siteLogo]) => {
    if (siteName) {
      document.title = siteName;
    }
    if (siteLogo) {
      const linkEl =
        document.querySelector("link[rel='icon']") ||
        Object.assign(document.createElement("link"), { rel: "icon" });
      linkEl.setAttribute("href", siteLogo);
      if (!linkEl.parentNode) {
        document.head.appendChild(linkEl);
      }
    }
  },
);
</script>

<style lang="scss" scoped>
#main {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  transform: scale(1.2);
  transition: transform 0.3s;
  animation: fade-blur-main-in 0.65s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
  animation-delay: 0.5s;
  .container {
    width: 100%;
    height: 100dvh;
    margin: 0 auto;
    padding: 0 0.5vw;
    .all {
      width: 100%;
      height: calc(100% - 46px);
      padding: 0 0.75rem;
      display: flex;
      flex-direction: row;
      justify-content: center;
      align-items: center;
    }
    .more {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: #00000080;
      backdrop-filter: blur(20px);
      z-index: 2;
      animation: fade 0.5s;
    }
    @media (max-width: 1200px) {
      padding: 0 2vw;
    }
  }
  .menu {
    position: absolute;
    display: flex;
    justify-content: center;
    align-items: center;
    top: 84%;
    left: calc(50% - 28px);
    width: 56px;
    height: 34px;
    background: rgb(0 0 0 / 20%);
    backdrop-filter: blur(10px);
    border-radius: 6px;
    transition: transform 0.3s;
    animation: fade 0.5s;
    &:active {
      transform: scale(0.95);
    }
    .i-icon {
      transform: translateY(2px);
    }
    @media (min-width: 721px) {
      display: none;
    }
  }

  @media (max-width: 390px) {
    overflow-x: auto;
    .container {
      width: 391px;
    }
    .menu {
      left: 167.5px; // 391px * 0.5 - 28px
    }
    .f-ter {
      width: 391px;
    }
    @media (min-height: 721px) {
      overflow-y: hidden;
    }
  }
}
</style>
