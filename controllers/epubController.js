const fs = require('fs');
const path = require('path');
const JSZip = require('jszip');

// EPUB文件存储目录
const EPUB_DIR = path.join(__dirname, '../public/epub');

// 获取所有EPUB文件列表
exports.getEpubList = (req, res) => {
  try {
    const files = fs.readdirSync(EPUB_DIR);
    const epubFiles = files.filter(file => file.endsWith('.epub')).map(file => ({
      id: file.replace('.epub', ''),
      filename: file,
      title: file.replace('.epub', ''),
      path: `/epub/${file}`
    }));
    res.json({ success: true, data: epubFiles });
  } catch (error) {
    res.status(500).json({ success: false, message: '获取EPUB文件列表失败', error: error.message });
  }
};

// 解析EPUB文件元数据
exports.parseEpubMetadata = async (req, res) => {
  const { filename } = req.params;
  const epubPath = path.join(EPUB_DIR, filename);
  
  try {
    if (!fs.existsSync(epubPath)) {
      return res.status(404).json({ success: false, message: 'EPUB文件不存在' });
    }
    
    const epubData = fs.readFileSync(epubPath);
    const zip = await JSZip.loadAsync(epubData);
    
    // 查找OPF文件
    let opfPath = '';
    for (const file in zip.files) {
      if (file.endsWith('.opf')) {
        opfPath = file;
        break;
      }
    }
    
    if (!opfPath) {
      return res.status(400).json({ success: false, message: '无法找到OPF文件' });
    }
    
    // 读取并解析OPF文件
    const opfContent = await zip.file(opfPath).async('string');
    
    // 简单解析OPF获取元数据
    const metadata = {
      title: extractFromXml(opfContent, 'dc:title'),
      author: extractFromXml(opfContent, 'dc:creator'),
      description: extractFromXml(opfContent, 'dc:description'),
      publisher: extractFromXml(opfContent, 'dc:publisher'),
      publishDate: extractFromXml(opfContent, 'dc:date')
    };
    
    // 查找目录文件
    let tocPath = '';
    for (const file in zip.files) {
      if (file.endsWith('toc.ncx') || file.includes('toc')) {
        tocPath = file;
        break;
      }
    }
    
    let chapters = [];
    if (tocPath) {
      const tocContent = await zip.file(tocPath).async('string');
      chapters = extractChaptersFromNcx(tocContent);
    }
    
    res.json({ 
      success: true, 
      data: { 
        metadata, 
        chapters, 
        filename, 
        path: `/epub/${filename}`
      } 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: '解析EPUB文件失败', error: error.message });
  }
};

// 从XML中提取指定标签的内容
function extractFromXml(xml, tag) {
  const regex = new RegExp(`<${tag}[^>]*>([^<]+)</${tag}>`, 'i');
  const match = xml.match(regex);
  return match ? match[1].trim() : '';
}

// 从NCX文件中提取章节信息
function extractChaptersFromNcx(ncxContent) {
  const chapters = [];
  const navPointRegex = /<navPoint[^>]*>([\s\S]*?)<\/navPoint>/gi;
  let match;
  
  while ((match = navPointRegex.exec(ncxContent)) !== null) {
    const navPoint = match[1];
    const idRegex = /id="([^"]+)"/;
    const playOrderRegex = /playOrder="([^"]+)"/;
    const contentRegex = /<content[^>]*src="([^"]+)"/;
    const navLabelRegex = /<navLabel[^>]*>([\s\S]*?)<\/navLabel>/;
    const textContentRegex = /<text>([^<]+)<\/text>/;
    
    const id = navPoint.match(idRegex)?.[1] || '';
    const playOrder = navPoint.match(playOrderRegex)?.[1] || '';
    const href = navPoint.match(contentRegex)?.[1] || '';
    const navLabel = navPoint.match(navLabelRegex)?.[1] || '';
    const title = navLabel.match(textContentRegex)?.[1] || '';
    
    const trimmedTitle = title.trim();
    const trimmedHref = href.trim();
    
    // 过滤掉封面章节
    const isCoverChapter = trimmedTitle.toLowerCase().includes('封面') || 
                          trimmedTitle.toLowerCase().includes('cover') || 
                          trimmedHref.toLowerCase().includes('cover');
    
    if (trimmedTitle && trimmedHref && !isCoverChapter) {
      chapters.push({
        id,
        playOrder: parseInt(playOrder),
        title: trimmedTitle,
        href: trimmedHref
      });
    }
  }
  
  return chapters;
}

// 获取EPUB文件的章节内容
exports.getChapterContent = async (req, res) => {
  const { filename, chapterHref } = req.params;
  const epubPath = path.join(EPUB_DIR, filename);
  
  try {
    if (!fs.existsSync(epubPath)) {
      return res.status(404).json({ success: false, message: 'EPUB文件不存在' });
    }
    
    const epubData = fs.readFileSync(epubPath);
    const zip = await JSZip.loadAsync(epubData);
    
    // 查找并读取章节文件
    let chapterContent = '';
    let matchedFile = null;
    
    // 尝试多种匹配方式找到正确的章节文件
    for (const file in zip.files) {
      // 精确匹配整个路径
      if (file === chapterHref) {
        matchedFile = file;
        break;
      }
      // 匹配路径的最后部分
      if (file.endsWith(`/${chapterHref}`) || file.endsWith(chapterHref)) {
        matchedFile = file;
        break;
      }
      // 包含匹配（作为最后的选择）
      if (file.includes(chapterHref) && !matchedFile) {
        matchedFile = file;
      }
    }
    
    if (matchedFile) {
        chapterContent = await zip.file(matchedFile).async('string');
        
        // 修改图片路径，使其指向我们的API端点
        const baseUrl = `${req.protocol}://${req.get('host')}/api/epub/${filename}/image`;
        // 将所有可能的图片路径替换为API端点
        chapterContent = chapterContent.replace(/src="\.\.\/images\/([^"]+)"/gi, `src="${baseUrl}/$1"`);
        chapterContent = chapterContent.replace(/src="\.\.\/Images\/([^"]+)"/gi, `src="${baseUrl}/$1"`);
        chapterContent = chapterContent.replace(/src="images\/([^"]+)"/gi, `src="${baseUrl}/$1"`);
        chapterContent = chapterContent.replace(/src="Images\/([^"]+)"/gi, `src="${baseUrl}/$1"`);
        chapterContent = chapterContent.replace(/src="\.\/([^"]+)"/gi, `src="${baseUrl}/$1"`);
        chapterContent = chapterContent.replace(/src="([^"/]+\.(jpg|jpeg|png|gif|svg))"/gi, `src="${baseUrl}/$1"`);
      }
    
    if (!chapterContent) {
      return res.status(404).json({ success: false, message: '章节内容未找到' });
    }
    
    res.json({ 
      success: true, 
      data: { 
        content: chapterContent,
        filename,
        chapterHref
      } 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: '获取章节内容失败', error: error.message });
  }
};

// 获取EPUB文件中的图片资源
exports.getEpubImage = async (req, res) => {
  const { filename, imagePath } = req.params;
  const epubPath = path.join(EPUB_DIR, filename);
  
  try {
    if (!fs.existsSync(epubPath)) {
      return res.status(404).json({ success: false, message: 'EPUB文件不存在' });
    }
    
    const epubData = fs.readFileSync(epubPath);
    const zip = await JSZip.loadAsync(epubData);
    
    // 尝试多种匹配方式找到正确的图片文件
    let matchedFile = null;
    for (const file in zip.files) {
      // 尝试不同的路径组合
      if (file === `Images/${imagePath}` || file === `images/${imagePath}`) {
        matchedFile = file;
        break;
      }
      if (file.endsWith(`/Images/${imagePath}`) || file.endsWith(`/images/${imagePath}`)) {
        matchedFile = file;
        break;
      }
      if (file.includes(`Images/${imagePath}`) || file.includes(`images/${imagePath}`)) {
        matchedFile = file;
      }
      // 直接匹配文件名（不包含路径）
      if (file.endsWith(`/${imagePath}`) || file === imagePath) {
        matchedFile = file;
        break;
      }
      // 查找所有图片文件并匹配文件名
      const filename = path.basename(file).toLowerCase();
      if (filename === imagePath.toLowerCase()) {
        matchedFile = file;
        break;
      }
    }
    
    if (!matchedFile) {
      return res.status(404).json({ success: false, message: '图片资源未找到' });
    }
    
    // 获取图片内容并返回
    const imageContent = await zip.file(matchedFile).async('nodebuffer');
    
    // 设置正确的Content-Type
    const ext = path.extname(matchedFile).toLowerCase();
    const contentType = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml'
    }[ext] || 'image/jpeg';
    
    res.set('Content-Type', contentType);
    res.send(imageContent);
  } catch (error) {
    res.status(500).json({ success: false, message: '获取图片资源失败', error: error.message });
  }
};
