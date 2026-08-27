(() => {
  "use strict";

  const STORAGE_KEY = "daily-study-desk-v1";
  const today = () => new Date().toLocaleDateString("sv-SE");
  const defaultState = {
    coins: 20,
    streak: 0,
    lastCheckin: "",
    activeSeconds: 0,
    activeDate: today(),
    progress: {},
    daily: { date: today(), completed: [] },
    lastLesson: null,
    review: [],
    settings: { dailyGoal: 2, speechEnabled: true, speechRate: 0.82, speechLocale: "en-US" }
  };

  const subjects = {
    hanzi: {
      title: "识字砖块关", icon: "🧱", color: "#df342d", soft: "#ffe5e2", description: "一年级生字 · 组词 · 闯关",
      tabs: ["认识生字", "看图识字", "组词挑战", "反义词"]
    },
    pinyin: {
      title: "拼音蘑菇关", icon: "🍄", color: "#35a94b", soft: "#e5f7e7", description: "声韵母 · 拼读 · 辨析",
      tabs: ["声母韵母", "拼读练习", "声调练习", "易混辨析"]
    },
    math: {
      title: "数学星星关", icon: "⭐", color: "#176bbb", soft: "#e7f1ff", description: "20以内 · 钟表 · 人民币",
      tabs: ["加减法", "认钟表", "认人民币", "应用题"]
    },
    english: {
      title: "英语金币关", icon: "🪙", color: "#e75a12", soft: "#fff0e5", description: "单词 · 短句 · 入门语法",
      tabs: ["认单词", "读短句", "英语语法", "小测试"]
    }
  };

  const decks = {
    hanzi: {
      "认识生字": [
        { prompt: "这个字怎么读？", visual: "山", example: "高高的山", answers: ["shān", "shuǐ", "rì", "yuè"], correct: 0 },
        { prompt: "这个字怎么读？", visual: "木", example: "一棵树木", answers: ["mù", "běn", "lín", "hé"], correct: 0 },
        { prompt: "哪个词里有“日”？", visual: "日", example: "想一想太阳", answers: ["日光", "月亮", "大山", "河水"], correct: 0 }
      ],
      "看图识字": [
        { prompt: "图片对应哪个字？", visual: "🌙", answers: ["月", "日", "云", "雨"], correct: 0 },
        { prompt: "图片对应哪个字？", visual: "🔥", answers: ["水", "火", "木", "土"], correct: 1 },
        { prompt: "图片对应哪个字？", visual: "👄", answers: ["目", "耳", "口", "手"], correct: 2 }
      ],
      "组词挑战": [
        { prompt: "“上”可以和哪个字组成词？", visual: "上", answers: ["学", "水", "月", "口"], correct: 0 },
        { prompt: "“小”可以和哪个字组成词？", visual: "小", answers: ["鸟", "火", "天", "田"], correct: 0 },
        { prompt: "“白”可以和哪个字组成词？", visual: "白", answers: ["云", "石", "山", "土"], correct: 0 }
      ],
      "反义词": [
        { prompt: "“大”的反义词是？", visual: "大 ↔ ?", answers: ["小", "多", "上", "长"], correct: 0 },
        { prompt: "“上”的反义词是？", visual: "上 ↔ ?", answers: ["前", "下", "外", "少"], correct: 1 },
        { prompt: "“多”的反义词是？", visual: "多 ↔ ?", answers: ["大", "少", "长", "小"], correct: 1 }
      ]
    },
    pinyin: {
      "声母韵母": [
        { prompt: "下面哪个是声母？", visual: "b", example: "b 是声母", answers: ["b", "a", "ai", "ang"], correct: 0 },
        { prompt: "下面哪个是韵母？", visual: "ɑ", example: "张大嘴巴 ɑ ɑ ɑ", answers: ["m", "d", "ɑ", "p"], correct: 2 },
        { prompt: "“妈”里的声母是？", visual: "mā", answers: ["m", "a", "ā", "ma"], correct: 0 }
      ],
      "拼读练习": [
        { prompt: "b 和 ā 拼在一起是？", visual: "b + ā", answers: ["bā", "pā", "mā", "dā"], correct: 0 },
        { prompt: "m 和 ǎ 拼在一起是？", visual: "m + ǎ", answers: ["mā", "má", "mǎ", "mà"], correct: 2 },
        { prompt: "h 和 uā 拼在一起是？", visual: "h + uā", answers: ["huā", "hā", "guā", "kuā"], correct: 0 }
      ],
      "声调练习": [
        { prompt: "这个音节是第几声？", visual: "bà", example: "例字：爸", answers: ["第一声（ˉ）", "第二声（ˊ）", "第三声（ˇ）", "第四声（ˋ）"], correct: 3 },
        { prompt: "这个音节是第几声？", visual: "má", example: "例字：麻", answers: ["第一声（ˉ）", "第二声（ˊ）", "第三声（ˇ）", "第四声（ˋ）"], correct: 1 },
        { prompt: "这个音节是第几声？", visual: "mǎ", example: "例字：马", answers: ["第一声（ˉ）", "第二声（ˊ）", "第三声（ˇ）", "第四声（ˋ）"], correct: 2 }
      ],
      "易混辨析": [
        { prompt: "右边有半圆的是？", visual: "b  d", answers: ["b", "d", "p", "q"], correct: 0 },
        { prompt: "小伞把朝上的是？", visual: "f  t", answers: ["f", "t", "n", "l"], correct: 1 },
        { prompt: "左上半圆的是？", visual: "p  q", answers: ["p", "q", "b", "d"], correct: 0 }
      ]
    },
    english: {
      "认单词": [
        { prompt: "哪个单词表示“苹果”？", visual: "🍎", speech: "apple", answers: ["apple", "book", "cat", "sun"], correct: 0 },
        { prompt: "哪个单词表示“书”？", visual: "📚", speech: "book", answers: ["desk", "book", "bag", "pen"], correct: 1 },
        { prompt: "哪个单词表示“小猫”？", visual: "🐱", speech: "cat", answers: ["dog", "duck", "cat", "bird"], correct: 2 }
      ],
      "读短句": [
        { prompt: "I like apples. 是什么意思？", visual: "I like apples.", speech: "I like apples.", answers: ["我喜欢苹果。", "我有苹果。", "这是苹果。", "苹果很大。"], correct: 0 },
        { prompt: "This is my book. 是什么意思？", visual: "This is my book.", speech: "This is my book.", answers: ["我读书。", "这是我的书。", "书在这里。", "我有两本书。"], correct: 1 },
        { prompt: "The cat is small. 是什么意思？", visual: "The cat is small.", speech: "The cat is small.", answers: ["猫很小。", "猫很高。", "猫在睡觉。", "我喜欢猫。"], correct: 0 }
      ],
      "小测试": [
        { prompt: "She ___ my friend.", visual: "am / is / are", speech: "She is my friend.", answers: ["am", "is", "are", "be"], correct: 1 },
        { prompt: "I ___ a student.", visual: "am / is / are", speech: "I am a student.", answers: ["am", "is", "are", "be"], correct: 0 },
        { prompt: "They ___ happy.", visual: "am / is / are", speech: "They are happy.", answers: ["am", "is", "are", "be"], correct: 2 }
      ]
    }
  };

  let state = loadState();
  let current = { subject: "", tab: "", question: 0, score: 0, locked: false, attempts: 0, mistakes: 0 };
  let toastTimer;
  let lastActivityAt = Date.now();

  function emptyProgress() {
    return Object.fromEntries(Object.entries(subjects).map(([key, subject]) => [key, Object.fromEntries(subject.tabs.map((tab) => [tab, 0]))]));
  }

  function migrateProgress(savedProgress = {}) {
    const progress = emptyProgress();
    Object.entries(subjects).forEach(([key, subject]) => {
      if (typeof savedProgress[key] === "number") {
        progress[key][subject.tabs[0]] = Math.max(0, Math.min(3, savedProgress[key]));
      } else if (savedProgress[key] && typeof savedProgress[key] === "object") {
        subject.tabs.forEach((tab) => { progress[key][tab] = Math.max(0, Math.min(3, Number(savedProgress[key][tab]) || 0)); });
      }
    });
    return progress;
  }

  function loadState() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
      const merged = {
        ...defaultState,
        ...saved,
        progress: migrateProgress(saved.progress),
        settings: { ...defaultState.settings, ...(saved.settings || {}) },
        daily: { ...defaultState.daily, ...(saved.daily || {}) },
        review: Array.isArray(saved.review) ? saved.review.slice(0, 30) : []
      };
      if (merged.activeDate !== today()) {
        merged.activeDate = today();
        merged.activeSeconds = 0;
      }
      if (merged.daily.date !== today()) merged.daily = { date: today(), completed: [] };
      return merged;
    } catch { return { ...defaultState, progress: emptyProgress(), settings: { ...defaultState.settings }, daily: { date: today(), completed: [] }, review: [] }; }
  }

  function saveState() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
  function $(selector, root = document) { return root.querySelector(selector); }
  function app() { return $("#app"); }

  function showToast(message) {
    const toast = $("#toast");
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 2200);
  }

  function renderStars(count) {
    return [0, 1, 2].map((i) => `<span class="${i < count ? "earned" : ""}">★</span>`).join("");
  }

  function lessonKey(subject = current.subject, tab = current.tab) { return `${subject}::${tab}`; }
  function subjectStars(key) {
    const values = Object.values(state.progress[key]);
    return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
  }
  function completedTabs(key) { return Object.values(state.progress[key]).filter((value) => value > 0).length; }
  function markActivity() { lastActivityAt = Date.now(); }

  function renderHome() {
    const template = $("#home-template").content.cloneNode(true);
    app().replaceChildren(template);
    $("#today-minutes").textContent = `${Math.floor(state.activeSeconds / 60)}分钟`;
    $("#streak-days").textContent = `${state.streak}天`;
    $("#coin-count").textContent = state.coins;

    const grid = $("#subject-grid");
    Object.entries(subjects).forEach(([key, subject]) => {
      const stars = subjectStars(key);
      const done = completedTabs(key);
      const card = document.createElement("button");
      card.type = "button";
      card.className = "subject-card";
      card.style.setProperty("--subject", subject.color);
      card.style.setProperty("--soft", subject.soft);
      card.innerHTML = `<span class="subject-icon" aria-hidden="true">${subject.icon}</span><h2>${subject.title}</h2><div class="stars" aria-label="平均获得 ${stars} 颗星">${renderStars(stars)}</div><p>${subject.description}</p><span class="subject-progress">${done} / ${subject.tabs.length} 组完成</span>`;
      card.addEventListener("click", () => openSubject(key));
      grid.appendChild(card);
    });

    const checkin = $("#checkin-button");
    const completed = state.daily.completed.length;
    const goal = state.settings.dailyGoal;
    const ready = completed >= goal;
    $("#daily-plan-count").textContent = `${Math.min(completed, goal)} / ${goal}`;
    $("#daily-plan-bar").style.width = `${Math.min(100, (completed / goal) * 100)}%`;
    $("#daily-plan-message").textContent = ready ? "今日任务已完成，可以打卡啦！" : `再完成 ${goal - completed} 组学习即可打卡`;

    const continueButton = $("#continue-button");
    if (state.lastLesson?.subject && subjects[state.lastLesson.subject]?.tabs.includes(state.lastLesson.tab)) {
      const lastSubject = subjects[state.lastLesson.subject];
      continueButton.hidden = false;
      continueButton.lastElementChild.textContent = `继续：${lastSubject.title} · ${state.lastLesson.tab}`;
      continueButton.addEventListener("click", () => openSubject(state.lastLesson.subject, state.lastLesson.tab, true));
    }

    if (state.lastCheckin === today()) {
      checkin.classList.add("is-done");
      checkin.innerHTML = `<span aria-hidden="true">✓</span><span>今日已打卡</span>`;
    } else if (!ready) {
      checkin.classList.add("is-locked");
      checkin.setAttribute("aria-disabled", "true");
      checkin.innerHTML = `<span aria-hidden="true">🔒</span><span>完成任务后打卡</span>`;
    }
    checkin.addEventListener("click", checkIn);
    $("#settings-button").addEventListener("click", openSettings);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function checkIn() {
    if (state.lastCheckin === today()) return showToast("今天已经打过卡啦！");
    if (state.daily.completed.length < state.settings.dailyGoal) {
      return showToast(`还差 ${state.settings.dailyGoal - state.daily.completed.length} 组学习，完成后就能打卡`);
    }
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayKey = yesterday.toLocaleDateString("sv-SE");
    state.streak = state.lastCheckin === yesterdayKey ? state.streak + 1 : 1;
    state.lastCheckin = today();
    state.coins += 10;
    saveState();
    renderHome();
    showToast("打卡成功，奖励 10 枚学习金币！");
  }

  function openSubject(key, requestedTab, resume = false) {
    const subject = subjects[key];
    const nextTab = subject.tabs.find((tabName) => state.progress[key][tabName] === 0) || subject.tabs[0];
    const tab = requestedTab || nextTab;
    const savedQuestion = resume && state.lastLesson?.subject === key && state.lastLesson?.tab === tab ? Number(state.lastLesson.question) || 0 : 0;
    current = { subject: key, tab, question: savedQuestion, score: 0, locked: false, attempts: 0, mistakes: 0 };
    state.lastLesson = { subject: key, tab, question: savedQuestion };
    saveState();
    renderSubject();
  }

  function renderSubject() {
    const subject = subjects[current.subject];
    app().innerHTML = `
      <section class="level-view view-enter" style="--subject:${subject.color};--header-soft:${subject.soft}">
        <header class="level-header">
          <button class="back-button" type="button" aria-label="返回主页">← 返回</button>
          <h1 class="level-title">${subject.icon} ${subject.title}</h1>
        </header>
        <nav class="tab-strip" aria-label="关卡分类"></nav>
        <div class="instruction"></div>
        <section id="level-content"></section>
      </section>`;

    $(".back-button").addEventListener("click", renderHome);
    const tabs = $(".tab-strip");
    subject.tabs.forEach((tab) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "tab-button";
      button.innerHTML = `${tab}<span class="tab-progress">${state.progress[current.subject][tab] ? `${state.progress[current.subject][tab]} 星` : "未完成"}</span>`;
      button.setAttribute("aria-selected", String(tab === current.tab));
      button.addEventListener("click", () => openSubject(current.subject, tab));
      tabs.appendChild(button);
    });

    const instructionMap = {
      hanzi: "🧱 认一认、读一读，选出正确答案。每组共 3 题。",
      pinyin: "🍄 看清声母、韵母和音调，选出正确答案。每组共 3 题。",
      math: "⭐ 仔细看题，填写或选出答案。每组共 3 题。",
      english: "🎯 点击扬声器听读音，大声跟读后再选择答案。每组共 3 题。"
    };
    $(".instruction").textContent = instructionMap[current.subject];

    if (current.subject === "math") renderMath();
    else if (current.subject === "english" && current.tab === "英语语法") renderGrammarLesson();
    else renderChoiceQuestion();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function renderChoiceQuestion() {
    const deck = decks[current.subject][current.tab];
    if (current.question >= deck.length) return renderCompletion(deck.length);
    const q = deck[current.question];
    const visualClass = current.subject === "pinyin" ? "syllable" : (current.subject === "hanzi" ? "word" : (current.subject === "english" && /[A-Za-z]/.test(q.visual) ? "english-text" : ""));
    const audioControls = current.subject === "english" && q.speech ? `<div class="audio-controls" aria-label="英语发音"><button class="audio-button play-audio" type="button" title="正常速度朗读" aria-label="正常速度朗读">🔊</button><button class="audio-button slow play-audio-slow" type="button" title="慢速朗读" aria-label="慢速朗读">🐢</button></div>` : "";
    $("#level-content").innerHTML = `
      <article class="question-card">
        <div class="round-meta"><span>⭐ 第 ${current.question + 1} / ${deck.length} 关</span><span>✅ <b class="score-count">${current.score}</b></span></div>
        <p class="prompt">${q.prompt}</p>
        <div class="question-visual ${visualClass}">${q.visual}</div>
        ${q.example ? `<p class="example">${q.example}</p>` : ""}
        ${audioControls}
        <div class="answers"></div>
        <p class="feedback" aria-live="assertive"></p>
        <button class="next-button" type="button">下一题 →</button>
      </article>`;
    const answers = $(".answers");
    q.answers.forEach((answer, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "answer-button";
      button.textContent = answer;
      button.addEventListener("click", () => chooseAnswer(index, q.correct, q));
      answers.appendChild(button);
    });
    $(".play-audio")?.addEventListener("click", () => speakEnglish(q.speech));
    $(".play-audio-slow")?.addEventListener("click", () => speakEnglish(q.speech, true));
    $(".next-button").addEventListener("click", nextQuestion);
  }

  function rememberMistake(question, correctAnswer) {
    const id = `${current.subject}|${current.tab}|${question.prompt}`;
    state.review = [{ id, subject: current.subject, tab: current.tab, prompt: question.prompt, answer: correctAnswer, date: today() }, ...state.review.filter((item) => item.id !== id)].slice(0, 30);
    saveState();
  }

  function chooseAnswer(selected, correct, question) {
    if (current.locked) return;
    const buttons = [...document.querySelectorAll(".answer-button")];
    if (selected === correct) {
      current.locked = true;
      buttons[correct].classList.add("correct");
      if (current.attempts === 0) current.score += 1;
      $(".score-count").textContent = current.score;
      $(".feedback").textContent = current.attempts === 0 ? "答对了！真棒！" : "这次答对了，已经记住啦！";
      $(".feedback").className = "feedback good";
      if (current.subject === "english" && question.speech) speakEnglish(question.speech);
      $(".next-button").classList.add("show");
    } else {
      buttons[selected].classList.add("wrong");
      buttons[selected].disabled = true;
      current.attempts += 1;
      current.mistakes += 1;
      rememberMistake(question, buttons[correct].textContent);
      $(".feedback").className = "feedback bad";
      if (current.attempts === 1) {
        $(".feedback").textContent = "先别急，再想一想，还可以试一次。";
        return;
      }
      current.locked = true;
      buttons[correct].classList.add("correct");
      $(".feedback").textContent = `正确答案是“${buttons[correct].textContent}”，跟着再读一遍。`;
      if (current.subject === "english" && question.speech) speakEnglish(question.speech, true);
      $(".next-button").classList.add("show");
    }
  }

  function nextQuestion() {
    current.question += 1;
    current.locked = false;
    current.attempts = 0;
    state.lastLesson = { subject: current.subject, tab: current.tab, question: current.question };
    saveState();
    if (current.subject === "math") renderMath(); else renderChoiceQuestion();
  }

  function speakEnglish(text, slow = false) {
    if (!state.settings.speechEnabled) return showToast("家长设置中已关闭英语发音");
    if (!("speechSynthesis" in window) || typeof SpeechSynthesisUtterance === "undefined") return showToast("当前浏览器不支持语音朗读");
    const utterance = new SpeechSynthesisUtterance(text);
    const locale = state.settings.speechLocale;
    utterance.lang = locale;
    utterance.rate = slow ? 0.62 : state.settings.speechRate;
    const voices = window.speechSynthesis.getVoices();
    utterance.voice = voices.find((voice) => voice.lang === locale) || voices.find((voice) => voice.lang.startsWith(locale.slice(0, 2))) || null;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  }

  function getMathDeck(tab) {
    const decksByTab = {
      "加减法": [
        { prompt: "妈妈买了 8 个桃子，又买了 4 个，一共几个？", visual: "🍑🍑🍑🍑🍑🍑🍑🍑 + 🍑🍑🍑🍑", equation: "8 + 4", answer: 12 },
        { prompt: "篮子里有 15 个苹果，吃掉 6 个，还剩几个？", visual: "🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎", equation: "15 − 6", answer: 9 },
        { prompt: "树上有 7 只鸟，又飞来 5 只，一共有几只？", visual: "🐦🐦🐦🐦🐦🐦🐦 + 🐦🐦🐦🐦🐦", equation: "7 + 5", answer: 12 }
      ],
      "认钟表": [
        { prompt: "这个钟表表示几点？", visual: "🕒", answers: ["2点", "3点", "6点", "9点"], correct: 1 },
        { prompt: "这个钟表表示几点？", visual: "🕕", answers: ["3点", "5点", "6点", "8点"], correct: 2 },
        { prompt: "这个钟表表示几点？", visual: "🕘", answers: ["6点", "7点", "8点", "9点"], correct: 3 }
      ],
      "认人民币": [
        { prompt: "1元等于多少角？", visual: "💴", answers: ["5角", "10角", "20角", "100角"], correct: 1 },
        { prompt: "买 3 元的铅笔，付 5 元，应找回多少元？", visual: "✏️ 3元　💴 5元", answers: ["1元", "2元", "3元", "8元"], correct: 1 },
        { prompt: "下面哪组正好是 6 元？", visual: "🪙", answers: ["5元+1元", "5元+2元", "2元+2元", "10元−1元"], correct: 0 }
      ],
      "应用题": [
        { prompt: "小明有 6 本书，小红有 5 本，两人一共有几本？", visual: "📚 6 + 📚 5", equation: "6 + 5", answer: 11 },
        { prompt: "停车场有 14 辆车，开走 4 辆，还剩几辆？", visual: "🚗 14 − 4", equation: "14 − 4", answer: 10 },
        { prompt: "盒子里有 9 支笔，又放入 8 支，现在有几支？", visual: "✏️ 9 + ✏️ 8", equation: "9 + 8", answer: 17 }
      ]
    };
    return decksByTab[tab];
  }

  function renderMath() {
    const deck = getMathDeck(current.tab);
    if (current.question >= deck.length) return renderCompletion(deck.length);
    const q = deck[current.question];
    if (q.answers) {
      decks.math = decks.math || {};
      decks.math[current.tab] = deck;
      return renderChoiceQuestion();
    }
    $("#level-content").innerHTML = `
      <article class="question-card">
        <div class="round-meta"><span>⭐ 第 ${current.question + 1} / ${deck.length} 关</span><span>✅ <b class="score-count">${current.score}</b></span></div>
        <p class="prompt">${q.prompt}</p>
        <div class="question-visual">${q.visual}</div>
        <div class="number-row"><span>${q.equation} =</span><input class="number-input" type="number" inputmode="numeric" aria-label="请输入答案" /></div>
        <button class="submit-button" type="button">确定</button>
        <p class="feedback" aria-live="assertive"></p>
        <button class="next-button" type="button">下一题 →</button>
      </article>`;
    const input = $(".number-input");
    const submit = $(".submit-button");
    submit.addEventListener("click", () => submitMath(q));
    input.addEventListener("keydown", (event) => { if (event.key === "Enter") submitMath(q); });
    $(".next-button").addEventListener("click", nextQuestion);
    setTimeout(() => input.focus(), 50);
  }

  function submitMath(question) {
    if (current.locked) return;
    const input = $(".number-input");
    if (input.value === "") return showToast("先填入答案哦");
    if (Number(input.value) === question.answer) {
      current.locked = true;
      input.disabled = true;
      $(".submit-button").disabled = true;
      if (current.attempts === 0) current.score += 1;
      $(".score-count").textContent = current.score;
      $(".feedback").textContent = current.attempts === 0 ? "计算正确！" : "这次算对了，真棒！";
      $(".feedback").className = "feedback good";
    } else {
      current.attempts += 1;
      current.mistakes += 1;
      rememberMistake(question, String(question.answer));
      $(".feedback").className = "feedback bad";
      if (current.attempts === 1) {
        $(".feedback").textContent = "再检查一次加减号，还可以重算一次。";
        input.value = "";
        input.focus();
        return;
      }
      current.locked = true;
      input.disabled = true;
      $(".submit-button").disabled = true;
      $(".feedback").textContent = `正确答案是 ${question.answer}，跟着再算一遍。`;
    }
    $(".next-button").classList.add("show");
  }

  function renderGrammarLesson() {
    $(".instruction").textContent = "🎯 英语入门常考语法点。先读规则，再看懂例句。";
    $("#level-content").innerHTML = `
      <div class="lesson-list">
        <article class="lesson-card"><button class="audio-button lesson-audio" type="button" title="朗读例句" aria-label="朗读第一组例句" data-speech="I am a student. She is my sister. They are happy.">🔊</button><h3>be动词 am / is / are</h3><p>我用 am，你用 are，is 跟着他、她、它；单数用 is，复数用 are。</p><div class="lesson-example">I am a student. / She is my sister. / They are happy.</div><div class="lesson-tip">💡 先看主语，再选择 be 动词。</div></article>
        <article class="lesson-card"><button class="audio-button lesson-audio" type="button" title="朗读例句" aria-label="朗读第二组例句" data-speech="I play football every day. He plays football on Sundays.">🔊</button><h3>一般现在时</h3><p>表示经常做的事。主语是 he、she、it 时，动词通常要加 s。</p><div class="lesson-example">I play football every day. / He plays football on Sundays.</div><div class="lesson-tip">💡 看到 every day、usually、often，常用一般现在时。</div></article>
        <article class="lesson-card"><button class="audio-button lesson-audio" type="button" title="朗读例句" aria-label="朗读第三组例句" data-speech="a book, a cat, an apple, an egg">🔊</button><h3>a / an 的用法</h3><p>a 和 an 都表示“一个”。元音音素开头的单词前通常用 an。</p><div class="lesson-example">a book / a cat / an apple / an egg</div><div class="lesson-tip">💡 apple 前用 an，book 前用 a。</div></article>
        <button class="submit-button lesson-complete" type="button">我学完了</button>
      </div>`;
    document.querySelectorAll(".lesson-audio").forEach((button) => button.addEventListener("click", () => speakEnglish(button.dataset.speech)));
    $(".lesson-complete").addEventListener("click", () => {
      current.score = 3;
      renderCompletion(3);
    });
  }

  function renderCompletion(total) {
    const stars = current.score === total ? 3 : current.score >= 2 ? 2 : 1;
    const oldStars = state.progress[current.subject][current.tab];
    const reward = Math.max(0, stars - oldStars) * 5;
    state.progress[current.subject][current.tab] = Math.max(oldStars, stars);
    state.coins += reward;
    const key = lessonKey();
    const isNewDailyLesson = !state.daily.completed.includes(key);
    if (isNewDailyLesson) state.daily.completed.push(key);
    state.lastLesson = { subject: current.subject, tab: current.tab, question: 0 };
    saveState();
    const dailyReady = state.daily.completed.length >= state.settings.dailyGoal;
    $("#level-content").innerHTML = `
      <article class="question-card completion">
        <div class="completion-icon" aria-hidden="true">🏆</div>
        <h2>完成这一组！</h2>
        <div class="stars" aria-label="获得 ${stars} 颗星">${renderStars(stars)}</div>
        <p>第一次答对 ${current.score} / ${total} 题${reward ? `，新获得 ${reward} 枚学习金币` : "，已经记录本次成绩"}。${isNewDailyLesson ? `<br>今日任务完成 ${Math.min(state.daily.completed.length, state.settings.dailyGoal)} / ${state.settings.dailyGoal} 组。` : ""}${dailyReady ? "<br>今日任务已达成，可以打卡啦！" : ""}</p>
        <button class="next-button" type="button">返回关卡</button>
        <button class="next-button home-action" type="button">回到主页</button>
      </article>`;
    const actions = document.querySelectorAll(".completion .next-button");
    actions[0].addEventListener("click", () => openSubject(current.subject, current.tab));
    actions[1].addEventListener("click", renderHome);
  }

  function openSettings() {
    const existing = $("#settings-dialog");
    if (existing) existing.remove();
    const totalCompleted = Object.values(state.progress).reduce((sum, tabs) => sum + Object.values(tabs).filter((stars) => stars > 0).length, 0);
    const dialog = document.createElement("dialog");
    dialog.id = "settings-dialog";
    dialog.className = "settings-dialog";
    dialog.innerHTML = `
      <form class="settings-form" method="dialog">
        <div class="settings-head"><h2>家长设置</h2><button class="icon-button close-settings" type="button" title="关闭" aria-label="关闭家长设置">×</button></div>
        <div class="settings-summary"><div><strong>${totalCompleted}</strong><span>已完成关卡</span></div><div><strong>${state.review.length}</strong><span>待复习错题</span></div></div>
        <label class="settings-field"><span>每日学习目标</span><select id="daily-goal"><option value="1">每天 1 组</option><option value="2">每天 2 组</option><option value="3">每天 3 组</option><option value="4">每天 4 组</option></select><small>完成目标后，今日打卡按钮才会解锁。</small></label>
        <label class="toggle-row"><span>英语朗读</span><input id="speech-enabled" type="checkbox" /></label>
        <label class="settings-field"><span>英语口音</span><select id="speech-locale"><option value="en-US">美式英语</option><option value="en-GB">英式英语</option></select><small>具体声音由当前设备提供，部分设备的音色可能不同。</small></label>
        <label class="settings-field"><span>正常朗读速度</span><input id="speech-rate" type="range" min="0.7" max="1" step="0.05" /><small>题目中的乌龟按钮始终使用慢速朗读。</small></label>
        <div class="settings-actions"><button class="settings-save" type="submit">保存设置</button><button class="settings-reset" type="button">清除学习记录</button></div>
      </form>`;
    document.body.appendChild(dialog);
    $("#daily-goal", dialog).value = String(state.settings.dailyGoal);
    $("#speech-enabled", dialog).checked = state.settings.speechEnabled;
    $("#speech-locale", dialog).value = state.settings.speechLocale;
    $("#speech-rate", dialog).value = String(state.settings.speechRate);
    $(".close-settings", dialog).addEventListener("click", () => dialog.close());
    $(".settings-form", dialog).addEventListener("submit", () => {
      state.settings.dailyGoal = Number($("#daily-goal", dialog).value);
      state.settings.speechEnabled = $("#speech-enabled", dialog).checked;
      state.settings.speechLocale = $("#speech-locale", dialog).value;
      state.settings.speechRate = Number($("#speech-rate", dialog).value);
      saveState();
      setTimeout(() => { dialog.remove(); renderHome(); showToast("家长设置已保存"); }, 0);
    });
    $(".settings-reset", dialog).addEventListener("click", () => {
      if (!window.confirm("确定清除金币、星级、打卡和错题记录吗？此操作无法撤销。")) return;
      localStorage.removeItem(STORAGE_KEY);
      window.location.reload();
    });
    dialog.addEventListener("close", () => setTimeout(() => dialog.remove(), 0), { once: true });
    dialog.showModal();
  }

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) saveState();
  });
  document.addEventListener("pointerdown", markActivity, { passive: true });
  document.addEventListener("keydown", markActivity);
  setInterval(() => {
    if (!document.hidden && Date.now() - lastActivityAt <= 30000) {
      state.activeSeconds += 10;
      saveState();
      const minutes = $("#today-minutes");
      if (minutes) minutes.textContent = `${Math.floor(state.activeSeconds / 60)}分钟`;
    }
  }, 10000);

  window.addEventListener("popstate", renderHome);
  renderHome();

  if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
    window.addEventListener("load", () => navigator.serviceWorker.register("./sw.js").catch(() => {}));
  }
})();
