import React from 'react';
import { Check } from 'lucide-react';

export const PremiumPage = ({ onBuy }: { onBuy: () => void }) => {
  return (
    <div className="flex-1 overflow-y-auto bg-[#121212] rounded-lg relative">
       <div className="bg-gradient-to-b from-[#2a1744] to-[#121212] pt-20 pb-16 px-8 text-center flex flex-col items-center">
           <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-6">Listen without limits. Try 3 months of Premium Standard for ₹99.</h1>
           <p className="text-lg text-white mb-8">Only ₹139/month after. Cancel anytime.</p>
           
           <div className="flex gap-4">
              <button 
                onClick={onBuy} 
                className="bg-white text-black font-bold text-sm px-8 py-3 rounded-full hover:scale-105 active:scale-95 transition-transform"
              >
                Try 3 months for ₹99
              </button>
              <button 
                className="bg-transparent border border-white text-white font-bold text-sm px-8 py-3 rounded-full hover:scale-105 active:scale-95 transition-transform"
              >
                View all plans
              </button>
           </div>
           
           <p className="text-[11px] text-[#b3b3b3] mt-8 max-w-xl mx-auto">
              Premium Standard only. ₹99 for 3 months, then ₹139 per month after. Offer only available if you haven't tried Premium before. <a href="#" className="underline hover:text-white">Terms apply.</a> Offer ends June 22, 2026.
           </p>
       </div>

       <div className="bg-[#121212] px-8 max-w-6xl mx-auto pb-20">
          <h2 className="text-3xl font-bold text-center text-white mb-2 pt-8">Choose the Premium plan that's right for you.</h2>
          <h2 className="text-3xl font-bold text-center text-white mb-8">You've got options.</h2>
          <p className="text-center text-white mb-10 text-lg">Choose a Premium plan and listen to the podcasts and ad-free music you want, when you want.<br/>Pay in various ways. Cancel anytime.</p>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
             {/* Plan 1 */}
             <div className="bg-[#242424] rounded-[10px] p-6 flex flex-col relative overflow-hidden h-full">
                <div className="bg-[#1ed760] text-black font-bold text-[13px] px-3 py-1 rounded-sm inline-block mb-4 w-max">₹99 for 3 months</div>
                <div className="flex items-center gap-2 mb-2">
                   <img src="https://storage.googleapis.com/pr-newsroom-wp/1/2018/11/Spotify_Logo_RGB_White.png" alt="Spotify" className="h-5" />
                   <h3 className="text-xl font-bold text-white">Premium</h3>
                </div>
                <h3 className="text-3xl font-bold text-[#1ed760] mb-2 font-black">Standard</h3>
                <p className="text-white text-[15px] font-bold mb-1">₹99 for 3 months</p>
                <p className="text-[#b3b3b3] text-[14px] mb-6 font-medium">₹139 / month after</p>
                <hr className="border-[#333] mb-6"/>
                <ul className="text-[15px] text-white flex-1 mb-8">
                  <li className="flex gap-4 items-start mb-4"><span className="w-[4px] h-[4px] bg-white rounded-full mt-2 shrink-0" /> 1 Standard account</li>
                  <li className="flex gap-4 items-start mb-4"><span className="w-[4px] h-[4px] bg-white rounded-full mt-2 shrink-0" /> Download to listen offline</li>
                  <li className="flex gap-4 items-start mb-4"><span className="w-[4px] h-[4px] bg-white rounded-full mt-2 shrink-0" /> Very high audio quality (up to ~320kbps)</li>
                  <li className="flex gap-4 items-start mb-4"><span className="w-[4px] h-[4px] bg-white rounded-full mt-2 shrink-0" /> Cancel anytime</li>
                  <li className="flex gap-4 items-start mb-0"><span className="w-[4px] h-[4px] bg-white rounded-full mt-2 shrink-0" /> Subscribe or one-time payment</li>
                </ul>
                <button onClick={onBuy} className="w-full bg-[#1ed760] text-black font-bold py-[14px] px-8 rounded-full hover:scale-104 active:scale-95 transition-all text-base hover:bg-[#1fdf64]">Try 3 months for ₹99</button>
                <p className="text-[11px] text-[#b3b3b3] mt-4 text-center">₹99 for 3 months, then ₹139 per month after. Offer only available if you haven't tried Premium before. <span className="underline">Terms apply.</span></p>
             </div>

             {/* Plan 2 */}
             <div className="bg-[#242424] rounded-[10px] p-6 flex flex-col relative overflow-hidden h-full">
                <div className="flex items-center gap-2 mb-2 mt-10">
                   <img src="https://storage.googleapis.com/pr-newsroom-wp/1/2018/11/Spotify_Logo_RGB_White.png" alt="Spotify" className="h-5" />
                   <h3 className="text-xl font-bold text-white">Premium</h3>
                </div>
                <h3 className="text-3xl font-bold text-[#ffc864] mb-2 font-black">Platinum</h3>
                <p className="text-white text-[15px] font-bold mb-6">₹299 / month</p>
                <hr className="border-[#333] mb-6"/>
                <ul className="text-[15px] text-white flex-1 mb-8">
                  <li className="flex gap-4 items-start mb-4"><span className="w-[4px] h-[4px] bg-white rounded-full mt-2 shrink-0" /> Up to 3 Platinum accounts</li>
                  <li className="flex gap-4 items-start mb-4"><span className="w-[4px] h-[4px] bg-white rounded-full mt-2 shrink-0" /> Download to listen offline</li>
                  <li className="flex gap-4 items-start mb-4"><span className="w-[4px] h-[4px] bg-white rounded-full mt-2 shrink-0" /> Lossless audio quality (up to ~24-bit/44.1kHz)</li>
                  <li className="flex gap-4 items-start mb-4"><span className="w-[4px] h-[4px] bg-white rounded-full mt-2 shrink-0" /> Mix your playlists</li>
                  <li className="flex gap-4 items-start mb-4"><span className="w-[4px] h-[4px] bg-white rounded-full mt-2 shrink-0" /> Your personal AI DJ</li>
                </ul>
                <button onClick={onBuy} className="w-full bg-[#ffc864] text-black font-bold py-[14px] px-8 rounded-full hover:scale-104 active:scale-95 transition-all text-base hover:bg-[#ffd982]">Get Premium Platinum</button>
             </div>

             {/* Plan 3 */}
             <div className="bg-[#242424] rounded-[10px] p-6 flex flex-col relative overflow-hidden h-full">
                <div className="bg-[#a5b4fc] text-black font-bold text-[13px] px-3 py-1 rounded-sm inline-block mb-4 w-max">Savings available</div>
                <div className="flex items-center gap-2 mb-2">
                   <img src="https://storage.googleapis.com/pr-newsroom-wp/1/2018/11/Spotify_Logo_RGB_White.png" alt="Spotify" className="h-5" />
                   <h3 className="text-xl font-bold text-white">Premium</h3>
                </div>
                <h3 className="text-3xl font-bold text-[#a5b4fc] mb-2 font-black">Student</h3>
                <p className="text-white text-[15px] font-bold mb-1">₹69 for 2 months</p>
                <p className="text-[#b3b3b3] text-[14px] mb-6 font-medium">₹69 / month after</p>
                <hr className="border-[#333] mb-6"/>
                <ul className="text-[15px] text-white flex-1 mb-8">
                  <li className="flex gap-4 items-start mb-4"><span className="w-[4px] h-[4px] bg-white rounded-full mt-2 shrink-0" /> 1 verified Standard account</li>
                  <li className="flex gap-4 items-start mb-4"><span className="w-[4px] h-[4px] bg-white rounded-full mt-2 shrink-0" /> Download to listen offline</li>
                  <li className="flex gap-4 items-start mb-4"><span className="w-[4px] h-[4px] bg-white rounded-full mt-2 shrink-0" /> Very high audio quality (up to ~320kbps)</li>
                  <li className="flex gap-4 items-start mb-0"><span className="w-[4px] h-[4px] bg-white rounded-full mt-2 shrink-0" /> Cancel anytime</li>
                </ul>
                <button onClick={onBuy} className="w-full bg-[#a5b4fc] text-black font-bold py-[14px] px-8 rounded-full hover:scale-104 active:scale-95 transition-all text-base hover:bg-[#b5c2fd]">Try 2 months for ₹69</button>
             </div>
          </div>
       </div>
    </div>
  );
};
