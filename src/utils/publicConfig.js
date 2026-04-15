import { reactive } from "vue";
import defaultSiteLinks from "@/assets/siteLinks.json";
import defaultSocialLinks from "@/assets/socialLinks.json";

const API_BASE = "";

const state = reactive({
  loaded: false,
  loading: false,
  siteSettings: {
    site_name: "mortal的主页",
    site_logo: "/images/icon/favicon.ico",
    site_author: "mortal",
    site_custom_name: "mortal",
    site_url: "https://supermortal.cn",
    site_icp: "",
    site_start: "2026-04-15",
    site_main_logo: "https://q1.qlogo.cn/g?b=qq&nk=2169702639&s=640",
    desc_hello: "Hello World!",
    desc_text: "一个建立于 2026.04.15 的小站，存活于互联网的边缘",
    desc_hello_other: "Good!",
    desc_text_other: "哎呀，这都被你发现了（ 再点击一次可关闭 ）",
    umami_tracking_code: "",
  },
  siteLinks: Array.isArray(defaultSiteLinks) ? [...defaultSiteLinks] : [],
  socialLinks: Array.isArray(defaultSocialLinks) ? [...defaultSocialLinks] : [],
});

let loadingPromise = null;

const normalizeSettings = (settings) => ({
  site_name: settings?.site_name || state.siteSettings.site_name,
  site_logo: settings?.site_logo || state.siteSettings.site_logo,
  site_author: settings?.site_author || state.siteSettings.site_author,
  site_custom_name: settings?.site_custom_name || state.siteSettings.site_custom_name,
  site_url: settings?.site_url || state.siteSettings.site_url,
  site_icp: settings?.site_icp || "",
  site_start: settings?.site_start || "",
  site_main_logo: settings?.site_main_logo || state.siteSettings.site_main_logo,
  desc_hello: settings?.desc_hello || state.siteSettings.desc_hello,
  desc_text: settings?.desc_text || state.siteSettings.desc_text,
  desc_hello_other: settings?.desc_hello_other || state.siteSettings.desc_hello_other,
  desc_text_other: settings?.desc_text_other || state.siteSettings.desc_text_other,
  umami_tracking_code: settings?.umami_tracking_code || "",
});

export const loadPublicConfig = async () => {
  if (state.loaded) return state;
  if (loadingPromise) return loadingPromise;

  state.loading = true;
  loadingPromise = fetch(`${API_BASE}/api/public/config`)
    .then(async (res) => {
      if (!res.ok) throw new Error("load config failed");
      return await res.json();
    })
    .then((data) => {
      state.siteSettings = normalizeSettings(data.siteSettings || {});
      if (Array.isArray(data.siteLinks) && data.siteLinks.length) {
        state.siteLinks = data.siteLinks;
      }
      if (Array.isArray(data.socialLinks) && data.socialLinks.length) {
        state.socialLinks = data.socialLinks;
      }
    })
    .catch(() => null)
    .finally(() => {
      state.loaded = true;
      state.loading = false;
      loadingPromise = null;
    });

  await loadingPromise;
  return state;
};

export const usePublicConfig = () => state;
