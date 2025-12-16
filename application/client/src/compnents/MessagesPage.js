
import { useState, useEffect, useRef } from 'react';
import Header from './Header';
import Footer from './Footer';
import { useAuth } from '../Context/Context';
import { getMediaUrl } from '../media_handling';

const CHAT_API_BASE = process.env.REACT_APP_API_URL ||
  (window.location.hostname === 'localhost' ? 'http://localhost:8000' : `http://${window.location.hostname}`);

const userCache = {};

const fetchUserInfo = async (userId) => {
  if (userCache[userId]) {
    return userCache[userId];
  }

  try {
    const response = await fetch(`${CHAT_API_BASE}/api/users/${userId}`);
    if (response.ok) {
      const userData = await response.json();
      const userInfo = {
        id: userData.user_id,
        name: `${userData.first_name} ${userData.last_name}`,
        email: userData.sfsu_email,
        role: userData.role || 'User',
      };
      userCache[userId] = userInfo;
      return userInfo;
    }
  } catch (error) {
    console.error(`Error fetching user ${userId}:`, error);
  }

  return { id: userId, name: `User ${userId}`, email: '', role: 'User' };
};

const MessagesPage = () => {
  const getLoggedInUserId = () => {
    try {
      const userData = localStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        const userId = user.user_id || user.id;
        if (userId) {
          return userId;
        }
      }
    } catch (error) {
      console.error('Error getting logged in user:', error);
    }
    return 1;
  };

  const [currentUserId, setCurrentUserId] = useState(getLoggedInUserId());
  const [chatPartners, setChatPartners] = useState([]);
  const [selectedPartnerId, setSelectedPartnerId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const [unreadPartners, setUnreadPartners] = useState({});

  const hasUnreadMessages = (partnerId) => {
    return unreadPartners[partnerId] === true;
  };
  const [partnerLastMessageTime, setPartnerLastMessageTime] = useState({});
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [allUsers, setAllUsers] = useState([]);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(false);

  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadingFile, setUploadingFile] = useState(false);

  // Dark mode and mobile responsiveness
  const { darkMode } = useAuth();
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [sidebarVisible, setSidebarVisible] = useState(true);

  const wsRef = useRef(null);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const fileInputRef = useRef(null);

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle window resize for mobile detection
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      // Auto-show sidebar on desktop, hide on mobile when a chat is selected
      if (!mobile) {
        setSidebarVisible(true);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const checkUserChange = () => {
      const newUserId = getLoggedInUserId();
      if (newUserId !== currentUserId) {
        setCurrentUserId(newUserId);
        setChatPartners([]);
        setMessages([]);
        setSelectedPartnerId(null);
        setLoading(true);

        if (wsRef.current) {
          wsRef.current.close();
        }
      }
    };

    window.addEventListener('storage', checkUserChange);
    const interval = setInterval(checkUserChange, 1000);

    return () => {
      window.removeEventListener('storage', checkUserChange);
      clearInterval(interval);
    };
  }, [currentUserId]);

  useEffect(() => {
    fetchChatPartners();
    connectWebSocket();

    // Restore selected partner from localStorage on mount/refresh
    const savedPartnerId = localStorage.getItem('selectedPartnerId');
    if (savedPartnerId) {
      const partnerId = parseInt(savedPartnerId, 10);
      setSelectedPartnerId(partnerId);
      fetchMessages(partnerId);
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [currentUserId]);

  const connectWebSocket = () => {
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsHost = window.location.hostname === 'localhost' ? 'localhost:8000' : window.location.host;
    const wsUrl = `${wsProtocol}//${wsHost}/api/chat/ws/${currentUserId}`;
    try {
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('WebSocket connected');
        setWsConnected(true);
      };

      wsRef.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.sender_id === selectedPartnerId || data.receiver_id === selectedPartnerId) {
          setMessages(prev => {
            const exists = prev.some(m => m.message_id === data.message_id);
            if (exists) return prev;
            return [...prev, {
              message_id: data.message_id,
              sender_id: data.sender_id,
              receiver_id: data.receiver_id,
              content: data.content,
              media_path: data.media_path || null,
              media_type: data.media_type || null,
              created_at: data.created_at,
            }];
          });
        }
      };

      wsRef.current.onclose = () => {
        setWsConnected(false);
        setTimeout(() => connectWebSocket(), 3000);
      };

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
    }
  };

  const fetchChatPartners = async () => {
    try {
      const response = await fetch(`${CHAT_API_BASE}/api/chat/allchats/${currentUserId}`);
      if (response.ok) {
        const userIds = await response.json();
        const partnersPromises = userIds.map(id => fetchUserInfo(id));
        const partners = await Promise.all(partnersPromises);

        const unreadStatus = {};
        const lastMsgTimes = {};

        for (const partner of partners) {
          try {
            const msgResponse = await fetch(`${CHAT_API_BASE}/api/chat/chatroomhistory/${currentUserId}/${partner.id}`);
            if (msgResponse.ok) {
              const msgs = await msgResponse.json();
              if (msgs.length > 0) {
                const lastMsg = msgs[msgs.length - 1];
                // Store timestamp for sorting
                lastMsgTimes[partner.id] = new Date(lastMsg.created_at).getTime();
                // Check for unread
                const hasUnread = msgs.some(
                  msg => msg.sender_id === partner.id && msg.is_read === false
                );
                unreadStatus[partner.id] = hasUnread;
              }
            }
          } catch (e) {
            console.error('Error fetching messages:', e);
          }
        }
        setPartnerLastMessageTime(lastMsgTimes);
        setUnreadPartners(unreadStatus);
        setChatPartners(partners);
      }
    } catch (error) {
      console.error('Error fetching chat partners:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllUsers = async () => {
    setLoadingUsers(true);
    try {
      const response = await fetch(`${CHAT_API_BASE}/api/users`);
      if (response.ok) {
        const users = await response.json();
        const formattedUsers = users
          .filter(u => u.user_id !== currentUserId)
          .map(u => ({
            id: u.user_id,
            name: `${u.first_name} ${u.last_name}`,
            email: u.sfsu_email,
            role: u.role || 'User',
          }));
        setAllUsers(formattedUsers);
      } else {
        setAllUsers([]);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setAllUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchMessages = async (partnerId) => {
    setMessagesLoading(true);
    try {
      const response = await fetch(`${CHAT_API_BASE}/api/chat/chatroomhistory/${currentUserId}/${partnerId}`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data);
      } else {
        setMessages([]);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      setMessages([]);
    } finally {
      setMessagesLoading(false);
    }
  };

  const handleSelectPartner = async (partner) => {
    setSelectedPartnerId(partner.id);
    setSending(false);
    fetchMessages(partner.id);

    // Save to localStorage for persistence across refreshes
    localStorage.setItem('selectedPartnerId', partner.id.toString());

    // Mark messages as read in the database
    try {
      await fetch(`${CHAT_API_BASE}/api/chat/messages/mark-read?receiver_id=${currentUserId}&sender_id=${partner.id}`, {
        method: 'PATCH',
      });
      // Update local unread status
      setUnreadPartners(prev => ({ ...prev, [partner.id]: false }));
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }

    // On mobile, hide sidebar when chat is selected
    if (isMobile) {
      setSidebarVisible(false);
    }
  };

  const handleStartNewChat = (user) => {
    const existingPartner = chatPartners.find(p => p.id === user.id);
    if (!existingPartner) {
      setChatPartners(prev => [user, ...prev]);
    }
    setSelectedPartnerId(user.id);
    setMessages([]);
    setShowNewChatModal(false);
    setUserSearchTerm('');
  };

  const handleOpenNewChatModal = () => {
    setShowNewChatModal(true);
    fetchAllUsers();
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      const maxSize = 10 * 1024 * 1024;
      if (file.size > maxSize) {
        alert('File size must be less than 10MB');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();

    if ((!newMessage.trim() && !selectedFile) || !selectedPartnerId || sending) {
      return;
    }

    setSending(true);

    try {
      if (selectedFile) {
        setUploadingFile(true);
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('receiver_id', selectedPartnerId);
        if (newMessage.trim()) {
          formData.append('content', newMessage);
        }

        const response = await fetch(`${CHAT_API_BASE}/api/chat/send-media?user_id=${currentUserId}`, {
          method: 'POST',
          body: formData,
        });

        if (response.ok) {
          const sentMessage = await response.json();
          setMessages(prev => [...prev, sentMessage]);
          setNewMessage('');
          setSelectedFile(null);
          // ADD THIS LINE:
          setPartnerLastMessageTime(prev => ({ ...prev, [selectedPartnerId]: Date.now() }));
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        } else {
          alert('Failed to send file. Please try again.');
        }
        setUploadingFile(false);
      } else {
        const messageContent = newMessage.trim();

        const tempMessage = {
          message_id: Date.now(),
          sender_id: currentUserId,
          receiver_id: selectedPartnerId,
          content: messageContent,
          media_path: null,
          media_type: null,
          created_at: new Date().toISOString(),
        };
        setMessages(prev => [...prev, tempMessage]);
        setNewMessage('');
        // ADD THIS LINE:
        setPartnerLastMessageTime(prev => ({ ...prev, [selectedPartnerId]: Date.now() }));

        if (wsConnected && wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({
            receiver_id: selectedPartnerId,
            content: messageContent,
          }));
        } else {
          const response = await fetch(`${CHAT_API_BASE}/api/chat/send?user_id=${currentUserId}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              receiver_id: selectedPartnerId,
              content: messageContent,
            }),
          });

          if (!response.ok) {
            console.error('Failed to send message');
          }
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const filteredPartners = chatPartners
    .filter(partner => partner.name.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => {
      // Sort by last message time (most recent first)
      const aTime = partnerLastMessageTime[a.id] || 0;
      const bTime = partnerLastMessageTime[b.id] || 0;
      return bTime - aTime;
    });

  const selectedPartner = chatPartners.find(p => p.id === selectedPartnerId) ||
    allUsers.find(u => u.id === selectedPartnerId);

  const filteredUsers = allUsers.filter(user =>
    user.name.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(userSearchTerm.toLowerCase())
  );

  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const renderMedia = (message) => {
    if (!message.media_path) return null;

    const mediaUrl = getMediaUrl(message.media_path);

    if (message.media_type?.startsWith('image/')) {
      return (
        <img
          src={mediaUrl}
          alt="Shared"
          style={styles.mediaImage}
          onClick={() => window.open(mediaUrl, '_blank')}
        />
      );
    } else if (message.media_type?.startsWith('video/')) {
      return (
        <video src={mediaUrl} controls style={styles.mediaVideo} />
      );
    } else if (message.media_type?.startsWith('audio/')) {
      return (
        <audio src={mediaUrl} controls style={styles.mediaAudio} />
      );
    } else {
      return (
        <a href={mediaUrl} target="_blank" rel="noopener noreferrer" style={styles.fileLink}>
          Download File
        </a>
      );
    }
  };

  // Hide sidebar when selecting a partner on mobile
  const handleSelectPartnerMobile = (partner) => {
    handleSelectPartner(partner);
    if (isMobile) {
      setSidebarVisible(false);
    }
  };

  const isButtonDisabled = (!newMessage.trim() && !selectedFile) || !selectedPartnerId || sending || uploadingFile;

  const styles = {
    container: {
      display: 'flex',
      height: isMobile ? 'calc(100vh - 60px)' : 'calc(100vh - 60px)',
      maxWidth: '1400px',
      margin: isMobile ? '0' : '0 auto',
      width: '100%',
      backgroundColor: darkMode ? '#1a1a1a' : '#fff',
      overflow: 'hidden',
      boxShadow: darkMode ? '0 2px 10px rgba(0,0,0,0.3)' : '0 2px 10px rgba(0,0,0,0.1)',
      position: 'relative',
    },
    sidebar: {
      width: isMobile ? (sidebarVisible ? '100%' : '0') : '280px',
      minWidth: isMobile ? (sidebarVisible ? '100%' : '0') : '280px',
      backgroundColor: darkMode ? '#2d2d2d' : '#35006D',
      color: '#fff',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      transition: 'all 0.3s ease',
      position: isMobile ? 'absolute' : 'relative',
      top: 0,
      left: 0,
      height: '100%',
      zIndex: isMobile ? 50 : 1,
    },
    sidebarHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '20px',
      borderBottom: '1px solid rgba(255,255,255,0.1)',
    },
    headerLeft: {
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
    },
    sidebarTitle: {
      margin: 0,
      fontSize: '20px',
    },
    newChatButton: {
      width: '36px',
      height: '36px',
      borderRadius: '50%',
      backgroundColor: '#FFCF01',
      color: '#35006D',
      border: 'none',
      fontSize: '24px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    searchInput: {
      margin: '10px 20px',
      padding: '10px 15px',
      borderRadius: '20px',
      border: 'none',
      fontSize: '14px',
      outline: 'none',
      backgroundColor: darkMode ? '#3d3d3d' : '#fff',
      color: darkMode ? '#fff' : '#333',
    },
    conversationList: {
      flex: 1,
      overflowY: 'auto',
      minHeight: 0, // Important for flex children with overflow
    },
    loadingContainer: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      color: darkMode ? '#888' : '#888',
    },
    emptyState: {
      textAlign: 'center',
      padding: '20px',
      color: 'rgba(255,255,255,0.6)',
      fontSize: '14px',
    },
    conversationItem: {
      display: 'flex',
      alignItems: 'center',
      padding: '15px 20px',
      cursor: 'pointer',
      borderLeft: '4px solid transparent',
      transition: 'background-color 0.2s',
    },
    avatar: {
      width: '45px',
      height: '45px',
      borderRadius: '50%',
      backgroundColor: '#FFCF01',
      color: '#35006D',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontWeight: 'bold',
      marginRight: '12px',
      fontSize: '14px',
      flexShrink: 0,
    },
    conversationInfo: {
      flex: 1,
    },
    conversationName: {
      margin: 0,
      fontSize: '15px',
    },
    conversationRole: {
      margin: '4px 0 0',
      fontSize: '12px',
      opacity: 0.7,
    },
    chatArea: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: darkMode ? '#1a1a1a' : '#fff',
    },
    chatHeader: {
      display: 'flex',
      alignItems: 'center',
      padding: isMobile ? '10px 15px' : '15px 20px',
      borderBottom: darkMode ? '1px solid #333' : '1px solid #eee',
      backgroundColor: darkMode ? '#2d2d2d' : '#fafafa',
    },
    chatAvatar: {
      width: '45px',
      height: '45px',
      borderRadius: '50%',
      backgroundColor: '#35006D',
      color: '#fff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontWeight: 'bold',
      marginRight: '12px',
      fontSize: '14px',
    },
    chatName: {
      margin: 0,
      fontSize: '16px',
      color: darkMode ? '#fff' : '#333',
    },
    chatStatus: {
      margin: '2px 0 0',
      fontSize: '13px',
      color: darkMode ? '#aaa' : '#888',
    },
    messagesContainer: {
      flex: 1,
      overflowY: 'auto',
      padding: isMobile ? '15px' : '20px',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: darkMode ? '#1a1a1a' : '#fff',
    },
    messageWrapper: {
      display: 'flex',
      marginBottom: '12px',
    },
    messageBubble: {
      maxWidth: isMobile ? '85%' : '70%',
      padding: '12px 16px',
      borderRadius: '18px',
    },
    messageText: {
      margin: 0,
      fontSize: '14px',
      lineHeight: '1.4',
    },
    messageTime: {
      display: 'block',
      fontSize: '11px',
      marginTop: '5px',
      textAlign: 'right',
    },
    inputContainer: {
      display: 'flex',
      alignItems: 'center',
      padding: isMobile ? '10px 15px' : '15px 20px',
      borderTop: darkMode ? '1px solid #333' : '1px solid #eee',
      backgroundColor: darkMode ? '#2d2d2d' : '#fafafa',
      gap: '10px',
    },
    attachButton: {
      width: '40px',
      height: '40px',
      borderRadius: '50%',
      backgroundColor: darkMode ? '#3d3d3d' : '#f0f0f0',
      border: 'none',
      fontSize: '18px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    filePreview: {
      display: 'flex',
      alignItems: 'center',
      backgroundColor: darkMode ? '#3d3d3d' : '#e8e8e8',
      padding: '5px 10px',
      borderRadius: '15px',
      maxWidth: '200px',
    },
    fileName: {
      fontSize: '12px',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      marginRight: '8px',
      color: darkMode ? '#fff' : '#333',
    },
    removeFileButton: {
      background: 'none',
      border: 'none',
      color: '#e74c3c',
      fontSize: '18px',
      cursor: 'pointer',
      padding: 0,
    },
    messageInput: {
      flex: 1,
      padding: '12px 20px',
      borderRadius: '25px',
      border: darkMode ? '1px solid #444' : '1px solid #ddd',
      fontSize: '14px',
      outline: 'none',
      backgroundColor: darkMode ? '#3d3d3d' : '#fff',
      color: darkMode ? '#fff' : '#333',
      minWidth: 0,
    },
    noChat: {
      flex: 1,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: darkMode ? '#888' : '#888',
      fontSize: '16px',
    },
    modalOverlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    },
    modal: {
      backgroundColor: darkMode ? '#2d2d2d' : '#fff',
      borderRadius: '12px',
      width: isMobile ? '95%' : '400px',
      maxHeight: '500px',
      display: 'flex',
      flexDirection: 'column',
    },
    modalHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '20px',
      borderBottom: darkMode ? '1px solid #444' : '1px solid #eee',
    },
    modalTitle: {
      margin: 0,
      fontSize: '18px',
      color: darkMode ? '#fff' : '#35006D',
    },
    closeButton: {
      background: 'none',
      border: 'none',
      fontSize: '24px',
      cursor: 'pointer',
      color: darkMode ? '#888' : '#888',
    },
    modalSearchInput: {
      margin: '15px 20px',
      padding: '10px 15px',
      borderRadius: '8px',
      border: darkMode ? '1px solid #444' : '1px solid #ddd',
      fontSize: '14px',
      outline: 'none',
      backgroundColor: darkMode ? '#3d3d3d' : '#fff',
      color: darkMode ? '#fff' : '#333',
    },
    userList: {
      flex: 1,
      overflowY: 'auto',
      padding: '0 10px 20px',
    },
    userItem: {
      display: 'flex',
      alignItems: 'center',
      padding: '12px 15px',
      cursor: 'pointer',
      borderRadius: '8px',
      marginBottom: '5px',
      transition: 'background-color 0.2s',
      backgroundColor: 'transparent',
    },
    userInfo: {
      flex: 1,
    },
    userName: {
      margin: 0,
      fontSize: '14px',
      fontWeight: '500',
      color: darkMode ? '#fff' : '#333',
    },
    userRole: {
      margin: '2px 0 0',
      fontSize: '12px',
      color: darkMode ? '#aaa' : '#888',
    },
    mediaImage: {
      maxWidth: '100%',
      borderRadius: '8px',
      marginTop: '8px',
      cursor: 'pointer',
    },
    mediaVideo: {
      maxWidth: '100%',
      borderRadius: '8px',
      marginTop: '8px',
    },
    mediaAudio: {
      width: '100%',
      marginTop: '8px',
    },
    fileLink: {
      color: '#35006D',
      textDecoration: 'underline',
      marginTop: '8px',
      display: 'inline-block',
    },
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header />
      <div style={styles.container}>
        <div style={styles.sidebar}>
          <div style={styles.sidebarHeader}>
            <div style={styles.headerLeft}>
              <h2 style={styles.sidebarTitle}>Messages</h2>
            </div>
            <button onClick={handleOpenNewChatModal} style={styles.newChatButton} data-testid="button-new-chat">+</button>
          </div>
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.searchInput}
            data-testid="input-search-conversations"
          />

          <div style={styles.conversationList}>
            {loading ? (
              <div style={styles.loadingContainer}>Loading...</div>
            ) : filteredPartners.length === 0 ? (
              <div style={styles.emptyState}>No conversations yet</div>
            ) : (
              filteredPartners.map((partner) => (
                <div
                  key={partner.id}
                  onClick={() => handleSelectPartnerMobile(partner)}
                  style={{
                    ...styles.conversationItem,
                    backgroundColor: selectedPartnerId === partner.id ? '#35006D' : 'transparent',
                  }}
                  data-testid={`conversation-item-${partner.id}`}
                >
                  <div style={styles.avatar}>{getInitials(partner.name)}</div>
                  <div style={styles.conversationInfo}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <h3 style={{
                        ...styles.conversationName,
                        fontWeight: hasUnreadMessages(partner.id) ? '700' : '500'
                      }}>
                        {partner.name}
                      </h3>
                      {hasUnreadMessages(partner.id) && (
                        <span style={{
                          width: '8px',
                          height: '8px',
                          backgroundColor: '#FFCF01',
                          borderRadius: '50%',
                          flexShrink: 0
                        }} />
                      )}
                    </div>
                    <p style={styles.conversationRole}>{partner.role}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div style={styles.chatArea}>
          {selectedPartner ? (
            <>
              <div style={styles.chatHeader}>
                {isMobile && (
                  <button
                    onClick={() => setSidebarVisible(true)}
                    style={{
                      background: 'none',
                      border: 'none',
                      fontSize: '20px',
                      cursor: 'pointer',
                      color: darkMode ? '#fff' : '#333',
                      marginRight: '10px',
                      padding: '5px'
                    }}
                  >
                    ☰
                  </button>
                )}
                <div style={styles.chatAvatar}>{getInitials(selectedPartner.name)}</div>
                <div>
                  <h2 style={styles.chatName}>{selectedPartner.name}</h2>
                  <p style={styles.chatStatus}>{selectedPartner.role}</p>
                </div>
              </div>

              <div style={styles.messagesContainer} ref={messagesContainerRef}>
                {messagesLoading ? (
                  <div style={styles.loadingContainer}>Loading messages...</div>
                ) : messages.length === 0 ? (
                  <div style={styles.loadingContainer}>No messages yet. Start the conversation!</div>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.message_id}
                      style={{
                        ...styles.messageWrapper,
                        justifyContent: message.sender_id === currentUserId ? 'flex-end' : 'flex-start',
                      }}
                      data-testid={`message-${message.message_id}`}
                    >
                      <div
                        style={{
                          ...styles.messageBubble,
                          backgroundColor: message.sender_id === currentUserId ? '#35006D' : '#f0f0f0',
                          color: message.sender_id === currentUserId ? '#fff' : '#333',
                        }}
                      >
                        {renderMedia(message)}
                        {message.content && <p style={styles.messageText}>{message.content}</p>}
                        <span style={{
                          ...styles.messageTime,
                          color: message.sender_id === currentUserId ? 'rgba(255,255,255,0.7)' : '#888',
                        }}>
                          {formatTime(message.created_at)}
                        </span>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              <form onSubmit={handleSendMessage} style={styles.inputContainer}>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                  accept="image/*,video/*,audio/*,.pdf,.doc,.docx"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  style={styles.attachButton}
                  data-testid="button-attach-file"
                >
                  📎
                </button>

                {selectedFile && (
                  <div style={styles.filePreview}>
                    <span style={styles.fileName}>{selectedFile.name}</span>
                    <button type="button" onClick={handleRemoveFile} style={styles.removeFileButton} data-testid="button-remove-file">×</button>
                  </div>
                )}

                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  style={styles.messageInput}
                  data-testid="input-message"
                />
                <button
                  type="submit"
                  disabled={isButtonDisabled}
                  style={{
                    ...styles.sendButton,
                    opacity: isButtonDisabled ? 0.5 : 1,
                    cursor: isButtonDisabled ? 'not-allowed' : 'pointer',
                  }}
                  data-testid="button-send-message"
                >
                  ➤
                </button>
              </form>
            </>
          ) : (
            <div style={styles.noChat}>Select a conversation to start messaging</div>
          )}
        </div>

        {showNewChatModal && (
          <div style={styles.modalOverlay} onClick={() => setShowNewChatModal(false)}>
            <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
              <div style={styles.modalHeader}>
                <h3 style={styles.modalTitle}>Start New Chat</h3>
                <button onClick={() => setShowNewChatModal(false)} style={styles.closeButton} data-testid="button-close-modal">×</button>
              </div>
              <input
                type="text"
                placeholder="Search users..."
                value={userSearchTerm}
                onChange={(e) => setUserSearchTerm(e.target.value)}
                style={styles.modalSearchInput}
                data-testid="input-search-users"
              />
              <div style={styles.userList}>
                {loadingUsers ? (
                  <div style={styles.loadingContainer}>Loading users...</div>
                ) : filteredUsers.length === 0 ? (
                  <div style={styles.emptyState}>No users found</div>
                ) : (
                  filteredUsers.map((user) => (
                    <div
                      key={user.id}
                      onClick={() => handleStartNewChat(user)}
                      style={styles.userItem}
                      data-testid={`user-item-${user.id}`}
                    >
                      <div style={styles.avatar}>{getInitials(user.name)}</div>
                      <div style={styles.userInfo}>
                        <h4 style={styles.userName}>{user.name}</h4>
                        <p style={styles.userRole}>{user.role}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

const styles = {
  pageContainer: {
    minHeight: '100vh',
    backgroundColor: '#f5f5f5',
  },
  container: {
    display: 'flex',
    height: 'calc(100vh - 80px)',
    maxWidth: '1400px',
    margin: '0px',
    backgroundColor: '#fff',
    overflow: 'hidden',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
  },
  sidebar: {
    width: '280px',
    backgroundColor: '#35006D',
    color: '#fff',
    display: 'flex',
    flexDirection: 'column',
  },
  sidebarHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px',
    borderBottom: '1px solid rgba(255,255,255,0.1)',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  backButton: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    backgroundColor: 'rgba(255,255,255,0.1)',
    color: '#fff',
    border: 'none',
    fontSize: '18px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background-color 0.2s',
  },
  sidebarTitle: {
    margin: 0,
    fontSize: '20px',
  },
  newChatButton: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    backgroundColor: '#FFCF01',
    color: '#35006D',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchInput: {
    margin: '10px 20px',
    padding: '10px 15px',
    borderRadius: '20px',
    border: 'none',
    fontSize: '14px',
    outline: 'none',
  },
  conversationList: {
    flex: 1,
    overflowY: 'auto',
  },
  conversationItem: {
    display: 'flex',
    alignItems: 'center',
    padding: '15px 20px',
    cursor: 'pointer',
    borderLeft: '4px solid transparent',
  },
  avatar: {
    width: '45px',
    height: '45px',
    borderRadius: '50%',
    backgroundColor: '#FFCF01',
    color: '#35006D',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
    marginRight: '12px',
    fontSize: '14px',
  },
  conversationInfo: {
    flex: 1,
  },
  conversationName: {
    margin: 0,
    fontSize: '15px',
    fontWeight: '500',
  },
  conversationRole: {
    margin: '4px 0 0',
    fontSize: '12px',
    opacity: 0.7,
  },
  chatArea: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#fff',
  },
  chatHeader: {
    display: 'flex',
    alignItems: 'center',
    padding: '15px 20px',
    borderBottom: '1px solid #eee',
    backgroundColor: '#fafafa',
  },
  chatAvatar: {
    width: '45px',
    height: '45px',
    borderRadius: '50%',
    backgroundColor: '#35006D',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
    marginRight: '12px',
    fontSize: '14px',
  },
  chatName: {
    margin: 0,
    fontSize: '16px',
    color: '#333',
  },
  chatStatus: {
    margin: '2px 0 0',
    fontSize: '13px',
    color: '#888',
  },
  messagesContainer: {
    flex: 1,
    overflowY: 'auto',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
  },
  loadingContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    color: '#888',
  },
  messageWrapper: {
    display: 'flex',
    marginBottom: '12px',
  },
  messageBubble: {
    maxWidth: '70%',
    padding: '12px 16px',
    borderRadius: '18px',
  },
  messageText: {
    margin: 0,
    fontSize: '14px',
    lineHeight: '1.4',
  },
  messageTime: {
    display: 'block',
    fontSize: '11px',
    marginTop: '5px',
    textAlign: 'right',
  },
  mediaImage: {
    maxWidth: '250px',
    maxHeight: '200px',
    borderRadius: '8px',
    cursor: 'pointer',
    marginBottom: '8px',
  },
  mediaVideo: {
    maxWidth: '250px',
    borderRadius: '8px',
    marginBottom: '8px',
  },
  mediaAudio: {
    maxWidth: '250px',
    marginBottom: '8px',
  },
  fileLink: {
    color: '#FFCF01',
    textDecoration: 'underline',
  },
  inputContainer: {
    display: 'flex',
    alignItems: 'center',
    padding: '15px 20px',
    borderTop: '1px solid #eee',
    backgroundColor: '#fafafa',
    gap: '10px',
  },
  attachButton: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    backgroundColor: '#f0f0f0',
    border: 'none',
    fontSize: '18px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filePreview: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#e8e8e8',
    padding: '5px 10px',
    borderRadius: '15px',
    maxWidth: '200px',
  },
  fileName: {
    fontSize: '12px',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    marginRight: '8px',
  },
  removeFileButton: {
    background: 'none',
    border: 'none',
    color: '#e74c3c',
    fontSize: '18px',
    cursor: 'pointer',
    padding: 0,
  },
  messageInput: {
    flex: 1,
    padding: '12px 20px',
    borderRadius: '25px',
    border: '1px solid #ddd',
    fontSize: '14px',
    outline: 'none',
  },
  sendButton: {
    width: '45px',
    height: '45px',
    borderRadius: '50%',
    backgroundColor: '#35006D',
    color: '#fff',
    border: 'none',
    fontSize: '18px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  noChat: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#888',
    fontSize: '16px',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modal: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    width: '400px',
    maxHeight: '500px',
    display: 'flex',
    flexDirection: 'column',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px',
    borderBottom: '1px solid #eee',
  },
  modalTitle: {
    margin: 0,
    fontSize: '18px',
    color: '#35006D',
  },
  closeButton: {
    background: 'none',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer',
    color: '#888',
  },
  modalSearchInput: {
    margin: '15px 20px',
    padding: '10px 15px',
    borderRadius: '8px',
    border: '1px solid #ddd',
    fontSize: '14px',
    outline: 'none',
  },
  userList: {
    flex: 1,
    overflowY: 'auto',
    padding: '0 10px 20px',
  },
  userItem: {
    display: 'flex',
    alignItems: 'center',
    padding: '12px 15px',
    cursor: 'pointer',
    borderRadius: '8px',
    marginBottom: '5px',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    margin: 0,
    fontSize: '14px',
    fontWeight: '500',
    color: '#333',
  },
  userRole: {
    margin: '2px 0 0',
    fontSize: '12px',
    color: '#888',
  },
  emptyState: {
    textAlign: 'center',
    padding: '20px',
    color: 'rgba(255,255,255,0.6)',
    fontSize: '14px',
  },
};

export default MessagesPage;
