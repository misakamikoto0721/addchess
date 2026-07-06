# 腾讯云部署（前端 + 联机后端）

推荐 **腾讯云轻量应用服务器（香港）** + 域名，前后端同一台机器。

| 用途 | 地址（示例） |
|------|----------------|
| **网页** | `https://addchess.cn` |
| **联机 WebSocket** | `wss://ws.addchess.cn` |
| **健康检查** | `https://ws.addchess.cn/health` |

---

## 0. DNS 解析（DNSPod）

| 主机记录 | 类型 | 记录值 |
|----------|------|--------|
| `@` | A | 服务器公网 IP |
| `www` | A | 同上 |
| `ws` | A | 同上 |

---

## 1. 服务器环境（一次性）

OrcaTerm / SSH 登录后：

```bash
sudo apt update
sudo apt install -y git nginx certbot python3-certbot-nginx rsync
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pm2
```

防火墙放行 **22、80、443**。

---

## 2. 克隆仓库与配置

```bash
git clone https://github.com/misakamikoto0721/addchess.git
cd addchess
cp deploy/config.env.example deploy/config.env
# 若域名不同，编辑 deploy/config.env
```

`deploy/config.env` 示例：

```bash
ADDCHESS_DOMAIN=addchess.cn
ADDCHESS_WS_HOST=ws.addchess.cn
ADDCHESS_WEB_ROOT=/var/www/addchess
VITE_WS_URL=wss://ws.addchess.cn
PUBLIC_WS_URL=wss://ws.addchess.cn
```

---

## 3. Nginx（一次性）

若 **尚未** 配置 Nginx：

```bash
cd ~/addchess
bash scripts/install-nginx-site.sh
sudo certbot --nginx -d addchess.cn -d www.addchess.cn -d ws.addchess.cn
```

若 **已经** 只有 `ws.addchess.cn` 的反代，可改为完整站点：

```bash
cd ~/addchess
bash scripts/install-nginx-site.sh
sudo certbot --nginx -d addchess.cn -d www.addchess.cn -d ws.addchess.cn
sudo systemctl reload nginx
```

---

## 4. 构建并发布（首次 + 以后更新）

```bash
cd ~/addchess
git pull
bash scripts/deploy-all.sh
pm2 startup   # 首次：按提示执行打印出的 sudo 命令
```

验证：

```bash
curl -s http://127.0.0.1:3000/health
curl -sI https://addchess.cn | head -n 1
```

浏览器打开 **https://addchess.cn** → **联机对战**，应显示 `wss://ws.addchess.cn`。

---

## 5. 本地开发（可选）

```bash
cp packages/app/.env.development.example packages/app/.env.development.local
# 取消注释 VITE_WS_URL=wss://ws.addchess.cn 可连云端后端
npm run dev
```

生产构建联机地址见 `packages/app/.env.production.example`。

---

## 6. 公网加载慢（排查与修复）

**现象**：打开 `https://addchess.cn` 长时间白屏，各网络都慢。

**在浏览器 Network 里看**（Disable cache + 硬刷新）：

| 检查项 | 正常 | 你服务器上常见异常 |
|--------|------|-------------------|
| 主 JS `index-*.js` 的 **Content-Encoding** | `gzip` | **没有**（体积 ~226 KB 原文） |
| 主 JS gzip 后体积 | ~70 KB | 未压缩 |
| 首屏 HTML | 有「加载中…」占位 | 空白直到 JS 跑完 |

**根因（与 dev 无关）**：

1. **Nginx 未开 gzip** — 浏览器即使用 gzip 请求，仍收到 226 KB 原文（可用下面命令自测）。
2. **整页 UI 全靠 JS** — React 跑起来之前页面是空的；主包还含 React + 棋规引擎，下载后要 **解析/编译** 才能出联机大厅。
3. **静态资源无长期缓存** — 每次访问都重新拉 JS（已在新版 Nginx 配置里为 `/assets/` 加了 `immutable`）。

**一次性修复 gzip（已有站点，在 VPS 执行）**：

```bash
cd ~/addchess && git pull
bash scripts/enable-nginx-gzip.sh
```

若报错 `"gzip" directive is duplicate`，说明主配置里已有 `gzip on`，**不要**在 conf.d 里再写一行 `gzip on`。仓库里的 `nginx-gzip.conf.example` 只补充 `gzip_types`（含 JS/CSS）。

```bash
cd ~/addchess && git pull
bash scripts/enable-nginx-gzip.sh
```

验证要测 **JS 文件**，不要只测首页 HTML（默认只压 text/html）：

```bash
curl -sI -H "Accept-Encoding: gzip" https://addchess.cn/assets/index-*.js | egrep -i 'content-encoding|content-length'
# 应有 Content-Encoding: gzip，且不应再是 Content-Length: 226414
```

验证 gzip 已生效：

```bash
curl -sI -H "Accept-Encoding: gzip" https://addchess.cn/assets/index-*.js | grep -i content-encoding
# 应看到: Content-Encoding: gzip
```

然后重新部署前端（含 index 占位文案）：

```bash
bash scripts/deploy-all.sh
```

---

## 7. 常见问题

**联机连不上**  
- `curl https://ws.addchess.cn/health` 是否 `ok:true`  
- 前端是否用 `deploy-all.sh` 重新构建（内含 `VITE_WS_URL`）  
- 防火墙是否放行 443  

**页面 404**  
- `ls /var/www/addchess/index.html` 是否存在  
- Nginx `root` 是否指向 `/var/www/addchess`  
