const fs = require('fs');
const path = require('path');
const novelMetadata = require('../models/novelMetadata.json');

// 获取用于SSR的小说列表数据
exports.getNovelsForSSR = (req, res) => {
  try {
    const novelsList = novelMetadata.novels.map(novel => ({
      id: novel.id,
      title: novel.title,
      originalTitle: novel.originalTitle,
      author: novel.author,
      description: novel.description,
      coverImage: novel.coverImage,
      publishDate: novel.publishDate,
      epubFile: novel.epubFile,
      chapterCount: novel.chapterCount
    }));
    
    res.json({ 
      success: true, 
      data: novelsList,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ success: false, message: '获取小说列表失败', error: error.message });
  }
};

// 获取用于SSR的单本小说详情
exports.getNovelForSSR = (req, res) => {
  const { id } = req.params;
  
  try {
    const novel = novelMetadata.novels.find(n => n.id === id);
    
    if (!novel) {
      return res.status(404).json({ success: false, message: '小说未找到' });
    }
    
    // 可以在这里添加更多的预处理数据，比如获取章节列表等
    
    res.json({ 
      success: true, 
      data: novel,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ success: false, message: '获取小说详情失败', error: error.message });
  }
};

// 更新小说元数据
exports.updateNovelMetadata = (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  
  try {
    const novelIndex = novelMetadata.novels.findIndex(n => n.id === id);
    
    if (novelIndex === -1) {
      return res.status(404).json({ success: false, message: '小说未找到' });
    }
    
    novelMetadata.novels[novelIndex] = { ...novelMetadata.novels[novelIndex], ...updates };
    
    fs.writeFileSync(
      path.join(__dirname, '../models/novelMetadata.json'),
      JSON.stringify(novelMetadata, null, 2),
      'utf8'
    );
    
    res.json({ 
      success: true, 
      data: novelMetadata.novels[novelIndex],
      message: '小说元数据更新成功'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: '更新小说元数据失败', error: error.message });
  }
};

// 批量更新小说元数据（从EPUB文件中提取）
exports.batchUpdateFromEpub = async (req, res) => {
  try {
    // 这里可以实现从EPUB文件中提取元数据并更新到JSON文件的逻辑
    // 目前返回成功，实际使用时需要实现具体逻辑
    res.json({ 
      success: true, 
      message: '批量更新功能待实现',
      data: { updatedCount: 0 }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: '批量更新失败', error: error.message });
  }
};
