# 🛡️ QuestLog (퀘스트로그)

> **"당신의 하루를 기록하고, 당신의 스탯을 증명하라."**
> 일상의 할 일을 RPG 퀘스트로 변환하여 성취감과 재미를 주는 게이미피케이션 일정 관리 서비스입니다.

## 🚀 주요 기능
- **유저 시스템:** Firebase Auth 기반 Google 로그인 및 개인별 스탯 관리.
- **퀘스트 시스템:** 캘린더 기반의 퀘스트 관리 및 난이도별 점수 획득.
- **검증 시스템:** 
  - **위치 인증:** 현재 위치와 퀘스트 지정 위치 비교 (200m 이내).
  - **사진 인증:** 완료 증거 사진 업로드 및 저장.
- **게이미피케이션:** 레벨업 시스템 및 카테고리별 스탯 성장.

## 📊 RPG 시스템 가이드

### 1. 카테고리 및 매칭 스탯
| 카테고리 | 매칭 스탯 | 예시 활동 |
| :--- | :---: | :--- |
| **[STR] 체력** | 힘 | 운동, 산책, 체육관 방문 |
| **[INT] 지식** | 지능 | 코딩, 공부, 독서, 뉴스 읽기 |
| **[DEX] 기술** | 민첩 | 3D 모델링, 악기 연주, 프로젝트 작업 |
| **[CHA] 매력** | 매력 | 모임 참여, 친구 만남, 봉사활동 |
| **[ECO] 환경** | 의지 | 분리수거, 청소, 텀블러 사용 |

### 2. 난이도별 보상 (EXP)
| 난이도 | 획득 점수 | 비고 |
| :--- | :---: | :--- |
| **Common** | 10 pts | 일상적인 소소한 일 |
| **Uncommon** | 30 pts | 약간의 노력이 필요한 일 |
| **Rare** | 100 pts | 집중과 시간이 필요한 과제 |
| **Epic** | 500 pts | 주간/월간 주요 목표 |
| **Legendary** | 2000 pts | 거대한 성취 (프로젝트 완료 등) |

## 🛠️ 기술 스택
- **Frontend:** React, TypeScript, Tailwind CSS
- **Backend/DB:** Firebase (Auth, Firestore, Storage)
- **AI Engine:** Google Gemini (Custom Versioning)
  - **Main Model:** `gemini-3-flash-preview` (Summoning, Oracle, Vision)
  - **Sub Model:** `gemini-2.5-flash` (Fallback)
- **State:** Zustand
- **Icons:** Lucide React
- **UI:** React Calendar, Framer Motion

## ⚠️ AI 개발 준수 사항 (Strict Mandate)
이 프로젝트에 참여하는 모든 AI 에이전트는 다음 규칙을 반드시 준수해야 합니다:
1. **모델 버전 고정:** 절대 존재하지 않는 모델 버전(1.5, 2.0 등)을 사용하거나 제안하지 마십시오.
2. **허용된 모델:** 오직 `gemini-3-flash-preview`와 `gemini-2.5-flash`만 사용 가능합니다.
3. **코드 수정 금지:** `aiService.ts` 내의 모델 명칭을 위 허용된 모델 이외의 것으로 변경하는 행위는 엄격히 금지됩니다.

## ⚙️ 설정 방법
1. `.env.example` 파일을 복사하여 `.env` 파일을 생성합니다.
2. Firebase 프로젝트 설정에서 API 키들을 채워넣습니다.
3. `npm install` 후 `npm run dev`로 실행합니다.
