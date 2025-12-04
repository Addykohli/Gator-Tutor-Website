import React, { useState } from 'react';
import { format } from 'date-fns';
import Header from './Header';
import Footer from './Footer';

// Sample conversation data for development
const sampleConversations = [
  {
    id: 1,
    name: 'John Doe',
    avatar: 'https://randomuser.me/api/portraits/men/1.jpg',
    lastMessage: 'Hey, how are you doing?',
    time: '10:30 AM',
    unread: 2,
    messages: [
      { id: 1, text: 'Hey there!', sender: 'them', time: '10:25 AM' },
      { id: 2, text: 'How are you doing?', sender: 'them', time: '10:26 AM' },
      { id: 3, text: "I'm good, thanks! How about you?", sender: 'me', time: '10:30 AM' },
    ]
  },
  {
    id: 2,
    name: 'Study Group',
    avatar: 'https://randomuser.me/api/portraits/lego/2.jpg',
    lastMessage: 'Alice: Let\'s meet at the library',
    time: '9:15 AM',
    unread: 0,
    isGroup: true,
    messages: [
      { id: 1, text: 'Bob: Has everyone finished the assignment?', sender: 'them', senderName: 'Bob', time: '9:00 AM' },
      { id: 2, text: 'Yes, just submitted mine', sender: 'me', time: '9:05 AM' },
      { id: 3, text: "Let's meet at the library", sender: 'them', senderName: 'Alice', time: '9:15 AM' },
    ]
  },
  {
    id: 3,
    name: 'Sarah Wilson',
    avatar: 'https://randomuser.me/api/portraits/women/3.jpg',
    lastMessage: 'The meeting is at 2pm',
    time: 'Yesterday',
    unread: 0,
    messages: [
      { id: 1, text: 'Hi Sarah, when is our next meeting?', sender: 'me', time: 'Yesterday' },
      { id: 2, text: 'The meeting is at 2pm', sender: 'them', time: 'Yesterday' },
    ]
  },
];

const MessagesPage = () => {
  const [conversations, setConversations] = useState(sampleConversations);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');


  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const updatedConversations = conversations.map(conv => {
      if (conv.id === selectedConversation.id) {
        const newMsg = {
          id: conv.messages.length + 1,
          text: newMessage,
          sender: 'me',
          time: format(new Date(), 'h:mm a')
        };
        return {
          ...conv,
          lastMessage: newMessage,
          time: 'Just now',
          messages: [...conv.messages, newMsg]
        };
      }
      return conv;
    });

    setConversations(updatedConversations);
    setSelectedConversation(updatedConversations.find(c => c.id === selectedConversation.id));
    setNewMessage('');
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const updatedConversations = conversations.map(conv => {
      if (conv.id === selectedConversation.id) {
        const newMsg = {
          id: conv.messages.length + 1,
          file: {
            name: file.name,
            type: file.type,
            size: file.size,
            url: URL.createObjectURL(file)
          },
          sender: 'me',
          time: format(new Date(), 'h:mm a')
        };
        return {
          ...conv,
          lastMessage: 'Attachment: ' + file.name,
          time: 'Just now',
          messages: [...conv.messages, newMsg]
        };
      }
      return conv;
    });

    setConversations(updatedConversations);
    setSelectedConversation(updatedConversations.find(c => c.id === selectedConversation.id));
  };

  const filteredConversations = conversations.filter(conv =>
    conv.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header />
      <div style={{ ...styles.container, flex: 1 }}>
      <div style={styles.sidebar}>
        <div style={styles.sidebarHeader}>
          <h2 style={styles.sidebarTitle}>Messages</h2>
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
          {filteredConversations.map((conversation) => (
            <div
              key={conversation.id}
              style={{
                ...styles.conversationItem,
                backgroundColor: selectedConversation?.id === conversation.id ? '#f0f0f0' : 'white',
              }}
              onClick={() => setSelectedConversation(conversation)}
            >
              <img
                src={conversation.avatar}
                alt={conversation.name}
                style={styles.avatar}
              />
              <div style={styles.conversationInfo}>
                <div style={styles.conversationHeader}>
                  <h3 style={styles.conversationName}>{conversation.name}</h3>
                  <span style={styles.conversationTime}>{conversation.time}</span>
                </div>
                <p style={styles.conversationPreview}>
                  {conversation.lastMessage.length > 30
                    ? conversation.lastMessage.substring(0, 30) + '...'
                    : conversation.lastMessage}
                </p>
              </div>
              {conversation.unread > 0 && (
                <span style={styles.unreadBadge}>{conversation.unread}</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {selectedConversation ? (
        <div style={styles.chatContainer}>
          <div style={styles.chatHeader}>
            <button 
              style={styles.backButton}
              onClick={() => setSelectedConversation(null)}
            >
              <i className="fas fa-chevron-left" style={{ fontSize: '24px' }}></i>
            </button>
            <img
              src={selectedConversation.avatar}
              alt={selectedConversation.name}
              style={styles.chatAvatar}
            />
            <div>
              <h2 style={styles.chatName}>{selectedConversation.name}</h2>
              <p style={styles.chatStatus}>
                {selectedConversation.isGroup ? 'Group' : 'Online'}
              </p>
            </div>
          </div>

          <div style={styles.messagesContainer}>
            {selectedConversation.messages.map((message) => (
              <div
                key={message.id}
                style={{
                  ...styles.message,
                  alignSelf: message.sender === 'me' ? 'flex-end' : 'flex-start',
                  backgroundColor: message.sender === 'me' ? '#007AFF' : '#f0f0f0',
                  color: message.sender === 'me' ? 'white' : 'black',
                }}
              >
                {message.sender !== 'me' && selectedConversation.isGroup && (
                  <span style={styles.senderName}>
                    {message.senderName || selectedConversation.name}
                  </span>
                )}
                {message.text && <p style={styles.messageText}>{message.text}</p>}
                {message.file && (
                  <div style={styles.fileContainer}>
                    <div style={styles.fileIcon}>
                    <i className="fas fa-paperclip" style={{ fontSize: '24px' }}></i>
                  </div>
                    <div style={styles.fileInfo}>
                      <p style={styles.fileName}>{message.file.name}</p>
                      <p style={styles.fileSize}>
                        {Math.round(message.file.size / 1024)} KB
                      </p>
                    </div>
                    <a
                      href={message.file.url}
                      download
                      style={styles.downloadButton}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <i className="fas fa-download"></i>
                    </a>
                  </div>
                )}
                <span style={styles.messageTime}>
                  {message.time}
                </span>
              </div>
            ))}
          </div>

          <form onSubmit={handleSendMessage} style={styles.messageInputContainer}>
            <button type="button" style={styles.iconButton}>
              <i className="far fa-smile" style={{ fontSize: '24px', color: '#666' }}></i>
            </button>
            <div style={styles.attachmentContainer}>
              <input
                type="file"
                id="file-upload"
                style={{ display: 'none' }}
                onChange={handleFileUpload}
              />
              <label htmlFor="file-upload" style={styles.iconButton}>
                <i className="fas fa-paperclip" style={{ fontSize: '24px', color: '#666' }}></i>
              </label>
            </div>
            <input
              type="text"
              placeholder="Type a message..."
              style={styles.messageInput}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
            />
            <button type="submit" style={styles.sendButton}>
              <i className="fas fa-paper-plane" style={{ fontSize: '20px', color: 'white' }}></i>
            </button>
          </form>
        </div>
      ) : (
        <div style={styles.noChatSelected}>
          <h2>Select a conversation to start messaging</h2>
          <p>Or start a new conversation with a tutor or classmate</p>
        </div>
      )}
      </div>
      <Footer />
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    minHeight: 'calc(100vh - 160px)', 
    height: 'auto',
    backgroundColor: '#fff',
    borderRadius: '10px',
    overflow: 'hidden',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    margin: '20px', 
  },
  sidebar: {
    width: '350px',
    borderRight: '1px solid #e0e0e0',
    display: 'flex',
    flexDirection: 'column',
  },
  sidebarHeader: {
    padding: '20px',
    borderBottom: '1px solid #e0e0e0',
  },
  sidebarTitle: {
    margin: 0,
    fontSize: '24px',
    fontWeight: '600',
    color: '#333',
  },
  searchContainer: {
    padding: '15px',
    borderBottom: '1px solid #e0e0e0',
  },
  searchInput: {
    width: '100%',
    padding: '10px 15px',
    borderRadius: '20px',
    border: '1px solid #e0e0e0',
    outline: 'none',
    fontSize: '14px',
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
    '&:hover': {
      backgroundColor: '#f9f9f9',
    },
  },
  avatar: {
    width: '50px',
    height: '50px',
    borderRadius: '50%',
    marginRight: '15px',
    objectFit: 'cover',
  },
  conversationInfo: {
    flex: 1,
    minWidth: 0,
  },
  conversationHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '5px',
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
  conversationTime: {
    fontSize: '12px',
    color: '#999',
    marginLeft: '10px',
  },
  conversationPreview: {
    margin: 0,
    fontSize: '14px',
    color: '#666',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  unreadBadge: {
    backgroundColor: '#007AFF',
    color: 'white',
    borderRadius: '50%',
    width: '20px',
    height: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    fontWeight: '600',
    marginLeft: '10px',
  },
  chatContainer: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
  },
  chatHeader: {
    display: 'flex',
    alignItems: 'center',
    padding: '15px 20px',
    borderBottom: '1px solid #e0e0e0',
    backgroundColor: '#f9f9f9',
  },
  backButton: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    marginRight: '15px',
    display: 'none',
    '@media (max-width: 768px)': {
      display: 'block',
    },
  },
  chatAvatar: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    marginRight: '15px',
    objectFit: 'cover',
  },
  chatName: {
    margin: 0,
    fontSize: '16px',
    fontWeight: '600',
    color: '#333',
  },
  chatStatus: {
    margin: 0,
    fontSize: '12px',
    color: '#666',
  },
  messagesContainer: {
    flex: 1,
    padding: '20px',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
    backgroundColor: '#e5ddd5',
    backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'100\' height=\'100\' viewBox=\'0 0 100 100\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29-22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z\' fill=\'%239C92AC\' fill-opacity=\'0.1\' fill-rule=\'evenodd\'/%3E%3C/svg%3E")',
  },
  message: {
    maxWidth: '70%',
    padding: '10px 15px',
    borderRadius: '18px',
    position: 'relative',
    wordWrap: 'break-word',
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
  },
  senderName: {
    fontSize: '12px',
    fontWeight: '600',
    marginBottom: '4px',
    color: '#666',
  },
  messageText: {
    margin: '0',
    fontSize: '14px',
    lineHeight: '1.4',
  },
  messageTime: {
    fontSize: '10px',
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'right',
    marginTop: '4px',
    marginLeft: '10px',
    display: 'inline-block',
    float: 'right',
  },
  fileContainer: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: '8px',
    padding: '8px',
    marginTop: '8px',
  },
  fileIcon: {
    fontSize: '24px',
    marginRight: '10px',
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    margin: 0,
    fontSize: '14px',
    fontWeight: '500',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  fileSize: {
    margin: '2px 0 0',
    fontSize: '12px',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  downloadButton: {
    background: 'none',
    border: 'none',
    color: 'white',
    cursor: 'pointer',
    fontSize: '16px',
    marginLeft: '10px',
    padding: '5px',
  },
  messageInputContainer: {
    display: 'flex',
    alignItems: 'center',
    padding: '15px 20px',
    borderTop: '1px solid #e0e0e0',
    backgroundColor: '#f9f9f9',
  },
  iconButton: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '8px',
    margin: '0 5px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    '&:hover': {
      backgroundColor: '#f0f0f0',
    },
  },
  attachmentContainer: {
    position: 'relative',
  },
  messageInput: {
    flex: 1,
    padding: '12px 20px',
    borderRadius: '20px',
    border: '1px solid #e0e0e0',
    outline: 'none',
    fontSize: '14px',
    margin: '0 10px',
    '&:focus': {
      borderColor: '#007AFF',
    },
  },
  sendButton: {
    backgroundColor: '#007AFF',
    color: 'white',
    border: 'none',
    borderRadius: '50%',
    width: '40px',
    height: '40px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    '&:hover': {
      backgroundColor: '#0066CC',
    },
  },
  noChatSelected: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f9f9f9',
    color: '#999',
    textAlign: 'center',
    padding: '40px 20px',
    '& h2': {
      marginBottom: '10px',
      color: '#333',
    },
  },
};

export default MessagesPage;
