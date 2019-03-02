import { isSchema, buildASTSchema, GraphQLSchema } from 'graphql';
import { loadSchema } from '../../../src';

describe('loadSchema', () => {
  test('should work with a single file', async () => {
    const file = './tests/loaders/schema/test-files/schema.graphql';

    let schema: GraphQLSchema;
    const result = await loadSchema(file, {});

    if (isSchema(result)) {
      schema = result;
    } else {
      schema = buildASTSchema(result);
    }

    expect(schema.getTypeMap()['User']).toBeDefined();
    expect(schema.getTypeMap()['Query']).toBeDefined();
  });

 it('should work with graphql-tag and gatsby by default and not throw on files without those parsers', async () => {
  const schemaPath = './tests/loaders/schema/test-files/schema-dir/type-defs/*.ts';
  const built = await loadSchema(schemaPath);
  let schema: GraphQLSchema;

  if (!isSchema(built)) {
    schema = buildASTSchema(built);
  }

  expect(schema.getTypeMap()['User']).toBeDefined();
  expect(schema.getTypeMap()['Query']).toBeDefined();
 });
});
