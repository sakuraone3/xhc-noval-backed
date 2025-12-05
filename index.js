// Load environment variables
require('dotenv').config({
  path: process.env.NODE_ENV === 'production' ? '.env.production' : '.env.local'
});

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

// Get environment variables
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001';

// Parse frontend URLs for CORS
const frontendOrigins = [FRONTEND_URL];
// Add production URLs if they are different from local
if (FRONTEND_URL !== 'http://localhost:3000') {
  frontendOrigins.push(API_BASE_URL.replace('3001', '3000'));
  frontendOrigins.push(API_BASE_URL.replace('http://', 'http://').split(':3001')[0]);
}

// 中间件配置
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'"],
      imgSrc: ["'self'", API_BASE_URL],
      connectSrc: ["'self'", API_BASE_URL, FRONTEND_URL],
    },
  },
}));

// 设置Cross-Origin-Resource-Policy中间件
app.use((req, res, next) => {
  res.set('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
});

app.use(cors({
  origin: frontendOrigins,
  credentials: true,
}));
app.use(morgan('dev'));
app.use(express.json());

// 静态文件服务
app.use('/public', express.static(path.join(__dirname, 'public')));
app.use('/epub', express.static(path.join(__dirname, 'public/epub')));
app.use('/cover', express.static(path.join(__dirname, 'public/cover')));

// 路由配置
app.use('/api/novels', novelsRouter);
app.use('/api/epub', epubRouter);
app.use('/api/ssr', ssrRouter);

// 健康检查路由
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is running' });
});

// 根路径路由 - 返回小说列表页
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 小说详情页动态路由
app.get('/novel/:id', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 阅读器动态路由
app.get('/reader/:id', (req, res) => {
  const id = req.params.id;
  res.sendFile(path.join(__dirname, 'public/reader/index.html'));
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`API Base URL: ${API_BASE_URL}`);
  console.log(`Allowed Origins: ${frontendOrigins.join(', ')}`);
});
