import api from './api';

export const searchAll = async (query) => {
  if (!query || query.trim().length < 2) {
    return { posts: [], tutorials: [] };
  }
  const response = await api.get('/search', { params: { q: query } });
  return response.data;
};
