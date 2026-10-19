(() => {
  "use strict";

  let active = null;
  const recognitionType = () => window.SpeechRecognition || window.webkitSpeechRecognition;
  const stopTracks = (stream) => stream?.getTracks().forEach((track) => track.stop());

  function dispose() {
    const session = active;
    if (!session) return;
    active = null;
    clearTimeout(session.timer);
    if (session.recorder?.state === "recording") session.recorder.stop();
    stopTracks(session.stream);
    session.recognition?.abort();
    session.audio?.pause();
    if (session.url) URL.revokeObjectURL(session.url);
  }

  function mount(root, options) {
    dispose();
    if (!root) return;
    const session = { root, options, busy: false, url: null, timer: null };
    active = session;
    root.hidden = false;
    root.className = "speaking-practice";
    root.innerHTML = `<h3>小小跟读员</h3>
      <p class="speaking-target"></p>
      <p class="practice-note">听一遍，再读一遍。跟读不影响答题和金币。</p>
      <div class="speaking-actions">
        <button type="button" class="practice-demo">🔊 听示范</button>
        <button type="button" class="practice-record">🎙 录音跟读</button>
        <button type="button" class="practice-stop" hidden>结束录音</button>
      </div>
      <audio class="practice-playback" controls preload="metadata" hidden aria-label="回放我的跟读录音"></audio>
      <div class="recognition-actions" hidden><button type="button" class="practice-recognize">试试单词识别</button><button type="button" class="recognition-stop" hidden>结束识别</button><p class="practice-note">重新读一次；单词匹配度仅供练习参考，不能评判口音和发音标准程度。</p></div>
      <p class="practice-status" role="status" aria-live="polite">准备好了就读一读吧！</p>
      <p class="practice-note">录音仅供本题回放，离开题目即释放。每次最多录10秒。</p>`;
    session.find = (selector) => root.querySelector(selector);
    session.status = (text) => { if (active === session) session.find(".practice-status").textContent = text; };
    session.find(".speaking-target").textContent = options.text;
    session.audio = session.find("audio");
    session.find(".practice-demo").addEventListener("click", () => {
      session.audio.pause();
      options.speak();
    });
    session.find(".practice-record").addEventListener("click", () => startRecording(session));
    session.find(".practice-stop").addEventListener("click", () => finishRecording(session));
    const recordingSupported = !!(window.isSecureContext && navigator.mediaDevices?.getUserMedia && window.MediaRecorder);
    if (!recordingSupported) {
      session.find(".practice-record").disabled = true;
      session.status("当前环境暂时不能录音。可以在 iPhone 的 Safari 中打开正式网站，或先听示范跟读。");
    }
    const showRecognition = options.recognitionEnabled && !!recognitionType();
    session.find(".recognition-actions").hidden = !showRecognition;
    session.find(".practice-recognize").addEventListener("click", () => startRecognition(session));
    session.find(".recognition-stop").addEventListener("click", () => {
      // 立即停止捕获，并允许服务返回已经听到的内容。
      session.recognition?.stop();
    });
    if (options.recognitionEnabled && !recognitionType()) session.status("这台设备暂不支持单词识别，录音回放仍可使用。");
    session.audio.addEventListener("play", () => window.speechSynthesis?.cancel());
  }

  function setBusy(session, busy, mode = "") {
    session.busy = busy;
    session.find(".practice-demo").disabled = busy;
    session.find(".practice-record").disabled = busy || !(navigator.mediaDevices?.getUserMedia && window.MediaRecorder && window.isSecureContext);
    session.find(".practice-recognize").disabled = busy;
    session.find(".practice-stop").hidden = !(busy && mode === "record");
    session.find(".recognition-stop").hidden = !(busy && mode === "recognize");
    session.audio.hidden = busy || !session.url;
  }

  async function startRecording(session) {
    if (active !== session || session.busy) return;
    setBusy(session, true);
    window.speechSynthesis?.cancel();
    session.audio.pause();
    session.status("请允许使用麦克风，准备读出上面的单词。");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (active !== session) { stopTracks(stream); return; }
      session.stream = stream;
      // 让浏览器选择自己的录音格式，兼容 Safari 的 MP4 和其他浏览器的 WebM。
      const recorder = new MediaRecorder(stream);
      session.recorder = recorder;
      const chunks = [];
      let failed = false;
      recorder.ondataavailable = (event) => { if (event.data?.size) chunks.push(event.data); };
      recorder.onerror = () => {
        failed = true;
        finishRecording(session);
        session.status("这次录音没有成功，请重新试一次。");
      };
      recorder.onstop = () => {
        clearTimeout(session.timer);
        stopTracks(stream);
        if (active !== session) return;
        setBusy(session, false);
        if (failed || !chunks.length) {
          session.status("这次没有录到声音，点录音再试一次吧。");
          return;
        }
        if (session.url) URL.revokeObjectURL(session.url);
        session.url = URL.createObjectURL(new Blob(chunks, { type: recorder.mimeType || chunks[0].type }));
        session.audio.src = session.url;
        session.audio.hidden = false;
        session.status("录好啦！点播放，听听自己的声音，再和示范比一比。");
      };
      recorder.start();
      setBusy(session, true, "record");
      session.status("正在录音，请读单词。读完点“结束录音”。");
      session.timer = setTimeout(() => finishRecording(session), 10000);
    } catch (error) {
      stopTracks(session.stream);
      if (active !== session) return;
      setBusy(session, false);
      session.status(error.name === "NotAllowedError" ? "麦克风还没有获准使用。请家长检查网站的麦克风权限，也可以先听示范。" : "暂时无法使用麦克风，请检查麦克风是否被其他应用占用，再试一次。");
    }
  }

  function finishRecording(session) {
    clearTimeout(session.timer);
    if (session.recorder?.state === "recording") session.recorder.stop();
    stopTracks(session.stream);
  }

  function startRecognition(session) {
    if (active !== session || session.busy || !session.options.recognitionEnabled) return;
    const Recognition = recognitionType();
    if (!Recognition) return;
    session.audio.pause();
    window.speechSynthesis?.cancel();
    const recognition = new Recognition();
    session.recognition = recognition;
    recognition.lang = session.options.locale;
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    let received = false;
    setBusy(session, true, "recognize");
    session.status("正在听，请读出上面的单词；读完可以点“结束识别”。");
    const normalize = (text) => String(text).toLowerCase().replace(/[^a-z\s]/g, " ").trim().replace(/\s+/g, " ");
    recognition.onresult = (event) => {
      if (active !== session) return;
      received = true;
      const transcript = event.results[0]?.[0]?.transcript || "";
      const expected = normalize(session.options.text);
      const actual = normalize(transcript);
      session.status(actual === expected && actual
        ? `听到了“${transcript}”！单词匹配度100%，再接再厉！这不是专业发音分数。`
        : `这次听到的是“${transcript || "不太清楚的声音"}”。先听示范，放慢一点再读吧；识别也可能听错。`);
      recognition.stop();
    };
    recognition.onerror = (event) => {
      if (active !== session) return;
      received = true;
      const messages = {
        "not-allowed": "单词识别没有获准使用，请家长检查权限。可以继续用录音回放。",
        "service-not-allowed": "这台设备的语音识别服务暂不可用，可以继续用录音回放。",
        "network": "识别服务暂时连不上，请检查网络，或使用录音回放。",
        "no-speech": "这次没有听清，靠近麦克风，准备好再试一次吧。",
        "audio-capture": "麦克风暂时无法使用，请检查是否被其他应用占用。"
      };
      session.status(messages[event.error] || "这次没有完成识别，可以再试一次，或使用录音回放。");
    };
    recognition.onend = () => {
      clearTimeout(session.timer);
      if (active !== session) return;
      setBusy(session, false);
      if (!received) session.status("这次没有听清，先听一遍示范，准备好再来。");
    };
    try {
      recognition.start();
      session.timer = setTimeout(() => {
        if (active !== session) return;
        recognition.abort();
        setBusy(session, false);
        session.status("这次识别已结束，可以重新试一次，或使用录音回放。");
      }, 15000);
    } catch {
      setBusy(session, false);
      session.status("暂时无法启动单词识别，可以继续用录音回放。");
    }
  }

  document.addEventListener("visibilitychange", () => {
    if (!document.hidden || !active) return;
    const session = active;
    const root = session.root;
    dispose();
    root.innerHTML = '<p class="practice-note">跟读已暂停，麦克风已关闭。回到这道题可以重新练习。</p><button type="button" class="practice-resume">重新练习跟读</button>';
    root.querySelector("button").addEventListener("click", () => mount(root, session.options));
  });
  window.addEventListener("pagehide", dispose);
  window.STUDY_SPEAKING = { mount, dispose, isBusy: () => !!active?.busy };
})();
