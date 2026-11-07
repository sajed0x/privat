/*
 * Product illustrations drawn as inline SVG, so the site needs no image files.
 * Each takes an accent colour `c`. Glass uses the --glass token so it adapts
 * to light and dark mode. A product can also use its own uploaded image.
 */
(function () {
  const S = 'stroke="var(--illus-line)" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"';
  const G = 'fill="var(--glass)"';

  const shapes = {
    tube: (c) => `
      <g transform="rotate(-14 60 60)">
        <rect x="47" y="12" width="26" height="12" rx="4" fill="${c}" ${S}/>
        <path d="M50 24h20v62a10 10 0 0 1-20 0z" ${G} ${S}/>
        <path d="M51.3 60h17.4v26a8.7 8.7 0 0 1-17.4 0z" fill="${c}" opacity=".85"/>
        <path d="M55 30v24" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".7"/>
      </g>`,
    rack: (c) => `
      ${[30, 50, 70, 90].map((x, i) => `
        <path d="M${x - 6} 22h12v50a6 6 0 0 1-12 0z" ${G} ${S}/>
        <path d="M${x - 4.8} ${48 + i * 4}h9.6v${24 - i * 4}a4.8 4.8 0 0 1-9.6 0z" fill="${c}" opacity="${0.55 + i * 0.12}"/>`).join("")}
      <rect x="14" y="52" width="92" height="10" rx="3" fill="${c}" opacity=".25" ${S}/>
      <path d="M18 62v34M102 62v34M14 96h92" ${S} fill="none"/>`,
    flask: (c) => `
      <path d="M50 16h20M52 16v28L30 88a7 7 0 0 0 6 10h48a7 7 0 0 0 6-10L68 44V16" ${G} ${S}/>
      <path d="M40 70h40l9 18.5a6 6 0 0 1-5.4 8.5H36.4a6 6 0 0 1-5.4-8.5z" fill="${c}" opacity=".85"/>
      <circle cx="54" cy="82" r="3" fill="#fff" opacity=".7"/><circle cx="66" cy="76" r="2" fill="#fff" opacity=".7"/>`,
    beaker: (c) => `
      <path d="M30 20h56l-4 6v62a8 8 0 0 1-8 8H42a8 8 0 0 1-8-8V26z" ${G} ${S}/>
      <path d="M35.5 56h45v32a6.5 6.5 0 0 1-6.5 6.5H42a6.5 6.5 0 0 1-6.5-6.5z" fill="${c}" opacity=".8"/>
      <path d="M70 34h10M73 44h7M70 54h10" ${S}/>`,
    syringe: (c) => `
      <g transform="rotate(-40 60 60)">
        <rect x="44" y="34" width="32" height="50" rx="4" ${G} ${S}/>
        <rect x="46.5" y="58" width="27" height="23.5" rx="2" fill="${c}" opacity=".8"/>
        <path d="M40 34h40M60 34V14M50 14h20M60 84v8M60 92v22" ${S} fill="none"/>
        <path d="M56 92h8" ${S}/>
        <path d="M50 44h8M50 52h8" ${S}/>
      </g>`,
    pipette: (c) => `
      <g transform="rotate(30 60 60)">
        <ellipse cx="60" cy="24" rx="12" ry="14" fill="${c}" ${S}/>
        <path d="M54 36h12v40l-4 30h-4l-4-30z" ${G} ${S}/>
        <path d="M55.3 62h9.4v14l-3.5 26h-2.4l-3.5-26z" fill="${c}" opacity=".6"/>
        <path d="M58 44v12" stroke="#fff" stroke-width="2.5" stroke-linecap="round" opacity=".7"/>
      </g>`,
    petri: (c) => `
      <ellipse cx="60" cy="70" rx="44" ry="20" ${G} ${S}/>
      <ellipse cx="60" cy="64" rx="44" ry="20" ${G} ${S}/>
      <ellipse cx="60" cy="64" rx="36" ry="14" fill="${c}" opacity=".22"/>
      <circle cx="46" cy="62" r="5" fill="${c}"/><circle cx="66" cy="58" r="3.5" fill="${c}" opacity=".8"/>
      <circle cx="72" cy="69" r="6" fill="${c}" opacity=".9"/><circle cx="56" cy="71" r="2.5" fill="${c}"/>
      <circle cx="38" cy="68" r="2" fill="${c}" opacity=".7"/>`,
    vial: (c) => `
      <rect x="42" y="16" width="36" height="16" rx="4" fill="${c}" ${S}/>
      <path d="M44 32h32v58a8 8 0 0 1-8 8H52a8 8 0 0 1-8-8z" ${G} ${S}/>
      <path d="M45.3 64h29.4v26a6.7 6.7 0 0 1-6.7 6.7H52a6.7 6.7 0 0 1-6.7-6.7z" fill="${c}" opacity=".8"/>
      <rect x="44" y="44" width="32" height="12" fill="#fff" opacity=".75"/>`,
    gloves: (c) => `
      <g fill="${c}" ${S}>
        <rect x="41" y="20" width="11" height="46" rx="5.5"/>
        <rect x="53" y="12" width="11" height="54" rx="5.5"/>
        <rect x="65" y="16" width="11" height="50" rx="5.5"/>
        <rect x="77" y="26" width="10" height="40" rx="5"/>
        <rect x="24" y="44" width="11" height="34" rx="5.5" transform="rotate(-38 30 60)"/>
        <path d="M40 50h47v28c0 12-8 18-16 18H56c-10 0-16-8-16-18z"/>
        <rect x="46" y="94" width="34" height="14" rx="3"/>
      </g>
      <path d="M44 50h40" stroke="${c}" stroke-width="5"/>`,
    mask: (c) => `
      <path d="M26 46c-14 0-16 30 2 30M94 46c14 0 16 30-2 30" fill="none" ${S}/>
      <path d="M26 40c20-8 48-8 68 0v38c-20 12-48 12-68 0z" fill="${c}" opacity=".9" ${S}/>
      <path d="M30 54c18-6 42-6 60 0M30 64c18-6 42-6 60 0M30 74c18-4 42-4 60 0" stroke="#fff" stroke-width="2.5" fill="none" opacity=".6"/>`,
    thermometer: (c) => `
      <g transform="rotate(-30 60 60)">
        <path d="M52 20a8 8 0 0 1 16 0v54a14 14 0 1 1-16 0z" ${G} ${S}/>
        <circle cx="60" cy="86" r="9" fill="${c}"/>
        <rect x="57" y="36" width="6" height="48" rx="3" fill="${c}"/>
        <path d="M72 30h6M72 42h6M72 54h6" ${S}/>
      </g>`,
    stethoscope: (c) => `
      <path d="M36 16v30a20 20 0 0 0 40 0V16" fill="none" ${S}/>
      <path d="M56 66v14a18 18 0 0 0 36 0V70" fill="none" ${S} stroke="${c}" stroke-width="5"/>
      <circle cx="92" cy="60" r="11" fill="${c}" ${S}/><circle cx="92" cy="60" r="4" fill="#fff" opacity=".8"/>
      <circle cx="36" cy="16" r="4" fill="var(--illus-line)"/><circle cx="76" cy="16" r="4" fill="var(--illus-line)"/>`,
    bandage: (c) => `
      <g transform="rotate(-35 60 60)">
        <rect x="14" y="44" width="92" height="32" rx="16" fill="${c}" opacity=".85" ${S}/>
        <rect x="44" y="46" width="32" height="28" rx="4" fill="#fff" opacity=".85"/>
        ${[50, 58, 66].map((x) => `<circle cx="${x + 2}" cy="54" r="1.6" fill="${c}"/><circle cx="${x + 2}" cy="66" r="1.6" fill="${c}"/>`).join("")}
      </g>`,
    microscope: (c) => `
      <path d="M24 102h72M44 102c0-10 8-16 16-16" fill="none" ${S}/>
      <path d="M66 86c10-6 14-20 6-32" fill="none" ${S}/>
      <g transform="rotate(-28 56 44)">
        <rect x="48" y="14" width="16" height="46" rx="3" fill="${c}" ${S}/>
        <rect x="51" y="60" width="10" height="10" ${G} ${S}/>
        <rect x="45" y="8" width="22" height="8" rx="2" fill="var(--illus-line)"/>
      </g>
      <rect x="40" y="76" width="34" height="6" rx="2" fill="var(--illus-line)"/>`,
    box: (c) => `
      <path d="M20 40l40-18 40 18v46l-40 18-40-18z" fill="${c}" opacity=".2" ${S}/>
      <path d="M20 40l40 18 40-18M60 58v46" fill="none" ${S}/>
      <path d="M40 31l40 18v14" fill="none" ${S}/>
      <path d="M38 72v10M33 77h10" stroke="${c}" stroke-width="4" stroke-linecap="round"/>`,
  };

  window.ICON_NAMES = Object.keys(shapes);

  window.productArt = function (icon, color) {
    const draw = shapes[icon] || shapes.box;
    return `<svg viewBox="0 0 120 120" aria-hidden="true">${draw(color)}</svg>`;
  };
})();
