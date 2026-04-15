<template>
  <div class="admin-page">
    <div v-if="!authed" class="login-wrap">
      <el-card class="login-card" shadow="never">
        <h2>管理员登录</h2>
        <p class="login-subtitle">欢迎回来，请输入账号信息</p>
        <el-form :model="loginForm" @submit.prevent="handleLogin">
          <el-form-item>
            <el-input v-model="loginForm.username" placeholder="用户名" />
          </el-form-item>
          <el-form-item>
            <el-input
              v-model="loginForm.password"
              type="password"
              show-password
              placeholder="密码"
              @keydown.enter.prevent="handleLogin"
            />
          </el-form-item>
          <el-button type="primary" class="full" :loading="loading" @click="handleLogin">登录</el-button>
        </el-form>
      </el-card>
    </div>

    <div v-else class="dashboard">
      <aside class="sidebar">
        <div class="brand">Admin</div>
        <el-menu :default-active="active" @select="(v) => (active = v)">
          <el-menu-item index="settings">基本设置</el-menu-item>
          <el-menu-item index="sites">网站列表</el-menu-item>
          <el-menu-item index="socials">社交链接</el-menu-item>
          <el-menu-item index="analytics">网站统计</el-menu-item>
        </el-menu>
        <div class="account-box">
          <el-dropdown trigger="click" @command="handleAccountCommand">
            <div class="account-trigger">
              <span class="avatar">{{ adminName.slice(0, 1).toUpperCase() }}</span>
              <div class="meta">
                <div class="name">{{ adminName }}</div>
                <div class="tip">个人账号设置</div>
              </div>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="password">修改密码</el-dropdown-item>
                <el-dropdown-item command="logout" divided>退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </aside>

      <main class="content">
        <section v-if="active === 'settings'" class="panel">
          <h3>基本设置</h3>
          <el-form label-position="top" :model="settingsForm" class="form-grid">
            <el-form-item label="浏览器标题">
              <el-input v-model="settingsForm.site_name" />
            </el-form-item>
            <el-form-item label="浏览器图标">
              <el-input v-model="settingsForm.site_logo" placeholder="/images/icon/favicon.ico 或 https://..." />
            </el-form-item>
            <el-form-item label="底部栏作者信息">
              <el-input v-model="settingsForm.site_author" />
            </el-form-item>
            <el-form-item label="站点链接">
              <el-input v-model="settingsForm.site_url" placeholder="https://dev.starmortal.com" />
            </el-form-item>
            <el-form-item label="你的名字">
              <el-input v-model="settingsForm.site_custom_name" placeholder="mortal" />
            </el-form-item>
            <el-form-item label="头像链接">
              <el-input
                v-model="settingsForm.site_main_logo"
                placeholder="https://q1.qlogo.cn/g?b=qq&nk=2169702639&s=640"
              />
            </el-form-item>
            <el-form-item label="备案号">
              <el-input v-model="settingsForm.site_icp" placeholder="mortal" />
            </el-form-item>
            <el-form-item label="建站时间">
              <el-date-picker
                v-model="settingsForm.site_start"
                type="date"
                value-format="YYYY-MM-DD"
                format="YYYY-MM-DD"
                placeholder="请选择建站日期"
                class="full-width"
              />
            </el-form-item>
            <el-form-item label="左侧简介主标题">
              <el-input v-model="settingsForm.desc_hello" placeholder="例如 Hello World !" />
            </el-form-item>
            <el-form-item label="左侧简介主内容">
              <el-input v-model="settingsForm.desc_text" placeholder="例如 一个建立于 21 世纪的小站..." />
            </el-form-item>
            <el-form-item label="点击后主标题">
              <el-input v-model="settingsForm.desc_hello_other" placeholder="例如 Oops !" />
            </el-form-item>
            <el-form-item label="点击后主内容">
              <el-input v-model="settingsForm.desc_text_other" placeholder="点击简介卡片后显示的文案" />
            </el-form-item>
          </el-form>
          <el-button type="primary" :loading="saving" @click="saveSettings">保存设置</el-button>
        </section>

        <section v-if="active === 'sites'" class="panel">
          <div class="panel-head">
            <h3>网站列表</h3>
            <el-button type="primary" @click="openSiteDialog()">新增网站</el-button>
          </div>
          <el-table :data="siteLinks" border>
            <el-table-column prop="id" label="ID" width="70" />
            <el-table-column label="图标" width="100">
              <template #default="scope">
                <div class="site-icon-cell">
                  <img
                    v-if="getSiteImageIcon(scope.row.icon)"
                    :src="getSiteImageIcon(scope.row.icon)"
                    class="site-icon-image"
                    alt="icon"
                  />
                  <Icon v-else size="20">
                    <component :is="resolveSiteIcon(scope.row.icon)" />
                  </Icon>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="name" label="名称" />
            <el-table-column prop="link" label="链接" min-width="260" />
            <el-table-column prop="sort" label="排序" width="90" />
            <el-table-column label="启用" width="90">
              <template #default="scope">
                <el-switch :model-value="scope.row.enabled" @change="(v) => updateSiteEnabled(scope.row, v)" />
              </template>
            </el-table-column>
            <el-table-column label="操作" width="180">
              <template #default="scope">
                <el-button link type="primary" @click="openSiteDialog(scope.row)">编辑</el-button>
                <el-button link type="danger" @click="removeSite(scope.row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </section>

        <section v-if="active === 'socials'" class="panel">
          <div class="panel-head">
            <h3>社交链接</h3>
            <el-button type="primary" @click="openSocialDialog()">新增社交</el-button>
          </div>
          <el-table :data="socialLinks" border>
            <el-table-column label="图标" width="86">
              <template #default="scope">
                <img :src="scope.row.icon" class="social-icon-preview" alt="icon" />
              </template>
            </el-table-column>
            <el-table-column prop="name" label="名称" width="120" />
            <el-table-column prop="icon" label="图标地址" min-width="200" />
            <el-table-column prop="url" label="链接" min-width="190" />
            <el-table-column prop="sort" label="排序" width="90" />
            <el-table-column label="启用" width="90">
              <template #default="scope">
                <el-switch :model-value="scope.row.enabled" @change="(v) => updateSocialEnabled(scope.row, v)" />
              </template>
            </el-table-column>
            <el-table-column label="操作" width="140">
              <template #default="scope">
                <el-button link type="primary" @click="openSocialDialog(scope.row)">编辑</el-button>
                <el-button link type="danger" @click="removeSocial(scope.row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </section>

        <section v-if="active === 'analytics'" class="panel">
          <h3>网站统计</h3>
          <p class="panel-desc">请粘贴 Umami 后台提供的完整跟踪代码，不填写则不会启用统计。</p>
          <el-input
            v-model="settingsForm.umami_tracking_code"
            type="textarea"
            :rows="8"
            :placeholder="analyticsPlaceholder"
          />
          <el-button type="primary" :loading="saving" @click="saveSettings">保存设置</el-button>
        </section>
      </main>
    </div>

    <el-dialog v-model="siteDialogVisible" :title="siteForm.id ? '编辑网站' : '新增网站'" width="560px">
      <el-form label-position="top" :model="siteForm">
        <el-form-item label="图标">
          <el-select v-model="siteForm.icon" placeholder="选择图标" class="full-width" popper-class="site-icon-popper">
            <el-option v-for="item in siteIconOptions" :key="item.value" :label="item.label" :value="item.value">
              <div class="site-icon-option">
                <img
                  v-if="item.image"
                  :src="item.image"
                  class="site-icon-image small"
                  alt="icon"
                />
                <Icon v-else size="18">
                  <component :is="item.icon" />
                </Icon>
                <span>{{ item.label }}</span>
              </div>
            </el-option>
          </el-select>
          <div class="site-icon-preview">
            <span>当前图标：</span>
            <img
              v-if="getSiteImageIcon(siteForm.icon)"
              :src="getSiteImageIcon(siteForm.icon)"
              class="site-icon-image"
              alt="icon"
            />
            <Icon v-else size="20">
              <component :is="resolveSiteIcon(siteForm.icon)" />
            </Icon>
            <span class="icon-name">{{ siteForm.icon }}</span>
          </div>
        </el-form-item>
        <el-form-item label="名称">
          <el-input v-model="siteForm.name" />
        </el-form-item>
        <el-form-item label="链接">
          <el-input v-model="siteForm.link" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="siteForm.sort" :min="0" />
        </el-form-item>
        <el-form-item label="启用">
          <el-switch v-model="siteForm.enabled" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="siteDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveSite">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="socialDialogVisible" :title="socialForm.id ? '编辑社交' : '新增社交'" width="560px">
      <el-form label-position="top" :model="socialForm">
        <el-form-item label="名称">
          <el-input v-model="socialForm.name" />
        </el-form-item>
        <el-form-item label="图标地址">
          <el-input v-model="socialForm.icon" />
        </el-form-item>
        <el-form-item label="链接">
          <el-input v-model="socialForm.url" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="socialForm.sort" :min="0" />
        </el-form-item>
        <el-form-item label="启用">
          <el-switch v-model="socialForm.enabled" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="socialDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveSocial">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="passwordDialogVisible" title="修改密码" width="420px">
      <el-form label-position="top" :model="passwordForm">
        <el-form-item label="当前密码">
          <el-input v-model="passwordForm.currentPassword" type="password" show-password />
        </el-form-item>
        <el-form-item label="新密码">
          <el-input v-model="passwordForm.newPassword" type="password" show-password />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="passwordDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handlePasswordUpdate">确认修改</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ElMessage, ElMessageBox } from "element-plus";
import { Icon } from "@vicons/utils";
import { Link, Blog, Cloud, Compass, Book, Fire, LaptopCode, Github, GitAlt } from "@vicons/fa";
import {
  login,
  logout,
  updatePassword,
  setToken,
  clearToken,
  getToken,
  getSettings,
  updateSettings,
  getSiteLinks,
  createSiteLink,
  updateSiteLink,
  deleteSiteLink,
  getSocialLinks,
  createSocialLink,
  updateSocialLink,
  deleteSocialLink,
} from "./api";

const siteIconMap = {
  Blog,
  Cloud,
  Compass,
  Book,
  Fire,
  LaptopCode,
  Github,
  Gitee: GitAlt,
};

const siteIconOptions = [
  { value: "Blog", label: "Blog", icon: Blog },
  { value: "Cloud", label: "Cloud", icon: Cloud },
  { value: "Compass", label: "Compass", icon: Compass },
  { value: "Book", label: "Book", icon: Book },
  { value: "Fire", label: "Fire", icon: Fire },
  { value: "LaptopCode", label: "LaptopCode", icon: LaptopCode },
  { value: "Github", label: "Github", icon: Github },
  { value: "Gitee", label: "Gitee", icon: GitAlt, image: "/images/icon/gitee.png" },
];

const resolveSiteIcon = (iconName) => siteIconMap[iconName] || Link;
const getSiteImageIcon = (iconName) => (iconName === "Gitee" ? "/images/icon/gitee.png" : "");

const authed = ref(Boolean(getToken()));
const loading = ref(false);
const saving = ref(false);
const active = ref("settings");
const adminName = ref("admin");
const analyticsPlaceholder = "请填写你的 umami 统计脚本";

const loginForm = reactive({ username: "", password: "" });
const settingsForm = reactive({
  site_name: "",
  site_logo: "",
  site_author: "",
  site_custom_name: "mortal",
  site_main_logo: "",
  site_url: "",
  site_icp: "",
  site_start: "",
  desc_hello: "",
  desc_text: "",
  desc_hello_other: "",
  desc_text_other: "",
  umami_tracking_code: "",
});

const siteLinks = ref([]);
const socialLinks = ref([]);

const siteDialogVisible = ref(false);
const socialDialogVisible = ref(false);
const passwordDialogVisible = ref(false);

const siteForm = reactive({ id: null, icon: "Blog", name: "", link: "", sort: 0, enabled: true });
const socialForm = reactive({ id: null, name: "", icon: "", url: "", sort: 0, enabled: true });
const passwordForm = reactive({ currentPassword: "", newPassword: "" });

const resetSiteForm = () => {
  Object.assign(siteForm, { id: null, icon: "Blog", name: "", link: "", sort: 0, enabled: true });
};

const resetSocialForm = () => {
  Object.assign(socialForm, { id: null, name: "", icon: "", url: "", sort: 0, enabled: true });
};

const loadAll = async () => {
  const [settings, sites, socials] = await Promise.all([getSettings(), getSiteLinks(), getSocialLinks()]);
  Object.assign(settingsForm, settings);
  siteLinks.value = sites;
  socialLinks.value = socials;
};

const handleLogin = async () => {
  if (!loginForm.username || !loginForm.password) {
    ElMessage.warning("请输入用户名和密码");
    return;
  }
  try {
    loading.value = true;
    const res = await login(loginForm);
    setToken(res.token);
    adminName.value = res.username || "admin";
    authed.value = true;
    await loadAll();
    ElMessage.success("登录成功");
  } catch (error) {
    ElMessage.error(error.message || "登录失败");
  } finally {
    loading.value = false;
  }
};

const handleLogout = async () => {
  try {
    await logout();
  } catch {
    // ignore
  }
  clearToken();
  authed.value = false;
  ElMessage.success("已退出登录");
};

const handleAccountCommand = async (command) => {
  if (command === "logout") {
    await handleLogout();
    return;
  }
  if (command === "password") {
    passwordForm.currentPassword = "";
    passwordForm.newPassword = "";
    passwordDialogVisible.value = true;
  }
};

const handlePasswordUpdate = async () => {
  if (!passwordForm.currentPassword || !passwordForm.newPassword) {
    ElMessage.warning("请填写完整密码信息");
    return;
  }
  if (passwordForm.newPassword.length < 6) {
    ElMessage.warning("新密码至少 6 位");
    return;
  }
  try {
    await updatePassword(passwordForm);
    passwordDialogVisible.value = false;
    ElMessage.success("密码修改成功");
  } catch (error) {
    ElMessage.error(error.message || "密码修改失败");
  }
};

const saveSettings = async () => {
  try {
    saving.value = true;
    await updateSettings(settingsForm);
    ElMessage.success("基本设置已保存");
  } catch (error) {
    if (error.status === 401) {
      authed.value = false;
      ElMessage.error("登录已失效，请重新登录后再保存");
      return;
    }
    ElMessage.error(error.message || "保存失败");
  } finally {
    saving.value = false;
  }
};

const openSiteDialog = (row) => {
  resetSiteForm();
  if (row) Object.assign(siteForm, row);
  siteDialogVisible.value = true;
};

const openSocialDialog = (row) => {
  resetSocialForm();
  if (row) Object.assign(socialForm, row);
  socialDialogVisible.value = true;
};

const saveSite = async () => {
  try {
    if (siteForm.id) {
      await updateSiteLink(siteForm.id, siteForm);
    } else {
      await createSiteLink(siteForm);
    }
    siteDialogVisible.value = false;
    siteLinks.value = await getSiteLinks();
    ElMessage.success("网站列表已更新");
  } catch (error) {
    ElMessage.error(error.message || "保存失败");
  }
};

const saveSocial = async () => {
  try {
    if (socialForm.id) {
      await updateSocialLink(socialForm.id, socialForm);
    } else {
      await createSocialLink(socialForm);
    }
    socialDialogVisible.value = false;
    socialLinks.value = await getSocialLinks();
    ElMessage.success("社交链接已更新");
  } catch (error) {
    ElMessage.error(error.message || "保存失败");
  }
};

const removeSite = async (row) => {
  try {
    await ElMessageBox.confirm(`确认删除网站「${row.name}」吗？`, "提示", { type: "warning" });
    await deleteSiteLink(row.id);
    siteLinks.value = await getSiteLinks();
    ElMessage.success("删除成功");
  } catch {
    // ignore
  }
};

const removeSocial = async (row) => {
  try {
    await ElMessageBox.confirm(`确认删除社交「${row.name}」吗？`, "提示", { type: "warning" });
    await deleteSocialLink(row.id);
    socialLinks.value = await getSocialLinks();
    ElMessage.success("删除成功");
  } catch {
    // ignore
  }
};

const updateSiteEnabled = async (row, enabled) => {
  try {
    await updateSiteLink(row.id, { enabled });
    row.enabled = enabled;
  } catch (error) {
    ElMessage.error(error.message || "更新失败");
  }
};

const updateSocialEnabled = async (row, enabled) => {
  try {
    await updateSocialLink(row.id, { enabled });
    row.enabled = enabled;
  } catch (error) {
    ElMessage.error(error.message || "更新失败");
  }
};

onMounted(async () => {
  if (!authed.value) return;
  try {
    await loadAll();
  } catch {
    clearToken();
    authed.value = false;
  }
});
</script>

<style scoped>
.admin-page {
  min-height: 100vh;
  background: #fff;
  color: #111827;
}

.login-wrap {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fff;
}

.login-card {
  width: 500px;
  border-radius: 16px;
  border: 1px solid #dbe2ea;
  padding: 10px 14px;
}

.login-card h2 {
  margin: 0 0 8px;
  text-align: center;
  font-size: 30px;
}

.login-subtitle {
  margin: 0 0 20px;
  text-align: center;
  color: #6b7280;
  font-size: 14px;
}

.full {
  width: 100%;
}

.dashboard {
  display: grid;
  grid-template-columns: 240px 1fr;
  min-height: 100vh;
}

.sidebar {
  border-right: 1px solid #e5e7eb;
  padding: 24px 18px 24px 24px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

:deep(.el-menu) {
  border-right: none;
  margin-left: 2px;
}

:deep(.el-menu-item) {
  height: 42px;
  line-height: 42px;
  border-radius: 8px;
  margin-bottom: 6px;
}

.account-box {
  margin-top: auto;
  padding: 0 8px;
}

.account-trigger {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  border-radius: 10px;
  background: #f3f4f6;
  cursor: pointer;
}

.avatar {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #111827;
  color: #fff;
  font-weight: 600;
}

.meta .name {
  font-size: 14px;
  line-height: 1.2;
}

.meta .tip {
  font-size: 12px;
  color: #6b7280;
}

.social-icon-preview {
  width: 22px;
  height: 22px;
  object-fit: contain;
  display: block;
  margin: 0 auto;
}

.site-icon-cell {
  display: flex;
  align-items: center;
  justify-content: center;
}

.site-icon-image {
  width: 20px;
  height: 20px;
  object-fit: contain;
}

.site-icon-image.small {
  width: 18px;
  height: 18px;
}

.site-icon-option {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.site-icon-preview {
  margin-top: 8px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: #4b5563;
  font-size: 13px;
}

.site-icon-preview .icon-name {
  color: #6b7280;
}

.brand {
  font-size: 20px;
  font-weight: 700;
  padding: 0 8px;
}

.content {
  padding: 20px 24px;
  background: #f8fafc;
}

.panel {
  background: #fff;
  border-radius: 14px;
  border: 1px solid #e5e7eb;
  padding: 18px;
}

:deep(.el-table td),
:deep(.el-table th) {
  padding: 6px 0;
}

.full-width {
  width: 100%;
}

.panel h3 {
  margin-top: 0;
}

.panel-desc {
  color: #6b7280;
  font-size: 14px;
  margin-bottom: 16px;
}

.panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px 14px;
}

@media (max-width: 900px) {
  .dashboard {
    grid-template-columns: 1fr;
  }

  .sidebar {
    border-right: none;
    border-bottom: 1px solid #e5e7eb;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }
}
</style>
