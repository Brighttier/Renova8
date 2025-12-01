import React from 'react';

interface Props {
  credits: number;
  onAddCredits: (amount: number) => void;
}

export const Settings: React.FC<Props> = ({ credits, onAddCredits }) => {
  return (
    <div className="space-y-10 animate-fadeIn">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-gray-800 font-serif">Account & Billing</h1>
        <p className="text-gray-500">Manage your subscription and credit balance.</p>
      </div>

      {/* Credit Balance */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-3xl p-8 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
           <h2 className="text-2xl font-bold mb-1">Current Balance</h2>
           <div className="text-5xl font-bold">{credits} <span className="text-2xl font-medium opacity-80">Credits</span></div>
           <p className="text-purple-100 mt-2 opacity-90">Use credits to generate leads, images, videos, and websites.</p>
        </div>
        <button 
           onClick={() => onAddCredits(50)}
           className="bg-white text-purple-600 px-8 py-4 rounded-xl font-bold shadow-lg hover:shadow-xl hover:scale-105 transition-all text-lg whitespace-nowrap"
        >
            + Top Up Instantly
        </button>
      </div>

      {/* Top Up Packs */}
      <div>
        <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
            <span className="bg-green-100 p-2 rounded-lg mr-3 text-2xl">🔋</span> Credit Top-Ups
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
                { amount: 50, price: '$9.99', popular: false, label: 'Starter' },
                { amount: 150, price: '$24.99', popular: true, label: 'Entrepreneur' },
                { amount: 500, price: '$74.99', popular: false, label: 'Agency' },
            ].map((pack, i) => (
                <div key={i} className={`bg-white rounded-2xl p-6 border ${pack.popular ? 'border-purple-400 shadow-md ring-1 ring-purple-100' : 'border-gray-200'} relative`}>
                    {pack.popular && <div className="absolute top-0 right-0 bg-purple-500 text-white text-xs font-bold px-3 py-1 rounded-bl-xl rounded-tr-xl">BEST VALUE</div>}
                    <div className="text-gray-500 font-bold uppercase text-xs mb-2">{pack.label}</div>
                    <div className="text-3xl font-bold text-gray-800 mb-1">{pack.amount} Credits</div>
                    <div className="text-xl text-purple-600 font-medium mb-4">{pack.price}</div>
                    <button 
                        onClick={() => onAddCredits(pack.amount)}
                        className={`w-full py-3 rounded-xl font-bold transition-colors ${pack.popular ? 'bg-purple-600 text-white hover:bg-purple-700' : 'bg-gray-50 text-gray-700 hover:bg-gray-100'}`}
                    >
                        Buy Now
                    </button>
                </div>
            ))}
        </div>
      </div>

      <hr className="border-gray-100" />

      {/* Subscriptions */}
      <div>
        <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
            <span className="bg-blue-100 p-2 rounded-lg mr-3 text-2xl">⭐</span> Monthly Plans
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Free Tier */}
            <div className="bg-white rounded-2xl p-8 border border-gray-200 flex flex-col">
                <h4 className="font-bold text-gray-800 text-xl mb-2">Hobbyist</h4>
                <div className="text-4xl font-bold text-gray-800 mb-6">$0<span className="text-lg text-gray-400 font-normal">/mo</span></div>
                <ul className="space-y-3 mb-8 flex-1">
                    <li className="flex items-center text-gray-600 text-sm"><span className="text-green-500 mr-2">✓</span> 10 Credits / month</li>
                    <li className="flex items-center text-gray-600 text-sm"><span className="text-green-500 mr-2">✓</span> Basic Lead Search</li>
                    <li className="flex items-center text-gray-600 text-sm"><span className="text-green-500 mr-2">✓</span> Email Pitches</li>
                </ul>
                <button className="w-full py-3 border border-gray-200 rounded-xl font-bold text-gray-500 cursor-not-allowed">Current Plan</button>
            </div>

            {/* Pro Tier */}
            <div className="bg-white rounded-2xl p-8 border-2 border-purple-500 shadow-xl relative flex flex-col transform md:-translate-y-4">
                <div className="absolute top-0 inset-x-0 bg-purple-500 text-white text-center text-xs font-bold py-1 rounded-t-lg">RECOMMENDED</div>
                <h4 className="font-bold text-gray-800 text-xl mb-2 mt-2">MomPreneur Pro</h4>
                <div className="text-4xl font-bold text-gray-800 mb-6">$29<span className="text-lg text-gray-400 font-normal">/mo</span></div>
                <ul className="space-y-3 mb-8 flex-1">
                    <li className="flex items-center text-gray-800 font-medium text-sm"><span className="text-green-500 mr-2">✓</span> 100 Credits / month</li>
                    <li className="flex items-center text-gray-800 font-medium text-sm"><span className="text-green-500 mr-2">✓</span> Website Builder Access</li>
                    <li className="flex items-center text-gray-800 font-medium text-sm"><span className="text-green-500 mr-2">✓</span> Image Studio Pro</li>
                    <li className="flex items-center text-gray-800 font-medium text-sm"><span className="text-green-500 mr-2">✓</span> Priority Support</li>
                </ul>
                <button className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-bold hover:opacity-90 transition-opacity shadow-lg">Upgrade Now</button>
            </div>

            {/* Business Tier */}
            <div className="bg-white rounded-2xl p-8 border border-gray-200 flex flex-col">
                <h4 className="font-bold text-gray-800 text-xl mb-2">Agency Elite</h4>
                <div className="text-4xl font-bold text-gray-800 mb-6">$99<span className="text-lg text-gray-400 font-normal">/mo</span></div>
                <ul className="space-y-3 mb-8 flex-1">
                    <li className="flex items-center text-gray-600 text-sm"><span className="text-green-500 mr-2">✓</span> 500 Credits / month</li>
                    <li className="flex items-center text-gray-600 text-sm"><span className="text-green-500 mr-2">✓</span> Video Studio Access (Veo)</li>
                    <li className="flex items-center text-gray-600 text-sm"><span className="text-green-500 mr-2">✓</span> Unlimited Projects</li>
                    <li className="flex items-center text-gray-600 text-sm"><span className="text-green-500 mr-2">✓</span> Whitelabel Invoicing</li>
                </ul>
                <button className="w-full py-3 border border-purple-200 text-purple-600 rounded-xl font-bold hover:bg-purple-50 transition-colors">Contact Sales</button>
            </div>
        </div>
      </div>
      
      <div className="text-center text-gray-400 text-xs pb-8">
          Payments are securely processed. You can cancel anytime.
      </div>
    </div>
  );
};