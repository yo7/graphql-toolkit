import { ObjectType, Field } from "graphql-toolkit";
import { Connection } from "typeorm";
import { Doctor } from "./Doctor";
import { Inject } from "@graphql-modules/di";

@ObjectType({ injector: ({ injector }) => injector })
export class Query {
    @Inject() connection: Connection;
    @Field(type => [Doctor])
    doctors() {
        return this.connection.getRepository(Doctor).find();
    }
}
