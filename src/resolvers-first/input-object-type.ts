// tslint:disable-next-line:no-reference
/// <reference path="../../node_modules/reflect-metadata/index.d.ts" />

import { GraphQLInputObjectType, GraphQLInputObjectTypeConfig, GraphQLInputFieldConfig, GraphQLInputType, GraphQLList, GraphQLNonNull } from 'graphql';
import { Type, DESIGN_TYPE } from './common';
import { getScalarTypeFromClass } from '.';
import { FieldDecoratorConfig } from './object-type';

const GRAPHQL_INPUT_OBJECT_TYPE_CONFIG = 'graphql:input-object-type-config';
const GRAPHQL_INPUT_TYPE = 'graphql:input-type';

export function InputField<TSource, TResult>(typeFactory?: (type: void) => Type<TResult> | GraphQLInputType | object, config ?: FieldDecoratorConfig): PropertyDecorator {
  return (target: TSource, propertyKey) => {
    const existingConfig = Reflect.getMetadata(GRAPHQL_INPUT_OBJECT_TYPE_CONFIG, target.constructor) || {};
    const inputFieldName = ( config && config.name ) || propertyKey;
    const inputFieldType = typeFactory ? typeFactory() : Reflect.getMetadata(DESIGN_TYPE, target, propertyKey);
    const inputFieldGraphQLType = getInputTypeFromClass(inputFieldType) || getScalarTypeFromClass(inputFieldType) || inputFieldType;
    const inputFieldConfig: GraphQLInputFieldConfig = {
      type: (config && 'nullable' in config && !config.nullable) ? new GraphQLNonNull(inputFieldGraphQLType) : inputFieldGraphQLType,
    };
    existingConfig.fields = existingConfig.fields || {};
    existingConfig.fields[inputFieldName] = {
      ...(existingConfig.fields[inputFieldName] || {}),
      ...inputFieldConfig,
    };
    Reflect.defineMetadata(GRAPHQL_INPUT_OBJECT_TYPE_CONFIG, existingConfig, target.constructor);
  };
}

export function InputObjectType(config : Partial<GraphQLInputObjectTypeConfig> = {}): ClassDecorator {
  return target => {
    const existingConfig: GraphQLInputObjectTypeConfig = Reflect.getMetadata(GRAPHQL_INPUT_OBJECT_TYPE_CONFIG, target) || {};
    Reflect.defineMetadata(GRAPHQL_INPUT_TYPE, new GraphQLInputObjectType({
      name: target.name,
      ...existingConfig,
      ...config,
    }), target);
    return target;
  };
}

export function getInputTypeFromClass<T>(target: Type<T>): any {
  if (target instanceof Array) {
    const elementType = getInputTypeFromClass(target[0]);
    return elementType && new GraphQLList(elementType);
  }
  return Reflect.getMetadata(GRAPHQL_INPUT_TYPE, target);
}
