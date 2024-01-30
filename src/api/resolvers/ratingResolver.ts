import {GraphQLError} from 'graphql';
import {MyContext} from '../../local-types';
import {
  deleteRating,
  deleteRatingAsAdmin,
  fetchAllRatings,
  fetchRatingsByMediaId,
  postRating,
} from '../models/ratingModel';

export default {
  MediaItem: {
    likes: async (parent: {media_id: string}) => {
      return await fetchRatingsByMediaId(Number(parent.media_id));
    },
  },
  Query: {
    ratings: async () => {
      return await fetchAllRatings();
    },
  },
  Mutation: {
    deleteRating: async (
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
        return await deleteRatingAsAdmin(Number(args.input));
      }
      const user_id = context.user.user_id;
      return await deleteRating(Number(args.input), user_id);
    },
    createRating: async (
      _parent: undefined,
      args: {media_id: string; rating_value: string},
      context: MyContext,
    ) => {
      if (!context.user || !context.user.user_id) {
        throw new GraphQLError('Not authorized', {
          extensions: {code: 'NOT_AUTHORIZED'},
        });
      }
      const user_id = context.user.user_id;
      return await postRating(
        Number(args.media_id),
        user_id,
        Number(args.rating_value),
      );
    },
  },
};
