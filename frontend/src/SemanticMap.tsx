// @ts-ignore
import React, { useState, useEffect } from 'react';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';
import {getJobEmbeddingsVisualization} from './api/visualize.ts';

interface DataPoint {
  id: string;
  label: string;
  x: number;
  y: number;
  type: 'job_listing' | 'candidate';
  match_score: number;
  primary_skills: string[];
  application_id?: number;
  candidate_id?: number;
}

interface SemanticMapProps {
  jobId: number;
  onCandidateClick?: (candidateId: number, applicationId: number) => void;
}

const SemanticMap: React.FC<SemanticMapProps> = ({ jobId, onCandidateClick }) => {
  const [data, setData] = useState<DataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [jobTitle, setJobTitle] = useState<string>('');

  useEffect(() => {
    fetchVisualizationData();
  }, [jobId]);

  const fetchVisualizationData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getJobEmbeddingsVisualization(jobId);

      if (response.visualization_data) {
        setData(response.visualization_data);
        setJobTitle(response.job_title || 'Job');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load visualization');
      console.error('Error fetching visualization:', err);
    } finally {
      setLoading(false);
    }
  };

  const getMatchScoreColor = (score: number): string => {
    if (score >= 0.8) return '#10b981'; // Green - high match
    if (score >= 0.6) return '#f59e0b'; // Yellow - medium match
    if (score >= 0.4) return '#f97316'; // Orange - low match
    return '#94a3b8'; // Grey - very low match
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload as DataPoint;
      const matchPercentage = Math.round(data.match_score * 100);

      return (
        <div style={{
          background: 'rgba(255, 255, 255, 0.98)',
          padding: '12px 16px',
          borderRadius: '8px',
          border: '1px solid #e5e7eb',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          minWidth: '220px',
          maxWidth: '300px'
        }}>
          <div style={{ marginBottom: '8px' }}>
            <strong style={{ fontSize: '14px', color: '#1f2937' }}>
              {data.label}
            </strong>
          </div>

          <div style={{ marginBottom: '6px' }}>
            <span style={{
              fontSize: '12px',
              color: data.type === 'job_listing' ? '#3b82f6' : '#6b7280',
              fontWeight: 500,
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              {data.type === 'job_listing' ? '🎯 Job Listing' : '👤 Candidate'}
            </span>
          </div>

          <div style={{ marginBottom: '8px' }}>
            <span style={{
              fontSize: '18px',
              fontWeight: 'bold',
              color: data.type === 'job_listing' ? '#3b82f6' : getMatchScoreColor(data.match_score)
            }}>
              {matchPercentage}% Match
            </span>
          </div>

          {data.primary_skills && data.primary_skills.length > 0 && (
            <div>
              <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '4px' }}>
                Top Skills:
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                {data.primary_skills.map((skill, idx) => (
                  <span
                    key={idx}
                    style={{
                      padding: '2px 8px',
                      background: '#dbeafe',
                      color: '#1e40af',
                      borderRadius: '12px',
                      fontSize: '11px',
                      fontWeight: 500
                    }}
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {data.type === 'candidate' && onCandidateClick && (
            <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #e5e7eb' }}>
              <span style={{ fontSize: '11px', color: '#6b7280', fontStyle: 'italic' }}>
                Click to view candidate profile
              </span>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '500px',
        background: '#f9fafb',
        borderRadius: '8px'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" style={{ margin: '0 auto 16px' }} />
          <p style={{ color: '#6b7280', fontSize: '14px' }}>Loading semantic map...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '500px',
        background: '#fef2f2',
        borderRadius: '8px',
        border: '1px solid #fecaca'
      }}>
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <p style={{ color: '#dc2626', fontSize: '14px', marginBottom: '8px' }}>
            ⚠️ {error}
          </p>
          <button
            onClick={fetchVisualizationData}
            style={{
              padding: '8px 16px',
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '13px'
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '500px',
        background: '#f9fafb',
        borderRadius: '8px'
      }}>
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '8px' }}>
            📊 No visualization data available
          </p>
          <p style={{ color: '#9ca3af', fontSize: '12px' }}>
            Applicants need to have CV embeddings generated to appear on the map
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: '600px' }}>
      <div style={{ marginBottom: '16px', textAlign: 'center' }}>
        <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: 600, color: '#1f2937' }}>
          Semantic Embedding Map: {jobTitle}
        </h3>
        <p style={{ margin: 0, fontSize: '12px', color: '#6b7280' }}>
          Visualizing candidate proximity to job requirements (TSNE 2D projection)
        </p>
      </div>

      <ResponsiveContainer width="100%" height="90%">
        <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            type="number"
            dataKey="x"
            name="X"
            stroke="#9ca3af"
            style={{ fontSize: '12px' }}
          />
          <YAxis
            type="number"
            dataKey="y"
            name="Y"
            stroke="#9ca3af"
            style={{ fontSize: '12px' }}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />

          {/* Job listing as prominent anchor node */}
          <Scatter
            name="Job Listing"
            data={data.filter(d => d.type === 'job_listing')}
            fill="#3b82f6"
            shape="star"
            r={120}
          >
            {data.filter(d => d.type === 'job_listing').map((entry, index) => (
              <Cell key={`cell-${index}`} fill="#3b82f6" stroke="#1d4ed8" strokeWidth={3} />
            ))}
          </Scatter>

          {/* Candidates with color-coded match scores */}
          <Scatter
            name="Candidates"
            data={data.filter(d => d.type === 'candidate')}
            onClick={(entry) => {
              if (onCandidateClick && entry.application_id && entry.candidate_id) {
                onCandidateClick(entry.candidate_id, entry.application_id);
              }
            }}
            style={{ cursor: 'pointer' }}
          >
            {data.filter(d => d.type === 'candidate').map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={getMatchScoreColor(entry.match_score)}
                stroke="#ffffff"
                strokeWidth={2}
              />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>

      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '24px',
        marginTop: '16px',
        padding: '12px',
        background: '#f9fafb',
        borderRadius: '8px',
        fontSize: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: '#3b82f6', border: '2px solid #1d4ed8' }} />
          <span style={{ color: '#4b5563' }}>Job Listing</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: '#10b981' }} />
          <span style={{ color: '#4b5563' }}>High Match (≥80%)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: '#f59e0b' }} />
          <span style={{ color: '#4b5563' }}>Medium Match (60-79%)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: '#f97316' }} />
          <span style={{ color: '#4b5563' }}>Low Match (40-59%)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: '#94a3b8' }} />
          <span style={{ color: '#4b5563' }}>Very Low Match (≤40%)</span>
        </div>
      </div>
    </div>
  );
};

export default SemanticMap;