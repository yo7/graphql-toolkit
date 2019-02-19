import { GraphQLUnionType } from 'graphql';
import { getScalarTypeFromClass } from './scalar-type';
import { AnyType } from './common';
import { GRAPHQL_OBJECT_TYPE_MAP, getObjectTypeFromClass } from './object-type';

interface UnionTypeDecoratorConfig<TTypes extends AnyType[]> {
  name: string;
  types: TTypes;
  resolveType: (...args: any[]) => TTypes[any];
}

export function UnionType<TTypes extends Array<new (...args: any[]) => any>>(config: UnionTypeDecoratorConfig<TTypes>) {
  return (target: any): TTypes[any] => {
    GRAPHQL_OBJECT_TYPE_MAP.set(target, new GraphQLUnionType({
      name: config.name,
      resolveType: (...args) => {
        const type = config.resolveType(...args);
        return getObjectTypeFromClass(type) || getScalarTypeFromClass(type) || type;
      },
      types: config.types.map(type => getObjectTypeFromClass(type) || getScalarTypeFromClass(type) || type),
    }) as any);
    return target;
  };
}
