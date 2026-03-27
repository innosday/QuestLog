# 🛡️ Project: QuestLog (퀘스트로그) - "Slay Your Day"

> **"당신의 하루를 사냥하고, 전설적인 장비를 획득하라."**
> 일상의 할 일을 '몬스터'로 변환하여 사냥하는 쾌감과 성취감을 주는 AI 기반 게이미피케이션 일정 관리 서비스입니다.

---

## 📝 1. Product Requirement Document (PRD)

### 1.1 서비스 개요
- **서비스명:** QuestLog (퀘스트로그)
- **핵심 컨셉:** 할 일 = 몬스터 사냥. AI가 할 일의 난이도를 분석하여 몬스터의 등급과 레벨을 결정하고, 처치(완료) 시 전리품(무기)을 획득하는 RPG 시스템.
- **핵심 가치:** 일상 관리의 몰입도 극대화, 장비 수집을 통한 성취감, AI 기반의 객관적 난이도 측정.

### 1.2 핵심 기능
1. **AI 몬스터 생성:** 유저가 할 일을 입력하면 AI가 분석하여 **등급(Common~Legendary)**과 **레벨**을 부여하고 적절한 몬스터 이미지/이름을 생성.
2. **몬스터 사냥 (Quest Clear):** 할 일을 완료(인증)하면 몬스터를 처치한 것으로 간주. 경험치와 골드, 그리고 **확률적 무기 드랍**.
3. **인벤토리 및 장비 시스템:** 획득한 무기를 장착하여 캐릭터의 스탯을 강화. 장착 시 퀘스트 완료 점수에 추가 보너스 지급.
4. **유저 성장:** 5대 스탯(STR, INT, DEX, CHA, ECO) 기반의 레벨업 시스템.
5. **검증 시스템:** 위치 인증(GPS) 및 사진 인증을 통해 사냥 성공 여부 판별.

### 1.3 RPG 카테고리 (몬스터 속성)
| 카테고리 | 매칭 스탯 | 몬스터 테마 예시 |
| :--- | :---: | :--- |
| **[STR] 체력** | 힘 | 야수, 골렘 (운동, 육체 노동) |
| **[INT] 지식** | 지능 | 마법사, 고대 서적 (공부, 코딩) |
| **[DEX] 기술** | 민첩 | 암살자, 기계 장치 (작업, 연습) |
| **[CHA] 매력** | 매력 | 서큐버스, 요정 (사교, 모임) |
| **[ECO] 환경** | 의지 | 슬라임, 정령 (청소, 환경 보호) |

---

## 🛠️ 2. Project Prerequisites & Architecture (PRE)

### 2.1 기술 스택
- **Frontend:** React (Vite), TypeScript, Tailwind CSS, Framer Motion
- **Backend/DB:** Firebase (Auth, Firestore, Storage)
- **AI Integration:** OpenAI API 또는 Google Gemini API (난이도 분석 및 몬스터 생성)
- **State:** Zustand (유저 정보, 인벤토리, 현재 장비 상태 관리)

### 2.2 데이터 구조 (Firestore)
- **`users`:** `{ uid, nickname, stats, totalScore, inventory: [itemId...], equippedWeaponId }`
- **`monsters` (Quests):** `{ mid, authorId, title, aiAnalysis: {grade, level, type}, status: 'alive'|'slain', lootDropped: bool }`
- **`items` (Weapons):** `{ itemId, name, grade, statBonus: {type, value}, imageURL }`

---

## 📏 3. Project Rules (RULE)

### 3.1 AI 판정 규칙
- **난이도 측정:** 입력된 텍스트의 복잡도, 예상 소요 시간, 중요도를 기반으로 등급 결정.
- **등급 체계:** Common (10pts) < Uncommon (30) < Rare (100) < Epic (500) < Legendary (2000).

### 3.2 전투 및 드랍 규칙
- **사냥 성공:** 위치/사진 인증 완료 시 즉시 보상 지급 및 무기 드랍 주사위 실행.
- **무기 장착:** 한 번에 하나의 무기만 장착 가능. 장착된 무기의 보너스 수치는 퀘스트 완료 시 최종 점수에 합산.

---

## 🚀 4. Implementation Tasks (TASK)

### Phase 1: 기반 시스템 및 AI 연동 (Step 1)
- [x] Vite + TS + Tailwind + Firebase 초기화
- [x] **QuestLog 전용 다크 RPG 테마 UI 구축**
- [ ] **AI 난이도 분석 API 연동** (텍스트 입력 -> 등급/레벨 반환)

### Phase 2: 몬스터(퀘스트) 사냥 시스템 (Step 2)
- [x] 캘린더 대시보드 및 몬스터 목록 UI
- [x] 몬스터 생성(퀘스트 등록) 모달 구현
- [x] **몬스터 사냥(완료) 처리 및 위치/사진 인증 연동**

### Phase 3: 장비 및 인벤토리 (Step 3)
- [ ] **무기(아이템) 데이터베이스 구축**
- [ ] **전리품 드랍 시스템 구현** (사냥 성공 시 랜덤 아이템 획득)
- [ ] **장비창 UI 및 인벤토리 관리 기능 개발**

### Phase 4: 소셜 및 경쟁 (Step 4)
- [ ] 실시간 전역 랭킹 보드 (전투력/사냥 횟수 기반)
- [ ] 친구의 최근 사냥 기록(피드) 및 축하하기
- [ ] **파티 레이드 (팀 퀘스트) 시스템**

### Phase 5: 최종 연출 (Step 5)
- [ ] **몬스터 처치 시 타격감 있는 애니메이션/이펙트 추가**
- [ ] 등급별 화려한 무기 일러스트 적용
- [ ] 레벨업 및 전설 아이템 획득 시 전역 알림 효과