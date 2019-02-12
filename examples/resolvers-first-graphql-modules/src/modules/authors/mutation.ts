import { ObjectType, Field, Arg } from 'graphql-toolkit';
import { AUTHORS_COLLECTION } from './symbols';
import { Inject } from '@graphql-modules/di';
import { Author } from './author';

@ObjectType({ injector: ({ injector }) => injector })
export class Mutation {
    @Inject(AUTHORS_COLLECTION) authorsCollection: Author[];
    @Field()
    addAuthor(@Arg('author') author: Author): number {
        this.authorsCollection.push(author);
        return author.id;
    }
}
