import { buildASTSchema, isSchema, GraphQLSchema } from 'graphql';
import { loadSchema } from '../../../src';

describe('loadSchema', () => {
  it('should throw a valid exception when using ts file for schema and it has a syntax error', async () => {
    const schemaPath = './tests/loaders/schema/test-files/error.ts';
    try {
      await loadSchema(schemaPath);
      expect(true).toBeFalsy(); // should throw
    } catch(e) {
      expect(e.toString()).toContain(`SyntaxError: Unterminated template (12:1)`);
    }
  });
  
  it('should work with ts files and without globs correctly', async () => {
    const schemaPath = './tests/loaders/schema/test-files/schema-dir/type-defs/graphql-tag.ts';
    const built = await loadSchema(schemaPath);
    let schema: GraphQLSchema;
  
    if (!isSchema(built)) {
      schema = buildASTSchema(built);
    }
  
    expect(schema.getTypeMap()['User']).toBeDefined();
    expect(schema.getTypeMap()['Query']).toBeDefined();
  });
  
  it('should work with graphql files and without globs correctly', async () => {
    const schemaPath = './tests/loaders/schema/test-files/schema-dir/user.graphql';
    const built = await loadSchema(schemaPath);
    let schema: GraphQLSchema;
  
    if (!isSchema(built)) {
      schema = buildASTSchema(built);
    }
  
    expect(schema.getTypeMap()['User']).toBeDefined();
  });
});
