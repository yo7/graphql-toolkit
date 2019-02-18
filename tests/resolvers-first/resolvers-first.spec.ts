import 'reflect-metadata';
import {
  ObjectType,
  getObjectTypeFromClass,
  Field,
  Arg,
  InputObjectType,
  getInputTypeFromClass,
  InputField,
  InterfaceType,
  EnumType,
  UnionType,
  getScalarTypeFromClass,
  ScalarType,
  Injector,
  Inject,
} from '../../src/resolvers-first';
import { printType, graphql, GraphQLSchema, GraphQLObjectType } from 'graphql';
function stripWhitespaces(str: string): string {
  return str.replace(/\s+/g, ' ').trim();
}

describe('ResolverFirst', async () => {
  describe('Object Type', async () => {
    it('should build object type using ObjectType decorator', async () => {
      @ObjectType()
      class Foo { }
      expect(stripWhitespaces(printType(getObjectTypeFromClass(Foo)))).toBe(stripWhitespaces(`
        type Foo {

        }
      `));
    });
    it('should build object type with scalar fields using Field decorator', async () => {
      @ObjectType()
      class Foo {
        @Field()
        bar: string;
      }
      expect(stripWhitespaces(printType(getObjectTypeFromClass(Foo)))).toBe(stripWhitespaces(`
        type Foo {
          bar: String
        }
      `));
    });
    it('should build object type with array of scalar fields using Field decorator', async () => {
      @ObjectType()
      class Foo {
        @Field(type => [String])
        bar: string[];
      }
      expect(stripWhitespaces(printType(getObjectTypeFromClass(Foo)))).toBe(stripWhitespaces(`
        type Foo {
          bar: [String]
        }
      `));
    });
    it('should add resolver to the fields using Field decorator by passing correct root value', async () => {
      @ObjectType()
      class Bar {
        // entity fields passed into constructor
        constructor(private message: string) { }
        @Field()
        messageLength(): number {
          return this.getLength(this.message);
        }
        // sample helper method
        private getLength(str: string): number {
          return str.length;
        }
      }
      @ObjectType()
      class Query {
        @Field()
        bar(): Bar {
          return new Bar('BAR');
        }
      }
      const result = await graphql(new GraphQLSchema({
        query: getObjectTypeFromClass(Query) as GraphQLObjectType,
      }), `{ bar { messageLength } }`);
      expect(result.errors).toBeFalsy();
      expect(result.data.bar.messageLength).toBe(3);
    });
    it('should add resolver to the fields with the arguments using Arg decorator', async () => {
      @ObjectType()
      class Bar {
        // entity fields passed into constructor
        constructor(private message: string) { }
        @Field()
        messageLength(@Arg('multiply') multiply: number): number {
          return this.getLength(this.message) * multiply;
        }
        // sample helper method
        private getLength(str: string): number {
          return str.length;
        }
      }
      @ObjectType()
      class Query {
        @Field()
        bar(): Bar {
          return new Bar('BAR');
        }
      }
      const result = await graphql(new GraphQLSchema({
        query: getObjectTypeFromClass(Query) as GraphQLObjectType,
      }), `{ bar { messageLength(multiply: 2) } }`);
      expect(result.errors).toBeFalsy();
      expect(result.data.bar.messageLength).toBe(6);
    });
    it('should build extended type object', async () => {
        @ObjectType({ name: 'Query' })
        class BaseQuery {
            @Field()
            foo(): String {
                return 'FOO';
            }
        }
        @ObjectType({ name: 'Query' })
        class ExtendedQuery extends BaseQuery {
            @Field()
            bar(): String {
                return 'BAR';
            }
        }
        const result = await graphql(new GraphQLSchema({
          query: getObjectTypeFromClass(ExtendedQuery) as GraphQLObjectType,
        }), `{ foo bar }`);
        expect(result.errors).toBeFalsy();
        expect(result.data.foo).toBe("FOO");
        expect(result.data.bar).toBe("BAR");
    });
    it('should not affect parent type in case of extension', async () => {
      @ObjectType({ name: 'Foo '})
      class BaseFoo {
        @Field()
        foo: string;
      }
      @ObjectType({ name: 'Foo'})
      class ExtendedFoo extends BaseFoo {
        @Field()
        bar: string;
      }
      expect(stripWhitespaces(printType(getObjectTypeFromClass(BaseFoo)))).toBe(stripWhitespaces(`
        type Foo {
          foo: String
        }
      `))
      expect(stripWhitespaces(printType(getObjectTypeFromClass(ExtendedFoo)))).toBe(stripWhitespaces(`
        type Foo {
          foo: String
          bar: String
        }
      `))
    });
    it('should make fields non-null if nullable is set false', async () => {
      @ObjectType()
      class Foo {
        @Field(type => String, { nullable: false })
        foo : string;
      }
      expect(stripWhitespaces(printType(getObjectTypeFromClass(Foo)))).toBe(stripWhitespaces(`
        type Foo {
          foo: String!
        }
      `))
    });
    it('should inject dependencies using 3rd party DI container', async () => {
        class FooService {
            getFoo(){
                return 'FOO';
            }
        }
        const injector = {
            get(serviceIdentifier: any){
                if (serviceIdentifier === FooService) {
                    return new FooService();
                }
            }
        }
        @ObjectType({
            injector: ({ injector }: { injector: Injector }) => injector
        })
        class Query {
            @Inject() fooService: FooService;

            @Field()
            foo(): string {
                return this.fooService.getFoo();
            }
        }
        
        const result = await graphql({
            schema: new GraphQLSchema({
                query: getObjectTypeFromClass(Query) as GraphQLObjectType,
              }),
            contextValue: { injector },
            source: `{ foo }`
        });
          expect(result.errors).toBeFalsy();
          expect(result.data.foo).toBe("FOO");
    });
  });
  describe('Input Object Type', async () => {
    it('should build input object type using InputObjectType decorator', async () => {
      @InputObjectType()
      class Foo { }
      expect(stripWhitespaces(printType(getInputTypeFromClass(Foo)))).toBe(stripWhitespaces(`
        input Foo {

        }
      `));
    });
    it('should build input object type with scalar fields using InputField decorator', async () => {
      @InputObjectType()
      class Foo {
        @InputField()
        bar: string;
      }
      expect(stripWhitespaces(printType(getInputTypeFromClass(Foo)))).toBe(stripWhitespaces(`
        input Foo {
          bar: String
        }
      `));
    });
    it('should build input object type with array of scalar fields using InputField decorator', async () => {
      @InputObjectType()
      class Foo {
        @InputField(type => [String])
        bar: string[];
      }
      expect(stripWhitespaces(printType(getInputTypeFromClass(Foo)))).toBe(stripWhitespaces(`
        input Foo {
          bar: [String]
        }
      `));
    });
    it('should be used as an argument type', async () => {
      @InputObjectType()
      class Foo {
        @InputField()
        message: string;
      }
      @ObjectType()
      class Query {
        @Field()
        fooMessage(@Arg('foo') foo: Foo): string {
          return foo.message;
        }
      }
      const result = await graphql(new GraphQLSchema({
        query: getObjectTypeFromClass(Query) as GraphQLObjectType,
      }), `{ fooMessage(foo: { message: "FOO" }) }`);
      expect(result.errors).toBeFalsy();
      expect(result.data.fooMessage).toBe('FOO');
    });
    it('should work together with ObjectType', async () => {
      @InputObjectType({ name: 'FooInput' })
      @ObjectType()
      class Foo {
        @Field()
        @InputField()
        message: string;
      }

      @ObjectType()
      class Query {
        @Field()
        foo(@Arg('foo') foo: Foo): Foo {
          return foo;
        }
      }
      const result = await graphql(new GraphQLSchema({
        query: getObjectTypeFromClass(Query) as GraphQLObjectType,
      }), `{ foo(foo: { message: "FOO" }) { message } }`);
      expect(result.errors).toBeFalsy();
      expect(result.data.foo.message).toBe('FOO');
    });
    it('should extend input types', async () => {
        @InputObjectType({ name: 'Foo' })
        class BaseFooInput {
            @InputField()
            foo: String;
        }
        @InputObjectType({ name: 'Foo' })
        class ExtendedFooInput extends BaseFooInput {
            @InputField()
            bar: String;
        }
      expect(stripWhitespaces(printType(getInputTypeFromClass(ExtendedFooInput)))).toBe(stripWhitespaces(`
        input Foo {
            foo: String
            bar: String
        }
       `));
    });
    it('should make fields non-null if nullable is set false', async () => {
      @InputObjectType()
      class Foo {
        @InputField(type => String, { nullable: false })
        foo : string;
      }
      expect(stripWhitespaces(printType(getInputTypeFromClass(Foo)))).toBe(stripWhitespaces(`
        input Foo {
          foo: String!
        }
      `))
    });
  });
  describe('Interface Type', async () => {
    it('should build interface type using InterfaceType decorator', async () => {
      @InterfaceType()
      class Foo { }
      expect(stripWhitespaces(printType(getObjectTypeFromClass(Foo)))).toBe(stripWhitespaces(`
        interface Foo {

        }
      `));
    });
    it('should build interface type with scalar fields using Field decorator', async () => {
      @InterfaceType()
      class Foo {
        @Field()
        bar: string;
      }
      expect(stripWhitespaces(printType(getObjectTypeFromClass(Foo)))).toBe(stripWhitespaces(`
        interface Foo {
          bar: String
        }
      `));
    });
    it('should implements other types', async () => {
      @InterfaceType()
      abstract class Foo {
        @Field()
        foo: string;
      }
      @ObjectType({
        implements: [Foo],
      })
      class Bar implements Foo {
        @Field()
        foo: string;
        @Field()
        bar: string;
        @Field()
        qux: string;
      }
      expect(stripWhitespaces(printType(getObjectTypeFromClass(Bar)))).toBe(stripWhitespaces(`
        type Bar implements Foo {
          foo: String
          bar: String
          qux: String
        }
      `));
    });
    it('should resolve types correctly with resolveType', async () => {
        @InterfaceType({ 
            resolveType: (root: Foo) => {
                switch(root.discrimination) {
                    case 'bar':
                        return Bar;
                    case 'qux':
                        return Qux;
                }
            }
        })
        abstract class Foo {
            @Field()
            discrimination: string;
        }
        @ObjectType({ implements: Foo })
        class Bar implements Foo {
            @Field()
            discrimination: string = 'bar';
        }
        @ObjectType({ implements: Foo })
        class Qux implements Foo {
            @Field()
            discrimination: string = 'qux';
        }
        @ObjectType()
        class Query {
            @Field()
            fooBar(): Foo {
                return new Bar();
            }
            @Field()
            fooQux(): Foo {
                return new Qux();
            }
        }
        const result = await graphql(new GraphQLSchema({
            query: getObjectTypeFromClass(Query),
            types: [
                getObjectTypeFromClass(Bar), 
                getObjectTypeFromClass(Qux)
            ],
          }), `
            { 
                fooBar {
                    __typename 
                } 
                fooQux { 
                    __typename 
                } 
            }
          `);
          expect(result.errors).toBeFalsy();
          expect(result.data.fooBar.__typename).toBe("Bar");
          expect(result.data.fooQux.__typename).toBe("Qux");
    });
  });
  describe('Scalar Type', async () => {
    it('should build scalar type using ScalarType decorator', async () => {
      @ScalarType()
      class Foo { }
      expect(stripWhitespaces(printType(getScalarTypeFromClass(Foo)))).toBe(stripWhitespaces(`
        scalar Foo
      `));
    });
    it('should build object type with scalar field', async () => {
      @ScalarType()
      class Foo { }
      @ObjectType()
      class Query {
        @Field(type => Foo)
        foo: Foo;
      }
      expect(stripWhitespaces(printType(getObjectTypeFromClass(Query)))).toBe(stripWhitespaces(`
        type Query {
          foo: Foo
        }
      `));
    });
    it('should build input object type with scalar field', async () => {
      @ScalarType()
      class Foo { }
      @InputObjectType()
      class Bar {
        @InputField(type => Foo)
        foo: Foo;
      }
      expect(stripWhitespaces(printType(getInputTypeFromClass(Bar)))).toBe(stripWhitespaces(`
        input Bar {
          foo: Foo
        }
      `));
    });
  });
  describe('EnumType', async () => {
    it('should build enum type using EnumType decorator', async () => {
      enum Foo { a = 'a', b = 'b' }
      EnumType({ name: 'Foo' })(Foo);
      expect(stripWhitespaces(printType(getScalarTypeFromClass(Foo)))).toBe(stripWhitespaces(`
        enum Foo {
          a
          b
        }
      `));
    });
    it('should build object type with enum field', async () => {
      enum Foo { a = 'a', b = 'b' }
      EnumType({ name: 'Foo' })(Foo);
      @ObjectType()
      class Query {
        @Field(type => Foo) // Enums cannot be reflected, so we should define them explicitly
        foo: Foo;
      }
      expect(stripWhitespaces(printType(getObjectTypeFromClass(Query)))).toBe(stripWhitespaces(`
        type Query {
          foo: Foo
        }
      `));
    });
    it('should build input object type with enum field', async () => {
      enum Foo { a = 'a', b = 'b' }
      EnumType({ name: 'Foo' })(Foo);
      @InputObjectType()
      class Bar {
        @InputField(type => Foo) // Enums cannot be reflected, so we should define them explicitly
        foo: Foo;
      }
      expect(stripWhitespaces(printType(getInputTypeFromClass(Bar)))).toBe(stripWhitespaces(`
        input Bar {
          foo: Foo
        }
      `));
    });
  });
  describe('Union types', async () => {
    it('should build union type using UnionType decorator', async () => {
      const Foo = UnionType({ name: 'Foo', types: [String, Number], resolveType: () => String })({});
      type Foo = string | number;
      expect(stripWhitespaces(printType(getObjectTypeFromClass(Foo)))).toBe(stripWhitespaces(`
        union Foo = String | Float
      `));
    });
    it('should build object type with union field', async () => {
      const Foo = UnionType({ name: 'Foo', types: [String, Number], resolveType: () => String })({});
      type Foo = string | number;
      @ObjectType()
      class Query {
        @Field(type => Foo) // Unions cannot be reflected, so we should define them explicitly
        foo: Foo;
      }
      expect(stripWhitespaces(printType(getObjectTypeFromClass(Query)))).toBe(stripWhitespaces(`
        type Query {
          foo: Foo
        }
      `));
    });
  });
});
