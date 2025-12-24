
import React from 'react';

interface StoryCircleProps {
  user: { name: string; avatar: string };
  isMe?: boolean;
  viewed?: boolean;
  onClick?: () => void;
}

const StoryCircle: React.FC<StoryCircleProps> = ({ user, isMe, viewed, onClick }) => {
  return (
    <div className="flex flex-col items-center space-y-1 cursor-pointer shrink-0" onClick={onClick}>
      <div className={`p-0.5 rounded-full border-2 ${viewed ? 'border-gray-600' : 'border-teal-500'}`}>
        <div className="relative">
          <img 
            src={user.avatar} 
            alt={user.name} 
            className="w-14 h-14 rounded-full border-2 border-[#111b21] object-cover" 
          />
          {isMe && (
            <div className="absolute bottom-0 right-0 bg-teal-500 rounded-full border-2 border-[#111b21] p-0.5">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            </div>
          )}
        </div>
      </div>
      <span className="text-[11px] text-gray-400 font-medium truncate w-16 text-center">
        {isMe ? 'My status' : user.name.split(' ')[0]}
      </span>
    </div>
  );
};

export default StoryCircle;
