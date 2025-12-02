# API测试指南

本文档提供了测试XHC Novel Backend API的方法和示例。

## 目录
- [API路由结构](#api路由结构)
- [使用curl测试API](#使用curl测试api)
- [使用Postman测试API](#使用postman测试api)
- [自动化测试](#自动化测试)

## API路由结构

基于项目代码分析，以下是可用的API端点：

### 小说相关API
- `GET /api/novels` - 获取所有小说列表
- `GET /api/novels/:id` - 获取单本小说详情
- `GET /api/novels/:id/chapters` - 获取小说章节列表
- `GET /api/novels/:id/chapters/:chapterId` - 获取章节内容

### EPUB相关API
- `GET /api/epub` - 获取所有EPUB文件列表
- `GET /api/epub/:filename/metadata` - 获取EPUB文件元数据
- `GET /api/epub/:filename/chapters/:chapterHref` - 获取章节内容

### SSR相关API
- `GET /api/ssr/novels` - 获取用于SSR的小说列表
- `GET /api/ssr/novels/:id` - 获取用于SSR的单本小说详情
- `PUT /api/ssr/novels/:id` - 更新小说元数据
- `POST /api/ssr/novels/batch-update` - 批量更新小说元数据

### 健康检查
- `GET /health` - 检查服务健康状态

## 使用curl测试API

### 1. 测试健康检查端点

```bash
curl http://localhost:3001/health
```

### 2. 测试小说列表API

```bash
curl http://localhost:3001/api/novels
```

### 3. 测试单本小说详情API

```bash
curl http://localhost:3001/api/novels/1  # 假设ID为1的小说存在
```

### 4. 测试EPUB文件列表API

```bash
curl http://localhost:3001/api/epub
```

### 5. 测试EPUB元数据API

```bash
curl "http://localhost:3001/api/epub/你的名字。.epub/metadata"
```

### 6. 测试PUT请求（更新小说元数据）

```bash
curl -X PUT -H "Content-Type: application/json" -d '{"title":"更新后的标题","author":"更新后的作者"}' http://localhost:3001/api/ssr/novels/1
```

### 7. 测试POST请求（批量更新）

```bash
curl -X POST -H "Content-Type: application/json" -d '{"novels":[{"id":"1","title":"新标题1"},{"id":"2","title":"新标题2"}]}' http://localhost:3001/api/ssr/novels/batch-update
```

## 使用Postman测试API

### 1. 安装Postman

访问 [Postman官网](https://www.postman.com/downloads/) 下载并安装最新版本的Postman。

### 2. 创建测试集合

1. 打开Postman
2. 点击左上角的"New"按钮
3. 选择"Collection"
4. 为集合命名（例如："XHC Novel Backend API"）

### 3. 创建测试请求

#### 示例：测试健康检查端点

1. 点击集合名称旁的"+"按钮
2. 设置请求方法为GET
3. 输入URL: `http://localhost:3001/health`
4. 点击"Send"按钮
5. 查看响应结果

#### 示例：测试小说列表API

1. 创建新请求
2. 设置请求方法为GET
3. 输入URL: `http://localhost:3001/api/novels`
4. 点击"Send"按钮
5. 查看响应结果

#### 示例：测试更新小说元数据API

1. 创建新请求
2. 设置请求方法为PUT
3. 输入URL: `http://localhost:3001/api/ssr/novels/1`
4. 切换到"Body"标签
5. 选择"raw"和"JSON"格式
6. 输入JSON数据：
   ```json
   {
     "title": "更新后的标题",
     "author": "更新后的作者"
   }
   ```
7. 点击"Send"按钮
8. 查看响应结果

### 4. 保存和组织测试

1. 测试通过后，点击"Save"按钮保存请求
2. 可以为请求添加描述和测试脚本
3. 可以创建不同的文件夹来组织请求（例如："小说API"、"EPUB API"、"SSR API"等）

### 5. 使用环境变量

为了方便在不同环境中测试，可以设置环境变量：

1. 点击右上角的齿轮图标，选择"Manage Environments"
2. 点击"Add"按钮
3. 为环境命名（例如："Local Development"）
4. 添加变量：
   - 变量名：`baseUrl`
   - 变量值：`http://localhost:3001`
5. 点击"Add"按钮保存环境
6. 在请求URL中使用变量：`{{baseUrl}}/api/novels`

## 自动化测试

### 1. 使用Node.js和Jest进行API测试

虽然当前项目没有配置自动化测试工具，但可以使用Jest和supertest来设置API自动化测试。

以下是设置步骤：

1. 安装必要的依赖：

```bash
npm install --save-dev jest supertest
```

2. 在package.json中添加测试脚本：

```json
"scripts": {
  "test": "jest"
}
```

3. 创建测试文件示例（例如：`tests/api.test.js`）：

```javascript
const request = require('supertest');
const app = require('../index'); // 假设index.js导出了app实例

describe('API测试', () => {
  test('健康检查端点应返回200状态码', async () => {
    const response = await request(app).get('/health');
    expect(response.statusCode).toBe(200);
    expect(response.body.status).toBe('ok');
  });

  test('小说列表API应返回小说数据', async () => {
    const response = await request(app).get('/api/novels');
    expect(response.statusCode).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });
});
```

### 2. 创建简单的测试脚本

也可以创建一个简单的Node.js脚本来测试API：

```javascript
// test-api.js
const fetch = require('node-fetch');

async function testHealthEndpoint() {
  try {
    const response = await fetch('http://localhost:3001/health');
    const data = await response.json();
    console.log('健康检查结果:', data);
  } catch (error) {
    console.error('健康检查失败:', error);
  }
}

async function testNovelsEndpoint() {
  try {
    const response = await fetch('http://localhost:3001/api/novels');
    const data = await response.json();
    console.log('小说列表结果:', data);
  } catch (error) {
    console.error('小说列表请求失败:', error);
  }
}

// 运行测试
testHealthEndpoint();
testNovelsEndpoint();
```

运行脚本：

```bash
node test-api.js
```

## 注意事项

1. 确保服务器正在运行（使用`npm run start`或`npm run dev`命令启动）
2. 检查端口号是否正确（默认为3001）
3. 对于包含中文的文件名，在URL中可能需要进行URL编码
4. 测试PUT和POST请求时，确保提供了正确的JSON格式数据
5. 对于需要认证的API（如果将来添加），需要在请求头中包含认证信息