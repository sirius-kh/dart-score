// Web Audio API-аар үүсгэсэн дууны эффектүүд (файл хэрэггүй).
// Бүх дуу хэрэглэгчийн товшилт (gesture)-ийн дараа дуудагдах тул AudioContext зөвшөөрөгдөнө.

let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    // iOS: дуугүй (silent) товчтой үед ч Web Audio сонсогдох (Safari 17+)
    const session = (navigator as unknown as { audioSession?: { type: string } }).audioSession;
    if (session) session.type = "playback";
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

/** Нэг богино аялгуу тоглуулах */
function tone(
  c: AudioContext,
  freq: number,
  startAt: number,
  duration: number,
  type: OscillatorType = "sine",
  peak = 0.18,
) {
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  // Зөөлөн нэвтрэлт/гаралт (click сэргийлэх)
  gain.gain.setValueAtTime(0, startAt);
  gain.gain.linearRampToValueAtTime(peak, startAt + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);
  osc.connect(gain).connect(c.destination);
  osc.start(startAt);
  osc.stop(startAt + duration + 0.02);
}

/** Энгийн оноо бүртгэх — нэг тод "бип" */
export function playScore() {
  const c = getCtx();
  if (!c) return;
  tone(c, 660, c.currentTime, 0.12, "triangle");
}

/** Bust — намхан, буурах "буззер" */
export function playBust() {
  const c = getCtx();
  if (!c) return;
  const t = c.currentTime;
  tone(c, 200, t, 0.18, "sawtooth", 0.16);
  tone(c, 150, t + 0.12, 0.22, "sawtooth", 0.16);
}

/** Тусгай нэрээр дуудах оноонууд (тоо → дуудах үг) */
const SPECIAL_SCORE_NAMES: Record<number, string> = {
  26: "Алдар",
};

let cachedMaleVoice: SpeechSynthesisVoice | null = null;
let voicesWarmed = false;

/** Хоолойнууд async ачаалагддаг тул нэг удаа listener бүртгэж урьдчилан сонгоно */
function warmVoices(synth: SpeechSynthesis) {
  if (voicesWarmed) return;
  voicesWarmed = true;
  getMaleVoice(synth);
  synth.addEventListener?.("voiceschanged", () => {
    cachedMaleVoice = null;
    getMaleVoice(synth);
  });
}

/**
 * Тоог унших хоолой: монгол хоолой байвал түүнийг, үгүй бол англи (боломжтой бол эрэгтэй).
 * Утсанд олон хэлний хоолой байдаг тул хэлийг шүүхгүй бол санамсаргүй хэлээр уншиж эсвэл
 * огт дуугардаггүй байсан.
 */
function getMaleVoice(synth: SpeechSynthesis): SpeechSynthesisVoice | null {
  if (cachedMaleVoice) return cachedMaleVoice;
  const voices = synth.getVoices();
  if (!voices.length) return null; // хараахан ачаалагдаагүй

  const name = (v: SpeechSynthesisVoice) => v.name.toLowerCase();
  const female =
    /female|woman|zira|susan|samantha|victoria|karen|moira|tessa|fiona|hazel|catherine|english female/;
  const male =
    /male|\bman\b|david|daniel|alex|fred|tom|george|james|mark|paul|english male/;

  const mongolian = voices.filter((v) => v.lang.toLowerCase().startsWith("mn"));
  const english = voices.filter((v) => v.lang.toLowerCase().startsWith("en"));
  const pool = mongolian.length ? mongolian : english.length ? english : voices;

  cachedMaleVoice =
    pool.find((v) => male.test(name(v)) && !female.test(name(v))) ??
    pool.find((v) => !female.test(name(v))) ??
    pool.find((v) => v.default) ??
    pool[0] ??
    null;
  return cachedMaleVoice;
}

/**
 * Оруулсан оноог дуугаар хэлэх (Web Speech API / TTS).
 * Тусгай оноог нэрээр (ж: 26 → "Алдар"), бусдыг тоогоор уншина.
 * Монгол хоолой байхгүй бол браузерийн өгөгдмөл хоолойгоор уншина.
 */
export function speakScore(n: number) {
  if (typeof window === "undefined") return;
  const synth = window.speechSynthesis;
  if (!synth) return;
  warmVoices(synth);
  const text = SPECIAL_SCORE_NAMES[n] ?? String(n);
  const u = new SpeechSynthesisUtterance(text);
  const voice = getMaleVoice(synth);
  // Хэлийг хоолойтой нь тааруулна: Android-д суугаагүй хэл (mn-MN) заавал юу ч уншдаггүй
  if (voice) {
    u.voice = voice;
    u.lang = voice.lang;
  } else {
    u.lang = "en-US";
  }
  // 100-аас дээш оноог хамгийн чанга (API дээд хязгаар 1.0), онцолсон өнгөөр дуудна.
  // Бусад оноог намсгаснаар >100 оноо хамгийн тод ялгарна.
  // Эрэгтэй өнгөтэй болгохын тулд pitch-ийг намсгана.
  const loud = n > 100;
  u.volume = loud ? 1 : 0.45;
  u.rate = loud ? 0.85 : 1;
  u.pitch = loud ? 0.75 : 0.85;
  // Өмнөх дуудлагыг таслана. Утасны браузерт cancel()-ийн шууд дараах speak() алга болдог
  // тул зөвхөн уншиж байгаа үед л таслана.
  if (synth.speaking || synth.pending) synth.cancel();
  // Android Chrome-д синтез "pause" төлөвт гацах тохиолдол байдаг
  if (synth.paused) synth.resume();
  synth.speak(u);
}

/** Ялалт — өгсөх баяр хөөртэй аялгуу */
export function playWin() {
  const c = getCtx();
  if (!c) return;
  const t = c.currentTime;
  // C5 - E5 - G5 - C6 арпеджио
  [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
    tone(c, f, t + i * 0.12, 0.2, "triangle", 0.2);
  });
}
