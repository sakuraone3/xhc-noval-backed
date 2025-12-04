const fs = require('fs');
const path = require('path');
const JSZip = require('jszip');

// 检查指定EPUB文件的内部结构
async function checkEpubStructure(filename) {
  const epubPath = path.join(__dirname, 'public/epub', filename);
  
  try {
    if (!fs.existsSync(epubPath)) {
      console.log(`EPUB文件不存在: ${filename}`);
      return;
    }
    
    console.log(`检查EPUB文件: ${filename}`);
    const epubData = fs.readFileSync(epubPath);
    const zip = await JSZip.loadAsync(epubData);
    
    console.log('\nEPUB文件内部结构:');
    for (const file in zip.files) {
      if (!zip.files[file].dir) {
        console.log(`  - ${file}`);
      }
    }
    
    // 查找目录文件
    let tocPath = '';
    for (const file in zip.files) {
      if (file.endsWith('toc.ncx') || file.includes('toc')) {
        tocPath = file;
        break;
      }
    }
    
    if (tocPath) {
      console.log(`\n找到目录文件: ${tocPath}`);
      const tocContent = await zip.file(tocPath).async('string');
      
      // 打印完整的NCX内容
      console.log('\nNCX文件内容:');
      console.log(tocContent);
      
      // 提取章节信息
      const chapters = extractChaptersFromNcx(tocContent);
      console.log('\n章节列表:');
      if (chapters.length > 0) {
        chapters.forEach((chapter, index) => {
          console.log(`  ${index + 1}. ${chapter.title} -> ${chapter.href}`);
        });
      } else {
        console.log('  未找到章节信息');
      }
    }
  } catch (error) {
    console.error('检查EPUB文件时出错:', error);
  }
}

// 从NCX文件中提取章节信息
function extractChaptersFromNcx(ncxContent) {
  const chapters = [];
  const navPointRegex = /<navPoint[^>]*>([\s\S]*?)<\/navPoint>/gi;
  let match;
  
  while ((match = navPointRegex.exec(ncxContent)) !== null) {
    const navPoint = match[1];
    const contentRegex = /<content[^>]*src="([^"]+)"/;
    const navLabelRegex = /<navLabel[^>]*>([\s\S]*?)<\/navLabel>/;
    const textContentRegex = /<text>([^<]+)<\/text>/;
    
    const href = navPoint.match(contentRegex)?.[1] || '';
    const navLabel = navPoint.match(navLabelRegex)?.[1] || '';
    const title = navLabel.match(textContentRegex)?.[1] || '';
    
    if (title && href) {
      chapters.push({
        title: title.trim(),
        href: href.trim()
      });
    }
  }
  
  return chapters;
}

// 测试第一个EPUB文件
checkEpubStructure('你的名字。.epub');
