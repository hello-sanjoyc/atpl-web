"use client";

import { useLayoutEffect, useRef, useState } from "react";

const CANVAS_SIZE = 1254;

export function ImacMockup({ src, alt }: { src: string; alt: string }) {
    const container = useRef<HTMLDivElement>(null);
    const [scale, setScale] = useState(0);

    useLayoutEffect(() => {
        const element = container.current;
        if (!element) return;

        // Scale both layers together; the perspective is calibrated in asset pixels.
        const updateScale = () => setScale(element.clientWidth / CANVAS_SIZE);
        updateScale();
        const observer = new ResizeObserver(updateScale);
        observer.observe(element);
        return () => observer.disconnect();
    }, []);

    return (
        <div className="imac-mockup" ref={container}>
            <div className="imac-canvas" style={{ transform: `scale(${scale})` }}>
                <img src={src} alt={alt} className="imac-screen" width={1254} height={705} />
                <img src="/assets/images/casestudies/imac.webp" alt="" aria-hidden="true" className="imac-frame" width={1254} height={1254} />
            </div>
        </div>
    );
}
