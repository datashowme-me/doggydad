import { HttpError } from './httpSafety';

export const RESERVATION_FEN = 20;
export const MONTHLY_BUDGET_FEN = 3000;
export const RESERVE_SQL = `INSERT INTO ai_budget (month, reserved_fen, calls)
VALUES (?1, ?2, 1)
ON CONFLICT(month) DO UPDATE SET reserved_fen = reserved_fen + excluded.reserved_fen, calls = calls + 1
WHERE reserved_fen + excluded.reserved_fen <= ?3
RETURNING reserved_fen`;

export function budgetMonth(now = new Date()): string {
  return new Date(now.getTime() + 8 * 3600_000).toISOString().slice(0, 7);
}

export async function reserveAiBudget(db: D1Database): Promise<void> {
  // Atomic reservation BEFORE the remote call. Failed/timeout calls are not refunded:
  // the upstream might have billed them. Never reset this row during deployments.
  const row = await db.prepare(RESERVE_SQL)
    .bind(budgetMonth(), RESERVATION_FEN, MONTHLY_BUDGET_FEN).first<{ reserved_fen: number }>();
  if (!row) throw new HttpError(503, '本月 AI 服务预算已用完，基础练习仍可使用，下月自动恢复');
}
