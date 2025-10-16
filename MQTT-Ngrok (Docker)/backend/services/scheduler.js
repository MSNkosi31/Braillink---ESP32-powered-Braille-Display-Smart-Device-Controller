const cron = require('node-cron');
const Routine = require('../models/Routine');
const { executeRoutine } = require('./routineExecutor');

class SchedulerService {
    constructor() {
        this.jobs = new Map();
        this.initialized = false;
    }

    async initialize() {
        if (this.initialized) {
            return;
        }

        //load all scheduled routines from database
        const scheduledRoutines = await Routine.find({
            'scheduled': true,
            'schedule.enabled': true
        });

        for (const routine of scheduledRoutines) {
            this.scheduleRoutine(routine);
        }

        this.initialized = true;
        console.log('Scheduler initialized');
    }

    scheduleRoutine(routine) {
        //remove existing job if it exists
        this.unscheduleRoutine(routine._id.toString());

        let cronExpression;

        if (routine.schedule.cronExpression) {
            cronExpression = routine.schedule.cronExpression;
        } else if (routine.schedule.time && routine.schedule.daysOfWeek && routine.schedule.daysOfWeek.length > 0) {
            //build cron expression from time and days
            const [hours, minutes] = routine.schedule.time.split(':');
            const days = routine.schedule.daysOfWeek.join(',');
            cronExpression = `${minutes} ${hours} * * ${days}`;
        } else {
            console.warn(`Invalid schedule configuration for routine: ${routine.name}`);
            return;
        }

        try {
            const task = cron.schedule(cronExpression, async () => {
                console.log(`Executing scheduled routine: ${routine.name}`);

                try {
                    await executeRoutine(routine._id);
                    //update last executed time
                    await Routine.findByIdAndUpdate(routine._id, {
                        lastExecuted: new Date()
                    });
                } catch (error) {
                    console.error(`Error executing scheduled routine ${routine.name}:`, error);
                }
            });

            this.jobs.set(routine._id.toString(), task);
            console.log(`Scheduled routine: ${routine.name} with expression: ${cronExpression}`);
        } catch (error) {
            console.error(`Failed to schedule routine ${routine.name}:`, error);
        }
    }

    unscheduleRoutine(routineId) {
        const job = this.jobs.get(routineId);
        if (job) {
            job.stop();
            this.jobs.delete(routineId);
            console.log(`Unscheduled routine with ID: ${routineId}`);
        }
    }

    updateRoutineSchedule(routine) {
        if (routine.schedule && routine.schedule.enabled) {
            this.scheduleRoutine(routine);
        } else {
            this.unscheduleRoutine(routine._id.toString());
        }
    }

    stop() {
        for (const [routineId, job] of this.jobs) {
            job.stop();
        }
        this.jobs.clear();
        this.initialized = false;
        console.log('Scheduler stopped');
    }
}

module.exports = new SchedulerService();