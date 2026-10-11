# FIELDWORK

A workspace for independent design studios. Project status, team assignments and drawing feedback share one place, from the first brief to the final handover.

**[Open the workspace](https://ariyachan.github.io/fieldwork/)** · **[View the case study](https://ariyachan.github.io/fieldwork/case-study.html)**

![FIELDWORK studio overview](public/screenshots/overview.jpg?v=2)

## The workflow

- **Studio desk:** the current drawing, pinned feedback and decision queue lead the workspace; compact totals link to projects, reviews and tasks.
- **Projects:** searchable project library, active/completed filters, project briefs, milestones and task progress.
- **Task board:** create assignments, move work between three states, filter by project and export the current task list as CSV.
- **Drawing reviews:** inspect sheets with fit-to-view and zoom, place comments with a pointer or keyboard, resolve or reopen feedback, download the drawing and approve the set after every open comment is resolved.
- **Schedule:** a desktop calendar and a phone agenda, both scoped to the selected month, with task deadlines and project milestones.
- **Search:** find projects and tasks with the global search or `Ctrl/⌘ K`.

The mobile layout puts the drawing first, stacks the decision queue and uses a full-width review sheet with a sticky approval bar. The desktop layout keeps studio navigation visible beside the desk; drawing and conversation panels scroll independently while approval stays in view.

<p align="center">
  <img src="public/screenshots/mobile-overview.jpg?v=2" alt="Mobile studio overview" width="240" />
  <img src="public/screenshots/mobile-project.jpg?v=2" alt="Mobile project detail" width="240" />
  <img src="public/screenshots/mobile-review.jpg?v=2" alt="Mobile drawing review" width="240" />
</p>

## Run locally

Node.js 22.18 or newer and npm.

```sh
npm ci
npm run dev
```

Open `http://localhost:5173/fieldwork/`.

```sh
npm test
npm run lint
npm run build
```

## Structure

```text
src/
  App.tsx            Navigation, project and task views
  StudioDesk.tsx     Drawing-led workspace and decision queue
  DrawingReview.tsx  Pinned feedback and approval workflow
  Schedule.tsx       Deadline calendar
  Plan.tsx           Drawing illustrations
  components.tsx     Shared interface components
  data.ts            Workspace records and state operations
  useWorkspace.ts    Browser persistence
tests/               Workflow and state verification
public/              Images, case study and screenshots
docs/                Published site
```

Built with React and TypeScript. Radix primitives handle dialogs, tabs and status menus. The visual system uses Instrument Sans, a restrained warm neutral palette, fine dividers, a single terracotta accent and architectural imagery.

## Project scope

A self-initiated product design and frontend project by Kai Zhang. The studio records are illustrative. Workspace changes persist in local browser storage; the project does not include a shared backend or multi-user synchronization. Drawing illustrations demonstrate the review interaction and are not construction documents.

Eight automated checks cover scoped task progress, combined project filters, project creation and restoration, reversible task completion, review approval gates, task assignment, keyboard-positioned feedback with persisted author and pin, and month-specific phone agendas. Desktop and mobile browser checks also cover sheet magnification, approval visibility and layout overflow.
