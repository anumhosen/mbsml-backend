const serializeUser = (user) => {
  if (!user) return null;

  return {
    id: user._id?.toString?.() || user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    avatar: user.avatar,
    bio: user.bio,
    isVerified: user.isVerified,
  };
};

const serializePost = (post) => {
  if (!post) return null;
  const value = typeof post.toObject === 'function' ? post.toObject() : post;

  return {
    ...value,
    id: value._id?.toString?.() || value.id,
    author: serializeUser(value.author),
  };
};

const serializeComment = (comment) => {
  if (!comment) return null;
  const value = typeof comment.toObject === 'function' ? comment.toObject() : comment;

  return {
    ...value,
    id: value._id?.toString?.() || value.id,
    author: serializeUser(value.author),
    post: value.post
      ? {
          ...value.post,
          id: value.post._id?.toString?.() || value.post.id,
        }
      : value.post,
  };
};

module.exports = {
  serializeUser,
  serializePost,
  serializeComment,
};
