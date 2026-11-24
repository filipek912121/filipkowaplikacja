/** Expected, user-facing failure. Message is safe to show in the UI. */
/**
 * Expected, user-facing failure. `message` is an English template (also the
 * translation key); `{name}` placeholders are filled from `params`.
 */
export class AppError extends Error {
  constructor(
    message: string,
    public fieldErrors?: Record<string, string>,
    public params?: Record<string, string | number>,
  ) {
    super(message);
    this.name = "AppError";
  }
}
