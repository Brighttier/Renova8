import React from 'react';
import { Lead } from '../types';

interface Props {
  leads: Lead[];
}

export const Invoicing: React.FC<Props> = ({ leads }) => {
  const convertedLeads = leads.filter(l => l.status === 'converted');
  
  // Calculate fake totals based on converted leads
  const totalEarned = convertedLeads.length * 1200; // Mock $1200 per client
  const pending = 850; // Static mock for visual

  return (
    <div className="space-y-6">
      <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-800 font-serif">My Earnings</h1>
          <p className="text-gray-500">Track your earnings from converted leads.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border-b-4 border-green-400">
              <p className="text-gray-500 font-medium">Total Earned</p>
              <h2 className="text-4xl font-bold text-gray-800 mt-2">${totalEarned.toLocaleString()}</h2>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border-b-4 border-blue-400">
              <p className="text-gray-500 font-medium">Pending Invoices</p>
              <h2 className="text-4xl font-bold text-gray-800 mt-2">${pending}</h2>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border-b-4 border-purple-400">
              <p className="text-gray-500 font-medium">Active Clients</p>
              <h2 className="text-4xl font-bold text-gray-800 mt-2">{convertedLeads.length}</h2>
          </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                      <th className="p-4 font-semibold text-gray-600">Client</th>
                      <th className="p-4 font-semibold text-gray-600">Service</th>
                      <th className="p-4 font-semibold text-gray-600">Date</th>
                      <th className="p-4 font-semibold text-gray-600">Amount</th>
                      <th className="p-4 font-semibold text-gray-600">Status</th>
                      <th className="p-4 font-semibold text-gray-600">Action</th>
                  </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                  {convertedLeads.length > 0 ? convertedLeads.map((lead) => (
                      <tr key={lead.id} className="hover:bg-gray-50">
                          <td className="p-4 font-medium text-gray-800">{lead.businessName}</td>
                          <td className="p-4 text-gray-600">Website Redesign</td>
                          <td className="p-4 text-gray-600">{new Date(lead.addedAt || Date.now()).toLocaleDateString()}</td>
                          <td className="p-4 font-bold text-gray-800">$1,200.00</td>
                          <td className="p-4">
                              <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-bold">PAID</span>
                          </td>
                          <td className="p-4">
                              <button className="text-purple-600 hover:underline text-sm font-medium">Download Invoice</button>
                          </td>
                      </tr>
                  )) : (
                      <tr>
                          <td colSpan={6} className="p-12 text-center text-gray-400">
                              <span className="block text-2xl mb-2">💸</span>
                              No converted customers yet. 
                              <br/>Go to "My Customers" and mark a lead as <strong>"Won"</strong> to generate an invoice.
                          </td>
                      </tr>
                  )}
              </tbody>
          </table>
      </div>
    </div>
  );
};