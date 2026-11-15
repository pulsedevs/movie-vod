import Image from 'next/image';
import { LOGO_COUCH_SRC } from './boredFlixLogoMarkup';

interface BoredFlixLogoStaticProps {
  className?: string;
}

/** Non-animated logo (header, detail bar, etc.): the yellow couch icon alone, no wordmark.
 *  Size it with a height class; the width follows (the art is 1.6:1). */
export default function BoredFlixLogoStatic({ className = 'h-6 w-auto' }: BoredFlixLogoStaticProps) {
  return (
    <Image
      src={LOGO_COUCH_SRC}
      alt="BoredFlix"
      width={320}
      height={199}
      priority
      unoptimized
      draggable={false}
      className={`block shrink-0 select-none ${className}`}
    />
  );
}
