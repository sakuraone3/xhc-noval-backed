const novels = require('../models/novel');

// 获取所有小说列表
exports.getAllNovels = (req, res) => {
  const novelsList = novels.map(novel => ({
    id: novel.id,
    title: novel.title,
    originalTitle: novel.originalTitle,
    author: novel.author,
    description: novel.description,
    coverImage: novel.coverImage,
    publishDate: novel.publishDate,
    chapterCount: novel.chapters.length
  }));
  res.json({ success: true, data: novelsList });
};

// 获取单本小说详情
exports.getNovelById = (req, res) => {
  const { id } = req.params;
  const novel = novels.find(n => n.id === parseInt(id));
  
  if (!novel) {
    return res.status(404).json({ success: false, message: '小说未找到' });
  }
  
  res.json({ success: true, data: novel });
};

// 获取小说章节列表
exports.getNovelChapters = (req, res) => {
  const { id } = req.params;
  const novel = novels.find(n => n.id === parseInt(id));
  
  if (!novel) {
    return res.status(404).json({ success: false, message: '小说未找到' });
  }
  
  const chapters = novel.chapters.map(chapter => ({
    id: chapter.id,
    title: chapter.title
  }));
  
  res.json({ success: true, data: chapters });
};

// 获取小说章节内容
exports.getChapterContent = (req, res) => {
  const { id, chapterId } = req.params;
  const novel = novels.find(n => n.id === parseInt(id));
  
  if (!novel) {
    return res.status(404).json({ success: false, message: '小说未找到' });
  }
  
  const chapter = novel.chapters.find(c => c.id === parseInt(chapterId));
  
  if (!chapter) {
    return res.status(404).json({ success: false, message: '章节未找到' });
  }
  
  res.json({ 
    success: true, 
    data: { 
      novelId: novel.id,
      novelTitle: novel.title,
      chapter: chapter 
    } 
  });
};
