import { api } from './adminApi';

export const mealService = {
  getAll:  ()        => api.meals.getAll(),
  create:  (data)    => api.meals.create(data),
  update:  (id, data)=> api.meals.update(id, data),
  remove:  (id)      => api.meals.delete(id),
};
