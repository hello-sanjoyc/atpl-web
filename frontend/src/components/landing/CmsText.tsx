import { Fragment } from "react";

export function CmsText({ text }: { text: string }) {
    const lines = text.split("\n");

    return lines.map((line, lineIndex) => (
        <Fragment key={`${line}-${lineIndex}`}>
            {line.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g).map((segment, segmentIndex) =>
                segment.startsWith("**") && segment.endsWith("**") ? (
                    <strong key={`${segment}-${segmentIndex}`}>
                        {segment.slice(2, -2)}
                    </strong>
                ) : segment.startsWith("*") && segment.endsWith("*") ? (
                    <em key={`${segment}-${segmentIndex}`}>
                        {segment.slice(1, -1)}
                    </em>
                ) : (
                    <Fragment key={`${segment}-${segmentIndex}`}>
                        {segment}
                    </Fragment>
                ),
            )}
            {lineIndex < lines.length - 1 ? <br /> : null}
        </Fragment>
    ));
}
