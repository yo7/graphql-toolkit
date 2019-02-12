import { ObjectType, Field } from "graphql-toolkit";
import { getConnection, Connection } from "typeorm";
import { Patient } from "./Patient";
import { Inject } from "@graphql-modules/di";

@ObjectType({ injector: ({ injector }) => injector })
export class Query {
    @Inject() connection: Connection;
    @Field(type => [Patient])
    patients() {
        return getConnection().getRepository(Patient).find();
    }
}