<template>
  <footer id="footer" :class="store.footerBlur ? 'blur' : null">
    <div class="power">
      <span>
        <span :class="startYear < fullYear ? 'c-hidden' : 'hidden'">Copyright&nbsp;</span>
        &copy;
        <span v-if="startYear < fullYear" class="site-start">
          {{ startYear }}
          -
        </span>
        {{ fullYear }}
        <a :href="siteUrl">{{ siteAuthor }}</a>
      </span>
      <span class="hidden">
        &amp;&nbsp;Made&nbsp;by
        <a :href="config.github" target="_blank">
          {{ config.author }}
        </a>
      </span>
      <span v-if="siteIcp">
        &amp;
        <a href="https://beian.miit.gov.cn" target="_blank">
          {{ siteIcp }}
        </a>
      </span>
    </div>
  </footer>
</template>

<script setup>
import { mainStore } from "@/store";
import { usePublicConfig } from "@/utils/publicConfig";
import config from "@/../package.json";

const store = mainStore();
const publicConfig = usePublicConfig();
const fullYear = new Date().getFullYear();

// 加载配置数据
const startYear = ref(
  publicConfig.siteSettings.site_start?.length >= 4
    ? publicConfig.siteSettings.site_start.substring(0, 4)
    : null,
);
const siteIcp = computed(() => (publicConfig.siteSettings.site_icp || "").trim());
const siteAuthor = computed(() => publicConfig.siteSettings.site_author);
const siteUrl = computed(() => {
  const url = publicConfig.siteSettings.site_url;
  if (!url) return "https://www.imsyy.top";
  // 判断协议前缀
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    return "//" + url;
  }
  return url;
});

watch(
  () => publicConfig.siteSettings.site_start,
  (value) => {
    startYear.value = value?.length >= 4 ? value.substring(0, 4) : null;
  },
);
</script>

<style lang="scss" scoped>
#footer {
  width: 100%;
  position: absolute;
  bottom: 0;
  left: 0;
  height: 46px;
  line-height: 46px;
  text-align: center;
  z-index: 0;
  font-size: 14px;
  // 文字不换行
  word-break: keep-all;
  white-space: nowrap;
  .power {
    animation: fade 0.3s;
  }
  &.blur {
    backdrop-filter: blur(10px);
    background: rgb(0 0 0 / 25%);
    font-size: 16px;
  }
  .fade-enter-active,
  .fade-leave-active {
    transition: opacity 0.15s ease-in-out;
  }
  @media (max-width: 720px) {
    font-size: 0.9rem;
    &.blur {
      font-size: 0.9rem;
    }
  }
  @media (max-width: 560px) {
    .c-hidden {
      display: none;
    }
  }
  @media (max-width: 480px) {
    .hidden {
      display: none;
    }
  }
}
</style>
