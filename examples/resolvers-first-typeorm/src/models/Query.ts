import { ObjectType, Field } from "graphql-toolkit";
import { getConnection } from "typeorm";
import { Patient } from "./Patient";
import { Doctor } from "./Doctor";
import { Appointment } from "./Appointment";

@ObjectType()
export class Query {
    @Field(type => [Patient])
    patients() {
        return getConnection().getRepository(Patient).find();
    }
    @Field(type => [Doctor])
    doctors() {
        return getConnection().getRepository(Doctor).find();
    }
    @Field(type => [Appointment])
    appointments() {
        return getConnection().getRepository(Appointment).find();
    }
}