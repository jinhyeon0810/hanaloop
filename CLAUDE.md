@AGENTS.md

---

# Claude Code workflow

`.claude/agents/`, `.claude/skills/`는 세션 시작 시 자동 등록·라우팅됨. 매칭되는 에이전트/스킬이 있으면 generic `claude`보다 우선 사용. 교차 도메인은 여러 에이전트 병렬 호출 후 결과 종합.

## Commit

**자동 커밋 금지.** diff 요약 + 메시지 초안 제시 → 사용자가 직접 `git commit`.

`Co-Authored-By` 금지 (AI 활용은 README에서 관리).

## Tasks & Memory

- 3단계 이상 작업은 `TaskCreate`, 상태 즉시 갱신
- feedback 메모리는 사용자가 교정/확인할 때 저장. 코드 패턴은 저장 X (레포에서 도출 가능)

## Verification

UI 변경은 `yarn start`로 브라우저 확인 후 완료 보고. 확인 불가하면 명시.
