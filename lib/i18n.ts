export type MoneyFlowLocale = 'pt-PT' | 'en'

type TranslationKey =
  | 'nav.home'
  | 'nav.accounts'
  | 'nav.transactions'
  | 'nav.goals'
  | 'nav.wishlist'
  | 'nav.label'
  | 'nav.settings'
  | 'settings.eyebrow'
  | 'settings.title'
  | 'settings.description'
  | 'settings.language'
  | 'settings.languageHint'
  | 'settings.portuguese'
  | 'settings.english'
  | 'settings.save'
  | 'settings.saved'
  | 'settings.saveError'
  | 'settings.back'

const translations: Record<MoneyFlowLocale, Record<TranslationKey, string>> = {
  'pt-PT': {
    'nav.home': 'Início',
    'nav.accounts': 'Contas',
    'nav.transactions': 'Movimentos',
    'nav.goals': 'Objetivos',
    'nav.wishlist': 'Wishlist',
    'nav.label': 'Navegação principal',
    'nav.settings': 'Definições',
    'settings.eyebrow': 'Preferências',
    'settings.title': 'Definições',
    'settings.description': 'Escolhe como o MoneyFlow deve apresentar a interface.',
    'settings.language': 'Idioma',
    'settings.languageHint': 'A preferência fica guardada no teu perfil.',
    'settings.portuguese': 'Português (Portugal)',
    'settings.english': 'English',
    'settings.save': 'Guardar alterações',
    'settings.saved': 'Idioma atualizado.',
    'settings.saveError': 'Não foi possível atualizar o idioma.',
    'settings.back': 'Voltar',
  },
  en: {
    'nav.home': 'Home',
    'nav.accounts': 'Accounts',
    'nav.transactions': 'Transactions',
    'nav.goals': 'Goals',
    'nav.wishlist': 'Wishlist',
    'nav.label': 'Main navigation',
    'nav.settings': 'Settings',
    'settings.eyebrow': 'Preferences',
    'settings.title': 'Settings',
    'settings.description': 'Choose how MoneyFlow should present the interface.',
    'settings.language': 'Language',
    'settings.languageHint': 'Your preference is stored in your profile.',
    'settings.portuguese': 'Portuguese (Portugal)',
    'settings.english': 'English',
    'settings.save': 'Save changes',
    'settings.saved': 'Language updated.',
    'settings.saveError': 'We could not update your language.',
    'settings.back': 'Back',
  },
}

export function normalizeLocale(value: unknown): MoneyFlowLocale {
  return value === 'en' ? 'en' : 'pt-PT'
}

export function createTranslator(locale: MoneyFlowLocale) {
  return (key: TranslationKey) => translations[locale][key]
}

export function getLocaleLabel(locale: MoneyFlowLocale) {
  return locale === 'en' ? 'English' : 'Português (Portugal)'
}
