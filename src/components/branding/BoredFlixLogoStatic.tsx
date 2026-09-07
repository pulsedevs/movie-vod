import {
  BoredFlixCouchGraphic,
  BoredFlixPlayGraphic,
  LOGO_TEXT_BORED,
  LOGO_TEXT_FLIX,
  LOGO_VIEWBOX,
  LOGO_WORDMARK_X,
} from './boredFlixLogoMarkup';
import { LOGO_FONT_FAMILY, boredFlixLogoFont } from './boredFlixLogoFont';

interface BoredFlixLogoStaticProps {
  className?: string;
}

/** Non-animated lockup — header, detail bar, etc. */
export default function BoredFlixLogoStatic({ className = 'h-6 w-auto' }: BoredFlixLogoStaticProps) {
  return (
    <span className={`inline-flex shrink-0 ${boredFlixLogoFont.className}`}>
      <svg
        viewBox={LOGO_VIEWBOX}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`block ${className}`}
        aria-hidden="true"
      >
        <BoredFlixCouchGraphic />
        <BoredFlixPlayGraphic />
        <text
          x={LOGO_WORDMARK_X}
          y="72"
          fontFamily={LOGO_FONT_FAMILY}
          fontSize="56"
          fontWeight="700"
          style={{ letterSpacing: '-1.5px' }}
          textRendering="optimizeLegibility"
        >
          <tspan fill={LOGO_TEXT_BORED}>Bored</tspan>
          <tspan fill={LOGO_TEXT_FLIX}>Flix</tspan>
        </text>
      </svg>
    </span>
  );
}
