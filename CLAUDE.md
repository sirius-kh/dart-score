@AGENTS.md

# CLAUDE.md

Энэ файл нь энэ репозиторид ажиллах үед Claude Code (claude.ai/code)-д чиглүүлэг өгнө.

## Төслийн тойм

**Дартсын оноо бодогч** — X01 (301/501/701) горимын дартсын тоглоомын оноог бодох вэб
апп. Бүх логик клиент талд ажилладаг, backend/өгөгдлийн сан байхгүй. UI монгол хэл дээр.

- **Framework:** Next.js 16.2.9 (App Router, Turbopack)
- **Хэл:** TypeScript
- **Загвар:** Tailwind CSS v4 (харанхуй сэдэв)
- **Хадгалалт:** зөвхөн браузерийн `localStorage`

## Командууд

```bash
npm run dev      # Хөгжүүлэлтийн сервер (http://localhost:3000)
npm run build    # Production build (TypeScript шалгалттай)
npm run start    # Build хийсний дараа production сервер
npm run lint     # ESLint
```

> Тэмдэглэл: тест runner суулгаагүй. Логикийг `lib/x01.ts`-ийн цэвэр функцуудаар нь
> Node-ийн type-stripping (`node file.mts`) эсвэл `npx tsx` ашиглан түр script-ээр шалгаж болно.

## Архитектур

Апп нь **нэг клиент компонент** (`app/page.tsx`) дотор гурван үе шаттай state machine:
`setup → playing → finished`. Бүх төлөв `useLocalStorage` hook-оор `localStorage`-д
автоматаар хадгалагдана (refresh хийсэн ч тоглоом хэвээр).

### Файлын бүтэц

| Зам | Үүрэг |
|-----|-------|
| `app/page.tsx` | Үндсэн orchestrator — үе шатыг сэлгэх, бүх handler, дуу тоглуулах |
| `app/layout.tsx` | `lang="mn"`, харанхуй сэдэв, ар талын дартсын самбар зураг |
| `app/globals.css` | Tailwind v4 import, тогтмол харанхуй сэдэв |
| `lib/types.ts` | `Player`, `GameState`, `StartingScore` (301\|501\|701), `GamePhase` |
| `lib/x01.ts` | **Цэвэр тоглоомын логик** (UI-гүй) |
| `lib/colors.ts` | Тоглогчийн өнгөний палитр (`PLAYER_COLORS`, `playerColor`) |
| `lib/sounds.ts` | Web Audio эффект + TTS дуу хэлэлт |
| `hooks/useLocalStorage.ts` | SSR-safe localStorage синк hook (`[value, setValue, hydrated]`) |
| `components/SetupScreen.tsx` | Эхлэх оноо + тоглогч сонгох |
| `components/GameScreen.tsx` | Тоглоомын дэлгэц (картууд + оноо оруулах + дуу товч) |
| `components/ScoreInput.tsx` | Оноо оруулах талбар + түргэн товчнууд + Undo |
| `components/PlayerCard.tsx` | Нэг тоглогчийн карт (өнгөт) |
| `components/GameOverScreen.tsx` | Ялагч + статистик + дахин эхлэх |
| `public/dartboard.svg` | Ар талын дартсын самбар зураг (кодоор generate хийсэн) |

### localStorage түлхүүрүүд

- `dart-score:game` — `GameState` (идэвхтэй тоглоом)
- `dart-score:sound` — дуу асаалттай эсэх (boolean)

## Тоглоомын дүрэм (`lib/x01.ts`)

X01: тоглогч бүр эхлэх оноогоор (301/501/701) эхэлж, ээлж бүрд **3 сумны нийт оноог**
(0–180) нэг утгаар оруулж тэг рүү буурдаг.

- `evaluateTurn(remaining, scored)` → `"win" | "bust" | "ok"`
  - `remaining - scored === 0` → **win**
  - `< 0` эсвэл `=== 1` → **bust** (оноо хэвээр, ээлж шилжинэ; double-out-ыг хатуу шалгахгүй)
  - бусад → **ok**
- `applyTurn(state, scored)` — ээлж хэрэглэж шинэ `GameState` буцаана (immutable). Bust
  ээлжийг `turns` массивт `0`-оор бүртгэнэ.
- `undoLastTurn(state)` — сүүлийн ээлжийг буцаана (ялалтын дараа ч).
- `isValidScore` (0–180 бүхэл тоо), `threeDartAverage`, `MAX_TURN_SCORE = 180`.

Чухал: логик функцууд **цэвэр** (side-effect-гүй), тестлэх/өргөтгөхөд хялбар. Шинэ дүрэм
нэмэхдээ энд төвлөрүүлнэ.

## Дуу (`lib/sounds.ts`)

Бүх дуу хэрэглэгчийн товшилтын дараа дуудагдана (browser autoplay бодлого). `app/page.tsx`-ийн
`handleScore`-д оноо хэрэглэхээс өмнө `evaluateTurn`-ээр үр дүнг тооцоолж дуу сонгоно.

- `speakScore(n)` — оруулсан оноог **TTS-ээр дуудна** (Web Speech API):
  - Тусгай нэр: `SPECIAL_SCORE_NAMES` map (одоо `26 → "Алдар"`)
  - **>100 оноог хамгийн чанга** (`volume=1`), бусдыг намуухан (`volume=0.45`)
  - **Эрэгтэй хоолой** сонгоно (`getMaleVoice`), `pitch` намссан
- `playBust()` / `playWin()` — Web Audio API-аар үүсгэсэн буззер / ялалтын арпеджио
- `playScore()` — энгийн бип (одоо `speakScore`-оор солигдсон, экспортод үлдсэн)
- 🔊/🔇 товч (`GameScreen`) дуу асаах/унтраах, `dart-score:sound`-д хадгалагдана

## Гол зарчмууд

- **Логик ба UI-г салгах:** тоглоомын дүрэм `lib/x01.ts`-д цэвэр функц, компонентууд зөвхөн харуулна.
- **Immutable state:** `GameState`-г шинэ объект буцааж шинэчилнэ.
- **Монгол UI:** бүх текст монгол хэл дээр.
- **SSR-safe:** `useLocalStorage` эхний render-д default өгч, hydration-ы дараа уншина
  (`hydrated` flag-аар "Уншиж байна…" харуулна).
- **Tailwind v4 динамик класс:** `lib/colors.ts`-д класс нэрсийг бүтэн литералаар бичсэн
  (purge хийгдэхгүй) — энэ хэвийг хадгал.
