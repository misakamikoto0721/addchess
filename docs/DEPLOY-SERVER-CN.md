# 国内部署联机后端（替代 Railway）

前端继续用 **Vercel**；只把 `@addchess/server` 放到国内能 **支付宝 / 微信** 付款的云主机上。

推荐：**腾讯云轻量应用服务器（香港）** 或 **雨云** 云服务器（香港）。  
选香港节点通常 **不用 ICP 备案**，适合个人小项目。

---

## 1. 买什么

| 项目 | 建议 |
|------|------|
| 配置 | 1 核 1G 内存即可 |
| 系统 | Ubuntu 22.04 |
| 地域 | **香港**（免备案，Vercel 前端也能连） |
| 付款 | 腾讯云 / 雨云均支持国内支付方式 |

购机后在防火墙 / 安全组放行：**22（SSH）**、**80**、**443**。  
Node 进程只监听本机 `3000`，对外由 Nginx 提供 HTTPS + WebSocket。

---

## 2. 服务器上安装环境

SSH 登录后：

```bash
sudo apt update
sudo apt install -y git nginx certbot python3-certbot-nginx

# Node 22（示例：NodeSource）
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

sudo npm install -g pm2
```

---

## 3. 拉代码并构建

```bash
git clone https://github.com/misakamikoto0721/addchess.git
cd addchess
npm ci
npm run build --workspace=@addchess/server
```

验证本地能起：

```bash
PORT=3000 HOST=0.0.0.0 npm run start:server
# 另开终端：curl http://127.0.0.1:3000/health
# Ctrl+C 停掉，改用 pm2
```

---

## 4. 用 PM2 常驻运行

仓库根目录已有 `ecosystem.config.cjs`：

```bash
cd ~/addchess
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup    # 按提示执行它打印的那条 sudo 命令
```

---

## 5. 域名 + HTTPS（必须，否则 Vercel 页面连不上 wss）

浏览器从 `https://addchess.vercel.app` 发起联机，后端必须是 **`wss://` 且证书可信**。

1. 买一个域名（任意注册商），添加 **A 记录** → 指向服务器公网 IP  
   例如：`ws.你的域名.com`
2. 复制 `deploy/nginx-addchess.conf.example`，改 `server_name` 后放到 Nginx
3. 申请证书：

```bash
sudo certbot --nginx -d ws.你的域名.com
```

4. 在 `ecosystem.config.cjs` 里设置环境变量后重启：

```bash
# 编辑 ecosystem.config.cjs，取消注释并填写：
# PUBLIC_WS_URL: "wss://ws.你的域名.com"

pm2 restart addchess-server
```

5. 浏览器访问：`https://ws.你的域名.com/health`  
   应返回 `{"ok":true,...,"ws":"wss://ws.你的域名.com"}`

---

## 6. 改 Vercel 前端

Vercel → 项目 **addchess** → **Environment Variables**：

| Key | Value |
|-----|--------|
| `VITE_WS_URL` | `wss://ws.你的域名.com` |

保存 → **Deployments** → **Redeploy**。

---

## 7. 以后更新后端

```bash
cd ~/addchess
git pull
bash scripts/server-update.sh
```

---

## 8. 和 Railway 的区别

| | Railway | 国内 VPS |
|--|---------|----------|
| 付款 | 国际信用卡 | 支付宝 / 微信 |
| 运维 | 平台托管 | 自己 SSH + pm2 |
| WebSocket | 平台域名 | 需自备域名 + Nginx |
| 费用 | ~$5/月起 | 轻量机约几十元/年（活动价） |

Railway 上的服务可以停用，避免继续扣费。

---

## 9. 常见问题

**创建房间一直连不上**  
- 查 `curl https://ws.你的域名.com/health`  
- Vercel 是否 Redeploy 且 `VITE_WS_URL` 为 `wss://`  
- 安全组是否放行 443  

**只有 IP 没有域名**  
- HTTPS 页面无法稳定连 `wss://IP`（证书问题），建议买一个便宜域名  

**仍想零运维**  
- 可继续用 Railway Free（$1/月额度，有国际卡时）或本地 `npm run dev:server` 局域网联机  
