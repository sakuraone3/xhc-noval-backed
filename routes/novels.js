const express = require('express');
const router = express.Router();
const novelController = require('../controllers/novelController');

// 路由定义
router.get('/', novelController.getAllNovels); // 获取所有小说列表
router.get('/:id', novelController.getNovelById); // 获取单本小说详情
router.get('/:id/chapters', novelController.getNovelChapters); // 获取小说章节列表
router.get('/:id/chapters/:chapterId', novelController.getChapterContent); // 获取章节内容

module.exports = router;
