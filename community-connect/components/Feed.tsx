import React from 'react';
import { 
  Image as ImageIcon, 
  Video, 
  Paperclip, 
  Hash, 
  AtSign, 
  ChevronDown, 
  MoreHorizontal, 
  Heart, 
  MessageCircle, 
  Share2,
  Smile
} from 'lucide-react';

export const Feed = () => {
  return (
    <div className="space-y-6">
      {/* Create Post */}
      <div className="card p-6">
        <div className="flex gap-4 mb-6">
          <img 
            src="https://picsum.photos/seed/user1/100/100" 
            alt="User" 
            className="w-10 h-10 rounded-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="flex-1 relative">
            <input 
              type="text" 
              placeholder="Share something..." 
              className="w-full bg-gray-50 border-none rounded-full py-2.5 px-5 text-sm focus:ring-0 outline-none"
            />
            <Smile className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 cursor-pointer" />
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button className="flex items-center gap-2 text-gray-500 hover:text-blue-600 transition-colors">
              <ImageIcon className="w-5 h-5 text-blue-500" />
              <span className="text-xs font-semibold">Image</span>
            </button>
            <button className="flex items-center gap-2 text-gray-500 hover:text-blue-600 transition-colors">
              <Video className="w-5 h-5 text-green-500" />
              <span className="text-xs font-semibold">Video</span>
            </button>
            <button className="flex items-center gap-2 text-gray-500 hover:text-blue-600 transition-colors">
              <Paperclip className="w-5 h-5 text-orange-500" />
              <span className="text-xs font-semibold">Attachment</span>
            </button>
            <button className="flex items-center gap-2 text-gray-500 hover:text-blue-600 transition-colors">
              <Hash className="w-5 h-5 text-red-500" />
              <span className="text-xs font-semibold">Hashtag</span>
            </button>
            <button className="flex items-center gap-2 text-gray-500 hover:text-blue-600 transition-colors">
              <AtSign className="w-5 h-5 text-gray-400" />
              <span className="text-xs font-semibold">Mention</span>
            </button>
          </div>
          <button className="flex items-center gap-2 text-gray-400 hover:text-gray-600">
            <span className="text-xs font-semibold">Public</span>
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Sort By */}
      <div className="flex justify-end">
        <button className="flex items-center gap-1 text-xs font-bold text-gray-400">
          Sort by : <span className="text-gray-600">Top</span>
          <ChevronDown className="w-4 h-4" />
        </button>
      </div>

      {/* Post */}
      <div className="card overflow-hidden">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <img 
                src="https://picsum.photos/seed/user2/100/100" 
                alt="User" 
                className="w-10 h-10 rounded-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div>
                <h4 className="text-sm font-bold">Alan Patterson</h4>
                <p className="text-[10px] text-gray-400">2 hours ago</p>
              </div>
            </div>
            <button className="text-gray-400 hover:text-gray-600">
              <MoreHorizontal className="w-5 h-5" />
            </button>
          </div>
          <p className="text-sm text-gray-700 mb-4">
            Was great meeting up with Anna Ferguson and Dave Bishop at the breakfast talk! 🥞 <span className="text-blue-500 font-medium">#breakfast</span>
          </p>
          <div className="rounded-xl overflow-hidden mb-4">
            <img 
              src="https://picsum.photos/seed/pancakes/800/500" 
              alt="Post content" 
              className="w-full h-auto object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-6">
              <button className="flex items-center gap-2 text-gray-500 hover:text-red-500 transition-colors">
                <Heart className="w-5 h-5" />
                <span className="text-xs font-bold">45</span>
              </button>
              <button className="flex items-center gap-2 text-gray-500 hover:text-blue-600 transition-colors">
                <MessageCircle className="w-5 h-5" />
                <span className="text-xs font-bold">16</span>
              </button>
              <button className="flex items-center gap-2 text-gray-500 hover:text-green-600 transition-colors">
                <Share2 className="w-5 h-5" />
              </button>
            </div>
            <button className="text-gray-400 hover:text-gray-600">
              <ChevronDown className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Another Post (Placeholder) */}
      <div className="card p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img 
              src="https://picsum.photos/seed/user3/100/100" 
              alt="User" 
              className="w-10 h-10 rounded-full object-cover"
              referrerPolicy="no-referrer"
            />
            <div>
              <h4 className="text-sm font-bold">Pierre Rushman</h4>
              <p className="text-[10px] text-gray-400">4 hours ago</p>
            </div>
          </div>
          <button className="text-gray-400 hover:text-gray-600">
            <MoreHorizontal className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
