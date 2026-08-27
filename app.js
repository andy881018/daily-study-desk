(() => {
  "use strict";

  const STORAGE_KEY = "daily-study-desk-v1";
  const curriculum = window.STUDY_CURRICULUM;
  if (!curriculum?.days || curriculum.days.length !== 60) throw new Error("60天课程数据未正确载入");

  const today = () => new Date().toLocaleDateString("sv-SE");
  const subjects = {
    chinese: { title: "语文成长关", icon: "📖", color: "#d93a32", soft: "#ffe8e5", description: "识字 · 拼音 · 阅读表达" },
    math: { title: "数学星星关", icon: "⭐", color: "#176bbb", soft: "#e7f1ff", description: "数感 · 运算 · 图形应用" },
    english: { title: "英语金币关", icon: "🪙", color: "#e75a12", soft: "#fff0e5", description: "听说 · 词汇 · 情境表达" }
  };
  const subjectKeys = Object.keys(subjects);
  const defaultState = {
    coins: 20,
    streak: 0,
    lastCheckin: "",
    activeSeconds: 0,
    activeDate: today(),
    daily: { date: today(), completed: [] },
    program: { version: curriculum.version, completedDays: 0, records: {} },
    review: [],
    settings: { speechEnabled: true, speechRate: 0.82, speechLocale: "en-US" }
  };

  let state = loadState();
  let current = null;
  let toastTimer;
  let lastActivityAt = Date.now();

  function loadState() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
      const merged = {
        ...defaultState,
        ...saved,
        daily: { ...defaultState.daily, ...(saved.daily || {}) },
        program: { ...defaultState.program, ...(saved.program || {}), records: { ...(saved.program?.records || {}) }, version: curriculum.version },
        settings: { ...defaultState.settings, ...(saved.settings || {}) },
        review: Array.isArray(saved.review) ? saved.review.slice(0, 100) : []
      };
      merged.program.completedDays = Math.max(0, Math.min(60, Number(merged.program.completedDays) || 0));
      if (merged.activeDate !== today()) {
        merged.activeDate = today();
        merged.activeSeconds = 0;
      }
      if (merged.daily.date !== today()) merged.daily = { date: today(), completed: [] };
      return merged;
    } catch {
      return structuredClone(defaultState);
    }
  }

  function saveState() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
  function $(selector, root = document) { return root.querySelector(selector); }
  function app() { return $("#app"); }
  function markActivity() { lastActivityAt = Date.now(); }
  function activeDayNumber() { return Math.min(60, state.program.completedDays + 1); }
  function isFinished() { return state.program.completedDays >= 60; }
  function isRestingToday() { return state.lastCheckin === today(); }
  function dailyKey(day, subject) { return `day-${day}:${subject}`; }
  function recordKey(day, subject) { return `${curriculum.version}:${day}:${subject}`; }
  function dailyDone(day, subject) { return state.daily.completed.includes(dailyKey(day, subject)); }
  function completedToday(day) { return subjectKeys.filter((key) => dailyDone(day, key)).length; }

  function showToast(message) {
    const toast = $("#toast");
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 2300);
  }

  function renderStars(count) {
    return [0, 1, 2].map((index) => `<span class="${index < count ? "earned" : ""}">★</span>`).join("");
  }

  function renderHome() {
    current = null;
    const template = $("#home-template").content.cloneNode(true);
    app().replaceChildren(template);
    $("#today-minutes").textContent = `${Math.floor(state.activeSeconds / 60)}分钟`;
    $("#streak-days").textContent = `${state.streak}天`;
    $("#coin-count").textContent = state.coins;
    $("#settings-button").addEventListener("click", openSettings);

    const resting = isRestingToday();
    const day = resting && state.program.completedDays > 0 ? state.program.completedDays : activeDayNumber();
    const dayData = curriculum.days[day - 1];
    const done = resting ? 3 : completedToday(day);
    const finished = isFinished();

    $("#daily-plan-title").textContent = finished ? "60天衔接计划完成" : `第 ${day} 天 · ${dayData.stage}`;
    $("#daily-plan-count").textContent = `${done} / 3`;
    $("#daily-plan-bar").style.width = `${(done / 3) * 100}%`;
    $("#daily-plan-message").textContent = finished
      ? "完整走过语文、数学、英语60天进阶路线"
      : resting
        ? `第 ${day} 天已完成，明天进入第 ${Math.min(60, day + 1)} 天`
        : `总进度 ${state.program.completedDays} / 60 天，今天三科全部完成后打卡`;

    const continueButton = $("#continue-button");
    if (!finished && !resting) {
      const nextSubject = subjectKeys.find((key) => !dailyDone(day, key));
      if (nextSubject) {
        continueButton.hidden = false;
        continueButton.lastElementChild.textContent = `继续第${day}天：${subjects[nextSubject].title}`;
        continueButton.addEventListener("click", () => openSubject(nextSubject));
      }
    }

    const grid = $("#subject-grid");
    grid.classList.add("three-subjects");
    subjectKeys.forEach((key) => {
      const subject = subjects[key];
      const lesson = dayData[key];
      const record = state.program.records[recordKey(day, key)];
      const stars = record?.stars || 0;
      const card = document.createElement("button");
      card.type = "button";
      card.className = "subject-card";
      card.style.setProperty("--subject", subject.color);
      card.style.setProperty("--soft", subject.soft);
      card.innerHTML = `<span class="subject-icon" aria-hidden="true">${subject.icon}</span><h2>${subject.title}</h2><div class="stars" aria-label="获得 ${stars} 颗星">${renderStars(stars)}</div><p>${lesson.title}</p><span class="subject-progress">${dailyDone(day, key) || resting ? "今日已完成" : "今日待完成 · 5题"}</span>`;
      card.addEventListener("click", () => {
        if (finished) return showToast("60天计划已经完成，可以继续复习任意内容");
        if (resting) return showToast("今天已经完成，明天继续下一天");
        openSubject(key);
      });
      grid.appendChild(card);
    });

    const checkin = $("#checkin-button");
    if (finished) {
      checkin.classList.add("is-done");
      checkin.innerHTML = `<span aria-hidden="true">🏆</span><span>60天计划已完成</span>`;
    } else if (resting) {
      checkin.classList.add("is-done");
      checkin.innerHTML = `<span aria-hidden="true">✓</span><span>今日已打卡</span>`;
    } else if (done < 3) {
      checkin.classList.add("is-locked");
      checkin.setAttribute("aria-disabled", "true");
      checkin.innerHTML = `<span aria-hidden="true">🔒</span><span>完成三科后打卡</span>`;
    }
    checkin.addEventListener("click", checkIn);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function checkIn() {
    if (isFinished()) return showToast("60天学习计划已经全部完成");
    if (isRestingToday()) return showToast("今天已经打过卡啦！");
    const day = activeDayNumber();
    const done = completedToday(day);
    if (done < 3) return showToast(`还差 ${3 - done} 科，完成语文、数学和英语后打卡`);

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayKey = yesterday.toLocaleDateString("sv-SE");
    state.streak = state.lastCheckin === yesterdayKey ? state.streak + 1 : 1;
    state.lastCheckin = today();
    state.coins += 10;
    state.program.completedDays = Math.min(60, state.program.completedDays + 1);
    saveState();
    renderHome();
    showToast(state.program.completedDays === 60 ? "60天计划完成，太了不起了！" : `第${day}天打卡成功，奖励10枚金币！`);
  }

  function openSubject(key) {
    const day = activeDayNumber();
    const dayData = curriculum.days[day - 1];
    current = { subject: key, day, stage: dayData.stage, lesson: dayData[key], question: 0, score: 0, attempts: 0, locked: false, mistakes: 0 };
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
        <section class="day-overview">
          <div><span>DAY ${current.day} / 60</span><strong>${current.stage}</strong></div>
          <h2>${current.lesson.title}</h2>
          <p>${current.lesson.goal}</p>
          ${current.lesson.note ? `<small>${current.lesson.note}</small>` : ""}
        </section>
        <div class="instruction">完成5题，其中包含昨日和五日前的回声复习。</div>
        <section id="level-content"></section>
      </section>`;
    $(".back-button").addEventListener("click", renderHome);
    renderQuestion();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function renderQuestion() {
    const questions = current.lesson.questions;
    if (current.question >= questions.length) return renderCompletion();
    const question = questions[current.question];
    const subject = subjects[current.subject];
    const englishText = current.subject === "english" && /[A-Za-z]/.test(question.visual) ? "english-text" : "";
    const audioControls = question.speech ? `<div class="audio-controls" aria-label="英语发音"><button class="audio-button play-audio" type="button" title="正常速度朗读" aria-label="正常速度朗读">🔊</button><button class="audio-button slow play-audio-slow" type="button" title="慢速朗读" aria-label="慢速朗读">🐢</button></div>` : "";
    $("#level-content").innerHTML = `
      <article class="question-card" style="--subject:${subject.color}">
        <div class="round-meta"><span>⭐ 第 ${current.question + 1} / ${questions.length} 题</span><span>✅ <b class="score-count">${current.score}</b></span></div>
        <p class="prompt">${question.prompt}</p>
        <div class="question-visual ${englishText}">${question.visual}</div>
        ${question.example ? `<p class="example">${question.example}</p>` : ""}
        ${audioControls}
        <div class="answers"></div>
        <p class="feedback" aria-live="assertive"></p>
        <button class="next-button" type="button">下一题 →</button>
      </article>`;
    const answers = $(".answers");
    question.answers.forEach((answer, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "answer-button";
      button.textContent = answer;
      button.addEventListener("click", () => chooseAnswer(index, question));
      answers.appendChild(button);
    });
    $(".play-audio")?.addEventListener("click", () => speakEnglish(question.speech));
    $(".play-audio-slow")?.addEventListener("click", () => speakEnglish(question.speech, true));
    $(".next-button").addEventListener("click", nextQuestion);
  }

  function rememberMistake(question, answer) {
    const id = `${curriculum.version}|${current.day}|${current.subject}|${question.prompt}`;
    state.review = [{ id, day: current.day, subject: current.subject, prompt: question.prompt, answer, date: today() }, ...state.review.filter((item) => item.id !== id)].slice(0, 100);
    saveState();
  }

  function chooseAnswer(selected, question) {
    if (current.locked) return;
    const buttons = [...document.querySelectorAll(".answer-button")];
    const correct = question.correct;
    if (selected === correct) {
      current.locked = true;
      buttons[correct].classList.add("correct");
      if (current.attempts === 0) current.score += 1;
      $(".score-count").textContent = current.score;
      $(".feedback").textContent = current.attempts === 0 ? "一次答对！继续保持。" : "这次答对了，已经记住啦！";
      $(".feedback").className = "feedback good";
      if (question.speech) speakEnglish(question.speech);
      $(".next-button").classList.add("show");
      return;
    }

    buttons[selected].classList.add("wrong");
    buttons[selected].disabled = true;
    current.attempts += 1;
    current.mistakes += 1;
    rememberMistake(question, buttons[correct].textContent);
    $(".feedback").className = "feedback bad";
    if (current.attempts === 1) {
      $(".feedback").textContent = "再想一想，还可以试一次。";
      return;
    }
    current.locked = true;
    buttons[correct].classList.add("correct");
    $(".feedback").textContent = `正确答案是“${buttons[correct].textContent}”，跟着再读一遍。`;
    if (question.speech) speakEnglish(question.speech, true);
    $(".next-button").classList.add("show");
  }

  function nextQuestion() {
    current.question += 1;
    current.attempts = 0;
    current.locked = false;
    renderQuestion();
  }

  function renderCompletion() {
    const total = current.lesson.questions.length;
    const stars = current.score === total ? 3 : current.score >= Math.ceil(total * 0.6) ? 2 : 1;
    const key = recordKey(current.day, current.subject);
    const oldStars = state.program.records[key]?.stars || 0;
    const reward = Math.max(0, stars - oldStars) * 2;
    state.program.records[key] = { stars: Math.max(oldStars, stars), score: current.score, total, mistakes: current.mistakes, date: today(), title: current.lesson.title };
    state.coins += reward;
    const dKey = dailyKey(current.day, current.subject);
    if (!state.daily.completed.includes(dKey)) state.daily.completed.push(dKey);
    saveState();

    const remaining = subjectKeys.filter((subject) => !dailyDone(current.day, subject));
    const allDone = remaining.length === 0;
    $("#level-content").innerHTML = `
      <article class="question-card completion">
        <div class="completion-icon" aria-hidden="true">${allDone ? "🏆" : "🌟"}</div>
        <h2>${subjects[current.subject].title}完成！</h2>
        <div class="stars" aria-label="获得 ${stars} 颗星">${renderStars(stars)}</div>
        <p>第一次答对 ${current.score} / ${total} 题${reward ? `，获得${reward}枚金币` : "，成绩已经更新"}。<br>${allDone ? "今天三科全部完成，可以回主页打卡！" : `今天还剩${remaining.length}科。`}</p>
        ${allDone ? "" : `<button class="next-button next-subject" type="button">下一科：${subjects[remaining[0]].title}</button>`}
        <button class="next-button home-action" type="button">回到主页</button>
      </article>`;
    $(".next-subject")?.addEventListener("click", () => openSubject(remaining[0]));
    $(".home-action").addEventListener("click", renderHome);
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

  function openSettings() {
    $("#settings-dialog")?.remove();
    const dialog = document.createElement("dialog");
    dialog.id = "settings-dialog";
    dialog.className = "settings-dialog";
    dialog.innerHTML = `
      <form class="settings-form" method="dialog">
        <div class="settings-head"><h2>家长设置</h2><button class="icon-button close-settings" type="button" title="关闭" aria-label="关闭家长设置">×</button></div>
        <div class="settings-summary"><div><strong>${state.program.completedDays}</strong><span>完成天数 / 60</span></div><div><strong>${state.review.length}</strong><span>待复习错题</span></div></div>
        <div class="program-setting"><strong>海淀衔接加强版</strong><span>每天语文、数学、英语各5题，完成三科后打卡。</span></div>
        <label class="toggle-row"><span>英语朗读</span><input id="speech-enabled" type="checkbox" /></label>
        <label class="settings-field"><span>英语口音</span><select id="speech-locale"><option value="en-US">美式英语</option><option value="en-GB">英式英语</option></select><small>具体声音由当前设备提供。</small></label>
        <label class="settings-field"><span>正常朗读速度</span><input id="speech-rate" type="range" min="0.7" max="1" step="0.05" /><small>乌龟按钮使用更慢的速度。</small></label>
        <div class="settings-actions"><button class="settings-save" type="submit">保存设置</button><button class="settings-reset" type="button">清除学习记录</button></div>
      </form>`;
    document.body.appendChild(dialog);
    $("#speech-enabled", dialog).checked = state.settings.speechEnabled;
    $("#speech-locale", dialog).value = state.settings.speechLocale;
    $("#speech-rate", dialog).value = String(state.settings.speechRate);
    $(".close-settings", dialog).addEventListener("click", () => dialog.close());
    $(".settings-form", dialog).addEventListener("submit", () => {
      state.settings.speechEnabled = $("#speech-enabled", dialog).checked;
      state.settings.speechLocale = $("#speech-locale", dialog).value;
      state.settings.speechRate = Number($("#speech-rate", dialog).value);
      saveState();
      setTimeout(() => { dialog.remove(); renderHome(); showToast("家长设置已保存"); }, 0);
    });
    $(".settings-reset", dialog).addEventListener("click", () => {
      if (!window.confirm("确定清除金币、60天进度、打卡和错题记录吗？此操作无法撤销。")) return;
      localStorage.removeItem(STORAGE_KEY);
      window.location.reload();
    });
    dialog.addEventListener("close", () => setTimeout(() => dialog.remove(), 0), { once: true });
    dialog.showModal();
  }

  document.addEventListener("visibilitychange", () => { if (document.hidden) saveState(); });
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

  renderHome();
  if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
    window.addEventListener("load", () => navigator.serviceWorker.register("./sw.js").catch(() => {}));
  }
})();
