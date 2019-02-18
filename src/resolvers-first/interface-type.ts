// tslint:disable-next-line:no-reference
/// <reference path="../../node_modules/reflect-metadata/index.d.ts" />

import { GraphQLInterfaceType, GraphQLInterfaceTypeConfig } from 'graphql';
import { GRAPHQL_OBJECT_TYPE, GRAPHQL_OBJECT_TYPE_CONFIG, GRAPHQL_OBJECT_TYPE_CONFIG_BUILD_QUEUE, getObjectTypeFromClass, CLASS_NAMES } from './object-type';
import { MaybePromise } from 'graphql/jsutils/MaybePromise';

export interface InterfaceTypeDecoratorConfig<TInterfaceClazz extends new (...args: any[]) => TInterface, TInterface> {
  name ?: string;
  resolveType ?: (this: TInterface, root: TInterface) => MaybePromise<TInterfaceClazz>;
}

export function InterfaceType<TSource, TContext, TInterfaceClazz extends new (...args: any[]) => TInterface, TInterface>(config : InterfaceTypeDecoratorConfig<TInterfaceClazz, TInterface> = {}): ClassDecorator {
  return target => {

    const classNames: string[] = Reflect.getMetadata(CLASS_NAMES, target) || [];
    classNames.push(target.name);
    Reflect.defineMetadata(CLASS_NAMES, classNames, target);

    const existingGraphQLObjectTypeQueue = Reflect.getMetadata(GRAPHQL_OBJECT_TYPE_CONFIG_BUILD_QUEUE, target, target.name) || [];
    existingGraphQLObjectTypeQueue.push(() => {
      const classNames: string[] = Reflect.getMetadata(CLASS_NAMES, target);
      const classNameIndex = classNames.indexOf(target.name);
      
      let superClassConfig: GraphQLInterfaceTypeConfig<TSource, TContext> = {} as any;
      if (classNameIndex > 0) {
        const superClassName = classNames[classNameIndex - 1];
        getObjectTypeFromClass(target, superClassName)
        superClassConfig = Reflect.getMetadata(
          GRAPHQL_OBJECT_TYPE_CONFIG,
          target,
          superClassName
        );
      }
      const existingConfig: GraphQLInterfaceTypeConfig<TSource, TContext> = Reflect.getMetadata(GRAPHQL_OBJECT_TYPE_CONFIG, target, target.name) || superClassConfig;
      Reflect.defineMetadata(GRAPHQL_OBJECT_TYPE, new GraphQLInterfaceType({
        name: config.name || target.name,
        resolveType: function(root: TInterface, ...args: any[]){
          const fieldType = config.resolveType.call(root, root, ...args);
          return getObjectTypeFromClass(fieldType) || fieldType;
        },
        ...existingConfig,
      }), target, target.name);
    });
    Reflect.defineMetadata(GRAPHQL_OBJECT_TYPE_CONFIG_BUILD_QUEUE, existingGraphQLObjectTypeQueue, target, target.name);
    return target;
  };
}
