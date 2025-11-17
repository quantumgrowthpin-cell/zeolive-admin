"use client";

import { useEffect, useState } from "react";

import {
  Box,
  Button,
  Chip,
  CircularProgress,
  MenuItem,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import { Check, HighlightOff } from "@mui/icons-material";

import { listPosts, updatePostStatus, listComments, updateCommentStatus } from "@/services/v2/content";

const statusOptions = ["ALL", "ACTIVE", "REMOVED"];

const targetTypeOptions = [
  { value: "ALL", label: "All Targets" },
  { value: "POST", label: "Posts" },
  { value: "VIDEO", label: "Videos" },
  { value: "LIVE", label: "Live" },
];

const ContentModerationPage = () => {
  const [activeTab, setActiveTab] = useState("posts");
  const [posts, setPosts] = useState([]);
  const [filters, setFilters] = useState({ status: "ALL", search: "" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const [comments, setComments] = useState([]);
  const [commentFilters, setCommentFilters] = useState({ status: "ALL", targetType: "ALL", search: "" });
  const [commentLoading, setCommentLoading] = useState(false);
  const [commentError, setCommentError] = useState(null);
  const [commentActionLoading, setCommentActionLoading] = useState(null);

  const loadPosts = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await listPosts({
        status: filters.status !== "ALL" ? filters.status : undefined,
        search: filters.search || undefined,
        limit: 50,
      });

      setPosts(data);
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Unable to load posts");
    } finally {
      setLoading(false);
    }
  };

  const loadComments = async () => {
    setCommentLoading(true);
    setCommentError(null);

    try {
      const data = await listComments({
        status: commentFilters.status !== "ALL" ? commentFilters.status : undefined,
        targetType: commentFilters.targetType !== "ALL" ? commentFilters.targetType : undefined,
        search: commentFilters.search || undefined,
        limit: 50,
      });

      setComments(data);
    } catch (err) {
      setCommentError(err?.response?.data?.message || err.message || "Unable to load comments");
    } finally {
      setCommentLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "posts") {
      loadPosts();
    }
  }, [activeTab, filters]);

  useEffect(() => {
    if (activeTab === "comments") {
      loadComments();
    }
  }, [activeTab, commentFilters]);

  const handlePostStatus = async (postId, status) => {
    setActionLoading(postId);

    try {
      await updatePostStatus({ postId, status });
      await loadPosts();
    } finally {
      setActionLoading(false);
    }
  };

  const handleCommentStatus = async (commentId, status) => {
    setCommentActionLoading(commentId);

    try {
      await updateCommentStatus({ commentId, status });
      await loadComments();
    } finally {
      setCommentActionLoading(null);
    }
  };

  return (
    <Stack spacing={3}>
      <div>
        <Typography variant="h5">Content Moderation</Typography>
        <Typography variant="body2" color="text.secondary">
          Review UGC feeds, remove abusive content, and keep the community clean.
        </Typography>
      </div>

      <Tabs value={activeTab} onChange={(_, value) => setActiveTab(value)}>
        <Tab label="Posts" value="posts" />
        <Tab label="Comments" value="comments" />
      </Tabs>

      {activeTab === "posts" && (
        <PostsTab
          posts={posts}
          filters={filters}
          onFiltersChange={setFilters}
          loading={loading}
          error={error}
          onRefresh={loadPosts}
          onStatusChange={handlePostStatus}
          actionLoading={actionLoading}
        />
      )}
      {activeTab === "comments" && (
        <CommentsTab
          comments={comments}
          filters={commentFilters}
          onFiltersChange={setCommentFilters}
          loading={commentLoading}
          error={commentError}
          onRefresh={loadComments}
          onStatusChange={handleCommentStatus}
          actionLoading={commentActionLoading}
        />
      )}
    </Stack>
  );
};

const PostsTab = ({ posts, filters, onFiltersChange, loading, error, onRefresh, onStatusChange, actionLoading }) => {
  if (loading) {
    return (
      <Box className="flex justify-center items-center min-bs-[40dvh]">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Stack spacing={2}>
        <Typography color="error">{error}</Typography>
        <Button variant="outlined" onClick={onRefresh}>
          Retry
        </Button>
      </Stack>
    );
  }

  return (
    <>
      <Stack direction={{ xs: "column", md: "row" }} spacing={2} justifyContent="space-between" alignItems={{ md: "center" }} sx={{ mb: 3 }}>
        <TextField
          size="small"
          placeholder="Search text or hashtag"
          value={filters.search}
          onChange={(event) => onFiltersChange((prev) => ({ ...prev, search: event.target.value }))}
        />
        <Stack direction="row" spacing={2}>
          <TextField
            size="small"
            select
            label="Status"
            value={filters.status}
            onChange={(event) => onFiltersChange((prev) => ({ ...prev, status: event.target.value }))}
          >
            {statusOptions.map((option) => (
              <MenuItem key={option} value={option}>
                {option}
              </MenuItem>
            ))}
          </TextField>
          <Button onClick={onRefresh}>Refresh</Button>
        </Stack>
      </Stack>

      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Author</TableCell>
              <TableCell>Content</TableCell>
              <TableCell>Hashtags</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Created</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {posts.map((post) => (
              <TableRow key={post._id} hover>
                <TableCell>
                  <Stack spacing={0.5}>
                    <Typography fontWeight={600}>{post.author?.displayName || post.author?.email || post.author?._id || "Unknown"}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {post.author?.email || post.author?._id}
                    </Typography>
                  </Stack>
                </TableCell>
                <TableCell sx={{ maxWidth: 360 }}>
                  <Typography variant="body2" sx={{ whiteSpace: "pre-line" }}>
                    {post.content || "—"}
                  </Typography>
                  {post.mediaUrl && (
                    <Typography variant="caption" color="text.secondary" sx={{ wordBreak: "break-all" }}>
                      {post.mediaUrl}
                    </Typography>
                  )}
                </TableCell>
                <TableCell>{post.hashtags?.length ? post.hashtags.join(", ") : "—"}</TableCell>
                <TableCell>
                  <Chip label={post.status} color={post.status === "ACTIVE" ? "success" : "default"} size="small" />
                </TableCell>
                <TableCell>
                  {new Date(post.createdAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
                </TableCell>
                <TableCell align="right">
                  <Stack direction="row" spacing={1} justifyContent="flex-end">
                    <Button
                      size="small"
                      startIcon={<Check />}
                      disabled={actionLoading === post._id || post.status === "ACTIVE"}
                      onClick={() => onStatusChange(post._id, "ACTIVE")}
                    >
                      Approve
                    </Button>
                    <Button
                      size="small"
                      color="error"
                      startIcon={<HighlightOff />}
                      disabled={actionLoading === post._id || post.status === "REMOVED"}
                      onClick={() => onStatusChange(post._id, "REMOVED")}
                    >
                      Remove
                    </Button>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
            {!posts.length && (
              <TableRow>
                <TableCell colSpan={6}>
                  <Typography variant="body2">No posts found for current filters.</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );
};

const CommentsTab = ({ comments, filters, onFiltersChange, loading, error, onRefresh, onStatusChange, actionLoading }) => {
  if (loading) {
    return (
      <Box className="flex justify-center items-center min-bs-[40dvh]">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Stack spacing={2}>
        <Typography color="error">{error}</Typography>
        <Button variant="outlined" onClick={onRefresh}>
          Retry
        </Button>
      </Stack>
    );
  }

  return (
    <>
      <Stack direction={{ xs: "column", md: "row" }} spacing={2} justifyContent="space-between" alignItems={{ md: "center" }} sx={{ mb: 3 }}>
        <TextField
          size="small"
          placeholder="Search text or user"
          value={filters.search}
          onChange={(event) => onFiltersChange((prev) => ({ ...prev, search: event.target.value }))}
        />
        <Stack direction="row" spacing={2}>
          <TextField
            size="small"
            select
            label="Status"
            value={filters.status}
            onChange={(event) => onFiltersChange((prev) => ({ ...prev, status: event.target.value }))}
          >
            {statusOptions.map((option) => (
              <MenuItem key={option} value={option}>
                {option}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            size="small"
            select
            label="Target"
            value={filters.targetType}
            onChange={(event) => onFiltersChange((prev) => ({ ...prev, targetType: event.target.value }))}
          >
            {targetTypeOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
          <Button onClick={onRefresh}>Refresh</Button>
        </Stack>
      </Stack>

      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>User</TableCell>
              <TableCell>Comment</TableCell>
              <TableCell>Target</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Created</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {comments.map((comment) => (
              <TableRow key={comment._id} hover>
                <TableCell>
                  <Stack spacing={0.5}>
                    <Typography fontWeight={600}>{comment.author?.displayName || comment.author?.email || comment.author?._id || "Unknown"}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {comment.author?.email || comment.author?._id}
                    </Typography>
                  </Stack>
                </TableCell>
                <TableCell sx={{ maxWidth: 360 }}>
                  <Typography variant="body2" sx={{ whiteSpace: "pre-line" }}>
                    {comment.commentText || "—"}
                  </Typography>
                </TableCell>
                <TableCell>{comment.targetType || "—"}</TableCell>
                <TableCell>
                  <Chip label={comment.status} color={comment.status === "ACTIVE" ? "success" : "default"} size="small" />
                </TableCell>
                <TableCell>
                  {new Date(comment.createdAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
                </TableCell>
                <TableCell align="right">
                  <Stack direction="row" spacing={1} justifyContent="flex-end">
                    <Button
                      size="small"
                      startIcon={<Check />}
                      disabled={actionLoading === comment._id || comment.status === "ACTIVE"}
                      onClick={() => onStatusChange(comment._id, "ACTIVE")}
                    >
                      Approve
                    </Button>
                    <Button
                      size="small"
                      color="error"
                      startIcon={<HighlightOff />}
                      disabled={actionLoading === comment._id || comment.status === "REMOVED"}
                      onClick={() => onStatusChange(comment._id, "REMOVED")}
                    >
                      Remove
                    </Button>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
            {!comments.length && (
              <TableRow>
                <TableCell colSpan={6}>
                  <Typography variant="body2">No comments found for current filters.</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );
};

export default ContentModerationPage;
