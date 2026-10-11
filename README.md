# Building F — IEMC yard floor

Interactive map of Building F. Drag totes, boxes, split stacks, and the scale between rows. Edits stay in the browser until you save them to the server with a password.

## What you need

- A computer with Windows, Mac, or Linux
- [Node.js 22](https://nodejs.org) or newer (the installer includes npm)
- Nothing else for day-to-day use on one computer

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

While you are only running `npm run dev` on your computer, the shared database is in memory. **Save to server is wiped when you stop the app and start it again.** Your own browser still has the last layout. Click **Export** if you want a file that survives a restart.

To keep the shared floor after a restart, host it with Postgres. That is the next section.

## Host it so other people can open it

Do not leave `npm run dev` running as the public site. A hosted copy needs two things:

1. A website host.
2. A Postgres database, so **Save to server** sticks.

Anyone with the link can look at the floor. The password only stops them from saving over it.

### Easiest: Vercel plus a free database

1. Create a free database at [Neon](https://neon.tech). Copy the connection string. It looks like `postgres://user:password@host/neondb`.
2. Put this project on [GitHub](https://github.com) (a private repo is fine). Upload the unzipped folder, not the zip itself.
3. Go to [Vercel](https://vercel.com), choose **Add New Project**, and import that repo.
4. Set the build command to `npm run build`.
5. Add these environment variables, then deploy:

```bash
DATABASE_URL=postgres://user:password@host/neondb
YARD_SAVE_PASSWORD=a-password-the-crew-will-share
VITE_AUTH_ENABLED=false
```

`VITE_AUTH_ENABLED=false` lets people open the map without making an account. `YARD_SAVE_PASSWORD` is the password for **Save to server**. Pick something the warehouse can share, and do not use a password you use anywhere else.

6. Open the `*.vercel.app` address Vercel gives you. On one phone, use **Save to server**. On another phone, use **Load shared** and confirm the same floor comes back.

### Your own server

Use this if the map should live on a shop computer or a VPS you control.

1. Install Node.js 22 and Postgres on that machine.
2. Create an empty database and a user that can write to it.
3. Copy the project onto the server, then:

```bash
npm install
npm run build
```

4. Start it with the database and password set. On Linux:

```bash
export DATABASE_URL=postgres://user:password@localhost:5432/building_f
export YARD_SAVE_PASSWORD=a-password-the-crew-will-share
export VITE_AUTH_ENABLED=false
npm run preview
```

That listens on the server itself at [http://127.0.0.1:8081](http://127.0.0.1:8081). Put Caddy or Nginx in front of it so other computers can open it, and use HTTPS. Keep the process running with `systemd` or `pm2` so it comes back after a reboot.

Do not put the real database URL or password in the zip, in git, or in a screenshot.

## Optional: run the built copy on this computer

```bash
npm run build
npm run preview
```

Then open [http://127.0.0.1:8081](http://127.0.0.1:8081). Without `DATABASE_URL`, this still forgets the shared floor when you stop it.

## If something fails

- `npm` is not recognized: install Node.js 22 and close and reopen the terminal.
- Port already in use: something else is using that port. Close the other copy.
- The page asks you to sign in: this folder includes `.grok/app-env.json` with sign-in turned off. Keep that file next to `package.json`. On a host, set `VITE_AUTH_ENABLED=false`.
