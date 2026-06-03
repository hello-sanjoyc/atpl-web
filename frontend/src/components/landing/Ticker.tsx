import { marqueeItems } from "./data";

export function Ticker() {
    return (
        <div className="marquee-wrap" aria-hidden="true" role="presentation">
            <div className="marquee-track">
                {[...marqueeItems, ...marqueeItems].map((item, index) => (
                    <span className="mi" key={`${item}-${index}`}>
                        {item}
                        <span className="mi-dot" />
                    </span>
                ))}
            </div>
        </div>
    );
}
