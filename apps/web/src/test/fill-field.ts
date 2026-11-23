import type userEvent from '@testing-library/user-event';

type User = ReturnType<typeof userEvent.setup>;

/**
 * Focuses a field and enters the value in one paste, like a user pasting text.
 * Use `user.type` instead when keystroke behavior is what the test checks.
 */
export async function fillField(user: User, field: HTMLElement, value: string): Promise<void> {
  await user.click(field);
  await user.paste(value);
}
