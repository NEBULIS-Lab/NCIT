import {useEffect, useRef, type ReactNode} from 'react';

export default function Spotlight({children,className=''}:{children:ReactNode;className?:string}) {
  const container = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = container.current;
    if (!element) return;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const fine = matchMedia('(hover: hover) and (pointer: fine)');
    let frame = 0, x = 0, y = 0;
    const move = (event:PointerEvent) => {
      if (reduced.matches || !fine.matches) return;
      x = event.clientX; y = event.clientY;
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        for (const child of element.children) {
          const box = child as HTMLElement, rect = box.getBoundingClientRect();
          box.style.setProperty('--mouse-x', `${x - rect.left}px`);
          box.style.setProperty('--mouse-y', `${y - rect.top}px`);
        }
      });
    };
    element.addEventListener('pointermove',move,{passive:true});
    return () => {element.removeEventListener('pointermove',move);cancelAnimationFrame(frame)};
  },[]);
  return <div className={className} ref={container}>{children}</div>;
}
