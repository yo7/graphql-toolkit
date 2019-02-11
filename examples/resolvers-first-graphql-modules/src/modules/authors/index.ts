import { GraphQLModule } from '@graphql-modules/core';
import { getObjectTypeFromClass, extractFieldResolversFromObjectType, getInputTypeFromClass } from 'graphql-toolkit';
import { printType } from 'graphql';
import { Author } from './author';
import { AUTHORS_COLLECTION } from './symbols';
import { Query } from './query';
import { Mutation } from './mutation';

export const AuthorsModule = new GraphQLModule<{
    AUTHORS_COLLECTION: Author[]
}>({
    typeDefs: [
        printType(
            getObjectTypeFromClass(Author)
        ),
        printType(
            getInputTypeFromClass(Author)
        ),
        printType(
            getObjectTypeFromClass(Query)
        ),
        printType(
            getObjectTypeFromClass(Mutation)
        )
    ],
    resolvers: {
        Author: extractFieldResolversFromObjectType(
            getObjectTypeFromClass(Author)
        ),
        Query: extractFieldResolversFromObjectType(
            getObjectTypeFromClass(Query)
        ),
        Mutation: extractFieldResolversFromObjectType(
            getObjectTypeFromClass(Mutation)
        )
    },
    providers: ({ config }) => [
        {
            provide: AUTHORS_COLLECTION,
            useValue: config.AUTHORS_COLLECTION,
        }
    ]
});
