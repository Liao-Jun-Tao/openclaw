let segmenter: Intl.Segmenter | null = null;

export function getGraphemeSegmenter(): Intl.Segmenter {
  if (!segmenter) {
    segmenter = new Intl.Segmenter(undefined, { granularity: "grapheme" });
  }
  return segmenter;
}
