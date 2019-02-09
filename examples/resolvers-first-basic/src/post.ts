import { ObjectType, Field, InputField, InputObjectType } from 'graphql-toolkit';
import { Author } from './author';
import { AUTHORS } from './authors.collection';

@ObjectType()
@InputObjectType({ name: 'PostInput' })
export class Post {
  constructor({ id, title, content, authorId }: any) {
    this.id = id;
    this.title = title;
    this.content = content;
    this.authorId = authorId;
  }
  @InputField()
  @Field()
  id: number;
  @InputField()
  @Field()
  title: string;
  @InputField()
  @Field()
  content: string;
  @Field(() => Author)
  author(): Author {
    return AUTHORS.find(({ id }) => id === this.authorId);
  }
  @InputField()
  authorId: number;
}
