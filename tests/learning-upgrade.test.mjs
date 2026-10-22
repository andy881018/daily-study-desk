import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import { resolve, extname } from "node:path";
import { createRequire } from "node:module";
import vm from "node:vm";

const root = resolve(import.meta.dirname, "..");
const context = { window: {} };
vm.runInNewContext(await readFile(resolve(root, "curriculum.js"), "utf8"), context);
const curriculum = context.window.STUDY_CURRICULUM;

test("60天题库：题数、唯一答案、拼音边界、数学范围和英语节奏", () => {
  assert.equal(curriculum.days.length, 60);
  let count = 0;
  const stripTone = (text) => text.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const allowed = /^(?:[bpmfdtnlgkh]|[bpmfdtnl]?[aoeiu]|l[uü]|[gkh][aoeu])$/;
  curriculum.days.forEach((day, index) => {
    assert.equal(day.chinese.questions.length, 10);
    assert.equal(day.math.questions.length, 5);
    assert.equal(day.english.questions.length, 5);
    assert.equal(day.chinese.questions.filter((q) => q.skill === "understanding").length, 3);
    assert.equal(day.chinese.questions.filter((q) => q.skill === "pinyin-tone").length, 1);
    assert.equal(day.chinese.questions.filter((q) => ["text-to-pinyin", "pinyin-to-text"].includes(q.skill)).length, 6);
    assert.ok(day.chinese.questions.every((q) => !/合起来|拆开|声母和韵母/.test(q.prompt)));
    assert.equal(day.chinese.questions[1].skill, "text-to-pinyin");
    assert.equal(day.chinese.questions[2].skill, "pinyin-to-text");
    assert.notEqual(day.chinese.questions[1].visual, day.chinese.questions[2].answers[day.chinese.questions[2].correct]);
    for (const subject of ["chinese", "math", "english"]) {
      for (const question of day[subject].questions) {
        count += 1;
        assert.ok(question.correct >= 0 && question.correct < question.answers.length);
        assert.equal(new Set(question.answers).size, question.answers.length);
        assert.ok(question.answers.length >= 2 && question.answers.length <= 4);
        assert.ok(!question.answers.includes("以上都不对"));
      }
    }
    day.chinese.questions.filter((q) => q.skill !== "understanding").forEach((q) => {
      const strings = [q.visual, ...q.answers].filter((s) => /[a-zāáǎàōóǒòēéěèīíǐìūúǔùǖǘǚǜü]/i.test(s));
      for (const s of strings) {
        for (const word of s.match(/[a-zāáǎàōóǒòēéěèīíǐìūúǔùǖǘǚǜü]+/gi) || []) {
          const plain = stripTone(word);
          assert.ok(allowed.test(plain), `超范围拼音：第${index + 1}天 ${word}`);
        }
      }
    });
    day.math.questions.filter((q) => q.skill === "arithmetic").forEach((q) => {
      assert.ok(q.operands.every((n) => n >= 0 && n <= 20));
      assert.ok(q.value >= 0 && q.value <= 20);
      const result = q.operator === "+" ? q.operands[0] + q.operands[1] : q.operands[0] - q.operands[1];
      assert.equal(Number(q.answers[q.correct]), result);
      if (index < 10 && q.operator === "-") assert.ok(q.operands[0] % 10 >= q.operands[1]);
    });
    assert.ok(day.english.questions.every((q) => q.answers.length <= (index < 15 ? 2 : 3)));
    if (index > 0 && index < 40 && index % 2 === 1) assert.equal(day.english.questions[0].speech, curriculum.days[index - 1].english.questions[0].speech);
    if (index > 1 && index < 40 && index % 2 === 0) assert.notEqual(day.english.questions[0].speech, curriculum.days[index - 1].english.questions[0].speech);
    if (index > 0) assert.notEqual(day.english.title, curriculum.days[index - 1].english.title);
  });
  assert.equal(count, 1200);
  assert.equal(new Set(curriculum.days.map((d) => d.english.questions[0].speech)).size, 20);
  const englishSpeeches = curriculum.days.map((day) => day.english.questions[0].speech);
  for (let index = 40; index < englishSpeeches.length; index += 1) assert.notEqual(englishSpeeches[index], englishSpeeches[index - 1]);
  assert.equal(new Set(curriculum.days.slice(40).map((day) => day.english.questions[0].speech)).size, 20);
});

test("浏览器：奖励新增编辑与更新保留、10题流程、金币上限和跟读", { timeout: 120000 }, async () => {
  const require = createRequire(import.meta.url);
  const { chromium } = require(process.env.STUDY_PLAYWRIGHT_MODULE || "playwright");
  const server = createServer(async (req, res) => {
    const path = new URL(req.url, "http://localhost").pathname;
    try {
      const file = resolve(root, path === "/" ? "index.html" : "." + path);
      if (!file.startsWith(root)) { res.writeHead(403).end(); return; }
      const content = await readFile(file);
      res.writeHead(200, { "Content-Type": ({ ".html": "text/html", ".js": "application/javascript", ".css": "text/css" })[extname(file)] || "application/octet-stream" }).end(content);
    } catch { res.writeHead(404).end(); }
  });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const origin = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch({ headless: true, args: ["--use-fake-device-for-media-stream", "--use-fake-ui-for-media-stream"] });
  const browserContext = await browser.newContext({ viewport: { width: 390, height: 844 }, permissions: ["microphone"], serviceWorkers: "block" });
  try {
    const page = await browserContext.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.addInitScript(() => {
      // 使用测试设备的假麦克风，不访问真实录音设备。
      window.testStreams = [];
      const getUserMedia = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
      navigator.mediaDevices.getUserMedia = async (...args) => {
        const stream = await getUserMedia(...args);
        window.testStreams.push(stream);
        return stream;
      };
      window.SpeechRecognition = class {
        start() { window.testRecognition = this; }
        stop() { this.onend?.(); }
        abort() { this.onend?.(); }
      };
      window.seedOldRecord = () => {
        const date = new Date().toLocaleDateString("sv-SE");
        const monday = new Date(); monday.setDate(monday.getDate() - (monday.getDay() + 6) % 7);
        const record = {
          coins: 456, streak: 4, lastCheckin: "2000-01-01",
          daily: { date, completed: [] },
          program: { version: "2026.08-60day-v2-textbook", completedDays: 22, records: { "2026.08-60day-v2-textbook:22:math": { stars: 3, date: "2000-01-01", score: 5, total: 5 } } },
          rewards: { custom: Array.from({ length: 51 }, (_, i) => ({ id: `custom-test-${i}`, title: "去科技馆", cost: 88, icon: "🎁" })), counts: { "ipad-hour": 2 }, history: Array.from({ length: 110 }, () => ({ id: "ipad-hour", title: "iPad畅玩1小时", cost: 170, date: "2000-01-01" })) },
          weekly: { week: monday.toLocaleDateString("sv-SE"), counts: { homework: 2 } },
          settings: { speechEnabled: false, recognitionEnabled: true }
        };
        localStorage.setItem("daily-study-desk-v1", JSON.stringify(record));
        return record;
      };
      if (!sessionStorage.getItem("test-seeded")) {
        window.originalSeed = window.seedOldRecord();
        sessionStorage.setItem("test-seeded", "1");
      }
      if (sessionStorage.getItem("test-finished")) {
        const record = window.seedOldRecord();
        record.program.completedDays = 60;
        record.program.records["2026.08-60day-v2-textbook:1:chinese"] = { stars: 3, date: "2000-01-01", score: 5, total: 5 };
        localStorage.setItem("daily-study-desk-v1", JSON.stringify(record));
        sessionStorage.removeItem("test-finished");
      }
      if (sessionStorage.getItem("test-checked-in")) {
        const record = window.seedOldRecord();
        record.lastCheckin = new Date().toLocaleDateString("sv-SE");
        localStorage.setItem("daily-study-desk-v1", JSON.stringify(record));
        sessionStorage.removeItem("test-checked-in");
      }
      if (sessionStorage.getItem("test-course-update")) {
        // 在应用启动前模拟已用旧课程，家庭奖励来自实际界面操作。
        const record = JSON.parse(localStorage.getItem("daily-study-desk-v1"));
        record.program.version = "test-prior-curriculum";
        localStorage.setItem("daily-study-desk-v1", JSON.stringify(record));
        sessionStorage.removeItem("test-course-update");
      }
    });
    await page.goto(origin);
    const expected = await page.evaluate(() => window.originalSeed);
    const savedState = () => page.evaluate(() => JSON.parse(localStorage.getItem("daily-study-desk-v1")));
    let saved = await savedState();
    assert.equal(saved.coins, 456);
    assert.deepEqual(saved.rewards, expected.rewards);
    assert.deepEqual(saved.weekly, expected.weekly);
    assert.equal(saved.program.completedDays, 22);
    assert.equal(saved.program.curriculumStartDay, 23);
    assert.equal(saved.program.history[0].completedDays, 22);
    assert.equal(await page.locator("[data-course]").count(), 0);
    assert.match(await page.locator(".subject-card").first().innerText(), /10题/);
    assert.match(await page.locator(".subject-card").nth(2).innerText(), /hello/);
    const answerLesson = async (subject) => {
      const index = ["chinese", "math", "english"].indexOf(subject);
      await page.locator(".subject-card").nth(index).click();
      const correct = await page.evaluate((key) => window.STUDY_CURRICULUM.days[0][key].questions.map((q) => q.correct), subject);
      for (const answer of correct) {
        await page.locator(".answer-button").nth(answer).click();
        await page.locator("#level-content > article > .next-button").click();
      }
      assert.match(await page.locator(".completion").innerText(), new RegExp(`${correct.length} / ${correct.length}`));
      await page.getByRole("button", { name: "回到主页", exact: true }).click();
    };
    await answerLesson("chinese");
    saved = await savedState();
    assert.equal(saved.coins, 462); // 10题仍为满星6金币。
    await answerLesson("chinese");
    assert.equal((await savedState()).coins, 462); // 重做不得重复发币。
    await answerLesson("math");
    await page.locator(".subject-card").nth(2).click();
    const wrong = await page.evaluate(() => 1 - window.STUDY_CURRICULUM.days[0].english.questions[0].correct);
    await page.locator(".answer-button").nth(wrong).click();
    assert.match(await page.locator(".feedback").innerText(), /正确答案/); // 两选一错后立即给出反馈。
    assert.equal(await page.locator(".speaking-practice").isVisible(), true);
    await page.locator(".practice-record").click();
    await page.waitForFunction(() => document.querySelector(".practice-status").textContent.includes("正在录音"));
    await page.waitForTimeout(400);
    await page.locator(".practice-stop").click();
    await page.waitForFunction(() => document.querySelector("audio").src.startsWith("blob:"));
    assert.equal(await page.locator("audio").isVisible(), true);
    assert.equal(await page.evaluate(() => window.testStreams.every((s) => s.getTracks().every((t) => t.readyState === "ended"))), true);
    await page.locator(".practice-recognize").click();
    await page.evaluate(() => window.testRecognition.onresult({ results: [[{ transcript: "hello" }]] }));
    assert.match(await page.locator(".practice-status").innerText(), /单词匹配度100%/);
    assert.match(await page.locator(".practice-status").innerText(), /不是专业发音/);
    await page.locator(".practice-recognize").click();
    await page.evaluate(() => { window.testRecognition.onerror({ error: "network" }); window.testRecognition.onend(); });
    assert.match(await page.locator(".practice-status").innerText(), /连不上/);
    await page.evaluate(() => { navigator.mediaDevices.getUserMedia = async () => { throw new DOMException("denied", "NotAllowedError"); }; });
    await page.locator(".practice-record").click();
    await page.waitForFunction(() => document.querySelector(".practice-status").textContent.includes("没有获准"));
    assert.equal(await page.locator(".practice-record").isEnabled(), true);
    // 离开题目时，迟到的授权结果也必须停止所有录音轨道。
    await page.evaluate(() => { navigator.mediaDevices.getUserMedia = () => new Promise((resolve) => { window.resolveLateMedia = resolve; }); });
    await page.locator(".practice-record").click();
    await page.getByRole("button", { name: "返回主页", exact: true }).click();
    await page.evaluate(() => {
      window.lateTrack = { readyState: "live", stop() { this.readyState = "ended"; } };
      window.resolveLateMedia({ getTracks: () => [window.lateTrack] });
    });
    assert.equal(await page.evaluate(() => window.lateTrack.readyState), "ended");
    await answerLesson("english");
    await page.locator("#checkin-button").click();
    saved = await savedState();
    assert.equal(saved.coins, 484); // 3科满星18 + 打卡10。
    assert.equal(saved.program.completedDays, 23);
    assert.deepEqual(saved.rewards, expected.rewards);
    await page.reload();
    assert.equal((await savedState()).coins, 484);
    assert.equal((await savedState()).program.completedDays, 23);
    // 原计划已经学满时，历史记录必须保留，新题库仍能使用。
    await page.evaluate(() => sessionStorage.setItem("test-finished", "1"));
    await page.reload();
    assert.equal((await savedState()).program.completedDays, 0);
    assert.equal((await savedState()).program.history[0].completedDays, 60);
    await page.locator(".subject-card").first().click();
    assert.match(await page.locator(".round-meta").innerText(), /1 \/ 10/);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true);
    await page.screenshot({ path: resolve(root, "learning-upgrade-preview.png"), fullPage: true, animations: "disabled" });
    await page.getByRole("button", { name: "返回主页", exact: true }).click();
    await answerLesson("chinese");
    assert.equal((await savedState()).coins, 462); // 新一轮不继承旧第1天的星级发币上限。
    await page.evaluate(() => sessionStorage.setItem("test-checked-in", "1"));
    await page.reload();
    assert.match(await page.locator("#checkin-button").innerText(), /今日已打卡/);
    assert.equal((await savedState()).coins, 456); // 升级不重复发今日打卡金币。
    // 实际添加、编辑奖励，再迁移课程；不能只验证预置测试数据。
    await page.locator("#coin-store-button").click();
    await page.getByRole("button", { name: "家长添加" }).click();
    await page.locator("#reward-title").fill("周末去自然博物馆");
    await page.locator("#reward-cost").fill("88");
    await page.getByRole("button", { name: "添加到兑换中心", exact: true }).click();
    const customReward = (await savedState()).rewards.custom.at(-1);
    assert.equal(customReward.title, "周末去自然博物馆");
    const rewardCard = page.locator(`[data-reward-id="${customReward.id}"]`);
    await rewardCard.getByRole("button", { name: "编辑周末去自然博物馆", exact: true }).click();
    await page.locator("#reward-title").fill("周末去自然博物馆和吃冰淇淋");
    await page.locator("#reward-cost").fill("101");
    await page.getByRole("button", { name: "保存修改", exact: true }).click();
    const beforeUpdate = await savedState();
    assert.equal(beforeUpdate.rewards.custom.length, 52);
    await page.evaluate(() => sessionStorage.setItem("test-course-update", "1"));
    await page.reload();
    saved = await savedState();
    assert.deepEqual(saved.rewards, beforeUpdate.rewards);
    assert.equal(saved.coins, beforeUpdate.coins);
    assert.equal(saved.program.version, curriculum.version);
    await page.locator("#coin-store-button").click();
    assert.match(await rewardCard.innerText(), /周末去自然博物馆和吃冰淇淋/);
    assert.match(await rewardCard.locator(".reward-cost").innerText(), /101/);
    await rewardCard.getByRole("button", { name: "兑换奖励", exact: true }).click();
    await page.getByRole("button", { name: "确认兑换", exact: true }).click();
    assert.match(await page.locator(".reward-celebration").innerText(), /大奖兑换成功/);
    const afterRedemption = await savedState();
    assert.equal(afterRedemption.coins, 355);
    assert.deepEqual(afterRedemption.rewards.custom, beforeUpdate.rewards.custom);
    assert.deepEqual(afterRedemption.rewards.counts, { ...beforeUpdate.rewards.counts, [customReward.id]: 1 });
    assert.equal(afterRedemption.rewards.history.length, 111);
    assert.deepEqual(afterRedemption.rewards.history.slice(1), beforeUpdate.rewards.history);
    await page.reload();
    saved = await savedState();
    assert.deepEqual(saved.rewards, afterRedemption.rewards);
    assert.equal(saved.coins, 355);
    const overallBonus = page.locator("#overall-bonus-button");
    assert.match(await overallBonus.innerText(), /夯一下/);
    await overallBonus.click();
    assert.equal(await page.locator("#overall-bonus-dialog").isVisible(), true);
    await page.getByRole("button", { name: "确认加2金币", exact: true }).click();
    saved = await savedState();
    assert.equal(saved.coins, 357);
    assert.equal(saved.daily.overallRewarded, true);
    assert.equal(await page.locator("#overall-bonus-button").isDisabled(), true);
    await page.reload();
    assert.equal((await savedState()).coins, 357);
    assert.equal((await savedState()).daily.overallRewarded, true);
    assert.equal(await page.locator("#overall-bonus-button").isDisabled(), true);
    assert.deepEqual(errors, []);
  } finally {
    await browser.close();
    await new Promise((r) => server.close(r));
  }
});
