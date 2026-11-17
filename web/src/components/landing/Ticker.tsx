export function Ticker({ items }: { items: string[] }) {
    return (
        <div className="marquee-wrap" aria-hidden="true" role="presentation">
            <div className="marquee-track">
                {[...items, ...items].map((item, index) => (
                    <span className="mi" key={`${item}-${index}`}>
                        {item}
                        <span className="mi-dot" />
                    </span>
                ))}
            </div>
        </div>
    );
}
