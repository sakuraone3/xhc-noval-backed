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
    
    // 查找目录文件 - 支持多种NCX文件名格式
    let tocPath = '';
    for (const file in zip.files) {
      // 查找所有可能的NCX文件
      if (file.endsWith('.ncx')) {
        tocPath = file;
        break;
      }
    }
    
    let chapters = [];
    if (tocPath) {
      const tocContent = await zip.file(tocPath).async('string');
      chapters = extractChaptersFromNcx(tocContent);
    }
    
    // 如果没有找到章节，尝试从OPF文件中提取章节信息作为后备方案
    if (chapters.length === 0) {
      console.log(`未从NCX文件中找到章节信息，尝试从OPF文件中提取: ${filename}`);
      // 解析OPF文件获取章节信息
      const opfContent = await zip.file(opfPath).async('string');
      chapters = extractChaptersFromOpf(opfContent);
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

// 从OPF文件中提取章节信息（作为NCX提取失败的后备方案）
function extractChaptersFromOpf(opfContent) {
  const chapters = [];
  
  // 查找所有的item元素
  const itemRegex = /<item[^>]*type="application\/xhtml\+xml"[^>]*>/gi;
  let match;
  let chapterIndex = 0;
  
  while ((match = itemRegex.exec(opfContent)) !== null) {
    const item = match[0];
    const hrefRegex = /href="([^"]+)"/;
    const idRegex = /id="([^"]+)"/;
    
    const href = item.match(hrefRegex)?.[1] || '';
    const id = item.match(idRegex)?.[1] || '';
    
    if (href && !href.toLowerCase().includes('cover')) {
      // 尝试从id或href中提取章节标题
      let title = '';
      if (id.toLowerCase().includes('chapter')) {
        title = `第${id.replace(/[^0-9]/g, '')}章`;
      } else if (href.toLowerCase().includes('chapter')) {
        title = `第${href.replace(/[^0-9]/g, '')}章`;
      } else {
        title = `章节 ${chapterIndex + 1}`;
      }
      
      chapters.push({
        id: id || `chapter_${chapterIndex}`,
        playOrder: chapterIndex + 1,
        title: title,
        href: href
      });
      
      chapterIndex++;
    }
  }
  
  return chapters;
}

// 从NCX文件中提取章节信息
function extractChaptersFromNcx(ncxContent) {
  const chapters = [];
  // 改进的正则表达式，更宽松地匹配navPoint元素
  const navPointRegex = /<navPoint[^>]*>([\s\S]*?)<\/navPoint>/gi;
  let match;
  
  while ((match = navPointRegex.exec(ncxContent)) !== null) {
    const navPoint = match[1];
    // 改进的正则表达式，使用非贪婪匹配和更宽松的模式
    const id = navPoint.match(/id=["']([^"']+)["']/)?.[1] || '';
    const playOrder = navPoint.match(/playOrder=["']([^"']+)["']/)?.[1] || '';
    const href = navPoint.match(/<content[^>]*src=["']([^"']+)["']/)?.[1] || '';
    const navLabel = navPoint.match(/<navLabel[^>]*>([\s\S]*?)<\/navLabel>/)?.[1] || '';
    const title = navLabel.match(/<text[^>]*>([\s\S]*?)<\/text>/)?.[1] || '';
    
    const trimmedTitle = title.trim();
    const trimmedHref = href.trim();
    
    // 过滤掉封面章节
    const isCoverChapter = trimmedTitle.toLowerCase().includes('封面') || 
                          trimmedTitle.toLowerCase().includes('cover') || 
                          trimmedHref.toLowerCase().includes('cover');
    
    // 过滤掉目录和简介章节
    const isTocOrIntroChapter = trimmedTitle.toLowerCase().includes('目录') || 
                              trimmedTitle.toLowerCase().includes('contents') || 
                              trimmedTitle.toLowerCase().includes('toc') || 
                              trimmedTitle.toLowerCase().includes('简介') || 
                              trimmedTitle.toLowerCase().includes('summary') || 
                              trimmedTitle.toLowerCase().includes('introduction');
    
    // 过滤掉书名页和版权信息
    const isTitleOrCopyrightChapter = trimmedTitle.toLowerCase().includes('书名页') || 
                                    trimmedTitle.toLowerCase().includes('版权信息') || 
                                    trimmedTitle.toLowerCase().includes('digital lab简介') || 
                                    trimmedHref.toLowerCase().includes('part0000.html') || 
                                    trimmedHref.toLowerCase().includes('part0001.html') || 
                                    trimmedHref.toLowerCase().includes('part0002.html');
    
    if (trimmedTitle && trimmedHref && !isCoverChapter && !isTocOrIntroChapter && !isTitleOrCopyrightChapter) {
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
  // 解码章节路径，处理前端传递的URL编码
  const decodedChapterHref = decodeURIComponent(chapterHref);
  const epubPath = path.join(EPUB_DIR, filename);
  
  try {
    if (!fs.existsSync(epubPath)) {
      return res.status(404).json({ success: false, message: 'EPUB文件不存在' });
    }
    
    const epubData = fs.readFileSync(epubPath);
    const zip = await JSZip.loadAsync(epubData);
    
    // 打印所有图片相关文件
    console.log('EPUB文件中包含的图片相关文件:');
    for (const file in zip.files) {
      if (file.match(/\.(jpg|jpeg|png|gif|svg)$/i)) {
        console.log('  -', file);
      }
    }
    
    // 解析章节路径，分离文件名和锚点
    let chapterFilePath = decodedChapterHref;
    let anchor = '';
    if (decodedChapterHref.includes('#')) {
      const parts = decodedChapterHref.split('#');
      chapterFilePath = parts[0];
      anchor = parts[1];
    }
    
    // 查找并读取章节文件
    let chapterContent = '';
    let matchedFile = null;
    
    // 尝试多种匹配方式找到正确的章节文件
    for (const file in zip.files) {
      // 精确匹配整个路径（不包含锚点）
      if (file === chapterFilePath) {
        matchedFile = file;
        break;
      }
      // 匹配路径的最后部分（不包含锚点）
      if (file.endsWith(`/${chapterFilePath}`) || file.endsWith(chapterFilePath)) {
        matchedFile = file;
        break;
      }
      // 包含匹配（作为最后的选择，不包含锚点）
      if (file.includes(chapterFilePath) && !matchedFile) {
        matchedFile = file;
      }
    }
    
    if (matchedFile) {
        chapterContent = await zip.file(matchedFile).async('string');
        
        // 处理锚点
        if (anchor) {
          // 尝试根据锚点提取章节内容
          const anchorRegex = new RegExp(`(<a[^>]*id=["']${anchor}["'][^>]*>)([\\s\\S]*?)(<a[^>]*id=["'][^"']+["'][^>]*>|$)`, 'i');
          const match = chapterContent.match(anchorRegex);
          
          if (match) {
            // 如果找到了锚点，只返回从这个锚点开始到下一个锚点或文件结束的内容
            chapterContent = match[0];
          }
        }
        
        // 修改图片路径，使其指向我们的API端点
        const baseUrl = `${req.protocol}://${req.get('host')}/api/epub/${filename}/image`;
        // 将所有可能的图片路径替换为API端点
        chapterContent = chapterContent.replace(/src="\.\.\/images\/([^"]+)"/gi, `src="${baseUrl}/$1"`);
        chapterContent = chapterContent.replace(/src="\.\.\/Images\/([^"]+)"/gi, `src="${baseUrl}/$1"`);
        chapterContent = chapterContent.replace(/src="images\/([^"]+)"/gi, `src="${baseUrl}/$1"`);
        chapterContent = chapterContent.replace(/src="Images\/([^"]+)"/gi, `src="${baseUrl}/$1"`);
        chapterContent = chapterContent.replace(/src=".\/([^"]+)"/gi, `src="${baseUrl}/$1"`);
        chapterContent = chapterContent.replace(/src="([^"\/]+\.(jpg|jpeg|png|gif|svg))"/gi, `src="${baseUrl}/$1"`);
        // 处理包含完整路径的图片（如OEBPS/Images/xxx.jpg）
        chapterContent = chapterContent.replace(/src="OEBPS\/Images\/([^"]+)"/gi, `src="${baseUrl}/$1"`);
        chapterContent = chapterContent.replace(/src="OEBPS\/images\/([^"]+)"/gi, `src="${baseUrl}/$1"`);
        chapterContent = chapterContent.replace(/src="[^"]*\/Images\/([^"\/]+\.(jpg|jpeg|png|gif|svg))"/gi, `src="${baseUrl}/$1"`);
        chapterContent = chapterContent.replace(/src="[^"]*\/images\/([^"\/]+\.(jpg|jpeg|png|gif|svg))"/gi, `src="${baseUrl}/$1"`);
        
        // 将图片从p标签中提取出来，确保独立显示
        chapterContent = chapterContent.replace(/<p[^>]*>(.*?)(<img[^>]+>)(.*?)<\/p>/gi, (match, before, img, after) => {
          // 如果p标签内只有图片，直接返回图片
          if (!before.trim() && !after.trim()) {
            return img;
          }
          // 如果p标签内有图片和文本，将图片提取到p标签外
          return `<p>${before}</p>${img}<p>${after}</p>`;
        });
        
        // 处理多个连续图片在一个p标签内的情况
        chapterContent = chapterContent.replace(/<p[^>]*>((?:<img[^>]+>\s*)+)<\/p>/gi, (match, imgGroup) => {
          // 将每个图片独立显示
          return imgGroup;
        });
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
  // 确保imagePath是字符串（处理路由通配符返回的数组）
  let actualImagePath = Array.isArray(imagePath) ? imagePath[0] : imagePath;
  if (typeof actualImagePath !== 'string') {
    actualImagePath = '';
  }
  
  const epubPath = path.join(EPUB_DIR, filename);
  
  try {
    if (!fs.existsSync(epubPath)) {
      return res.status(404).json({ success: false, message: 'EPUB文件不存在' });
    }
    
    // 去除图片路径开头的斜杠
    if (actualImagePath.startsWith('/')) {
      actualImagePath = actualImagePath.substring(1);
    }
    
    const epubData = fs.readFileSync(epubPath);
    const zip = await JSZip.loadAsync(epubData);
    
    // 尝试多种匹配方式找到正确的图片文件
    let matchedFile = null;
    let filenameOnlyMatch = null;
    
    for (const file in zip.files) {
      // 尝试不同的路径组合（精确匹配）
      if (file === `Images/${actualImagePath}` || file === `images/${actualImagePath}`) {
        matchedFile = file;
        break;
      }
      // 添加对OEBPS/Images路径的支持
      if (file === `OEBPS/Images/${actualImagePath}` || file === `OEBPS/images/${actualImagePath}`) {
        matchedFile = file;
        break;
      }
      if (file.endsWith(`/Images/${actualImagePath}`) || file.endsWith(`/images/${actualImagePath}`)) {
        matchedFile = file;
        break;
      }
      // 直接匹配文件名（不包含路径）
      if (file.endsWith(`/${actualImagePath}`) || file === actualImagePath) {
        matchedFile = file;
        break;
      }
      // 查找所有图片文件并匹配文件名 - 仅作为最后的选择
      const filename = path.basename(file).toLowerCase();
      if (filename === actualImagePath.toLowerCase()) {
        // 保存第一个文件名匹配项，但继续查找更精确的匹配
        if (!filenameOnlyMatch) {
          filenameOnlyMatch = file;
        }
      }
    }
    
    // 如果没有找到精确匹配，才使用文件名匹配
    if (!matchedFile && filenameOnlyMatch) {
      matchedFile = filenameOnlyMatch;
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
    
    // 设置响应头，允许跨源访问
    res.set('Content-Type', contentType);
    res.set('Cross-Origin-Resource-Policy', 'cross-origin');
    res.send(imageContent);
  } catch (error) {
    res.status(500).json({ success: false, message: '获取图片资源失败', error: error.message });
  }
};