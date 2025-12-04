// 小说数据模型，暂时使用内存存储
const novels = [
  {
    id: 1,
    title: '你的名字。',
    originalTitle: '君の名は。',
    author: '新海诚',
    description: '在梦中互换身体的两名少年少女，寻找彼此的故事。',
    coverImage: '/cover/你的名字。.jpg',
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
    coverImage: '/cover/天气之子.jpg',
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
    coverImage: '/cover/言叶之庭.jpg',
    publishDate: '2013-05-31',
    chapters: [
      { id: 1, title: '第一章 梅雨', content: '这是第一章的内容...' },
      { id: 2, title: '第二章 制鞋', content: '这是第二章的内容...' }
    ]
  },
  {
    id: 4,
    title: '云之彼端，约定的地方',
    originalTitle: '雲のむこう、約束の場所',
    author: '新海诚',
    description: '在战乱的时代背景下，三个少年少女跨越时空的约定。',
    coverImage: '/cover/云之彼端，约定的地方.jpg',
    publishDate: '2004-02-22',
    chapters: [
      { id: 1, title: '第一章 相遇', content: '这是第一章的内容...' },
      { id: 2, title: '第二章 约定', content: '这是第二章的内容...' }
    ]
  },
  {
    id: 5,
    title: '她和她的猫',
    originalTitle: '彼女と彼女の猫',
    author: '新海诚',
    description: '以一只猫的视角，讲述它与女主人之间的故事。',
    coverImage: '/cover/她和她的猫.jpg',
    publishDate: '1999-02-22',
    chapters: [
      { id: 1, title: '第一章 相遇', content: '这是第一章的内容...' },
      { id: 2, title: '第二章 生活', content: '这是第二章的内容...' }
    ]
  },
  {
    id: 6,
    title: '星之声',
    originalTitle: 'ほしのこえ',
    author: '新海诚',
    description: '跨越宇宙距离的少男少女，通过短信传递思念的故事。',
    coverImage: '/cover/星之声.jpg',
    publishDate: '2002-02-02',
    chapters: [
      { id: 1, title: '第一章 出发', content: '这是第一章的内容...' },
      { id: 2, title: '第二章 思念', content: '这是第二章的内容...' }
    ]
  },
  {
    id: 7,
    title: '秒速5厘米',
    originalTitle: '秒速5センチメートル',
    author: '新海诚',
    description: '三个关于距离与时间的故事，讲述人与人之间的情感变迁。',
    coverImage: '/cover/秒速5厘米.jpg',
    publishDate: '2007-03-03',
    chapters: [
      { id: 1, title: '第一章 樱花抄', content: '这是第一章的内容...' },
      { id: 2, title: '第二章 宇航员', content: '这是第二章的内容...' }
    ]
  },
  {
    id: 8,
    title: '追逐繁星的孩子',
    originalTitle: '星を追う子ども',
    author: '新海诚',
    description: '少女明日菜踏上寻找传说中地下世界的旅程，探索生命与死亡的意义。',
    coverImage: '/cover/追逐繁星的孩子.jpg',
    publishDate: '2011-05-07',
    chapters: [
      { id: 1, title: '第一章 相遇', content: '这是第一章的内容...' },
      { id: 2, title: '第二章 地下世界', content: '这是第二章的内容...' }
    ]
  },
  {
    id: 9,
    title: '铃芽之旅',
    originalTitle: 'すずめの戸締まり',
    author: '新海诚',
    description: '少女铃芽与神秘少年草太一起关闭灾难之门的冒险故事。',
    coverImage: '/cover/铃芽之旅.jpg',
    publishDate: '2022-11-11',
    chapters: [
      { id: 1, title: '第一章 相遇', content: '这是第一章的内容...' },
      { id: 2, title: '第二章 冒险', content: '这是第二章的内容...' }
    ]
  }
];

module.exports = novels;
