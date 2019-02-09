import { ObjectType, Field, Arg } from 'graphql-toolkit';
import { Post } from './post';
import { POSTS } from './posts.collection';
import { AUTHORS } from './authors.collection';
import { Author } from './author';

@ObjectType()
export class Mutation {
    @Field()
    addAuthor(@Arg('author') author: Author): number {
        AUTHORS.push(author);
        return author.id;
    }
    @Field()
    addPost(@Arg('post') post: Post): number {
        POSTS.push(post);
        return post.id;
    }
}
