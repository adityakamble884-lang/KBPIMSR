import React, { useState, useEffect } from 'react';
import { Search, Filter, MessageSquare, Clipboard, User, Calendar, MapPin, CheckCircle, RefreshCw } from 'lucide-react';

export default function FacultyPortal({ token, apiUrl }) {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [courseFilter, setCourseFilter] = useState('');
  const [selectedLead, setSelectedLead] = useState(null);

  // Interaction Log Form State
  const [interactionNote, setInteractionNote] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [submittingLog, setSubmittingLog] = useState(false);

  const fetchLeads = async () => {
    setLoading(true);
    try {
      let url = `${apiUrl}/api/leads/?search=${searchQuery}&status=${statusFilter}&course=${courseFilter}`;
      const response = await fetch(url, {
        headers: {
          'Authorization': `Token ${token}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch leads');
      const data = await response.json();
      setLeads(data);

      // Update selected lead details if currently open
      if (selectedLead) {
        const updatedSelected = data.find(l => l.id === selectedLead.id);
        if (updatedSelected) setSelectedLead(updatedSelected);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, [searchQuery, statusFilter, courseFilter]);

  const handleLogSubmit = async (e) => {
    e.preventDefault();
    if (!interactionNote.trim()) return;
    setSubmittingLog(true);

    try {
      const response = await fetch(`${apiUrl}/api/leads/${selectedLead.id}/log_interaction/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`
        },
        body: JSON.stringify({
          note: interactionNote,
          status: newStatus || selectedLead.status
        })
      });

      if (!response.ok) throw new Error('Failed to save interaction');

      const data = await response.json();

      // Update local state
      setInteractionNote('');
      setNewStatus('');

      // Refresh leads list (which will update selectedLead details)
      await fetchLeads();

    } catch (error) {
      alert('Error updating interaction log.');
    } finally {
      setSubmittingLog(false);
    }
  };

  const getStatusText = (statusVal) => {
    const map = {
      'new_lead': 'New Lead',
      'contacted': 'Contacted',
      'in_progress': 'In-Progress',
      'campus_visited': 'Campus Visited',
      'admission_done': 'Admission Done',
      'dropped': 'Dropped'
    };
    return map[statusVal] || statusVal;
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="container py-4">

      {/* Page Header */}
      <div className="d-flex align-items-center justify-content-between mb-4 border-bottom border-dark pb-3 animate-fade-in-up">
        <div>
          <h2 className="gradient-text-gold fw-bold m-0">Faculty Lead Workspace</h2>
          <p className="text-muted m-0 small">Manage, contact, and log interactions for your assigned admissions enquiries.</p>
        </div>
        <button
          onClick={fetchLeads}
          className="btn btn-outline-glass d-flex align-items-center gap-2"
          disabled={loading}
        >
          <RefreshCw size={16} className={loading ? 'spin-anim' : ''} />
          Refresh Leads
        </button>
      </div>

      {/* Filters Panel */}
      <div className="glass-panel p-3 mb-4 animate-fade-in-up">
        <div className="row g-3">
          <div className="col-md-4">
            <div className="position-relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, email, previous college..."
                className="form-control ps-5"
              />
              <Search className="position-absolute text-muted" size={18} style={{ left: '16px', top: '14px' }} />
            </div>
          </div>
          <div className="col-md-4">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="form-select"
            >
              <option value="">All Statuses</option>
              <option value="new_lead">New Lead</option>
              <option value="contacted">Contacted</option>
              <option value="in_progress">In-Progress</option>
              <option value="campus_visited">Campus Visited</option>
              <option value="admission_done">Admission Done</option>
              <option value="dropped">Dropped</option>
            </select>
          </div>
          <div className="col-md-4">
            <select
              value={courseFilter}
              onChange={(e) => setCourseFilter(e.target.value)}
              className="form-select"
            >
              <option value="">All Courses</option>
              <option value="MBA">MBA</option>
              <option value="MCA">DBM</option>
              <option value="BBA">BBA</option>
              <option value="BCA">BCA</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="row">

        {/* Leads List */}
        <div className={selectedLead ? "col-lg-6 mb-4 animate-fade-in-up" : "col-12 mb-4 animate-fade-in-up"}>
          <div className="glass-panel overflow-hidden">
            <div className="p-3 border-bottom border-dark d-flex align-items-center justify-content-between">
              <h5 className="m-0 fw-bold text-dark">Assigned Student Leads</h5>
              <span className="badge bg-secondary">{leads.length} Active Leads</span>
            </div>

            {loading && leads.length === 0 ? (
              <div className="text-center py-5">
                <div className="spinner-border text-warning" role="status"></div>
                <p className="text-muted mt-2">Loading leads...</p>
              </div>
            ) : leads.length === 0 ? (
              <div className="text-center py-5 text-muted">
                <Clipboard size={48} className="mb-2" />
                <p>No enquiries found matching your filters.</p>
              </div>
            ) : (
              <div className="overflow-x-auto" style={{ maxHeight: '600px' }}>
                <table className="table table-hover m-0 align-middle">
                  <thead className="table-secondary">
                    <tr>
                      <th className="py-3 border-0 bg-transparent text-muted small">STUDENT</th>
                      <th className="py-3 border-0 bg-transparent text-muted small">COURSE</th>
                      <th className="py-3 border-0 bg-transparent text-muted small">CITY</th>
                      <th className="py-3 border-0 bg-transparent text-muted small">STATUS</th>
                      <th className="py-3 border-0 bg-transparent text-muted small">REGISTERED</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leads.map((lead) => (
                      <tr
                        key={lead.id}
                        onClick={() => setSelectedLead(lead)}
                        className={`clickable-row ${selectedLead && selectedLead.id === lead.id ? 'table-active border-warning' : ''}`}
                        style={{ cursor: 'pointer', transition: 'background-color 0.2s' }}
                      >
                        <td className="py-3 border-dark">
                          <div className="fw-bold text-dark">{lead.name}</div>
                          <div className="text-muted small">{lead.email} | {lead.mobile_number}</div>
                        </td>
                        <td className="py-3 border-dark">
                          <span className="badge bg-secondary">{lead.course_of_interest}</span>
                        </td>
                        <td className="py-3 border-dark text-muted small">
                          {lead.city_village_area}
                        </td>
                        <td className="py-3 border-dark">
                          <span className={`badge-status status-${lead.status}`}>
                            {getStatusText(lead.status)}
                          </span>
                        </td>
                        <td className="py-3 border-dark text-muted small">
                          {new Date(lead.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Lead Details & Log Form */}
        {selectedLead && (
          <div className="col-lg-6 animate-slide-in-right">
            <div className="glass-panel p-4 position-relative">
              <button
                onClick={() => setSelectedLead(null)}
                className="btn-close  position-absolute top-0 end-0 m-3"
              ></button>

              <div className="border-bottom border-dark pb-3 mb-4">
                <span className="text-warning fw-bold small">LEAD DETAILS</span>
                <h3 className="text-dark fw-bold mt-1 mb-2">{selectedLead.name}</h3>
                <span className={`badge-status status-${selectedLead.status} me-2`}>
                  {getStatusText(selectedLead.status)}
                </span>
                <span className="badge bg-primary">{selectedLead.course_of_interest}</span>
              </div>

              {/* Student Info Card */}
              <div className="row g-3 mb-4">
                <div className="col-sm-6">
                  <div className="p-3 rounded" style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    <div className="text-muted small d-flex align-items-center gap-1 mb-1">
                      <User size={12} /> Contact Details
                    </div>
                    <div className="text-secondary small fw-semibold">{selectedLead.mobile_number}</div>
                    <div className="text-secondary small text-truncate">{selectedLead.email}</div>
                  </div>
                </div>
                <div className="col-sm-6">
                  <div className="p-3 rounded" style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    <div className="text-muted small d-flex align-items-center gap-1 mb-1">
                      <MapPin size={12} /> Address / College
                    </div>
                    <div className="text-secondary small fw-semibold">{selectedLead.city_village_area} ({selectedLead.pincode})</div>
                    <div className="text-secondary small text-truncate" title={selectedLead.previous_college}>Prev: {selectedLead.previous_college}</div>
                  </div>
                </div>
              </div>

              {/* Interaction Notes Submission */}
              <div className="p-3 rounded mb-4" style={{ background: 'rgba(245, 158, 11, 0.03)', border: '1px solid rgba(245, 158, 11, 0.1)' }}>
                <h6 className="text-warning fw-bold mb-3 d-flex align-items-center gap-2">
                  <Clipboard size={16} /> Log New Interaction
                </h6>
                <form onSubmit={handleLogSubmit}>
                  <div className="mb-3">
                    <label className="form-label text-muted small">Notes / Discussion Summary</label>
                    <textarea
                      rows="3"
                      value={interactionNote}
                      onChange={(e) => setInteractionNote(e.target.value)}
                      placeholder="e.g. Called candidate. Requested to visit campus tomorrow with parents."
                      className="form-control"
                      required
                    ></textarea>
                  </div>
                  <div className="row g-2 align-items-end">
                    <div className="col-sm-7">
                      <label className="form-label text-muted small">Update Lead Status (Optional)</label>
                      <select
                        value={newStatus}
                        onChange={(e) => setNewStatus(e.target.value)}
                        className="form-select"
                      >
                        <option value="">-- Keep Current Status --</option>
                        <option value="new_lead">New Lead</option>
                        <option value="contacted">Contacted</option>
                        <option value="in_progress">In-Progress</option>
                        <option value="campus_visited">Campus Visited</option>
                        <option value="admission_done">Admission Done</option>
                        <option value="dropped">Dropped</option>
                      </select>
                    </div>
                    <div className="col-sm-5">
                      <button
                        type="submit"
                        className="btn btn-gold w-100 d-flex align-items-center justify-content-center gap-1"
                        disabled={submittingLog}
                      >
                        <CheckCircle size={16} />
                        {submittingLog ? 'Saving...' : 'Save Log'}
                      </button>
                    </div>
                  </div>
                </form>
              </div>

              {/* Interaction Timeline */}
              <div>
                <h6 className="text-dark fw-bold mb-3 d-flex align-items-center gap-2">
                  <MessageSquare size={16} /> Interaction History
                </h6>
                <div className="timeline-container d-flex flex-column gap-3" style={{ maxHeight: '250px', overflowY: 'auto', paddingRight: '8px' }}>
                  {selectedLead.interaction_logs && selectedLead.interaction_logs.length > 0 ? (
                    selectedLead.interaction_logs.map((log) => (
                      <div
                        key={log.id}
                        className="p-3 rounded border border-secondary"
                        style={{ background: 'rgba(255, 255, 255, 0.01)' }}
                      >
                        <div className="d-flex align-items-center justify-content-between mb-2 pb-1 border-bottom border-dark border-opacity-50">
                          <span className="text-dark small fw-bold">{log.officer_username || 'System'}</span>
                          <span className="text-muted small d-flex align-items-center gap-1">
                            <Calendar size={12} /> {formatDate(log.created_at)}
                          </span>
                        </div>
                        <p className="text-muted small m-0 text-wrap">{log.note}</p>
                        {log.status_changed_to && (
                          <div className="mt-2 d-flex align-items-center gap-2">
                            <span className="text-muted small">Status changed:</span>
                            <span className={`badge-status status-${log.status_changed_to}`}>
                              {getStatusText(log.status_changed_to)}
                            </span>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-muted small text-center m-0 py-3">No interactions logged yet.</p>
                  )}
                </div>
              </div>

            </div>
          </div>
        )}

      </div>
      <style>{`
        .clickable-row:hover {
          background-color: rgba(255, 255, 255, 0.05) !important;
        }
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
