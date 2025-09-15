import React, { useState, useEffect, useRef } from 'react';
import { Container, Row, Col, Card, Button, Badge, Modal, Tab, Tabs, ListGroup, Form, ProgressBar, Dropdown, InputGroup, Alert, Spinner } from 'react-bootstrap';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faPlay,
    faPause,
    faVolumeMute,
    faVolumeUp,
    faExpand,
    faCompress,
    faArrowLeft,
    faHeart,
    faShare,
    faDownload,
    faEye,
    faThumbsUp,
    faComment,
    faPlus,
    faStar,
    faTrophy,
    faAward,
    faCrown,
    faUser,
    faCalendarAlt,
    faVideo,
    faMusic,
    faTag,
    faFlag,
    faReply,
    faThumbsDown,
    faEllipsisV,
    faSort,
    faFilter,
    faRandom,
    faSmile,
    faPaperPlane,
    faBookmark,
    faUserPlus,
    faSpinner,
    faTrash,
    faEdit,
    faChevronDown,
    faChevronUp
} from '@fortawesome/free-solid-svg-icons';
import { AnimatedElement } from '../common/PageTransition';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import CategoryBadge from '../common/CategoryBadge';

const ClipDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const videoRef = useRef(null);

    const [loading, setLoading] = useState(true);
    const [clip, setClip] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [volume, setVolume] = useState(100);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [playbackRate, setPlaybackRate] = useState(1);
    const [showControls, setShowControls] = useState(true);
    const [autoplay, setAutoplay] = useState(false);

    const [showShareModal, setShowShareModal] = useState(false);
    const [activeTab, setActiveTab] = useState('comments');
    const [isLiked, setIsLiked] = useState(false);
    const [isBookmarked, setIsBookmarked] = useState(false);
    const [isFollowing, setIsFollowing] = useState(false);
    const [likesCount, setLikesCount] = useState(0);

    const [comments, setComments] = useState([]);
    const [commentsLoading, setCommentsLoading] = useState(false);
    const [newComment, setNewComment] = useState('');
    const [replyingTo, setReplyingTo] = useState(null);
    const [replyText, setReplyText] = useState('');
    const [commentsSort, setCommentsSort] = useState('recent');
    const [commentsFilter, setCommentsFilter] = useState('all');
    const [showCommentModal, setShowCommentModal] = useState(false);

    // État pour masquer/afficher les réponses
    const [expandedComments, setExpandedComments] = useState(new Set());

    const [relatedClips, setRelatedClips] = useState([]);
    const [suggestionsLoading, setSuggestionsLoading] = useState(false);

    const toast = useToast();
    const { user, token } = useAuth();

    useEffect(() => {
        loadClip();
        loadComments();
    }, [id]);

    useEffect(() => {
        const video = videoRef.current;
        if (video) {
            const updateTime = () => setCurrentTime(video.currentTime);
            const updateDuration = () => setDuration(video.duration);
            const handleEnded = () => {
                setIsPlaying(false);
                if (autoplay && relatedClips.length > 0) {
                    setTimeout(() => {
                        navigate(`/clips/${relatedClips[0].id}`);
                    }, 3000);
                }
            };

            video.addEventListener('timeupdate', updateTime);
            video.addEventListener('loadedmetadata', updateDuration);
            video.addEventListener('ended', handleEnded);

            return () => {
                video.removeEventListener('timeupdate', updateTime);
                video.removeEventListener('loadedmetadata', updateDuration);
                video.removeEventListener('ended', handleEnded);
            };
        }
    }, [clip, autoplay, relatedClips, navigate]);

    const loadClip = async () => {
        try {
            setLoading(true);

            const response = await fetch(`/api/clips/${id}`);
            const result = await response.json();

            if (response.ok) {
                setClip(result.clip);
                setLikesCount(result.clip.likes);
                setIsLiked(result.is_liked);
                setIsBookmarked(result.is_bookmarked);
                setIsFollowing(result.is_following);
                setRelatedClips(result.similar_clips || []);

                await loadRelatedClips(result.clip);
            } else {
                throw new Error(result.message || 'Clip non trouvé');
            }
        } catch (error) {
            console.error('Erreur lors du chargement du clip:', error);
            toast?.error('Erreur', 'Clip non trouvé');
            navigate('/clips');
        } finally {
            setLoading(false);
        }
    };

    const loadComments = async () => {
        try {
            setCommentsLoading(true);

            const response = await fetch(`/api/clips/${id}/comments`);

            if (response.ok) {
                const result = await response.json();
                setComments(result.comments || []);
            } else {
                const mockComments = [
                    {
                        id: 1,
                        user: {
                            id: 1,
                            name: "Fan de musique",
                            avatar_url: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=50&h=50&fit=crop&crop=face"
                        },
                        content: "Magnifique clip ! 🎵",
                        likes: 45,
                        is_liked: false,
                        replies_count: 2,
                        replies: [
                            {
                                id: 101,
                                user: {
                                    id: 2,
                                    name: "Artiste237",
                                    avatar_url: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=50&h=50&fit=crop&crop=face"
                                },
                                content: "Merci beaucoup ! 🙏",
                                likes: 12,
                                is_liked: false,
                                created_at: new Date(Date.now() - 1800000).toISOString(),
                            },
                            {
                                id: 102,
                                user: {
                                    id: 3,
                                    name: "Fan2",
                                    avatar_url: "https://images.unsplash.com/photo-1494790108755-2616c3b7b572?w=50&h=50&fit=crop&crop=face"
                                },
                                content: "J'adore cette chanson !",
                                likes: 8,
                                is_liked: true,
                                created_at: new Date(Date.now() - 900000).toISOString(),
                            }
                        ],
                        created_at: new Date(Date.now() - 3600000).toISOString(),
                    },
                    {
                        id: 2,
                        user: {
                            id: 2,
                            name: "Mélomane237",
                            avatar_url: "https://images.unsplash.com/photo-1494790108755-2616c3b7b572?w=50&h=50&fit=crop&crop=face"
                        },
                        content: "La production est exceptionnelle ! Bravo 👏",
                        likes: 32,
                        is_liked: true,
                        replies_count: 0,
                        replies: [],
                        created_at: new Date(Date.now() - 7200000).toISOString(),
                    }
                ];
                setComments(mockComments);
            }
        } catch (error) {
            console.error('Erreur lors du chargement des commentaires:', error);
            setComments([]);
        } finally {
            setCommentsLoading(false);
        }
    };

    const loadRelatedClips = async (currentClip) => {
        try {
            setSuggestionsLoading(true);

            const params = new URLSearchParams({
                category: currentClip.category,
                exclude: currentClip.id,
                limit: 6
            });

            const response = await fetch(`/api/clips?${params}`);
            const result = await response.json();

            if (response.ok) {
                const clips = result.clips.data || result.clips || [];

                const scoredClips = clips.map(clip => {
                    let score = 0;

                    if (clip.category === currentClip.category) {
                        score += 40;
                    }

                    const commonTags = clip.tags.filter(tag =>
                        currentClip.tags.some(currentTag =>
                            currentTag.toLowerCase().includes(tag.toLowerCase()) ||
                            tag.toLowerCase().includes(currentTag.toLowerCase())
                        )
                    );
                    score += (commonTags.length / Math.max(clip.tags.length, currentClip.tags.length)) * 30;

                    const maxViews = Math.max(...clips.map(c => c.views), currentClip.views);
                    score += (clip.views / maxViews) * 20;

                    const clipDate = new Date(clip.created_at);
                    const currentDate = new Date(currentClip.created_at);
                    const daysDiff = Math.abs(clipDate - currentDate) / (1000 * 60 * 60 * 24);
                    const recencyScore = Math.max(0, 10 - (daysDiff / 7));
                    score += recencyScore;

                    return { ...clip, score };
                })
                .sort((a, b) => b.score - a.score)
                .slice(0, 6);

                setRelatedClips(scoredClips);
            }
        } catch (error) {
            console.error('Erreur lors du chargement des suggestions:', error);
        } finally {
            setSuggestionsLoading(false);
        }
    };

    const togglePlay = () => {
        const video = videoRef.current;
        if (video) {
            if (isPlaying) {
                video.pause();
            } else {
                video.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    const toggleMute = () => {
        const video = videoRef.current;
        if (video) {
            video.muted = !isMuted;
            setIsMuted(!isMuted);
        }
    };

    const handleVolumeChange = (e) => {
        const newVolume = e.target.value;
        setVolume(newVolume);
        if (videoRef.current) {
            videoRef.current.volume = newVolume / 100;
        }
    };

    const handleSeek = (e) => {
        const video = videoRef.current;
        if (video && duration) {
            const rect = e.currentTarget.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const newTime = (clickX / rect.width) * duration;
            video.currentTime = newTime;
            setCurrentTime(newTime);
        }
    };

    const changePlaybackRate = (rate) => {
        if (videoRef.current) {
            videoRef.current.playbackRate = rate;
            setPlaybackRate(rate);
        }
    };

    const toggleFullscreen = () => {
        const video = videoRef.current;
        if (video) {
            if (!isFullscreen) {
                video.requestFullscreen?.() || video.webkitRequestFullscreen?.();
            } else {
                document.exitFullscreen?.() || document.webkitExitFullscreen?.();
            }
            setIsFullscreen(!isFullscreen);
        }
    };

    const handleLike = async () => {
        if (!token) {
            toast?.warning('Connexion requise', 'Vous devez être connecté pour aimer un clip');
            return;
        }

        try {
            const response = await fetch(`/api/clips/${id}/like`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            });

            const result = await response.json();

            if (response.ok) {
                setIsLiked(result.is_liked);
                setLikesCount(result.likes_count);
                toast?.success('Succès', result.message);
            } else {
                throw new Error(result.message || 'Erreur lors du like');
            }
        } catch (error) {
            console.error('Erreur lors du like:', error);
            toast?.error('Erreur', error.message || 'Impossible de liker le clip');
        }
    };

    const handleBookmark = async () => {
        if (!token) {
            toast?.warning('Connexion requise', 'Vous devez être connecté pour sauvegarder');
            return;
        }

        try {
            const response = await fetch(`/api/clips/${id}/bookmark`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            });

            const result = await response.json();

            if (response.ok) {
                setIsBookmarked(result.is_bookmarked);
                toast?.success('Succès', result.message);
            } else {
                throw new Error(result.message || 'Erreur lors de la sauvegarde');
            }
        } catch (error) {
            console.error('Erreur lors de la sauvegarde:', error);
            toast?.error('Erreur', error.message || 'Impossible de sauvegarder');
        }
    };

    const handleFollow = async () => {
        if (!token) {
            toast?.warning('Connexion requise', 'Vous devez être connecté pour suivre un artiste');
            return;
        }

        try {
            const response = await fetch(`/api/artists/${clip.user.id}/follow`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            });

            const result = await response.json();

            if (response.ok) {
                setIsFollowing(result.is_following);
                toast?.success('Succès', result.message);
            } else {
                throw new Error(result.message || 'Erreur lors du suivi');
            }
        } catch (error) {
            console.error('Erreur lors du suivi:', error);
            toast?.error('Erreur', error.message || 'Impossible de suivre');
        }
    };

    const handleShare = async () => {
        try {
            // Copier directement le lien sans faire d'appel API
            const shareUrl = `${window.location.origin}/clips/${id}`;
            await navigator.clipboard.writeText(shareUrl);

            toast?.success('Lien copié', 'Le lien du clip a été copié dans le presse-papiers');
            setShowShareModal(true);

            // Optionnel : incrémenter le compteur de partages si l'utilisateur est connecté
            if (token) {
                try {
                    const response = await fetch(`/api/clips/${id}/share`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Accept': 'application/json'
                        }
                    });
                    // Ignorer les erreurs de cette API optionnelle
                } catch (error) {
                    // Silencieux - le partage a déjà fonctionné
                }
            }
        } catch (error) {
            console.error('Erreur lors du partage:', error);
            // Fallback si clipboard ne fonctionne pas
            setShowShareModal(true);
            toast?.info('Partage', 'Utilisez les boutons ci-dessous pour partager');
        }
    };

    const handleDownload = () => {
        if (!clip?.video_url) return;

        const link = document.createElement('a');
        link.href = clip.video_url;
        link.download = `${clip.title}.mp4`;
        link.click();

        toast?.info('Téléchargement', 'Le téléchargement va commencer...');
    };

    const handleAddComment = async () => {
        if (!token) {
            toast?.warning('Connexion requise', 'Vous devez être connecté pour commenter');
            return;
        }

        if (!newComment.trim()) {
            toast?.warning('Commentaire vide', 'Veuillez saisir un commentaire');
            return;
        }

        try {
            const response = await fetch(`/api/clips/${id}/comments`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    content: newComment
                })
            });

            const result = await response.json();

            if (response.ok) {
                const newCommentObj = {
                    id: result.comment?.id || Date.now(),
                    user: {
                        id: user?.id || 999,
                        name: user?.name || 'Utilisateur',
                        avatar_url: user?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=667eea&color=fff`
                    },
                    content: newComment,
                    likes: 0,
                    is_liked: false,
                    replies_count: 0,
                    replies: [],
                    created_at: new Date().toISOString(),
                };

                setComments(prev => [newCommentObj, ...prev]);
                setNewComment('');
                toast?.success('Commentaire ajouté', 'Votre commentaire a été publié');
            } else {
                throw new Error(result.message || 'Erreur lors de l\'ajout du commentaire');
            }
        } catch (error) {
            console.error('Erreur commentaire:', error);
            toast?.error('Erreur', error.message || 'Impossible d\'ajouter le commentaire');
        }
    };

    const handleReplyToComment = async (commentId, parentId = null, replyToUser = null) => {
        if (!token) {
            toast?.warning('Connexion requise', 'Vous devez être connecté pour répondre');
            return;
        }

        if (!replyText.trim()) {
            toast?.warning('Réponse vide', 'Veuillez saisir une réponse');
            return;
        }

        try {
            // Nettoyer le texte pour enlever les tags existants
            let cleanReplyText = replyText;
            if (replyToUser && replyText.startsWith(`@${replyToUser.name} `)) {
                cleanReplyText = replyText.substring(`@${replyToUser.name} `.length);
            }

            const response = await fetch(`/api/clips/${id}/comments`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    content: cleanReplyText,
                    parent_id: parentId || commentId,
                    reply_to_user_id: replyToUser?.id
                })
            });

            const result = await response.json();

            if (response.ok) {
                const reply = {
                    id: result.comment?.id || Date.now(),
                    user: {
                        id: user?.id || 999,
                        name: user?.name || 'Utilisateur',
                        avatar_url: user?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=667eea&color=fff`
                    },
                    content: cleanReplyText,
                    reply_to_user: replyToUser,
                    likes: 0,
                    is_liked: false,
                    created_at: new Date().toISOString()
                };

                setComments(prev => prev.map(comment => {
                    if (comment.id === (parentId || commentId)) {
                        return {
                            ...comment,
                            replies: [...(comment.replies || []), reply],
                            replies_count: (comment.replies_count || 0) + 1
                        };
                    }
                    return comment;
                }));

                setReplyText('');
                setReplyingTo(null);
                toast?.success('Réponse ajoutée', 'Votre réponse a été publiée');
            } else {
                throw new Error(result.message || 'Erreur lors de l\'ajout de la réponse');
            }
        } catch (error) {
            console.error('Erreur réponse:', error);
            toast?.error('Erreur', error.message || 'Impossible d\'ajouter la réponse');
        }
    };

    const startReply = (commentId, parentId = null, user = null) => {
        setReplyingTo({ commentId, parentId, replyToUser: user });
        if (user) {
            setReplyText(`@${user.name} `);
        } else {
            setReplyText('');
        }
    };

    const handleLikeComment = async (commentId, isReply = false, parentId = null) => {
        if (!token) {
            toast?.warning('Connexion requise', 'Vous devez être connecté pour liker');
            return;
        }

        try {
            const response = await fetch(`/api/comments/${commentId}/like`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            });

            const result = await response.json();

            if (response.ok) {
                if (isReply) {
                    setComments(prev => prev.map(comment => {
                        if (comment.id === parentId) {
                            return {
                                ...comment,
                                replies: comment.replies.map(reply => {
                                    if (reply.id === commentId) {
                                        return {
                                            ...reply,
                                            is_liked: result.is_liked,
                                            likes: result.likes_count
                                        };
                                    }
                                    return reply;
                                })
                            };
                        }
                        return comment;
                    }));
                } else {
                    setComments(prev => prev.map(comment => {
                        if (comment.id === commentId) {
                            return {
                                ...comment,
                                is_liked: result.is_liked,
                                likes: result.likes_count
                            };
                        }
                        return comment;
                    }));
                }
            } else {
                throw new Error(result.message || 'Erreur lors du like');
            }
        } catch (error) {
            console.error('Erreur like commentaire:', error);
            toast?.error('Erreur', error.message || 'Impossible de liker le commentaire');
        }
    };

    const getRewardBadge = (views) => {
        if (views >= 1000000) {
            return { type: 'Diamant', icon: faCrown, color: 'primary', bgColor: 'linear-gradient(45deg, #b9f2ff, #00d4ff)' };
        } else if (views >= 500000) {
            return { type: 'Platine', icon: faTrophy, color: 'secondary', bgColor: 'linear-gradient(45deg, #e8e8e8, #c0c0c0)' };
        } else if (views >= 100000) {
            return { type: 'Or', icon: faAward, color: 'warning', bgColor: 'linear-gradient(45deg, #ffd700, #ffed4e)' };
        } else if (views >= 50000) {
            return { type: 'Argent', icon: faStar, color: 'light', bgColor: 'linear-gradient(45deg, #f8f9fa, #e9ecef)' };
        } else if (views >= 10000) {
            return { type: 'Bronze', icon: faTrophy, color: 'warning', bgColor: 'linear-gradient(45deg, #cd7f32, #b8860b)' };
        }
        return null;
    };

    const formatViews = (views) => {
        if (views >= 1000000) {
            return `${(views / 1000000).toFixed(1)}M`;
        } else if (views >= 1000) {
            return `${(views / 1000).toFixed(1)}K`;
        }
        return views?.toString() || '0';
    };

    const formatTime = (time) => {
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
            return 'Il y a 1 jour';
        } else if (diffDays < 7) {
            return `Il y a ${diffDays} jours`;
        } else if (diffDays < 30) {
            const weeks = Math.floor(diffDays / 7);
            return `Il y a ${weeks} semaine${weeks > 1 ? 's' : ''}`;
        } else {
            return date.toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            });
        }
    };

    const sortComments = (comments, sortBy) => {
        switch (sortBy) {
            case 'popular':
                return [...comments].sort((a, b) => b.likes - a.likes);
            case 'oldest':
                return [...comments].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
            case 'recent':
            default:
                return [...comments].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        }
    };

    const filterComments = (comments, filter) => {
        switch (filter) {
            case 'liked':
                return comments.filter(comment => comment.is_liked);
            case 'replies':
                return comments.filter(comment => comment.replies_count > 0);
            case 'all':
            default:
                return comments;
        }
    };

    const toggleRepliesVisibility = (commentId) => {
        setExpandedComments(prev => {
            const newSet = new Set(prev);
            if (newSet.has(commentId)) {
                newSet.delete(commentId);
            } else {
                newSet.add(commentId);
            }
            return newSet;
        });
    };

    if (loading) {
        return (
            <div className="min-vh-100 bg-light avoid-header-overlap d-flex align-items-center justify-content-center">
                <div className="text-center">
                    <Spinner animation="border" variant="primary" style={{ width: '3rem', height: '3rem' }} />
                    <h5 className="mt-3 text-muted">Chargement du clip...</h5>
                </div>
            </div>
        );
    }

    if (!clip) {
        return (
            <Container className="py-5 text-center">
                <Alert variant="danger">
                    <h3>Clip non trouvé</h3>
                    <p>Le clip que vous recherchez n'existe pas ou a été supprimé.</p>
                    <Button as={Link} to="/clips" variant="primary">
                        Retour aux clips
                    </Button>
                </Alert>
            </Container>
        );
    }

    const reward = getRewardBadge(clip.views);
    const sortedComments = sortComments(filterComments(comments, commentsFilter), commentsSort);

    return (
        <div className="min-vh-100 bg-light avoid-header-overlap">
            <Container className="py-4">
                <AnimatedElement animation="slideInLeft" delay={100}>
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <Button
                            as={Link}
                            to="/clips"
                            variant="outline-primary"
                            className="d-flex align-items-center"
                        >
                            <FontAwesomeIcon icon={faArrowLeft} className="me-2" />
                            Retour aux clips
                        </Button>

                        <div className="d-flex align-items-center gap-3">
                            <Form.Check
                                type="switch"
                                id="autoplay-switch"
                                label="Lecture automatique"
                                checked={autoplay}
                                onChange={(e) => setAutoplay(e.target.checked)}
                            />
                        </div>
                    </div>
                </AnimatedElement>

                <Row className="g-4">
                    <Col lg={8}>
                        <AnimatedElement animation="slideInLeft" delay={200}>
                            <Card className="border-0 shadow-lg video-card">
                                <div
                                    className="video-container"
                                    onMouseEnter={() => setShowControls(true)}
                                    onMouseLeave={() => setShowControls(!isPlaying)}
                                >
                                    <video
                                        ref={videoRef}
                                        className="video-player"
                                        poster={clip.thumbnail_url || `/storage/clips/thumbnails/${clip.thumbnail_path?.split('/').pop()}`}
                                        onPlay={() => setIsPlaying(true)}
                                        onPause={() => setIsPlaying(false)}
                                        onClick={togglePlay}
                                    >
                                        <source src={clip.video_url || `/storage/clips/videos/${clip.video_path?.split('/').pop()}`} type="video/mp4" />
                                        Votre navigateur ne supporte pas la lecture vidéo.
                                    </video>

                                    {!isPlaying && (
                                        <div className="video-play-overlay" onClick={togglePlay}>
                                            <div className="play-button-large">
                                                <FontAwesomeIcon icon={faPlay} size="lg" />
                                            </div>
                                        </div>
                                    )}

                                    <div className={`video-controls ${showControls ? 'show' : ''}`}>
                                        <div className="progress-bar-container" onClick={handleSeek}>
                                            <div className="progress-bar">
                                                <div
                                                    className="progress-fill"
                                                    style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
                                                />
                                                <div
                                                    className="progress-handle"
                                                    style={{ left: `${duration ? (currentTime / duration) * 100 : 0}%` }}
                                                />
                                            </div>
                                        </div>

                                        <div className="controls-bottom">
                                            <div className="controls-left">
                                                <Button
                                                    variant="link"
                                                    className="control-btn"
                                                    onClick={togglePlay}
                                                >
                                                    <FontAwesomeIcon icon={isPlaying ? faPause : faPlay} size="sm" />
                                                </Button>

                                                <Button
                                                    variant="link"
                                                    className="control-btn"
                                                    onClick={toggleMute}
                                                >
                                                    <FontAwesomeIcon icon={isMuted ? faVolumeMute : faVolumeUp} size="sm" />
                                                </Button>

                                                <div className="volume-control">
                                                    <input
                                                        type="range"
                                                        min="0"
                                                        max="100"
                                                        value={volume}
                                                        onChange={handleVolumeChange}
                                                        className="volume-slider"
                                                    />
                                                </div>

                                                <span className="time-display">
                                                    {formatTime(currentTime)} / {formatTime(duration)}
                                                </span>
                                            </div>

                                            <div className="controls-center">
                                                <Dropdown>
                                                    <Dropdown.Toggle variant="link" className="control-btn">
                                                        {playbackRate}x
                                                    </Dropdown.Toggle>
                                                    <Dropdown.Menu>
                                                        {[0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].map(rate => (
                                                            <Dropdown.Item
                                                                key={rate}
                                                                onClick={() => changePlaybackRate(rate)}
                                                                active={playbackRate === rate}
                                                            >
                                                                {rate}x
                                                            </Dropdown.Item>
                                                        ))}
                                                    </Dropdown.Menu>
                                                </Dropdown>
                                            </div>

                                            <div className="controls-right">
                                                <Button
                                                    variant="link"
                                                    className="control-btn"
                                                    onClick={toggleFullscreen}
                                                >
                                                    <FontAwesomeIcon icon={isFullscreen ? faCompress : faExpand} size="sm" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </AnimatedElement>

                        <AnimatedElement animation="slideInUp" delay={300}>
                            <Card className="border-0 shadow-sm mt-4">
                                <Card.Body>
                                    <div className="d-flex justify-content-between align-items-start mb-3">
                                        <div className="flex-grow-1">
                                            <h1 className="h3 fw-bold mb-2">{clip.title}</h1>
                                            <div className="d-flex align-items-center gap-2 mb-2">
                                                <CategoryBadge category={clip.category} size="small" />
                                                {reward && (
                                                    <Badge
                                                        className="reward-badge-inline"
                                                        style={{ background: reward.bgColor, color: 'white' }}
                                                    >
                                                        <FontAwesomeIcon icon={reward.icon} className="me-1" />
                                                        {reward.type}
                                                    </Badge>
                                                )}
                                                {clip.featured && (
                                                    <Badge bg="danger">
                                                        <FontAwesomeIcon icon={faStar} className="me-1" />
                                                        Populaire
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="clip-stats mb-4">
                                        <Row className="g-2">
                                            <Col xs={6} md={3}>
                                                <div className="stat-item">
                                                    <FontAwesomeIcon icon={faEye} className="stat-icon text-primary" size="xs" />
                                                    <div>
                                                        <div className="stat-number">{formatViews(clip.views)}</div>
                                                        {/* <div className="stat-label">Vues</div> */}
                                                    </div>
                                                </div>
                                            </Col>
                                            <Col xs={6} md={3}>
                                                <div className="stat-item">
                                                    <FontAwesomeIcon icon={faThumbsUp} className="stat-icon text-success" size="xs" />
                                                    <div>
                                                        <div className="stat-number">{formatViews(likesCount)}</div>
                                                        {/* <div className="stat-label">J'aime</div> */}
                                                    </div>
                                                </div>
                                            </Col>
                                            <Col xs={6} md={3}>
                                                <div className="stat-item">
                                                    <FontAwesomeIcon icon={faComment} className="stat-icon text-info" size="xs" />
                                                    <div>
                                                        <div className="stat-number">{formatViews(clip.comments_count)}</div>
                                                        {/* <div className="stat-label">Commentaires</div> */}
                                                    </div>
                                                </div>
                                            </Col>
                                            <Col xs={6} md={3}>
                                                <div className="stat-item">
                                                    <FontAwesomeIcon icon={faShare} className="stat-icon text-warning" size="xs" />
                                                    <div>
                                                        <div className="stat-number">{formatViews(clip.shares)}</div>
                                                        {/* <div className="stat-label">Partages</div> */}
                                                    </div>
                                                </div>
                                            </Col>
                                        </Row>
                                    </div>

                                    <div className="action-buttons mb-4">
                                        <Row className="g-2">
                                            <Col xs={6} md={2}>
                                                <Button
                                                    variant={isLiked ? "success" : "outline-success"}
                                                    className="w-100 action-btn"
                                                    onClick={handleLike}
                                                    size="sm"
                                                >
                                                    <FontAwesomeIcon icon={faThumbsUp} className="me-1" size="xs" />
                                                    {isLiked ? 'Aimé' : 'J\'aime'}
                                                </Button>
                                            </Col>
                                            <Col xs={6} md={2}>
                                                <Button
                                                    variant={isBookmarked ? "primary" : "outline-primary"}
                                                    className="w-100 action-btn"
                                                    onClick={handleBookmark}
                                                    size="sm"
                                                >
                                                    <FontAwesomeIcon icon={faBookmark} className="me-1" size="xs" />
                                                    {isBookmarked ? 'Sauvé' : 'Sauver'}
                                                </Button>
                                            </Col>
                                            <Col xs={6} md={2}>
                                                <Button
                                                    variant="outline-info"
                                                    className="w-100 action-btn"
                                                    onClick={handleShare}
                                                    size="sm"
                                                >
                                                    <FontAwesomeIcon icon={faShare} className="me-1" size="xs" />
                                                    Partager
                                                </Button>
                                            </Col>
                                            <Col xs={6} md={2}>
                                                <Button
                                                    variant="outline-secondary"
                                                    className="w-100 action-btn"
                                                    onClick={handleDownload}
                                                    size="sm"
                                                >
                                                    <FontAwesomeIcon icon={faDownload} className="me-1" size="xs" />
                                                    Télécharger
                                                </Button>
                                            </Col>
                                            <Col xs={12} md={4}>
                                                <Button
                                                    variant="outline-danger"
                                                    className="w-100 action-btn"
                                                    size="sm"
                                                >
                                                    <FontAwesomeIcon icon={faFlag} className="me-1" size="xs" />
                                                    Signaler
                                                </Button>
                                            </Col>
                                        </Row>
                                    </div>

                                    <div className="description">
                                        <h6 className="fw-bold mb-2">Description</h6>
                                        <p className="text-muted">{clip.description}</p>
                                        <small className="text-secondary">
                                            Publié le {formatDate(clip.release_date)}
                                        </small>
                                    </div>

                                    {clip.tags && clip.tags.length > 0 && (
                                        <div className="mt-3">
                                            <h6 className="fw-bold mb-2">Tags</h6>
                                            <div className="d-flex flex-wrap gap-2">
                                                {clip.tags.map((tag, index) => (
                                                    <Badge key={index} bg="light" text="dark" className="tag-badge">
                                                        <FontAwesomeIcon icon={faTag} className="me-1" />
                                                        {tag}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </Card.Body>
                            </Card>
                        </AnimatedElement>

                        <AnimatedElement animation="slideInUp" delay={400}>
                            <Card className="border-0 shadow-sm mt-4">
                                <Card.Body>
                                    <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k)}>
                                        <Tab
                                            eventKey="comments"
                                            title={
                                                <span>
                                                    <FontAwesomeIcon icon={faComment} className="me-1" size="xs" />
                                                    Commentaires ({comments.length})
                                                </span>
                                            }
                                        >
                                            <div className="comments-controls mb-3">
                                                <Row className="g-2">
                                                    <Col md={6}>
                                                        <InputGroup size="sm">
                                                            <InputGroup.Text>
                                                                <FontAwesomeIcon icon={faSort} size="xs" />
                                                            </InputGroup.Text>
                                                            <Form.Select
                                                                value={commentsSort}
                                                                onChange={(e) => setCommentsSort(e.target.value)}
                                                            >
                                                                <option value="recent">Plus récents</option>
                                                                <option value="popular">Plus populaires</option>
                                                                <option value="oldest">Plus anciens</option>
                                                            </Form.Select>
                                                        </InputGroup>
                                                    </Col>
                                                    <Col md={6}>
                                                        <InputGroup size="sm">
                                                            <InputGroup.Text>
                                                                <FontAwesomeIcon icon={faFilter} size="xs" />
                                                            </InputGroup.Text>
                                                            <Form.Select
                                                                value={commentsFilter}
                                                                onChange={(e) => setCommentsFilter(e.target.value)}
                                                            >
                                                                <option value="all">Tous</option>
                                                                <option value="liked">Mes likes</option>
                                                                <option value="replies">Avec réponses</option>
                                                            </Form.Select>
                                                        </InputGroup>
                                                    </Col>
                                                </Row>
                                            </div>

                                            {token ? (
                                                <div className="mb-4">
                                                    <Form.Group>
                                                        <Form.Label className="fw-bold small">
                                                            <FontAwesomeIcon icon={faComment} className="me-1" size="xs" />
                                                            Ajouter un commentaire
                                                        </Form.Label>
                                                        <Form.Control
                                                            as="textarea"
                                                            rows={3}
                                                            placeholder="Partagez votre avis sur ce clip..."
                                                            value={newComment}
                                                            onChange={(e) => setNewComment(e.target.value)}
                                                            className="comment-textarea"
                                                        />
                                                    </Form.Group>
                                                    <div className="d-flex justify-content-between align-items-center mt-2">
                                                        <small className="text-muted">
                                                            {newComment.length}/500 caractères
                                                        </small>
                                                        <Button
                                                            variant="primary"
                                                            onClick={handleAddComment}
                                                            disabled={!newComment.trim()}
                                                            size="sm"
                                                        >
                                                            <FontAwesomeIcon icon={faPaperPlane} className="me-1" size="xs" />
                                                            Publier
                                                        </Button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <Alert variant="info" className="mb-4">
                                                    <FontAwesomeIcon icon={faUser} className="me-2" size="xs" />
                                                    <Link to="/login">Connectez-vous</Link> pour laisser un commentaire
                                                </Alert>
                                            )}

                                            <div className="comments-list">
                                                {commentsLoading ? (
                                                    <div className="text-center py-4">
                                                        <Spinner animation="border" variant="primary" />
                                                        <p className="mt-2 text-muted small">Chargement des commentaires...</p>
                                                    </div>
                                                ) : sortedComments.length === 0 ? (
                                                    <Alert variant="light" className="text-center">
                                                        <FontAwesomeIcon icon={faComment} size="lg" className="text-muted mb-2" />
                                                        <p className="mb-0">Aucun commentaire pour le moment. Soyez le premier à commenter !</p>
                                                    </Alert>
                                                ) : (
                                                    sortedComments.map((comment) => (
                                                        <div key={comment.id} className="comment-item">
                                                            <div className="d-flex">
                                                                <img
                                                                    src={comment.user.avatar_url}
                                                                    alt={comment.user.name}
                                                                    className="comment-avatar me-2"
                                                                />
                                                                <div className="flex-grow-1">
                                                                    <div className="comment-header mb-1">
                                                                        <span className="fw-bold small">{comment.user.name}</span>
                                                                        <small className="text-muted ms-2">
                                                                            {formatDate(comment.created_at)}
                                                                        </small>
                                                                    </div>
                                                                    <p className="comment-content mb-2 small">{comment.content}</p>
                                                                    <div className="comment-actions">
                                                                        <Button
                                                                            variant="link"
                                                                            size="sm"
                                                                            className="p-0 me-3 comment-action-btn"
                                                                            onClick={() => handleLikeComment(comment.id)}
                                                                        >
                                                                            <FontAwesomeIcon
                                                                                icon={faThumbsUp}
                                                                                className={comment.is_liked ? "text-primary" : "text-muted"}
                                                                                size="xs"
                                                                            />
                                                                            <span className="ms-1">{comment.likes}</span>
                                                                        </Button>
                                                                        <Button
                                                                            variant="link"
                                                                            size="sm"
                                                                            className="p-0 me-3 comment-action-btn"
                                                                            onClick={() => startReply(comment.id, null, comment.user)}
                                                                        >
                                                                            <FontAwesomeIcon icon={faReply} className="text-muted" size="xs" />
                                                                            <span className="ms-1">Répondre</span>
                                                                        </Button>
                                                                        {comment.replies_count > 0 && (
                                                                            <Button
                                                                                variant="link"
                                                                                size="sm"
                                                                                className="p-0 comment-action-btn"
                                                                                onClick={() => toggleRepliesVisibility(comment.id)}
                                                                            >
                                                                                <FontAwesomeIcon
                                                                                    icon={expandedComments.has(comment.id) ? faChevronUp : faChevronDown}
                                                                                    className="me-1"
                                                                                    size="xs"
                                                                                />
                                                                                <span className="text-primary">
                                                                                    {expandedComments.has(comment.id) ? 'Masquer' : 'Voir'} {comment.replies_count} réponse{comment.replies_count > 1 ? 's' : ''}
                                                                                </span>
                                                                            </Button>
                                                                        )}
                                                                    </div>

                                                                    {replyingTo?.commentId === comment.id && !replyingTo?.parentId && (
                                                                        <div className="reply-form mt-3">
                                                                            <Form.Control
                                                                                as="textarea"
                                                                                rows={2}
                                                                                placeholder={`Répondre à ${replyingTo.replyToUser?.name || 'ce commentaire'}...`}
                                                                                value={replyText}
                                                                                onChange={(e) => setReplyText(e.target.value)}
                                                                                className="mb-2"
                                                                            />
                                                                            <div className="d-flex gap-2">
                                                                                <Button
                                                                                    variant="primary"
                                                                                    size="sm"
                                                                                    onClick={() => handleReplyToComment(comment.id, null, replyingTo.replyToUser)}
                                                                                    disabled={!replyText.trim()}
                                                                                >
                                                                                    <FontAwesomeIcon icon={faPaperPlane} className="me-1" size="xs" />
                                                                                    Répondre
                                                                                </Button>
                                                                                <Button
                                                                                    variant="outline-secondary"
                                                                                    size="sm"
                                                                                    onClick={() => {
                                                                                        setReplyingTo(null);
                                                                                        setReplyText('');
                                                                                    }}
                                                                                >
                                                                                    Annuler
                                                                                </Button>
                                                                            </div>
                                                                        </div>
                                                                    )}

                                                                    {comment.replies && comment.replies.length > 0 && expandedComments.has(comment.id) && (
                                                                        <div className="replies mt-3">
                                                                            {comment.replies.map((reply) => (
                                                                                <div key={reply.id} className="reply-item">
                                                                                    <div className="d-flex">
                                                                                        <img
                                                                                            src={reply.user.avatar_url}
                                                                                            alt={reply.user.name}
                                                                                            className="reply-avatar me-2"
                                                                                        />
                                                                                        <div className="flex-grow-1">
                                                                                            <div className="reply-header mb-1">
                                                                                                <span className="fw-bold small">{reply.user.name}</span>
                                                                                                {reply.reply_to_user && (
                                                                                                    <span className="text-primary small ms-1">
                                                                                                        @{reply.reply_to_user.name}
                                                                                                    </span>
                                                                                                )}
                                                                                                <small className="text-muted ms-2">
                                                                                                    {formatDate(reply.created_at)}
                                                                                                </small>
                                                                                            </div>
                                                                                            <p className="reply-content small mb-1">{reply.content}</p>
                                                                                            <div className="reply-actions">
                                                                                                <Button
                                                                                                    variant="link"
                                                                                                    size="sm"
                                                                                                    className="p-0 me-3 comment-action-btn"
                                                                                                    onClick={() => handleLikeComment(reply.id, true, comment.id)}
                                                                                                >
                                                                                                    <FontAwesomeIcon
                                                                                                        icon={faThumbsUp}
                                                                                                        className={reply.is_liked ? "text-primary" : "text-muted"}
                                                                                                        size="xs"
                                                                                                    />
                                                                                                    <span className="ms-1">{reply.likes}</span>
                                                                                                </Button>
                                                                                                <Button
                                                                                                    variant="link"
                                                                                                    size="sm"
                                                                                                    className="p-0 comment-action-btn"
                                                                                                    onClick={() => startReply(reply.id, comment.id, reply.user)}
                                                                                                >
                                                                                                    <FontAwesomeIcon icon={faReply} className="text-muted" size="xs" />
                                                                                                    <span className="ms-1">Répondre</span>
                                                                                                </Button>
                                                                                            </div>

                                                                                            {replyingTo?.commentId === reply.id && replyingTo?.parentId === comment.id && (
                                                                                                <div className="reply-form mt-2">
                                                                                                    <Form.Control
                                                                                                        as="textarea"
                                                                                                        rows={2}
                                                                                                        placeholder={`Répondre à ${replyingTo.replyToUser?.name || 'cette réponse'}...`}
                                                                                                        value={replyText}
                                                                                                        onChange={(e) => setReplyText(e.target.value)}
                                                                                                        className="mb-2"
                                                                                                    />
                                                                                                    <div className="d-flex gap-2">
                                                                                                        <Button
                                                                                                            variant="primary"
                                                                                                            size="sm"
                                                                                                            onClick={() => handleReplyToComment(reply.id, comment.id, replyingTo.replyToUser)}
                                                                                                            disabled={!replyText.trim()}
                                                                                                        >
                                                                                                            <FontAwesomeIcon icon={faPaperPlane} className="me-1" size="xs" />
                                                                                                            Répondre
                                                                                                        </Button>
                                                                                                        <Button
                                                                                                            variant="outline-secondary"
                                                                                                            size="sm"
                                                                                                            onClick={() => {
                                                                                                                setReplyingTo(null);
                                                                                                                setReplyText('');
                                                                                                            }}
                                                                                                        >
                                                                                                            Annuler
                                                                                                        </Button>
                                                                                                    </div>
                                                                                                </div>
                                                                                            )}
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </Tab>

                                        <Tab
                                            eventKey="credits"
                                            title={
                                                <span>
                                                    <FontAwesomeIcon icon={faVideo} className="me-1" size="xs" />
                                                    Crédits
                                                </span>
                                            }
                                        >
                                            {clip.credits && Object.keys(clip.credits).length > 0 ? (
                                                <Row className="g-3">
                                                    {clip.credits.director && (
                                                        <Col md={6}>
                                                            <div className="credit-item">
                                                                <strong>Réalisateur :</strong>
                                                                <span className="ms-2">{clip.credits.director}</span>
                                                            </div>
                                                        </Col>
                                                    )}
                                                    {clip.credits.producer && (
                                                        <Col md={6}>
                                                            <div className="credit-item">
                                                                <strong>Producteur :</strong>
                                                                <span className="ms-2">{clip.credits.producer}</span>
                                                            </div>
                                                        </Col>
                                                    )}
                                                    {clip.credits.cinematographer && (
                                                        <Col md={6}>
                                                            <div className="credit-item">
                                                                <strong>Directeur photo :</strong>
                                                                <span className="ms-2">{clip.credits.cinematographer}</span>
                                                            </div>
                                                        </Col>
                                                    )}
                                                    {clip.credits.editor && (
                                                        <Col md={6}>
                                                            <div className="credit-item">
                                                                <strong>Monteur :</strong>
                                                                <span className="ms-2">{clip.credits.editor}</span>
                                                            </div>
                                                        </Col>
                                                    )}
                                                </Row>
                                            ) : (
                                                <Alert variant="light" className="text-center">
                                                    <FontAwesomeIcon icon={faVideo} size="2x" className="text-muted mb-2" />
                                                    <p className="mb-0">Aucun crédit disponible pour ce clip.</p>
                                                </Alert>
                                            )}
                                        </Tab>
                                    </Tabs>
                                </Card.Body>
                            </Card>
                        </AnimatedElement>
                    </Col>

                    <Col lg={4}>
                        <AnimatedElement animation="slideInRight" delay={200}>
                            <Card className="border-0 shadow-sm mb-4">
                                <Card.Body className="text-center">
                                    <img
                                        src={clip.user?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(clip.user?.name || 'Artiste')}&background=667eea&color=fff`}
                                        alt={clip.user?.name}
                                        className="artist-avatar mb-3"
                                    />
                                    <h5 className="fw-bold">{clip.user?.name}</h5>
                                    <p className="text-muted small mb-3">
                                        {clip.user?.role === 'artist' ? 'Artiste musical' : 'Créateur de contenu'}
                                    </p>
                                    <div className="d-grid gap-2">
                                        <Button
                                            as={Link}
                                            to={`/artists/${clip.user?.id}`}
                                            variant="primary"
                                        >
                                            <FontAwesomeIcon icon={faUser} className="me-1" size="xs" />
                                            Voir le profil
                                        </Button>
                                        <Button
                                            variant={isFollowing ? "success" : "outline-primary"}
                                            onClick={handleFollow}
                                        >
                                            <FontAwesomeIcon icon={isFollowing ? faUser : faUserPlus} className="me-1" size="xs" />
                                            {isFollowing ? 'Suivi' : 'Suivre'}
                                        </Button>
                                    </div>
                                </Card.Body>
                            </Card>
                        </AnimatedElement>

                        <AnimatedElement animation="slideInRight" delay={300}>
                            <Card className="border-0 shadow-sm">
                                <Card.Header className="bg-white border-0">
                                    <h6 className="fw-bold mb-0 small">
                                        <FontAwesomeIcon icon={faVideo} className="me-2" size="xs" />
                                        Clips similaires
                                    </h6>
                                </Card.Header>
                                <Card.Body className="p-0">
                                    {suggestionsLoading ? (
                                        <div className="text-center p-4">
                                            <Spinner animation="border" variant="primary" size="sm" />
                                            <p className="mt-2 mb-0 text-muted small">Chargement des suggestions...</p>
                                        </div>
                                    ) : relatedClips.length === 0 ? (
                                        <div className="text-center p-4">
                                            <FontAwesomeIcon icon={faVideo} size="2x" className="text-muted mb-2" />
                                            <p className="mb-0 text-muted small">Aucun clip similaire trouvé</p>
                                        </div>
                                    ) : (
                                        relatedClips.map((relatedClip) => (
                                            <div key={relatedClip.id} className="related-clip-item">
                                                <Link to={`/clips/${relatedClip.id}`} className="text-decoration-none">
                                                    <Row className="g-0">
                                                        <Col xs={4}>
                                                            <div className="related-thumbnail-container">
                                                                <img
                                                                    src={relatedClip.thumbnail_url || `/storage/clips/thumbnails/${relatedClip.thumbnail_path?.split('/').pop()}` || 'https://via.placeholder.com/120x68?text=Video'}
                                                                    alt={relatedClip.title}
                                                                    className="related-thumbnail"
                                                                />
                                                                <div className="related-duration">{relatedClip.duration}</div>
                                                                <div className="play-overlay-small">
                                                                    <FontAwesomeIcon icon={faPlay} />
                                                                </div>
                                                            </div>
                                                        </Col>
                                                        <Col xs={8}>
                                                            <div className="p-3">
                                                                <h6 className="mb-1 line-clamp-2 related-title">{relatedClip.title}</h6>
                                                                <small className="text-primary fw-bold">{relatedClip.user?.name}</small>
                                                                <div className="text-muted small mt-1">
                                                                    <FontAwesomeIcon icon={faEye} className="me-1" size="xs" />
                                                                    {formatViews(relatedClip.views)} vues
                                                                </div>
                                                                {relatedClip.score && (
                                                                    <div className="mt-1">
                                                                        <Badge bg="light" text="dark" size="sm">
                                                                            Pertinence: {Math.round(relatedClip.score)}%
                                                                        </Badge>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </Col>
                                                    </Row>
                                                </Link>
                                            </div>
                                        ))
                                    )}
                                </Card.Body>
                            </Card>
                        </AnimatedElement>
                    </Col>
                </Row>
            </Container>

            <Modal show={showShareModal} onHide={() => setShowShareModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>
                        <FontAwesomeIcon icon={faShare} className="me-2 text-primary" />
                        Partager le clip
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <div className="text-center mb-4">
                        <img
                            src={clip.thumbnail_url || `/storage/clips/thumbnails/${clip.thumbnail_path?.split('/').pop()}` || 'https://via.placeholder.com/300x200?text=Clip'}
                            alt={clip.title}
                            className="img-fluid rounded mb-3"
                            style={{ maxHeight: '200px' }}
                        />
                        <h6 className="fw-bold">{clip.title}</h6>
                        <small className="text-muted">par {clip.user?.name}</small>
                    </div>

                    <Form.Group className="mb-3">
                        <Form.Label>Lien du clip</Form.Label>
                        <InputGroup>
                            <Form.Control
                                type="text"
                                value={`${window.location.origin}/clips/${clip.id}`}
                                readOnly
                            />
                            <Button
                                variant="outline-secondary"
                                onClick={() => {
                                    navigator.clipboard.writeText(`${window.location.origin}/clips/${clip.id}`);
                                    toast?.success('Lien copié', 'Le lien a été copié dans le presse-papiers');
                                }}
                            >
                                Copier
                            </Button>
                        </InputGroup>
                    </Form.Group>

                    <div className="d-grid gap-2">
                        <Button variant="primary" href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.origin + '/clips/' + clip.id)}`} target="_blank">
                            Partager sur Facebook
                        </Button>
                        <Button variant="info" href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.origin + '/clips/' + clip.id)}&text=${encodeURIComponent(clip.title)}`} target="_blank">
                            Partager sur Twitter
                        </Button>
                        <Button variant="success" href={`https://wa.me/?text=${encodeURIComponent(clip.title + ' - ' + window.location.origin + '/clips/' + clip.id)}`} target="_blank">
                            Partager sur WhatsApp
                        </Button>
                    </div>
                </Modal.Body>
            </Modal>

            <style jsx>{`
                .bg-gradient-primary {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                }

                .video-card {
                    overflow: hidden;
                    border-radius: 12px;
                }

                .video-container {
                    position: relative;
                    background: #000;
                    border-radius: 12px;
                    overflow: hidden;
                }

                .video-player {
                    width: 100%;
                    height: auto;
                    max-height: 500px;
                    display: block;
                }

                .video-play-overlay {
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0,0,0,0.4);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: opacity 0.3s ease;
                }

                .play-button-large {
                    width: 80px;
                    height: 80px;
                    background: rgba(255,255,255,0.9);
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 2rem;
                    color: #667eea;
                    transform: scale(0.9);
                    transition: all 0.3s ease;
                }

                .video-play-overlay:hover .play-button-large {
                    transform: scale(1);
                    background: white;
                }

                .video-controls {
                    position: absolute;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    background: linear-gradient(transparent, rgba(0,0,0,0.8));
                    color: white;
                    padding: 20px 15px 15px;
                    opacity: 0;
                    transition: opacity 0.3s ease;
                }

                .video-controls.show {
                    opacity: 1;
                }

                .progress-bar-container {
                    margin-bottom: 10px;
                    cursor: pointer;
                    height: 20px;
                    display: flex;
                    align-items: center;
                }

                .progress-bar {
                    width: 100%;
                    height: 4px;
                    background: rgba(255,255,255,0.3);
                    border-radius: 2px;
                    overflow: hidden;
                    position: relative;
                }

                .progress-fill {
                    height: 100%;
                    background: #667eea;
                    transition: width 0.1s ease;
                }

                .progress-handle {
                    position: absolute;
                    top: -4px;
                    width: 12px;
                    height: 12px;
                    background: #667eea;
                    border-radius: 50%;
                    transform: translateX(-50%);
                    transition: left 0.1s ease;
                }

                .controls-bottom {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .controls-left, .controls-center, .controls-right {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }

                .control-btn {
                    color: white !important;
                    padding: 5px 10px;
                    font-size: 0.9rem;
                    border: none;
                    background: none;
                }

                .control-btn:hover {
                    color: #667eea !important;
                }

                .volume-control {
                    display: flex;
                    align-items: center;
                }

                .volume-slider {
                    width: 80px;
                    accent-color: #667eea;
                }

                .time-display {
                    font-size: 0.8rem;
                    min-width: 100px;
                    text-align: center;
                }

                .stat-item {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 12px 16px;
                    background: #f8f9fa;
                    border-radius: 8px;
                    transition: all 0.3s ease;
                    border: 1px solid #e9ecef;
                }

                .stat-item:hover {
                    background: #e9ecef;
                    transform: translateY(-1px);
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                }

                .stat-icon {
                    font-size: 1rem;
                }

                .stat-number {
                    font-weight: 600;
                    font-size: 1rem;
                    line-height: 1;
                    color: #212529;
                }

                .stat-label {
                    color: #6c757d;
                    font-size: 0.75rem;
                    margin-top: 2px;
                    font-weight: 500;
                }

                .action-btn {
                    transition: all 0.2s ease;
                    font-weight: 500;
                    font-size: 0.8rem;
                    padding: 8px 12px;
                    border-radius: 6px;
                }

                .action-btn:hover {
                    transform: translateY(-1px);
                    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
                }

                .comment-item {
                    padding: 16px 0;
                    border-bottom: 1px solid #f0f0f0;
                    transition: background 0.2s ease;
                }

                .comment-item:hover {
                    background: rgba(102, 126, 234, 0.02);
                }

                .comment-item:last-child {
                    border-bottom: none;
                }

                .comment-avatar {
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    object-fit: cover;
                    border: 1px solid #e9ecef;
                }

                .reply-avatar {
                    width: 28px;
                    height: 28px;
                    border-radius: 50%;
                    object-fit: cover;
                    border: 1px solid #e9ecef;
                }

                .comment-content {
                    line-height: 1.4;
                    font-size: 0.875rem;
                    color: #333;
                }

                .reply-content {
                    line-height: 1.3;
                    font-size: 0.8rem;
                    color: #333;
                }

                .comment-actions {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                }

                .comment-action-btn {
                    font-size: 0.75rem;
                    color: #6c757d;
                    text-decoration: none;
                    transition: color 0.2s ease;
                }

                .comment-action-btn:hover {
                    color: #667eea;
                    text-decoration: none;
                }

                .reply-form {
                    background: #f8f9fa;
                    padding: 12px;
                    border-radius: 6px;
                    border-left: 2px solid #667eea;
                }

                .replies {
                    border-left: 2px solid #e9ecef;
                    margin-left: 16px;
                    padding-left: 12px;
                }

                .reply-item {
                    padding: 8px 0;
                    border-bottom: 1px solid #f5f5f5;
                }

                .reply-item:last-child {
                    border-bottom: none;
                }

                .reply-actions {
                    margin-top: 4px;
                }

                .artist-avatar {
                    width: 80px;
                    height: 80px;
                    border-radius: 50%;
                    object-fit: cover;
                    border: 4px solid #fff;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                }

                .related-clip-item {
                    border-bottom: 1px solid #e9ecef;
                    transition: background 0.2s ease;
                }

                .related-clip-item:hover {
                    background: #f8f9fa;
                }

                .related-clip-item:last-child {
                    border-bottom: none;
                }

                .related-thumbnail-container {
                    position: relative;
                    aspect-ratio: 16/9;
                    overflow: hidden;
                    border-radius: 6px;
                }

                .related-thumbnail {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    transition: transform 0.3s ease;
                }

                .related-clip-item:hover .related-thumbnail {
                    transform: scale(1.05);
                }

                .related-duration {
                    position: absolute;
                    bottom: 4px;
                    right: 4px;
                    background: rgba(0,0,0,0.8);
                    color: white;
                    padding: 2px 6px;
                    border-radius: 3px;
                    font-size: 0.7rem;
                    font-weight: 500;
                }

                .play-overlay-small {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    width: 30px;
                    height: 30px;
                    background: rgba(255,255,255,0.9);
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    opacity: 0;
                    transition: opacity 0.3s ease;
                    color: #667eea;
                    font-size: 0.8rem;
                }

                .related-clip-item:hover .play-overlay-small {
                    opacity: 1;
                }

                .related-title {
                    font-size: 0.85rem;
                    font-weight: 600;
                    color: #333;
                    transition: color 0.2s ease;
                }

                .related-clip-item:hover .related-title {
                    color: #667eea;
                }

                .credit-item {
                    padding: 15px 0;
                    border-bottom: 1px solid #e9ecef;
                    font-size: 0.9rem;
                }

                .credit-item:last-child {
                    border-bottom: none;
                }

                .line-clamp-2 {
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                }

                .nav-tabs .nav-link {
                    border: none;
                    color: #6c757d;
                    font-weight: 500;
                    border-radius: 8px 8px 0 0;
                    padding: 12px 20px;
                }

                .nav-tabs .nav-link.active {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    border-radius: 8px 8px 0 0;
                }

                .nav-tabs .nav-link:hover:not(.active) {
                    background: #f8f9fa;
                }

                /* Responsive */
                @media (max-width: 768px) {
                    .video-player {
                        max-height: 300px;
                    }

                    .controls-left, .controls-center, .controls-right {
                        gap: 8px;
                    }

                    .volume-slider {
                        width: 60px;
                    }

                    .time-display {
                        font-size: 0.7rem;
                        min-width: 80px;
                    }

                    .stat-item {
                        padding: 15px 10px;
                    }

                    .stat-number {
                        font-size: 1rem;
                    }

                    .action-btn {
                        font-size: 0.8rem;
                        padding: 6px 12px;
                    }

                    .comment-avatar {
                        width: 35px;
                        height: 35px;
                    }

                    .reply-avatar {
                        width: 28px;
                        height: 28px;
                    }

                    .artist-avatar {
                        width: 60px;
                        height: 60px;
                    }
                }

                @media (max-width: 576px) {
                    .controls-center {
                        display: none;
                    }

                    .stat-item {
                        flex-direction: column;
                        text-align: center;
                        gap: 8px;
                    }

                    .replies {
                        margin-left: 10px;
                        padding-left: 10px;
                    }
                }
            `}</style>
        </div>
    );
};

export default ClipDetails;
