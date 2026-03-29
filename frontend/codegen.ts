import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  schema: '../backend/src/graphql/schema.graphql',
  documents: ['src/graphql/**/*.graphql'],

  generates: {
    'src/graphql/generated/graphql.ts': {
      plugins: ['typescript', 'typescript-operations', 'typed-document-node'],
      config: {
        scalars: {
          Date: 'string',
          DateTime: 'string',
        },
      },
    },
  },
};

export default config;
