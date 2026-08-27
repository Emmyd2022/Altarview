# How to Run Altarview's Tests (No Coding Knowledge Required)

Altarview has two kinds of automated checks. You don't need to understand any code to run either of them — just copy and paste the commands below into a terminal, inside the Altarview project folder.

## 1. Quick Checks (Vitest) — a few seconds

These check that the underlying logic (Scripture, Songs, pagination, pinning, etc.) still works correctly.

```
npm run test
```

**What you'll see:** a list of test names, each with a green checkmark (✓) if it passed. At the end, a summary line like `Tests  319 passed (319)`. Green means everything checked out. If anything shows red, that's a real problem worth reporting.

## 2. Full Browser Checks (Playwright) — a minute or two

These open an actual (invisible, by default) browser and click through Altarview exactly the way a real operator would — opening songs, searching Scripture, pinning things, checking that content shows up correctly on screen.

**First time only**, install the browser Playwright needs:

```
npx playwright install chromium
```

Then run the checks:

```
npm run test:e2e
```

**What you'll see:** a summary like `12 passed, 2 failed`. Green = that part of the app works correctly through a real browser. Red = something is broken or the test needs updating — either way, worth looking into.

### To actually WATCH the browser while it runs:

```
npm run test:e2e:headed
```

A real browser window will open and you'll see Altarview being clicked through automatically.

### For a friendlier visual test runner:

```
npm run test:e2e:ui
```

This opens Playwright's own interface where you can see each test, replay it, and inspect exactly what happened if something failed.

## Understanding the Colors

- **Green** — that check passed. That part of Altarview works as expected.
- **Red** — that check failed. Something either broke, or the check itself needs updating to match a recent change. Either way, it's worth a closer look — click on the red item in the report for details.

## If a Playwright Check Fails

Playwright automatically saves a screenshot and a step-by-step recording ("trace") of exactly what happened right before the failure. After a run with failures, open the HTML report it generates (it will tell you the command, usually `npx playwright show-report`) to see exactly what the browser saw at the moment something went wrong — no coding knowledge needed to read it, it's just screenshots and a timeline.
