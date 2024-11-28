/* * */

import { node } from '@carrismetropolitana/eslint'

/* * */

export default [
  ...node,
  {
    rules: {
      '@stylistic/indent': 'warn',
      '@stylistic/jsx-indent-props': 'off',
    },
  },
]
