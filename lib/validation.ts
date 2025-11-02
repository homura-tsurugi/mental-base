import { AuthValidationError, AUTH_CONSTANTS } from '@/types';

/**
 * メールアドレスのバリデーション
 */
export const validateEmail = (email: string): AuthValidationError | null => {
  if (!email) {
    return { field: 'email', message: 'メールアドレスを入力してください' };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { field: 'email', message: '有効なメールアドレスを入力してください' };
  }

  return null;
};

/**
 * パスワードのバリデーション
 */
export const validatePassword = (password: string, fieldName: 'password' | 'confirmPassword' = 'password'): AuthValidationError | null => {
  if (!password) {
    return { field: fieldName, message: 'パスワードを入力してください' };
  }

  if (password.length < AUTH_CONSTANTS.PASSWORD_MIN_LENGTH) {
    return {
      field: fieldName,
      message: `パスワードは${AUTH_CONSTANTS.PASSWORD_MIN_LENGTH}文字以上で入力してください`
    };
  }

  return null;
};

/**
 * 名前のバリデーション
 */
export const validateName = (name: string): AuthValidationError | null => {
  if (!name) {
    return { field: 'name', message: '名前を入力してください' };
  }

  if (name.length < 2) {
    return { field: 'name', message: '名前は2文字以上で入力してください' };
  }

  return null;
};

/**
 * パスワード確認のバリデーション
 */
export const validatePasswordConfirmation = (
  password: string,
  confirmPassword: string
): AuthValidationError | null => {
  if (!confirmPassword) {
    return { field: 'confirmPassword', message: '確認用パスワードを入力してください' };
  }

  if (password !== confirmPassword) {
    return { field: 'confirmPassword', message: 'パスワードが一致しません' };
  }

  return null;
};

/**
 * ログインフォームのバリデーション
 */
export const validateLoginForm = (email: string, password: string): AuthValidationError[] => {
  const errors: AuthValidationError[] = [];

  const emailError = validateEmail(email);
  if (emailError) errors.push(emailError);

  const passwordError = validatePassword(password);
  if (passwordError) errors.push(passwordError);

  return errors;
};

/**
 * 新規登録フォームのバリデーション
 */
export const validateRegisterForm = (
  name: string,
  email: string,
  password: string
): AuthValidationError[] => {
  const errors: AuthValidationError[] = [];

  const nameError = validateName(name);
  if (nameError) errors.push(nameError);

  const emailError = validateEmail(email);
  if (emailError) errors.push(emailError);

  const passwordError = validatePassword(password);
  if (passwordError) errors.push(passwordError);

  return errors;
};

/**
 * パスワードリセットフォームのバリデーション
 */
export const validatePasswordResetForm = (email: string): AuthValidationError[] => {
  const errors: AuthValidationError[] = [];

  const emailError = validateEmail(email);
  if (emailError) errors.push(emailError);

  return errors;
};

/**
 * 新しいパスワード設定フォームのバリデーション
 */
export const validateNewPasswordForm = (
  newPassword: string,
  confirmPassword: string
): AuthValidationError[] => {
  const errors: AuthValidationError[] = [];

  const passwordError = validatePassword(newPassword);
  if (passwordError) errors.push(passwordError);

  const confirmError = validatePasswordConfirmation(newPassword, confirmPassword);
  if (confirmError) errors.push(confirmError);

  return errors;
};
