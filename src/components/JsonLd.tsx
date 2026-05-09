/**
 * JSON-LD script tag emitter.
 *
 * Server component that serialises the data with ``JSON.stringify``
 * and renders a single ``<script type="application/ld+json">``.
 * Using ``dangerouslySetInnerHTML`` is necessary because React
 * otherwise text-encodes the JSON (e.g. ``"`` → ``&quot;``), which
 * Google's parser will reject.
 *
 * The ``id`` prop is optional but useful when a page has multiple
 * JSON-LD blocks — gives each its own ``<script id="...">`` so
 * downstream code can target them individually.
 */
export function JsonLd({
    data,
    id,
}: {
    data: Record<string, unknown> | Record<string, unknown>[];
    id?: string;
}) {
    return (
        <script
            type="application/ld+json"
            id={id}
            dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
        />
    );
}
