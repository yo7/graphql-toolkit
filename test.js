const { loadSchema } = require('.');

async function main() {
  const schema = await loadSchema('./tests/loaders/schema/test-files/schema-dir/type-defs/graphql-tag.ts');

  console.log({ schema });
}

main();
