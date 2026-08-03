export interface DatabaseExecutionResult {
  rowsAffected: number;
  lastInsertId?: number;
}

export interface DatabaseClient {
  select<T>(query: string, bindValues?: unknown[]): Promise<T>;
  execute(
    query: string,
    bindValues?: unknown[],
  ): Promise<DatabaseExecutionResult>;
}
