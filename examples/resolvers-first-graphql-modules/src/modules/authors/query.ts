import { ObjectType, Field } from 'graphql-toolkit';
import { AUTHORS_COLLECTION } from './symbols';
import { Inject } from '@graphql-modules/di';
import { Author } from './author';

@ObjectType()
export class Query {
  @Inject(AUTHORS_COLLECTION) authorsCollection: Author[];
  @Field(() => [Author])
  authors(): Author[] {
    return this.authorsCollection;
  }
}
