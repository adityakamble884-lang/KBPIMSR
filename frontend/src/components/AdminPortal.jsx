import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, LineChart, Line
} from 'recharts';
import { 
  Users, UserCheck, Eye, Clipboard, Percent, Download, Calendar, RefreshCw 
} from 'lucide-react';

export default function AdminPortal({ token, apiUrl }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exportStart, setExportStart] = useState('');
  const [exportEnd, setExportEnd] = useState('');
  const [exporting, setExporting] = useState(false);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${apiUrl}/api/admin/analytics/`, {
        headers: {
          'Authorization': `Token ${token}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch analytics');
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const handleExport = async (e) => {
    e.preventDefault();
    setExporting(true);
    try {
      let url = `${apiUrl}/api/admin/export/`;
      const params = [];
      if (exportStart) params.push(`start_date=${exportStart}`);
      if (exportEnd) params.push(`end_date=${exportEnd}`);
      if (params.length > 0) url += `?${params.join('&')}`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Token ${token}`
        }
      });
      if (!response.ok) throw new Error('Export failed');
      
      const blob = await response.blob();
      const fileUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = fileUrl;
      link.setAttribute('download', `ems_enquiries_${exportStart || 'all'}_to_${exportEnd || 'all'}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      alert('Error exporting report.');
    } finally {
      setExporting(false);
    }
  };

  if (loading && !data) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-warning" role="status"></div>
        <p className="text-muted mt-2">Loading analytics dashboard...</p>
      </div>
    );
  }

  const kpis = data?.kpis || {};
  const COLORS = ['#10b981', '#f59e0b', '#3b82f6', '#8b5cf6', '#ec4899', '#f43f5e', '#14b8a6', '#f97316'];

  return (
    <div className="container py-4">
      {/* Header */}
      <div className="d-flex align-items-center justify-content-between mb-4 border-bottom border-dark pb-3 animate-fade-in-up">
        <div>
          <h2 className="gradient-text-gold fw-bold m-0">Admin Analytics Dashboard</h2>
          <p className="text-muted m-0 small">Gain strategic visibility into lead conversions, demographics, and faculty efficiency.</p>
        </div>
        <button 
          onClick={fetchAnalytics} 
          className="btn btn-outline-glass d-flex align-items-center gap-2"
          disabled={loading}
        >
          <RefreshCw size={16} className={loading ? 'spin-anim' : ''} />
          Refresh Charts
        </button>
      </div>

      {/* KPI Cards */}
      <div className="row g-3 mb-4 animate-fade-in-up">
        <div className="col-md-4 col-xl-2 col-sm-6">
          <div className="glass-panel p-3 d-flex align-items-center justify-content-between">
            <div>
              <span className="text-muted small">TOTAL LEADS</span>
              <h3 className="text-dark fw-bold m-0 mt-1">{kpis.total_leads || 0}</h3>
            </div>
            <div className="p-3 bg-primary bg-opacity-10 text-primary rounded-circle"><Users size={20} /></div>
          </div>
        </div>
        <div className="col-md-4 col-xl-2 col-sm-6">
          <div className="glass-panel p-3 d-flex align-items-center justify-content-between">
            <div>
              <span className="text-muted small">CAMPUS VISITS</span>
              <h3 className="text-dark fw-bold m-0 mt-1">{kpis.walk_ins || 0}</h3>
            </div>
            <div className="p-3 bg-info bg-opacity-10 text-info rounded-circle"><Eye size={20} /></div>
          </div>
        </div>
        <div className="col-md-4 col-xl-2 col-sm-6">
          <div className="glass-panel p-3 d-flex align-items-center justify-content-between">
            <div>
              <span className="text-muted small">CONVERSIONS</span>
              <h3 className="text-emerald fw-bold m-0 mt-1">{kpis.conversions || 0}</h3>
            </div>
            <div className="p-3 bg-success bg-opacity-10 text-success rounded-circle"><UserCheck size={20} /></div>
          </div>
        </div>
        <div className="col-md-4 col-xl-2 col-sm-6">
          <div className="glass-panel p-3 d-flex align-items-center justify-content-between">
            <div>
              <span className="text-muted small">IN-PROGRESS</span>
              <h3 className="text-warning fw-bold m-0 mt-1">{kpis.in_progress || 0}</h3>
            </div>
            <div className="p-3 bg-warning bg-opacity-10 text-warning rounded-circle"><Clipboard size={20} /></div>
          </div>
        </div>
        <div className="col-md-4 col-xl-2 col-sm-6">
          <div className="glass-panel p-3 d-flex align-items-center justify-content-between">
            <div>
              <span className="text-muted small">DROPPED</span>
              <h3 className="text-danger fw-bold m-0 mt-1">{kpis.dropped || 0}</h3>
            </div>
            <div className="p-3 bg-danger bg-opacity-10 text-danger rounded-circle"><Clipboard size={20} /></div>
          </div>
        </div>
        <div className="col-md-4 col-xl-2 col-sm-6">
          <div className="glass-panel p-3 d-flex align-items-center justify-content-between">
            <div>
              <span className="text-muted small">CONV. RATE</span>
              <h3 className="text-gold fw-bold m-0 mt-1">{kpis.conversion_rate || 0}%</h3>
            </div>
            <div className="p-3 bg-warning bg-opacity-10 text-warning rounded-circle"><Percent size={20} /></div>
          </div>
        </div>
      </div>

      {/* Analytics Charts */}
      <div className="row g-4 mb-4">
        
        {/* Lead Volume Trend */}
        <div className="col-lg-8 animate-fade-in-up">
          <div className="glass-panel p-4 h-100">
            <h5 className="text-dark fw-bold mb-4">Lead Registration Volume Trend (Last 15 Days)</h5>
            <div style={{ width: '100%', height: '300px' }}>
              <ResponsiveContainer>
                <AreaChart data={data?.trend || []}>
                  <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} allowDecimals={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#112240', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }} />
                  <Area type="monotone" dataKey="count" stroke="#f59e0b" strokeWidth={2} fillOpacity={1} fill="url(#colorCount)" name="Leads" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Course distribution */}
        <div className="col-lg-4 animate-fade-in-up">
          <div className="glass-panel p-4 h-100">
            <h5 className="text-dark fw-bold mb-4">Course Distribution</h5>
            <div style={{ width: '100%', height: '300px' }} className="d-flex align-items-center justify-content-center">
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={data?.courses || []}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="count"
                    nameKey="course_of_interest"
                    label={({ course_of_interest, count }) => `${course_of_interest}: ${count}`}
                  >
                    {(data?.courses || []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#112240', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Faculty Performance */}
        <div className="col-lg-7 animate-fade-in-up">
          <div className="glass-panel p-4 h-100">
            <h5 className="text-dark fw-bold mb-4">Faculty Allocation & Conversions</h5>
            <div style={{ width: '100%', height: '300px' }}>
              <ResponsiveContainer>
                <BarChart data={data?.faculty_performance || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} />
                  <Tooltip contentStyle={{ backgroundColor: '#112240', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }} />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Bar dataKey="assigned" fill="#3b82f6" name="Leads Assigned" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="converted" fill="#10b981" name="Admissions Secured" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Demographics Area */}
        <div className="col-lg-5 animate-fade-in-up">
          <div className="glass-panel p-4 h-100">
            <h5 className="text-dark fw-bold mb-4">Top Lead Locations (City/Village)</h5>
            <div style={{ width: '100%', height: '300px' }} className="d-flex align-items-center justify-content-center">
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={data?.demographics || []}
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    dataKey="count"
                    nameKey="city_village_area"
                    label={({ city_village_area, count }) => `${city_village_area}: ${count}`}
                  >
                    {(data?.demographics || []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#112240', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Previous Colleges */}
        <div className="col-lg-6 animate-fade-in-up">
          <div className="glass-panel p-4 h-100">
            <h5 className="text-dark fw-bold mb-4">Top Feeding Colleges</h5>
            <div style={{ width: '100%', height: '300px' }}>
              <ResponsiveContainer>
                <BarChart data={data?.colleges || []} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis type="number" stroke="#94a3b8" fontSize={11} />
                  <YAxis dataKey="previous_college" type="category" stroke="#94a3b8" width={150} fontSize={10} />
                  <Tooltip contentStyle={{ backgroundColor: '#112240', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }} />
                  <Bar dataKey="count" fill="#8b5cf6" name="Students" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Reports Panel */}
        <div className="col-lg-6 animate-fade-in-up">
          <div className="glass-panel p-4 h-100 d-flex flex-column justify-content-between">
            <div>
              <h5 className="gradient-text-gold fw-bold mb-2">Export Leads Reports</h5>
              <p className="text-muted small mb-4">
                Select a date range below to download a detailed CSV report of all registered enquiries and historical statuses.
              </p>
              
              <form onSubmit={handleExport} className="row g-3">
                <div className="col-sm-6">
                  <label className="form-label text-muted small">Start Date</label>
                  <div className="position-relative">
                    <input 
                      type="date" 
                      value={exportStart} 
                      onChange={(e) => setExportStart(e.target.value)} 
                      className="form-control ps-5" 
                    />
                    <Calendar size={16} className="position-absolute text-muted" style={{ left: '16px', top: '14px' }} />
                  </div>
                </div>
                <div className="col-sm-6">
                  <label className="form-label text-muted small">End Date</label>
                  <div className="position-relative">
                    <input 
                      type="date" 
                      value={exportEnd} 
                      onChange={(e) => setExportEnd(e.target.value)} 
                      className="form-control ps-5" 
                    />
                    <Calendar size={16} className="position-absolute text-muted" style={{ left: '16px', top: '14px' }} />
                  </div>
                </div>
                
                <div className="col-12 mt-4">
                  <button 
                    type="submit" 
                    className="btn btn-gold w-100 d-flex align-items-center justify-content-center gap-2 py-3"
                    disabled={exporting}
                  >
                    <Download size={18} />
                    {exporting ? 'Generating Report...' : 'Export to CSV'}
                  </button>
                </div>
              </form>
            </div>

            <div className="border-top border-dark pt-3 mt-4 text-center">
              <span className="text-muted small">Report complies with Rayat Shikshan Sanstha guidelines.</span>
            </div>
          </div>
        </div>

      </div>
      <style>{`
        @keyframes spin {
          100% { transform: rotate(360deg); }
        }
        .spin-anim {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
}
