// tslint:disable-next-line:no-reference
/// <reference path="../../node_modules/reflect-metadata/index.d.ts" />

import { GraphQLInterfaceType, GraphQLInterfaceTypeConfig } from 'graphql';
import { getObjectTypeFromClass, GRAPHQL_OBJECT_TYPE_CONFIG_MAP, CLASSES, CONTEXT_INJECTOR_FACTORY_MAP, ContextInjectorFactory, GRAPHQL_OBJECT_TYPE_CONFIG_BUILD_QUEUE_MAP, GRAPHQL_OBJECT_TYPE_MAP } from './object-type';
import { MaybePromise } from 'graphql/jsutils/MaybePromise';

export interface InterfaceTypeDecoratorConfig<TInterfaceClazz extends new (...args: any[]) => TInterface, TInterface, TContext = any> {
  name ?: string;
  resolveType ?: (this: TInterface, root: TInterface) => MaybePromise<TInterfaceClazz>;
  injector?: ContextInjectorFactory<TContext>;
}

export function InterfaceType<TSource, TContext, TInterfaceClazz extends new (...args: any[]) => TInterface, TInterface>(config : InterfaceTypeDecoratorConfig<TInterfaceClazz, TInterface> = {}): ClassDecorator {
  return target => {

    const classes: Function[] = Reflect.getMetadata(CLASSES, target) || [];
    classes.push(target);
    Reflect.defineMetadata(CLASSES, classes, target);

    if (config.injector) {
      CONTEXT_INJECTOR_FACTORY_MAP.set(target, config.injector);
    }
    const existingGraphQLObjectTypeQueue = GRAPHQL_OBJECT_TYPE_CONFIG_BUILD_QUEUE_MAP.get(target) || [];
    existingGraphQLObjectTypeQueue.push(() => {
      const classes: Function[] = Reflect.getMetadata(CLASSES, target);
      const classIndex = classes.indexOf(target);
      let superClassConfig: GraphQLInterfaceTypeConfig<TSource, TContext> = {} as any;
      if (classIndex > 0) {
        const superClass = classes[classIndex - 1];
        getObjectTypeFromClass(superClass);
        superClassConfig = GRAPHQL_OBJECT_TYPE_CONFIG_MAP.get(superClass) as any;
      }
      const existingConfig: GraphQLInterfaceTypeConfig<TSource, TContext> = GRAPHQL_OBJECT_TYPE_CONFIG_MAP.get(target) || superClassConfig as any;
      GRAPHQL_OBJECT_TYPE_MAP.set(target, new GraphQLInterfaceType({
        name: config.name || target.name,
        resolveType: function(root: TInterface, ...args: any[]){
          const fieldType = config.resolveType.call(root, root, ...args);
          return getObjectTypeFromClass(fieldType) || fieldType;
        },
        ...existingConfig,
      }) as any);
    });
    GRAPHQL_OBJECT_TYPE_CONFIG_BUILD_QUEUE_MAP.set(target, existingGraphQLObjectTypeQueue);
    return target;
  };
}
