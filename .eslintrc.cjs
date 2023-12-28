module.exports = {
  extends: ['eslint-config-salesforce-typescript', 'plugin:sf-plugin/recommended'],
  plugins: ['eslint-plugin-header'],
  root: true,
  rules: {
    'header/header': [
      2,
      'block',
      [
        '',
        {
          pattern: ' \\* Copyright \\(c\\) \\d{4}, Clay Chipps',
          template: ' * Copyright (c) 2023, Clay Chipps',
        },
        ' * All rights reserved.',
        ' * Licensed under the MIT License.',
        ' * For full license text, see LICENSE.md file in the repo root or https://opensource.org/licenses/MIT',
        ' ',
      ],
    ],
  },
};
