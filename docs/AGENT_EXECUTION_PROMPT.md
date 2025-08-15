# A1Betting8.13 — Copilot Agent Development Loop

## PURPOSE
You are acting as an autonomous development agent for the A1Betting8.13 project.
You must read `docs/ROADMAP_CHECKLIST.md`, execute tasks in order, and commit them.

---

## EXECUTION RULES

1. **Locate the next unchecked item** in `/docs/ROADMAP_CHECKLIST.md`
   - Look for `- [ ]` at the start of a task
   - Start with the first unchecked item in the file
   - Ignore items in completed phases unless a subtask is incomplete

2. **Perform the change**  
   - Open the files mentioned in the task  
   - Make the edits directly in those files  
   - Follow existing coding patterns and project conventions  
   - Keep changes minimal but functional unless otherwise specified

3. **Test and Validate**
   - Run `pytest` for backend tasks
   - Run `npm run build` or `pnpm build` for frontend tasks
   - Ensure no type errors (`mypy` for Python, `tsc` for TypeScript)
   - Ensure `eslint` passes for frontend files

4. **Commit Changes**
   - Use the commit format:
     ```
     phase:<phase_number> - <short_description>
     
     <long_description>
     Related roadmap task: "<exact task line>"
     ```
   - Example:
     ```
     phase:2.1 - Added strict type hints to backend/services

     Added missing type hints to all functions in backend/services.
     Related roadmap task: "- [ ] Add strict type hints to all functions in backend/services/"
     ```

5. **Mark Task as Complete**
   - Change `- [ ]` to `- [x]` in `docs/ROADMAP_CHECKLIST.md`
   - Commit this change with:
     ```
     docs:update - Marked roadmap task as complete
     ```
   - Only mark the exact task you just finished

6. **Repeat**
   - Return to Step 1 until all tasks are marked complete

---

## CONSTRAINTS
- Never skip a task, even if it seems minor
- For multi-part tasks, complete each sub-bullet before marking the parent task complete
- Do not introduce breaking changes unless explicitly allowed
- If a task is unclear, search the codebase for context and resolve ambiguity logically

---

## SPECIAL INSTRUCTIONS
- For **backend** changes:
  - Use `ResponseBuilder` and `BusinessLogicException` patterns consistently
  - Maintain `StandardAPIResponse[...]` in all endpoints
  - Keep imports sorted and unused imports removed
- For **frontend** changes:
  - Use Zustand for state management unless task specifies refactor
  - Follow Tailwind + Vite conventions
  - Keep components small and composable
- For **testing**:
  - Create new tests if a task changes functionality
  - Ensure existing tests pass after changes

---

## STOP CONDITION
- All tasks in `docs/ROADMAP_CHECKLIST.md` have been marked as complete
- All tests pass
- Build succeeds without warnings
