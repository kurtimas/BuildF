# Building F — IEMC yard floor

Interactive map of Building F. Drag totes, boxes, split stacks, and the scale between rows. Edits stay in the browser until you save them to the server with a password.

## What you need

- A computer with Windows, Mac, or Linux
- [Node.js 22](https://nodejs.org) or newer (the installer includes npm)
- Nothing else for day-to-day use

## Install

1. Unzip this folder somewhere you can find it, for example `Documents/building-f`.
2. Open a terminal in that folder.
   - Windows: open the folder in File Explorer, click the address bar, type `cmd`, and press Enter.
   - Mac: open Terminal, type `cd ` (with a space), drag the folder onto the window, and press Enter.
3. Install the app (one time, a few minutes):

```bash
npm install
```

4. Start it:

```bash
npm run dev
```

5. Open [http://localhost:8080](http://localhost:8080) in Chrome, Edge, or Safari.

Leave that terminal window open while you use the map. Press Ctrl+C in the terminal when you want to stop it.

## How to use the map

- Drag a stack by its handle. It snaps into a row section. In the forklift lane it can sit anywhere.
- Click a stack to edit the product, height, treated flag, and which row it belongs to.
- A red outline means the product is already treated.
- Each row has a notes box.
- **Dark** switches the color scheme. The choice is remembered in that browser.
- **Export** downloads `yard-floor.json`. **Import** loads a file back in. Use those as a backup.
- **Reset** puts the original survey back. It asks you to confirm first.
- On a phone, **More** holds Reset, Export, Import, Print, Save, and Load shared. **Rows 1–8**, **Lane**, and **Rows 9–21** jump down the page.

## Saving so other people see the same floor

Until you save, changes live only in that browser.

1. Click **Save to server**.
2. The first time, choose a password (at least 4 characters). After that, the same password is required.
3. Other computers on the same running app can click **Load shared** to pick up that floor.

The built-in database is in memory. **Save to server is wiped when you stop `npm run dev` and start it again.** Your own browser still has the last layout. Click **Export** if you want a file that survives a restart.

To keep the shared floor after a restart, use Postgres (optional, below).

## Optional: a floor that survives restarts

1. Create an empty Postgres database (Neon, a local Postgres install, or similar).
2. In the project folder, create a file named `.env` (note the leading dot):

```bash
DATABASE_URL=postgres://USER:PASSWORD@HOST:5432/DATABASE
YARD_SAVE_PASSWORD=choose-a-shared-password
```

`YARD_SAVE_PASSWORD` is optional. If you set it, that password is the only one that can save, and nobody can pick a different one in the browser.

3. Stop the app (Ctrl+C) and start it again with `npm run dev`.

The table is created for you from `migrations/0001_yard_floor.sql`.

## Optional: run the built copy

```bash
npm run build
npm run preview
```

Then open the address the preview command prints.

## If something fails

- `npm` is not recognized: install Node.js 22 and close and reopen the terminal.
- Port already in use: something else is on 8080. Close the other copy, or run `npm run dev -- --port 3000` and open [http://localhost:3000](http://localhost:3000).
- The page asks you to sign in: this folder includes `.grok/app-env.json` with sign-in turned off. Keep that file next to `package.json`.
