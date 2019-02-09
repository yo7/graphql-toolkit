import { ObjectType, Field } from 'graphql-toolkit';
import { Author } from './author';
import { Post } from './post';
import { POSTS } from './posts.collection';
import { AUTHORS } from './authors.collection';

@ObjectType()
export class Query {
  @Field(() => [Author])
  authors(): Author[] {
    return AUTHORS;
  }
  @Field(() => [Author])
  posts(): Post[] {
    return POSTS;
  }
}
