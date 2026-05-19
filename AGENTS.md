<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

---

# Project: Hanaloop PCF Dashboard

## Stack

- TypeScript · Next.js 16 (App Router) · React 19
- PostgreSQL · Prisma ORM
- shadcn/ui · Tailwind v4 · Recharts
- yarn · Docker Compose · Vercel
- OpenAPI/Swagger

## Workflow rules

- 패키지 매니저는 yarn
- 한 커밋은 하나의 논리적 변경
- AI가 커밋 메시지 초안 작성 → 사용자가 검토·수정 → 사용자가 직접 `git commit`
- `Co-Authored-By` 트레일러 붙이지 않음
- AI 활용 내역은 README의 별도 섹션에서 통합 관리

도메인 용어·기능 요건·검증 규칙은 `docs/REQUIREMENTS.md` 참고. 이 파일에 중복 작성하지 않는다.

## See also

- `docs/REQUIREMENTS.md` — 도메인·요구사항
- `.claude/agents/`, `.claude/skills/` — Claude Code 확장
