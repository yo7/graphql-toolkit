import 'reflect-metadata';
import { schema } from './schema';
import * as express from 'express';
import * as graphqlHTTP from 'express-graphql';
import { AUTHORS } from './authors.collection';
import { Author } from './author';
import { POSTS } from './posts.collection';
import { Post } from './post';

const app = express();

app.use('/graphql', graphqlHTTP({
  schema,
  graphiql: true,
}));

AUTHORS.push(
  new Author({ id: 0, name: 'Kamil' }),
  new Author({ id: 1, name: 'Niccolo'}),
);

POSTS.push(
  new Post({ id: 0, title: 'Hello Niccolo', content: 'How are you?', authorId: 0 }),
  new Post({ id: 1, title: 'Hello Kamil', content: 'Good', authorId: 1 }),
);

app.listen(4000, () => {
  console.log('GraphQL Server started');
});
