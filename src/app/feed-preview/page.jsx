"use client";

import { useEffect, useState } from "react";

import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  CircularProgress,
  Grid,
  Stack,
  Typography,
} from "@mui/material";
import Image from "next/image";

import { fetchPublicFeed } from "@/services/v2/posts";
import { fetchVideoFeed } from "@/services/v2/videos";

const FeedPreviewPage = () => {
  const [feed, setFeed] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [postsError, setPostsError] = useState(null);
  const [videoFeed, setVideoFeed] = useState([]);
  const [loadingVideos, setLoadingVideos] = useState(true);
  const [videosError, setVideosError] = useState(null);

  const loadFeed = async () => {
    setLoadingPosts(true);
    setPostsError(null);
    try {
      const data = await fetchPublicFeed({ limit: 12 });
      setFeed(data);
    } catch (err) {
      setPostsError(err?.response?.data?.message || err.message || "Unable to load the public feed");
    } finally {
      setLoadingPosts(false);
    }
  };

  const loadVideos = async () => {
    setLoadingVideos(true);
    setVideosError(null);
    try {
      const data = await fetchVideoFeed({ limit: 12 });
      setVideoFeed(data);
    } catch (err) {
      setVideosError(err?.response?.data?.message || err.message || "Unable to load the reels feed");
    } finally {
      setLoadingVideos(false);
    }
  };

  useEffect(() => {
    loadFeed();
    loadVideos();
  }, []);

  return (
    <Stack spacing={4}>
      <Box>
        <Typography variant="h5">Feed Preview</Typography>
        <Typography variant="body2" color="text.secondary">
          Render posts from the new `/posts` APIs to verify content pipelines before shipping to the mobile apps.
        </Typography>
      </Box>

      <Stack direction="row" spacing={2}>
        <Button variant="contained" onClick={loadFeed} disabled={loadingPosts}>
          Refresh Posts
        </Button>
        <Button variant="outlined" onClick={loadVideos} disabled={loadingVideos}>
          Refresh Reels
        </Button>
      </Stack>

      {loadingPosts ? (
        <Box className="flex justify-center items-center min-bs-[40dvh]">
          <CircularProgress />
        </Box>
      ) : postsError ? (
        <Stack spacing={2}>
          <Typography color="error">{postsError}</Typography>
          <Button variant="outlined" onClick={loadFeed}>
            Retry
          </Button>
        </Stack>
      ) : (
        <Grid container spacing={3}>
          {feed.map((post) => (
            <Grid item xs={12} md={6} key={post._id}>
              <PostCard post={post} />
            </Grid>
          ))}
          {!feed.length && (
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography align="center" color="text.secondary">
                    No posts yet. Publish via the API or mobile client to populate this view.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>
      )}

      <Box>
        <Typography variant="h6" sx={{ mt: 6, mb: 2 }}>
          Reels Preview
        </Typography>
        {loadingVideos ? (
          <Box className="flex justify-center items-center min-bs-[30dvh]">
            <CircularProgress />
          </Box>
        ) : videosError ? (
          <Stack spacing={2}>
            <Typography color="error">{videosError}</Typography>
            <Button variant="outlined" onClick={loadVideos}>
              Retry
            </Button>
          </Stack>
        ) : (
          <Grid container spacing={3}>
            {videoFeed.map(video => (
              <Grid item xs={12} md={6} key={video._id}>
                <VideoCard video={video} />
              </Grid>
            ))}
            {!videoFeed.length && (
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography align="center" color="text.secondary">
                      No reels yet. Upload via the new `/videos` APIs to populate this preview.
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            )}
          </Grid>
        )}
      </Box>
    </Stack>
  );
};

const PostCard = ({ post }) => {
  const media = post.media || (post.mediaUrl ? [{ url: post.mediaUrl }] : []);
  return (
    <Card sx={{ borderRadius: 3 }}>
      <CardHeader
        title={post?.author?.displayName || "Unknown"}
        subheader={new Date(post.createdAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
      />
      <CardContent>
        <Stack spacing={2}>
          {post.caption && (
            <Typography variant="body1" sx={{ whiteSpace: "pre-line" }}>
              {post.caption}
            </Typography>
          )}

          {!!(post.hashTags?.length || post.hashtags?.length) && (
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {(post.hashTags || post.hashtags || []).map((tag) => (
                <Chip key={tag._id || tag} label={`#${tag.tag || tag}`} size="small" color="secondary" variant="outlined" />
              ))}
            </Stack>
          )}

          {media.length > 0 && (
            <Stack spacing={1}>
              {media.slice(0, 3).map((asset, index) =>
                asset.url ? (
                  <Box key={`${post._id}-asset-${index}`} sx={{ position: "relative", aspectRatio: "3 / 4", borderRadius: 2, overflow: "hidden", bgcolor: "grey.100" }}>
                    <Image src={asset.url} alt={`Post media ${index + 1}`} fill style={{ objectFit: "cover" }} />
                  </Box>
                ) : null
              )}
            </Stack>
          )}

          <Stack direction="row" spacing={2} flexWrap="wrap">
            <Chip label={`${post.likeCount || 0} likes`} size="small" />
            <Chip label={`${post.commentCount || 0} comments`} size="small" />
            <Chip label={`${post.shareCount || 0} shares`} size="small" />
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
};

export default FeedPreviewPage;

const VideoCard = ({ video }) => {
  return (
    <Card sx={{ borderRadius: 3 }}>
      <CardHeader
        title={video?.author?.displayName || "Unknown"}
        subheader={new Date(video.createdAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
      />
      <CardContent>
        <Stack spacing={2}>
          {video.caption && (
            <Typography variant="body1" sx={{ whiteSpace: "pre-line" }}>
              {video.caption}
            </Typography>
          )}
          {!!(video.hashTags?.length || video.hashtags?.length) && (
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {(video.hashTags || video.hashtags || []).map(tag => (
                <Chip key={tag._id || tag} label={`#${tag.tag || tag}`} size="small" variant="outlined" />
              ))}
            </Stack>
          )}
          {video.videoUrl && (
            <Box sx={{ borderRadius: 2, overflow: "hidden", bgcolor: "grey.100" }}>
              <video src={video.videoUrl} poster={video.thumbnailUrl || video.coverImageUrl} controls style={{ width: "100%", display: "block" }} />
            </Box>
          )}
          <Stack direction="row" spacing={2} flexWrap="wrap">
            <Chip label={`${video.likeCount || 0} likes`} size="small" />
            <Chip label={`${video.commentCount || 0} comments`} size="small" />
            <Chip label={`${video.shareCount || 0} shares`} size="small" />
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
};
