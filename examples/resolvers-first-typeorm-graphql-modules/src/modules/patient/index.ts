import { GraphQLModule } from "@graphql-modules/core";
import { ConnectionModule } from "../connection";
import { printType } from "graphql";
import { getObjectTypeFromClass, extractFieldResolversFromObjectType } from "graphql-toolkit";
import { Patient } from "./Patient";
import { Query } from "./Query";

export const PatientModule = new GraphQLModule({
    imports: [
        ConnectionModule
    ],
    typeDefs: [
        printType(
            getObjectTypeFromClass(Patient)
        ),
        printType(
            getObjectTypeFromClass(Query)
        )
    ],
    resolvers: {
        Patient: extractFieldResolversFromObjectType(
            getObjectTypeFromClass(Patient)
        ),
        Query: extractFieldResolversFromObjectType(
            getObjectTypeFromClass(Query)
        )
    }
})