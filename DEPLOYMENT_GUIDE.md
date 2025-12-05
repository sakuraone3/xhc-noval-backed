# 后端项目打包部署指南

## 项目概述
这是一个基于Node.js和Express的后端项目，主要用于处理小说阅读相关的API请求。

## 打包部署方式

### 方式一：直接部署（推荐）

这是最简单的部署方式，适用于大多数场景。

#### 步骤：

1. **准备环境变量**
   - 确保`.env.production`文件包含正确的生产环境配置：
     ```
     FRONTEND_URL=http://101.132.23.56:3000
     API_BASE_URL=http://101.132.23.56:3001
     ```

2. **复制项目文件**
   - 将整个项目目录（`xhc_noval_backend`）复制到服务器上的目标位置

3. **安装依赖**
   - 在服务器上执行：
     ```bash
     cd /path/to/xhc_noval_backend
     npm install
     ```

4. **启动服务**
   - 执行以下命令启动生产环境服务：
     ```bash
     NODE_ENV=production npm start
     ```

### 方式二：使用Docker打包（可选）

如果需要更便捷的部署和环境隔离，可以使用Docker进行打包。

#### 步骤：

1. **创建Dockerfile**
   - 在项目根目录创建`Dockerfile`文件：
     ```dockerfile
     # 使用Node.js官方镜像作为基础
     FROM node:18-alpine
     
     # 设置工作目录
     WORKDIR /app
     
     # 复制package.json和package-lock.json
     COPY package*.json ./
     
     # 安装依赖
     RUN npm install --production
     
     # 复制项目文件
     COPY . .
     
     # 暴露端口
     EXPOSE 3001
     
     # 启动服务
     CMD ["npm", "start"]
     ```

2. **构建Docker镜像**
   - 在项目根目录执行：
     ```bash
     docker build -t xhc-noval-backend .
     ```

3. **运行Docker容器**
   - 执行以下命令启动容器：
     ```bash
     docker run -d -p 3001:3001 --name xhc-noval-backend xhc-noval-backend
     ```

### 方式三：使用PM2管理（推荐生产环境使用）

PM2是一个Node.js进程管理工具，可以帮助你管理和守护Node.js应用。

#### 步骤：

1. **安装PM2**
   - 全局安装PM2：
     ```bash
     npm install pm2 -g
     ```

2. **启动应用**
   - 使用PM2启动应用：
     ```bash
     NODE_ENV=production pm2 start index.js --name "xhc-noval-backend"
     ```

3. **设置开机自启**
   - 执行以下命令设置PM2开机自启：
     ```bash
     pm2 startup
     pm2 save
     ```

## 项目结构说明

```
├── controllers/    # 控制器文件
├── models/         # 模型文件
├── routes/         # 路由配置
├── public/         # 静态文件
│   ├── cover/      # 小说封面
│   ├── epub/       # EPUB文件
│   ├── novel/      # 小说内容
├── index.js        # 主入口文件
├── package.json    # 项目配置
├── .env.production # 生产环境变量
```

## 注意事项

1. **环境变量**
   - 确保`.env.production`文件中的配置与实际部署环境一致
   - 环境变量文件包含敏感信息，不要提交到版本控制

2. **端口配置**
   - 默认端口为3001，如果需要修改，在`index.js`中修改端口配置
   - 确保服务器的防火墙已开放相应端口

3. **依赖安装**
   - 生产环境建议使用`npm install --production`仅安装生产依赖
   - 确保安装的依赖版本与开发环境一致

4. **静态文件**
   - `public`目录包含所有静态资源，确保这些文件已正确复制到服务器
   - 如果有大量静态文件，建议使用CDN或专门的静态文件服务器

5. **日志管理**
   - 项目使用了morgan中间件记录请求日志
   - 建议配置日志轮转，避免日志文件过大

## 常见问题

### Q: 如何修改端口？
A: 在`index.js`文件中修改`app.listen()`的端口参数。

### Q: 如何配置HTTPS？
A: 可以使用Nginx作为反向代理来配置HTTPS，或直接在Express中配置HTTPS证书。

### Q: 如何监控应用状态？
A: 使用PM2的监控功能：`pm2 monit`或`pm2 logs`。

### Q: 如何更新部署？
A: 停止服务 -> 更新代码 -> 重新安装依赖 -> 重启服务。

---

以上是后端项目的打包部署指南，根据实际需求选择合适的部署方式。