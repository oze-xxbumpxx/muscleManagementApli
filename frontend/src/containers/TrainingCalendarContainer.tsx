import { TrainingCalendar } from '@/components/shared/dashboard/TrainingCalendar';
import { useToast } from '@/context/ToastContext';
import { useTrainingDaysInMonth } from '@/hooks/useTrainingDaysInMonth';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export function TrainingCalendarContainer(): React.JSX.Element {
  const now = new Date();
  const [year, setYear] = useState<number>(now.getFullYear());
  const [month, setMonth] = useState<number>(now.getMonth() + 1);

  const navigate = useNavigate();
  const { showToast } = useToast();
  const { trainingDays, loading, error } = useTrainingDaysInMonth(year, month);

  useEffect(() => {
    if (error !== undefined) {
      showToast(error.message, 'error');
    }
  }, [error, showToast]);

  const handleMonthChange = useCallback((nextYear: number, nextMonth: number) => {
    setYear(nextYear);
    setMonth(nextMonth);
  }, []);

  const handleDayClick = useCallback(
    (_date: string) => {
      navigate('/sessions');
    },
    [navigate]
  );

  return (
    <TrainingCalendar
      year={year}
      month={month}
      trainingDays={trainingDays}
      loading={loading}
      error={error}
      onMonthChange={handleMonthChange}
      onDayClick={handleDayClick}
    />
  );
}
