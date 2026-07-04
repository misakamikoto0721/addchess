# 腾讯云部署（前端 + 联机后端）

推荐 **腾讯云轻量应用服务器（香港）** + 域名，前后端同一台机器，国内访问比 Vercel 稳定。

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

## 6. 与 Vercel 的关系

| | Vercel | 腾讯云香港 |
|--|--------|------------|
| 国内访问 | 常超时 | 较稳定 |
| 前端 | `*.vercel.app` | `addchess.cn` |
| 后端 | 需另购 Railway 等 | 同机 `ws.addchess.cn` |

迁移完成后可停用 Vercel 项目，避免混淆。

---

## 7. 常见问题

**联机连不上**  
- `curl https://ws.addchess.cn/health` 是否 `ok:true`  
- 前端是否用 `deploy-all.sh` 重新构建（内含 `VITE_WS_URL`）  
- 防火墙是否放行 443  

**页面 404**  
- `ls /var/www/addchess/index.html` 是否存在  
- Nginx `root` 是否指向 `/var/www/addchess`  

**仍用 Railway**  
- 仅后端可继续用 Railway；前端仍建议迁到国内 VPS 以改善访问。
