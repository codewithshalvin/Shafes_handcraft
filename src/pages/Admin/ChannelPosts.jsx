import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './ChannelPosts.css';

const API_BASE_URL = 'http://localhost:5000/api';

const ChannelPosts = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [postComments, setPostComments] = useState([]);
  const [replyText, setReplyText] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [newPost, setNewPost] = useState({
    title: '',
    description: '',
    type: 'article',
    category: 'Behind the Scenes',
    tags: '',
    isPublished: true
  });
  const [selectedFiles, setSelectedFiles] = useState({
    content: null,
    thumbnail: null
  });

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      console.log('🔍 Fetching posts with token:', token ? `${token.substring(0, 20)}...` : 'No token');
      
      if (!token) {
        console.error('❌ No admin token found');
        setPosts([]);
        return;
      }
      
      const response = await axios.get(`${API_BASE_URL}/admin/posts`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('✅ Posts fetched successfully:', response.data);
      setPosts(response.data.posts || []);
    } catch (error) {
      console.error('❌ Error fetching posts:', error.response || error);
      if (error.response?.status === 401) {
        console.error('❌ Unauthorized - Admin token may be invalid');
      }
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('adminToken');
      const formData = new FormData();
      
      // Add text fields
      Object.keys(newPost).forEach(key => {
        formData.append(key, newPost[key]);
      });
      
      // Add files if selected
      if (selectedFiles.content) {
        formData.append('content', selectedFiles.content);
      }
      if (selectedFiles.thumbnail) {
        formData.append('thumbnail', selectedFiles.thumbnail);
      }

      const response = await axios.post(`${API_BASE_URL}/admin/posts`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        alert('Post created successfully!');
        setShowCreateModal(false);
        resetForm();
        fetchPosts();
      }
    } catch (error) {
      console.error('Error creating post:', error);
      alert('Error creating post. Please try again.');
    }
  };

  const resetForm = () => {
    setNewPost({
      title: '',
      description: '',
      type: 'article',
      category: 'Behind the Scenes',
      tags: '',
      isPublished: true
    });
    setSelectedFiles({ content: null, thumbnail: null });
  };

  const handleFileChange = (fileType, file) => {
    setSelectedFiles(prev => ({ ...prev, [fileType]: file }));
  };

  const handleViewComments = async (post) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get(`${API_BASE_URL}/admin/posts/${post._id}/comments`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setSelectedPost(response.data.post);
        setPostComments(response.data.post.comments || []);
        setShowCommentsModal(true);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
      alert('Error loading comments. Please try again.');
    }
  };
  
  const handleReplyToComment = async (commentId) => {
    if (!replyText.trim()) return;
    
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.post(
        `${API_BASE_URL}/admin/posts/${selectedPost._id}/comments/${commentId}/reply`,
        { content: replyText },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.success) {
        // Refresh comments
        await handleViewComments(selectedPost);
        setReplyText('');
        setReplyingTo(null);
        alert('Reply sent successfully!');
      }
    } catch (error) {
      console.error('Error replying to comment:', error);
      alert('Error sending reply. Please try again.');
    }
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    
    try {
      const token = localStorage.getItem('adminToken');
      await axios.delete(`${API_BASE_URL}/admin/posts/${postId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      alert('Post deleted successfully!');
      fetchPosts();
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('Error deleting post. Please try again.');
    }
  };

  if (loading) {
    return <div className="loading-spinner">Loading Channel Posts...</div>;
  }

  return (
    <div className="channel-posts-admin">
      <div className="posts-header">
        <h1>🎬 ShafesChannel Posts</h1>
        <button 
          className="create-post-btn"
          onClick={() => setShowCreateModal(true)}
        >
          + Create New Post
        </button>
      </div>

      <div className="posts-stats">
        <div className="stat-card">
          <h3>Total Posts</h3>
          <span>{posts.length}</span>
        </div>
        <div className="stat-card">
          <h3>Published</h3>
          <span>{posts.filter(p => p.isPublished).length}</span>
        </div>
        <div className="stat-card">
          <h3>Drafts</h3>
          <span>{posts.filter(p => !p.isPublished).length}</span>
        </div>
      </div>

      <div className="posts-grid">
        {posts.length === 0 ? (
          <div className="empty-state">
            <h3>No posts yet!</h3>
            <p>Create your first ShafesChannel post to get started.</p>
            <button 
              className="create-first-post-btn"
              onClick={() => setShowCreateModal(true)}
            >
              Create First Post
            </button>
          </div>
        ) : (
          posts.map(post => (
            <div key={post._id} className="post-card">
              <div className="post-image">
                {post.thumbnail ? (
                  <img src={`http://localhost:5000${post.thumbnail}`} alt={post.title} />
                ) : (
                  <div className="no-image">📝</div>
                )}
              </div>
              <div className="post-info">
                <h3>{post.title}</h3>
                <p>{post.description.substring(0, 100)}...</p>
                <div className="post-meta">
                  <span className={`status ${post.isPublished ? 'published' : 'draft'}`}>
                    {post.isPublished ? '✅ Published' : '📝 Draft'}
                  </span>
                  <span className="type">{post.type}</span>
                </div>
                <div className="post-stats">
                  <span>👀 {post.views || 0}</span>
                  <span>❤️ {post.likes?.length || 0}</span>
                  <span>💬 {post.comments?.length || 0}</span>
                </div>
                <div className="post-actions">
                  <button className="edit-btn">✏️ Edit</button>
                  <button 
                    className="comments-btn"
                    onClick={() => handleViewComments(post)}
                  >
                    💬 Comments ({post.comments?.length || 0})
                  </button>
                  <button 
                    className="delete-btn"
                    onClick={() => handleDeletePost(post._id)}
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Post Modal */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Create New Post</h2>
              <button 
                className="close-btn"
                onClick={() => setShowCreateModal(false)}
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleCreatePost} className="create-post-form">
              <div className="form-group">
                <label>Post Title *</label>
                <input
                  type="text"
                  value={newPost.title}
                  onChange={(e) => setNewPost({...newPost, title: e.target.value})}
                  required
                  placeholder="Enter an engaging title..."
                />
              </div>

              <div className="form-group">
                <label>Description *</label>
                <textarea
                  value={newPost.description}
                  onChange={(e) => setNewPost({...newPost, description: e.target.value})}
                  required
                  rows="4"
                  placeholder="Tell your story..."
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Type</label>
                  <select
                    value={newPost.type}
                    onChange={(e) => setNewPost({...newPost, type: e.target.value})}
                  >
                    <option value="article">📝 Article</option>
                    <option value="video">🎥 Video</option>
                    <option value="artwork">🎨 Artwork</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Category</label>
                  <select
                    value={newPost.category}
                    onChange={(e) => setNewPost({...newPost, category: e.target.value})}
                  >
                    <option value="Behind the Scenes">Behind the Scenes</option>
                    <option value="Customer Stories">Customer Stories</option>
                    <option value="Tips & Tutorials">Tips & Tutorials</option>
                    <option value="New Collections">New Collections</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Tags (comma separated)</label>
                <input
                  type="text"
                  value={newPost.tags}
                  onChange={(e) => setNewPost({...newPost, tags: e.target.value})}
                  placeholder="handcraft, pottery, tutorial..."
                />
              </div>

              <div className="form-group">
                <label>Thumbnail Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange('thumbnail', e.target.files[0])}
                />
              </div>

              <div className="form-group">
                <label>Content File (Video/Image)</label>
                <input
                  type="file"
                  accept="image/*,video/*"
                  onChange={(e) => handleFileChange('content', e.target.files[0])}
                />
              </div>

              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={newPost.isPublished}
                    onChange={(e) => setNewPost({...newPost, isPublished: e.target.checked})}
                  />
                  Publish immediately
                </label>
              </div>

              <div className="form-actions">
                <button type="button" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="create-btn">
                  Create Post
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Comments Modal */}
      {showCommentsModal && selectedPost && (
        <div className="modal-overlay">
          <div className="modal-content comments-modal">
            <div className="modal-header">
              <div>
                <h2>💬 Comments for: {selectedPost.title}</h2>
                <div className="post-stats-mini">
                  <span>👀 {selectedPost.views} views</span>
                  <span>❤️ {selectedPost.likes} likes</span>
                  <span>💬 {postComments.length} comments</span>
                </div>
              </div>
              <button 
                className="close-btn"
                onClick={() => {
                  setShowCommentsModal(false);
                  setSelectedPost(null);
                  setReplyingTo(null);
                  setReplyText('');
                }}
              >
                ✕
              </button>
            </div>
            
            <div className="comments-list">
              {postComments.length === 0 ? (
                <div className="no-comments">
                  <p>📝 No comments yet on this post.</p>
                </div>
              ) : (
                postComments.map(comment => (
                  <div key={comment._id} className="comment-item">
                    <div className="comment-header">
                      <div className="comment-user">
                        <div className="user-avatar">
                          {comment.userId?.name?.charAt(0) || '?'}
                        </div>
                        <div>
                          <span className="user-name">{comment.userId?.name || 'Anonymous'}</span>
                          <span className="user-email">({comment.userId?.email || 'No email'})</span>
                          <div className="comment-date">
                            {new Date(comment.createdAt).toLocaleDateString()} at {' '}
                            {new Date(comment.createdAt).toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="comment-content">
                      <p>{comment.content}</p>
                    </div>
                    
                    {comment.replies && comment.replies.length > 0 && (
                      <div className="comment-replies">
                        {comment.replies.map((reply, index) => (
                          <div key={index} className="reply-item admin-reply">
                            <div className="reply-header">
                              <span className="admin-badge">👑 Admin</span>
                              <span className="reply-date">
                                {new Date(reply.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            <p>{reply.content}</p>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    <div className="comment-actions">
                      {replyingTo === comment._id ? (
                        <div className="reply-form">
                          <textarea
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            placeholder="Type your admin reply..."
                            rows={3}
                          />
                          <div className="reply-actions">
                            <button 
                              onClick={() => handleReplyToComment(comment._id)}
                              className="send-reply-btn"
                              disabled={!replyText.trim()}
                            >
                              Send Reply
                            </button>
                            <button 
                              onClick={() => {
                                setReplyingTo(null);
                                setReplyText('');
                              }}
                              className="cancel-reply-btn"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button 
                          onClick={() => setReplyingTo(comment._id)}
                          className="reply-btn"
                        >
                          💬 Reply as Admin
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChannelPosts;
