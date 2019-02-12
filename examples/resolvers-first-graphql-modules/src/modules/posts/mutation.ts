import { ObjectType, Field, Arg } from 'graphql-toolkit';
import { Inject } from '@graphql-modules/di';
import { Post } from './post';
import { POSTS_COLLECTION } from './symbols';

@ObjectType({ injector: ({ injector }) => injector })
export class Mutation {
    @Inject(POSTS_COLLECTION) postsCollection: Post[];
    @Field()
    addPost(@Arg('post') post: Post): number {
        this.postsCollection.push(post);
        return post.id;
    }
}
