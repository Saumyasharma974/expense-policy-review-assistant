import { useState } from 'react';
import { useParams, Link } from 'react-router';
import { useClaim, useAnalyzeClaim, useReviewClaim } from '../api';
import type { ReviewActionPayload } from 'shared';

export default function ClaimReview() {
  const { id } = useParams();
  const { data: claim, isLoading, isError } = useClaim(id);
  const analyzeMutation = useAnalyzeClaim();
  const reviewMutation = useReviewClaim();

  const [reason, setReason] = useState('');
  const [classificationOverride, setClassificationOverride] = useState('');
  const [actionError, setActionError] = useState('');

  if (isLoading) return <div className="p-8 text-center text-gray-500">Loading claim details...</div>;
  if (isError || !claim) return <div className="p-8 text-center text-red-500">Unable to load claim. <Link to="/" className="underline hover:text-red-700">Go back</Link></div>;

  const handleReviewAction = async (action: ReviewActionPayload['action']) => {
    setActionError('');
    if (['REJECT', 'REQUEST_CLARIFICATION', 'OVERRIDE_CLASSIFICATION'].includes(action) && !reason.trim()) {
      setActionError('Reason is required for this action.');
      return;
    }
    if (action === 'OVERRIDE_CLASSIFICATION' && !classificationOverride.trim()) {
      setActionError('New classification is required for override.');
      return;
    }
    if (action === 'APPROVE' && !window.confirm('Are you sure you want to approve this claim?')) {
      return;
    }

    try {
      await reviewMutation.mutateAsync({
        id: claim.id,
        payload: { action, reason, classificationOverride }
      });
      setReason('');
      setClassificationOverride('');
    } catch (err: any) {
      setActionError(err.message || 'Action failed');
    }
  };

  const aiFinding = claim.aiFindings?.[0]; // Get latest AI finding

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      <Link to="/" className="text-blue-600 hover:underline mb-4 inline-block font-medium">← Back to Dashboard</Link>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Claim Info & Validation */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white shadow rounded-lg border border-gray-200 p-6">
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-xl font-bold text-gray-800">Claim Information</h2>
              <span className={`px-3 py-1 text-sm font-semibold rounded-full ${
                claim.finalStatus === 'APPROVED' ? 'bg-green-100 text-green-800' :
                claim.finalStatus === 'REJECTED' ? 'bg-red-100 text-red-800' :
                claim.finalStatus === 'NEEDS_CLARIFICATION' ? 'bg-yellow-100 text-yellow-800' :
                'bg-blue-100 text-blue-800'
              }`}>
                {claim.finalStatus.replace(/_/g, ' ')}
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-y-4 gap-x-6">
              <div><span className="block text-sm text-gray-500">Date</span><span className="font-medium">{new Date(claim.date).toLocaleDateString()}</span></div>
              <div><span className="block text-sm text-gray-500">Category</span><span className="font-medium">{claim.humanOverrideClassification || claim.category} {claim.humanOverrideClassification && <span className="text-xs text-orange-600 ml-1">(Overridden)</span>}</span></div>
              <div><span className="block text-sm text-gray-500">Amount</span><span className="font-bold text-lg">{(claim.amountMinorUnits / 100).toFixed(2)} {claim.currency}</span></div>
              <div><span className="block text-sm text-gray-500">Receipt Available</span><span className="font-medium">{claim.receiptAvailable ? 'Yes' : 'No'}</span></div>
              <div className="col-span-2"><span className="block text-sm text-gray-500">Description</span><p className="mt-1 text-gray-800 bg-gray-50 p-3 rounded">{claim.description}</p></div>
            </div>
          </div>

          {/* Deterministic Validation */}
          <div className="bg-white shadow rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Deterministic Validation</h2>
            {claim.deterministic?.length === 0 ? (
              <p className="text-gray-500 italic">No validation issues found.</p>
            ) : (
              <ul className="space-y-3">
                {claim.deterministic?.map((finding: any) => (
                  <li key={finding.id} className={`p-3 border rounded-md flex items-start space-x-3 ${
                    finding.severity === 'ERROR' ? 'bg-red-50 border-red-200 text-red-900' :
                    finding.severity === 'WARNING' ? 'bg-yellow-50 border-yellow-200 text-yellow-900' :
                    'bg-blue-50 border-blue-200 text-blue-900'
                  }`}>
                    <span className="font-bold text-xs uppercase tracking-wide mt-0.5">{finding.severity}</span>
                    <div>
                      <strong className="block">{finding.code}</strong>
                      <p className="text-sm mt-1">{finding.message}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* AI Analysis Section */}
          <div className="bg-white shadow rounded-lg border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">AI Assessment</h2>
              <button 
                onClick={() => analyzeMutation.mutate(claim.id)} 
                disabled={analyzeMutation.isPending}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors disabled:opacity-50"
              >
                {analyzeMutation.isPending ? 'Analyzing...' : (aiFinding ? 'Retry AI Analysis' : 'Analyze with AI')}
              </button>
            </div>

            {analyzeMutation.isError && (
              <div className="mb-4 bg-red-50 text-red-700 p-3 rounded border border-red-200">
                Analysis failed. Please try again.
              </div>
            )}
            
            {analyzeMutation.isSuccess && !aiFinding && (
              <div className="mb-4 bg-green-50 text-green-700 p-3 rounded border border-green-200">
                Analysis completed. Please refresh or check findings below.
              </div>
            )}

            {!aiFinding ? (
              <p className="text-gray-500 italic">No AI analysis available for this claim.</p>
            ) : (
              <div className="space-y-6 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                    <span className="block text-sm text-gray-500 uppercase tracking-wide font-semibold mb-1">AI Classification</span>
                    <span className="text-lg font-bold text-gray-800">{aiFinding.classification}</span>
                    <span className="ml-2 text-sm text-gray-500">{aiFinding.confidence}% confidence</span>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                    <span className="block text-sm text-gray-500 uppercase tracking-wide font-semibold mb-1">Compliance Status</span>
                    <span className="text-lg font-bold text-gray-800">{aiFinding.complianceStatus}</span>
                    {aiFinding.uncertainty && <span className="ml-2 text-xs bg-orange-200 text-orange-800 px-2 py-0.5 rounded-full font-bold">Uncertain</span>}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-800 mb-1">Explanation</h3>
                  <p className="text-gray-700 bg-blue-50/50 p-3 rounded border border-blue-100">{aiFinding.explanation}</p>
                </div>

                {aiFinding.missingInformation?.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-1">Missing Information</h3>
                    <ul className="list-disc list-inside text-gray-700 bg-yellow-50/50 p-3 rounded border border-yellow-100">
                      {aiFinding.missingInformation.map((info: string, i: number) => <li key={i}>{info}</li>)}
                    </ul>
                  </div>
                )}
                
                {aiFinding.clarificationQuestion && (
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-1">Suggested Clarification Question</h3>
                    <p className="text-gray-700 italic border-l-4 border-indigo-300 pl-3 py-1">{aiFinding.clarificationQuestion}</p>
                  </div>
                )}

                <div>
                  <h3 className="font-semibold text-gray-800 mb-1">Policy Source & AI Evidence</h3>
                  {aiFinding.policySectionId ? (
                    <div className="bg-gray-50 p-3 rounded border border-gray-200">
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2">Verified Exact Evidence</span>
                      <blockquote className="border-l-4 border-green-400 pl-3 py-1 text-gray-700 font-mono text-sm bg-white p-2">
                        {aiFinding.policyEvidence}
                      </blockquote>
                    </div>
                  ) : (
                    <div className="bg-red-50 text-red-800 p-3 rounded border border-red-200 font-medium text-sm">
                      Evidence could not be verified. Manual review required.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Human Review Actions & History */}
        <div className="space-y-6">
          <div className="bg-white shadow rounded-lg border border-gray-200 p-6 sticky top-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Human Review Actions</h2>
            
            {actionError && (
              <div className="mb-4 bg-red-50 text-red-700 p-3 rounded border border-red-200 text-sm">
                {actionError}
              </div>
            )}
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason / Clarification Note</label>
                <textarea 
                  className="w-full border-gray-300 rounded-md shadow-sm border p-2 focus:ring-blue-500 focus:border-blue-500" 
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Required for Reject, Clarify, or Override"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={() => handleReviewAction('APPROVE')}
                  disabled={reviewMutation.isPending}
                  className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded transition-colors disabled:opacity-50"
                >
                  Approve
                </button>
                <button 
                  onClick={() => handleReviewAction('REJECT')}
                  disabled={reviewMutation.isPending}
                  className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded transition-colors disabled:opacity-50"
                >
                  Reject
                </button>
              </div>
              
              <button 
                onClick={() => handleReviewAction('REQUEST_CLARIFICATION')}
                disabled={reviewMutation.isPending}
                className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-medium py-2 px-4 rounded transition-colors disabled:opacity-50"
              >
                Request Clarification
              </button>

              <hr className="my-4" />
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Override AI Classification</label>
                <div className="flex space-x-2">
                  <input 
                    type="text" 
                    placeholder="New Category"
                    className="flex-1 border-gray-300 rounded-md shadow-sm border p-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                    value={classificationOverride}
                    onChange={(e) => setClassificationOverride(e.target.value)}
                  />
                  <button 
                    onClick={() => handleReviewAction('OVERRIDE_CLASSIFICATION')}
                    disabled={reviewMutation.isPending}
                    className="bg-gray-800 hover:bg-gray-900 text-white font-medium py-2 px-3 rounded text-sm transition-colors disabled:opacity-50"
                  >
                    Override
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Review History</h2>
            <div className="space-y-4">
              {claim.reviews?.map((review: any) => (
                <div key={review.id} className="text-sm border-l-2 border-gray-200 pl-3 pb-2 relative">
                  <div className="absolute w-2 h-2 bg-gray-400 rounded-full -left-[5px] top-1.5"></div>
                  <div className="flex justify-between items-baseline mb-1">
                    <span className="font-bold text-gray-700">{review.actorType}</span>
                    <span className="text-xs text-gray-500">{new Date(review.createdAt).toLocaleString()}</span>
                  </div>
                  <div className="font-medium text-blue-800">{review.action}</div>
                  {review.reason && <div className="text-gray-600 italic mt-1">"{review.reason}"</div>}
                </div>
              ))}
              {(!claim.reviews || claim.reviews.length === 0) && (
                <p className="text-sm text-gray-500 italic">No history available.</p>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
