const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const novelsRouter = require('./routes/novels');
const epubRouter = require('./routes/epub');
const ssrRouter = require('./routes/ssr');

const app = express();
const PORT = process.env.PORT || 3001;

// 中间件配置
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// 静态文件服务
app.use('/public', express.static(path.join(__dirname, 'public')));
app.use('/epub', express.static(path.join(__dirname, 'public/epub')));

// 路由配置
app.use('/api/novels', novelsRouter);
app.use('/api/epub', epubRouter);
app.use('/api/ssr', ssrRouter);

// 健康检查路由
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'New Hai Cheng Novel API is running' });
});

// 根路径路由 - 返回小说列表页
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 小说详情页动态路由
app.get('/novel/:id', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'novel', '[id].html'));
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
