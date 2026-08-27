(() => {
  "use strict";

  const hash = (text) => [...text].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const choice = (prompt, visual, answer, wrongAnswers, extra = {}) => {
    const candidates = [];
    const add = (item) => { if (!candidates.includes(item)) candidates.push(item); };
    add(answer);
    wrongAnswers.forEach(add);
    const numericAnswer = Number(answer);
    if (Number.isFinite(numericAnswer)) {
      for (let offset = 1; candidates.length < 4; offset += 1) {
        add(String(numericAnswer + offset));
        add(String(Math.max(0, numericAnswer - offset)));
      }
    } else {
      ["以上都不对", "不能确定", "两者都对", "再想一想"].forEach(add);
    }
    const base = candidates.slice(0, 4);
    const shift = hash(`${prompt}${visual}${answer}`) % base.length;
    const answers = [...base.slice(shift), ...base.slice(0, shift)];
    return { type: "choice", prompt, visual, answers, correct: answers.indexOf(answer), ...extra };
  };
  const lesson = (title, goal, questions, note = "") => ({ title, goal, questions, note });

  const chineseSpecial = [
    lesson("我上学了·我是中国人", "用完整的话介绍自己，认识国旗和首都", [
      choice("向新同学介绍自己，哪句话最完整？", "开学第一天", "我是中国人，我叫小雨。", ["中国人。", "小雨是。", "我书包。"]),
      choice("中国的国旗是哪一面？", "🇨🇳 🇬🇧 🇯🇵", "🇨🇳", ["🇬🇧", "🇯🇵", "都不是"]),
      choice("我国的首都是哪里？", "天安门", "北京", ["上海", "广州", "杭州"])
    ]),
    lesson("我上学了·我爱我们的祖国", "联系北京生活，用普通话表达所见所感", [
      choice("看到五星红旗升起，最合适的做法是？", "🇨🇳", "立正并注视国旗", ["追跑打闹", "背对国旗", "大声聊天"]),
      choice("哪句话说得完整？", "我爱北京", "我爱北京天安门。", ["爱北京。", "北京我。", "天安门爱。"]),
      choice("介绍自己的家乡，可以先说什么？", "北京", "我的家乡在北京。", ["北京很多。", "家乡一个。", "在我的。"])
    ]),
    lesson("我上学了·我是小学生", "建立课堂、课间和整理物品的基本习惯", [
      choice("上课想发言，应该先怎么做？", "老师正在提问", "举手等待", ["直接喊答案", "离开座位", "和同桌聊天"]),
      choice("听到上课铃，应该怎么做？", "🔔", "回到座位准备上课", ["继续追跑", "躲到门外", "把书扔地上"]),
      choice("放学整理书包，哪种顺序更合适？", "🎒", "检查物品，再分类装好", ["全部塞进去", "只装玩具", "把文具留在地上"])
    ]),
    lesson("我上学了·我爱学语文", "认识语文学习中的听、说、读、写", [
      choice("别人读故事时，我们先做什么？", "👂", "安静听完整", ["随意打断", "捂住耳朵", "跑出房间"]),
      choice("读书时，哪种姿势更合适？", "📖", "坐正，书本离眼睛适当距离", ["趴得很低", "躺着看", "边跑边看"]),
      choice("想把事情讲清楚，应该怎么说？", "🗣️", "按顺序说完整", ["只说一个字", "越快越好", "想到哪里说哪里"])
    ])
  ];

  const hanziUnits = [
    ["第一单元·天地人", "天", "tiān", "🌤️", "天空"],
    ["第一单元·金木水火土", "木", "mù", "🌳", "木头"],
    ["第一单元·口耳目手足", "目", "mù", "👁️", "目光"],
    ["第一单元·日月山川", "山", "shān", "⛰️", "高山"],
    ["语文园地一·反义词", "上", "shàng", "⬆️", "上下"],
    ["快乐读书吧·读书真快乐", "书", "shū", "📖", "书本"]
  ];
  const hanziChars = hanziUnits.map((item) => item[1]);
  const hanziPinyin = hanziUnits.map((item) => item[2]);
  const hanziWords = hanziUnits.map((item) => item[4]);
  const makeHanziLesson = (unit, index) => {
    const [title, char, pinyin, emoji, word] = unit;
    const other = (array) => [...new Set(array.filter((item) => item !== array[index]))].slice(0, 3);
    return lesson(title, `认识“${char}”，在图和词语中反复认读`, [
      choice("图片更接近哪个汉字？", emoji, char, other(hanziChars)),
      choice(`“${char}”怎么读？`, char, pinyin, other(hanziPinyin)),
      choice(`哪个词语里有“${char}”？`, char, word, other(hanziWords))
    ], "认一认即可，不要求孩子反复抄写。 ");
  };

  const toneNames = ["第一声（ˉ）", "第二声（ˊ）", "第三声（ˇ）", "第四声（ˋ）"];
  const pinyinUnits = [
    ["第二单元·a o e", "é", "鹅", 2], ["第二单元·i u ü", "yú", "鱼", 2],
    ["第二单元·b p m f", "bā", "八", 1], ["第二单元·d t n l", "dà", "大", 4],
    ["语文园地二·声调复习", "mǐ", "米", 3],
    ["第三单元·g k h", "kǒu", "口", 3], ["第三单元·j q x", "qí", "旗", 2],
    ["第三单元·z c s", "zǎo", "早", 3], ["第三单元·zh ch sh r", "shū", "书", 1],
    ["第三单元·y w", "wǔ", "五", 3], ["语文园地三·整体认读", "rì", "日", 4],
    ["第四单元·ai ei ui", "bái", "白", 2], ["第四单元·ao ou iu", "niǎo", "鸟", 3],
    ["第四单元·ie üe er", "yuè", "月", 4], ["第四单元·an en in un ün", "tiān", "天", 1],
    ["第四单元·ang eng ing ong", "xīng", "星", 1], ["语文园地四·拼音综合", "hóng", "红", 2]
  ];
  const pinyinSyllables = pinyinUnits.map((item) => item[1]);
  const pinyinChars = pinyinUnits.map((item) => item[2]);
  const makePinyinLesson = (unit, index) => {
    const [title, syllable, char, tone] = unit;
    const others = (array) => [...new Set(array.filter((item) => item !== array[index]))].slice(0, 3);
    return lesson(title, `借助熟悉的字认读音节“${syllable}”`, [
      choice(`“${char}”的拼音是哪个？`, char, syllable, others(pinyinSyllables)),
      choice(`音节“${syllable}”是第几声？`, syllable, toneNames[tone - 1], toneNames.filter((_, i) => i !== tone - 1)),
      choice(`哪个字读“${syllable}”？`, syllable, char, others(pinyinChars))
    ], "先听家长示范，再让孩子跟读一次即可。 ");
  };

  const readingUnits = [
    ["第五单元·秋天", "秋风轻轻吹，树叶慢慢落。", ["什么慢慢落下来？", "树叶", ["小鸟", "雨伞", "书包"]], "观察季节变化"],
    ["第五单元·江南", "江南水乡荷叶圆，小鱼在水里游。", ["小鱼在哪里游？", "水里", ["天上", "山上", "书包里"]], "寻找地点信息"],
    ["第五单元·雪地里的小画家", "雪地上留下小狗的脚印，像一朵小梅花。", ["谁在雪地上留下脚印？", "小狗", ["小鱼", "小鸟", "小猫"]], "借助图画理解比喻"],
    ["第五单元·四季", "春天小草绿，夏天荷花开。", ["荷花在哪个季节开放？", "夏天", ["春天", "秋天", "冬天"]], "按顺序认识四季"],
    ["语文园地五·词语搭配", "弯弯的月儿挂在蓝蓝的天上。", ["什么是弯弯的？", "月儿", ["天空", "书包", "大树"]], "积累合适的词语搭配"],
    ["语文园地五·明显信息", "小林穿上外套，和爸爸一起去公园。", ["小林和谁去公园？", "爸爸", ["妈妈", "老师", "同学"]], "从句子中找明显信息"],
    ["语文园地五·朗读停顿", "秋天来了，天气凉了。", ["天气怎么样了？", "凉了", ["热了", "黑了", "亮了"]], "按逗号和句号停顿"],
    ["第五单元·阅读回声", "我借助拼音读句子，再从句子中找答案。", ["读句子遇到困难，可以先借助什么？", "拼音", ["颜色", "数字", "钟表"]], "运用拼音读懂句子"],
    ["第六单元·对韵歌", "云对雨，雪对风，花对树。", ["“云”在句中和谁相对？", "雨", ["花", "树", "山"]], "感受相对词和韵律"],
    ["第六单元·日月明", "日和月组成明，田和力组成男。", ["“日”和“月”可以组成哪个字？", "明", ["男", "林", "从"]], "发现会意字的构字方法"],
    ["第六单元·小书包", "书包里有课本、作业本和铅笔盒。", ["哪样东西没有出现在句子里？", "皮球", ["课本", "作业本", "铅笔盒"]], "认识常用学习用品"],
    ["第六单元·升国旗", "国歌声中，五星红旗慢慢升起。", ["什么慢慢升起？", "五星红旗", ["月亮", "书包", "小船"]], "朗读庄重的句子"],
    ["语文园地六·给词语分类", "铅笔、橡皮、尺子都是文具。", ["下面哪个也是文具？", "转笔刀", ["苹果", "皮球", "雨伞"]], "按用途给词语分类"],
    ["语文园地六·量词搭配", "我有一本书、一支笔和一把尺子。", ["“一___书”应该填什么？", "本", ["支", "把", "只"]], "正确使用常见量词"],
    ["语文园地六·说完整", "放学后，我先整理桌面，再收拾书包。", ["“我”先做什么？", "整理桌面", ["收拾书包", "跑出教室", "吃午饭"]], "按先后顺序表达"],
    ["第六单元·识字回声", "日月组成明，双木组成林，三木组成森。", ["两个“木”组成什么字？", "林", ["明", "森", "从"]], "利用熟字认识新字"],
    ["第七单元·小小的船", "弯弯的月儿像小船，闪闪的星星在天上。", ["月儿像什么？", "小船", ["书包", "雨伞", "小桥"]], "积累偏正短语"],
    ["第七单元·影子", "太阳在我前面，影子就在我后面。", ["影子在哪里？", "后面", ["前面", "上面", "里面"]], "联系生活理解方位"],
    ["第七单元·两件宝", "小手会做事，大脑会思考，手脑一起用。", ["大脑会做什么？", "思考", ["走路", "拿笔", "拍球"]], "寻找明显信息"],
    ["语文园地七·叠词", "星星闪闪，月儿弯弯，河水清清。", ["哪个词适合形容月儿？", "弯弯", ["闪闪", "清清", "高高"]], "合理搭配叠词"],
    ["语文园地七·方位", "小树在房子的左边，小河在房子的右边。", ["小河在房子的哪边？", "右边", ["左边", "上面", "里面"]], "根据句子判断位置"],
    ["语文园地七·找信息", "周六上午，小雨和妈妈去图书馆看书。", ["小雨什么时候去图书馆？", "周六上午", ["周五晚上", "周日上午", "周一下午"]], "寻找时间信息"],
    ["语文园地七·读长句", "放学以后，我把今天学会的故事讲给奶奶听。", ["“我”把故事讲给谁听？", "奶奶", ["老师", "同学", "小猫"]], "读好稍长的句子"],
    ["第七单元·阅读回声", "读句子时，我会找到时间、人物和事情。", ["读句子要找哪些信息？", "时间、人物和事情", ["只找数字", "只看第一个字", "只看标点"]], "归纳句子的主要信息"],
    ["第八单元·比尾巴", "猴子的尾巴长，兔子的尾巴短。", ["谁的尾巴短？", "兔子", ["猴子", "松鼠", "孔雀"]], "读好问句并比较特点"],
    ["第八单元·乌鸦喝水", "瓶里的水太少，乌鸦把小石子一颗颗放进瓶里。", ["乌鸦把什么放进瓶里？", "小石子", ["树叶", "羽毛", "果子"]], "按事情发展理解办法"],
    ["第八单元·雨点儿", "大雨点儿去了没有花草的地方，小雨点儿去了有花有草的地方。", ["小雨点儿去了哪里？", "有花有草的地方", ["没有花草的地方", "雪地", "教室"]], "联系上下文找答案"],
    ["语文园地八·读好问句", "谁的耳朵长？谁的尾巴像伞？", ["这两句话应该读出什么语气？", "提问的语气", ["命令的语气", "生气的语气", "告别的语气"]], "根据问号读出语气"],
    ["语文园地八·原因结果", "石子放进瓶里，水面慢慢升高了。", ["水面为什么升高？", "因为放进了石子", ["因为刮风了", "因为天黑了", "因为瓶子变小了"]], "理解简单因果关系"],
    ["语文园地八·我会想办法", "皮球滚到桌子下面，小明用长尺把它轻轻拨出来。", ["小明用了什么办法？", "用长尺拨出来", ["一直哭", "不管皮球", "把桌子推倒"]], "说清解决问题的办法"],
    ["语文园地八·分角色", "小青蛙说：“我要去找妈妈。”小鱼说：“我来帮你。”", ["谁愿意帮助小青蛙？", "小鱼", ["妈妈", "乌鸦", "小兔"]], "分清不同人物说的话"],
    ["语文园地八·看图阅读", "图上有两只小鸟。它们一只站在树上，一只飞向天空。", ["一共有几只小鸟？", "两只", ["一只", "三只", "四只"]], "结合图画和文字阅读"],
    ["全册·复习与关联", "我会借助拼音读句子，也会从句子里找人物、时间、地点和事情。", ["遇到不认识的字，先怎样做？", "借助拼音试着读", ["随便猜", "马上放弃", "只看图片"]], "综合运用拼音、识字和阅读方法"]
  ];
  const makeReadingLesson = (unit, index) => {
    const [title, text, main, skill] = unit;
    const punctuation = text.includes("？") ? "问号（？）" : "句号（。）";
    return lesson(title, "听读短句，找到人物、地点、顺序或原因", [
      choice(main[0], text, main[1], main[2]),
      choice("学习这句话，主要练习什么？", text, skill, ["只看最后一个字", "不用读完整", "只数标点"]),
      choice("这段话最后使用了什么标点？", text, punctuation, punctuation.startsWith("问") ? ["句号（。）", "逗号（，）", "感叹号（！）"] : ["问号（？）", "逗号（，）", "冒号（：）"])
    ], "请家长先慢读一遍，再让孩子自己说出答案。 ");
  };

  const chineseLessons = [
    ...chineseSpecial,
    ...hanziUnits.map(makeHanziLesson),
    ...pinyinUnits.map(makePinyinLesson),
    ...readingUnits.map(makeReadingLesson)
  ];

  const countLesson = (title, emoji, counts) => lesson(title, "把实物和数字一一对应", counts.map((count, index) => choice("数一数，一共有几个？", count === 0 ? "（一个也没有）" : emoji.repeat(count), String(count), [String(Math.max(0, count - 1)), String(count + 1), String(count + 2 + index)])));
  const compareLesson = (title, pairs) => lesson(title, "比较数量或大小", pairs.map(([a, b]) => choice("应该选择哪个符号？", `${a}　?　${b}`, a > b ? ">" : a < b ? "<" : "=", [">", "<", "="].filter((item) => item !== (a > b ? ">" : a < b ? "<" : "=" )).concat(["+"]))));
  const operationLesson = (title, expressions) => lesson(title, "借助图像理解加法和减法", expressions.map(([a, op, b]) => {
    const answer = op === "+" ? a + b : a - b;
    return choice("算一算。", `${a} ${op} ${b} = ?`, String(answer), [String(Math.max(0, answer - 1)), String(answer + 1), String(answer + 2)]);
  }));
  const composeLesson = (title, totals) => lesson(title, "理解一个数可以分成哪两部分", totals.map(([total, part]) => choice(`${total}可以分成${part}和几？`, `${part} + ? = ${total}`, String(total - part), [String(Math.max(0, total - part - 1)), String(total - part + 1), String(part)])));
  const orderLesson = (title, triples) => lesson(title, "按顺序寻找相邻的数", triples.map(([a, b, c]) => choice("中间缺少哪个数？", `${a}，?，${c}`, String(b), [String(a - 1), String(c + 1), String(c + 2)])));
  const shapeLesson = (title, questions) => lesson(title, "从生活物品中辨认图形", questions.map(([prompt, visual, answer, wrong]) => choice(prompt, visual, answer, wrong)));
  const wordLesson = (title, questions) => lesson(title, "先听懂故事，再选择算式或答案", questions.map(([prompt, visual, answer, wrong]) => choice(prompt, visual, String(answer), wrong.map(String))));

  const mathLessons = [
    shapeLesson("数学游戏·在校园里找一找", [["教学楼上有3面小旗，数字是几？", "🚩🚩🚩", "3", ["1", "2", "4"]], ["操场上有5个球，数字是几？", "⚽⚽⚽⚽⚽", "5", ["3", "4", "6"]], ["哪组物品最多？", "⭐×2　📕×4　✏️×3", "📕×4", ["⭐×2", "✏️×3", "一样多"]]]),
    shapeLesson("数学游戏·按特点分类", [["哪个不是学习用品？", "✏️ 📕 🍎", "🍎", ["✏️", "📕", "都是学习用品"]], ["哪两个可以按颜色分成一组？", "🔴 🔺 🔵", "🔴和🔺", ["🔴和🔵", "🔺和🔵", "三个颜色相同"]], ["把玩具和水果分开，香蕉放哪组？", "🧸 🚗 | 🍎", "水果组", ["玩具组", "两组都放", "哪组都不放"]]]),
    shapeLesson("数学游戏·比一比", [["哪支铅笔更长？", "短铅笔　|　长铅笔", "右边", ["左边", "一样长", "不能比较"]], ["哪棵树更高？", "🌱　🌳", "右边", ["左边", "一样高", "都不高"]], ["哪杯水更多？", "半杯　|　满杯", "右边", ["左边", "一样多", "都没有水"]]]),
    shapeLesson("数学游戏·位置与顺序", [["小球在盒子的哪里？", "⚽\n📦", "上面", ["下面", "里面", "右边"]], ["从左数，小星星排第几？", "🍎 ⭐ 🍎", "第2", ["第1", "第3", "第4"]], ["书在笔的左边，笔在书的哪里？", "📕 ✏️", "右边", ["左边", "上面", "下面"]]]),
    countLesson("第一单元·认识1～3", "⭐", [1, 2, 3]),
    countLesson("第一单元·认识4和5", "🍎", [4, 5, 3]),
    shapeLesson("第一单元·数与量对应", [["数字4应该和哪组连线？", "4", "⭐⭐⭐⭐", ["⭐⭐", "⭐⭐⭐", "⭐⭐⭐⭐⭐"]], ["哪张数字卡表示5个圆？", "●●●●●", "5", ["2", "3", "4"]], ["3后面的数是几？", "1，2，3，?", "4", ["2", "3", "5"]]]),
    compareLesson("第一单元·1～5比大小", [[2,4],[5,3],[4,4]]),
    shapeLesson("第一单元·第几", [["从左数，星星排第几？", "🍎 🍐 ⭐ 🍌", "第3", ["第1", "第2", "第4"]], ["从右数，梨排第几？", "🍎 🍐 ⭐ 🍌", "第3", ["第1", "第2", "第4"]], ["一共有几个物品？", "🍎 🍐 ⭐ 🍌", "4个", ["2个", "3个", "第4"]]]),
    composeLesson("第一单元·2和3的分与合", [[2,1],[3,1],[3,2]]),
    composeLesson("第一单元·4的分与合", [[4,1],[4,2],[4,3]]),
    composeLesson("第一单元·5的分与合", [[5,1],[5,2],[5,3]]),
    operationLesson("第一单元·加法的意义", [[1,"+",1],[2,"+",1],[3,"+",1]]),
    operationLesson("第一单元·5以内加法", [[2,"+",3],[1,"+",4],[3,"+",2]]),
    operationLesson("第一单元·减法的意义", [[3,"-",1],[4,"-",1],[5,"-",2]]),
    operationLesson("第一单元·5以内减法", [[5,"-",3],[4,"-",2],[3,"-",2]]),
    countLesson("第一单元·认识0", "○", [0, 1, 2]),
    operationLesson("第一单元·有关0的加减法", [[3,"-",3],[0,"+",4],[5,"-",0]]),
    operationLesson("第一单元·整理和复习", [[2,"+",2],[5,"-",1],[3,"+",2]]),
    wordLesson("第一单元·数量关系", [["盘里有2个苹果，又放进3个，一共有几个？", "2 + 3", 5, [3,4,6]], ["有5只小鸟，飞走2只，还剩几只？", "5 - 2", 3, [2,4,7]], ["左边4朵花，右边3朵，哪边多？", "🌼×4 | 🌼×3", "左边", ["右边","一样多","不能比较"]]]),
    countLesson("第二单元·认识6和7", "●", [6, 7, 5]),
    countLesson("第二单元·认识8和9", "◆", [8, 9, 7]),
    orderLesson("第二单元·6～9的顺序", [[5,6,7],[6,7,8],[7,8,9]]),
    compareLesson("第二单元·6～9比大小", [[6,9],[8,7],[9,9]]),
    composeLesson("第二单元·6和7的分与合", [[6,2],[7,3],[7,5]]),
    operationLesson("第二单元·6和7的加减法", [[3,"+",3],[7,"-",2],[4,"+",3]]),
    composeLesson("第二单元·8和9的分与合", [[8,3],[9,4],[9,6]]),
    operationLesson("第二单元·8和9的加减法", [[4,"+",4],[9,"-",5],[3,"+",6]]),
    countLesson("第二单元·认识10", "⭐", [10, 9, 10]),
    composeLesson("第二单元·10的分与合", [[10,1],[10,5],[10,7]]),
    operationLesson("第二单元·10的加减法", [[4,"+",6],[10,"-",3],[8,"+",2]]),
    shapeLesson("第二单元·连加连减", [["算一算。", "2 + 3 + 4 = ?", "9", ["5", "8", "10"]], ["算一算。", "10 - 3 - 2 = ?", "5", ["3", "6", "9"]], ["算一算。", "1 + 4 + 5 = ?", "10", ["5", "9", "11"]]]),
    shapeLesson("第二单元·加减混合", [["算一算。", "7 - 2 + 3 = ?", "8", ["2", "5", "9"]], ["算一算。", "4 + 5 - 3 = ?", "6", ["5", "8", "9"]], ["算一算。", "10 - 6 + 2 = ?", "6", ["2", "4", "8"]]]),
    operationLesson("第二单元·整理和复习", [[3,"+",6],[9,"-",4],[5,"+",5]]),
    shapeLesson("第三单元·认识立体图形", [["哪个物品最像球？", "⚽ 📦 🥫", "⚽", ["📦", "🥫", "都不像"]], ["哪个物品最像长方体？", "📕 ⚽ 🥫", "📕", ["⚽", "🥫", "都一样"]], ["哪个物品最像圆柱？", "🥫 🧊 ⚽", "🥫", ["🧊", "⚽", "都一样"]]]),
    shapeLesson("第三单元·图形的特点", [["哪种图形容易向任意方向滚？", "球、圆柱、正方体", "球", ["圆柱", "正方体", "长方体"]], ["圆柱平放后怎样滚？", "🥫", "沿一个方向滚", ["向任意方向滚", "完全不能滚", "会飞起来"]], ["搭高时哪种更稳？", "⚽ 📦", "盒子", ["皮球", "一样稳", "都不能搭"]]]),
    shapeLesson("第三单元·拼搭图形", [["两个同样的正方体能拼成什么？", "🧊🧊", "长方体", ["球", "圆柱", "三角形"]], ["搭积木时，哪种放底层更稳？", "球或正方体", "正方体", ["球", "一样稳", "都不稳"]], ["从一堆积木中摸到表面全是平面的，可能是什么？", "积木袋", "正方体", ["球", "鸡蛋", "皮球"]]]),
    shapeLesson("第三单元·整理和复习", [["皮球属于哪类图形？", "⚽", "球", ["圆柱", "正方体", "长方体"]], ["易拉罐最像哪类图形？", "🥫", "圆柱", ["球", "正方体", "长方体"]], ["魔方最像哪类图形？", "🧊", "正方体", ["球", "圆柱", "长方体"]]]),
    shapeLesson("第四单元·10的再认识", [["10里面有几个一？", "10", "10个一", ["1个一", "2个一", "0个一"]], ["1个十是多少？", "一捆小棒", "10", ["1", "9", "11"]], ["10再添1是多少？", "10 + 1", "11", ["9", "10", "12"]]]),
    countLesson("第四单元·认识11～15", "●", [11, 13, 15]),
    countLesson("第四单元·认识16～20", "◆", [16, 18, 20]),
    shapeLesson("第四单元·十位和个位", [["14由1个十和几个一组成？", "14", "4个一", ["1个一", "10个一", "14个十"]], ["1个十和7个一是多少？", "▮ + ●●●●●●●", "17", ["7", "10", "71"]], ["20里面有几个十？", "20", "2个十", ["1个十", "20个十", "0个十"]]]),
    shapeLesson("第四单元·11～20的顺序和比较", [["中间缺少哪个数？", "14，?，16", "15", ["13", "16", "17"]], ["哪个数更大？", "12　19", "19", ["12", "一样大", "不能比较"]], ["18前面的一个数是几？", "?，18，19", "17", ["16", "18", "20"]]]),
    operationLesson("第四单元·10加几", [[10,"+",3],[10,"+",6],[10,"+",9]]),
    operationLesson("第四单元·十几减几", [[15,"-",5],[18,"-",8],[14,"-",4]]),
    operationLesson("第四单元·简单加减法", [[11,"+",3],[16,"-",4],[14,"+",5]]),
    operationLesson("第五单元·9加几", [[9,"+",2],[9,"+",4],[9,"+",7]]),
    operationLesson("第五单元·8加几", [[8,"+",3],[8,"+",5],[8,"+",8]]),
    operationLesson("第五单元·7加几", [[7,"+",4],[7,"+",6],[7,"+",8]]),
    operationLesson("第五单元·6加几", [[6,"+",5],[6,"+",7],[6,"+",9]]),
    operationLesson("第五单元·5、4、3、2加几", [[5,"+",7],[4,"+",8],[3,"+",9]]),
    shapeLesson("第五单元·凑十方法", [["9 + 6，先把6分成哪两个数更方便凑十？", "9 + 6", "1和5", ["2和4", "3和3", "0和6"]], ["8 + 5，先给8几个就能凑成10？", "8 + 5", "2", ["1", "3", "5"]], ["7 + 6，先把6分成3和几？", "7 + 6", "3", ["2", "4", "6"]]]),
    shapeLesson("第五单元·交换加数", [["8 + 6和哪道算式结果相同？", "8 + 6", "6 + 8", ["8 - 6", "6 - 8", "8 + 5"]], ["7 + 5 = 12，那么5 + 7等于几？", "5 + 7", "12", ["2", "11", "13"]], ["哪组算式结果相同？", "比较三组", "9+4和4+9", ["9+4和9-4", "8+3和8+4", "6+5和5-6"]]]),
    operationLesson("第五单元·进位加法混合", [[9,"+",5],[8,"+",6],[7,"+",8]]),
    wordLesson("第五单元·解决问题", [["草地上有7只鸟，又飞来6只，一共有几只？", "7 + 6", 13, [12,14,1]], ["小雨有9支笔，妈妈又给4支，现在有几支？", "9 + 4", 13, [12,14,5]], ["左盒8颗糖，右盒5颗，一共有几颗？", "8 + 5", 13, [3,12,14]]]),
    operationLesson("第六单元·数与运算复习", [[5,"+",5],[16,"-",6],[8,"+",7]]),
    wordLesson("第六单元·数量关系", [["红花9朵，黄花6朵，一共有几朵？", "9 + 6", 15, [3,14,16]], ["盒里有18支笔，拿走8支，还剩几支？", "18 - 8", 10, [8,9,11]], ["一队有7人，二队有8人，两队一共几人？", "7 + 8", 15, [1,14,16]]]),
    shapeLesson("第六单元·图形的认识", [["足球是什么图形？", "⚽", "球", ["圆柱", "正方体", "长方体"]], ["纸巾盒是什么图形？", "纸巾盒", "长方体", ["球", "圆柱", "正方体"]], ["哪两种图形都能稳稳放在桌上？", "球、圆柱、正方体", "圆柱和正方体", ["球和圆柱", "球和正方体", "只有球"]]]),
    wordLesson("第六单元·综合应用", [["书架上原有10本书，又放上6本，现在有几本？", "10 + 6", 16, [4,15,17]], ["积木盒里有9个正方体和5个圆柱，一共有几个？", "9 + 5", 14, [4,13,15]], ["有17个球，拿走7个，还剩几个？", "17 - 7", 10, [9,11,24]]]),
    shapeLesson("第六单元·复习与关联", [["9 + 8，先凑成10再算，结果是几？", "9 + 8", "17", ["16", "18", "19"]], ["18由几个十和几个一组成？", "18", "1个十和8个一", ["8个十和1个一", "18个十", "2个十"]], ["把两部分合起来，通常用什么法？", "6个和7个合起来", "加法", ["减法", "比较", "分类"]]])
  ];

  const englishItems = [
    ["Hello, School!", "hello", "你好", "👋", "Hello!", "你好！", "第一次见到同学", "Hello!"],
    ["Hello, School!", "morning", "早晨", "🌅", "Good morning!", "早上好！", "早晨见到老师", "Good morning!"],
    ["Hello, School!", "school", "学校", "🏫", "I like my school.", "我喜欢我的学校。", "走进学校", "Hello, school!"],
    ["Hello, School!", "teacher", "老师", "👩‍🏫", "Hello, teacher!", "老师，您好！", "见到老师", "Hello, teacher!"],
    ["Hello, School! 回声", "goodbye", "再见", "👋", "Goodbye!", "再见！", "放学离开", "Goodbye!"],
    ["Danny's School Day", "afternoon", "下午", "🌤️", "Good afternoon!", "下午好！", "下午见到同学", "Good afternoon!"],
    ["Danny's School Day", "evening", "晚上", "🌙", "Good evening!", "晚上好！", "晚上见到家人", "Good evening!"],
    ["Classroom English", "sit", "坐", "🪑", "Sit down, please.", "请坐下。", "老师请大家坐下", "Sit down, please."],
    ["Classroom English", "stand", "站", "🧍", "Stand up, please.", "请起立。", "老师请大家起立", "Stand up, please."],
    ["Unit 1 回声复习", "meet", "见面", "🤝", "Nice to meet you!", "很高兴见到你！", "第一次认识新朋友", "Nice to meet you!"],
    ["You and Me", "name", "名字", "📛", "What's your name?", "你叫什么名字？", "想知道新同学的名字", "What's your name?"],
    ["You and Me", "my", "我的", "🙋", "My name is Lily.", "我的名字叫莉莉。", "介绍自己的名字", "My name is ..."],
    ["You and Me", "you", "你", "👉", "How are you?", "你好吗？", "关心朋友", "How are you?"],
    ["You and Me", "fine", "很好", "😊", "I'm fine.", "我很好。", "别人问你How are you", "I'm fine."],
    ["You and Me 回声", "friend", "朋友", "🧒🧒", "You are my friend.", "你是我的朋友。", "告诉同伴他是你的朋友", "You are my friend."],
    ["Let's Play Together", "play", "玩", "🛝", "Let's play!", "我们一起玩吧！", "邀请同伴一起玩", "Let's play!"],
    ["Let's Play Together", "together", "一起", "🧩", "Let's play together.", "我们一起玩吧。", "邀请大家共同游戏", "Let's play together."],
    ["Polite Words", "please", "请", "🙏", "A pencil, please.", "请给我一支铅笔。", "有礼貌地请求", "Please."],
    ["Polite Words", "thanks", "谢谢", "💐", "Thank you!", "谢谢你！", "别人帮助了你", "Thank you!"],
    ["Unit 2 回声复习", "welcome", "欢迎", "🎈", "You're welcome.", "不客气。", "别人对你说Thank you", "You're welcome."],
    ["My Schoolbag", "schoolbag", "书包", "🎒", "This is my schoolbag.", "这是我的书包。", "介绍自己的书包", "This is my schoolbag."],
    ["My Schoolbag", "book", "书", "📕", "This is a book.", "这是一本书。", "介绍桌上的书", "This is a book."],
    ["My Schoolbag", "pencil", "铅笔", "✏️", "I have a pencil.", "我有一支铅笔。", "告诉别人你有铅笔", "I have a pencil."],
    ["My Schoolbag", "ruler", "尺子", "📏", "It's my ruler.", "它是我的尺子。", "认领自己的尺子", "It's my ruler."],
    ["My Schoolbag 回声", "eraser", "橡皮", "🧽", "Is this your eraser?", "这是你的橡皮吗？", "询问橡皮是谁的", "Is this your eraser?"],
    ["Ready for Class", "desk", "课桌", "🪵", "The book is on the desk.", "书在课桌上。", "说明书的位置", "It's on the desk."],
    ["Ready for Class", "chair", "椅子", "🪑", "Sit on the chair.", "坐在椅子上。", "请同伴坐下", "Sit on the chair."],
    ["Ready for Class", "open", "打开", "📖", "Open your book.", "打开你的书。", "准备开始读书", "Open your book."],
    ["Ready for Class", "close", "合上", "📕", "Close your book.", "合上你的书。", "读书活动结束", "Close your book."],
    ["Unit 3 回声复习", "ready", "准备好的", "✅", "I'm ready for class.", "我准备好上课了。", "书本铅笔都准备好了", "I'm ready!"],
    ["This Is Me", "face", "脸", "🙂", "This is my face.", "这是我的脸。", "指着自己的脸", "This is my face."],
    ["This Is Me", "eye", "眼睛", "👁️", "I have two eyes.", "我有两只眼睛。", "介绍自己的眼睛", "I have two eyes."],
    ["This Is Me", "ear", "耳朵", "👂", "I have two ears.", "我有两只耳朵。", "介绍自己的耳朵", "I have two ears."],
    ["This Is Me", "nose", "鼻子", "👃", "Touch your nose.", "摸摸你的鼻子。", "听指令摸鼻子", "Touch your nose."],
    ["This Is Me 回声", "mouth", "嘴巴", "👄", "Open your mouth.", "张开嘴巴。", "体检时张嘴", "Open your mouth."],
    ["My Body", "hand", "手", "✋", "Show me your hand.", "让我看看你的手。", "展示自己的手", "This is my hand."],
    ["My Body", "arm", "手臂", "💪", "Raise your arms.", "举起手臂。", "做操时举起手臂", "Raise your arms."],
    ["My Body", "leg", "腿", "🦵", "I have two legs.", "我有两条腿。", "介绍自己的腿", "I have two legs."],
    ["We Are Different", "different", "不同的", "🌈", "We are all different.", "我们各不相同。", "大家长得不完全一样", "We are all different."],
    ["Unit 4 回声复习", "smile", "微笑", "😄", "Show me your smile.", "让我看看你的微笑。", "拍照时开心微笑", "Smile!"],
    ["My Family", "family", "家庭", "👨‍👩‍👧", "This is my family.", "这是我的家人。", "介绍全家福", "This is my family."],
    ["My Family", "mother", "妈妈", "👩", "This is my mother.", "这是我的妈妈。", "介绍照片里的妈妈", "This is my mother."],
    ["My Family", "father", "爸爸", "👨", "This is my father.", "这是我的爸爸。", "介绍照片里的爸爸", "This is my father."],
    ["My Family", "sister", "姐妹", "👧", "She is my sister.", "她是我的姐妹。", "介绍自己的姐妹", "She is my sister."],
    ["My Family 回声", "brother", "兄弟", "👦", "He is my brother.", "他是我的兄弟。", "介绍自己的兄弟", "He is my brother."],
    ["My Big Family", "grandma", "奶奶或外婆", "👵", "I love my grandma.", "我爱奶奶或外婆。", "向家人表达爱", "I love you."],
    ["My Big Family", "grandpa", "爷爷或外公", "👴", "I love my grandpa.", "我爱爷爷或外公。", "向家人表达爱", "I love you."],
    ["My Big Family", "who", "谁", "❓", "Who is she?", "她是谁？", "询问照片里的人", "Who is she?"],
    ["Love My Family", "love", "爱", "❤️", "I love my family.", "我爱我的家人。", "表达对全家的爱", "I love my family."],
    ["Unit 5 回声复习", "home", "家", "🏠", "Welcome home!", "欢迎回家！", "家人回到家", "Welcome home!"],
    ["Chinese New Year", "red", "红色", "🔴", "I like red.", "我喜欢红色。", "选择春节常见颜色", "I like red."],
    ["Chinese New Year", "lantern", "灯笼", "🏮", "This is a red lantern.", "这是一个红灯笼。", "介绍春节装饰", "This is a lantern."],
    ["Chinese New Year", "dragon", "龙", "🐉", "Look at the dragon!", "看这条龙！", "看到舞龙表演", "Look at the dragon!"],
    ["Chinese New Year", "dumpling", "饺子", "🥟", "I like dumplings.", "我喜欢饺子。", "说出喜欢的春节食物", "I like dumplings."],
    ["New Year 回声", "gift", "礼物", "🎁", "This gift is for you.", "这个礼物送给你。", "把礼物送给朋友", "This is for you."],
    ["Happy New Year", "happy", "快乐的", "🥳", "Happy New Year!", "新年快乐！", "春节见到亲友", "Happy New Year!"],
    ["Family Dinner", "dinner", "晚餐", "🍲", "We have a family dinner.", "我们一起吃团圆饭。", "全家一起吃饭", "Let's eat together."],
    ["Good Wishes", "luck", "好运", "🍀", "Good luck!", "祝你好运！", "给朋友送祝福", "Good luck!"],
    ["Thank and Share", "share", "分享", "🤲", "Let's share together.", "让我们一起分享。", "和同伴分享礼物", "Let's share."],
    ["英语终点回声", "brave", "勇敢的", "🏆", "I can listen, speak and learn.", "我会听、会说、会学习。", "完成60天学习", "I can do it!" ]
  ];
  const englishWords = englishItems.map((item) => item[1]);
  const englishMeanings = englishItems.map((item) => item[2]);
  const englishResponses = englishItems.map((item) => item[7]);
  const makeEnglishLesson = (item, index) => {
    const [title, word, zh, emoji, phrase, phraseZh, context, response] = item;
    const other = (array, offsets) => offsets.map((offset) => array[(index + offset) % array.length]);
    return lesson(title, "跟随新北京版主题，以图词匹配、听辨和情境回应衔接Cambridge Pre A1及KET能力", [
      choice(`哪个单词表示“${zh}”？`, emoji, word, other(englishWords, [7, 19, 31]), { speech: word }),
      choice("这句话是什么意思？", phrase, phraseZh, other(englishMeanings, [5, 16, 27]).map((meaning) => `和“${meaning}”有关`), { speech: phrase }),
      choice("在这个情境中，哪句话最合适？", context, response, other(englishResponses, [8, 23, 39]), { speech: response })
    ], "先点扬声器听一遍，再跟读并完整回答。词汇以Pre A1为主，KET只做听取关键信息和简短应答的能力桥接，不要求拼写。 ");
  };
  const englishLessons = englishItems.map(makeEnglishLesson);

  const stages = [
    [1, 10, "一年级上册·教材起步"], [11, 20, "一年级上册·基础单元"], [21, 30, "一年级上册·核心推进"],
    [31, 40, "一年级上册·单元衔接"], [41, 50, "一年级上册·后段预习"], [51, 60, "一年级上册·复习提升"]
  ];
  const stageFor = (day) => stages.find(([start, end]) => day >= start && day <= end)[2];
  const addEchoQuestions = (lessons, index) => {
    const current = lessons[index];
    const yesterday = lessons[Math.max(0, index - 1)].questions[index % 3];
    const fiveDaysAgo = lessons[Math.max(0, index - 5)].questions[(index + 1) % 3];
    const echo = (question, label) => ({ ...question, prompt: `${label}：${question.prompt}` });
    return { ...current, questions: [...current.questions, echo(yesterday, "昨日回声"), echo(fiveDaysAgo, "五日回声")] };
  };
  const days = Array.from({ length: 60 }, (_, index) => ({
    day: index + 1,
    stage: stageFor(index + 1),
    chinese: addEchoQuestions(chineseLessons, index),
    math: addEchoQuestions(mathLessons, index),
    english: addEchoQuestions(englishLessons, index)
  }));

  if (chineseLessons.length !== 60 || mathLessons.length !== 60 || englishLessons.length !== 60) {
    throw new Error("The 60-day curriculum is incomplete.");
  }

  window.STUDY_CURRICULUM = {
    version: "2026.08-60day-v2-textbook",
    days,
    design: {
      dailySubjects: 3,
      questionsPerSubject: 5,
      totalDays: 60,
      totalQuestionInstances: 900,
      reviewRhythm: "每天复现前一日内容和五日前内容，并在教材单元末安排整理复习",
      alignment: "语文统编版（2024修订）一年级上册；数学人教版（2024修订）一年级上册；英语北京版（2024）一年级上册"
    }
  };
})();
