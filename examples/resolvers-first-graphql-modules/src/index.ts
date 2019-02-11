import 'reflect-metadata';
import * as express from 'express';
import * as graphqlHTTP from 'express-graphql';
import { AppModule } from './modules/app';

const app = express();

const { schema, context } = AppModule.forRoot({
  AUTHORS_COLLECTION: [],
  POSTS_COLLECTION: []
})

app.use('/graphql', graphqlHTTP(async (req, res, params) => ({
  schema,
  context: await context({ req, res, params }),
  graphiql: true,
})));

app.listen(4000);
