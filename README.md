# DEMO (Simulated)

<img width="1124" height="690" alt="Recording 2026-10-19 055146" src="https://github.com/user-attachments/assets/40fbaf3b-ff9a-4b61-86c3-6843a365432d" />



# BRACU Student Evaluation Helper: Installation Guide

A step-by-step guide to installing **Tampermonkey** and the **BRACU Student Evaluation Helper** userscript ([`script.js`](https://github.com/ikeepgettingbann3d/BRACUstEVALauto/blob/main/script.js)).

> **What it does:** adds a small toolbar to the BRACU course evaluation popup that fills in all 14 questions from a template, then stops at BRACU's own review screen. It **never submits** the evaluation for you.

---

## Table of Contents

1. [Requirements](#requirements)
2. [Step 1: Install Tampermonkey](#step-1-install-tampermonkey)
3. [Step 2: Enable userscripts (Chrome / Edge)](#step-2-enable-userscripts-chrome--edge)
4. [Step 3: Install the script](#step-3-install-the-script)
5. [Step 4: Use it](#step-4-use-it)
6. [Templates](#templates)
7. [Customizing your answers](#customizing-your-answers)
8. [Updating or removing the script](#updating-or-removing-the-script)
9. [Troubleshooting](#troubleshooting)
10. [Safety and good practice](#safety-and-good-practice)

---

## Requirements

- A desktop browser: Chrome, Edge, Firefox, Brave, Opera or Safari
- A BRACU student account with access to <https://courseevaluation.bracu.ac.bd/>

---

## Step 1: Install Tampermonkey

Always install Tampermonkey from your browser's **official store**. The project's own site, <https://www.tampermonkey.net/>, links to the right one for your browser.

| Browser | Where to get it |
|---|---|
| Chrome / Brave / Opera | Chrome Web Store (search "Tampermonkey") |
| Microsoft Edge | Microsoft Edge Add-ons (search "Tampermonkey") |
| Firefox | Firefox Add-ons (search "Tampermonkey") |
| Safari | Mac App Store (search "Tampermonkey") |

1. Open the store page for your browser.
2. Click **Add to Chrome** / **Get** / **Add to Firefox** (wording varies).
3. Confirm the permission prompt.
4. Pin the extension (puzzle-piece icon, then the pin) so the Tampermonkey icon is easy to reach.

> Make sure the publisher is **Jan Biniok**. There are lookalike extensions.

---

## Step 2: Enable userscripts (Chrome / Edge)

Recent Chromium-based browsers require an extra switch before extensions can run userscripts. Firefox and Safari users can skip this.

1. Go to `chrome://extensions` (or `edge://extensions`).
2. Click **Details** on Tampermonkey.
3. Turn on **Allow User Scripts**.
   - On older browser versions that don't show this toggle, turn on **Developer mode** (top-right of the extensions page) instead.
4. Restart the browser if Tampermonkey still shows a warning banner.

---

## Step 3: Install the script

The script file is named `script.js` rather than `*.user.js`, so Tampermonkey won't pop up its automatic install page. Use either method below.

### Method A: Copy and paste (most reliable)

1. Open the raw script:
   <https://github.com/ikeepgettingbann3d/BRACUstEVALauto/raw/refs/heads/main/script.js>
2. Select everything (`Ctrl + A`, or `Cmd + A` on Mac) and copy it (`Ctrl + C`).
3. Click the Tampermonkey icon, then **Create a new script...**
4. Delete the default template in the editor and paste the copied code.
5. Save with `Ctrl + S` (or **File → Save**).
6. Open the **Installed Userscripts** tab and confirm **BRACU Student Evaluation Helper** is listed and switched **on**.

### Method B: Install from URL

1. Click the Tampermonkey icon, then **Dashboard**.
2. Open the **Utilities** tab.
3. Under **Install from URL**, paste:
   ```
   https://github.com/ikeepgettingbann3d/BRACUstEVALauto/raw/refs/heads/main/script.js
   ```
4. Click **Install**, review the details on the next page, then click **Install** again.

---

## Step 4: Use it

1. Log in at <https://courseevaluation.bracu.ac.bd/> and go to your student dashboard.
2. Open a course evaluation so the evaluation popup appears.
3. At the bottom of the popup you'll see the helper toolbar:
   - **Template** dropdown to choose a preset
   - **Customize** button to edit your own answers
   - **Fill ... & review** button to run it
4. Pick a template and click **Fill ... & review**.
5. The helper rewinds to question 1, fills Q1 to Q14, and steps through to BRACU's **own review dialog**.
6. **Read the answers carefully**, then confirm or cancel yourself using BRACU's buttons.

---

## Templates

| Template | Q1 to Q10 ratings (1 to 5) | Notes |
|---|---|---|
| **Default** | `5, 5, 5, 5, 5, 4, 3, 4, 5, 4` | Mixed, realistic-looking ratings |
| **Best outcome** | all `5` | |
| **Average** | all `3` | |
| **Worst outcome** | all `1` | |
| **Custom (saved)** | your own values | Stored in your browser |

All built-in templates also set:

- **Attendance:** 76 to 100%
- **Study hours per week:** 7+
- **Suggestion boxes:** left blank

> Attendance and study hours describe **you**, not the course. If the defaults aren't accurate for a course, change them in the editor.

---

## Customizing your answers

1. Click **Customize** in the toolbar.
2. Set a rating (1 to 5) for each of Q1 to Q10.
3. Choose your attendance range and weekly study hours.
4. Optionally type instructor and course suggestions.
5. Click **Save custom** to keep them for next time, or **Reset** to go back to the selected template.

Saved custom values live in your browser's `localStorage` and are never sent anywhere by the script.

---

## Updating or removing the script

- **Update:** repeat [Step 3](#step-3-install-the-script) with the latest code. Tampermonkey will overwrite the old version.
- **Disable temporarily:** Tampermonkey icon, then use the toggle next to the script.
- **Remove:** Tampermonkey **Dashboard**, **Installed Userscripts**, then the trash icon on the script's row.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| Toolbar doesn't appear | Make sure the evaluation **popup is open**. The toolbar is only added inside it. Then refresh the page. |
| Script shows as installed but does nothing | Check it's toggled **on**, and that **Allow User Scripts** (or Developer mode) is enabled for Tampermonkey. |
| Tampermonkey says script is disabled | Re-do [Step 2](#step-2-enable-userscripts-chrome--edge) and restart the browser. |
| "Could not fill" error | BRACU may have changed its page layout. Fill the form manually and check the repo for an updated script. |
| Page URL doesn't match | The script only runs on `https://courseevaluation.bracu.ac.bd/studentdashboard*`. |
| Custom preset not saved | Private/incognito windows and cleared site data wipe `localStorage`. Save again. |

---

## Safety and good practice

- **Userscripts run with access to the pages they match.** Only install ones you trust, and skim the code first. This script matches a single BRACU URL and uses `@grant none`, meaning it requests no special Tampermonkey privileges.
- **Check what you install.** Before pasting or updating, make sure the `// @match` line still points only to `courseevaluation.bracu.ac.bd`, and be wary if new network calls or unfamiliar domains appear in future versions.
- **Review before you confirm.** Autofilled answers are only as honest as the template you pick. Evaluations help improve courses and teaching, so use **Customize** to give feedback that reflects your real experience.
- **Use at your own risk.** This is an unofficial community tool, not affiliated with BRAC University. Policies or the evaluation portal may change.

---

## Credits

Script by [ikeepgettingbann3d](https://github.com/ikeepgettingbann3d). Source: <https://github.com/ikeepgettingbann3d/BRACUstEVALauto>
