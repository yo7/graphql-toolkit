// Code that is used to seed the database.
// Usually, tasks would be at the top level directory for the project. But in this case, we need to compile this task
// before it can be run (it's TypeScript), so I include it in a src/tasks directory.

// Must be at top
import 'reflect-metadata';

import { createConnection } from 'typeorm';

import { Appointment } from '../../models/Appointment';
import { Doctor } from '../../models/Doctor';
import { Patient } from '../../models/Patient';

(async () => {
    console.log('Beginning dbseed task.');

    const conn = await createConnection();
    console.log('PG connected.');

    let doctor = new Doctor();
    doctor.name = 'John';

    const doctorRepo = conn.getRepository(Doctor);
    doctor = await doctorRepo.save(doctor); // re-assign to know assigned id
    console.log(`Doctor saved. id = ${doctor.id}`);

    // Create seed data.
    let patient = new Patient();
    patient.name = 'Matt';

    const patientRepo = conn.getRepository(Patient);
    patient = await patientRepo.save(patient); // re-assign to know assigned id
    console.log(`Patient saved. id = ${patient.id}`);

    let appointment = new Appointment();
    appointment.date = new Date();
    appointment.doctor = Promise.resolve(doctor);
    appointment.patient = Promise.resolve(patient);

    const appointmentRepo = conn.getRepository(Appointment);
    appointment = await appointmentRepo.save(appointment); // re-assign to know assigned fields
    
    console.log(`Appointment saved. date = ${appointment.date}`);

    // Close connection
    await conn.close();
    console.log('PG connection closed.');

    console.log('Finished dbseed task.');
})();
