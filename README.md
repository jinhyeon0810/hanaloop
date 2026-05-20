# Hanaloop PCF 전과정 대시보드

제품 탄소 발자국(PCF)의 **전과정(cradle-to-gate + transport) 데이터**를 시각화하는 인터랙티브 대시보드. 대상 제품: **CT-045 컴퓨터 화면**.

활동 데이터(원소재·가공 전기·출고 운송)를 입력 또는 Excel 임포트하면 배출계수와 매칭해 kgCO2e를 자동 산정하고, lifecycle 단계별 기여도와 시간 추이를 두 페르소나(실무자/경영자) 관점으로 시각화합니다.

자세한 요구사항은 [`docs/REQUIREMENTS.md`](./docs/REQUIREMENTS.md) 참고.

## 빠른 실행 (4단계)

> 사전 요구: Docker Desktop 실행 중

1. **클론 + 환경변수 + 의존성**
   ```sh
   git clone <repo-url> && cd hanaloop
   cp .env.example .env
   yarn install
   ```
2. **PostgreSQL 기동** (Docker Compose)
   ```sh
   yarn db:up
   ```
3. **DB 마이그레이션 + 시드** (활동 30건 + 계수 4건 자동 주입)
   ```sh
   yarn prisma migrate deploy && yarn prisma db seed
   ```
4. **앱 실행** (빌드 + 서버 기동 한 번에)
   ```sh
   yarn start
   ```
   → http://localhost:3000 에서 확인.

> 개발 중에는 `yarn dev`로 빠른 핫리로드 사용.

## 시스템 개요

### 스택
- **프레임워크:** Next.js 16 (App Router) · React 19 · TypeScript
- **데이터:** PostgreSQL · Prisma ORM
- **UI:** shadcn/ui · Tailwind v4 · Recharts
- **클라이언트 상태/요청:** TanStack Query · react-hook-form + Zod
- **인프라:** Docker Compose (로컬 DB) · Vercel (배포)

### 설계 결정 요약
- **인증 없음 — 페르소나는 URL 파라미터 (`?role=operator|executive`).** 과제 범위로 권한 제어 생략, 페르소나는 뷰 모드로 한정. 실 배포 시 RBAC 추가 필요.
- **Add only (CRUD 중 CR만 구현).** PCF는 회계와 유사한 감사 추적 도메인이라 활동 데이터의 임의 수정·삭제를 의도적으로 막음. 정정은 Excel 재임포트 + dedup으로 처리.
- **계수는 DB seed로만 관리.** 계수 편집 UI는 범위 밖. 스키마는 supersession 가능하도록 `valid_from`·`valid_to`·`source` 컬럼을 두지만 단일 버전으로 운영.
- **부분 성공 임포트.** Excel 임포트는 행 단위 검증 실패가 전체 파일을 막지 않음. Accepted/Duplicates/Rejected 3구역으로 결과 표시.

### 화면 구성
| 경로                 | 주 대상 페르소나 | 비고                                           |
| -------------------- | ---------------- | ---------------------------------------------- |
| `/`                  | executive        | KPI 4개 + 활동 유형별 누적 차트. operator는 데이터 품질 섹션 추가 노출 |
| `/activities`        | operator         | 활동 목록 + 필터. 양 페르소나 접근 가능        |
| `/activities/new`    | operator         | 활동 폼 입력. 인라인 검증                      |
| `/activities/import` | operator         | Excel/CSV 업로드 + 부분 성공 결과              |
| `/factors`           | 공통             | 배출계수 read-only 목록                        |

### 데이터 모델 (ERD 개요)
```
Product 1 ─── * Activity * ─── 1 EmissionFactor
                  │
                  └── 1 ImportJob (nullable)
```
- **Product:** 단일 row (CT-045)
- **Activity:** 일자, 유형, 설명, 량, 단위, 매칭된 factor_id, 캐시된 kgCO2e
- **EmissionFactor:** 유형, sub_category, 값, 단위, valid_from/valid_to, source (immutable)
- **ImportJob:** 업로드 파일 해시·일시·결과 카운트

상세 스키마는 `prisma/schema.prisma` 참고.

## 개발 환경

### 패키지 매니저
**yarn 전용.** npm/pnpm 명령은 사용하지 않습니다.

### 명령어
| 명령              | 용도                                  |
| ----------------- | ------------------------------------- |
| `yarn dev`        | 개발 서버 (핫리로드)                  |
| `yarn build`      | 프로덕션 빌드                         |
| `yarn start`      | 빌드 + 프로덕션 서버 실행 (한 번에)   |
| `yarn lint`       | ESLint                                |
| `yarn prisma migrate dev` | 로컬 DB 마이그레이션 + 자동 클라이언트 재생성 |
| `yarn prisma db seed`     | 시드 데이터 주입 (활동 30건 + 계수 4건)   |

### 환경 변수
`.env.local` (gitignored):
```
DATABASE_URL=postgresql://hanaloop:hanaloop@localhost:5433/hanaloop
```
Vercel 배포 시 같은 키를 Vercel Project Environment에 등록.

## 배포

- **Vercel** preview/production deploy
- **Postgres:** Neon (Vercel Marketplace 연동)
- 시드는 마이그레이션 시점에 자동 주입되어 배포 직후 데모 가능

## AI 도구 사용 내역

본 프로젝트는 Claude Code (Anthropic Opus 4.7)를 협업 도구로 사용하여 개발되었습니다.

### 활용 영역
- **요구사항 정리:** PRD 초안·페르소나 정의·범위 의사결정 보조
- **도메인 자문:** PCF 회계 관점(보고 기간 모델, 계수 편집 권한, 페르소나별 대시보드 차이)에서 설계 결정 검토
- **에이전트 구조 설계:** 프로젝트 전용 서브에이전트(backend-architect, frontend-engineer, pcf-domain-expert) 및 스킬(pcf-calculation-rules, dashboard-design-patterns) 구성·리뷰
- **코드 생성:** 컴포넌트·API 라우트·Prisma 스키마·테스트 초안 작성
- **문서 작성:** README, REQUIREMENTS 초안

### 인간 검토 책임
- 모든 산출물은 사용자가 검토·수정·승인했습니다.
- 커밋 메시지는 AI가 초안을 작성하지만 최종 커밋은 사용자가 직접 수행합니다.
- 도메인 자문 결과(예: "감축 목표 라인 비포함") 같은 의사결정은 AI 제안을 참고로 사용자가 최종 결정했습니다.

### Trade-off 한 줄
AI 활용으로 초기 셋업·요구사항 정리 속도가 크게 빨라졌지만, AI 제안을 그대로 수용하지 않고 "이게 진짜 필요한가, 업계 표준인가"를 매 단계 검증하는 절차가 별도 시간을 소비했습니다 — 후자가 산출물 품질을 지키는 핵심 게이트라 판단합니다.
