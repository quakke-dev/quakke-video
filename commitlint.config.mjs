const commitTypes = [
  'feat',
  'fix',
  'docs',
  'style',
  'refactor',
  'perf',
  'test',
  'build',
  'ci',
  'chore',
  'revert',
];

const commitScopes = [
  'root',
  'web',
  'studio',
  'admin',
  'api',
  'worker-media',
  'worker-notifications',
  'ui',
  'api-client',
  'contracts',
  'config',
  'testing',
  'infra',
  'docs',
  'deps',
  'ci',
];

export default {
  extends: ['@commitlint/config-conventional'],

  rules: {
    'type-enum': [2, 'always', commitTypes],
    'scope-enum': [2, 'always', commitScopes],
    'scope-empty': [0, 'never'],
    'subject-empty': [2, 'never'],
    'subject-full-stop': [2, 'never', '.'],
    'header-max-length': [2, 'always', 100],
  },

  prompt: {
    messages: {
      type: 'Выбери тип изменения:',
      scope: 'Выбери область изменения:',
      subject: 'Коротко опиши изменение:',
      body: 'Подробное описание:',
      breaking: 'Описание breaking change:',
      footer: 'Номер задачи:',
      confirmCommit: 'Создать коммит?',
    },

    types: [
      {
        value: 'feat',
        name: '✨ Feat',
      },
      {
        value: 'fix',
        name: '🐛 Fix',
      },
      {
        value: 'docs',
        name: '📚 Docs',
      },
      {
        value: 'style',
        name: '💎 Style',
      },
      {
        value: 'refactor',
        name: '📦 Refactor',
      },
      {
        value: 'perf',
        name: '🚀 Perf',
      },
      {
        value: 'test',
        name: '🚨 Tests',
      },
      {
        value: 'build',
        name: '🛠  Build',
      },
      {
        value: 'ci',
        name: '⚙️  Ci',
      },
      {
        value: 'chore',
        name: '♻️  Chore',
      },
      {
        value: 'revert',
        name: '🗑  Revert',
      },
    ],

    scope: {
      description: 'Выбери область изменения:',
      enum: {
        root: {
          description: 'Корневые настройки монорепы',
        },
        web: {
          description: 'Интерфейс видеохостинга',
        },
        studio: {
          description: 'Интерфейс студии',
        },
        admin: {
          description: 'Интерфейс админки',
        },
        api: {
          description: 'Backend API',
        },
        'worker-media': {
          description: 'Media worker, ffmpeg, обработка видео',
        },
        'worker-notifications': {
          description: 'Email, уведомления, фоновые задачи',
        },
        ui: {
          description: 'UI kit',
        },
        'api-client': {
          description: 'Frontend API client',
        },
        contracts: {
          description: 'Общие типы, DTO, event contracts',
        },
        config: {
          description: 'Общие конфиги/env/contracts',
        },
        testing: {
          description: 'Общие test utils',
        },
        infra: {
          description: 'Docker, nginx, postgres, redis, rabbitmq, minio',
        },
        docs: {
          description: 'Документация',
        },
        deps: {
          description: 'Зависимости',
        },
        ci: {
          description: 'CI/CD и git hooks',
        },
      },
    },
  },
};
