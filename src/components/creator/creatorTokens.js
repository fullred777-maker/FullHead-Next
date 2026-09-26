// Tokens visuais compartilhados da seção FullHead Creator
export const CREATOR = {
  accent: "#A855F7",
  accentDim: "#8B5FBF",
  accentBg: "rgba(168,85,247,0.08)",
  accentBorder: "rgba(168,85,247,0.25)",
  accentBgStrong: "rgba(168,85,247,0.14)",
};

export const MONO = "'Barlow Condensed', sans-serif";

export const CREATOR_STYLES = `
  @keyframes cr-in { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
  .cr-fade { animation: cr-in 0.3s ease both; }
  .cr-card { transition: border-color 0.2s, background 0.2s; }
  .cr-btn { transition: all 0.2s; cursor: pointer; }
  .cr-btn:active { transform: scale(0.98); }
  .cr-chevron { transition: transform 0.2s; }
`;

