export const LOGO_VIEWBOX    = '0 0 400 90';
/** Gap between couch lockup and wordmark */
export const LOGO_WORDMARK_X = 110;
export const BOREDFLIX_WORDMARK = 'BoredFlix';

/** Wordmark — white Bored + warm cream Flix (matches search accent, not loud orange). */
export const LOGO_TEXT_BORED       = '#F5F5F4';
export const LOGO_TEXT_FLIX        = '#E2D4BE';
export const LOGO_TEXT_BORED_HOVER = '#FFFFFF';
export const LOGO_TEXT_FLIX_HOVER  = '#FDBA74';

/** Burgundy tufted couch — classic BoredFlix palette from icon lockup. */
export const LOGO_COUCH_LEG        = '#521010';
export const LOGO_COUCH_BACK       = '#8B1C1C';
export const LOGO_COUCH_SEAT       = '#9E2020';
export const LOGO_COUCH_ARM        = '#731717';
export const LOGO_COUCH_BACK_HIGHLIGHT = '#C03030';

/** Couch back panel — play control is centered on this rect */
export const LOGO_COUCH_BACK_X = 11;
export const LOGO_COUCH_BACK_Y = 20;
export const LOGO_COUCH_BACK_W = 88;
export const LOGO_COUCH_BACK_H = 47;
export const LOGO_PLAY_CX = LOGO_COUCH_BACK_X + LOGO_COUCH_BACK_W / 2;
/** Nudged slightly above geometric center of couch back */
export const LOGO_PLAY_OFFSET_Y = -2.5;
export const LOGO_PLAY_CY = LOGO_COUCH_BACK_Y + LOGO_COUCH_BACK_H / 2 + LOGO_PLAY_OFFSET_Y;
export const LOGO_PLAY_PAD_R = 14;
export const LOGO_PLAY_RING_R = 13;

/** Play control — burgundy pad + highlight ring; cream play icon */
export const LOGO_PLAY_PAD          = LOGO_COUCH_LEG;
export const LOGO_PLAY_FILL         = LOGO_TEXT_FLIX;
export const LOGO_PLAY_STROKE       = LOGO_COUCH_BACK_HIGHLIGHT;
export const LOGO_PLAY_HOVER_FILL   = '#FFF9F3';
export const LOGO_PLAY_HOVER_STROKE = '#E05050';

export function BoredFlixCouchGraphic() {
  return (
    <>
      <rect x="30" y="72" width="11" height="14" rx="3" fill={LOGO_COUCH_LEG} />
      <rect x="76" y="72" width="11" height="14" rx="3" fill={LOGO_COUCH_LEG} />
      <rect x="11" y="20" width="88" height="47" rx="13" fill={LOGO_COUCH_BACK} />
      <rect x="14" y="22" width="82" height="4" rx="2" fill={LOGO_COUCH_BACK_HIGHLIGHT} opacity="0.38" />
      <rect x="16" y="56" width="78" height="18" rx="8" fill={LOGO_COUCH_SEAT} />
      <rect x="17" y="57" width="76" height="3" rx="1.5" fill="#BF2B2B" opacity="0.4" />
      <path
        d="M 6,65 Q 6,74 13,74 Q 20,74 20,65 L 20,54 Q 20,38 13,36 Q 6,38 6,54 Z"
        fill={LOGO_COUCH_ARM}
      />
      <path
        d="M 104,65 Q 104,74 97,74 Q 90,74 90,65 L 90,54 Q 90,38 97,36 Q 104,38 104,54 Z"
        fill={LOGO_COUCH_ARM}
      />
    </>
  );
}

export function BoredFlixPlayGraphic({ highlight = false }: { highlight?: boolean }) {
  const fill = highlight ? LOGO_PLAY_HOVER_FILL : LOGO_PLAY_FILL;
  const stroke = highlight ? LOGO_PLAY_HOVER_STROKE : LOGO_PLAY_STROKE;
  const cx = LOGO_PLAY_CX;
  const cy = LOGO_PLAY_CY;
  const triLeft = cx - 4;
  const triTip = cx + 9;
  const triTop = cy - 7.5;
  const triBottom = cy + 7.5;

  return (
    <>
      <circle cx={cx} cy={cy} r={LOGO_PLAY_PAD_R} fill={LOGO_PLAY_PAD} />
      <circle
        cx={cx}
        cy={cy}
        r={LOGO_PLAY_RING_R}
        fill="none"
        stroke={stroke}
        strokeWidth="1.5"
        opacity={highlight ? 1 : 0.92}
      />
      <polygon
        points={`${triLeft},${triTop} ${triLeft},${triBottom} ${triTip},${cy}`}
        fill={fill}
      />
    </>
  );
}
