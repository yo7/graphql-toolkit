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
});
