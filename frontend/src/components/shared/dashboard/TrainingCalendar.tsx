import { useMemo } from 'react';
import { DayPicker, getDefaultClassNames } from 'react-day-picker';
import { ja } from 'react-day-picker/locale';

interface CalendarTrainingDay {
  readonly date: string;
  readonly exerciseCount: number;
}
export interface TrainingCalendarProps {
  readonly year: number;
  readonly month: number;
  readonly trainingDays: readonly CalendarTrainingDay[];
  readonly loading: boolean;
  readonly error: Error | undefined;
  readonly onMonthChange: (year: number, month: number) => void;
  readonly onDayClick: (date: string) => void;
}

function createMonthDate(year: number, month: number): Date {
  return new Date(year, month - 1, 1);
}

function parseDateOnly(value: string): Date {
  const parts = value.split('-');
  const year = Number(parts[0] ?? '0');
  const month = Number(parts[1] ?? '1');
  const day = Number(parts[2] ?? '1');
  return new Date(year, month - 1, day);
}

function formatDateOnly(date: Date): string {
  const year = String(date.getFullYear());
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function TrainingCalendar(props: TrainingCalendarProps): React.JSX.Element {
  const defaultClassNames = getDefaultClassNames();
  const displayMonth = createMonthDate(props.year, props.month);

  const trainedDates = useMemo(
    () => props.trainingDays.map(day => parseDateOnly(day.date)),
    [props.trainingDays]
  );

  const trainedDateSet = useMemo(
    () => new Set(props.trainingDays.map(day => day.date)),
    [props.trainingDays]
  );

  return (
    <section
      aria-labelledby="calender-heading"
      className="rounded-lg boarder-slate-200 bg-white p-4"
    >
      <h2 id="calender-heading" className="text-lg font-semibold text-slate-900">
        トレーニングカレンダー
      </h2>
      {props.loading ? <p className="mt-4 text-slate-600">読み込み中...</p> : null}
      {props.error !== undefined ? (
        <p className="mt-4 text-slate-600">データを取得できませんでした。</p>
      ) : null}
      {props.error !== undefined ? null : (
        <DayPicker
          mode="single"
          month={displayMonth}
          locale={ja}
          onMonthChange={nextMonth => {
            props.onMonthChange(nextMonth.getFullYear(), nextMonth.getMonth() + 1);
          }}
          modifiers={{ trained: trainedDates }}
          modifiersClassNames={{ trained: 'bg-emerald-100 text-emerald-900 font-semibold' }}
          classNames={{
            root: `${defaultClassNames.root} mt-4`,
            today: 'border border-slate-900',
            selected: 'bg-slate-900 text-white',
          }}
          onDayClick={date => {
            const dateText = formatDateOnly(date);
            if (trainedDateSet.has(dateText)) {
              props.onDayClick(dateText);
            }
          }}
        />
      )}
    </section>
  );
}
