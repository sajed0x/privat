# Unimed

A modern storefront for laboratory and medical products: test tubes, glassware,
PPE, diagnostics and more. Plain HTML, CSS and JavaScript, with no build step and
no server. **Everything is saved locally in your browser.**

## Run it

Open `index.html` in any modern browser (double-click it). That's it.

To host it, upload the folder to any static host (GitHub Pages, Netlify, etc.).

## Features

- Live search (press `/`), category chips, price slider, in-stock toggle, sorting, grid/list view
- Product detail view with specifications, quantity picker and live bulk-discount hint
- Cart drawer with quantity controls, bulk-discount tiers, a free-shipping threshold and undo
- Saved items (wishlist)
- Quote requests, saved and listed under **Manage › Quote requests**
- Light and dark mode (follows your system, with a manual toggle)
- Fully responsive, keyboard friendly, respects reduced-motion settings

## Changing products later

Click **Manage** (top right):

- **Products**: add, edit, duplicate or delete products, and change stock inline.
  Each product can use a built-in illustration or an uploaded photo.
- **Categories**: add, rename or recolour categories.
- **Backup**: download all data as JSON, import it on another computer, or reset
  to the original catalogue.

To change the *default* catalogue that new visitors see, edit `js/data.js`.
Pricing rules (discount tiers, shipping) are at the top of `js/app.js`.

## Where data is stored

`localStorage` in the browser that opened the site, under keys starting with
`unimed.`. It stays across reloads and restarts, but it is per browser and per
device. Use **Manage › Backup** to move or keep a copy.

## Files

```
index.html      page structure
css/styles.css  design tokens, layout, animations, dark mode
js/data.js      default categories and products
js/icons.js     inline SVG product illustrations
js/app.js       all behaviour (catalogue, cart, manage panel, storage)
```
