# Next.js 服务端渲染集成示例

## 项目概述

这是一个新海诚小说阅读器的前后端分离项目，后端使用 Node.js + Express 提供 API 服务，前端使用 Next.js 进行服务端渲染。

## 数据存储方案

### 1. EPUB 文件存储

- **位置**：后端项目的 `public/epub` 目录下
- **访问方式**：通过 HTTP 直接访问，例如 `http://localhost:3001/epub/your-name.epub`
- **优点**：简单易用，适合静态资源访问
- **缺点**：不适合大规模文件管理

### 2. 小说元数据存储

- **位置**：后端项目的 `models/novelMetadata.json` 文件
- **格式**：JSON 格式，包含小说的基本信息
- **优点**：读取速度快，适合服务端渲染时快速获取数据
- **缺点**：不支持复杂查询，适合数据量较小的场景

### 3. 数据库方案（可选）

如果未来数据量增大，可以考虑使用数据库存储：
- **SQL 数据库**：MySQL、PostgreSQL - 适合结构化数据
- **NoSQL 数据库**：MongoDB - 适合半结构化数据
- **文档数据库**：适合存储小说章节内容

## Next.js 集成示例

### 1. 小说列表页（SSR）

```javascript
// pages/index.js
import React from 'react';

const NovelList = ({ novels }) => {
  return (
    <div className="novel-list">
      <h1>新海诚小说集</h1>
      <div className="novels-grid">
        {novels.map((novel) => (
          <div key={novel.id} className="novel-card">
            <img src={novel.coverImage} alt={novel.title} />
            <h2>{novel.title}</h2>
            <p className="original-title">{novel.originalTitle}</p>
            <p className="author">作者：{novel.author}</p>
            <p className="description">{novel.description}</p>
            <a href={`/novel/${novel.id}`} className="read-button">开始阅读</a>
          </div>
        ))}
      </div>
    </div>
  );
};

// 服务端渲染数据获取
export async function getServerSideProps() {
  try {
    const res = await fetch('http://localhost:3001/api/ssr/novels');
    const data = await res.json();
    
    if (data.success) {
      return {
        props: {
          novels: data.data
        }
      };
    }
    
    return {
      props: {
        novels: []
      }
    };
  } catch (error) {
    console.error('Failed to fetch novels:', error);
    return {
      props: {
        novels: []
      }
    };
  }
}

export default NovelList;
```

### 2. 小说详情页（SSR）

```javascript
// pages/novel/[id].js
import React from 'react';

const NovelDetail = ({ novel }) => {
  if (!novel) {
    return <div className="loading">加载中...</div>;
  }
  
  return (
    <div className="novel-detail">
      <div className="novel-header">
        <img src={novel.coverImage} alt={novel.title} className="novel-cover" />
        <div className="novel-info">
          <h1>{novel.title}</h1>
          <p className="original-title">{novel.originalTitle}</p>
          <p className="author">作者：{novel.author}</p>
          <p className="publish-date">出版日期：{novel.publishDate}</p>
          <p className="description">{novel.description}</p>
        </div>
      </div>
      
      <div className="read-section">
        <a 
          href={`/reader/${novel.id}`} 
          className="start-reading-button"
        >
          开始阅读
        </a>
      </div>
    </div>
  );
};

export async function getServerSideProps({ params }) {
  const { id } = params;
  
  try {
    const res = await fetch(`http://localhost:3001/api/ssr/novels/${id}`);
    const data = await res.json();
    
    if (data.success) {
      return {
        props: {
          novel: data.data
        }
      };
    }
    
    return {
      props: {
        novel: null
      }
    };
  } catch (error) {
    console.error(`Failed to fetch novel ${id}:`, error);
    return {
      props: {
        novel: null
      }
    };
  }
}

export default NovelDetail;
```

### 3. EPUB 阅读器页（客户端渲染）

```javascript
// pages/reader/[id].js
import React, { useEffect, useRef } from 'react';
import * as epubjs from 'epubjs';

const EpubReader = ({ novel }) => {
  const readerRef = useRef(null);
  const renditionRef = useRef(null);
  
  useEffect(() => {
    if (!novel || !readerRef.current) return;
    
    // 初始化 EPUB 阅读器
    const book = epubjs.Book({
      bindings: {
        'webkitAllowFullScreen': true
      }
    });
    
    // 加载 EPUB 文件
    const epubUrl = `http://localhost:3001/epub/${novel.epubFile}`;
    book.open(epubUrl);
    
    // 渲染 EPUB 内容
    const rendition = book.renderTo(readerRef.current, {
      width: '100%',
      height: '100vh',
      method: 'default'
    });
    
    renditionRef.current = rendition;
    
    // 显示第一页
    rendition.display();
    
    // 清理函数
    return () => {
      if (renditionRef.current) {
        renditionRef.current.destroy();
      }
      book.destroy();
    };
  }, [novel]);
  
  if (!novel) {
    return <div className="loading">加载中...</div>;
  }
  
  return (
    <div className="epub-reader">
      <div className="reader-header">
        <h1>{novel.title}</h1>
      </div>
      <div ref={readerRef} className="reader-content"></div>
    </div>
  );
};

export async function getServerSideProps({ params }) {
  const { id } = params;
  
  try {
    const res = await fetch(`http://localhost:3001/api/ssr/novels/${id}`);
    const data = await res.json();
    
    if (data.success) {
      return {
        props: {
          novel: data.data
        }
      };
    }
    
    return {
      props: {
        novel: null
      }
    };
  } catch (error) {
    console.error(`Failed to fetch novel ${id}:`, error);
    return {
      props: {
        novel: null
      }
    };
  }
}

export default EpubReader;
```

### 4. API 调用工具

```javascript
// utils/api.js
const API_BASE_URL = 'http://localhost:3001/api';

// 获取小说列表
export const getNovels = async () => {
  const res = await fetch(`${API_BASE_URL}/ssr/novels`);
  const data = await res.json();
  return data;
};

// 获取小说详情
export const getNovelById = async (id) => {
  const res = await fetch(`${API_BASE_URL}/ssr/novels/${id}`);
  const data = await res.json();
  return data;
};

// 获取EPUB文件元数据
export const getEpubMetadata = async (filename) => {
  const res = await fetch(`${API_BASE_URL}/epub/${filename}/metadata`);
  const data = await res.json();
  return data;
};

// 获取章节内容
export const getChapterContent = async (filename, chapterHref) => {
  const res = await fetch(`${API_BASE_URL}/epub/${filename}/chapters/${chapterHref}`);
  const data = await res.json();
  return data;
};
```

## 后端 API 列表

### 1. 健康检查

```
GET /health
返回：{ status: 'ok', message: 'New Hai Cheng Novel API is running' }
```

### 2. 小说相关 API

```
GET /api/novels - 获取所有小说列表
GET /api/novels/:id - 获取单本小说详情
GET /api/novels/:id/chapters - 获取小说章节列表
GET /api/novels/:id/chapters/:chapterId - 获取章节内容
```

### 3. EPUB 相关 API

```
GET /api/epub - 获取所有EPUB文件列表
GET /api/epub/:filename/metadata - 获取EPUB文件元数据
GET /api/epub/:filename/chapters/:chapterHref - 获取章节内容
```

### 4. SSR 相关 API

```
GET /api/ssr/novels - 获取用于SSR的小说列表
GET /api/ssr/novels/:id - 获取用于SSR的单本小说详情
PUT /api/ssr/novels/:id - 更新小说元数据
POST /api/ssr/novels/batch-update - 批量更新小说元数据
```

## 部署建议

### 1. 开发环境

- **后端**：`npm run start` - 运行在 3001 端口
- **前端**：`npm run dev` - 运行在 3000 端口

### 2. 生产环境

- **后端**：使用 PM2 或 Docker 部署
- **前端**：使用 Vercel、Netlify 或自己的服务器部署 Next.js 应用
- **静态资源**：使用 CDN 加速 EPUB 文件和图片访问

## 扩展建议

1. **添加搜索功能**：实现小说标题、作者搜索
2. **添加阅读进度保存**：使用 localStorage 或后端 API 保存阅读进度
3. **添加阅读主题切换**：支持白天/黑夜模式
4. **添加字体大小调整**：提高阅读体验
5. **添加章节导航**：方便用户快速跳转到指定章节
6. **添加离线阅读功能**：使用 Service Worker 缓存 EPUB 文件

## 技术栈

- **后端**：Node.js、Express、JSZip
- **前端**：Next.js、React、epub.js
- **数据存储**：JSON 文件 + 静态资源
- **部署**：待定

## 注意事项

1. 确保 EPUB 文件的版权合法性
2. 注意 CORS 配置，允许前端访问后端 API
3. 考虑添加 API 限流，防止恶意请求
4. 对于大文件，考虑实现分片上传和下载
5. 定期备份 EPUB 文件和元数据
