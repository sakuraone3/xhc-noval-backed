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
    const textRegex = /<text[^>]*href="([^"]+)"/;
    const navLabelRegex = /<navLabel[^>]*>([\s\S]*?)<\/navLabel>/;
    const textContentRegex = /<text>([^<]+)<\/text>/;
    
    const id = navPoint.match(idRegex)?.[1] || '';
    const playOrder = navPoint.match(playOrderRegex)?.[1] || '';
    const href = navPoint.match(textRegex)?.[1] || '';
    const navLabel = navPoint.match(navLabelRegex)?.[1] || '';
    const title = navLabel.match(textContentRegex)?.[1] || '';
    
    if (title && href) {
      chapters.push({
        id,
        playOrder: parseInt(playOrder),
        title: title.trim(),
        href: href.trim()
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
    for (const file in zip.files) {
      if (file.endsWith(chapterHref) || file.includes(chapterHref)) {
        chapterContent = await zip.file(file).async('string');
        break;
      }
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
