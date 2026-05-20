# Hanaloop PCF 전과정 대시보드

제품 탄소 발자국(PCF)의 **전과정(cradle-to-gate + transport) 데이터**를 시각화하는 인터랙티브 대시보드. 대상 제품: **CT-045 컴퓨터 화면**.

활동 데이터(원소재·가공 전기·출고 운송)를 입력 또는 Excel 임포트하면 배출계수와 매칭해 kgCO2e를 자동 산정하고, lifecycle 단계별 기여도와 시간 추이를 두 페르소나(실무자/경영자) 관점으로 시각화합니다.

## 🚀 라이브 데모

**https://hanaloop-nu.vercel.app**

설치 없이 바로 체험 가능. 페르소나 전환은 우상단 토글 또는 `?role=operator` / `?role=executive` 쿼리.

자세한 요구사항은 [`docs/REQUIREMENTS.md`](./docs/REQUIREMENTS.md) 참고.

## 로컬에서 실행하기

### 사전 요구사항

| 항목               | 버전·요구                                   |
| ------------------ | ------------------------------------------- |
| **Node.js**        | 20 LTS 이상 (`node -v`)                     |
| **yarn**           | 1.22+ (`yarn -v`) — npm/pnpm 미지원         |
| **Docker Desktop** | 실행 중이어야 함 (Postgres 컨테이너 구동용) |

### 빠른 실행 (4단계)

1. **클론 + 환경변수 + 의존성**
   ```sh
   git clone https://github.com/jinhyeon0810/hanaloop.git && cd hanaloop
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
- **계수는 DB seed로만 관리.** 계수 편집 UI는 범위 밖. 스키마는 `(활동 유형, 세부 카테고리, validFrom)` 복합 유니크로 supersession을 받을 수 있게 두지만 현재는 단일 버전으로 운영.
- **부분 성공 임포트.** Excel 임포트는 행 단위 검증 실패가 전체 파일을 막지 않음. Accepted/Duplicates/Rejected 3구역으로 결과 표시.

### 화면 구성

| 경로                 | 주 대상 페르소나 | 비고                                                                   |
| -------------------- | ---------------- | ---------------------------------------------------------------------- |
| `/`                  | executive        | KPI 4개 + 활동 유형별 누적 차트. operator는 데이터 품질 섹션 추가 노출 |
| `/activities`        | operator         | 활동 목록 + 필터. 양 페르소나 접근 가능                                |
| `/activities/new`    | operator         | 활동 폼 입력. 인라인 검증                                              |
| `/activities/import` | operator         | Excel/CSV 업로드 + 부분 성공 결과                                      |
| `/factors`           | 공통             | 배출계수 read-only 목록                                                |

### 데이터 모델

```
Activity * ─── 1 EmissionFactor
```

- **Activity**: 일자, 활동 유형(`electricity` / `raw_material` / `transport`), 설명, 수량, 단위, 매칭된 `factorId`. kgCO2e는 저장하지 않고 매번 `quantity × factor.value`로 계산합니다.
- **EmissionFactor**: 활동 유형, 세부 카테고리(`subCategory`), 값, 단위, 유효 시작일(`validFrom`), 출처(`source`). `(activityType, subCategory, validFrom)` 조합이 유니크합니다.

상세 스키마는 `prisma/schema.prisma` 참고.

## 개발 환경

### 패키지 매니저

**yarn 전용.** npm/pnpm 명령은 사용하지 않습니다.

### 명령어

| 명령                      | 용도                                          |
| ------------------------- | --------------------------------------------- |
| `yarn dev`                | 개발 서버 (핫리로드)                          |
| `yarn build`              | 프로덕션 빌드                                 |
| `yarn start`              | 빌드 + 프로덕션 서버 실행 (한 번에)           |
| `yarn lint`               | ESLint                                        |
| `yarn prisma migrate dev` | 로컬 DB 마이그레이션 + 자동 클라이언트 재생성 |
| `yarn prisma db seed`     | 시드 데이터 주입 (활동 30건 + 계수 4건)       |

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

AI 활용으로 초기 셋업·요구사항 정리 속도가 크게 빨라졌지만, AI 제안을 그대로 수용하지 않고 "이게 진짜 필요한가, 업계 표준인가"를 매 단계 검증하는 절차가 별도 시간을 소비했습니다

## 작업 회고

### 작업 시간

- 5월 19일 오후 10시 ~ 5월 20일 새벽 2시 (약 4시간)
- 5월 20일 오전 10시 ~ 오후 4시 (약 6시간)

### 오래 걸린 부분

AI 에이전트·스킬 환경을 셋업하고, AI가 생성한 코드를 매 단계 검증·교정하는 과정에 시간이 크게 들었습니다. 단순히 결과물을 수용하지 않고 PCF 도메인 정합성, Next.js 16의 변경점, Prisma 스키마 결정 등을 다시 검토하는 절차가 별도 비중을 차지했습니다.

### 시간이 더 있다면 정리하고 싶은 부분

전체 동작을 빠르게 만드는 데 집중하다 보니 프론트엔드 코드 구조까지는 충분히 손이 가지 못했습니다. 시간이 더 주어진다면 이 순서로 다듬어 보고 싶습니다.

1. **활동 검증 로직을 한 곳으로**
   지금은 비슷한 행 검증이 폼(`actions/activity.ts`), REST API(`api/activities/route.ts`), 엑셀 임포트(`lib/import/validate.ts`) 세 군데에 따로 적혀 있습니다. 한 곳만 고치고 다른 쪽을 빠뜨리기 쉬워서, Zod 스키마 하나를 셋이 같이 쓰도록 묶고 싶습니다. 에러 응답 형식도 통일성이 필요하다고 생각합니다.

2. **활동 유형 관련 데이터를 한 객체로 모으기**
   전기/원소재/운송 같은 활동 유형의 한글 이름, 단위, 색상, 생애주기 단계 라벨이 5~6개 파일에 흩어져 있습니다. 새 유형을 하나 추가하려면 여기저기 다 찾아 고쳐야 하는데, `ACTIVITY_TYPE_META` 같은 객체 하나에 모으면 한 군데만 손보면 끝납니다.

3. **`import-form.tsx` 쪼개기**
   한 컴포넌트(약 420줄)에 파일 업로드 영역, 결과 표시, 거부된 행 목록, CSV 다운로드가 모두 들어 있습니다. 역할별로 작은 컴포넌트로 나누면 읽기도 수정하기도 편해질 것이라 생각합니다.

이렇게 정리되면 새 활동 유형을 추가하거나 검증 규칙을 바꿀 때 손볼 곳이 줄어들고, 코드 의도도 더 명확해질 것이라 생각합니다.
