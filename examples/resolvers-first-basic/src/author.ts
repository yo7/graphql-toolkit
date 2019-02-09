import { ObjectType, Field, InputObjectType, InputField } from 'graphql-toolkit';
import { Post } from './post';
import { POSTS } from './posts.collection';

@ObjectType()
@InputObjectType({ name: 'AuthorInput'})
export class Author {
  constructor({ id, name }: any) {
    this.id  = id;
    this.name = name;
  }
  @Field()
  @InputField()
  id: number;
  @Field()
  @InputField()
  name: string;
  @Field(() => [Post])
  posts(): Post[] {
    return POSTS.filter(({ authorId }) => authorId === this.id);
  }
}
