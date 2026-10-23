// Material Design Icons `recycle`, Apache-2.0. See ASSET-CREDITS.md.
export const RECYCLE_PATH='M21.82,15.42L19.32,19.75C18.83,20.61 17.92,21.06 17,21H15V23L12.5,18.5L15,14V16H17.82L15.6,12.15L19.93,9.65L21.73,12.77C22.25,13.54 22.32,14.57 21.82,15.42M9.21,3.06H14.21C15.19,3.06 16.04,3.63 16.45,4.45L17.45,6.19L19.18,5.19L16.54,9.6L11.39,9.69L13.12,8.69L11.71,6.24L9.5,10.09L5.16,7.59L6.96,4.47C7.37,3.64 8.22,3.06 9.21,3.06M5.05,19.76L2.55,15.43C2.06,14.58 2.13,13.56 2.64,12.79L3.64,11.06L1.91,10.06L7.05,10.14L9.7,14.56L7.97,13.56L6.56,16H11V21H7.4C6.47,21.07 5.55,20.61 5.05,19.76Z';
export function recycleSymbol(){return `<path d="${RECYCLE_PATH}" style="fill:currentColor;stroke:none"/>`;}
export function leafSymbol(){return '<path d="M12 2C7 6 4.5 9.5 4.5 13.5a7.5 7.5 0 0 0 15 0C19.5 9.5 17 6 12 2Z"/><path d="M12 7v15m0-9-4-3m4 3 4-3m-4 7-4-3m4 3 4-3"/>';}
export function collectionIcon(type){
 const paths={garbage:'<path d="M4 6h16M9 3h6l1 3M6 6l1 15h10l1-15M10 10v7m4-7v7"/>',recycling:recycleSymbol(),green:leafSymbol(),bulky:'<path d="M5 11V7a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v4M5 17v3m14-3v3M5 11a2 2 0 0 0-4 0v6h22v-6a2 2 0 0 0-4 0v3H5Z"/>'};
 return `<svg viewBox="0 0 24 24" aria-hidden="true">${paths[type]||''}</svg>`;
}
export function collectionIllustration(){return `<div class="hero-art" aria-hidden="true"><svg viewBox="0 0 360 270" fill="none" xmlns="http://www.w3.org/2000/svg">
 <defs>
  <linearGradient id="bin-blue" x1="0" y1="0" x2="110" y2="150" gradientUnits="userSpaceOnUse"><stop stop-color="#65a8d2"/><stop offset="1" stop-color="#337aa8"/></linearGradient>
  <linearGradient id="bin-charcoal" x1="0" y1="0" x2="90" y2="140" gradientUnits="userSpaceOnUse"><stop stop-color="#66746d"/><stop offset="1" stop-color="#3c4943"/></linearGradient>
  <linearGradient id="paper-kraft" x1="0" y1="0" x2="76" y2="90" gradientUnits="userSpaceOnUse"><stop stop-color="#e0c69a"/><stop offset="1" stop-color="#c4a16c"/></linearGradient>
 </defs>
 <g stroke="#89aa8f" stroke-width="1.2" opacity=".28"><path d="M13 147V92l35-28 35 28v55M30 147v-27h22v27M62 96h12v12H62M276 146V69l28-22 28 22v77M289 81h11v16h-11M310 81h11v16h-11M289 118h22v28M7 148h340"/><path d="M239 145V98m-14 17 14-32 14 32m-22-18 8-21 8 21"/></g>
 <ellipse cx="181" cy="239" rx="151" ry="11" fill="#123629" opacity=".38"/>
 <g transform="translate(34 98) rotate(-4 49 66)">
  <path d="M9 22h82l-8 104a7 7 0 0 1-7 7H24a7 7 0 0 1-7-7Z" fill="url(#bin-charcoal)"/>
  <path d="m20 30 7 94h43l8-94" fill="#3b4941" opacity=".45"/>
  <path d="M19 30 25 120" stroke="#89968c" stroke-width="2" opacity=".35"/>
  <path d="M36 45v57m14-57v57m14-57v57" stroke="#819184" stroke-width="3" stroke-linecap="round" opacity=".55"/>
  <rect x="3" y="13" width="94" height="13" rx="4" fill="#829085"/>
  <path d="m10 13 7-8h65l8 8" fill="#9aa99a"/>
  <path d="M38 5V2h25v3" stroke="#b1bfaa" stroke-width="4" stroke-linejoin="round"/>
  <circle cx="26" cy="133" r="7.5" fill="#112f23"/><circle cx="76" cy="133" r="7.5" fill="#112f23"/>
  <circle cx="26" cy="133" r="3" fill="#607267"/><circle cx="76" cy="133" r="3" fill="#607267"/>
 </g>
 <g transform="translate(137 71) rotate(3 55 80)">
  <path d="M9 24h94l-9 123a8 8 0 0 1-8 7H26a8 8 0 0 1-8-7Z" fill="url(#bin-blue)"/>
  <path d="m24 32 7 109h49l9-109" fill="#2d709d" opacity=".38"/>
  <path d="M22 34 29 137" stroke="#a9d4e9" stroke-width="2" opacity=".6"/>
  <rect x="2" y="14" width="108" height="15" rx="4" fill="#87c0e1"/>
  <path d="m9 14 8-9h78l8 9" fill="#a6d4e9"/>
  <path d="M41 5V1h29v4" stroke="#c3e3ef" stroke-width="4" stroke-linejoin="round"/>
  <svg x="28" y="53" width="56" height="56" viewBox="0 0 24 24" color="#f2f7ec">${recycleSymbol()}</svg>
  <circle cx="30" cy="154" r="8" fill="#103426"/><circle cx="84" cy="154" r="8" fill="#103426"/>
  <circle cx="30" cy="154" r="3.2" fill="#7497a0"/><circle cx="84" cy="154" r="3.2" fill="#7497a0"/>
 </g>
 <g transform="translate(253 148)">
  <path d="m0 8 10 3 9-4 9 4 10-4 10 4 9-4 9 4 10-3-5 78H5Z" fill="url(#paper-kraft)"/>
  <path d="m0 8 13 12-1 57-7 9M76 8 63 20l1 57 7 9" fill="#b99460" opacity=".7"/>
  <path d="m13 20 8-7m42 7-8-7M12 77h52" stroke="#a9885b" stroke-width="1" opacity=".6"/>
  <path d="M38 24C27 32 22 40 22 48a16 16 0 0 0 32 0c0-8-5-16-16-24Z" fill="#456b45"/>
  <path d="M38 33v38m0-26-7-6m7 6 7-6m-7 17-9-7m9 7 9-7" stroke="#dce5bd" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
 </g>
 <g fill="#cbdcb2"><path d="m111 50 2 6 6 2-6 2-2 6-2-6-6-2 6-2Z"/><circle cx="268" cy="52" r="2"/><circle cx="327" cy="135" r="2"/></g>
 </svg></div>`;}

export function brandMark(){return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" role="img" aria-label="Ma collecte : un bac de recyclage et une feuille">
 <rect width="1024" height="1024" fill="#1d4638"/>
 <circle cx="512" cy="512" r="454" fill="#285541"/>
 <circle cx="512" cy="512" r="427" fill="none" stroke="#84a675" stroke-opacity=".4" stroke-width="3"/>
 <g transform="translate(600 157) rotate(28 80 100)">
  <path d="M80 0C28 38 5 76 5 114a75 75 0 0 0 150 0C155 76 132 38 80 0Z" fill="#c9dda3"/>
  <path d="M80 39v185m0-119-34-27m34 27 34-27m-34 80-44-35m44 35 44-35" fill="none" stroke="#587d4e" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>
 </g>
 <path d="M306 385h412l-35 369a32 32 0 0 1-32 29H373a32 32 0 0 1-32-29Z" fill="#4e94be"/>
 <path d="m351 410 29 326h227l32-326" fill="#337da9"/>
 <path d="m341 421 28 304" stroke="#91c5df" stroke-width="9" stroke-linecap="round"/>
 <rect x="279" y="329" width="466" height="66" rx="22" fill="#9ccfe3"/>
 <path d="m305 329 30-42h354l30 42" fill="#c1e2eb"/>
 <path d="M453 286v-20h118v20" fill="none" stroke="#d4eced" stroke-width="20" stroke-linejoin="round"/>
 <svg x="397" y="444" width="230" height="230" viewBox="0 0 24 24" color="#f6f6ee">${recycleSymbol()}</svg>
 <circle cx="390" cy="791" r="30" fill="#102f23"/><circle cx="634" cy="791" r="30" fill="#102f23"/>
 <circle cx="390" cy="791" r="11" fill="#a5b99b"/><circle cx="634" cy="791" r="11" fill="#a5b99b"/>
 </svg>`;}
