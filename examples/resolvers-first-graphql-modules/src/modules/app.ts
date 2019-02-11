import { GraphQLModule } from "@graphql-modules/core";
import { Post } from "./posts/post";
import { Author } from "./authors/author";
import { AuthorsModule } from "./authors";
import { PostsModule } from "./posts";

export const AppModule = new GraphQLModule<{
    AUTHORS_COLLECTION: Author[];
    POSTS_COLLECTION: Post[];
}>({
    imports: ({ config: { AUTHORS_COLLECTION, POSTS_COLLECTION } }) => [
        AuthorsModule.forRoot({ AUTHORS_COLLECTION }),
        PostsModule.forRoot({ POSTS_COLLECTION })
    ]
});