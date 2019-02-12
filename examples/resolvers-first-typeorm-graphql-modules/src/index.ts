// Must be at top
import 'reflect-metadata';

import { createConnection } from 'typeorm';
import express from 'express';
import graphqlHTTP from 'express-graphql';
import { AppModule } from './modules/app';

(async () => {
    await createConnection();
    console.log('PG connected.');

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // App's main content. This could be an Express or Koa web server for example, or even just a Node console app.
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    const app = express();

    const { schema, context } = AppModule;
    
    app.use('/graphql', graphqlHTTP(async (req, res, params) => ({
        schema,
        context: await context({ req, res, params }),
        graphiql: true,
    })));

    app.listen(4000, () => {
        console.log('GraphQL Server started');
    });
    
})();
