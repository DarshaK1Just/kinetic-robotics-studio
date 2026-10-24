# Studio dashboard redesign

## What changed

- New overview: next lesson, self-reported progress, saved modules, completed timer minutes, an interactive LED reasoning challenge, and direct routes to existing labs.
- New curriculum: track filters, keyword search, module bookmarks, grid/list layout, and reading estimates explicitly separated from practice time.
- New module workspace: lesson sequence, practice prompts, direct lab and project links, and an editable evidence notebook with a self-review rubric and Markdown export.
- Revised visual system: violet/ivory surfaces, restrained card entrance animation, hover highlights, an interactive concept robot, dark appearance, responsive layouts, and reduced-motion behavior.
- Existing lessons, project stages, photo-source assets, six numerical labs, code editor, video clips and native sources retained.

## Architecture

`src/dashboard.js` contains the dashboard/module views and their event handlers. It is loaded before `src/app.js`; `KineticDashboard.create(...)` receives the original app state and helpers. No new JavaScript dependency or network request is needed.

`src/dashboard.css` is appended after the existing stylesheet. Existing workspaces receive a light finishing treatment while maintaining their original selectors.

`src/app.js` delegates the home, learn and module routes to the new view layer. Other routes retain their original implementation. `build.py` combines the sources into the same portable HTML distribution that GitHub Pages already publishes.

## State compatibility

The storage key remains `kinetic-studio-v1`. Existing `complete`, `notes`, `quizzes`, `checks`, `drafts`, `theme` and other preferences remain in place. A new `dashboard` object contains bookmarks, display preferences, focus sessions, the circuit challenge result and module evidence. Imports validate these fields; old exports without `dashboard` receive defaults.

Progress is intentionally labelled as lessons **reviewed**, not skills mastered. A timer does not measure attention. The timer pauses on document visibility changes. Evidence checklists are self-reported rather than automatically graded.

## Useful routes

- `#/home`: overview
- `#/learn`: searchable curriculum
- `#/module/02`: electricity module
- `#/module/02/practice`: experiment prompts
- `#/module/02/evidence`: evidence notebook
- `#/sandbox/circuit`: existing full circuit lab
- `#/settings`: theme, type size, motion, import/export

## Development

```bash
python3 build.py
node --test tests/*.test.js
python3 scripts/check_site.py
python3 serve.py
```

The portable website still needs no npm dependency installation. Optional browser tests use Python Playwright and Chromium; they are not required for the existing GitHub Pages build.

```bash
python3 -m pip install playwright
# Tests use /usr/bin/chromium. Install Chromium using your OS package manager.
mkdir -p qa
python3 tests/browser_smoke.py
python3 tests/extended_browser.py
python3 tests/dashboard_browser.py
```

## Review / deployment commands for the existing Ubuntu clone

Download `Kinetic_Dashboard_Redesign.patch` into `~/Downloads`, then run these commands **one section at a time**. Stop if any command fails. Do not force-apply a rejected patch.

```bash
cd ~/Downloads/kinetic-robotics-studio-github
git status --short
```

The working tree should be clean before applying this update. Commit or intentionally stash your own changes first. Then:

```bash
git switch main
git pull --ff-only origin main
git switch -c feat/premium-learning-dashboard

git apply --check ~/Downloads/Kinetic_Dashboard_Redesign.patch
git apply ~/Downloads/Kinetic_Dashboard_Redesign.patch

python3 build.py
node --test tests/*.test.js
python3 scripts/check_site.py
python3 serve.py
```

Open the printed local address. Check the dashboard, module filters, save buttons, circuit challenge and evidence notes. Stop the server with Ctrl+C before continuing:

```bash
git add .github/workflows/pages.yml .gitignore README.md build.py index.html \
  src/app.js src/dashboard.js src/dashboard.css \
  tests/dashboard.test.js tests/dashboard_browser.py tests/extended_browser.py \
  docs/dashboard-redesign.md docs/dashboard-validation.json docs/preview.png

git commit -m "Redesign robotics learning dashboard and interactive modules"
git push -u origin feat/premium-learning-dashboard

gh pr create \
  --repo DarshaK1Just/kinetic-robotics-studio \
  --base main \
  --head feat/premium-learning-dashboard \
  --title "Redesign robotics course dashboard" \
  --body "Adds a redesigned overview and curriculum, module bookmarks, a live circuit challenge, focus timer, evidence notebooks, reduced-motion support, responsive layouts, and regression tests."
```

Inspect the pull request and its validation result. Merging it into `main` triggers your existing GitHub Pages deployment. Do not create a second Pages workflow. The patch does not change the remote URL or require new credentials.

## Patch assumptions and rollback

This update was built from the GitHub-ready ZIP shared in the conversation. The live repository could not be fetched in the build workspace; `git apply --check` is the guard against differences in your current clone. If the check fails, do not use `--reject` or overwrite files blindly; inspect the divergent files first.

Before merging, the feature branch can simply be left unmerged. After a merge, use GitHub's **Revert** action on the merged pull request to create a reviewable rollback. Reverting will itself redeploy after it reaches `main`.

## Boundaries

The illustrated robot and module diagrams are concepts, not product photographs. Reference hardware photographs remain in Explore and lesson assets. Native robotics engines, hardware execution and GPU training are not newly implemented or implied by this dashboard work.

External media and the optional Python runtime still need internet. Existing browser progress is local to its origin: downloaded HTML, localhost and the public GitHub Pages URL have separate storage. Use Export / Import in Settings when moving progress between them.

## Implementation references

- W3C ARIA Authoring Practices, Tabs Pattern: https://www.w3.org/WAI/ARIA/apg/patterns/tabs/
- MDN, prefers-reduced-motion: https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion

Manual module tabs use Left/Right/Home/End to move focus and Enter/Space to activate. Motion respects the existing workspace setting and operating-system reduced-motion preference.
