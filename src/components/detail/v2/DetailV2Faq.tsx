'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface FaqItem {
  question: string;
  answer: string;
}

interface DetailV2FaqProps {
  title: string;
  items: FaqItem[];
}

export default function DetailV2Faq({ title, items }: DetailV2FaqProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  if (items.length === 0) return null;

  return (
    <section className="mx-auto max-w-[1400px] px-4 pb-16 sm:px-6" aria-labelledby="detail-faq-heading">
      <div className="border-t border-white/[0.05] pt-10">
        <h2
          id="detail-faq-heading"
          className="mb-6 flex items-center gap-3 text-xs font-semibold uppercase tracking-widest text-zinc-500"
        >
          <span>FAQ about {title}</span>
          <span className="h-px flex-1 bg-white/[0.05]" />
        </h2>
        <div className="space-y-2">
          {items.map((item, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={item.question}
                className={`overflow-hidden rounded-xl border transition-colors duration-150 ${
                  isOpen
                    ? 'border-white/[0.10] bg-white/[0.05]'
                    : 'border-white/[0.05] bg-white/[0.02] hover:border-white/[0.08] hover:bg-white/[0.03]'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                  aria-expanded={isOpen}
                >
                  <span
                    className={`text-sm font-medium leading-snug transition-colors ${
                      isOpen ? 'text-white' : 'text-zinc-300'
                    }`}
                  >
                    {item.question}
                  </span>
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition-all duration-200 ${
                      isOpen ? 'bg-white/[0.12] text-white' : 'bg-white/[0.05] text-zinc-500'
                    }`}
                  >
                    <ChevronDown
                      className={`h-3.5 w-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                    />
                  </span>
                </button>
                {/* Every answer stays in the DOM — collapsing is visual only (grid-rows 0fr→1fr),
                    so crawlers read the whole FAQ instead of just the one open answer. */}
                <div
                  className={`grid transition-[grid-template-rows] duration-200 ease-out ${
                    isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                  }`}
                  aria-hidden={!isOpen}
                >
                  <div className="overflow-hidden">
                    <div className="border-t border-white/[0.06] px-5 py-4">
                      <p className="text-sm leading-relaxed text-zinc-400">{item.answer}</p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
