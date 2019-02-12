import { GraphQLModule } from "@graphql-modules/core";
import { DoctorModule } from '../doctor';
import { PatientModule } from '../patient';
import { printType } from "graphql";
import { getObjectTypeFromClass, extractFieldResolversFromObjectType } from "graphql-toolkit";
import { Appointment } from "./Appointment";
import { Doctor } from "./Doctor";
import { Query } from "./Query";
import { Patient } from "./Patient";

export const AppointmentModule = new GraphQLModule({
    imports: [
        DoctorModule,
        PatientModule
    ],
    typeDefs: [
        printType(
            getObjectTypeFromClass(Appointment)
        ),
        printType(
            getObjectTypeFromClass(Doctor)
        ),
        printType(
            getObjectTypeFromClass(Patient)
        ),
        printType(
            getObjectTypeFromClass(Query)
        )
    ],
    resolvers: {
        Appointment: extractFieldResolversFromObjectType(
            getObjectTypeFromClass(Appointment)
        ),
        Doctor: extractFieldResolversFromObjectType(
            getObjectTypeFromClass(Doctor)
        ),
        Patient: extractFieldResolversFromObjectType(
            getObjectTypeFromClass(Patient)
        ),
        Query: extractFieldResolversFromObjectType(
            getObjectTypeFromClass(Query)
        )
    }
})