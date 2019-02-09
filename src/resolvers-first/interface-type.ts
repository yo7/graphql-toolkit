// tslint:disable-next-line:no-reference
/// <reference path="../../node_modules/reflect-metadata/index.d.ts" />

import { GraphQLInterfaceType, GraphQLInterfaceTypeConfig } from 'graphql';
import { GRAPHQL_OBJECT_TYPE, GRAPHQL_OBJECT_TYPE_CONFIG, GRAPHQL_OBJECT_TYPE_CONFIG_BUILD_QUEUE, getObjectTypeFromClass } from './object-type';
import { MaybePromise } from 'graphql/jsutils/MaybePromise';

export interface InterfaceTypeDecoratorConfig<TInterfaceClazz extends new (...args: any[]) => TInterface, TInterface> {
  name ?: string;
  resolveType ?: (this: TInterface, root: TInterface) => MaybePromise<TInterfaceClazz>;
}

export function InterfaceType<TSource, TContext, TInterfaceClazz extends new (...args: any[]) => TInterface, TInterface>(config : InterfaceTypeDecoratorConfig<TInterfaceClazz, TInterface> = {}): ClassDecorator {
  return target => {
    const existingGraphQLObjectTypeQueue = Reflect.getMetadata(GRAPHQL_OBJECT_TYPE_CONFIG_BUILD_QUEUE, target) || [];
    existingGraphQLObjectTypeQueue.push(() => {
      const existingConfig: GraphQLInterfaceTypeConfig<TSource, TContext> = Reflect.getMetadata(GRAPHQL_OBJECT_TYPE_CONFIG, target) || {};
      Reflect.defineMetadata(GRAPHQL_OBJECT_TYPE, new GraphQLInterfaceType({
        name: config.name || target.name,
        resolveType: function(root: TInterface, ...args: any[]){
          const fieldType = config.resolveType.call(root, root, ...args);
          return getObjectTypeFromClass(fieldType) || fieldType;
        },
        ...existingConfig,
      }), target);
    });
    Reflect.defineMetadata(GRAPHQL_OBJECT_TYPE_CONFIG_BUILD_QUEUE, existingGraphQLObjectTypeQueue, target);
    return target;
  };
}
