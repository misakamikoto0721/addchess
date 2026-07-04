/** PM2 config for a VPS (see docs/DEPLOY-SERVER-CN.md). */
module.exports = {
  apps: [
    {
      name: "addchess-server",
      cwd: __dirname,
      script: "npm",
      args: "run start:server",
      env: {
        NODE_ENV: "production",
        HOST: "0.0.0.0",
        PORT: "3000",
        PUBLIC_WS_URL: "wss://ws.addchess.cn",
      },
    },
  ],
};
