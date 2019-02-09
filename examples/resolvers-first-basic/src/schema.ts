import { GraphQLSchema } from 'graphql';
import { getObjectTypeFromClass } from 'graphql-toolkit';
import { Query } from './query';
import { Mutation } from './mutation';

export const schema = new GraphQLSchema({
  query: getObjectTypeFromClass(Query),
  mutation: getObjectTypeFromClass(Mutation)
});
