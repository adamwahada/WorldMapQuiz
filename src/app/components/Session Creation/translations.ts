export interface Translations {
  title: string;
  subtitle: string;
  cta: string;
  login: string;
  signup: string;
  newUser: string;
  welcomeBack: string;
  chooseAccount: string;
  guest: string;
  logout: string;
  players: string;
  difficulty: string;
  timer: string;
  easy: string;
  medium: string;
  hard: string;
  diffNote: string;
  customize: string;
  enterMinutes: string;
  sessionName: string;
  sessionNamePlaceholder: string;
  createSession: string;
  joinSession: string;
  enterCode: string;
  codePlaceholder: string;
  validateAndJoin: string;
  email: string;
  password: string;
  or: string;
  emailPlaceholder: string;
  passwordPlaceholder: string;
  activeSession: string;
  activeSessionMessage: string;
  sessionCode: string;
  resume: string;
  quit: string;
}

export const translations: Record<'en' | 'fr' | 'ar', Translations> = {
  en: {
    title: 'Unlimited Geography Quizzes, and Much More',
    subtitle: 'Play anywhere • Challenge your friends anytime',
    cta: 'Start Playing',
    login: 'Sign In',
    signup: 'Sign Up',
    newUser: 'New to GeoQuiz?',
    welcomeBack: 'Welcome back to GeoQuiz',
    chooseAccount: 'Choose your account',
    guest: 'Play as Guest',
    logout: 'Log out',
    players: 'Players',
    difficulty: 'Difficulty',
    timer: 'Timer',
    easy: 'Easy',
    medium: 'Medium',
    hard: 'Hard',
    diffNote: 'Easy: pick freely • Medium: alternates pick/random • Hard: dice only',
    customize: 'Custom',
    enterMinutes: 'Enter minutes...',
    sessionName: 'Session Name',
    sessionNamePlaceholder: 'Enter session name...',
    createSession: 'Create Session',
    joinSession: 'Join Session',
    enterCode: 'Enter Session Code',
    codePlaceholder: 'Enter code...',
    validateAndJoin: 'Validate & Join',
    email: 'Email',
    password: 'Password',
    or: 'or',
    emailPlaceholder: 'your@email.com',
    passwordPlaceholder: '••••••••',
    activeSession: 'Active Session',
    activeSessionMessage: 'You have an active session',
    sessionCode: 'Session Code',
    resume: 'Resume Session',
    quit: 'Quit Session'
  },
  fr: {
    title: 'Quiz de Géographie Illimités, et Bien Plus',
    subtitle: 'Jouez partout • Défiez vos amis à tout moment',
    cta: 'Commencer à Jouer',
    login: "S'identifier",
    signup: "S'inscrire",
    newUser: 'Nouveau sur GeoQuiz ?',
    welcomeBack: 'Bon retour sur GeoQuiz',
    chooseAccount: 'Choisissez votre compte',
    guest: 'Jouer en invité',
    logout: 'Se déconnecter',
    players: 'Joueurs',
    difficulty: 'Difficulté',
    timer: 'Minuteur',
    easy: 'Facile',
    medium: 'Moyen',
    hard: 'Difficile',
    diffNote: 'Facile: choix libre • Moyen: alterne choix/aléatoire • Difficile: dés uniquement',
    customize: 'Personnaliser',
    enterMinutes: 'Entrez les minutes...',
    sessionName: 'Nom de Session',
    sessionNamePlaceholder: 'Entrez le nom de la session...',
    createSession: 'Créer Session',
    joinSession: 'Rejoindre Session',
    enterCode: 'Entrez le Code de Session',
    codePlaceholder: 'Entrez le code...',
    validateAndJoin: 'Valider et Rejoindre',
    email: 'Email',
    password: 'Mot de passe',
    or: 'ou',
    emailPlaceholder: 'votre@email.com',
    passwordPlaceholder: '••••••••',
    activeSession: 'Session Active',
    activeSessionMessage: 'Vous avez une session active',
    sessionCode: 'Code de Session',
    resume: 'Reprendre la Session',
    quit: 'Quitter la Session'
  },
  ar: {
    title: 'اختبارات جغرافيا غير محدودة، وأكثر من ذلك',
    subtitle: 'العب في أي مكان • تحدى أصدقائك في أي وقت',
    cta: 'ابدأ اللعب',
    login: 'تسجيل الدخول',
    signup: 'إنشاء حساب',
    newUser: 'جديد على GeoQuiz؟',
    welcomeBack: 'مرحبًا بعودتك إلى GeoQuiz',
    chooseAccount: 'اختر حسابك',
    guest: 'اللعب كضيف',
    logout: 'تسجيل الخروج',
    players: 'اللاعبون',
    difficulty: 'الصعوبة',
    timer: 'المؤقت',
    easy: 'سهل',
    medium: 'متوسط',
    hard: 'صعب',
    diffNote: 'سهل: اختر بحرية • متوسط: يتناوب بين الاختيار/العشوائي • صعب: النرد فقط',
    customize: 'تخصيص',
    enterMinutes: 'أدخل الدقائق...',
    sessionName: 'اسم الجلسة',
    sessionNamePlaceholder: 'أدخل اسمك...',
    createSession: 'إنشاء جلسة',
    joinSession: 'الانضمام إلى الجلسة',
    enterCode: 'أدخل رمز الجلسة',
    codePlaceholder: 'أدخل الرمز...',
    validateAndJoin: 'التحقق والانضمام',
    email: 'البريد الإلكتروني',
    password: 'كلمة المرور',
    or: 'أو',
    emailPlaceholder: 'اسم@مثال.com',
    passwordPlaceholder: '••••••••',
    activeSession: 'جلسة نشطة',
    activeSessionMessage: 'لديك جلسة نشطة',
    sessionCode: 'رمز الجلسة',
    resume: 'استئناف الجلسة',
    quit: 'إنهاء الجلسة'
  }
};
