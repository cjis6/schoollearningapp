// Simple global progress system using localStorage
const PROGRESS_KEY = "studyverse_progress_v1";

function loadProgress() {
  const raw = localStorage.getItem(PROGRESS_KEY);
  if (!raw) {
    return { xp: 0, level: 1, streak: 0, lastVisit: null };
  }
  try {
    return JSON.parse(raw);
  } catch {
    return { xp: 0, level: 1, streak: 0, lastVisit: null };
  }
}

function saveProgress(progress) {
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
}

function updateStreak(progress) {
  const today = new Date().toDateString();
  if (!progress.lastVisit) {
    progress.streak = 1;
  } else if (progress.lastVisit !== today) {
    const last = new Date(progress.lastVisit);
    const diffDays = Math.round(
      (new Date(today) - last) / (1000 * 60 * 60 * 24)
    );
    if (diffDays === 1) {
      progress.streak += 1;
    } else if (diffDays > 1) {
      progress.streak = 1;
    }
  }
  progress.lastVisit = today;
}

function addXP(progress, amount) {
  progress.xp += amount;
  while (progress.xp >= 100) {
    progress.xp -= 100;
    progress.level += 1;
  }
}

function renderProfile(progress) {
  const levelLabel = document.getElementById("levelLabel");
  const xpLabel = document.getElementById("xpLabel");
  const streakLabel = document.getElementById("streakLabel");
  const levelValue = document.getElementById("levelValue");
  const xpValue = document.getElementById("xpValue");
  const xpFill = document.getElementById("xpFill");
  const streakValue = document.getElementById("streakValue");

  if (levelLabel) levelLabel.textContent = `Lv. ${progress.level}`;
  if (xpLabel) xpLabel.textContent = `${progress.xp} XP`;
  if (streakLabel) streakLabel.textContent = `🔥 ${progress.streak}`;

  if (levelValue) levelValue.textContent = progress.level;
  if (xpValue) xpValue.textContent = `${progress.xp} / 100`;
  if (xpFill) xpFill.style.width = `${(progress.xp / 100) * 100}%`;
  if (streakValue) streakValue.textContent = `${progress.streak} days`;
}

function scrollToSubjects() {
  const el = document.getElementById("subjectsSection");
  if (el) el.scrollIntoView({ behavior: "smooth" });
}

// Quiz logic for subject pages
async function initSubjectQuiz() {
  const body = document.body;
  const subject = body.getAttribute("data-subject");
  if (!subject) return;

  const startBtn = document.getElementById("startQuizBtn");
  const quizSection = document.getElementById("quizSection");
  const quizCard = document.getElementById("quizCard");
  const quizResult = document.getElementById("quizResult");
  const questionCounter = document.getElementById("questionCounter");
  const questionText = document.getElementById("questionText");
  const optionsContainer = document.getElementById("optionsContainer");
  const nextQuestionBtn = document.getElementById("nextQuestionBtn");
  const feedback = document.getElementById("feedback");
  const resultText = document.getElementById("resultText");
  const xpEarnedText = document.getElementById("xpEarnedText");
  const retryQuizBtn = document.getElementById("retryQuizBtn");
  const subjectLabel = document.getElementById("subjectLabel");

  if (!startBtn || !quizCard) return;

  if (subjectLabel) {
    subjectLabel.textContent =
      subject.charAt(0).toUpperCase() + subject.slice(1);
  }

  let questions = [];
  let currentIndex = 0;
  let correctCount = 0;
  let selected = null;

  async function loadQuestions() {
    const res = await fetch(`data/${subject}.json`);
    questions = await res.json();
  }

  function renderQuestion() {
    const q = questions[currentIndex];
    questionCounter.textContent = `Question ${currentIndex + 1}/${questions.length}`;
    questionText.textContent = q.question;
    optionsContainer.innerHTML = "";
    feedback.textContent = "";
    nextQuestionBtn.disabled = true;
    selected = null;

    q.options.forEach((opt, idx) => {
      const btn = document.createElement("button");
      btn.className = "option-btn";
      btn.textContent = opt;
      btn.addEventListener("click", () => {
        if (selected) return;
        selected = btn;
        const isCorrect = idx === q.answerIndex;
        if (isCorrect) {
          btn.classList.add("correct");
          feedback.textContent = "Nice! That's correct.";
          correctCount++;
        } else {
          btn.classList.add("incorrect");
          feedback.textContent = "Not quite. Check the explanation.";
        }
        nextQuestionBtn.disabled = false;
      });
      optionsContainer.appendChild(btn);
    });
  }

  function showResults() {
    quizCard.classList.add("hidden");
    quizResult.classList.remove("hidden");

    const scorePercent = Math.round((correctCount / questions.length) * 100);
    resultText.textContent = `You got ${correctCount} out of ${questions.length} correct (${scorePercent}%).`;

    const xpEarned = correctCount * 10;
    xpEarnedText.textContent = `You earned +${xpEarned} XP for this quiz.`;

    let progress = loadProgress();
    addXP(progress, xpEarned);
    updateStreak(progress);
    saveProgress(progress);
    renderProfile(progress);
  }

  startBtn.addEventListener("click", async () => {
    startBtn.disabled = true;
    quizCard.classList.remove("hidden");
    quizResult.classList.add("hidden");
    currentIndex = 0;
    correctCount = 0;
    await loadQuestions();
    renderQuestion();
  });

  nextQuestionBtn.addEventListener("click", () => {
    currentIndex++;
    if (currentIndex >= questions.length) {
      showResults();
    } else {
      renderQuestion();
    }
  });

  if (retryQuizBtn) {
    retryQuizBtn.addEventListener("click", () => {
      quizResult.classList.add("hidden");
      quizCard.classList.remove("hidden");
      currentIndex = 0;
      correctCount = 0;
      renderQuestion();
    });
  }
}

// Init on load
document.addEventListener("DOMContentLoaded", () => {
  let progress = loadProgress();
  updateStreak(progress);
  saveProgress(progress);
  renderProfile(progress);
  initSubjectQuiz();
});

