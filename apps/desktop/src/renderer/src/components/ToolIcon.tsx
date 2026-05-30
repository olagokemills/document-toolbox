const iconProps = {
  xmlns: 'http://www.w3.org/2000/svg',
  viewBox: '0 0 20 20',
  width: 20,
  height: 20,
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

export function IconMerge() {
  return <svg {...iconProps} aria-hidden="true"><rect x="2" y="2" width="7" height="9" rx="1.2" /><rect x="11" y="2" width="7" height="9" rx="1.2" /><path d="M5.5 11v2.5L10 17l4.5-3.5V11" /></svg>
}
export function IconSplit() {
  return <svg {...iconProps} aria-hidden="true"><rect x="5" y="2" width="10" height="7" rx="1.2" /><path d="M10 9v2M10 11l-4 3.5V17M10 11l4 3.5V17" /><rect x="2" y="14" width="6" height="4" rx="1" /><rect x="12" y="14" width="6" height="4" rx="1" /></svg>
}
export function IconReorder() {
  return <svg {...iconProps} aria-hidden="true"><rect x="2" y="10" width="7" height="8" rx="1.2" /><rect x="11" y="10" width="7" height="8" rx="1.2" /><rect x="2" y="2" width="7" height="6" rx="1.2" /><rect x="11" y="2" width="7" height="6" rx="1.2" opacity="0.4" /></svg>
}
export function IconDeletePages() {
  return <svg {...iconProps} aria-hidden="true"><rect x="3" y="2" width="11" height="14" rx="1.5" /><path d="M14 7h3v9a1 1 0 01-1 1H6" /><path d="M7.5 6.5l4 4M11.5 6.5l-4 4" /></svg>
}
export function IconRotate() {
  return <svg {...iconProps} aria-hidden="true"><path d="M16.5 3.5A8 8 0 1117.9 8" /><path d="M18 3.5h-2.5V6" /><rect x="6" y="7" width="8" height="8" rx="1.2" /></svg>
}
export function IconExtract() {
  return <svg {...iconProps} aria-hidden="true"><rect x="3" y="3" width="10" height="13" rx="1.5" /><path d="M13 7h4v10H7v-3" /><path d="M9 10l4-4m0 0h-3m3 0v3" /></svg>
}
export function IconImagesToPDF() {
  return <svg {...iconProps} aria-hidden="true"><rect x="2" y="5" width="9" height="7" rx="1.2" /><path d="M2 9.5l2.5-2 2 2 2-2.5 2.5 2" /><rect x="12" y="3" width="6" height="14" rx="1.5" /><path d="M14 7h2M14 10h2M14 13h2" /></svg>
}
export function IconPDFToImages() {
  return <svg {...iconProps} aria-hidden="true"><rect x="2" y="3" width="6" height="14" rx="1.5" /><path d="M4 7h2M4 10h2M4 13h2" /><rect x="10" y="4" width="9" height="6" rx="1.2" /><rect x="10" y="12" width="9" height="6" rx="1.2" /></svg>
}
export function IconWatermark() {
  return <svg {...iconProps} aria-hidden="true"><rect x="3" y="2" width="12" height="16" rx="1.5" /><path d="M6.5 13.5l7-7" strokeOpacity="0.5" /><path d="M5.5 11.5l7-7" /><path d="M7.5 14.5l5.5-5.5" strokeOpacity="0.3" /></svg>
}
export function IconRemoveMetadata() {
  return <svg {...iconProps} aria-hidden="true"><rect x="3" y="2" width="10" height="13" rx="1.5" /><path d="M6 6h4M6 9h4M6 12h2" /><path d="M13 13.5l4 4M17 13.5l-4 4" /></svg>
}
export function IconWordToPDF() {
  return <svg {...iconProps} aria-hidden="true"><rect x="2" y="2" width="9" height="12" rx="1.5" /><path d="M4 6h5M4 9h5M4 12h3" /><path d="M13 8h5v10H8v-3" /><path d="M15 11l2 4M17 11l-2 4M16 11v4" /></svg>
}
export function IconPPTXToPDF() {
  return <svg {...iconProps} aria-hidden="true"><rect x="2" y="4" width="12" height="9" rx="1.5" /><circle cx="7" cy="8.5" r="2" /><path d="M14 7h4v11H5v-3" /></svg>
}
export function IconExcelToPDF() {
  return <svg {...iconProps} aria-hidden="true"><rect x="2" y="2" width="11" height="13" rx="1.5" /><path d="M5 5h5M5 8h5M5 11h5" /><path d="M13 9h5v9H8v-3" /><path d="M15.5 12l2.5 3M18 12l-2.5 3" /></svg>
}
export function IconHTMLToPDF() {
  return <svg {...iconProps} aria-hidden="true"><path d="M6 5L2 10l4 5" /><path d="M9 4l2 12" /><path d="M14 5l4 5-4 5" /><rect x="11" y="9" width="8" height="9" rx="1.5" /></svg>
}
export function IconPDFToJPG() {
  return <svg {...iconProps} aria-hidden="true"><rect x="2" y="2" width="7" height="10" rx="1.5" /><path d="M4 6h3M4 9h3" /><rect x="10" y="5" width="9" height="7" rx="1.2" /><path d="M10 9l2.5-2 2 2 2-2L17 9" /></svg>
}
export function IconPDFToWord() {
  return <svg {...iconProps} aria-hidden="true"><rect x="2" y="2" width="7" height="12" rx="1.5" /><path d="M4 6h3M4 9h3M4 12h2" /><path d="M11 8h7v10H6v-3" /><path d="M13 11l2 4M17 11l-2 4M15 11v4" /></svg>
}
export function IconPDFToPPTX() {
  return <svg {...iconProps} aria-hidden="true"><rect x="2" y="2" width="7" height="12" rx="1.5" /><path d="M4 6h3M4 9h3M4 12h2" /><rect x="10" y="5" width="9" height="7" rx="1.5" /><circle cx="14.5" cy="8.5" r="1.5" /></svg>
}
export function IconPDFToExcel() {
  return <svg {...iconProps} aria-hidden="true"><rect x="2" y="2" width="7" height="12" rx="1.5" /><path d="M4 6h3M4 9h3M4 12h2" /><rect x="10" y="5" width="9" height="11" rx="1.5" /><path d="M12 8h5M12 11h5M12 14h3" /></svg>
}
export function IconPDFToPDFA() {
  return <svg {...iconProps} aria-hidden="true"><rect x="2" y="2" width="11" height="14" rx="1.5" /><path d="M5 6h5M5 9h5M5 12h3" /><path d="M14 10l2-4 2 4M14.8 8.5h2.4" /><path d="M13 16h6" /></svg>
}
export function IconLock() {
  return <svg {...iconProps} aria-hidden="true"><rect x="4" y="9" width="12" height="9" rx="1.5" /><path d="M7 9V6.5a3 3 0 016 0V9" /><circle cx="10" cy="13.5" r="1.25" fill="currentColor" stroke="none" /><path d="M10 14.75v1.5" strokeWidth="1.5" /></svg>
}
export function IconUnlock() {
  return <svg {...iconProps} aria-hidden="true"><rect x="4" y="9" width="12" height="9" rx="1.5" /><path d="M7 9V6.5a3 3 0 016 0" /><circle cx="10" cy="13.5" r="1.25" fill="currentColor" stroke="none" /><path d="M10 14.75v1.5" strokeWidth="1.5" /></svg>
}
