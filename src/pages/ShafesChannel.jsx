// src/pages/ShafesChannel.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './ShafesChannel.css';

const API_BASE_URL = 'http://localhost:5000/api';

const ShafesChannel = () => {
  const [user, setUser] = useState(null);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState({});
  const [authLoading, setAuthLoading] = useState(true);
  const [likingPosts, setLikingPosts] = useState(new Set());
  const [commentingPosts, setCommentingPosts] = useState(new Set());
  
  // Check authentication and subscription on load
  useEffect(() => {
    checkAuth();
  }, []);
  
  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setAuthLoading(false);
        return;
      }
      
      // Check user authentication and subscription
      const response = await axios.get(`${API_BASE_URL}/subscription/status`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setUser({ name: 'User' }); // Basic user info
        setIsSubscribed(response.data.subscribed);
        if (response.data.subscribed) {
          fetchPosts();
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      setAuthLoading(false);
      if (!isSubscribed) {
        setLoading(false);
      }
    }
  };
  
  const fetchPosts = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/posts`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setPosts(response.data.posts || []);
        // Track views for all posts when they are loaded
        trackPostViews(response.data.posts || []);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
      // Fallback to sample content if API fails
      setPosts(getSamplePosts());
    } finally {
      setLoading(false);
    }
  };
  
  // Track views for posts when they come into view
  const trackPostViews = async (postsToTrack) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      // Track view for each post (debounce to avoid spam)
      postsToTrack.forEach(async (post, index) => {
        setTimeout(async () => {
          try {
            await axios.get(`${API_BASE_URL}/posts/${post._id}`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            console.log(`📈 View tracked for post: ${post.title}`);
          } catch (error) {
            console.error('Error tracking view:', error);
          }
        }, index * 1000); // Stagger the requests
      });
    } catch (error) {
      console.error('Error in trackPostViews:', error);
    }
  };
  
  const getSamplePosts = () => [
    {
      id: 1,
      title: "New Handcrafted Collection Launch! ✨",
      content: "We're thrilled to announce our latest collection featuring beautiful handwoven tapestries and ceramic pottery. Each piece tells a unique story and brings warmth to any space. What do you think about our new designs?",
      image: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=600&q=80",
      author: "Shafe's Team",
      timestamp: "2 hours ago",
      likes: 24,
      comments: [
        { id: 1, user: "Sarah M.", text: "These look absolutely beautiful! I love the colors.", timestamp: "1 hour ago" },
        { id: 2, user: "Mike J.", text: "Amazing craftsmanship as always!", timestamp: "45 minutes ago" }
      ]
    },
    {
      id: 2,
      title: "Behind the Scenes: Pottery Making Process 🏺",
      content: "Ever wondered how our ceramic pieces come to life? Here's a glimpse into our pottery studio where magic happens. From clay to finished masterpiece - it's a journey of passion and dedication.",
      image: "https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=600&q=80",
      author: "Shafe's Team",
      timestamp: "1 day ago",
      likes: 42,
      comments: [
        { id: 3, user: "Emma R.", text: "So fascinating to see the process! Thank you for sharing.", timestamp: "18 hours ago" },
        { id: 4, user: "David L.", text: "The attention to detail is incredible.", timestamp: "12 hours ago" },
        { id: 5, user: "Lisa K.", text: "I'd love to try pottery making someday!", timestamp: "8 hours ago" }
      ]
    },
    {
      id: 3,
      title: "Customer Spotlight: Living Room Transformation 🏠",
      content: "Look at this stunning transformation by our customer Maria! She used our handwoven wall hangings and ceramic vases to create this cozy, artistic living space. We love seeing how our pieces bring joy to your homes!",
      image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&q=80",
      author: "Shafe's Team",
      timestamp: "3 days ago",
      likes: 67,
      comments: [
        { id: 6, user: "Maria C.", text: "Thank you for featuring my space! I absolutely love everything I bought.", timestamp: "2 days ago" },
        { id: 7, user: "Tom H.", text: "This looks amazing! Great inspiration.", timestamp: "2 days ago" }
      ]
    },
    {
      id: 4,
      title: "Sustainable Crafting: Our Eco-Friendly Approach 🌱",
      content: "Sustainability is at the heart of everything we do. From using recycled materials to partnering with local artisans, we're committed to creating beautiful pieces while caring for our planet. Learn about our green initiatives!",
      image: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=600&q=80",
      author: "Shafe's Team",
      timestamp: "5 days ago",
      likes: 89,
      comments: [
        { id: 8, user: "Green Lover", text: "So happy to support a sustainable business!", timestamp: "4 days ago" },
        { id: 9, user: "Eco Warrior", text: "More companies should follow your example.", timestamp: "3 days ago" }
      ]
    }
  ];

  const handleSubscribe = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please login first to subscribe!');
        window.location.href = '/login';
        return;
      }
      
      const response = await axios.post(`${API_BASE_URL}/subscribe`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setIsSubscribed(true);
        alert('Successfully subscribed to ShafesChannel!');
        fetchPosts();
      }
    } catch (error) {
      console.error('Subscription error:', error);
      alert('Error subscribing. Please try again.');
    }
  };

  const handleLike = async (postId) => {
    if (likingPosts.has(postId)) return; // Prevent double clicks
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please login to like posts!');
        return;
      }
      
      setLikingPosts(prev => new Set([...prev, postId]));
      
      const response = await axios.post(`${API_BASE_URL}/posts/${postId}/like`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setPosts(prevPosts =>
          prevPosts.map(post =>
            post._id === postId
              ? { ...post, likes: Array(response.data.likeCount).fill({}) }
              : post
          )
        );
      }
    } catch (error) {
      console.error('Error liking post:', error);
      alert('Error liking post. Please try again.');
    } finally {
      setLikingPosts(prev => {
        const newSet = new Set(prev);
        newSet.delete(postId);
        return newSet;
      });
    }
  };

  const handleComment = async (postId) => {
    if (!newComment[postId]?.trim()) return;

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please login to comment!');
        return;
      }
      
      const response = await axios.post(`${API_BASE_URL}/posts/${postId}/comment`, {
        content: newComment[postId]
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        const newCommentData = {
          _id: response.data.comment._id,
          userId: response.data.comment.userId,
          content: response.data.comment.content,
          createdAt: response.data.comment.createdAt
        };
        
        setPosts(prevPosts =>
          prevPosts.map(post =>
            post._id === postId
              ? { ...post, comments: [...post.comments, newCommentData] }
              : post
          )
        );
        
        setNewComment(prev => ({ ...prev, [postId]: "" }));
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      alert('Error adding comment. Please try again.');
    }
  };

  const handleCommentChange = (postId, value) => {
    setNewComment(prev => ({ ...prev, [postId]: value }));
  };

  if (authLoading || loading) {
    return (
      <div className="channel-loading">
        <div className="loading-spinner"></div>
        <p>Loading Shafe's Channel...</p>
      </div>
    );
  }
  
  // Show subscription prompt if not subscribed
  if (!isSubscribed) {
    return (
      <div className="shafes-channel">
        <div className="channel-header">
          <div className="channel-banner">
            <div className="banner-content">
              <div className="channel-info">
                <div className="channel-avatar">
                  <img src="https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=100&q=80" alt="Shafe's Handcraft" />
                </div>
                <div className="channel-details">
                  <h1>Shafe's Channel</h1>
                  <p>Welcome to our creative community! 🎨</p>
                  <div className="channel-stats">
                    <span>📝 Exclusive Content</span>
                    <span>💬 Active Community</span>
                  </div>
                </div>
              </div>
              <div className="channel-actions">
                <button 
                  className="subscribe-btn"
                  onClick={handleSubscribe}
                >
                  + Subscribe to Access Content
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <div className="subscription-required">
          <div className="subscription-message">
            <h2>🔒 Subscription Required</h2>
            <p>Subscribe to ShafesChannel to access exclusive content, behind-the-scenes videos, tutorials, and more!</p>
            <div className="subscription-benefits">
              <div className="benefit">
                <span className="benefit-icon">🎨</span>
                <span>Exclusive artisan content</span>
              </div>
              <div className="benefit">
                <span className="benefit-icon">📚</span>
                <span>Step-by-step tutorials</span>
              </div>
              <div className="benefit">
                <span className="benefit-icon">💬</span>
                <span>Interactive community</span>
              </div>
              <div className="benefit">
                <span className="benefit-icon">🎬</span>
                <span>Behind-the-scenes videos</span>
              </div>
            </div>
            <button 
              className="subscribe-btn-large"
              onClick={handleSubscribe}
            >
              Subscribe Now - It's Free!
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="shafes-channel">
      {/* Channel Header */}
      <div className="channel-header">
        <div className="channel-banner">
          <div className="banner-content">
            <div className="channel-info">
              <div className="channel-avatar">
                <img src="https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=100&q=80" alt="Shafe's Handcraft" />
              </div>
              <div className="channel-details">
                <h1>Shafe's Channel</h1>
                <p>Welcome to our creative community! 🎨</p>
                <div className="channel-stats">
                  
                  <span>📝 {posts.length} Posts</span>
                  <span>💬 Active Community</span>
                </div>
              </div>
            </div>
            <div className="channel-actions">
              <button className={`subscribe-btn ${isSubscribed ? 'subscribed' : ''}`}>
                {isSubscribed ? '⭐ Subscribed' : '+ Subscribe'}
              </button>
              <button className="notification-btn">
                🔔
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Posts Feed */}
      <div className="posts-container">
        <div className="posts-header">
          <h2>Latest Posts</h2>
          <div className="posts-filter">
            <button className="filter-btn active">All Posts</button>
            <button className="filter-btn">Behind the Scenes</button>
            <button className="filter-btn">Customer Stories</button>
            <button className="filter-btn">Tips & Tutorials</button>
          </div>
        </div>

        <div className="posts-feed">
          {posts.map(post => (
            <div key={post._id || post.id} className="post-card">
              <div className="post-header">
                <div className="post-author">
                  <div className="author-avatar">
                    <img src="https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=40&q=80" alt={typeof post.author === 'object' ? post.author.name : post.author} />
                  </div>
                  <div className="author-info">
                    <h3>{typeof post.author === 'object' ? post.author.name || post.author.email || 'Unknown Author' : post.author}</h3>
                    <span className="post-time">{post.timestamp || new Date(post.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <button className="post-menu">⋯</button>
              </div>

              <div className="post-content">
                <h4 className="post-title">{post.title}</h4>
                <p className="post-text">{post.description || post.content}</p>
                
                {/* Render Video for video posts */}
                {post.type === 'video' && post.content && (
                  <div className="post-video">
                    <video 
                      controls
                      poster={`http://localhost:5000${post.thumbnail || post.image}`}
                      style={{ width: '100%', height: 'auto', borderRadius: '12px' }}
                      onError={(e) => {
                        console.error('Failed to load video:', post.content);
                        // Fallback to show thumbnail image if video fails
                        e.target.style.display = 'none';
                        const fallbackImg = e.target.nextElementSibling;
                        if (fallbackImg) fallbackImg.style.display = 'block';
                      }}
                    >
                      {post.content && (
                        <source src={`http://localhost:5000${post.content}`} type="video/mp4" />
                      )}
                      Your browser does not support the video tag.
                    </video>
                    {/* Fallback image if video fails */}
                    <img 
                      src={`http://localhost:5000${post.thumbnail || post.image}`} 
                      alt="Video thumbnail"
                      style={{ display: 'none', width: '100%', borderRadius: '12px' }}
                    />
                    <div className="video-overlay">
                      <span className="video-badge">📹 Video</span>
                    </div>
                  </div>
                )}
                
                {/* Render Image for video posts without video content */}
                {post.type === 'video' && !post.content && (post.thumbnail || post.image) && (
                  <div className="post-image video-placeholder">
                    <img 
                      src={`http://localhost:5000${post.thumbnail || post.image}`} 
                      alt="Video placeholder"
                      loading="lazy"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        console.error('Failed to load image:', post.thumbnail || post.image);
                      }}
                      onLoad={(e) => {
                        e.target.style.opacity = '1';
                      }}
                      style={{ opacity: '0', transition: 'opacity 0.3s ease' }}
                    />
                    <div className="video-placeholder-overlay">
                      <div className="play-button">
                        ▶️
                      </div>
                      <span className="video-badge">📹 Video (Coming Soon)</span>
                    </div>
                  </div>
                )}
                
                {/* Render Image for non-video posts */}
                {post.type !== 'video' && (post.thumbnail || post.image) && (
                  <div className="post-image">
                    <img 
                      src={`http://localhost:5000${post.thumbnail || post.image}`} 
                      alt="Post content"
                      loading="lazy"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        console.error('Failed to load image:', post.thumbnail || post.image);
                      }}
                      onLoad={(e) => {
                        e.target.style.opacity = '1';
                      }}
                      style={{ opacity: '0', transition: 'opacity 0.3s ease' }}
                    />
                  </div>
                )}
              </div>

              <div className="post-actions">
                <button
                  className={`action-btn like-btn ${likingPosts.has(post._id || post.id) ? 'liking' : ''}`}
                  onClick={() => handleLike(post._id || post.id)}
                  disabled={likingPosts.has(post._id || post.id)}
                >
                  <span className="action-icon">
                    {likingPosts.has(post._id || post.id) ? '⏳' : '❤️'}
                  </span>
                  <span className="action-count">{Array.isArray(post.likes) ? post.likes.length : post.likes || 0}</span>
                </button>
                <button className="action-btn comment-btn">
                  <span className="action-icon">💬</span>
                  <span className="action-count">{post.comments ? post.comments.length : 0}</span>
                </button>
                <button className="action-btn share-btn">
                  <span className="action-icon">📤</span>
                  <span className="action-text">Share</span>
                </button>
              </div>

              <div className="comments-section">
                <div className="comments-list">
                  {post.comments && post.comments.map(comment => (
                    <div key={comment._id || comment.id} className="comment-thread">
                      {/* User Comment */}
                      <div className="comment">
                        <div className="comment-avatar">
                          <img src={`https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&q=80`} alt={comment.userId?.name || comment.user} />
                        </div>
                        <div className="comment-content">
                          <div className="comment-header">
                            <span className="comment-user">{comment.userId?.name || comment.userId?.email || comment.user || 'Anonymous'}</span>
                            <span className="comment-time">{comment.timestamp || new Date(comment.createdAt).toLocaleDateString()}</span>
                          </div>
                          <p className="comment-text">{comment.content || comment.text}</p>
                        </div>
                      </div>
                      
                      {/* Admin Replies */}
                      {comment.replies && comment.replies.length > 0 && (
                        <div className="admin-replies">
                          {comment.replies.map((reply, replyIndex) => (
                            <div key={`${comment._id}_reply_${replyIndex}`} className="comment admin-reply">
                              <div className="comment-avatar admin-avatar">
                                <img src={`https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=32&q=80`} alt="Admin" />
                                <div className="admin-badge">ADMIN</div>
                              </div>
                              <div className="comment-content">
                                <div className="comment-header">
                                  <span className="comment-user admin-user">Admin</span>
                                  <span className="comment-time">{new Date(reply.createdAt).toLocaleDateString()}</span>
                                </div>
                                <p className="comment-text">{reply.content}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="add-comment">
                  <div className="comment-input-container">
                    <img 
                      src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&q=80" 
                      alt="Your avatar" 
                      className="comment-avatar"
                    />
                    <input
                      type="text"
                      placeholder="Add a comment..."
                      value={newComment[post._id || post.id] || ""}
                      onChange={(e) => handleCommentChange(post._id || post.id, e.target.value)}
                      className="comment-input"
                      onKeyPress={(e) => e.key === 'Enter' && handleComment(post._id || post.id)}
                    />
                    <button
                      className="comment-submit"
                      onClick={() => handleComment(post._id || post.id)}
                      disabled={!newComment[post._id || post.id]?.trim()}
                    >
                      Post
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Load More */}
        <div className="load-more">
          <button className="load-more-btn">
            Load More Posts
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShafesChannel;