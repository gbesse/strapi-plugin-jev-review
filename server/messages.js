'use strict';

const messages = {
  en: {
    key: 'JEV_API_KEY is required.',
    config: 'Invalid Jev Review configuration.',
    missing: 'The draft has no reviewable text.',
    unavailable: 'Jev Review is temporarily unavailable.',
    review: 'This content needs editorial review before publication.',
    rejected: 'This content did not pass editorial review.',
  },
  fr: {
    key: 'JEV_API_KEY est requis.',
    config: 'La configuration de Jev Review est invalide.',
    missing: 'Le brouillon ne contient aucun texte à examiner.',
    unavailable: 'Jev Review est temporairement indisponible.',
    review: 'Ce contenu nécessite une revue éditoriale avant publication.',
    rejected: 'Ce contenu n’a pas validé la revue éditoriale.',
  },
  es: {
    key: 'Se requiere JEV_API_KEY.',
    config: 'La configuración de Jev Review no es válida.',
    missing: 'El borrador no contiene texto para revisar.',
    unavailable: 'Jev Review no está disponible temporalmente.',
    review: 'Este contenido necesita una revisión editorial antes de publicarse.',
    rejected: 'Este contenido no ha superado la revisión editorial.',
  },
};

module.exports = (locale, key) => (messages[locale] || messages.en)[key];
