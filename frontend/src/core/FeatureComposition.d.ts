export interface FeatureLike {
  id: string;
  stat?: string;
  line?: number | string;
  confidence?: number | string;
  alternativeProps?: AlternativePropInput[];
  [key: string]: unknown;
}

export interface AlternativePropInput {
  id?: string;
  stat?: string;
  line?: number | string;
  confidence?: number | string;
  overOdds?: number | string;
  underOdds?: number | string;
  [key: string]: unknown;
}

export interface AlternativeProp
  extends Omit<AlternativePropInput, 'id' | 'stat' | 'line' | 'confidence'> {
  id: string;
  stat: string;
  line: number;
  confidence: number;
  overOdds?: number;
  underOdds?: number;
}

export interface MergeOptions {
  preferIncoming?: boolean;
}

export type MergeResult<T extends FeatureLike = FeatureLike> = Omit<T, 'alternativeProps'> & {
  alternativeProps: AlternativeProp[];
  topConfidence: number;
};

export function mergeAlternativeProps<T extends FeatureLike>(
  base: T,
  alternatives?: AlternativePropInput[],
  options?: MergeOptions
): MergeResult<T>;

export function computeTopConfidence(
  items: Array<number | { confidence?: number | string | undefined }> | undefined,
  fallback?: number
): number;

export const featureComposition: {
  mergeAlternativeProps: typeof mergeAlternativeProps;
  computeTopConfidence: typeof computeTopConfidence;
};

export default featureComposition;
