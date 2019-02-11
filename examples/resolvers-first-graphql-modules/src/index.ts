import 'reflect-metadata';
import * as express from 'express';
import * as graphqlHTTP from 'express-graphql';
import { AppModule } from './modules/app';
import { Author } from './modules/authors/author';
import { Post } from './modules/posts/post';

const app = express();

const { schema, context } = AppModule.forRoot({
  AUTHORS_COLLECTION: [
    new Author({ id: 0, name: 'Kamil' }),
    new Author({ id: 1, name: 'Niccolo'}),
  ],
  POSTS_COLLECTION: [
    new Post({ id: 0, title: 'Hello Niccolo', content: 'How are you?', authorId: 0 }),
    new Post({ id: 1, title: 'Hello Kamil', content: 'Good', authorId: 1 }),
  ]
})

app.use('/graphql', graphqlHTTP(async (req, res, params) => ({
  schema,
  context: await context({ req, res, params }),
  graphiql: true,
})));

app.listen(4000, () => {
  console.log('GraphQL Server started');
});
