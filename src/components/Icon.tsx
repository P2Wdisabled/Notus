"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type SvgProps = React.SVGProps<SVGSVGElement>;

const Menu: React.FC<SvgProps> = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M4 6h16" />
    <path d="M4 12h16" />
    <path d="M4 18h16" />
  </svg>
);

const Filter: React.FC<SvgProps> = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M4 5h16" />
    <path d="M8 12h8" />
    <path d="M10 19h4" />
  </svg>
);

const Search: React.FC<SvgProps> = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="11" cy="11" r="8" />
    <path d="M21 21l-4.35-4.35" />
  </svg>
);

const Bell: React.FC<SvgProps> = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M6 8a6 6 0 0112 0v5l2 3H4l2-3V8" />
    <path d="M13.73 21a2 2 0 01-3.46 0" />
  </svg>
);

const X: React.FC<SvgProps> = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const Home: React.FC<SvgProps> = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

const Clock: React.FC<SvgProps> = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 3" />
  </svg>
);

const Note: React.FC<SvgProps> = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
    <path d="M8 7h8" />
    <path d="M8 11h8" />
  </svg>
);

const Share: React.FC<SvgProps> = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="18" cy="5" r="3" />
    <circle cx="6" cy="12" r="3" />
    <circle cx="18" cy="19" r="3" />
    <path d="M8.59 13.51l6.83 3.98" />
    <path d="M15.41 6.51L8.59 10.49" />
  </svg>
);

const Star: React.FC<SvgProps> = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
  </svg>
);

const Folder: React.FC<SvgProps> = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M3 7a2 2 0 012-2h4l2 2h6a2 2 0 012 2v7a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
  </svg>
);

const Trash: React.FC<SvgProps> = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
    <path d="M10 11v6" />
    <path d="M14 11v6" />
    <path d="M9 6V4a2 2 0 012-2h2a2 2 0 012 2v2" />
  </svg>
);

const Gear: React.FC<SvgProps> = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a1.998 1.998 0 010 2.83 1.998 1.998 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a1.998 1.998 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
  </svg>
);

const Plus: React.FC<SvgProps> = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M12 4v16m8-8H4" />
  </svg>
);

const Check: React.FC<SvgProps> = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M5 13l4 4L19 7" />
  </svg>
);

const Favorite: React.FC<SvgProps> = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
  </svg>
);

const FavoriteSolid: React.FC<SvgProps> = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" stroke="none" {...props}>
    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
  </svg>
);

// UI utility icons
const Spinner: React.FC<SvgProps> = (props) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}>
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
  </svg>
);

const Pencil: React.FC<SvgProps> = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z" />
    <path d="M20.71 7.04a1.003 1.003 0 000-1.42l-2.34-2.34a1.003 1.003 0 00-1.42 0l-1.83 1.83 3.75 3.75 1.84-1.82z" />
  </svg>
);

const ImageIcon: React.FC<SvgProps> = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
  </svg>
);

const LinkIcon: React.FC<SvgProps> = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z" />
  </svg>
);

const Undo: React.FC<SvgProps> = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M12.5 8c-2.65 0-5.05.99-6.9 2.6L2 7v9h9l-3.62-3.62c1.39-1.16 3.16-1.88 5.12-1.88 3.54 0 6.55 2.31 7.6 5.5l2.37-.78C21.08 11.03 17.15 8 12.5 8z" />
  </svg>
);

const Redo: React.FC<SvgProps> = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M18.4 10.6C16.55 8.99 14.15 8 11.5 8c-4.65 0-8.58 3.03-9.96 7.22L3.9 16c1.05-3.19 4.05-5.5 7.6-5.5 1.95 0 3.73.72 5.12 1.88L13 16h9V7l-3.6 3.6z" />
  </svg>
);

const Align: React.FC<SvgProps> = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M3 21h18v-2H3v2zm0-4h18v-2H3v2zm0-4h18v-2H3v2zm0-4h18V7H3v2zm0-6v2h18V3H3z" />
  </svg>
);

const AlignLeft: React.FC<SvgProps> = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} {...props}>
    <path d="M4 18h10" />
    <path d="M4 14h16" />
    <path d="M4 10h10" />
    <path d="M4 6h16" />
  </svg>
);

const AlignCenter: React.FC<SvgProps> = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} {...props}>
    <path d="M17 18H7" />
    <path d="M20 14H4" />
    <path d="M17 10H7" />
    <path d="M20 6H4" />
  </svg>
);

const AlignRight: React.FC<SvgProps> = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} {...props}>
    <path d="M20 18H10" />
    <path d="M20 14H4" />
    <path d="M20 10H10" />
    <path d="M20 6H4" />
  </svg>
);

const AlignJustify: React.FC<SvgProps> = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} {...props}>
    <path d="M20 18H4" />
    <path d="M20 14H4" />
    <path d="M20 10H4" />
    <path d="M20 6H4" />
  </svg>
);

const List: React.FC<SvgProps> = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z" />
  </svg>
);

const ListBulleted: React.FC<SvgProps> = (props) => (
  <svg viewBox="0 0 16 16" fill="currentColor" {...props}>
    <path fillRule="evenodd" d="M5 11.5a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5m0-4a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5m0-4a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5m-3 1a1 1 0 1 0 0-2a1 1 0 0 0 0 2m0 4a1 1 0 1 0 0-2a1 1 0 0 0 0 2m0 4a1 1 0 1 0 0-2a1 1 0 0 0 0 2" />
  </svg>
);

const ListNumbered: React.FC<SvgProps> = (props) => (
  <svg viewBox="0 0 16 16" fill="currentColor" {...props}>
    <g>
      <path fillRule="evenodd" d="M5 11.5a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5m0-4a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5m0-4a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5" />
      <path d="M1.713 11.865v-.474H2c.217 0 .363-.137.363-.317c0-.185-.158-.31-.361-.31c-.223 0-.367.152-.373.31h-.59c.016-.467.373-.787.986-.787c.588-.002.954.291.957.703a.595.595 0 0 1-.492.594v.033a.615.615 0 0 1 .569.631c.003.533-.502.8-1.051.8c-.656 0-1-.37-1.008-.794h.582c.008.178.186.306.422.309c.254 0 .424-.145.422-.35c-.002-.195-.155-.348-.414-.348h-.3zm-.004-4.699h-.604v-.035c0-.408.295-.844.958-.844c.583 0 .96.326.96.756c0 .389-.257.617-.476.848l-.537.572v.03h1.054V9H1.143v-.395l.957-.99c.138-.142.293-.304.293-.508c0-.18-.147-.32-.342-.32a.33.33 0 0 0-.342.338zM2.564 5h-.635V2.924h-.031l-.598.42v-.567l.629-.443h.635z" />
    </g>
  </svg>
);

const Heading: React.FC<SvgProps> = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M10.5 20V7H5V4h14v3h-5.5v13z" />
  </svg>
);

const Quote: React.FC<SvgProps> = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M6 17h3l2-4V7H5v6h3zm8 0h3l2-4V7h-6v6h3z" />
  </svg>
);

const Minus: React.FC<SvgProps> = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M3 11h18v2H3z" />
  </svg>
);

const DotsVertical: React.FC<SvgProps> = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <circle cx="12" cy="5" r="2" />
    <circle cx="12" cy="12" r="2" />
    <circle cx="12" cy="19" r="2" />
  </svg>
);

const DotsHorizontal: React.FC<SvgProps> = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <circle cx="5" cy="12" r="2" />
    <circle cx="12" cy="12" r="2" />
    <circle cx="19" cy="12" r="2" />
  </svg>
);

const TextColor: React.FC<SvgProps> = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M9.62 12L12 5.67 14.38 12M11 3L5.5 17h2.25l1.12-3h6.25l1.12 3h2.25L13 3h-2z" />
  </svg>
);

const Highlighter: React.FC<SvgProps> = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M17.75 7L14 3.25l-10 10V17h3.75l10-10zm2.96-2.96a.996.996 0 000-1.41L18.37.29a.996.996 0 00-1.41 0L15 2.25 18.75 6l1.96-1.96z" />
    <path fillOpacity=".36" d="M0 20h24v4H0z" />
  </svg>
);

const Indent: React.FC<SvgProps> = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M3 21h18v-2H3v2zM3 8v8l4-4-4-4zm8 9h10v-2H11v2zM3 5v2h18V5H3z" />
  </svg>
);

const Outdent: React.FC<SvgProps> = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M3 21h18v-2H3v2zM7 8v8l-4-4 4-4zm4 9h10v-2H11v2zM3 5v2h18V5H3z" />
  </svg>
);

const Lock: React.FC<SvgProps> = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M12 15v2" />
    <path d="M6 21h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
    <path d="M16 11V7a4 4 0 00-8 0v4h8z" />
  </svg>
);

const DocumentIcon: React.FC<SvgProps> = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const Alert: React.FC<SvgProps> = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M12 9v2" />
    <path d="M12 15h.01" />
    <path d="M5.062 21h13.876c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 18.5C2.962 19.333 3.924 21 5.062 21z" />
  </svg>
);

const Users: React.FC<SvgProps> = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const Dashboard: React.FC<SvgProps> = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
    <path d="M8 5a2 2 0 012-2h4a2 2 0 012 2v6H8V5z" />
  </svg>
);

const CircleCheck: React.FC<SvgProps> = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M9 12l2 2 4-4" />
    <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const ShieldCheck: React.FC<SvgProps> = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M9 12l2 2 4-4" />
    <path d="M20.618 6.984A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);

// Text style icons
const Bold: React.FC<SvgProps> = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M15.6 10.79c.97-.67 1.65-1.77 1.65-2.79 0-2.26-1.75-4-4-4H7v14h7.04c2.09 0 3.71-1.7 3.71-3.79 0-1.52-.86-2.82-2.15-3.42zM10 6.5h3c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5h-3v-3zm3.5 9H10v-3h3.5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5z" />
  </svg>
);

const Italic: React.FC<SvgProps> = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M10 4v3h2.21l-3.42 8H6v3h8v-3h-2.21l3.42-8H18V4z" />
  </svg>
);

const Underline: React.FC<SvgProps> = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M12 17c3.31 0 6-2.69 6-6V3h-2.5v8c0 1.93-1.57 3.5-3.5 3.5S8.5 12.93 8.5 11V3H6v8c0 3.31 2.69 6 6 6zm-7 2v2h14v-2H5z" />
  </svg>
);

const Strikethrough: React.FC<SvgProps> = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M10 19h4v-3h-4v3zM5 4v3h5v3h4V7h5V4H5zM3 14h18v-2H3v2z" />
  </svg>
);

const Calendar: React.FC<SvgProps> = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const ArrowLeft: React.FC<SvgProps> = (props) => (
  <svg viewBox="0 0 20 20" fill="currentColor" {...props}>
    <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
  </svg>
);

const ChevronDown: React.FC<SvgProps> = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M6 9l6 6 6-6" />
  </svg>
);

const Moon: React.FC<SvgProps> = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
);

const Sun: React.FC<SvgProps> = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
    <circle cx="12" cy="12" r="5" />
    <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
  </svg>
);

const UserListBadge: React.FC<SvgProps> = (props) => (
  <svg width="11" height="11" viewBox="0 0 11 11" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <g clipPath="url(#clip0_735_16645)">
      <rect x="1" y="1" width="9" height="9" className="fill-[var(--background)]" />
      <path
        d="M8.07723 3.45456L2.92254 3.45456C2.87035 3.45472 2.8192 3.46845 2.77458 3.49428C2.72996 3.52011 2.69357 3.55706 2.66933 3.60116C2.64509 3.64525 2.63391 3.69482 2.637 3.74452C2.64009 3.79422 2.65732 3.84218 2.68686 3.88324L5.2642 7.43502C5.37102 7.58229 5.62818 7.58229 5.73528 7.43502L8.31263 3.88324C8.34246 3.84227 8.35996 3.79429 8.36321 3.7445C8.36647 3.69471 8.35536 3.64503 8.3311 3.60084C8.30683 3.55665 8.27034 3.51965 8.22558 3.49387C8.18083 3.46808 8.12952 3.45448 8.07723 3.45456Z"
        className="fill-[var(--foreground)]"
      />
    </g>
    <rect
      x="10.5"
      y="10.5"
      width="10"
      height="10"
      rx="1.5"
      transform="rotate(-180 10.5 10.5)"
      className="stroke-[var(--foreground)]"
    />
    <defs>
      <clipPath id="clip0_735_16645">
        <rect x="10" y="10" width="9" height="9" rx="1" transform="rotate(-180 10 10)" fill="white" />
      </clipPath>
    </defs>
  </svg>
);

const Eye: React.FC<SvgProps> = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

const EyeOff: React.FC<SvgProps> = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029" />
    <path d="M9.878 9.878a3 3 0 114.243 4.243" />
    <path d="M9.878 9.878L3 3m6.878 6.878L21 21" />
  </svg>
);

const Google: React.FC<SvgProps> = (props) => (
  <svg viewBox="0 0 24 24" {...props}>
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
);

const ChartBar: React.FC<SvgProps> = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <line x1="12" y1="20" x2="12" y2="10" />
    <line x1="18" y1="20" x2="18" y2="4" />
    <line x1="6" y1="20" x2="6" y2="16" />
  </svg>
);

const Inbox: React.FC<SvgProps> = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M22 12h-6l-2 3h-4l-2-3H2" />
    <path d="M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z" />
  </svg>
);

export const ICONS = {
  menu: Menu,
  filter: Filter,
  search: Search,
  bell: Bell,
  x: X,
  home: Home,
  clock: Clock,
  note: Note,
  share: Share,
  star: Star,
  folder: Folder,
  trash: Trash,
  gear: Gear,
  plus: Plus,
  check: Check,
  favorite: Favorite,
  favoriteSolid: FavoriteSolid,
  spinner: Spinner,
  pencil: Pencil,
  image: ImageIcon,
  link: LinkIcon,
  undo: Undo,
  redo: Redo,
  align: Align,
  alignLeft: AlignLeft,
  alignCenter: AlignCenter,
  alignRight: AlignRight,
  alignJustify: AlignJustify,
  list: List,
  listBulleted: ListBulleted,
  listNumbered: ListNumbered,
  heading: Heading,
  quote: Quote,
  minus: Minus,
  dotsVertical: DotsVertical,
  dotsHorizontal: DotsHorizontal,
  textColor: TextColor,
  highlighter: Highlighter,
  indent: Indent,
  outdent: Outdent,
  lock: Lock,
  document: DocumentIcon,
  users: Users,
  dashboard: Dashboard,
  circleCheck: CircleCheck,
  shieldCheck: ShieldCheck,
  bold: Bold,
  italic: Italic,
  underline: Underline,
  strikethrough: Strikethrough,
  alert: Alert,
  calendar: Calendar,
  arrowLeft: ArrowLeft,
  chevronDown: ChevronDown,
  moon: Moon,
  sun: Sun,
  // arrows/actions
  logout: (props: SvgProps) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M16 17l5-5-5-5" />
      <path d="M21 12H9" />
      <path d="M13 21H6a2 2 0 01-2-2V5a2 2 0 012-2h7" />
    </svg>
  ),
  eye: Eye,
  eyeOff: EyeOff,
  google: Google,
  userListBadge: UserListBadge,
  chartBar: ChartBar,
  inbox: Inbox,
} as const;

export type IconName = keyof typeof ICONS;
export const iconNames = Object.keys(ICONS) as IconName[];

interface IconProps extends React.SVGProps<SVGSVGElement> {
  name: IconName;
  title?: string;
  className?: string;
}

export default function Icon({ name, title, className, ...rest }: IconProps) {
  const Svg = ICONS[name];
  const accessibilityProps: Partial<SvgProps> = title
    ? { role: "img", "aria-label": title }
    : { "aria-hidden": true };

  return (
    <Svg
      className={cn("inline-block align-middle", className)}
      {...accessibilityProps}
      {...rest}
    />
  );
}


