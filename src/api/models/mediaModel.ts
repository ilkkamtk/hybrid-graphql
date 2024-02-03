import {ResultSetHeader, RowDataPacket} from 'mysql2';
import {MediaItem, UserLevel} from '@sharedTypes/DBTypes';
import promisePool from '../../lib/db';
import {fetchData} from '../../lib/functions';
import {MessageResponse} from '@sharedTypes/MessageTypes';
import {fetchTagByName, postTag} from './tagModel';

/**
 * Get all media items from the database
 *
 * @returns {array} - array of media items
 * @throws {Error} - error if database query fails
 */

const fetchAllMedia = async (): Promise<MediaItem[] | null> => {
  const uploadPath = process.env.UPLOAD_URL;
  try {
    const [rows] = await promisePool.execute<RowDataPacket[] & MediaItem[]>(
      `SELECT *,
      CONCAT(?, filename) AS filename,
      CONCAT(?, CONCAT(filename, "-thumb.png")) AS thumbnail
      FROM MediaItems`,
      [uploadPath, uploadPath],
    );
    if (rows.length === 0) {
      return null;
    }
    return rows;
  } catch (e) {
    console.error('fetchAllMedia error', (e as Error).message);
    throw new Error((e as Error).message);
  }
};

// Request a list of media items by tag
const fetchMediaByTag = async (tag: string): Promise<MediaItem[] | null> => {
  try {
    const [rows] = await promisePool.execute<RowDataPacket[] & MediaItem[]>(
      `SELECT MediaItems.*,
      CONCAT(?, MediaItems.filename) AS filename,
      CONCAT(?, CONCAT(MediaItems.filename, "-thumb.png")) AS thumbnail
      FROM MediaItems
      JOIN MediaItemTags ON MediaItems.media_id = MediaItemTags.media_id
      JOIN Tags ON MediaItemTags.tag_id = Tags.tag_id
      WHERE Tags.tag_name = ?`,
      [process.env.UPLOAD_URL, process.env.UPLOAD_URL, tag],
    );
    if (rows.length === 0) {
      return null;
    }
    return rows;
  } catch (e) {
    console.error('fetchMediaByTag error', (e as Error).message);
    throw new Error((e as Error).message);
  }
};

const fetchAllMediaByAppId = async (
  id: string,
): Promise<MediaItem[] | null> => {
  const uploadPath = process.env.UPLOAD_URL;
  try {
    const [rows] = await promisePool.execute<RowDataPacket[] & MediaItem[]>(
      `SELECT *,
      CONCAT(?, filename) AS filename,
      CONCAT(?, CONCAT(filename, "-thumb.png")) AS thumbnail
      FROM MediaItems
      WHERE app_id = ?`,
      [uploadPath, uploadPath, id],
    );
    if (rows.length === 0) {
      return null;
    }
    return rows;
  } catch (e) {
    console.error('fetchAllMedia error', (e as Error).message);
    throw new Error((e as Error).message);
  }
};

/**
 * Get media item by id from the database
 *
 * @param {number} id - id of the media item
 * @returns {object} - object containing all information about the media item
 * @throws {Error} - error if database query fails
 */

const fetchMediaById = async (id: number): Promise<MediaItem | null> => {
  const uploadPath = process.env.UPLOAD_URL;
  try {
    // TODO: replace * with specific column names needed in this case
    const sql = `SELECT *,
                CONCAT(?, filename) AS filename,
                CONCAT(?, CONCAT(filename, "-thumb.png")) AS thumbnail
                FROM MediaItems
                WHERE media_id=?`;
    const params = [uploadPath, uploadPath, id];
    const [rows] = await promisePool.execute<RowDataPacket[] & MediaItem[]>(
      sql,
      params,
    );
    if (rows.length === 0) {
      return null;
    }
    return rows[0];
  } catch (e) {
    console.error('fetchMediaById error', (e as Error).message);
    throw new Error((e as Error).message);
  }
};

/**
 * Add new media item to database
 *
 * @param {object} media - object containing all information about the new media item
 * @returns {object} - object containing id of the inserted media item in db
 * @throws {Error} - error if database query fails
 */
const postMedia = async (
  media: Omit<MediaItem, 'media_id' | 'created_at' | 'thumbnail'>,
): Promise<MediaItem | null> => {
  const {user_id, filename, filesize, media_type, title, description} = media;
  const sql = `INSERT INTO MediaItems (user_id, filename, filesize, media_type, title, description)
               VALUES (?, ?, ?, ?, ?, ?)`;
  const params = [user_id, filename, filesize, media_type, title, description];
  try {
    const result = await promisePool.execute<ResultSetHeader>(sql, params);
    const [rows] = await promisePool.execute<RowDataPacket[] & MediaItem[]>(
      'SELECT * FROM MediaItems WHERE media_id = ?',
      [result[0].insertId],
    );
    if (rows.length === 0) {
      return null;
    }
    return rows[0];
  } catch (e) {
    console.error('error', (e as Error).message);
    throw new Error((e as Error).message);
  }
};

/**
 * Update media item in database
 *
 * @param {object} media - object containing all information about the media item
 * @param {number} id - id of the media item
 * @returns {object} - object containing id of the updated media item in db
 * @throws {Error} - error if database query fails
 */

const putMedia = async (
  media: Pick<MediaItem, 'title' | 'description'>,
  id: number,
): Promise<MediaItem | null> => {
  try {
    const sql = promisePool.format(
      'UPDATE MediaItems SET ? WHERE media_id = ?',
      [media, id],
    );
    const result = await promisePool.execute<ResultSetHeader>(sql);
    console.log('result', result);
    if (result[0].affectedRows === 0) {
      return null;
    }

    const mediaItem = await fetchMediaById(id);
    if (!mediaItem) {
      return null;
    }
    return mediaItem;
  } catch (e) {
    console.error('error', (e as Error).message);
    throw new Error((e as Error).message);
  }
};

/**
 * Delete media item from database
 *
 * @param {number} id - id of the media item
 * @returns {object} - object containing id of the deleted media item in db
 * @throws {Error} - error if database query fails
 */

const deleteMedia = async (
  media_id: number,
  user_id: number,
  token: string,
  level_name: UserLevel['level_name'],
): Promise<MessageResponse> => {
  // get media item from database for filename
  const media = await fetchMediaById(media_id);

  if (!media) {
    return {message: 'Media not found'};
  }

  // remove environment variable UPLOAD_URL from filename
  media.filename = media?.filename.replace(
    process.env.UPLOAD_URL as string,
    '',
  );

  const connection = await promisePool.getConnection();

  try {
    await connection.beginTransaction();

    await connection.execute('DELETE FROM Likes WHERE media_id = ?;', [
      media_id,
    ]);

    await connection.execute('DELETE FROM Comments WHERE media_id = ?;', [
      media_id,
    ]);

    await connection.execute('DELETE FROM Ratings WHERE media_id = ?;', [
      media_id,
    ]);

    let sql = '';
    if (level_name === 'Admin') {
      sql = 'DELETE FROM MediaItems WHERE media_id = ?;';
    } else {
      sql = 'DELETE FROM MediaItems WHERE media_id = ? AND user_id = ?;';
    }
    // note, user_id in SQL so that only the owner of the media item can delete it
    const [result] = await connection.execute<ResultSetHeader>(sql, [
      media_id,
      user_id,
    ]);

    if (result.affectedRows === 0) {
      return {message: 'Media not deleted'};
    }

    // delete file from upload server
    const options = {
      method: 'DELETE',
      headers: {
        Authorization: 'Bearer ' + token,
      },
    };

    const deleteResult = await fetchData<MessageResponse>(
      `${process.env.UPLOAD_SERVER}/delete/${media.filename}`,
      options,
    );

    console.log('deleteResult', deleteResult);
    if (deleteResult.message !== 'File deleted') {
      throw new Error('File not deleted');
    }

    // if no errors commit transaction
    await connection.commit();

    return {message: 'Media deleted'};
  } catch (e) {
    await connection.rollback();
    console.error('error', (e as Error).message);
    throw new Error((e as Error).message);
  } finally {
    connection.release();
  }
};

/**
 * Get all the most liked media items from the database
 *
 * @returns {object} - object containing all information about the most liked media item
 * @throws {Error} - error if database query fails
 */

const fetchMostLikedMedia = async (): Promise<MediaItem | undefined> => {
  try {
    const [rows] = await promisePool.execute<
      RowDataPacket[] & MediaItem[] & {likes_count: number}
    >('SELECT * FROM `MostLikedMedia`');
    if (rows.length === 0) {
      return undefined;
    }
    // add server url to filename because it can't be added in the SQL view
    rows[0].filename = process.env.UPLOAD_URL + '/uploads/' + rows[0].filename;
    // add thumbnail to object for the same reason
    rows[0].thumbnail =
      process.env.UPLOAD_URL + '/uploads/' + rows[0].filename + '-thumb.png';
    console.log(rows[0]);
    return rows[0];
  } catch (e) {
    console.error('getMostLikedMedia error', (e as Error).message);
    throw new Error((e as Error).message);
  }
};

/**
 * Get all the most commented media items from the database
 *
 * @returns {object} - object containing all information about the most commented media item
 * @throws {Error} - error if database query fails
 */

const fetchMostCommentedMedia = async (): Promise<MediaItem | undefined> => {
  try {
    const [rows] = await promisePool.execute<RowDataPacket[] & MediaItem[]>(
      'SELECT * FROM `MostCommentedMedia`',
    );
    if (rows.length === 0) {
      return undefined;
    }
    // add server url to filename because it can't be added in the SQL view
    rows[0].filename = process.env.UPLOAD_URL + '/uploads/' + rows[0].filename;
    // add thumbnail to object for the same reason
    rows[0].thumbnail =
      process.env.UPLOAD_URL + '/uploads/' + rows[0].filename + '-thumb.png';
    return rows[0];
  } catch (e) {
    console.error('getMostCommentedMedia error', (e as Error).message);
    throw new Error((e as Error).message);
  }
};

/**
 * Get all the highest rated media items from the database
 *
 * @returns {object} - object containing all information about the highest rated media item
 * @throws {Error} - error if database query fails
 */

const fetchHighestRatedMedia = async (): Promise<MediaItem | undefined> => {
  try {
    const [rows] = await promisePool.execute<RowDataPacket[] & MediaItem[]>(
      'SELECT * FROM `HighestRatedMedia`',
    );
    if (rows.length === 0) {
      return undefined;
    }
    // add server url to filename because it can't be added in the SQL view
    rows[0].filename = process.env.UPLOAD_URL + '/uploads/' + rows[0].filename;
    // add thumbnail to object for the same reason
    rows[0].thumbnail =
      process.env.UPLOAD_URL + '/uploads/' + rows[0].filename + '-thumb.png';
    return rows[0];
  } catch (e) {
    console.error('getHighestRatedMedia error', (e as Error).message);
    throw new Error((e as Error).message);
  }
};

// Attach a tag to a media item
const postTagToMedia = async (
  tag_name: string,
  media_id: number,
): Promise<MediaItem | null> => {
  try {
    let tag_id: number = 0;
    // check if tag exists (case insensitive)
    const tagResult = await fetchTagByName(tag_name);
    if (!tagResult) {
      // if tag does not exist create it
      const insertResult = await postTag(tag_name);
      if (!insertResult) {
        return null;
      }
      // get tag_id from created tag
      tag_id = insertResult.tag_id;
    } else {
      // if tag exists get tag_id from the first result
      tag_id = tagResult.tag_id;
    }
    const [MediaItemTagsResult] = await promisePool.execute<ResultSetHeader>(
      'INSERT INTO MediaItemTags (tag_id, media_id) VALUES (?, ?)',
      [tag_id, media_id],
    );
    if (MediaItemTagsResult.affectedRows === 0) {
      return null;
    }

    return await fetchMediaById(media_id);
  } catch (e) {
    console.error('postTagToMedia error', (e as Error).message);
    throw new Error((e as Error).message);
  }
};

const deleteTagFromMedia = async (
  tag_id: string,
  media_id: number,
  user_id: number,
): Promise<MediaItem | null> => {
  try {
    // check if user owns media item
    const [mediaItem] = await promisePool.execute<RowDataPacket[]>(
      'SELECT * FROM MediaItems WHERE media_id = ? AND user_id = ?',
      [media_id, user_id],
    );

    if (mediaItem.length === 0) {
      throw new Error('Media item not found or user does not own media item');
    }

    const [result] = await promisePool.execute<ResultSetHeader>(
      'DELETE FROM MediaItemTags WHERE tag_id = ? AND media_id = ?',
      [tag_id, media_id],
    );
    if (result.affectedRows === 0) {
      return null;
    }

    return await fetchMediaById(media_id);
  } catch (e) {
    console.error('deleteTagFromMedia error', (e as Error).message);
    throw new Error((e as Error).message);
  }
};
export {
  fetchAllMedia,
  fetchAllMediaByAppId,
  fetchMediaByTag,
  fetchMediaById,
  postMedia,
  deleteMedia,
  fetchMostLikedMedia,
  fetchMostCommentedMedia,
  fetchHighestRatedMedia,
  putMedia,
  postTagToMedia,
  deleteTagFromMedia,
};
