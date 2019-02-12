import { GraphQLModule } from "@graphql-modules/core";
import { ConnectionModule } from "../connection";
import { printType } from "graphql";
import { getObjectTypeFromClass, extractFieldResolversFromObjectType } from "graphql-toolkit";
import { Doctor } from "./Doctor";
import { Query } from "./Query";

export const DoctorModule = new GraphQLModule({
    imports: [
        ConnectionModule
    ],
    typeDefs: [
        printType(
            getObjectTypeFromClass(Doctor)
        ),
        printType(
            getObjectTypeFromClass(Query)
        )
    ],
    resolvers: {
        Doctor: extractFieldResolversFromObjectType(
            getObjectTypeFromClass(Doctor)
        ),
        Query: extractFieldResolversFromObjectType(
            getObjectTypeFromClass(Query)
        )
    }
})