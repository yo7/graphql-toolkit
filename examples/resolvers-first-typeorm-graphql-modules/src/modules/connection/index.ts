import { GraphQLModule } from '@graphql-modules/core';
import { Connection, getConnection } from 'typeorm';

export const ConnectionModule = new GraphQLModule({
    providers: [
        {
            provide: Connection,
            useFactory: () => getConnection()
        }
    ]
});
