import { useForm } from 'react-hook-form';
import { useState, useEffect, useRef } from 'react';
import Header from './Header';
import Footer from './Footer';

const CHAT_API_BASE = window.location.hostname === 'localhost'
  ? 'http://localhost:8000'
  : '/api';

const userCache = {};

const fetchUserInfo = async (userId) => {
  if (userCache[userId]) return userCache[userId];
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
  const CURRENT_USER_ID = 1;
  const [chatPartners, setChatPartners] = useState([]);
  const [selectedPartnerId, setSelectedPartnerId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [allUsers, setAllUsers] = useState([]);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(false);
  const wsRef = useRef(null);
  const messagesEndRef = useRef(null);

  const { register, handleSubmit, reset, watch } = useForm();
  const messageValue = watch("message", "");

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const connectWebSocket = () => {
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsHost = window.location.hostname === 'localhost' ? 'localhost:8000' : window.location.host;
    const wsUrl = `${wsProtocol}//${wsHost}/api/chat/ws/${CURRENT_USER_ID}`;
    try {
      wsRef.current = new WebSocket(wsUrl);
      wsRef.current.onopen = () => {
        console.log('WebSocket connected');
        setWsConnected(true);
      };
      wsRef.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        setMessages(prev => [...prev, {
          message_id: data.message_id,
          sender_id: data.sender_id,
          receiver_id: data.receiver_id,
          content: data.content,
          created_at: data.created_at,
        }]);
      };
      wsRef.current.onclose = () => {
        console.log('WebSocket disconnected');
        setWsConnected(false);
        setTimeout(connectWebSocket, 3000);
      };
      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
    }
  };

  useEffect(() => {
    fetchChatPartners();
    connectWebSocket();
    return () => {
      if (wsRef.current) wsRef.current.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchChatPartners = async () => {
    try {
      const response = await fetch(`${CHAT_API_BASE}/api/chat/allchats/${CURRENT_USER_ID}`);
      if (response.ok) {
        const userIds = await response.json();
        const partners = await Promise.all(userIds.map(id => fetchUserInfo(id)));
        setChatPartners(partners);
      } else {
        setChatPartners([]);
      }
    } catch (error) {
      console.error('Error:', error);
      setChatPartners([]);
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
        setAllUsers(users.filter(u => u.user_id !== CURRENT_USER_ID).map(u => ({
          id: u.user_id,
          name: `${u.first_name} ${u.last_name}`,
          email: u.sfsu_email,
          role: u.role || 'User',
        })));
      } else {
        setAllUsers([]);
      }
    } catch (error) {
      console.error('Error:', error);
      setAllUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchMessages = async (partnerId) => {
    setMessagesLoading(true);
    try {
      const response = await fetch(`${CHAT_API_BASE}/api/chat/chatroomhistory/${CURRENT_USER_ID}/${partnerId}`);
      if (response.ok) {
        setMessages(await response.json());
      } else {
        setMessages([]);
      }
    } catch (error) {
      console.error('Error:', error);
      setMessages([]);
    } finally {
      setMessagesLoading(false);
    }
  };

  const handleSelectPartner = (partner) => {
    setSelectedPartnerId(partner.id);
    fetchMessages(partner.id);
  };

  const handleStartNewChat = (user) => {
    if (!chatPartners.find(p => p.id === user.id)) {
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

  const handleSendMessage = async (data) => {
    const content = data.message;
    if (!content?.trim() || !selectedPartnerId || sending) return;
    setSending(true);
    if (wsConnected && wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        receiver_id: selectedPartnerId,
        content: content,
      }));
      reset();
      setSending(false);
    } else {
      try {
        const response = await fetch(`${CHAT_API_BASE}/api/chat/send?user_id=${CURRENT_USER_ID}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            receiver_id: selectedPartnerId,
            content: content,
          }),
        });
        if (response.ok) {
          const sentMessage = await response.json();
          setMessages(prev => [...prev, sentMessage]);
          reset();
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setSending(false);
      }
    }
  };

  const selectedPartner = chatPartners.find(p => p.id === selectedPartnerId) || allUsers.find(u => u.id === selectedPartnerId);
  const filteredPartners = chatPartners.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
  const filteredUsers = allUsers.filter(u =>
    u.name.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(userSearchTerm.toLowerCase())
  );

  const formatTime = (d) => {
    if (!d) return '';
    return new Date(d).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const styles = {
    container: {
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh',
      backgroundColor: '#ffffff',
    },
    content: {
      display: 'flex',
      flex: 1,
      overflow: 'hidden',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    },
    sidebar: {
      width: '350px',
      borderRight: '1px solid #e0e0e0',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: '#fafafa',
    },
    sidebarHeader: {
      padding: '20px',
      borderBottom: '1px solid #e0e0e0',
      backgroundColor: '#35006D',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    sidebarHeaderLeft: {
      display: 'flex',
      flexDirection: 'column',
    },
    sidebarTitle: {
      margin: 0,
      fontSize: '24px',
      fontWeight: '600',
      color: '#ffffff',
    },
    connectionStatus: {
      fontSize: '12px',
      color: wsConnected ? '#90EE90' : '#FFB6C1',
      marginTop: '5px',
    },
    newChatButton: {
      backgroundColor: '#FFCF01',
      color: '#35006D',
      border: 'none',
      borderRadius: '50%',
      width: '40px',
      height: '40px',
      fontSize: '24px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontWeight: 'bold',
    },
    searchContainer: {
      padding: '15px',
      borderBottom: '1px solid #e0e0e0',
    },
    searchInput: {
      width: '100%',
      padding: '10px 15px',
      borderRadius: '20px',
      border: '1px solid #ddd',
      outline: 'none',
      fontSize: '14px',
      boxSizing: 'border-box',
    },
    conversationList: {
      flex: 1,
      overflowY: 'auto',
    },
    conversationItem: {
      display: 'flex',
      alignItems: 'center',
      padding: '15px',
      borderBottom: '1px solid #f0f0f0',
      cursor: 'pointer',
      transition: 'background-color 0.2s',
    },
    conversationItemSelected: {
      display: 'flex',
      alignItems: 'center',
      padding: '15px',
      borderBottom: '1px solid #f0f0f0',
      cursor: 'pointer',
      backgroundColor: '#e8d4f0',
      borderLeft: '4px solid #35006D',
    },
    avatar: {
      width: '50px',
      height: '50px',
      borderRadius: '50%',
      marginRight: '15px',
      backgroundColor: '#35006D',
      color: '#fff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '20px',
      fontWeight: '600',
    },
    conversationInfo: {
      flex: 1,
      minWidth: 0,
    },
    conversationName: {
      margin: 0,
      fontSize: '16px',
      fontWeight: '600',
      color: '#333',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
    },
    conversationRole: {
      margin: 0,
      fontSize: '13px',
      color: '#666',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
    },
    chatContainer: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: '#fff',
    },
    chatHeader: {
      display: 'flex',
      alignItems: 'center',
      padding: '15px 20px',
      borderBottom: '1px solid #e0e0e0',
      backgroundColor: '#f9f9f9',
    },
    chatAvatar: {
      width: '45px',
      height: '45px',
      borderRadius: '50%',
      marginRight: '15px',
      backgroundColor: '#35006D',
      color: '#fff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '18px',
      fontWeight: '600',
    },
    chatName: {
      margin: 0,
      fontSize: '18px',
      fontWeight: '600',
      color: '#333',
    },
    chatStatus: {
      margin: 0,
      fontSize: '13px',
      color: '#666',
    },
    messagesContainer: {
      flex: 1,
      padding: '20px',
      overflowY: 'auto',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      backgroundColor: '#f5f5f5',
    },
    messageMe: {
      alignSelf: 'flex-end',
      backgroundColor: '#35006D',
      color: '#fff',
      padding: '12px 16px',
      borderRadius: '18px 18px 4px 18px',
      maxWidth: '70%',
      wordWrap: 'break-word',
    },
    messageThem: {
      alignSelf: 'flex-start',
      backgroundColor: '#fff',
      color: '#333',
      padding: '12px 16px',
      borderRadius: '18px 18px 18px 4px',
      maxWidth: '70%',
      wordWrap: 'break-word',
      boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
    },
    messageText: {
      margin: 0,
      fontSize: '15px',
      lineHeight: '1.4',
    },
    messageTime: {
      fontSize: '11px',
      opacity: 0.7,
      marginTop: '6px',
      textAlign: 'right',
    },
    messageInputContainer: {
      display: 'flex',
      alignItems: 'center',
      padding: '15px 20px',
      borderTop: '1px solid #e0e0e0',
      backgroundColor: '#fff',
      gap: '12px',
    },
    messageInput: {
      flex: 1,
      padding: '12px 18px',
      borderRadius: '24px',
      border: '1px solid #ddd',
      outline: 'none',
      fontSize: '15px',
      fontFamily: 'inherit',
    },
    sendButton: {
      width: '48px',
      height: '48px',
      borderRadius: '50%',
      border: 'none',
      backgroundColor: '#35006D',
      color: '#fff',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '18px',
    },
    sendButtonDisabled: {
      width: '48px',
      height: '48px',
      borderRadius: '50%',
      border: 'none',
      backgroundColor: '#ccc',
      color: '#fff',
      cursor: 'not-allowed',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '18px',
    },
    noChatSelected: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#666',
      backgroundColor: '#f9f9f9',
    },
    noChatTitle: {
      fontSize: '24px',
      fontWeight: '600',
      color: '#35006D',
      marginBottom: '10px',
    },
    noChatText: {
      fontSize: '16px',
      color: '#888',
    },
    loadingContainer: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px',
      color: '#666',
    },
    emptyChats: {
      padding: '40px 20px',
      textAlign: 'center',
      color: '#666',
    },
    modalOverlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    },
    modal: {
      backgroundColor: '#fff',
      borderRadius: '12px',
      width: '450px',
      maxHeight: '70vh',
      display: 'flex',
      flexDirection: 'column',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
    },
    modalHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '20px',
      borderBottom: '1px solid #e0e0e0',
      backgroundColor: '#35006D',
      borderRadius: '12px 12px 0 0',
    },
    modalTitle: {
      margin: 0,
      fontSize: '20px',
      fontWeight: '600',
      color: '#ffffff',
    },
    modalCloseButton: {
      backgroundColor: 'transparent',
      border: 'none',
      color: '#ffffff',
      fontSize: '24px',
      cursor: 'pointer',
      padding: '0',
      lineHeight: '1',
    },
    modalSearchContainer: {
      padding: '15px 20px',
      borderBottom: '1px solid #e0e0e0',
    },
    modalSearchInput: {
      width: '100%',
      padding: '12px 16px',
      borderRadius: '8px',
      border: '1px solid #ddd',
      outline: 'none',
      fontSize: '15px',
      boxSizing: 'border-box',
    },
    modalUserList: {
      flex: 1,
      overflowY: 'auto',
      maxHeight: '400px',
    },
    modalUserItem: {
      display: 'flex',
      alignItems: 'center',
      padding: '15px 20px',
      borderBottom: '1px solid #f0f0f0',
      cursor: 'pointer',
      transition: 'background-color 0.2s',
    },
    modalUserAvatar: {
      width: '45px',
      height: '45px',
      borderRadius: '50%',
      marginRight: '15px',
      backgroundColor: '#35006D',
      color: '#fff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '16px',
      fontWeight: '600',
    },
    modalUserInfo: {
      flex: 1,
    },
    modalUserName: {
      margin: 0,
      fontSize: '15px',
      fontWeight: '600',
      color: '#333',
    },
    modalUserEmail: {
      margin: '2px 0 0 0',
      fontSize: '13px',
      color: '#666',
    },
    modalUserRole: {
      display: 'inline-block',
      marginTop: '4px',
      padding: '2px 8px',
      fontSize: '11px',
      fontWeight: '500',
      color: '#35006D',
      backgroundColor: '#f0e6f6',
      borderRadius: '10px',
    },
    emptyUsers: {
      padding: '40px 20px',
      textAlign: 'center',
      color: '#666',
    },
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingContainer}>Loading conversations...</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <Header />
      <div style={styles.content}>
        <div style={styles.sidebar}>
          <div style={styles.sidebarHeader}>
            <div style={styles.sidebarHeaderLeft}>
              <h2 style={styles.sidebarTitle}>Messages</h2>
              <div style={styles.connectionStatus}>
                {wsConnected ? 'Connected' : 'Connecting...'}
              </div>
            </div>
            <button
              style={styles.newChatButton}
              onClick={handleOpenNewChatModal}
              title="New Chat"
            >
              +
            </button>
          </div>
          <div style={styles.searchContainer}>
            <input
              type="text"
              placeholder="Search conversations..."
              style={styles.searchInput}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div style={styles.conversationList}>
            {filteredPartners.length === 0 ? (
              <div style={styles.emptyChats}>
                <p>No conversations yet</p>
                <p style={{ fontSize: '14px', color: '#999' }}>
                  Click the + button to start a new chat
                </p>
              </div>
            ) : (
              filteredPartners.map((partner) => (
                <div
                  key={partner.id}
                  style={selectedPartnerId === partner.id ? styles.conversationItemSelected : styles.conversationItem}
                  onClick={() => handleSelectPartner(partner)}
                >
                  <div style={styles.avatar}>
                    {getInitials(partner.name)}
                  </div>
                  <div style={styles.conversationInfo}>
                    <h3 style={styles.conversationName}>{partner.name}</h3>
                    <p style={styles.conversationRole}>{partner.role}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {selectedPartner ? (
          <div style={styles.chatContainer}>
            <div style={styles.chatHeader}>
              <div style={styles.chatAvatar}>
                {getInitials(selectedPartner.name)}
              </div>
              <div>
                <h2 style={styles.chatName}>{selectedPartner.name}</h2>
                <p style={styles.chatStatus}>{selectedPartner.role}</p>
              </div>
            </div>

            <div style={styles.messagesContainer}>
              {messagesLoading ? (
                <div style={styles.loadingContainer}>Loading messages...</div>
              ) : messages.length === 0 ? (
                <div style={styles.loadingContainer}>
                  No messages yet. Start the conversation!
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.message_id}
                    style={message.sender_id === CURRENT_USER_ID ? styles.messageMe : styles.messageThem}
                  >
                    <p style={styles.messageText}>{message.content}</p>
                    <div style={styles.messageTime}>{formatTime(message.created_at)}</div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSubmit(handleSendMessage)} style={styles.messageInputContainer}>
              <input
                type="text"
                placeholder="Type a message..."
                style={styles.messageInput}
                {...register("message")}
              />
              <button
                type="submit"
                style={!messageValue?.trim() || sending ? styles.sendButtonDisabled : styles.sendButton}
                disabled={!messageValue?.trim() || sending}
              >
                &#10148;
              </button>
            </form>
          </div>
        ) : (
          <div style={styles.noChatSelected}>
            <div style={styles.noChatTitle}>Select a Conversation</div>
            <p style={styles.noChatText}>Choose a conversation from the sidebar or click + to start a new chat</p>
          </div>
        )}
      </div>

      {showNewChatModal && (
        <div style={styles.modalOverlay} onClick={() => setShowNewChatModal(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Start New Chat</h3>
              <button
                style={styles.modalCloseButton}
                onClick={() => setShowNewChatModal(false)}
              >
                &times;
              </button>
            </div>
            <div style={styles.modalSearchContainer}>
              <input
                type="text"
                placeholder="Search by name or email..."
                style={styles.modalSearchInput}
                value={userSearchTerm}
                onChange={(e) => setUserSearchTerm(e.target.value)}
                autoFocus
              />
            </div>
            <div style={styles.modalUserList}>
              {loadingUsers ? (
                <div style={styles.loadingContainer}>Loading users...</div>
              ) : filteredUsers.length === 0 ? (
                <div style={styles.emptyUsers}>
                  {userSearchTerm ? 'No users found' : 'No users available'}
                </div>
              ) : (
                filteredUsers.map((user) => (
                  <div
                    key={user.id}
                    style={styles.modalUserItem}
                    onClick={() => handleStartNewChat(user)}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f5f0f8'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <div style={styles.modalUserAvatar}>
                      {getInitials(user.name)}
                    </div>
                    <div style={styles.modalUserInfo}>
                      <p style={styles.modalUserName}>{user.name}</p>
                      <p style={styles.modalUserEmail}>{user.email}</p>
                      <span style={styles.modalUserRole}>{user.role}</span>
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

export default MessagesPage;
