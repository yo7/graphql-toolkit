// tslint:disable-next-line:no-reference
/// <reference path="../../node_modules/reflect-metadata/index.d.ts" />

import { GraphQLObjectType, GraphQLObjectTypeConfig, GraphQLList, GraphQLFieldResolver, GraphQLFieldConfig, GraphQLNonNull, GraphQLInputType, GraphQLFieldConfigArgumentMap, GraphQLArgumentConfig } from 'graphql';
import { Type, DESIGN_PARAMTYPES, DESIGN_TYPE, DESIGN_RETURNTYPE, AnyType, MaybeArray } from './common';
import { getScalarTypeFromClass } from './scalar-type';
import { getInputTypeFromClass } from './input-object-type';
import { asArray } from '../utils/helpers';

export const GRAPHQL_OBJECT_TYPE_CONFIG = 'graphql:object-type-config';
export const GRAPHQL_OBJECT_TYPE = 'graphql:object-type';
export const GRAPHQL_OBJECT_TYPE_CONFIG_BUILD_QUEUE = 'graphql-object-type-build-queue';
export const CONTEXT_INJECTOR_FACTORY = 'context-injector:factory';
export const PROPERTY_KEYS = 'property-keys';

export interface ArgDecoratorConfig<TResult> {
  type ?: Type<TResult> | GraphQLInputType | object;
  nullable ?: boolean;
}

export function Arg<TSource, TContext, TResult>(argumentName: string, config ?: ArgDecoratorConfig<TResult>): ParameterDecorator {
  return (target, propertyKey, parameterIndex) => {
    const existingGraphQLObjectTypeQueue = Reflect.getMetadata(GRAPHQL_OBJECT_TYPE_CONFIG_BUILD_QUEUE, target.constructor) || [];
    existingGraphQLObjectTypeQueue.push(() => {
      const existingConfig: GraphQLObjectTypeConfig<TSource, TContext> = Reflect.getMetadata(GRAPHQL_OBJECT_TYPE_CONFIG, target.constructor) || {};
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
      Reflect.defineMetadata(GRAPHQL_OBJECT_TYPE_CONFIG, existingConfig, target.constructor);
    });
    Reflect.defineMetadata(GRAPHQL_OBJECT_TYPE_CONFIG_BUILD_QUEUE, existingGraphQLObjectTypeQueue, target.constructor);
  };
}

export interface FieldDecoratorConfig {
  name ?: string;
  nullable ?: boolean;
}

export function Field<TSource, TContext, TArgs, TResult>(typeFactory?: (type: void) => Type<TResult> | GraphQLObjectType | AnyType | unknown, config ?: FieldDecoratorConfig) {
  return (target: TSource, propertyKey: string) => {
    const existingGraphQLObjectTypeQueue = Reflect.getMetadata(GRAPHQL_OBJECT_TYPE_CONFIG_BUILD_QUEUE, target.constructor) || [];
    existingGraphQLObjectTypeQueue.push(() => {
      const existingConfig: GraphQLObjectTypeConfig<TSource, TContext> = Reflect.getMetadata(GRAPHQL_OBJECT_TYPE_CONFIG, target.constructor) || {};          
      const fieldName = ( config && config.name ) || propertyKey;      
      existingConfig.fields = existingConfig.fields || {};
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
        existingConfig.fields[fieldName].resolve = ((root, args, context) => {
          // If 3rd party DI container is defined
          if (Reflect.getMetadata(CONTEXT_INJECTOR_FACTORY, target.constructor)) {
            const contextInjectorFactoryDefinition: ContextInjectorFactory<TContext> | Injector = Reflect.getMetadata(CONTEXT_INJECTOR_FACTORY, target.constructor);
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
      }
      Reflect.defineMetadata(GRAPHQL_OBJECT_TYPE_CONFIG, existingConfig, target.constructor);
    });
    Reflect.defineMetadata(GRAPHQL_OBJECT_TYPE_CONFIG_BUILD_QUEUE, existingGraphQLObjectTypeQueue, target.constructor);
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

export type ContextInjectorFactory<TContext> = (context: TContext) => Injector;

export interface ObjectTypeDecoratorConfig<TResult, TContext> {
  name?: string;
  implements?: MaybeArray<Type<TResult> | GraphQLObjectType | AnyType | unknown>;
  injector?: ContextInjectorFactory<TContext> | Injector;
}

export function ObjectType<TSource, TResult, TContext>(config: ObjectTypeDecoratorConfig<TResult, TContext> = {}): ClassDecorator {
  return target => {
    // Delete the existing metadata on redeclaration, because it should override the existing generated ObjectType of the inherited super class
    Reflect.defineMetadata(GRAPHQL_OBJECT_TYPE, undefined, target);
    if (config.injector) {
      Reflect.defineMetadata(CONTEXT_INJECTOR_FACTORY, config.injector, target);
    }
    const existingGraphQLObjectTypeQueue = Reflect.getMetadata(GRAPHQL_OBJECT_TYPE_CONFIG_BUILD_QUEUE, target) || [];
    existingGraphQLObjectTypeQueue.push(() => {
      const existingConfig: GraphQLObjectTypeConfig<TSource, TContext> = Reflect.getMetadata(GRAPHQL_OBJECT_TYPE_CONFIG, target) || {};
      Reflect.defineMetadata(GRAPHQL_OBJECT_TYPE, new GraphQLObjectType({
        name: config.name || target.name,
        interfaces: asArray(config.implements).map(interfaceType => getObjectTypeFromClass(interfaceType) || interfaceType),
        ...existingConfig,
      }), target);
    });
    Reflect.defineMetadata(GRAPHQL_OBJECT_TYPE_CONFIG_BUILD_QUEUE, existingGraphQLObjectTypeQueue, target);
    return target;
  };
}

export function getObjectTypeFromClass<T>(target: Type<T> | unknown): any { // TODO: unknowns should be replaced with a proper type
  if (target instanceof Array) {
    const elementType = getObjectTypeFromClass(target[0]);
    return elementType && new GraphQLList(elementType);
  }
  if (
    !Reflect.getMetadata(GRAPHQL_OBJECT_TYPE, target as Type<T>) && 
    Reflect.getMetadata(GRAPHQL_OBJECT_TYPE_CONFIG_BUILD_QUEUE, target as Type<T>)
  ) {
    const existingGraphQLObjectTypeQueue: Array<Function> = Reflect.getMetadata(GRAPHQL_OBJECT_TYPE_CONFIG_BUILD_QUEUE, target as Type<T>);
    existingGraphQLObjectTypeQueue.forEach(fn => fn());
  }
  return Reflect.getMetadata(GRAPHQL_OBJECT_TYPE, target as Type<T>);
}
