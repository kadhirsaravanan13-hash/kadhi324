
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { User, Message, Chat, AuthState, ActiveTab, Story, Call, Group, Theme, PrivacySettings } from './types';
import Avatar from './components/Avatar';
import StoryCircle from './components/StoryCircle';
import { 
  SendIcon, 
  SmileIcon, 
  PaperclipIcon, 
  SearchIcon, 
  MoreVerticalIcon, 
  DoubleCheckIcon, 
  ArrowLeftIcon,
  PhoneIcon,
  VideoIcon,
  CameraIcon,
  MicIcon,
  UsersIcon,
  PlusIcon
} from './components/Icons';
import { generateAIResponse } from './services/geminiService';

const INITIAL_AI_USER: User = {
  id: 'gemini-ai',
  phoneNumber: '+10000000000',
  name: 'Gemini AI Assistant',
  avatar: 'https://picsum.photos/seed/gemini/200',
  about: 'Always here to help and chat! ✨',
  online: true,
  privacy: { lastSeen: 'everyone', profilePhoto: 'everyone', about: 'everyone', status: 'everyone' },
  blockedUsers: []
};

const MOCK_CONTACTS: User[] = [
  { id: 'c-1', name: 'Alice Smith', phoneNumber: '+1234567890', avatar: 'https://i.pravatar.cc/150?u=alice', about: 'Hey there!', online: true, privacy: { lastSeen: 'everyone', profilePhoto: 'everyone', about: 'everyone', status: 'everyone' }, blockedUsers: [] },
  { id: 'c-2', name: 'Bob Johnson', phoneNumber: '+1234567891', avatar: 'https://i.pravatar.cc/150?u=bob', about: 'Busy', online: false, privacy: { lastSeen: 'nobody', profilePhoto: 'contacts', about: 'everyone', status: 'nobody' }, blockedUsers: [] },
  { id: 'c-3', name: 'Charlie Brown', phoneNumber: '+1234567892', avatar: 'https://i.pravatar.cc/150?u=charlie', about: 'At the gym 🏋️‍♂️', online: true, privacy: { lastSeen: 'contacts', profilePhoto: 'everyone', about: 'everyone', status: 'everyone' }, blockedUsers: [] },
];

const App: React.FC = () => {
  // Authentication & User
  const [authState, setAuthState] = useState<AuthState>('idle');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  // App State
  const [activeTab, setActiveTab] = useState<ActiveTab>('chats');
  const [theme, setTheme] = useState<Theme>('dark');
  const [chats, setChats] = useState<Chat[]>([]);
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  
  // Feature Overlays
  const [activeCall, setActiveCall] = useState<Call | null>(null);
  const [activeStory, setActiveStory] = useState<Story | null>(null);
  const [showPrivacySettings, setShowPrivacySettings] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);

  // Persistence & Initialization
  useEffect(() => {
    const savedUser = localStorage.getItem('chat_user');
    const savedTheme = localStorage.getItem('chat_theme') as Theme;
    if (savedTheme) setTheme(savedTheme);
    if (savedUser) {
      const user = JSON.parse(savedUser);
      setCurrentUser(user);
      setAuthState('authenticated');
      initializeAppData(user.id);
    }
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('chat_theme', theme);
  }, [theme]);

  const initializeAppData = (userId: string) => {
    const aiChat: Chat = { id: 'chat-ai', type: 'individual', participants: [userId, INITIAL_AI_USER.id], unreadCount: 0 };
    const aliceChat: Chat = { id: 'chat-alice', type: 'individual', participants: [userId, 'c-1'], unreadCount: 2 };
    const familyGroup: Chat = { id: 'chat-family', type: 'group', participants: [userId, 'c-1', 'c-3'], unreadCount: 0 };
    
    setChats([aiChat, aliceChat, familyGroup]);
    setMessages({
      'chat-ai': [{ id: 'msg-1', senderId: INITIAL_AI_USER.id, receiverId: userId, text: 'Welcome! Everything is end-to-end encrypted here. 🔐', timestamp: Date.now() - 10000, status: 'read' }],
      'chat-alice': [{ id: 'msg-a1', senderId: 'c-1', receiverId: userId, text: 'See you later!', timestamp: Date.now() - 500000, status: 'delivered' }],
      'chat-family': [{ id: 'msg-f1', senderId: 'c-3', receiverId: 'chat-family', text: 'Dinner at 8?', timestamp: Date.now() - 1000000, status: 'read' }]
    });
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (phoneNumber.length >= 10) setAuthState('otp-pending');
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp === '123456') {
      const newUser: User = { 
        id: 'user-' + Date.now(), 
        phoneNumber, 
        name: 'John Doe', 
        avatar: 'https://i.pravatar.cc/150?u=me', 
        about: 'Hey! I am using GeminiConnect.',
        online: true,
        privacy: { lastSeen: 'everyone', profilePhoto: 'everyone', about: 'everyone', status: 'everyone' },
        blockedUsers: []
      };
      setCurrentUser(newUser);
      localStorage.setItem('chat_user', JSON.stringify(newUser));
      setAuthState('authenticated');
      initializeAppData(newUser.id);
    } else {
      alert("Demo OTP: 123456");
    }
  };

  const sendMessage = async () => {
    if (!inputText.trim() || !selectedChatId || !currentUser) return;

    const msgId = `msg-${Date.now()}`;
    const newMessage: Message = {
      id: msgId,
      senderId: currentUser.id,
      receiverId: selectedChatId,
      text: inputText,
      timestamp: Date.now(),
      status: 'sent',
      type: 'text'
    };

    setMessages(prev => ({
      ...prev,
      [selectedChatId]: [...(prev[selectedChatId] || []), newMessage]
    }));
    setInputText('');
    setChats(prev => prev.map(c => c.id === selectedChatId ? { ...c, lastMessage: newMessage } : c));

    if (selectedChatId === 'chat-ai') {
      setChats(prev => prev.map(c => c.id === 'chat-ai' ? { ...c, isTyping: true } : c));
      const aiText = await generateAIResponse([], inputText);
      setChats(prev => prev.map(c => c.id === 'chat-ai' ? { ...c, isTyping: false } : c));
      
      const aiMsg: Message = {
        id: `ai-${Date.now()}`,
        senderId: INITIAL_AI_USER.id,
        receiverId: currentUser.id,
        text: aiText,
        timestamp: Date.now(),
        status: 'read',
      };
      setMessages(prev => ({ ...prev, [selectedChatId]: [...(prev[selectedChatId] || []), aiMsg] }));
    }
  };

  const activeChat = chats.find(c => c.id === selectedChatId);
  const partner = useMemo(() => {
    if (!activeChat) return null;
    if (activeChat.type === 'group') return { name: 'Family Group', avatar: 'https://picsum.photos/seed/group/200', online: true };
    if (activeChat.id === 'chat-ai') return INITIAL_AI_USER;
    const partnerId = activeChat.participants.find(id => id !== currentUser?.id);
    return MOCK_CONTACTS.find(c => c.id === partnerId) || null;
  }, [activeChat, currentUser]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, selectedChatId, activeChat?.isTyping]);

  if (authState !== 'authenticated') {
    return (
      <div className={`min-h-screen flex items-center justify-center ${theme === 'dark' ? 'bg-[#0b141a]' : 'bg-gray-100'} p-4`}>
        <div className={`p-8 rounded-xl shadow-2xl w-full max-w-md border ${theme === 'dark' ? 'bg-[#111b21] border-gray-800' : 'bg-white border-gray-200'}`}>
          <div className="flex flex-col items-center mb-8 text-center">
            <div className="w-20 h-20 bg-teal-600 rounded-full flex items-center justify-center mb-4 shadow-teal-900/20 shadow-lg">
              <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12c0 1.85.5 3.58 1.39 5.08L2.01 22l5.08-1.39C8.58 21.5 10.15 22 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2zm0 18c-1.63 0-3.14-.42-4.45-1.16l-.32-.18-3.05.83.83-3.05-.18-.32C4.42 15.14 4 13.63 4 12c0-4.41 3.59-8 8-8s8 3.59 8 8-3.59 8-8 8z"/></svg>
            </div>
            <h1 className={`text-2xl font-bold ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>GeminiConnect</h1>
            <p className="text-gray-500 mt-2">{authState === 'idle' ? 'Login with Phone' : 'Verify (OTP: 123456)'}</p>
          </div>
          <form onSubmit={authState === 'idle' ? handleLogin : handleVerifyOtp} className="space-y-4">
            <input 
              type={authState === 'idle' ? 'tel' : 'text'} 
              placeholder={authState === 'idle' ? 'Phone Number' : '6-digit code'}
              className={`w-full border rounded-lg p-3 outline-none focus:ring-2 focus:ring-teal-500 transition-all ${theme === 'dark' ? 'bg-[#202c33] border-gray-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'}`}
              value={authState === 'idle' ? phoneNumber : otp}
              onChange={(e) => authState === 'idle' ? setPhoneNumber(e.target.value) : setOtp(e.target.value)}
              required
            />
            <button className="w-full bg-teal-600 hover:bg-teal-500 text-white font-bold py-3 rounded-lg transition-all shadow-md active:scale-[0.98]">
              {authState === 'idle' ? 'Get OTP' : 'Verify'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className={`h-screen flex flex-col md:flex-row overflow-hidden transition-colors ${theme === 'dark' ? 'bg-[#0b141a]' : 'bg-[#e5e7eb]'}`}>
      
      {/* Sidebar Navigation */}
      <div className={`w-full md:w-[450px] flex-shrink-0 flex flex-col border-r shadow-lg ${theme === 'dark' ? 'bg-[#111b21] border-gray-800' : 'bg-white border-gray-200'} ${selectedChatId ? 'hidden md:flex' : 'flex'}`}>
        <header className={`h-16 flex items-center justify-between px-4 ${theme === 'dark' ? 'bg-[#202c33]' : 'bg-[#f0f2f5]'}`}>
          <Avatar src={currentUser?.avatar} name={currentUser?.name || ''} size="md" />
          <div className="flex space-x-3 text-gray-500">
            <button 
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 hover:bg-gray-700/10 rounded-full transition-all"
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
            <button className="p-2 hover:bg-gray-700/10 rounded-full transition-all"><UsersIcon className="w-5 h-5"/></button>
            <button className="p-2 hover:bg-gray-700/10 rounded-full transition-all"><MoreVerticalIcon className="w-5 h-5"/></button>
          </div>
        </header>

        {/* Tab Switcher */}
        <nav className={`flex border-b ${theme === 'dark' ? 'bg-[#111b21] border-gray-800' : 'bg-white border-gray-200'}`}>
          {(['chats', 'status', 'calls', 'settings'] as ActiveTab[]).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 text-[13px] font-bold uppercase tracking-wider transition-all border-b-2 ${
                activeTab === tab ? 'text-teal-600 border-teal-600' : 'text-gray-500 border-transparent hover:text-teal-400'
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>

        {/* Search */}
        <div className="p-2">
          <div className={`relative flex items-center rounded-lg px-4 ${theme === 'dark' ? 'bg-[#202c33]' : 'bg-[#f0f2f5]'}`}>
            <SearchIcon className="text-gray-400 w-4 h-4 mr-3" />
            <input 
              type="text" 
              placeholder="Search chats"
              className={`w-full py-2 bg-transparent text-sm outline-none ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {activeTab === 'chats' && chats.map(chat => {
            const isGroup = chat.type === 'group';
            const chatPartner = isGroup ? { name: 'Family Group', avatar: 'https://picsum.photos/seed/group/200' } : (chat.id === 'chat-ai' ? INITIAL_AI_USER : MOCK_CONTACTS.find(c => chat.participants.includes(c.id)));
            return (
              <div 
                key={chat.id} 
                onClick={() => setSelectedChatId(chat.id)}
                className={`flex items-center px-4 py-3 cursor-pointer transition-colors border-b ${theme === 'dark' ? 'hover:bg-[#2a3942] border-gray-800/30' : 'hover:bg-[#f5f6f6] border-gray-100'} ${selectedChatId === chat.id ? (theme === 'dark' ? 'bg-[#2a3942]' : 'bg-[#f0f2f5]') : ''}`}
              >
                <Avatar src={chatPartner?.avatar} name={chatPartner?.name || ''} size="lg" />
                <div className="ml-4 flex-1 overflow-hidden">
                  <div className="flex justify-between">
                    <h4 className={`font-medium ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>{chatPartner?.name}</h4>
                    <span className="text-[11px] text-gray-500">12:45 PM</span>
                  </div>
                  <p className="text-sm text-gray-500 truncate mt-0.5">
                    {chat.isTyping ? <span className="text-teal-500">typing...</span> : chat.lastMessage?.text || 'Tap to chat'}
                  </p>
                </div>
              </div>
            );
          })}

          {activeTab === 'status' && (
             <div className="p-4 space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <Avatar src={currentUser?.avatar} name="Me" size="lg" />
                    <div className="absolute bottom-0 right-0 bg-teal-500 rounded-full p-0.5 border-2 border-white"><PlusIcon className="w-3 h-3 text-white"/></div>
                  </div>
                  <div>
                    <h4 className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-black'}`}>My status</h4>
                    <p className="text-xs text-gray-500">Tap to add status update</p>
                  </div>
                </div>
                <h5 className="text-xs text-teal-600 font-bold uppercase mt-4">Recent Updates</h5>
                {MOCK_CONTACTS.map(c => (
                  <div key={c.id} className="flex items-center space-x-4 py-2 cursor-pointer">
                    <div className="p-0.5 rounded-full border-2 border-teal-500">
                      <img src={c.avatar} className="w-12 h-12 rounded-full border-2 border-[#111b21] object-cover" />
                    </div>
                    <div>
                      <h4 className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-black'}`}>{c.name}</h4>
                      <p className="text-xs text-gray-500">2 hours ago</p>
                    </div>
                  </div>
                ))}
             </div>
          )}

          {activeTab === 'settings' && (
            <div className={`p-4 space-y-6 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
              <div className="flex items-center space-x-4 p-2 bg-gray-500/10 rounded-xl">
                 <Avatar src={currentUser?.avatar} name={currentUser?.name || ''} size="xl" />
                 <div>
                    <h3 className="text-lg font-bold">{currentUser?.name}</h3>
                    <p className="text-sm text-gray-500">Available</p>
                 </div>
              </div>
              <div className="space-y-4">
                <button onClick={() => setShowPrivacySettings(!showPrivacySettings)} className="w-full text-left flex justify-between items-center p-3 hover:bg-gray-500/10 rounded-lg">
                  <span>Privacy Settings</span>
                  <span className="text-teal-500 text-xs font-bold">Manage</span>
                </button>
                <div className="w-full text-left flex justify-between items-center p-3 hover:bg-gray-500/10 rounded-lg">
                  <span>Chat Backup</span>
                  <span className="text-gray-500 text-xs">Never</span>
                </div>
                <div className="w-full text-left flex justify-between items-center p-3 hover:bg-gray-500/10 rounded-lg text-red-500">
                  <span>Block List</span>
                  <span className="bg-red-500 text-white text-[10px] px-1.5 rounded-full">0</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Chat View */}
      <div className={`flex-1 flex flex-col bg-[#0b141a] relative ${!selectedChatId ? 'hidden md:flex' : 'flex'}`}>
        {selectedChatId ? (
          <>
            <header className={`h-16 flex items-center justify-between px-4 shadow-md z-20 ${theme === 'dark' ? 'bg-[#202c33]' : 'bg-[#f0f2f5]'}`}>
              <div className="flex items-center space-x-3">
                <button onClick={() => setSelectedChatId(null)} className="md:hidden text-gray-400 p-2"><ArrowLeftIcon /></button>
                <Avatar src={partner?.avatar} name={partner?.name || ''} size="md" online={partner?.online} />
                <div className="overflow-hidden">
                  <h3 className={`font-medium truncate ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{partner?.name}</h3>
                  <p className="text-xs text-gray-400">{activeChat?.isTyping ? 'typing...' : (partner?.online ? 'Online' : 'Last seen recently')}</p>
                </div>
              </div>
              <div className="flex items-center space-x-4 text-gray-500">
                <button onClick={() => setActiveCall({id:'c1', type:'video', participantId: partner?.id || '', status:'ongoing', timestamp: Date.now()})} className="hover:text-teal-500 transition-colors"><VideoIcon className="w-5 h-5"/></button>
                <button onClick={() => setActiveCall({id:'c2', type:'voice', participantId: partner?.id || '', status:'ongoing', timestamp: Date.now()})} className="hover:text-teal-500 transition-colors"><PhoneIcon className="w-5 h-5"/></button>
                <button className="hover:text-teal-500 transition-colors"><MoreVerticalIcon className="w-5 h-5"/></button>
              </div>
            </header>

            <div className={`absolute inset-0 opacity-[0.06] pointer-events-none ${theme === 'dark' ? "bg-[url('https://w0.peakpx.com/wallpaper/580/650/HD-wallpaper-whatsapp-background-dark-background-whatsapp.jpg')]" : "bg-[url('https://i.pinimg.com/736x/8c/98/99/8c98994518b575dbd86b7adbb93014c0.jpg')]"} bg-repeat`} />

            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:px-12 space-y-2 z-10 no-scrollbar">
              <div className="flex justify-center my-6">
                <span className={`text-[10px] font-bold uppercase tracking-widest px-4 py-1.5 rounded-full shadow-sm ${theme === 'dark' ? 'bg-[#182229] text-gray-500' : 'bg-[#fff5c4] text-gray-600'}`}>
                   🔒 Messages are end-to-end encrypted. No one can read them, not even Gemini.
                </span>
              </div>
              {(messages[selectedChatId] || []).map((msg, idx) => {
                const isMine = msg.senderId === currentUser?.id;
                return (
                  <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'} group animate-in fade-in slide-in-from-bottom-2`}>
                    <div className={`max-w-[85%] md:max-w-[65%] rounded-lg px-3 py-1.5 shadow-sm relative transition-all group-hover:shadow-md ${
                      isMine ? (theme === 'dark' ? 'bg-[#005c4b] text-white' : 'bg-[#d9fdd3] text-gray-900') : (theme === 'dark' ? 'bg-[#202c33] text-gray-100' : 'bg-white text-gray-900')
                    } ${isMine ? 'rounded-tr-none' : 'rounded-tl-none'}`}>
                      <p className="text-sm md:text-[15px] whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                      <div className="flex items-center justify-end space-x-1 mt-1 opacity-60">
                        <span className="text-[10px] font-medium">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        {isMine && <DoubleCheckIcon className="w-3 h-3" read={msg.status === 'read'} />}
                      </div>
                    </div>
                  </div>
                );
              })}
              {activeChat?.isTyping && (
                <div className="flex justify-start">
                  <div className={`rounded-lg rounded-tl-none px-4 py-2 shadow-sm text-xs flex items-center space-x-2 ${theme === 'dark' ? 'bg-[#202c33] text-gray-400' : 'bg-white text-gray-500'}`}>
                    <div className="flex space-x-1">
                      <div className="w-1 h-1 bg-teal-500 rounded-full animate-bounce" />
                      <div className="w-1 h-1 bg-teal-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                      <div className="w-1 h-1 bg-teal-500 rounded-full animate-bounce [animation-delay:0.4s]" />
                    </div>
                    <span>{partner?.name} is typing</span>
                  </div>
                </div>
              )}
            </div>

            <footer className={`p-2 flex items-center space-x-2 z-20 ${theme === 'dark' ? 'bg-[#202c33]' : 'bg-[#f0f2f5]'}`}>
              <button className="text-gray-500 p-2 hover:bg-gray-400/10 rounded-full transition-all"><SmileIcon /></button>
              <button className="text-gray-500 p-2 hover:bg-gray-400/10 rounded-full transition-all"><PaperclipIcon /></button>
              <div className="flex-1">
                <input 
                  type="text" 
                  placeholder="Type a message"
                  className={`w-full rounded-lg py-2.5 px-4 outline-none text-sm md:text-base transition-all ${theme === 'dark' ? 'bg-[#2a3942] text-white' : 'bg-white text-gray-900 shadow-sm focus:shadow-md'}`}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                />
              </div>
              {inputText.trim() ? (
                <button onClick={sendMessage} className="bg-teal-600 text-white p-3 rounded-full shadow-lg active:scale-90 transition-all">
                  <SendIcon className="w-5 h-5" />
                </button>
              ) : (
                <button className="p-3 text-gray-500 hover:bg-gray-400/10 rounded-full transition-all">
                  <MicIcon className="w-5 h-5" />
                </button>
              )}
            </footer>
          </>
        ) : (
          <div className={`flex-1 flex flex-col items-center justify-center p-8 text-center transition-colors ${theme === 'dark' ? 'bg-[#222e35]' : 'bg-white'}`}>
            <div className="w-64 h-64 bg-teal-600/5 rounded-full flex items-center justify-center mb-8">
               <svg className="w-32 h-32 text-teal-600 opacity-30" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12c0 1.85.5 3.58 1.39 5.08L2.01 22l5.08-1.39C8.58 21.5 10.15 22 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2z"/></svg>
            </div>
            <h1 className={`text-3xl font-light ${theme === 'dark' ? 'text-gray-300' : 'text-gray-900'}`}>GeminiConnect for Web</h1>
            <p className="text-gray-500 mt-4 max-w-sm">Secure, reliable, and enhanced with AI. Sync your chats across devices instantly.</p>
            <div className="mt-16 flex items-center text-gray-400 text-xs tracking-widest uppercase font-bold">
               🛡️ END-TO-END ENCRYPTED
            </div>
          </div>
        )}
      </div>

      {/* CALL OVERLAY (SIMULATED) */}
      {activeCall && (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center text-white p-8">
           <div className="absolute top-8 left-8 flex items-center space-x-2 text-teal-500">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-ping" />
              <span className="font-bold uppercase tracking-tighter">Secure Connection</span>
           </div>
           <div className="flex flex-col items-center space-y-6">
              <Avatar src={partner?.avatar} name={partner?.name || ''} size="xl" />
              <h2 className="text-3xl font-bold">{partner?.name}</h2>
              <p className="text-teal-500 font-mono animate-pulse">00:04</p>
           </div>
           <div className="absolute bottom-16 flex space-x-8">
              <button className="p-5 bg-gray-800 rounded-full hover:bg-gray-700"><MicIcon /></button>
              <button onClick={() => setActiveCall(null)} className="p-5 bg-red-600 rounded-full hover:bg-red-500 rotate-[135deg]"><PhoneIcon /></button>
              <button className="p-5 bg-gray-800 rounded-full hover:bg-gray-700"><VideoIcon /></button>
           </div>
        </div>
      )}

      {/* PRIVACY MODAL (SIMULATED) */}
      {showPrivacySettings && (
        <div className="fixed inset-0 z-[110] bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm">
           <div className={`w-full max-w-md rounded-2xl shadow-2xl overflow-hidden ${theme === 'dark' ? 'bg-[#111b21]' : 'bg-white'}`}>
              <div className="p-6 border-b border-gray-800/20 flex justify-between items-center">
                 <h2 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-black'}`}>Privacy Settings</h2>
                 <button onClick={() => setShowPrivacySettings(false)} className="text-gray-500">✕</button>
              </div>
              <div className="p-6 space-y-6">
                 {['Last Seen', 'Profile Photo', 'About', 'Status'].map(setting => (
                    <div key={setting} className="flex justify-between items-center">
                       <span className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>{setting}</span>
                       <select className={`bg-transparent text-teal-500 font-bold outline-none cursor-pointer ${theme === 'dark' ? 'bg-[#202c33]' : 'bg-gray-100'} p-1 rounded`}>
                          <option>Everyone</option>
                          <option>My Contacts</option>
                          <option>Nobody</option>
                       </select>
                    </div>
                 ))}
                 <div className="pt-4 border-t border-gray-800/20">
                    <button className="w-full text-left text-red-500 font-bold">Clear All Chats</button>
                    <button className="w-full text-left text-red-500 font-bold mt-4">Delete My Account</button>
                 </div>
              </div>
           </div>
        </div>
      )}

    </div>
  );
};

export default App;
