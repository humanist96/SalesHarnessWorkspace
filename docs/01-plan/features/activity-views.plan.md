# Plan: 영업활동 캘린더 + 칸반보드 뷰

## Context

현재 영업활동은 시간순 리스트로만 조회 가능. 영업직원이 일정 흐름이나 영업 단계별 진행 상황을
직관적으로 파악하기 어려움.

**목표**: 캘린더 뷰(일정 기반) + 칸반보드 뷰(영업 단계 기반)를 추가하여
세련되고 고급스러운 다중 뷰 활동 관리 제공

## 기술 스택 (이미 설치됨)

- `motion` v12 — 페이지 전환, 카드 등장, 드래그 애니메이션
- `@dnd-kit/core` + `@dnd-kit/sortable` — 칸반 드래그앤드롭
- `tw-animate-css` — Tailwind 애니메이션 유틸
- glass-card 스타일 + shimmer/float 커스텀 애니메이션
- Tabs 컴포넌트 (line variant)

## 디자인 컨셉: "Aurora Glass"

### 공통 디자인 언어
- **Glassmorphism**: 반투명 카드 + backdrop-blur + 미세한 보더 glow
- **Stagger 등장**: 카드들이 0.05s 간격으로 순차 페이드인 (blur → clear)
- **마이크로 인터랙션**: hover시 카드 살짝 올라옴 + glow, 클릭시 scale
- **컬러 코딩**: intent별 좌측 accent line (gold=계약갱신, emerald=신규, violet=크로스셀)

---

## 1. 뷰 전환 탭 (공통)

활동 페이지 상단에 3개 뷰 탭:
```
[📋 리스트]  [📅 캘린더]  [📊 칸반보드]
```
- 탭 전환 시 `AnimatePresence`로 뷰가 부드럽게 교체 (opacity + y)
- 현재 뷰 상태는 URL searchParam으로 유지 (`?view=calendar`)

---

## 2. 캘린더 뷰

### 레이아웃
```
┌─────────────────────────────────────────────────────────┐
│  ◀  2024년 3월                                    ▶    │
│  월    화    수    목    금    토    일                  │
├──────┬──────┬──────┬──────┬──────┬──────┬──────┤
│      │      │      │      │  1   │  2   │  3   │
│      │      │      │      │      │      │      │
├──────┼──────┼──────┼──────┼──────┼──────┼──────┤
│  4   │  5   │  6   │  7   │  8   │  9   │  10  │
│      │ ●●●  │ ●    │      │ ●●   │      │      │
│      │[IBK] │[중국] │      │[다올] │      │      │
│      │[다올] │      │      │      │      │      │
├──────┼──────┼──────┼──────┼──────┼──────┼──────┤
│  ...                                              │
└───────────────────────────────────────────────────┘
```

### 셀 디자인
- 활동 있는 날: intent 색상 도트 표시 (최대 3개)
- 호버 시: 해당 날 활동 요약 팝오버 (glass-card)
- 클릭 시: 해당 날 활동 목록을 하단에 슬라이드인 표시
- 오늘 날짜: gold ring + subtle glow
- 주말: 약간 어두운 배경

### 애니메이션
- 월 전환: 좌/우 슬라이드 (direction-aware)
- 셀 호버: scale(1.05) + border glow
- 활동 도트: stagger 등장 (0.03s 간격)
- 선택된 날: 하단 패널 spring 애니메이션으로 확장

---

## 3. 칸반보드 뷰

### 레이아웃 (영업 단계별 컬럼)
```
┌─ 탐색 ──────┐ ┌─ 니즈파악 ──┐ ┌─ 제안 ──────┐ ┌─ 협상 ──────┐ ┌─ 계약 ──────┐
│ 27건         │ │ 284건       │ │ 80건        │ │ 27건        │ │ 86건        │
│              │ │             │ │             │ │             │ │             │
│ ┌──────────┐ │ │ ┌─────────┐ │ │ ┌─────────┐ │ │ ┌─────────┐ │ │ ┌─────────┐ │
│ │IBK       │ │ │ │중국은행  │ │ │ │다올      │ │ │ │IBK      │ │ │ │IPS      │ │
│ │회선증속   │ │ │ │재계약   │ │ │ │SOR연동  │ │ │ │인프라   │ │ │ │외국환   │ │
│ │2일 전    │ │ │ │5일 전   │ │ │ │1주 전   │ │ │ │3일 전   │ │ │ │어제     │ │
│ └──────────┘ │ │ └─────────┘ │ │ └─────────┘ │ │ └─────────┘ │ │ └─────────┘ │
│ ┌──────────┐ │ │ ┌─────────┐ │ │             │ │             │ │             │
│ │...       │ │ │ │...      │ │ │             │ │             │ │             │
│ └──────────┘ │ │ └─────────┘ │ │             │ │             │ │             │
└──────────────┘ └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘
```

### 컬럼 디자인
- 헤더: stage 라벨 + 건수 뱃지 + 컬럼 상단 accent gradient line
- 컬럼 색상: 각 stage별 테마 컬러 (탐색=slate, 니즈=blue, 제안=violet, 협상=amber, 계약=emerald)
- 스크롤: 각 컬럼 독립 스크롤 (max-h 고정)

### 카드 디자인
- 좌측 3px accent line (intent 색상)
- 고객사명 (bold) + 요약 1줄
- intent 뱃지 + 상대 시간
- 호버: translateY(-2px) + glow shadow

### 드래그앤드롭
- DnD Kit 사용 (이미 설치됨)
- 카드를 다른 stage 컬럼으로 드래그 → stage 분류 업데이트
- 드래그 중: 카드 scale(1.05) + 그림자 강화 + 원래 위치에 dashed placeholder
- 드롭 시: spring 애니메이션으로 착지

### 애니메이션
- 컬럼 등장: left→right stagger (0.1s 간격)
- 카드 등장: 컬럼 내 stagger (0.05s 간격)
- 드래그 오버: 컬럼 배경 살짝 밝아짐 + border highlight
- 카드 이동: layout 애니메이션 (position 자동 보간)

---

## 구현 파일

| 파일 | 유형 | 설명 |
|------|------|------|
| `src/features/activities/components/ActivityViewTabs.tsx` | 신규 | 리스트/캘린더/칸반 탭 전환 |
| `src/features/activities/components/CalendarView.tsx` | 신규 | 월간 캘린더 뷰 |
| `src/features/activities/components/CalendarDayCell.tsx` | 신규 | 개별 날짜 셀 |
| `src/features/activities/components/KanbanView.tsx` | 신규 | 칸반보드 뷰 |
| `src/features/activities/components/KanbanColumn.tsx` | 신규 | 단계별 컬럼 |
| `src/features/activities/components/KanbanCard.tsx` | 신규 | 드래그 가능한 활동 카드 |
| `src/app/(dashboard)/activities/page.tsx` | 수정 | 탭 뷰 통합 |
