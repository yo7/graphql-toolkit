// Must be at top
import 'reflect-metadata';

import { createConnection } from 'typeorm';
import express from 'express';
import graphqlHTTP from 'express-graphql';
import { schema } from './schema';

(async () => {
    await createConnection();
    console.log('PG connected.');

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // App's main content. This could be an Express or Koa web server for example, or even just a Node console app.
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    const app = express();

    app.use('/graphql', graphqlHTTP({
        schema,
        graphiql: true,
    }));

    app.listen(4000, () => {
        console.log('GraphQL Server started');
    });
    
})();
