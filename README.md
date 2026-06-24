# Sparkco Braindates

Prototype v2 for Sparkco Braindates — a simple community matchmaking layer.

## Includes
- User profile
- Sparkco hover bio copy flow
- Community offers / needs tags
- Match scoring and match explanation
- Braindate invitation modal
- Invite status: pending / accepted / declined
- Admin taxonomy for community tags
- Local demo data
- LocalStorage persistence
- Export data as JSON

## Important limitation
This is a static prototype. It works well on GitHub Pages, but data is saved only in each user's browser.

For real multi-user testing, connect it later to a backend such as Supabase, Firebase, Airtable, Google Sheets, or Sparkco's own backend.

## Deploy to GitHub Pages
1. Create a new GitHub repository, for example `sparkco-braindates`.
2. Upload these files to the root of the repository:
   - `index.html`
   - `styles.css`
   - `app.js`
   - `logo_green.png`
   - `.nojekyll`
3. Go to Repository → Settings → Pages.
4. Under Build and deployment choose `Deploy from a branch`.
5. Choose Branch: `main`, Folder: `/root`.
6. Save.
7. Your app will be available at `https://YOUR_USERNAME.github.io/sparkco-braindates/`.
