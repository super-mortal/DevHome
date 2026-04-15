# DevHome

一个可自托管的个人主页项目，支持：

- 前台展示页
- `/admin` 后台管理
- SQLite 持久化配置
- Docker 一键部署

## 预览截图

![主页截图](/screenshots/main.png)

## 主要功能

- 站点信息后台可视化管理（标题、图标、作者、备案号、建站时间等）
- 网站列表增删改查
- 社交链接增删改查
- 背景模式：默认壁纸 / 二次元背景 / 固定壁纸（PC 与移动端分流）
- 时光胶囊进度与站点存活天数展示
- 移动端适配

## docker部署

### 部署

1. 从 GitHub 拉取项目

```bash
git clone https://github.com/super-mortal/DevHome.git
cd DevHome
docker compose up -d --build
```

2. 后续从 GitHub 拉取更新

```bash
cd DevHome
git pull
docker compose up -d --build
```

3. 如果只是想重启已有容器：

```bash
docker compose restart
```

### 访问

```markdown
前台（HTTP）：`http://<你的IP>:4127`
前台（HTTPS 转发口）：`https://<你的IP>:4128`
后台：`http://<你的IP>:4127/admin/` 或 `https://<你的IP>:4128/admin/`
API：`http://<你的IP>:3100`
```

### 默认后台账号

- 用户名：`admin`
- 密码：`admin123456`

## 数据持久化说明

- SQLite 文件：`data/site.db`
- Docker 映射：`./data:/app/data`
- 当前项目目录为 `/root/DevHome`，因此宿主机永久数据路径为：`/root/DevHome/data/site.db`

只要 `data` 目录保留，重启容器、重建镜像、拉新代码后再次部署，后台修改的数据都不会丢失

## 注意⚠️

如果后台无法正常登录，还需要在你的域名站点配置文件中，额外增加这一段（核心是 `/api/` 转发）：

```nginx
location /api/ {
    proxy_pass http://127.0.0.1:3100/api/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

然后重载 Nginx：

```bash
sudo nginx -t && sudo systemctl reload nginx
```

## 后台管理说明

后台入口：`/admin` 模块包括：

- 基本设置
- 网站列表
- 社交链接
- 网站统计（Umami 跟踪代码）

### 网站统计（Umami）

- 后台可在 `网站统计` 栏目中填写完整 Umami 跟踪代码
- 默认初始化为空，不会自动启用任何统计脚本
- 只有填写并保存后，前台才会动态注入统计脚本
- 直接粘贴 Umami 后台提供的完整代码即可，例如：

```html
<script defer src="https://你的统计域名/script.js" data-website-id="你的网站ID"></script>
```

## 背景图片资源

位于 `public/images/`：

- 默认随机背景：`background1.jpg` ~ `background10.jpg`
- 固定壁纸（PC）：`web.jpeg`
- 固定壁纸（移动）：`phone.jpg`

## 技术栈

- Vue 3
- Vite
- Element Plus
- Pinia
- Express
- SQLite (better-sqlite3)

## 本地开发

```bash
# 安装依赖
npm install
# 前端开发
npm run dev
# API 开发
npm run dev:api
# 构建
npm run build
```

## 致谢🙏

- 本项目UI设计参考                 [Github](https://github.com/imsyy/home)
- 为本项目提供免费图片API    [LoliAPI](https://loliapi.com)
- 为本项目提供免费名言API    [hitokoto](https://hitokoto.cn)
- 为本项目提供免费访问统计  [umami](https://github.com/umami-software/umami)

## LICENSE

MIT
