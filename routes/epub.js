const express = require('express');
const router = express.Router();
const epubController = require('../controllers/epubController');

// 路由定义
router.get('/', epubController.getEpubList); // 获取所有EPUB文件列表
router.get('/:filename/metadata', epubController.parseEpubMetadata); // 获取EPUB文件元数据
router.get('/:filename/chapters/:chapterHref', epubController.getChapterContent); // 获取章节内容

module.exports = router;
