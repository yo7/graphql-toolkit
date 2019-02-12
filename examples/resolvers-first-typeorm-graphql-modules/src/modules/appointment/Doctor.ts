import {
    Entity,
    OneToMany
} from 'typeorm';

import { Field, ObjectType } from 'graphql-toolkit';
import { Doctor as BaseDoctor } from '../doctor/Doctor';
import { Appointment } from '../appointment/Appointment';

/**
 * The Doctor model is one of the simple models in the example. It is the one side of its one-to-many relationship with
 * the Appointment model.
 */
@ObjectType()
@Entity()
export class Doctor extends BaseDoctor {
    @Field(type => [Appointment])
    @OneToMany(
        type => Appointment,
        appointment => appointment.doctor,
        { lazy: true }
    )
    appointments: Promise<Appointment[]>;
}
