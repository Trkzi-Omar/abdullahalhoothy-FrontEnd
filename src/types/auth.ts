export interface Country {
  isoAlpha3: string;
  name: string;
}

export interface FormData {
  fullName: string;
  email: string;
  password: string;
  phone: string;
  reason: string;
  userType: string;
  teamId: string;
  source?: string;
}

export interface FormErrors {
  [key: string]: string;
}

export interface SignUpProps {
  onSubmit?: (formData: FormData) => void;
}
