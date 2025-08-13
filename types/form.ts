export interface FormField {
  id: string;
  name: string;
  label: string;
  type: string;
  placeholder?: string;
  required?: boolean;
  pattern?: string;
  maxLength?: number;
  tabIndex?: number;
  autoComplete?: string;
  options?: Array<{
    value: string;
    text: string;
  }>;
  validation?: {
    required?: string;
    pattern?: string;
    maxLength?: string;
  };
}

export interface FormStep {
  id: string;
  title: string;
  description: string;
  fields: FormField[];
  buttons: Array<{
    id: string;
    type: string;
    text: string;
    className: string;
    action: string;
  }>;
}

export interface ValidationRules {
  aadhaar: {
    pattern: string;
    message: string;
  };
  pan: {
    pattern: string;
    message: string;
  };
  mobile: {
    pattern: string;
    message: string;
  };
  email: {
    pattern: string;
    message: string;
  };
}