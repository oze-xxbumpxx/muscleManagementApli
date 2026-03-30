import type { TrainingSessionQuery } from '@/graphql/generated/graphql';
import { SessionNotFound } from '@/components/shared/training/sessionNotFound';
import { TrainingSessionDetail } from '@/components/shared/training/trainingSessionDetail';

export interface TrainingDetailViewProps {
  readonly loading: boolean;
  readonly error: Error | undefined;
  readonly session: TrainingSessionQuery['trainingSession'];
}

export function TrainingDetailView(
  props: TrainingDetailViewProps
): React.JSX.Element {
  if (props.loading) {
    return <p className="text-slate-600">読み込み中…</p>;
  }
  if (props.error !== undefined) {
    return <p className="text-slate-600">データを取得できませんでした。</p>;
  }
  if (props.session === null || props.session === undefined) {
    return <SessionNotFound />;
  }
  return <TrainingSessionDetail session={props.session} />;
}
