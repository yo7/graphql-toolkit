import { GraphQLModule } from "@graphql-modules/core";
import { ConnectionModule } from "./connection";
import { AppointmentModule } from "./appointment";
import { DoctorModule } from "./doctor";
import { PatientModule } from "./patient";

export const AppModule = new GraphQLModule({
    imports: [
        ConnectionModule,
        DoctorModule,
        PatientModule,
        AppointmentModule,
    ]
})