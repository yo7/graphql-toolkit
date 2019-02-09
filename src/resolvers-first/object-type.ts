// tslint:disable-next-line:no-reference
/// <reference path="../../node_modules/reflect-metadata/index.d.ts" />

import { GraphQLObjectType, GraphQLObjectTypeConfig, GraphQLList, GraphQLFieldResolver } from 'graphql';
import { Type, DESIGN_PARAMTYPES, DESIGN_TYPE, DESIGN_RETURNTYPE, AnyType, MaybeArray } from './common';
import { getScalarTypeFromClass } from './scalar-type';
import { getInputTypeFromClass } from './input-object-type';
import { asArray } from '../utils/helpers';

export const GRAPHQL_OBJECT_TYPE_CONFIG = Symbol('graphql:object-type-config');
export const GRAPHQL_OBJECT_TYPE = Symbol('graphql:object-type');
export const GRAPHQL_OBJECT_TYPE_CONFIG_BUILD_QUEUE = Symbol('graphql-object-type-build-queue');


export function Arg(argumentName: string): ParameterDecorator {
  return (target, propertyKey, parameterIndex) => {
    const existingGraphQLObjectTypeQueue = Reflect.getMetadata(GRAPHQL_OBJECT_TYPE_CONFIG_BUILD_QUEUE, target.constructor) || [];
    existingGraphQLObjectTypeQueue.push(() => {
      const existingConfig = Reflect.getMetadata(GRAPHQL_OBJECT_TYPE_CONFIG, target.constructor) || {};
      const fieldName = propertyKey;
      existingConfig.fields = existingConfig.fields || {};
      existingConfig.fields[fieldName] = existingConfig.fields[fieldName] || {};
      existingConfig.fields[fieldName].args = existingConfig.fields[fieldName].args || {};
      existingConfig.fields[fieldName].args.__defineGetter__(argumentName, () => {
        const argumentType = Reflect.getMetadata(DESIGN_PARAMTYPES, target, propertyKey)[parameterIndex];
        const argumentGraphQLInputType = getInputTypeFromClass(argumentType) || getScalarTypeFromClass(argumentType) || argumentType;
        return {
          type: argumentGraphQLInputType
        }
      });
      Reflect.defineMetadata(GRAPHQL_OBJECT_TYPE_CONFIG, existingConfig, target.constructor);
    });
    Reflect.defineMetadata(GRAPHQL_OBJECT_TYPE_CONFIG_BUILD_QUEUE, existingGraphQLObjectTypeQueue, target.constructor);
  };
}

export function Field<TSource, TContext, TArgs, TResult>(typeFactory?: (type: void) => Type<TResult> | GraphQLObjectType | AnyType | unknown) {
  return (target: TSource, propertyKey: string) => {
    const existingGraphQLObjectTypeQueue = Reflect.getMetadata(GRAPHQL_OBJECT_TYPE_CONFIG_BUILD_QUEUE, target.constructor) || [];
    existingGraphQLObjectTypeQueue.push(() => {
      const existingConfig: GraphQLObjectTypeConfig<TSource, TContext> = Reflect.getMetadata(GRAPHQL_OBJECT_TYPE_CONFIG, target.constructor) || {};          
      const fieldName = propertyKey;      
      existingConfig.fields = existingConfig.fields || {};
      existingConfig.fields[fieldName] = existingConfig.fields[fieldName] || {};
      existingConfig.fields[fieldName].__defineGetter__('type', () => {
        const fieldType = typeFactory ? typeFactory() : (typeof target[propertyKey] === 'function' ? Reflect.getMetadata(DESIGN_RETURNTYPE, target, propertyKey) : Reflect.getMetadata(DESIGN_TYPE, target, propertyKey)) ;
        return getObjectTypeFromClass(fieldType) || getScalarTypeFromClass(fieldType) || fieldType;
      });
      if (typeof target[propertyKey] === 'function') {
        existingConfig.fields[fieldName].resolve = ((root, args) => target[propertyKey].call(root, ...Object['values'](args))) as GraphQLFieldResolver<TSource, TContext, TArgs>; // TODO: NOT SAFE
      }
      Reflect.defineMetadata(GRAPHQL_OBJECT_TYPE_CONFIG, existingConfig, target.constructor);
    });
    Reflect.defineMetadata(GRAPHQL_OBJECT_TYPE_CONFIG_BUILD_QUEUE, existingGraphQLObjectTypeQueue, target.constructor);
  };
}

export interface ObjectTypeDecoratorConfig<TResult> {
  name?: string;
  implements?: MaybeArray<Type<TResult> | GraphQLObjectType | AnyType | unknown>;
}

export function ObjectType<TSource, TResult, TContext>(config: ObjectTypeDecoratorConfig<TResult> = {}): ClassDecorator {
  return target => {
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
    !Reflect.hasMetadata(GRAPHQL_OBJECT_TYPE, target as Type<T>) && 
    Reflect.hasMetadata(GRAPHQL_OBJECT_TYPE_CONFIG_BUILD_QUEUE, target as Type<T>)
  ) {
    const existingGraphQLObjectTypeQueue: Array<Function> = Reflect.getMetadata(GRAPHQL_OBJECT_TYPE_CONFIG_BUILD_QUEUE, target as Type<T>);
    existingGraphQLObjectTypeQueue.forEach(fn => fn());
  }
  return Reflect.getMetadata(GRAPHQL_OBJECT_TYPE, target as Type<T>);
}
