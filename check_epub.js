const fs = require('fs');
const path = require('path');
const JSZip = require('jszip');

// 检查指定EPUB文件的内部结构
async function checkEpubImages(filename) {
  const epubPath = path.join(__dirname, 'public/epub', filename);
  
  try {
    if (!fs.existsSync(epubPath)) {
      console.log(`EPUB文件不存在: ${filename}`);
      return;
    }
    
    console.log(`检查EPUB文件: ${filename}`);
    const epubData = fs.readFileSync(epubPath);
    const zip = await JSZip.loadAsync(epubData);
    
    // 单独列出所有图片文件
    console.log(`\n${filename} 图片文件:`);
    let hasImages = false;
    for (const file in zip.files) {
      if (!zip.files[file].dir && /\.(jpg|jpeg|png|gif|svg)$/i.test(file)) {
        console.log(`  ${file}`);
        hasImages = true;
      }
    }
    if (!hasImages) {
      console.log('  未找到图片文件');
    }
    
    // 同时查看插图章节的内容
    console.log(`\n${filename} 插图章节内容:`);
    const illustrationChapterPath = 'Text/chapter_0.html';
    if (zip.files[illustrationChapterPath]) {
      const content = await zip.files[illustrationChapterPath].async('string');
      // 提取图片标签
      const imgRegex = /<img[^>]+src="([^"]+)"[^>]*>/gi;
      let match;
      console.log('  图片标签:');
      while ((match = imgRegex.exec(content)) !== null) {
        console.log(`    ${match[0]}`);
      }
    } else {
      console.log('  未找到插图章节');
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

// 测试用例
const epubFilename = process.argv[2] || '你的名字。.epub';
checkEpubImages(epubFilename);

// 导入修改后的extractChaptersFromNcx函数进行测试
const epubController = require('./controllers/epubController');

// 测试extractChaptersFromNcx函数
async function testExtractChapters() {
  try {
    const epubPath = path.join(__dirname, 'public/epub', epubFilename);
    const epubData = fs.readFileSync(epubPath);
    const zip = await JSZip.loadAsync(epubData);
    
    // 查找目录文件
    let tocPath = '';
    for (const file in zip.files) {
      if (file.endsWith('toc.ncx') || file.includes('toc')) {
        tocPath = file;
        break;
      }
    }
    
    if (tocPath) {
      const tocContent = await zip.file(tocPath).async('string');
      // 直接调用extractChaptersFromNcx函数进行测试
      const chapters = eval('(' + fs.readFileSync('./controllers/epubController.js', 'utf8').match(/function extractChaptersFromNcx[\s\S]*?\}/) + ')')(tocContent);
      console.log('\n=== 章节提取测试结果 ===');
      console.log(`提取到 ${chapters.length} 个章节:`);
      chapters.forEach((chapter, index) => {
        console.log(`${index + 1}. ${chapter.title} -> ${chapter.href}`);
      });
    }
  } catch (error) {
    console.error('章节提取测试失败:', error);
  }
}

// 运行章节提取测试
testExtractChapters();

