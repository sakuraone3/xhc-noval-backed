// 小说数据模型，暂时使用内存存储
const novels = [
  {
    id: 1,
    title: '你的名字。',
    originalTitle: '君の名は。',
    author: '新海诚',
    description: '在梦中互换身体的两名少年少女，寻找彼此的故事。',
    coverImage: 'https://example.com/your-name-cover.jpg',
    publishDate: '2016-08-26',
    chapters: [
      { id: 1, title: '第一章 梦', content: '这是第一章的内容...' },
      { id: 2, title: '第二章 相遇', content: '这是第二章的内容...' }
    ]
  },
  {
    id: 2,
    title: '天气之子',
    originalTitle: '天気の子',
    author: '新海诚',
    description: '能够控制天气的少女阳菜与少年帆高的故事。',
    coverImage: 'https://example.com/weathering-with-you-cover.jpg',
    publishDate: '2019-07-19',
    chapters: [
      { id: 1, title: '第一章 东京', content: '这是第一章的内容...' },
      { id: 2, title: '第二章 晴天女孩', content: '这是第二章的内容...' }
    ]
  },
  {
    id: 3,
    title: '言叶之庭',
    originalTitle: '言の葉の庭',
    author: '新海诚',
    description: '以雨天的东京庭园为舞台，15岁的高中生孝雄与神秘女性雪野的故事。',
    coverImage: 'https://example.com/garden-of-words-cover.jpg',
    publishDate: '2013-05-31',
    chapters: [
      { id: 1, title: '第一章 梅雨', content: '这是第一章的内容...' },
      { id: 2, title: '第二章 制鞋', content: '这是第二章的内容...' }
    ]
  }
];

module.exports = novels;
