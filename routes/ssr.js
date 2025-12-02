const express = require('express');
const router = express.Router();
const ssrController = require('../controllers/ssrController');

// SSR相关路由
router.get('/novels', ssrController.getNovelsForSSR); // 获取用于SSR的小说列表
router.get('/novels/:id', ssrController.getNovelForSSR); // 获取用于SSR的单本小说详情
router.put('/novels/:id', ssrController.updateNovelMetadata); // 更新小说元数据
router.post('/novels/batch-update', ssrController.batchUpdateFromEpub); // 批量更新小说元数据

module.exports = router;
