# Customer experience: Home

Branch: `feature/customer-experience-home`

Base: `2bf96e221ba7bd2adf81c5eefffb220325bf58c4`, also referenced by the frozen `backup/appify-stable-pre-customer-experience` branch. The backup must not be updated.

## Changes

- Home displays configured banners, resume card, then modules; missing banners and missing resume locations render no placeholder.
- Resume card names the module and lesson, with localized title and Continue/Review action. Button foreground follows the configured color for readable contrast.
- Module cards use readable full titles and a single progress summary for available content. Locked/upsell/points content keeps its existing access handler. Draft cards remain unavailable.
- Lessons use a vertical list with full titles, 60px covers and generous touch targets. Completion status is informational.
- Module detail shows one completion count and an optional accessible progress bar following existing gamification settings; no repeated percentage.
- Bottom navigation uses actual buttons, readable inactive colors, an active background/marker, keyboard focus, and bottom safe-area padding. It occupies layout space instead of covering lesson content.
- Shared presentation components keep the PhoneMockup and published runtime consistent. Narrow module grids switch to a single column; the lesson list always has one column.

## Preserved scope

No project schema, progress storage, buyer validation, Supabase integration, editor controls, Profile contents, completion button handlers, lesson HTML sandbox, export paths or checkout behavior changed. Existing projects need no migration. Changes affect newly built/exported PWAs; already hosted exports need a fresh export to receive them.

## Validation and review

- TypeScript: `npm run lint`.
- Regression suite: `npm test`, including CustomerExperience tests for runtime and preview in all four product languages, persisted resume/progress, draft/upsell access and engagement navigation.
- Desktop and PWA bundles: `npm run build`.
- Source/index/build credential scans: `npm run check:secrets`, `npm run check:secrets -- --staged`, `npm run check:secrets -- --build`.
- Dependency audit: `npm audit --audit-level=low`.

Results: TypeScript passed; 94 tests passed; desktop/PWA builds and all credential scans passed; dependency audit reported zero vulnerabilities. Headless Chromium checks passed in 24 scenarios (320/390/430px, four languages, light/dark): navigation targets were at least 44px, labels did not overflow, all four lesson titles were readable, and the last lesson remained above navigation. Screenshots of Home and lesson lists were inspected. Missing external fonts use a sans-serif fallback.

Development follow-up: restrict dependency discovery to `index.html`, and prebundle the React development JSX and `motion/react` entry points. This excludes generated PWA/backup bundles from the dev scanner. A regression test runs the actual optimizer with intentionally invalid imports in generated/backup HTML. The updated suite has 95 passing tests; browser development smoke checks open the dashboard and a project without React runtime errors. If an old dev cache remains on a machine, stop the server and restart with `npm run dev -- --force`.

Before accepting the visual direction, review a real product with and without banners, long module/lesson titles, 1 and 4+ lessons, light/dark themes, and a locked offer on a phone. Native iOS/Windows acceptance remains a device check.

## Rollback

This branch is isolated: using the existing stable branch restores the previous presentation. If merged later, revert this customer-experience commit on the development branch. Do not move or rewrite the frozen backup ref. Customer progress data remains compatible with either presentation.
