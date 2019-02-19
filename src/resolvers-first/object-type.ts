// tslint:disable-next-line:no-reference
/// <reference path="../../node_modules/reflect-metadata/index.d.ts" />

import { GraphQLObjectType, GraphQLObjectTypeConfig, GraphQLList, GraphQLFieldResolver, GraphQLNonNull, GraphQLInputType } from 'graphql';
import { Type, DESIGN_PARAMTYPES, DESIGN_TYPE, DESIGN_RETURNTYPE, AnyType, MaybeArray } from './common';
import { getScalarTypeFromClass } from './scalar-type';
import { getInputTypeFromClass } from './input-object-type';
import { asArray } from '../utils/helpers';
import { withFilter } from 'graphql-subscriptions';

export const CLASSES = 'classes';
export const PROPERTY_KEYS = 'property-keys';
export const GRAPHQL_OBJECT_TYPE_CONFIG_MAP = new WeakMap<Function, GraphQLObjectTypeConfig<any, any>>();
export const GRAPHQL_OBJECT_TYPE_MAP = new WeakMap<Function, GraphQLObjectType<any, any>>();
export const GRAPHQL_OBJECT_TYPE_CONFIG_BUILD_QUEUE_MAP = new WeakMap<Function, Array<() => void>>();
export const CONTEXT_INJECTOR_FACTORY_MAP = new WeakMap<Function, ContextInjectorFactory<any>>();

export interface ArgDecoratorConfig<TResult> {
  type ?: Type<TResult> | GraphQLInputType | object;
  nullable ?: boolean;
}



export function Arg<TSource, TContext, TResult>(argumentName: string, config ?: ArgDecoratorConfig<TResult>): ParameterDecorator {
  return (target, propertyKey, parameterIndex) => {
    const existingGraphQLObjectTypeQueue = GRAPHQL_OBJECT_TYPE_CONFIG_BUILD_QUEUE_MAP.get(target.constructor) || [];
    existingGraphQLObjectTypeQueue.push(() => {
      const classes: Function[] = Reflect.getMetadata(CLASSES, target.constructor);
      const classIndex = classes.indexOf(target.constructor);
      let superClassConfig: GraphQLObjectTypeConfig<TSource, TContext> = {} as any;
      if (classIndex > 0) {
        const superClass = classes[classIndex - 1];
        getObjectTypeFromClass(superClass);
        superClassConfig = GRAPHQL_OBJECT_TYPE_CONFIG_MAP.get(superClass);
      }
      const existingConfig: GraphQLObjectTypeConfig<TSource, TContext> = GRAPHQL_OBJECT_TYPE_CONFIG_MAP.get(target.constructor) || superClassConfig;
      const fieldName = propertyKey;
      existingConfig.fields = existingConfig.fields || {};
      existingConfig.fields[fieldName] = existingConfig.fields[fieldName] || {};
      existingConfig.fields[fieldName].args = existingConfig.fields[fieldName].args || {};
      existingConfig.fields[fieldName].args.__defineGetter__(argumentName, () => {
        const argumentType = (config && config.type ) || Reflect.getMetadata(DESIGN_PARAMTYPES, target, propertyKey)[parameterIndex];
        const argumentGraphQLInputType = getInputTypeFromClass(argumentType) || getScalarTypeFromClass(argumentType) || argumentType;
        if (config && 'nullable' in config && !config.nullable) {
          return {
            type: new GraphQLNonNull(argumentGraphQLInputType)
          };
        } else {
          return {
            type: argumentGraphQLInputType
          };
        }
      });
      GRAPHQL_OBJECT_TYPE_CONFIG_MAP.set(target.constructor, existingConfig);
    });
    GRAPHQL_OBJECT_TYPE_CONFIG_BUILD_QUEUE_MAP.set(target.constructor, existingGraphQLObjectTypeQueue);
  };
}

export interface FieldDecoratorConfig {
  name ?: string;
  nullable ?: boolean;
  subscribe ?: boolean;
  filter ?: GraphQLFieldResolver<any, any, any>;
}

export function Field<TSource, TContext, TArgs, TResult>(typeFactory?: (type: void) => Type<TResult> | GraphQLObjectType | AnyType | unknown, config ?: FieldDecoratorConfig) {
  return (target: TSource, propertyKey: string) => {
    const existingGraphQLObjectTypeQueue = GRAPHQL_OBJECT_TYPE_CONFIG_BUILD_QUEUE_MAP.get(target.constructor) || [];
    existingGraphQLObjectTypeQueue.push(() => {

      const classes: Function[] = Reflect.getMetadata(CLASSES, target.constructor);
      const classIndex = classes.indexOf(target.constructor);
      let superClassConfig: GraphQLObjectTypeConfig<TSource, TContext> = {} as any;
      if (classIndex > 0) {
        const superClass = classes[classIndex - 1];
        getObjectTypeFromClass(superClass);
        superClassConfig = GRAPHQL_OBJECT_TYPE_CONFIG_MAP.get(superClass) || {} as any;
      }
      const existingConfig: GraphQLObjectTypeConfig<TSource, TContext> = GRAPHQL_OBJECT_TYPE_CONFIG_MAP.get(target.constructor) || superClassConfig;       
      const fieldName = ( config && config.name ) || propertyKey;      
      existingConfig.fields = existingConfig.fields || {};
      if (fieldName !== propertyKey && propertyKey in existingConfig.fields) {
        existingConfig.fields[fieldName] = existingConfig.fields[propertyKey];
        delete existingConfig.fields[propertyKey];
      }
      existingConfig.fields[fieldName] = existingConfig.fields[fieldName] || {};
      existingConfig.fields[fieldName].__defineGetter__('type', () => {
        const fieldType = typeFactory ? typeFactory() : (typeof target[propertyKey] === 'function' ? Reflect.getMetadata(DESIGN_RETURNTYPE, target, propertyKey) : Reflect.getMetadata(DESIGN_TYPE, target, propertyKey)) ;
        const graphQLType = getObjectTypeFromClass(fieldType) || getScalarTypeFromClass(fieldType) || fieldType;
        if (config && 'nullable' in config && !config.nullable) {
          return new GraphQLNonNull(graphQLType);
        } else {
          return graphQLType;
        }
      });
      if (typeof target[propertyKey] === 'function') {
        const funcProp = (config && config.subscribe) ? 'subscribe' : 'resolve';
        const resolverFn = existingConfig.fields[fieldName][funcProp] = ((root, args, context) => {
          // If 3rd party DI container is defined
          if (CONTEXT_INJECTOR_FACTORY_MAP.has(target.constructor)) {
            const contextInjectorFactoryDefinition: ContextInjectorFactory<TContext> = CONTEXT_INJECTOR_FACTORY_MAP.get(target.constructor);
            let injector: Injector;
            if (typeof contextInjectorFactoryDefinition === 'function') {
              injector = contextInjectorFactoryDefinition(context);
            } else if(typeof contextInjectorFactoryDefinition === 'object') {
              injector = contextInjectorFactoryDefinition;
            }
            const keys = Reflect.getMetadata(PROPERTY_KEYS, target.constructor) || [];
            for (const key of keys) {
              if (Reflect.getMetadata(DESIGN_TYPE, target, key as string)) {
                root = root || {} as any;
                Object.defineProperty(root, key, {
                  get() {
                    const serviceIdentifier = Reflect.getMetadata(DESIGN_TYPE, target, key as string);
                    return injector.get(serviceIdentifier);
                  }
                })
              }
            }
          }
          return target[propertyKey].call(root, ...Object['values'](args));
        }) as GraphQLFieldResolver<TSource, TContext, TArgs>; // TODO: NOT SAFE
        if (config && config.subscribe && config.filter) {
          existingConfig.fields[fieldName].subscribe = withFilter(
            resolverFn,
            (root, args, context, info) => {
              const _this = {};
              // If 3rd party DI container is defined
              if (CONTEXT_INJECTOR_FACTORY_MAP.has(target.constructor)) {
                const contextInjectorFactoryDefinition: ContextInjectorFactory<TContext> = CONTEXT_INJECTOR_FACTORY_MAP.get(target.constructor);
                let injector: Injector;
                if (typeof contextInjectorFactoryDefinition === 'function') {
                  injector = contextInjectorFactoryDefinition(context);
                } else if(typeof contextInjectorFactoryDefinition === 'object') {
                  injector = contextInjectorFactoryDefinition;
                }
                const keys = Reflect.getMetadata(PROPERTY_KEYS, target.constructor) || [];
                for (const key of keys) {
                  if (Reflect.getMetadata(DESIGN_TYPE, target, key as string)) {
                    Object.defineProperty(_this, key, {
                      get() {
                        const serviceIdentifier = Reflect.getMetadata(DESIGN_TYPE, target, key as string);
                        return injector.get(serviceIdentifier);
                      }
                    })
                  }
                }
              }
              return config.filter.call(_this, root, args, context, info);
            }
          )
        }
      }
      GRAPHQL_OBJECT_TYPE_CONFIG_MAP.set(target.constructor, existingConfig);
    });
    GRAPHQL_OBJECT_TYPE_CONFIG_BUILD_QUEUE_MAP.set(target.constructor, existingGraphQLObjectTypeQueue);
  };
}


export function Inject(serviceIdentifier ?: any): PropertyDecorator {
  return (target: any, propertyKey?: string, index?: number) => {
    const allDependencies = Reflect.getMetadata(DESIGN_PARAMTYPES, target) || [];
    const propertyKeys = Reflect.getMetadata(PROPERTY_KEYS, target.constructor || target) || [];
    if (typeof propertyKey === 'undefined') {
      if (typeof index !== 'undefined') {
        allDependencies[index] = serviceIdentifier;
      }
    } else {
      const designType = serviceIdentifier || Reflect.getMetadata(DESIGN_TYPE, target, propertyKey);
      Reflect.defineMetadata(DESIGN_TYPE, designType, target, propertyKey);
      propertyKeys.push(propertyKey);
    }
    Reflect.defineMetadata(DESIGN_PARAMTYPES, allDependencies, target);
    Reflect.defineMetadata(PROPERTY_KEYS, propertyKeys, target.constructor || target);
    return target;
  };
}

export interface Injector {
  get<T>(serviceIdentifier: any): T;
}

export type ContextInjectorFactory<TContext> = (context: TContext) => Injector | Injector;

export interface ObjectTypeDecoratorConfig<TResult, TContext> {
  name?: string;
  implements?: MaybeArray<Type<TResult> | GraphQLObjectType | AnyType | unknown>;
  injector?: ContextInjectorFactory<TContext>;
}

export function ObjectType<TSource, TResult, TContext = any>(config: ObjectTypeDecoratorConfig<TResult, TContext> = {}): ClassDecorator {
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
      let superClassConfig: GraphQLObjectTypeConfig<TSource, TContext> = {} as any;
      if (classIndex > 0) {
        const superClass = classes[classIndex - 1];
        getObjectTypeFromClass(superClass);
        superClassConfig = GRAPHQL_OBJECT_TYPE_CONFIG_MAP.get(superClass);
      }
      const existingConfig: GraphQLObjectTypeConfig<TSource, TContext> = GRAPHQL_OBJECT_TYPE_CONFIG_MAP.get(target) || superClassConfig;
      GRAPHQL_OBJECT_TYPE_MAP.set(target, new GraphQLObjectType({
        name: config.name || target.name,
        interfaces: asArray(config.implements).map(interfaceType => getObjectTypeFromClass(interfaceType) || interfaceType),
        ...existingConfig,
      }))
    });
    GRAPHQL_OBJECT_TYPE_CONFIG_BUILD_QUEUE_MAP.set(target, existingGraphQLObjectTypeQueue);
    return target;
  };
}

export function getObjectTypeFromClass<T>(target: Type<T> | unknown): any { // TODO: unknowns should be replaced with a proper type
  if (target instanceof Array) {
    const elementType = getObjectTypeFromClass(target[0]);
    return elementType && new GraphQLList(elementType);
  }
  if (
    !GRAPHQL_OBJECT_TYPE_CONFIG_MAP.has(target as Type<T>) && 
    GRAPHQL_OBJECT_TYPE_CONFIG_BUILD_QUEUE_MAP.has(target as Type<T>)
  ) {
    const existingGraphQLObjectTypeQueue = GRAPHQL_OBJECT_TYPE_CONFIG_BUILD_QUEUE_MAP.get(target as Type<T>);
    existingGraphQLObjectTypeQueue.forEach(fn => fn());
  }
  return GRAPHQL_OBJECT_TYPE_MAP.get(target as Type<T>);
}
