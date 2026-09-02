(() => {
  "use strict";

  const CONFIG = {
    eventMinMs: 2000,
    eventMaxMs: 10000,
    gapMinMs: 15000,
    gapMaxMs: 180000
  };

  const eventFiles = {
    nazad: "nazad.mp3",
    stop: "stop.mp3",
    gaz: "gaz.mp3"
  };

  const finishFile = "alga.mp3";

  const mainButton = document.getElementById("mainButton");
  const buttonIcon = document.getElementById("buttonIcon");
  const totalTimer = document.getElementById("totalTimer");
  const nextTimer = document.getElementById("nextTimer");
  const eventBadge = document.getElementById("eventBadge");
  const eventText = document.getElementById("eventText");
  const status = document.getElementById("status");
  const chips = [...document.querySelectorAll(".event-chip")];

  let running = false;
  let startedAt = 0;
  let totalBeforePause = 0;
  let lastAlgaAt = null;
  let timeoutId = null;
  let timerId = null;
  let currentAudio = null;
  let currentEvent = null;

  const randomInt = (min, max) =>
    Math.floor(Math.random() * (max - min + 1)) + min;

  const formatTime = (ms, withHours = true) => {
    const totalSeconds = Math.max(0, Math.floor(ms / 1000));
    const seconds = totalSeconds % 60;
    const minutes = Math.floor(totalSeconds / 60) % 60;
    const hours = Math.floor(totalSeconds / 3600);

    const s = String(seconds).padStart(2, "0");
    const m = String(minutes).padStart(2, "0");

    return withHours
      ? `${String(hours).padStart(2, "0")}:${m}:${s}`
      : `${m}:${s}`;
  };

  const stopAudio = () => {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      currentAudio = null;
    }
  };

  const clearSchedule = () => {
    clearTimeout(timeoutId);
    timeoutId = null;
  };

  const setChip = (name) => {
    chips.forEach(chip =>
      chip.classList.toggle("active", chip.dataset.event === name)
    );
  };

  const resetVisuals = () => {
    setChip(null);
    currentEvent = null;
    eventBadge.textContent = "ОЖИДАНИЕ";
    eventText.textContent = running
      ? "ОЖИДАНИЕ СЛЕДУЮЩЕГО ИВЕНТА"
      : "НАЖМИТЕ, ЧТОБЫ ЗАПУСТИТЬ";
  };

  const playFile = (filename) => {
    stopAudio();

    const audio = new Audio(filename);
    currentAudio = audio;
    audio.preload = "auto";

    const cleanup = () => {
      if (currentAudio === audio) currentAudio = null;
    };

    audio.addEventListener("ended", cleanup, { once: true });
    audio.addEventListener("error", cleanup, { once: true });

    audio.play().catch(() => {
      cleanup();
    });

    return audio;
  };

  const scheduleNextEvent = () => {
    if (!running) return;

    const delay = randomInt(CONFIG.gapMinMs, CONFIG.gapMaxMs);

    timeoutId = setTimeout(() => {
      timeoutId = null;
      startRandomEvent();
    }, delay);
  };

  const startRandomEvent = () => {
    if (!running) return;

    const names = Object.keys(eventFiles);
    const name = names[randomInt(0, names.length - 1)];
    const duration = randomInt(CONFIG.eventMinMs, CONFIG.eventMaxMs);

    currentEvent = name;
    setChip(name);
    eventBadge.textContent = name.toUpperCase();
    eventText.textContent = `ИВЕНТ АКТИВЕН · ${formatTime(duration, false)}`;

    playFile(eventFiles[name]);

    timeoutId = setTimeout(() => {
      if (!running || currentEvent !== name) return;

      setChip(null);
      eventBadge.textContent = "ЗАВЕРШЕНИЕ";
      eventText.textContent = "ALGA";

      // Момент завершения ивента — именно здесь сбрасываем правый таймер.
      lastAlgaAt = Date.now();
      playFile(finishFile);

      scheduleNextEvent();
    }, duration);
  };

  const elapsed = () => {
    if (!running) return totalBeforePause;
    return totalBeforePause + (Date.now() - startedAt);
  };

  const updateTimers = () => {
    // Левый таймер: общее время работы приложения.
    totalTimer.textContent = formatTime(elapsed(), true);

    // Правый таймер: время, прошедшее с последнего alga.
    if (lastAlgaAt !== null && running) {
      nextTimer.textContent = formatTime(Date.now() - lastAlgaAt, false);
    } else if (lastAlgaAt !== null) {
      nextTimer.textContent = formatTime(Date.now() - lastAlgaAt, false);
    } else {
      nextTimer.textContent = "00:00";
    }
  };

  const start = () => {
    if (running) return;

    running = true;
    startedAt = Date.now();

    status.classList.add("running");
    status.innerHTML = "<span></span> РАБОТАЕТ";
    mainButton.classList.add("active");
    mainButton.setAttribute("aria-label", "Поставить на паузу");
    buttonIcon.className = "pause-icon";

    eventBadge.textContent = "ЗАПУСК";
    eventText.textContent = "СЛЕДУЮЩИЙ ИВЕНТ БУДЕТ СЛУЧАЙНЫМ";

    // При первом запуске таймер с момента alga ещё не существует.
    lastAlgaAt = null;

    scheduleNextEvent();
    clearInterval(timerId);
    timerId = setInterval(updateTimers, 250);
    updateTimers();
  };

  const pause = () => {
    if (!running) return;

    totalBeforePause += Date.now() - startedAt;
    running = false;

    clearSchedule();
    stopAudio();
    resetVisuals();

    status.classList.remove("running");
    status.innerHTML = "<span></span> ПАУЗА";
    mainButton.classList.remove("active");
    mainButton.setAttribute("aria-label", "Продолжить");
    buttonIcon.className = "play-icon";

    updateTimers();
  };

  mainButton.addEventListener("click", () => {
    if (running) pause();
    else start();
  });

  // Меняем подпись правого таймера на соответствующую новой логике.
  const rightLabel = document.querySelectorAll(".stat-label")[1];
  if (rightLabel) rightLabel.textContent = "ПОСЛЕ ALGA";

  updateTimers();
})();
