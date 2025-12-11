export interface SignupTranslations {
  // Page content
  createAccount: string;
  subtitle: string;
  
  // Form labels
  emailLabel: string;
  passwordLabel: string;
  emailPlaceholder: string;
  passwordPlaceholder: string;
  
  // Form validation errors
  required: string;
  email: string;
  minlength: string;
  numberRequired: string;
  specialCharRequired: string;
  
  // Signup errors
  emailInUse: string;
  invalidEmail: string;
  weakPassword: string;
  signupError: string;
  
  // Buttons and actions
  signupButton: string;
  creatingAccount: string;
  alreadyHaveAccount: string;
  loginLink: string;
}

export const signupTranslations: Record<'en' | 'fr' | 'ar', SignupTranslations> = {
  en: {
    createAccount: 'Create Account',
    subtitle: 'Join GeoQuiz and start your geography adventure',
    emailLabel: 'Email Address',
    passwordLabel: 'Password',
    emailPlaceholder: 'name@example.com',
    passwordPlaceholder: '••••••••',
    required: 'This field is required.',
    email: 'Please enter a valid email address.',
    minlength: 'Password must be at least 8 characters.',
    numberRequired: 'Password must include at least one number.',
    specialCharRequired: 'Password must include at least one special character.',
    emailInUse: 'This email is already registered. Please sign in instead.',
    invalidEmail: 'Invalid email address.',
    weakPassword: 'Password is too weak. Please use a stronger password.',
    signupError: 'An error occurred during signup.',
    signupButton: 'Create Account',
    creatingAccount: 'Creating account...',
    alreadyHaveAccount: 'Already have an account?',
    loginLink: 'Sign in now'
  },
  fr: {
    createAccount: 'Créer un compte',
    subtitle: 'Rejoignez GeoQuiz et commencez votre aventure géographique',
    emailLabel: 'Adresse e-mail',
    passwordLabel: 'Mot de passe',
    emailPlaceholder: 'nom@exemple.com',
    passwordPlaceholder: '••••••••',
    required: 'Ce champ est requis.',
    email: 'Veuillez entrer une adresse e-mail valide.',
    minlength: 'Le mot de passe doit contenir au moins 8 caractères.',
    numberRequired: 'Le mot de passe doit inclure au moins un chiffre.',
    specialCharRequired: 'Le mot de passe doit inclure au moins un caractère spécial.',
    emailInUse: 'Cet e-mail est déjà enregistré. Veuillez vous connecter.',
    invalidEmail: 'Adresse e-mail invalide.',
    weakPassword: 'Le mot de passe est trop faible. Veuillez utiliser un mot de passe plus fort.',
    signupError: 'Une erreur s\'est produite lors de l\'inscription.',
    signupButton: 'Créer un compte',
    creatingAccount: 'Création du compte...',
    alreadyHaveAccount: 'Vous avez déjà un compte?',
    loginLink: 'Se connecter maintenant'
  },
  ar: {
    createAccount: 'إنشاء حساب',
    subtitle: 'انضم إلى GeoQuiz وابدأ مغامرتك الجغرافية',
    emailLabel: 'عنوان البريد الإلكتروني',
    passwordLabel: 'كلمة المرور',
    emailPlaceholder: 'اسم@مثال.com',
    passwordPlaceholder: '••••••••',
    required: 'هذا الحقل مطلوب.',
    email: 'الرجاء إدخال بريد إلكتروني صالح.',
    minlength: 'يجب أن تتكون كلمة المرور من 8 أحرف على الأقل.',
    numberRequired: 'يجب أن تحتوي كلمة المرور على رقم واحد على الأقل.',
    specialCharRequired: 'يجب أن تحتوي كلمة المرور على رمز خاص واحد على الأقل.',
    emailInUse: 'هذا البريد الإلكتروني مسجل بالفعل. يرجى تسجيل الدخول بدلاً من ذلك.',
    invalidEmail: 'عنوان بريد إلكتروني غير صالح.',
    weakPassword: 'كلمة المرور ضعيفة جدًا. يرجى استخدام كلمة مرور أقوى.',
    signupError: 'حدث خطأ أثناء التسجيل.',
    signupButton: 'إنشاء حساب',
    creatingAccount: 'جاري إنشاء الحساب...',
    alreadyHaveAccount: 'هل لديك حساب بالفعل؟',
    loginLink: 'تسجيل الدخول الآن'
  }
};