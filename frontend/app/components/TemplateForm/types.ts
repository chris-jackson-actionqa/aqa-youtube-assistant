export interface FormErrors {
  type?: string;
  name?: string;
  content?: string;
  placeholders?: string;
  api?: string;
}

export type ValidationErrorMap = Record<string, string | undefined>;
