import {GraphQLError} from 'graphql';
import {
  deleteLike,
  deleteLikeAsAdmin,
  fetchAllLikes,
  fetchLikesByMediaId,
  postLike,
} from '../models/likeModel';
import {MyContext} from '../../local-types';

export default {
  MediaItem: {
    likes: async (parent: {media_id: string}) => {
      return await fetchLikesByMediaId(Number(parent.media_id));
    },
  },
  Query: {
    likes: async () => {
      return await fetchAllLikes();
    },
  },
  Mutation: {
    deleteLike: async (
      _parent: undefined,
      args: {input: string},
      context: MyContext,
    ) => {
      if (!context.user || !context.user.user_id) {
        throw new GraphQLError('Not authorized', {
          extensions: {code: 'NOT_AUTHORIZED'},
        });
      }
      if (context.user.level_name !== 'Admin') {
        return await deleteLikeAsAdmin(Number(args.input));
      }
      const user_id = context.user.user_id;
      return await deleteLike(Number(args.input), user_id);
    },
    createLike: async (
      _parent: undefined,
      args: {media_id: string},
      context: MyContext,
    ) => {
      if (!context.user || !context.user.user_id) {
        throw new GraphQLError('Not authorized', {
          extensions: {code: 'NOT_AUTHORIZED'},
        });
      }
      const user_id = context.user.user_id;
      return await postLike(Number(args.media_id), user_id);
    },
  },
};
