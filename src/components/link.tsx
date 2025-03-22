'use client';

import { cn } from '@/lib/utils';
import { default as NextLink } from 'next/link';
import { AnchorHTMLAttributes, useState, useRef, useEffect } from 'react';
import { Url } from 'url';

type Props = {
  children: React.ReactNode;
  href: Url | string;
  image?: string; // Optional image URL for the tooltip
  showLinkOnTooltip?: boolean;
} & AnchorHTMLAttributes<HTMLAnchorElement>;

export default function Link(props: Props) {
  const { image, showLinkOnTooltip = true, ...linkProps } = props;
  const [showTooltip, setShowTooltip] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDesktop, setIsDesktop] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Check if the environment is desktop
  useEffect(() => {
    const checkIsDesktop = () => {
      setIsDesktop(window.matchMedia('(min-width: 768px)').matches);
    };

    checkIsDesktop();
    window.addEventListener('resize', checkIsDesktop);

    return () => window.removeEventListener('resize', checkIsDesktop);
  }, []);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (image && isDesktop) {
      // Get the tooltip dimensions for positioning
      const tooltipWidth = tooltipRef.current?.offsetWidth || 200;
      const tooltipHeight = tooltipRef.current?.offsetHeight || 150;

      // Position the tooltip with a small offset from the cursor
      setPosition({
        x: e.clientX + 15,
        y: e.clientY + 15,
      });

      // Adjust position if it would go off-screen
      const rightEdge = e.clientX + tooltipWidth + 20;
      const bottomEdge = e.clientY + tooltipHeight + 20;

      if (rightEdge > window.innerWidth) {
        setPosition((prev) => ({ ...prev, x: e.clientX - tooltipWidth - 10 }));
      }

      if (bottomEdge > window.innerHeight) {
        setPosition((prev) => ({ ...prev, y: e.clientY - tooltipHeight - 10 }));
      }
    }
  };

  return (
    <>
      <NextLink
        {...linkProps}
        className={cn(
          'underline decoration-primary hover:bg-primary hover:text-white hover:no-underline transition-all duration-100 px-0.5 -mx-0.5',
          props.className,
        )}
        onMouseEnter={() => isDesktop && image && setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onMouseMove={handleMouseMove}
      />
      {showTooltip && image && (
        <div
          ref={tooltipRef}
          className="fixed pointer-events-none z-50 rounded-md overflow-hidden shadow-lg bg-background"
          style={{
            left: `${position.x}px`,
            top: `${position.y}px`,
            transform: 'translate(0, 0)',
          }}
        >
          <img
            src={image}
            alt="Preview"
            className="max-w-[300px] max-h-[200px] object-contain bg-white p-1 border-0"
          />
          {/* link  */}
          {image && showLinkOnTooltip && (
            <div className="flex items-center px-2 pb-1">
              <div className="text-sm text-blue-700">{linkProps.href}</div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
