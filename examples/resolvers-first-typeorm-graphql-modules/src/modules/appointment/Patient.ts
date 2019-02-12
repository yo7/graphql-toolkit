import {
    Entity,
    OneToMany} from 'typeorm';

import { Appointment } from '../appointment/Appointment';
import { Field, ObjectType } from 'graphql-toolkit';
import { Patient as BasePatient } from '../patient/Patient';

/**
 * The Patient model is one of the simple models in the example. It is the one side of its one-to-many relationship with
 * the Appointment model.
 */
@ObjectType()
@Entity()
export class Patient extends BasePatient {
    @Field(() => [Appointment])
    @OneToMany(
        () => Appointment,
        appointment => appointment.patient,
        { lazy: true }
    )
    appointments: Promise<Appointment[]>;
}
