import { useState } from 'react';
import { Link } from 'react-router';
import { useClaims } from '../api';
import type { ClaimFinalStatus } from 'shared';

export default function Dashboard() {
  const { data: claims, isLoading, isError } = useClaims();
  const [filter, setFilter] = useState<ClaimFinalStatus | 'ALL'>('ALL');

  if (isLoading) return <div className="p-8 text-center text-gray-500">Loading claims...</div>;
  if (isError) return <div className="p-8 text-center text-red-500">Unable to load claims. Please try again.</div>;

  const filteredClaims = claims?.filter((c: any) => filter === 'ALL' || c.finalStatus === filter) || [];

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="bg-white shadow rounded-lg overflow-hidden border border-gray-200">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gray-50">
          <h1 className="text-2xl font-bold text-gray-800">Expense Policy Review</h1>
        </div>
        
        <div className="p-4 border-b border-gray-200 flex space-x-2 overflow-x-auto bg-gray-50">
          {['ALL', 'PENDING_REVIEW', 'MANUAL_REVIEW_REQUIRED', 'NEEDS_CLARIFICATION', 'APPROVED', 'REJECTED'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f as any)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                filter === f 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              {f.replace(/_/g, ' ')}
            </button>
          ))}
        </div>

        {filteredClaims.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No claims found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Claimant</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredClaims.map((claim: any) => (
                  <tr key={claim.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{claim.claimantId}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(claim.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{claim.category}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                      {(claim.amountMinorUnits / 100).toFixed(2)} {claim.currency}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        claim.finalStatus === 'APPROVED' ? 'bg-green-100 text-green-800' :
                        claim.finalStatus === 'REJECTED' ? 'bg-red-100 text-red-800' :
                        claim.finalStatus === 'NEEDS_CLARIFICATION' ? 'bg-yellow-100 text-yellow-800' :
                        claim.finalStatus === 'MANUAL_REVIEW_REQUIRED' ? 'bg-orange-100 text-orange-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {claim.finalStatus.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link to={`/claims/${claim.id}`} className="text-blue-600 hover:text-blue-900 hover:underline">
                        Review →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
