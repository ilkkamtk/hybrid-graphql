import {
  fetchAllMedia,
  fetchMediaById,
  fetchMediaByTag,
  postMedia,
  putMedia,
} from '../models/mediaModel';
import {MediaItem} from '@sharedTypes/DBTypes';
import {postTagToMedia} from '../models/mediaModel';
import {MyContext} from '../../local-types';
import {GraphQLError} from 'graphql';

export default {
  Like: {
    media: async (parent: {media_id: string}) => {
      return await fetchMediaById(Number(parent.media_id));
    },
  },
  Rating: {
    media: async (parent: {media_id: string}) => {
      return await fetchMediaById(Number(parent.media_id));
    },
  },
  Query: {
    mediaItems: async () => {
      return await fetchAllMedia();
    },
    mediaItem: async (_parent: undefined, args: {media_id: string}) => {
      return await fetchMediaById(Number(args.media_id));
    },
    mediaItemsByTag: async (_parent: undefined, args: {tag: string}) => {
      const result = await fetchMediaByTag(args.tag);
      console.log(result);
      return result;
    },
  },
  Mutation: {
    createMediaItem: async (
      _parent: undefined,
      args: {input: Omit<MediaItem, 'media_id' | 'created_at' | 'thumbnail'>},
      context: MyContext,
    ) => {
      if (!context.user || !context.user.user_id) {
        throw new GraphQLError('Not authorized', {
          extensions: {code: 'NOT_AUTHORIZED'},
        });
      }
      return await postMedia(args.input);
    },
    addTagToMediaItem: async (
      _parent: undefined,
      args: {input: {tag_name: string; media_id: string}},
    ) => {
      console.log(args);
      // capitalize first letter of tag_name because we want all tags to be the same
      // format in the database so we can query them easily and check for duplicates
      args.input.tag_name =
        args.input.tag_name.charAt(0).toUpperCase() +
        args.input.tag_name.slice(1).toLowerCase();
      return await postTagToMedia(
        args.input.tag_name,
        Number(args.input.media_id),
      );
    },
    updateMediaItem: async (
      _parent: undefined,
      args: {media_id: string; input: MediaItem},
    ) => {
      return await putMedia(args.input, Number(args.media_id));
    },
  },
};
