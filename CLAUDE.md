@AGENTS.md

# CLAUDE.md

Энэ файл нь энэ репозиторид ажиллах үед Claude Code (claude.ai/code)-д чиглүүлэг өгнө.

## Төслийн тойм

**Дартсын оноо бодогч** — X01 (301/501/701) горимын дартсын тоглоомын оноог бодох вэб
апп. Олон leg-тэй тоглоом, double-out, хаалтын зөвлөмж, сум тус бүрээр оруулах горим,
дууссан тоглоомын түүх ба тоглогчийн статистиктай. Бүх логик клиент талд ажилладаг, backend/өгөгдлийн сан байхгүй. UI монгол хэл дээр.

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
`setup → playing → finished`, дээр нь статистикийн дэлгэц (`showStats`, хадгалагдахгүй
локал state). Бүх төлөв `useLocalStorage` hook-оор `localStorage`-д
автоматаар хадгалагдана (refresh хийсэн ч тоглоом хэвээр).

### Файлын бүтэц

| Зам | Үүрэг |
|-----|-------|
| `app/page.tsx` | Үндсэн orchestrator — үе шатыг сэлгэх, бүх handler, дуу тоглуулах |
| `app/layout.tsx` | `lang="mn"`, харанхуй сэдэв, ар талын дартсын самбар зураг |
| `app/globals.css` | Tailwind v4 import, тогтмол харанхуй сэдэв |
| `lib/types.ts` | `Player`, `GameState`, `StartingScore` (301\|501\|701), `GamePhase`, `Dart`, `InputMode` |
| `lib/x01.ts` | **Цэвэр тоглоомын логик** (UI-гүй) |
| `lib/checkout.ts` | Double-out хаалтын зөвлөмж (`checkoutRoute`, `checkoutHint`), 2–170 урьдчилан тооцоолсон |
| `lib/history.ts` | Дууссан тоглоомын бичлэг (`buildGameRecord`, `addRecord`, leg тус бүрийн `LegRecord`) ба нэгтгэсэн статистик (`aggregateStats`) |
| `lib/stats.ts` | Dashboard-ын тооцоо: шүүлтүүрээр (`StatsFilter`: тоглогч, хугацаа, эхлэх оноо) `summarize`, `trend`, өмнөх үетэй харьцуулах `changePct` |
| `lib/colors.ts` | Тоглогчийн өнгөний палитр (`PLAYER_COLORS`, `playerColor`) |
| `lib/sounds.ts` | Web Audio эффект + TTS дуу хэлэлт |
| `hooks/useLocalStorage.ts` | SSR-safe localStorage синк hook (`[value, setValue, hydrated]`) |
| `hooks/useWakeLock.ts` | Тоглоомын үед дэлгэц унтраахгүй (Screen Wake Lock — зөвхөн HTTPS/localhost) |
| `components/SetupScreen.tsx` | Эхлэх оноо + тоглогч сонгох; сүүлийн тоглоомын тохиргоогоор урьдчилан бөглөж, сүүлд тоглосон нэрсийг санал болгоно |
| `components/GameScreen.tsx` | Тоглоомын дэлгэц (картууд + оноо оруулах + дуу товч) |
| `components/ScoreInput.tsx` | "Нийт оноо" горим: апп доторх тоон товчлуур (системийн гар гаргахгүй; компьютерт гараас бичнэ) + түргэн товчнууд + Undo |
| `components/DartPad.tsx` | "Сум бүрээр" горим: S/D/T + 1–20/25/Алдсан товчлуур; win/bust эсвэл 3 сумаар ээлж дуусна |
| `components/FlashOverlay.tsx` | 180 / bust / leg хожих үед дэлгэцийн голд түр гарах тэмдэглэгээ (`onAnimationEnd`-ээр алга болно) |
| `components/StatsScreen.tsx` | DartCounter маягийн dashboard: шүүлтүүр, гол үзүүлэлт + өөрчлөлтийн %, графикууд, тоглогчдын хүснэгт, тоглоомын түүх |
| `components/charts/*` | `TrendChart` (дундаж/эхний 9-ийн шугам), `DistributionChart` (ээлжийн онооны мужууд) — гар аргаар SVG, hover tooltip |
| `components/PlayerCard.tsx` | Нэг тоглогчийн карт (өнгөт) |
| `components/GameOverScreen.tsx` | Ялагч + статистик + дахин эхлэх |
| `public/dartboard.svg` | Ар талын дартсын самбар зураг (кодоор generate хийсэн) |

### localStorage түлхүүрүүд

- `dart-score:game:v4` — `GameState` (идэвхтэй тоглоом). Бүтэц өөрчлөгдвөл хувилбарыг ахиулна.
- `dart-score:history` — `GameRecord[]` (дууссан тоглоомууд, шинэ нь эхэнд, дээд тал нь 200)
- `dart-score:sound` — дуу асаалттай эсэх (boolean)
- `dart-score:input-mode` — `"total" | "darts"`
- `dart-score:stats-filter` — статистикийн шүүлтүүр (`StatsFilter`)

## Тоглоомын дүрэм (`lib/x01.ts`)

X01: тоглогч бүр эхлэх оноогоор (301/501/701) эхэлж тэг рүү бууруулна. `legsToWin` leg
эхэлж хожсон нь ялна; leg бүрд эхлэгч ээлжлэн солигдоно.

Оруулах хоёр горим:
- **Нийт оноо** — `applyTurn(state, scored)`: ээлжийн нийлбэр (0–180), 3 сум гэж тооцно.
  `evaluateTurn`: 0 → win, < 0 эсвэл (double-out үед) 1 → bust. Хаасан сум хос байсан
  эсэхийг шалгах боломжгүй.
- **Сум бүрээр** — `applyDarts(state, darts)`: `evaluateDarts` сумнуудыг дарааллаар нь
  үнэлж, win/bust болмогц зогсоно (1–3 сум). Double-out үед сүүлийн сум заавал хос
  (`D1–D20`, Bull) — үгүй бол bust. Win/bust биш бол яг 3 сум шаардана.

Бүртгэл: ээлж бүрд `turns` (оноо, bust = 0), `turnDarts` (сумны тоо), `turnAttempts`
(хос руу шидсэн сум — `isOneDartFinish` үлдэгдэл дээр шидсэн сум; "Нийт оноо" горим болон
straight-out үед `null`) зэрэгцээ хадгалагдана; дууссан leg-ууд `legTurns` / `legTurnDarts` /
`legTurnAttempts` / `legDarts`-д архивлагдана. Шинэ зэрэгцээ массив нэмбэл `clonePlayers`,
`commitTurn`, `undoLastTurn`-ийн бүх салбарт оруулах ёстой.
Дундаж = нийт оноо / нийт сум × 3 (`averageOf`).

- `undoLastTurn(state)` — нэг ээлж буцаана: тоглоом дууссаны дараа ч, leg-ийн хил дээр ч
  (өмнөх leg-ийг сэргээж, хожсон ээлжийг нь буцаана).

## Түүх (`lib/history.ts`)

`app/page.tsx`-ийн `commit` нь шинэ төлөв `finished` болмогц `buildGameRecord`-оор түүхэнд
бичнэ (`GameState.id`-аар upsert). Дууссан тоглоомыг undo хийвэл түүхээс хасагдана.
Тоглогчийг тоглоом хооронд **нэрээр** нь нэгтгэнэ. `PlayerRecord.legs` нь хуучин бичлэгт
байхгүй — тэр үед эхний 9, хаалтын хувь, шилдэг leg-д тооцогдохгүй (дундаж тооцогдоно).

Үзүүлэлтүүд (`lib/stats.ts`): эхний 9 = leg бүрийн эхний 3 ээлж; хаалтын хувь = хаасан leg /
хос руу шидсэн сум (зөвхөн бүртгэгдсэн ээлжүүдээс); шилдэг leg = хаасан leg-ийн хамгийн
цөөн сум.

Чухал: логик функцууд **цэвэр** (side-effect-гүй), тестлэх/өргөтгөхөд хялбар. Шинэ дүрэм
нэмэхдээ энд төвлөрүүлнэ.

## Дуу (`lib/sounds.ts`)

Бүх дуу хэрэглэгчийн товшилтын дараа дуудагдана (browser autoplay бодлого). `app/page.tsx`-ийн
`handleScore` / `handleDarts`-д оноо хэрэглэхээс өмнө `evaluateTurn` / `evaluateDarts`-аар
үр дүнг тооцоолж дуу сонгоно.

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
- **SSR-safe:** `useLocalStorage` нь `useSyncExternalStore` дээр суурилсан — server/hydration
  render-д default, дараа нь localStorage-ийн утга (`hydrated` flag-аар "Уншиж байна…").
  `defaultValue`-г модулийн тогтмол болгож дамжуул (render бүрд шинэ объект бүү үүсгэ).
- **Палитр (DartCounter маяг):** `app/globals.css`-ийн `@theme`-д `neutral-*`-ийг хар хөх рүү
  дахин тодорхойлсон, `brand-*` (улбар шар) нь үндсэн товч/сонголтын өнгө. Шинэ компонентод
  emerald биш `brand-*` хэрэглэ; emerald/red зөвхөн сайн/муу утга (Delta) болон тоглогчийн өнгөнд.
- **График:** өнгө `#009966` (дундаж) / `#e17100` (эхний 9) — харанхуй дэвсгэр дээр dataviz
  validator-оор шалгасан. Хоёр цуваатай бол тайлбар + шугамын үзүүрт утга заавал.
- **Анимэйшн:** `app/globals.css`-ийн `@theme`-д `animate-shake` / `animate-pop` / `animate-flash`.
  Дахин тоглуулахын тулд элементийн `key`-г солино (жишээ нь үлдэгдэл, ээлжийн тоо).
- **Tailwind v4 динамик класс:** `lib/colors.ts`-д класс нэрсийг бүтэн литералаар бичсэн
  (purge хийгдэхгүй) — энэ хэвийг хадгал.
