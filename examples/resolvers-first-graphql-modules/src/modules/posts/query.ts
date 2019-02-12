import { ObjectType, Field } from 'graphql-toolkit';
import { Inject } from '@graphql-modules/di';
import { Post } from './post';
import { POSTS_COLLECTION } from './symbols';

@ObjectType({ injector: ({ injector }) => injector })
export class Query {
  @Inject(POSTS_COLLECTION) postsCollection: Post[];
  @Field(() => [Post])
  posts(): Post[] {
    return this.postsCollection;
  }
}
