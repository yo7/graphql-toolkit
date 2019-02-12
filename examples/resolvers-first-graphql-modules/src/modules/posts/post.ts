import { ObjectType, Field, InputField, InputObjectType } from 'graphql-toolkit';
import { Author } from '../authors/author';
import { Inject } from '@graphql-modules/di';
import { AUTHORS_COLLECTION } from '../authors/symbols';

@ObjectType({ injector: ({ injector }) => injector })
@InputObjectType({ name: 'PostInput' })
export class Post {
  @Inject(AUTHORS_COLLECTION) authorsCollection: Author[];
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
    return this.authorsCollection.find(({ id }) => id === this.authorId);
  }
  @InputField()
  authorId: number;
}
