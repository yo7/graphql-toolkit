import { ObjectType, Field } from "graphql-toolkit";
import { Appointment } from "./Appointment";
import { Inject } from "@graphql-modules/di";
import { Connection } from "typeorm";

@ObjectType({ injector: ({ injector }) => injector })
export class Query {
    @Inject() connection: Connection;
    @Field(type => [Appointment])
    appointments() {
        return this.connection.getRepository(Appointment).find();
    }
}
