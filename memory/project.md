# Project Notes

## MVP2 Refactor Candidates

- `trainingDaysInMonth` is currently assembled in `GetTrainingDaysInMounthUseCase` by calling `findByMonth()` and then `findByTrainingSessionId()` for each session.
- For MVP2 and beyond, consider moving this aggregation to the repository / DB layer to avoid N+1 queries and reduce DB round trips.
- Recommended direction:
  - Keep `findByMonth(year, month)` returning `TrainingSession[]` as-is.
  - Add a separate aggregate-oriented repository method for calendar data, for example `findTrainingDaysInMonth(year, month): Promise<TrainingDay[]>`.
  - Implement the aggregate with a JOIN / GROUP BY style query in the infrastructure layer.
