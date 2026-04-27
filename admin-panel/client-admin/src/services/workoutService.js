import { api } from './adminApi';

export const workoutService = {
  getAll:  ()        => api.workouts.getAll(),
  create:  (data)    => api.workouts.create(data),
  update:  (id, data)=> api.workouts.update(id, data),
  remove:  (id)      => api.workouts.delete(id),
};
