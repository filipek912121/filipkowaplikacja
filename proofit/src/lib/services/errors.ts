/** Expected, user-facing failure. Message is safe to show in the UI. */
export class AppError extends Error {
  constructor(message: string, public fieldErrors?: Record<string, string>) {
    super(message);
    this.name = "AppError";
  }
}
