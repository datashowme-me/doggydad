import { PrizeMetadata, Achievement } from '../types';

export const PRIZES: PrizeMetadata[] = [
  {
    id: 'starry_bear',
    name: '星涡小熊手办',
    originalArtwork: '《星夜》(The Starry Night)',
    artist: '文森特·梵高 (Vincent van Gogh)',
    year: '1889 年',
    museum: '纽约现代艺术博物馆 (MoMA) / Google Arts & Culture',
    description: '梵高在圣雷米疗养院创作的传世巅峰之作。小熊身着旋转的深蓝夜空与闪耀的金黄星漩涡，头部配有一弯静谧新月，传递热烈而深沉的浪漫主义情感。',
    rarity: 'Legendary',
    accentColor: '#3b82f6',
    figurineType: 'bear'
  },
  {
    id: 'mona_cat',
    name: '蒙娜丽猫雕偶',
    originalArtwork: '《蒙娜丽莎》(Mona Lisa)',
    artist: '列奥纳多·达·芬奇 (Leonardo da Vinci)',
    year: '1503–1519 年',
    museum: '法国卢浮宫博物馆 (Musée du Louvre) / Google Arts & Culture',
    description: '文艺复兴时期的永恒经典。玩偶采用达芬奇独创的渐隐晕涂法（Sfumato），嘴角蕴含着令人难以捉摸的优雅微笑，披覆深褐色古典披肩。',
    rarity: 'Rare',
    accentColor: '#854d0e',
    figurineType: 'cat'
  },
  {
    id: 'pearl_bunny',
    name: '珍珠耳环兔宝',
    originalArtwork: '《戴珍珠耳环的少女》(Girl with a Pearl Earring)',
    artist: '约翰内斯·维米尔 (Johannes Vermeer)',
    year: '1665 年',
    museum: '海牙莫瑞泰斯皇家美术馆 (Mauritshuis) / Google Arts & Culture',
    description: '“北方蒙娜丽莎”之称的荷兰光影杰作。小兔耳畔佩戴一颗温润反光的晶莹大珍珠，头系鲜艳珍贵的青金石东方蓝头巾，神情温柔而纯真。',
    rarity: 'Legendary',
    accentColor: '#0284c7',
    figurineType: 'bunny'
  },
  {
    id: 'great_wave_whale',
    name: '神奈川巨浪小鲸',
    originalArtwork: '《神奈川冲浪里》(The Great Wave off Kanagawa)',
    artist: '葛饰北斋 (Katsushika Hokusai)',
    year: '1831 年',
    museum: '东京国立博物馆 / 大英博物馆 / Google Arts & Culture',
    description: '日本江户时代浮世绘木版画的巅峰代表。小鲸鱼脊背翻涌着如利爪般的苍白浪花，腹部呈现深沉的普鲁士蓝海浪，尾鳍跃动着大自然磅礴的生命力。',
    rarity: 'Rare',
    accentColor: '#0369a1',
    figurineType: 'whale'
  },
  {
    id: 'scream_ghost',
    name: '呐喊惊奇玩偶',
    originalArtwork: '《呐喊》(The Scream)',
    artist: '爱德华·蒙克 (Edvard Munch)',
    year: '1893 年',
    museum: '挪威奥斯陆国家美术馆 (National Museum, Oslo) / Google Arts & Culture',
    description: '表现主义的震颤之音。玩偶以流线型扭曲身躯配上双手托腮张嘴的戏剧化造型，背部映照着血红与橙黄交织的激荡天空，充满情绪张力。',
    rarity: 'Common',
    accentColor: '#ea580c',
    figurineType: 'scream'
  },
  {
    id: 'cubist_dog',
    name: '立体主义斑点犬',
    originalArtwork: '《三位音乐家 / 亚维农的少女》(Cubism Works)',
    artist: '巴勃罗·毕加索 (Pablo Picasso)',
    year: '1907–1921 年',
    museum: '巴黎毕加索博物馆 (Musée Picasso) / Google Arts & Culture',
    description: '打破单重视角的立体主义革命。小狗由多重解构的几何面块、几何折纸感色块拼接而成，正面与侧面在同一空间交织，趣味前卫。',
    rarity: 'Common',
    accentColor: '#b45309',
    figurineType: 'dog'
  },
  {
    id: 'water_lily_capybara',
    name: '睡莲仙境水豚',
    originalArtwork: '《睡莲》(Water Lilies Series)',
    artist: '克劳德·莫奈 (Claude Monet)',
    year: '1914–1926 年',
    museum: '巴黎橘园美术馆 (Musée de l\'Orangerie) / Google Arts & Culture',
    description: '印象派光影与池塘色彩的极致交响。从容温和的水豚头顶漂浮着淡粉娇艳的睡莲，周身布满水光波影斑驳的紫绿笔触，自带禅意与治愈感。',
    rarity: 'Common',
    accentColor: '#15803d',
    figurineType: 'capybara'
  },
  {
    id: 'kiss_lion',
    name: '黄金之吻幼狮',
    originalArtwork: '《吻》(The Kiss / Der Kuss)',
    artist: '古斯塔夫·克里姆特 (Gustav Klimt)',
    year: '1907–1908 年',
    museum: '维也纳美景宫美术馆 (Belvedere Museum) / Google Arts & Culture',
    description: '维也纳分离派的金色辉煌圣咏。小狮毛发与披巾布满金箔般耀眼的几何螺旋、长方块花纹与彩色波点，象征爱与艺术的永恒炽热。',
    rarity: 'Legendary',
    accentColor: '#d97706',
    figurineType: 'lion'
  },
  {
    id: 'rainbow_pony',
    name: '云宝彩虹飞马',
    originalArtwork: '《小马宝莉》(My Little Pony) · 云宝 (Rainbow Dash)',
    artist: '极速忠诚之翼 · 彩虹飞马雕偶',
    year: '经典卡通系列',
    museum: '小马宝莉梦幻宇宙 (MLP Collection)',
    description: '拥有蔚蓝身躯与标志性绚丽彩虹鬃毛的传奇天马。背生轻灵双翼，臀部饰有红黄蓝三色闪电与白云可爱标志（Cutie Mark），象征纯粹的勇气与忠诚！',
    rarity: 'Legendary',
    accentColor: '#0ea5e9',
    figurineType: 'rainbow_pony'
  },
  {
    id: 'twilight_pony',
    name: '紫悦星光独角兽',
    originalArtwork: '《小马宝莉》(My Little Pony) · 紫悦 (Twilight Sparkle)',
    artist: '友谊魔法导师 · 星光紫灵雕偶',
    year: '经典卡通系列',
    museum: '坎特洛特皇家图书馆 / 小马宝莉梦幻宇宙',
    description: '深紫色的高贵独角兽公主。额头耸立优雅的魔法角，深蓝色鬃毛中夹带着粉紫亮缕，可爱标志为粉红六芒星与星辉，代表友谊与渊博智慧的奇迹魔法！',
    rarity: 'Legendary',
    accentColor: '#a855f7',
    figurineType: 'twilight_pony'
  },
  {
    id: 'pinkie_pony',
    name: '碧琪派对甜心小马',
    originalArtwork: '《小马宝莉》(My Little Pony) · 碧琪 (Pinkie Pie)',
    artist: '欢乐欢笑精灵 · 棉花糖粉偶',
    year: '经典卡通系列',
    museum: '方糖甜点屋 / 小马宝莉梦幻宇宙',
    description: '宛如棉花糖般蓬松卷翘的艳粉色鬃毛与灿烂笑颜。可爱的蓝色与黄色派对气球标志，能为每一个遇到她的朋友带来驱散阴霾的无限快乐与欢笑！',
    rarity: 'Rare',
    accentColor: '#ec4899',
    figurineType: 'pinkie_pony'
  },
  {
    id: 'fluttershy_pony',
    name: '柔柔花语蝶翼小马',
    originalArtwork: '《小马宝莉》(My Little Pony) · 柔柔 (Fluttershy)',
    artist: '自然亲和之语 · 浅柔萌马雕偶',
    year: '经典卡通系列',
    museum: '小马谷林间小屋 / 小马宝莉梦幻宇宙',
    description: '淡奶油黄温和身躯配上一袭柔粉色垂坠长卷发。拥有轻盈的天马羽翼，臀部佩戴三只粉青蝴蝶标志，性格羞涩善良，能够倾听并照顾所有小动物的心声。',
    rarity: 'Rare',
    accentColor: '#eab308',
    figurineType: 'fluttershy_pony'
  },
  {
    id: 'applejack_pony',
    name: '苹果嘉儿牛仔小马',
    originalArtwork: '《小马宝莉》(My Little Pony) · 苹果嘉儿 (Applejack)',
    artist: '诚实勤劳农场之星 · 牛仔小马雕偶',
    year: '经典卡通系列',
    museum: '甜苹果园 / 小马宝莉梦幻宇宙',
    description: '头戴棕色西部牛仔宽檐帽、拥有温暖橙色身躯与金色干练马尾辫。臀部绘有三枚鲜红甜脆的红苹果可爱标志，代表至死不渝的诚实与勤劳！',
    rarity: 'Rare',
    accentColor: '#f97316',
    figurineType: 'applejack_pony'
  },
  {
    id: 'rarity_pony',
    name: '珍奇高贵独角兽',
    originalArtwork: '《小马宝莉》(My Little Pony) · 珍奇 (Rarity)',
    artist: '时尚设计女王 · 优雅紫晶雕偶',
    year: '经典卡通系列',
    museum: '旋转木马精品店 / 坎特洛特高级定制',
    description: '纯白如雪的无瑕身躯配以华丽深紫色波浪卷发。额前耸立精美独角，可爱标志为三颗晶莹剔透的湛蓝菱形钻石，象征无私慷慨与极致时尚美学！',
    rarity: 'Legendary',
    accentColor: '#8b5cf6',
    figurineType: 'rarity_pony'
  },
  {
    id: 'celestia_pony',
    name: '宇宙公主太阳天角兽',
    originalArtwork: '《小马宝莉》(My Little Pony) · 宇宙公主 (Princess Celestia)',
    artist: '日轮拂晓女王 · 皇室天角兽雕偶',
    year: '皇家千年传奇',
    museum: '坎特洛特皇宫中央殿堂 / 小马宝莉梦幻宇宙',
    description: '小马利亚至高无上的太阳女王。纯白身躯拥有流光溢彩的浅粉绿蓝极光渐变长鬃毛，头戴金色王冠与金胸甲，臀部闪耀着灿烂金阳标志，统御白昼！',
    rarity: 'Legendary',
    accentColor: '#fbbf24',
    figurineType: 'celestia_pony'
  },
  {
    id: 'luna_pony',
    name: '月亮公主星夜天角兽',
    originalArtwork: '《小马宝莉》(My Little Pony) · 月亮公主 (Princess Luna)',
    artist: '静谧夜幕女王 · 星夜天角兽雕偶',
    year: '皇家千年传奇',
    museum: '梦境星辰之塔 / 小马宝莉梦幻宇宙',
    description: '统治静谧黑夜的夜之公主。深邃幽蓝身躯与流动着点点璀璨星河的半透明夜幕鬃毛，臀部印刻着暗紫黑夜与皎洁弯月标志，守护每一个甜美梦境！',
    rarity: 'Legendary',
    accentColor: '#1e3a8a',
    figurineType: 'luna_pony'
  },
  {
    id: 'dali_clock',
    name: '达利融化软钟熊',
    originalArtwork: '《记忆的永恒》(The Persistence of Memory)',
    artist: '萨尔瓦多·达利 (Salvador Dalí)',
    year: '1931 年',
    museum: '纽约现代艺术博物馆 (MoMA) / Google Arts & Culture',
    description: '超现实主义潜意识的奇幻造物。小熊耳际与肩头搭挂着一块仿佛被时间烈日晒软熔化的软塌钟表，表盘凝固在神秘刻度上，充满哲思与荒诞张力。',
    rarity: 'Legendary',
    accentColor: '#d97706',
    figurineType: 'dali_clock'
  },
  {
    id: 'kusama_pumpkin',
    name: '草间波点幻境小章鱼',
    originalArtwork: '《南瓜 / 无限波点》(Pumpkin & Infinity Dots)',
    artist: '草间弥生 (Yayoi Kusama)',
    year: '1990 年',
    museum: '松本市立美术馆 / 大田秀则画廊 / Google Arts & Culture',
    description: '全球波点女王的迷幻代表作。明艳温暖的鲜黄底色上布满大小递进的黑色圆点，萌系触手与圆润南瓜体融为一体，带来无限繁衍的波点视觉震撼！',
    rarity: 'Rare',
    accentColor: '#eab308',
    figurineType: 'kusama_pumpkin'
  },
  {
    id: 'warhol_soup',
    name: '沃霍尔波普番茄浣熊',
    originalArtwork: '《金宝汤罐头》(Campbell\'s Soup Cans)',
    artist: '安迪·沃霍尔 (Andy Warhol)',
    year: '1962 年',
    museum: '纽约现代艺术博物馆 (MoMA) / Google Arts & Culture',
    description: '20世纪波普艺术的开山图腾。小浣熊身穿经典红白双色金宝番茄汤罐头外衣，胸前印着金质皇家勋章纹饰，极具美式复古摩登波普潮流感。',
    rarity: 'Common',
    accentColor: '#ef4444',
    figurineType: 'warhol_soup'
  },
  {
    id: 'angel_pup',
    name: '米开朗基罗圣天使小狗',
    originalArtwork: '《创造亚当 / 西斯廷礼拜堂天顶画》(Renaissance Angels)',
    artist: '米开朗基罗 (Michelangelo Buonarroti)',
    year: '1508–1512 年',
    museum: '梵蒂冈西斯廷礼拜堂 / Google Arts & Culture',
    description: '文艺复兴三杰的纯白圣洁造物。小狗拥有意大利纯白大理石温润质感，背生一双微缩金色羽翼，神态庄重安详，宛如穹顶壁画中轻跃的小天使。',
    rarity: 'Common',
    accentColor: '#f8fafc',
    figurineType: 'angel_pup'
  },
  {
    id: 'teletubby_tinky',
    name: '丁丁天线宝宝',
    originalArtwork: '《天线宝宝》(Teletubbies) · 丁丁 (Tinky Winky)',
    artist: '英国 BBC 经典童年治愈系 IP · 紫色巨萌天线偶',
    year: '经典童年回忆',
    museum: '神奇岛幻想乐园 / Teletubbyland',
    description: '身材最高大的温柔绅士丁丁！拥有梦幻深紫色绒毛身体，头顶标志性倒三角形天线，肚皮上镶嵌着银色电视屏幕，最喜欢挎着他心爱的鲜红魔法大手提包！',
    rarity: 'Legendary',
    accentColor: '#7c3aed',
    figurineType: 'teletubby_tinky'
  },
  {
    id: 'teletubby_dipsy',
    name: '迪西天线宝宝',
    originalArtwork: '《天线宝宝》(Teletubbies) · 迪西 (Dipsy)',
    artist: '英国 BBC 经典童年治愈系 IP · 酷炫绿苗天线偶',
    year: '经典童年回忆',
    museum: '神奇岛幻想乐园 / Teletubbyland',
    description: '个性十足、热爱跳舞的绿色小酷哥迪西！头顶一根直立如避雷针的直线天线，拥有草绿色绒毛身躯与银色电视腹部，最宝贝的是他的黑白奶牛斑纹魔术礼帽！',
    rarity: 'Rare',
    accentColor: '#16a34a',
    figurineType: 'teletubby_dipsy'
  },
  {
    id: 'teletubby_laalaa',
    name: '拉拉天线宝宝',
    originalArtwork: '《天线宝宝》(Teletubbies) · 拉拉 (Laa-Laa)',
    artist: '英国 BBC 经典童年治愈系 IP · 卷曲螺旋金阳偶',
    year: '经典童年回忆',
    museum: '神奇岛幻想乐园 / Teletubbyland',
    description: '活泼开朗、爱唱歌的太阳女孩拉拉！拥有如向日葵般灿烂的亮黄色身体，头顶卷卷如小尾巴的螺旋天线，最喜欢在神奇山丘上拍打她巨大的橘色弹力皮球！',
    rarity: 'Rare',
    accentColor: '#eab308',
    figurineType: 'teletubby_laalaa'
  },
  {
    id: 'teletubby_po',
    name: '小波天线宝宝',
    originalArtwork: '《天线宝宝》(Teletubbies) · 小波 (Po)',
    artist: '英国 BBC 经典童年治愈系 IP · 淘气红圈天线偶',
    year: '经典童年回忆',
    museum: '神奇岛幻想乐园 / Teletubbyland',
    description: '年纪最小、最受宠爱的萌系娇娃小波！通体娇艳纯正的中国红，头顶一个小圆环形状的天线，常常踏着她飞快的小粉红滑板车穿梭在花丛中，软萌治愈！',
    rarity: 'Legendary',
    accentColor: '#ef4444',
    figurineType: 'teletubby_po'
  }
];

export const INITIAL_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_catch',
    title: '第一件藏品',
    description: '成功在 3D 抓娃娃机中抓到任意 1 个艺术或卡通手办',
    icon: 'Sparkles',
    rewardCoins: 3,
    condition: (stats) => stats.totalCatches >= 1
  },
  {
    id: 'pony_friendship',
    title: '友谊的魔法',
    description: '成功抓捕任意 1 只小马宝莉（My Little Pony）系列小马玩偶！',
    icon: 'Sparkles',
    rewardCoins: 5,
    condition: (stats) => stats.distinctPrizesCaught >= 1
  },
  {
    id: 'teletubby_hug',
    title: '大大的拥抱！',
    description: '成功抓到任意 1 只萌态可掬的天线宝宝（Teletubbies）玩偶！',
    icon: 'Sparkles',
    rewardCoins: 5,
    condition: (stats) => stats.distinctPrizesCaught >= 1
  },
  {
    id: 'perserverance',
    title: '匠人之心',
    description: '累计投入 10 枚代币，坚持不懈追求心仪玩偶',
    icon: 'Coins',
    rewardCoins: 5,
    condition: (stats) => stats.coinsSpent >= 10
  },
  {
    id: 'art_connoisseur',
    title: '资深鉴赏家',
    description: '收集到 6 种不同名作、小马宝莉或天线宝宝手办',
    icon: 'Palette',
    rewardCoins: 8,
    condition: (stats) => stats.distinctPrizesCaught >= 6
  },
  {
    id: 'legend_collector',
    title: '传奇收藏大师',
    description: '集齐至少 3 款传世传奇级 (Legendary) 手办',
    icon: 'Crown',
    rewardCoins: 12,
    condition: (stats) => stats.totalCatches >= 3
  },
  {
    id: 'sharp_shooter',
    title: '百发百中神爪',
    description: '累计成功抓获 8 次手办',
    icon: 'Trophy',
    rewardCoins: 15,
    condition: (stats) => stats.totalCatches >= 8
  },
  {
    id: 'grand_exhibition',
    title: '全图鉴大满贯 (24件)',
    description: '收集齐全部 24 款名画大师、小马宝莉与天线宝宝全套手办！',
    icon: 'Award',
    rewardCoins: 60,
    condition: (stats) => stats.distinctPrizesCaught >= 24
  }
];
