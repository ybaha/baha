'use client';

import { useState } from 'react';
import { TranslateIcon } from '@phosphor-icons/react/dist/ssr';

export function OriginQuote({ original }: { original: string }) {
  const [english, setEnglish] = useState(false);
  const [sequence, setSequence] = useState(0);
  const text = english ? 'Let’s see if this becomes a good website.' : original;
  const words = text.split(' ');
  return (
    <div className="mt-2 flex items-start gap-2">
      <p
        lang={english ? 'en' : 'tr'}
        className="mb-0 min-w-0 font-serif text-quote italic text-subtle @xl:text-[20px] @xl:leading-snug"
      >
        <span className="sr-only" aria-live="polite">{text}</span>
        <span key={`${english}-${sequence}`} aria-hidden="true" data-quote-language={english ? 'en' : 'tr'}>
          {words.map((word, index) => (
            <span key={index}>
              <span
                className={`inline-block ${sequence ? 'motion-safe:animate-quote-pop' : ''}`}
                style={{ animationDelay: `${index * 35}ms` }}
              >
                {index === 0 ? '“' : ''}
                {word}
                {index === words.length - 1 ? '”' : ''}
              </span>
              {index < words.length - 1 ? ' ' : ''}
            </span>
          ))}
        </span>
      </p>
      <button
        type="button"
        aria-label={english ? 'Show original Turkish quote' : 'Translate quote to English'}
        aria-pressed={english}
        title={english ? 'Türkçe' : 'Translate to English'}
        onClick={() => {
          setEnglish((value) => !value);
          setSequence((value) => value + 1);
        }}
        className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-md bg-foreground/[0.035] text-subtle [box-shadow:var(--lt-e1)] transition-colors hover:bg-primary/10 hover:text-content focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <TranslateIcon size={15} aria-hidden="true" />
      </button>
    </div>
  );
}
