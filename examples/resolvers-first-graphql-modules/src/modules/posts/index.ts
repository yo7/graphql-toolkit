import { GraphQLModule } from '@graphql-modules/core';
import { getObjectTypeFromClass, extractFieldResolversFromObjectType, getInputTypeFromClass } from 'graphql-toolkit';
import { printType } from 'graphql';
import { Author } from './author';
import { Query } from './query';
import { Post } from '../posts/post';
import { POSTS_COLLECTION } from './symbols';
import { AuthorsModule } from '../authors';
import { Mutation } from './mutation';

export const PostsModule = new GraphQLModule<{
    POSTS_COLLECTION: Post[]
}>({
    imports: [
        AuthorsModule
    ],
    typeDefs: [
        printType(
            getObjectTypeFromClass(Post)
        ),
        printType(
            getInputTypeFromClass(Post)
        ),
        printType(
            getObjectTypeFromClass(Author)
        ),
        printType(
            getObjectTypeFromClass(Query)
        ),
        printType(
            getObjectTypeFromClass(Mutation)
        )
    ],
    resolvers: {
        Post: extractFieldResolversFromObjectType(
            getObjectTypeFromClass(Post)
        ),
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
            provide: POSTS_COLLECTION,
            useValue: config.POSTS_COLLECTION,
        }
    ]
});
