# Workout Log

An offline web app for logging a 12-week strength, symmetry and fat-loss program on an Android phone.

- Installs to the home screen from Chrome and works with no signal.
- All logged data stays in the phone's browser storage. Nothing is sent anywhere.
- Weekly export: a backup file plus CSV files laid out like the companion Excel workbook.

## Files
- `program.js`: the program (sessions, exercises, sets and reps by week, guide text). Edit this to change the plan.
- `app.js`: the app logic and screens.
- `styles.css`, `index.html`, `manifest.webmanifest`, `icons/`, `fonts/`.
- `sw.js`: the offline cache. **Bump `VERSION` on every release** so installed copies update.

Fonts: Inter and Space Grotesk, SIL Open Font License 1.1 (see `fonts/LICENSE.txt`).
