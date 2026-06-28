import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  schema: './schema.gql',
  documents: [
    'src/domain/graphql/**/*.ts',
    '!src/domain/graphql/**/*-legacy.ts', // excluir queries sin endpoint en el schema actual
    '!src/domain/graphql/**/*.subscriptions.ts', // excluir subscriptions (schema no tiene root Subscription)
  ],
  generates: {
    './src/gql/': {
      preset: 'client',
      presetConfig: {
        persistedDocuments: { hashAlgorithm: 'sha256' },
        fragmentMasking: false,
      },
      config: {
        useTypeImports: true,
        enumsAsTypes: true,
        skipTypename: false,
      },
    },
  },
  ignoreNoDocuments: true,
  // Las operaciones que no coinciden con el schema actual deben estar
  // en archivos *-legacy.ts (excluidos en documents[] arriba).
  skipDocumentsValidation: true,
};

export default config;
