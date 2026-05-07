import api from './api';

export const getComments = async (postSlug, page = 1) => {
  const response = await api.get(`/comments/posts/${postSlug}/comments`, {
    params: { page, limit: 20 },
  });
  return response.data;
};

export const addComment = async (postId, content, parentId = null) => {
  const response = await api.post('/comments', { postId, content, parentId });
  return response.data;
};

export const likeComment = async (commentId) => {
  const response = await api.post(`/comments/${commentId}/like`);
  return response.data;
};

export const deleteComment = async (commentId) => {
  await api.delete(`/comments/${commentId}`);
};
