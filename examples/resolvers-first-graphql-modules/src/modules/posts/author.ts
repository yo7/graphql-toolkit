import { ObjectType, Field, InputObjectType } from 'graphql-toolkit';
import { Post } from './post';
import { Inject } from '@graphql-modules/di';
import { POSTS_COLLECTION } from './symbols';
import { Author as AuthorsAuthor } from '../authors/author'

@ObjectType({ injector: ({ injector }) => injector })
@InputObjectType({ name: 'AuthorInput'})
export class Author extends AuthorsAuthor {
  @Inject(POSTS_COLLECTION) postsCollection: Post[];
  @Field(() => [Post])
  posts(): Post[] {
    return this.postsCollection.filter(({ authorId }) => authorId === this.id);
  }
}
