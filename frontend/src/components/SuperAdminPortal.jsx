import React, { useState, useEffect } from 'react';
import {
  Users, Bot, Shield, FileText, ToggleLeft, ToggleRight,
  Trash2, Edit2, Plus, Check, X, ShieldAlert, KeyRound, AlertTriangle
} from 'lucide-react';

export default function SuperAdminPortal({ token, apiUrl }) {
  const [activeTab, setActiveTab] = useState('users');

  // -- Lists --
  const [users, setUsers] = useState([]);
  const [faqs, setFaqs] = useState([]);
  const [config, setConfig] = useState({ configs: [], mappings: [] });
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // -- Forms & Modals State --
  const [editingUser, setEditingUser] = useState(null);
  const [userForm, setUserForm] = useState({
    username: '', email: '', first_name: '', last_name: '',
    role: 'faculty', phone_number: '', password: '', status: 'active'
  });
  const [showUserModal, setShowUserModal] = useState(false);

  const [editingFaq, setEditingFaq] = useState(null);
  const [faqForm, setFaqForm] = useState({ question: '', answer: '', category: 'General' });
  const [showFaqModal, setShowFaqModal] = useState(false);

  const [courseMapForms, setCourseMapForms] = useState([]); // local mutable copy of course allocations

  // -- Data Fetching --
  const fetchData = async () => {
    setLoading(true);
    try {
      const authHeaders = { 'Authorization': `Token ${token}` };

      // Users
      const usersRes = await fetch(`${apiUrl}/api/users/`, { headers: authHeaders });
      if (!usersRes.ok) throw new Error(`Users fetch failed with status: ${usersRes.status}`);
      const usersData = await usersRes.json();
      // Ensure we only set an array to state, preventing "users.map is not a function"
      setUsers(Array.isArray(usersData) ? usersData : []);

      // FAQs
      const faqsRes = await fetch(`${apiUrl}/api/faqs/`, { headers: authHeaders });
      if (!faqsRes.ok) throw new Error(`FAQs fetch failed with status: ${faqsRes.status}`);
      const faqsData = await faqsRes.json();
      setFaqs(Array.isArray(faqsData) ? faqsData : []);

      // System Config
      const configRes = await fetch(`${apiUrl}/api/superadmin/config/`, { headers: authHeaders });
      if (!configRes.ok) throw new Error(`Config fetch failed with status: ${configRes.status}`);
      const configData = await configRes.json();
      setConfig(configData);

      // Seed course maps form
      // Fix: Safely fallback to an empty array to prevent "Cannot read properties of undefined (reading 'find')"
      const safeMappings = configData?.mappings || [];
      const initialMaps = ['MBA', 'Bsc', 'BBA', 'BCA'].map(course => {
        const existing = safeMappings.find(m => m.course_name === course);
        return {
          course_name: course,
          faculty: existing ? existing.faculty : ''
        };
      });
      setCourseMapForms(initialMaps);

      // Audit Logs
      const auditRes = await fetch(`${apiUrl}/api/superadmin/audit-logs/`, { headers: authHeaders });
      if (!auditRes.ok) throw new Error(`Audit logs fetch failed with status: ${auditRes.status}`);
      const auditData = await auditRes.json();
      setAuditLogs(Array.isArray(auditData) ? auditData : []);

    } catch (error) {
      console.error("Error fetching admin data:", error);
      // If it's a 401 error, you might want to trigger a logout function here
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  // -- USER ACTIONS --
  const handleUserSubmit = async (e) => {
    e.preventDefault();
    const url = editingUser
      ? `${apiUrl}/api/users/${editingUser.id}/`
      : `${apiUrl}/api/users/`;
    const method = editingUser ? 'PUT' : 'POST';

    // Clean payload: don't send blank password on edit
    const payload = { ...userForm };
    if (editingUser && !payload.password) delete payload.password;

    try {
      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error('Action failed');

      setShowUserModal(false);
      resetUserForm();
      fetchData();
    } catch (error) {
      alert('Error saving user. Please check if username/email is unique.');
    }
  };

  const resetUserForm = () => {
    setUserForm({
      username: '', email: '', first_name: '', last_name: '',
      role: 'faculty', phone_number: '', password: '', status: 'active'
    });
    setEditingUser(null);
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setUserForm({
      username: user.username,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      role: user.role,
      phone_number: user.phone_number || '',
      password: '', // blank by default
      status: user.status
    });
    setShowUserModal(true);
  };

  const handleToggleSuspension = async (user) => {
    const nextStatus = user.status === 'active' ? 'suspended' : 'active';
    try {
      const response = await fetch(`${apiUrl}/api/users/${user.id}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`
        },
        body: JSON.stringify({ status: nextStatus })
      });
      if (!response.ok) throw new Error('Failed to update status');
      fetchData();
    } catch (error) {
      alert('Error updating user status.');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      const response = await fetch(`${apiUrl}/api/users/${userId}/`, {
        method: 'DELETE',
        headers: { 'Authorization': `Token ${token}` }
      });
      if (!response.ok) throw new Error('Deletion failed');
      fetchData();
    } catch (error) {
      alert('Error deleting user.');
    }
  };


  // -- FAQ ACTIONS --
  const handleFaqSubmit = async (e) => {
    e.preventDefault();
    const url = editingFaq ? `${apiUrl}/api/faqs/${editingFaq.id}/` : `${apiUrl}/api/faqs/`;
    const method = editingFaq ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`
        },
        body: JSON.stringify(faqForm)
      });
      if (!response.ok) throw new Error('FAQ action failed');
      setShowFaqModal(false);
      resetFaqForm();
      fetchData();
    } catch (error) {
      alert('Error saving FAQ.');
    }
  };

  const resetFaqForm = () => {
    setFaqForm({ question: '', answer: '', category: 'General' });
    setEditingFaq(null);
  };

  const handleEditFaq = (faq) => {
    setEditingFaq(faq);
    setFaqForm({
      question: faq.question,
      answer: faq.answer,
      category: faq.category
    });
    setShowFaqModal(true);
  };

  const handleDeleteFaq = async (faqId) => {
    if (!window.confirm("Are you sure you want to delete this FAQ?")) return;
    try {
      const response = await fetch(`${apiUrl}/api/faqs/${faqId}/`, {
        method: 'DELETE',
        headers: { 'Authorization': `Token ${token}` }
      });
      if (!response.ok) throw new Error('FAQ deletion failed');
      fetchData();
    } catch (error) {
      alert('Error deleting FAQ.');
    }
  };


  // -- ROUTING CONFIG ACTIONS --
  const handleConfigSave = async () => {
    const currentRoutingLogic = config.configs.find(c => c.key === 'routing_logic')?.value || 'round_robin';

    // Map data
    const mappings = courseMapForms.filter(m => m.faculty !== '').map(m => ({
      course_name: m.course_name,
      faculty: parseInt(m.faculty)
    }));

    try {
      const response = await fetch(`${apiUrl}/api/superadmin/config/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`
        },
        body: JSON.stringify({
          configs: [
            { key: 'routing_logic', value: currentRoutingLogic }
          ],
          mappings: mappings
        })
      });

      if (!response.ok) throw new Error('Config save failed');
      alert('Configuration settings updated successfully!');
      fetchData();
    } catch (error) {
      alert('Error saving routing configurations.');
    }
  };

  const handleToggleRoutingLogic = async () => {
    const currentConfig = config.configs.find(c => c.key === 'routing_logic');
    const nextVal = currentConfig?.value === 'course_based' ? 'round_robin' : 'course_based';

    try {
      const response = await fetch(`${apiUrl}/api/superadmin/config/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`
        },
        body: JSON.stringify({
          configs: [{ key: 'routing_logic', value: nextVal }],
          mappings: config.mappings
        })
      });
      if (!response.ok) throw new Error('Toggle failed');
      fetchData();
    } catch (error) {
      console.error(error);
    }
  };

  const handleCourseMapChange = (course, val) => {
    setCourseMapForms(prev => prev.map(m => m.course_name === course ? { ...m, faculty: val } : m));
  };

  const getFacultyOptions = () => {
    return users.filter(u => u.role === 'faculty' && u.status === 'active');
  };

  return (
    <div className="container py-4">
      {/* Tab Navigation */}
      <div className="d-flex align-items-center justify-content-between mb-4 border-bottom border-dark pb-3 animate-fade-in-up">
        <div>
          <h2 className="gradient-text-gold fw-bold m-0">Super Admin Settings</h2>
          <p className="text-muted m-0 small">Technical configurations, accounts provisioning, FAQ management, and security audit trail.</p>
        </div>
        <div className="d-flex gap-2">
          <button
            onClick={() => setActiveTab('users')}
            className={`btn btn-sm ${activeTab === 'users' ? 'btn-gold' : 'btn-outline-glass'} d-flex align-items-center gap-1`}
          >
            <Users size={16} /> Users
          </button>
          <button
            onClick={() => setActiveTab('routing')}
            className={`btn btn-sm ${activeTab === 'routing' ? 'btn-gold' : 'btn-outline-glass'} d-flex align-items-center gap-1`}
          >
            <Shield size={16} /> Routing Logic
          </button>
          <button
            onClick={() => setActiveTab('faq')}
            className={`btn btn-sm ${activeTab === 'faq' ? 'btn-gold' : 'btn-outline-glass'} d-flex align-items-center gap-1`}
          >
            <Bot size={16} /> FAQ chatbot
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`btn btn-sm ${activeTab === 'audit' ? 'btn-gold' : 'btn-outline-glass'} d-flex align-items-center gap-1`}
          >
            <FileText size={16} /> Audit Logs
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-warning" role="status"></div>
          <p className="text-muted mt-2">Loading data panel...</p>
        </div>
      ) : (
        <div className="animate-fade-in-up">

          {/* TAB 1: USERS PANEL */}
          {activeTab === 'users' && (
            <div className="glass-panel p-4">
              <div className="d-flex align-items-center justify-content-between mb-3 border-bottom border-dark pb-2">
                <h5 className="gradient-text-gold fw-bold m-0">Provision Institutional Accounts</h5>
                <button
                  onClick={() => { resetUserForm(); setShowUserModal(true); }}
                  className="btn btn-emerald btn-sm d-flex align-items-center gap-1"
                >
                  <Plus size={16} /> Add User
                </button>
              </div>

              <div className="table-responsive">
                <table className="table table-hover align-middle">
                  <thead>
                    <tr className="table-secondary">
                      <th>USERNAME</th>
                      <th>EMAIL</th>
                      <th>ROLE</th>
                      <th>PHONE</th>
                      <th>STATUS</th>
                      <th className="text-center">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u.id}>
                        <td>
                          <div className="fw-bold text-dark">{u.username}</div>
                          <div className="text-muted small">{u.first_name} {u.last_name}</div>
                        </td>
                        <td>{u.email}</td>
                        <td>
                          <span className={`badge-role badge-${u.role.replace('_', '-')}`}>
                            {u.role.toUpperCase().replace('_', ' ')}
                          </span>
                        </td>
                        <td className="text-muted small">{u.phone_number || 'N/A'}</td>
                        <td>
                          <span className={`badge bg-${u.status === 'active' ? 'success' : 'danger'}`}>
                            {u.status.toUpperCase()}
                          </span>
                        </td>
                        <td>
                          <div className="d-flex align-items-center justify-content-center gap-2">
                            <button
                              onClick={() => handleToggleSuspension(u)}
                              className={`btn btn-sm ${u.status === 'active' ? 'btn-outline-danger' : 'btn-success'}`}
                              title={u.status === 'active' ? 'Suspend Account' : 'Activate Account'}
                            >
                              {u.status === 'active' ? 'Suspend' : 'Activate'}
                            </button>
                            <button
                              onClick={() => handleEditUser(u)}
                              className="btn btn-sm btn-outline-glass text-warning"
                              title="Edit"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={() => handleDeleteUser(u.id)}
                              className="btn btn-sm btn-outline-glass text-danger"
                              title="Delete"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: ROUTING CONFIG PANEL */}
          {activeTab === 'routing' && (
            <div className="row g-4">

              {/* Routing Engine Toggle */}
              <div className="col-md-5">
                <div className="glass-panel p-4 h-100">
                  <h5 className="text-dark fw-bold mb-3 border-bottom border-dark pb-2">Allocation Algorithm Engine</h5>
                  <p className="text-muted small mb-4">
                    The routing engine directs incoming student inquiries dynamically to active faculty members.
                  </p>

                  <div className="d-flex align-items-center justify-content-between p-3 rounded mb-4" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div>
                      <div className="fw-bold text-dark">
                        {config.configs.find(c => c.key === 'routing_logic')?.value === 'course_based'
                          ? 'Course-Based Routing'
                          : 'Round-Robin Routing'}
                      </div>
                      <span className="text-muted small">Current active routing engine</span>
                    </div>
                    <button
                      onClick={handleToggleRoutingLogic}
                      className="btn p-0 border-0 bg-transparent text-warning"
                      style={{ cursor: 'pointer' }}
                    >
                      {config.configs.find(c => c.key === 'routing_logic')?.value === 'course_based' ? (
                        <ToggleRight size={48} />
                      ) : (
                        <ToggleLeft size={48} />
                      )}
                    </button>
                  </div>

                  <div className="p-3 rounded small bg-opacity-10 bg-warning text-warning d-flex gap-2">
                    <ShieldAlert size={28} className="flex-shrink-0" />
                    <div>
                      <strong>Round-Robin Routing:</strong> Distributes leads sequentially among all active faculty members.<br />
                      <strong>Course-Based Routing:</strong> Maps specific courses to corresponding faculty. If no mapping exists or the faculty is suspended, it falls back to general round-robin distribution.
                    </div>
                  </div>
                </div>
              </div>

              {/* Course Mapping Panel */}
              <div className="col-md-7">
                <div className="glass-panel p-4 h-100">
                  <h5 className="text-dark fw-bold mb-3 border-bottom border-dark pb-2">Course to Faculty Mapping</h5>
                  <p className="text-muted small mb-4">
                    Define course-based routing maps. (Only applicable when Course-Based Routing is active).
                  </p>

                  <div className="d-flex flex-column gap-3 mb-4">
                    {courseMapForms.map(map => (
                      <div key={map.course_name} className="row align-items-center">
                        <div className="col-sm-4">
                          <strong className="text-dark">{map.course_name}</strong>
                        </div>
                        <div className="col-sm-8">
                          <select
                            value={map.faculty}
                            onChange={(e) => handleCourseMapChange(map.course_name, e.target.value)}
                            className="form-select text-dark"
                          >
                            <option value="">-- No Mapping (Use Fallback Round Robin) --</option>
                            {getFacultyOptions().map(f => (
                              <option key={f.id} value={f.id}>
                                {f.first_name} {f.last_name} ({f.username})
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={handleConfigSave}
                    className="btn btn-gold w-100 py-2"
                  >
                    Save Allocations Configuration
                  </button>
                </div>
              </div>

            </div>
          )}

          {/* TAB 3: CHATBOT FAQ EDITOR */}
          {activeTab === 'faq' && (
            <div className="glass-panel p-4">
              <div className="d-flex align-items-center justify-content-between mb-3 border-bottom border-dark pb-2">
                <h5 className="gradient-text-gold fw-bold m-0">Manage Chatbot Knowledge Base</h5>
                <button
                  onClick={() => { resetFaqForm(); setShowFaqModal(true); }}
                  className="btn btn-emerald btn-sm d-flex align-items-center gap-1"
                >
                  <Plus size={16} /> Add FAQ Q&A
                </button>
              </div>

              <div className="table-responsive" style={{ maxHeight: '500px', overflowY: 'auto' }}>
                <table className="table table-hover align-middle">
                  <thead>
                    <tr className="table-secondary">
                      <th>QUESTION</th>
                      <th>ANSWER</th>
                      <th>CATEGORY</th>
                      <th className="text-center">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {faqs.map(faq => (
                      <tr key={faq.id}>
                        <td className="fw-bold text-dark small" style={{ width: '30%' }}>{faq.question}</td>
                        <td className="text-muted small" style={{ width: '45%' }}>{faq.answer}</td>
                        <td><span className="badge bg-secondary">{faq.category}</span></td>
                        <td>
                          <div className="d-flex align-items-center justify-content-center gap-2">
                            <button
                              onClick={() => handleEditFaq(faq)}
                              className="btn btn-sm btn-outline-glass text-warning"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={() => handleDeleteFaq(faq.id)}
                              className="btn btn-sm btn-outline-glass text-danger"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: AUDIT LOGS VIEW */}
          {activeTab === 'audit' && (
            <div className="glass-panel p-4">
              <h5 className="text-dark fw-bold mb-3 border-bottom border-dark pb-2">Security Audit Trail Log</h5>

              <div className="table-responsive" style={{ maxHeight: '500px', overflowY: 'auto' }}>
                <table className="table table-striped table-hover align-middle small">
                  <thead>
                    <tr className="table-secondary">
                      <th>TIMESTAMP</th>
                      <th>OPERATOR</th>
                      <th>ACTION EVENT</th>
                      <th>IP ADDRESS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditLogs.map(log => (
                      <tr key={log.id}>
                        <td className="text-muted">{new Date(log.created_at).toLocaleString()}</td>
                        <td>
                          <span className={log.username ? "text-warning fw-semibold" : "text-muted"}>
                            {log.username || "System (Anonymous)"}
                          </span>
                        </td>
                        <td className="text-dark">{log.action}</td>
                        <td className="text-muted font-monospace">{log.ip_address}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      )}

      {/* 1. USER MODAL */}
      {showUserModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(2, 6, 17, 0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1060 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content glass-panel border border-light border-opacity-10 text-dark" style={{ width: '450px', padding: '2rem' }}>
              <div className="d-flex align-items-center justify-content-between mb-4 border-bottom border-dark pb-2">
                <h4 className="modal-title fw-bold text-dark">
                  {editingUser ? 'Edit User Account' : 'Create New Account'}
                </h4>
                <button onClick={() => setShowUserModal(false)} className="btn-close "></button>
              </div>

              <form onSubmit={handleUserSubmit}>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label text-muted small">Username</label>
                    <input
                      type="text"
                      value={userForm.username}
                      onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                      className="form-control"
                      required
                      disabled={editingUser !== null}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label text-muted small">Role</label>
                    <select
                      value={userForm.role}
                      onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                      className="form-select"
                    >
                      <option value="super_admin">Super Admin</option>
                      <option value="admin">Admin</option>
                      <option value="faculty">Faculty</option>
                    </select>
                  </div>
                  <div className="col-12">
                    <label className="form-label text-muted small">Email Address</label>
                    <input
                      type="email"
                      value={userForm.email}
                      onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                      className="form-control"
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label text-muted small">First Name</label>
                    <input
                      type="text"
                      value={userForm.first_name}
                      onChange={(e) => setUserForm({ ...userForm, first_name: e.target.value })}
                      className="form-control"
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label text-muted small">Last Name</label>
                    <input
                      type="text"
                      value={userForm.last_name}
                      onChange={(e) => setUserForm({ ...userForm, last_name: e.target.value })}
                      className="form-control"
                    />
                  </div>
                  <div className="col-md-12">
                    <label className="form-label text-muted small">Phone Number</label>
                    <input
                      type="text"
                      value={userForm.phone_number}
                      onChange={(e) => setUserForm({ ...userForm, phone_number: e.target.value })}
                      placeholder="e.g. +91 9876543210"
                      className="form-control"
                    />
                  </div>
                  <div className="col-12">
                    <label className="form-label text-muted small">
                      {editingUser ? 'Password (Leave blank to keep current)' : 'Password'}
                    </label>
                    <div className="position-relative">
                      <input
                        type="password"
                        value={userForm.password}
                        onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                        className="form-control"
                        required={!editingUser}
                      />
                    </div>
                  </div>
                </div>

                <div className="d-flex gap-2 mt-4">
                  <button type="button" onClick={() => setShowUserModal(false)} className="btn btn-outline-glass flex-grow-1">Cancel</button>
                  <button type="submit" className="btn btn-emerald flex-grow-1">Save Account</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* 2. FAQ MODAL */}
      {showFaqModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(2, 6, 17, 0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1060 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content glass-panel border border-light border-opacity-10 text-dark" style={{ width: '450px', padding: '2rem' }}>
              <div className="d-flex align-items-center justify-content-between mb-4 border-bottom border-dark pb-2">
                <h4 className="modal-title fw-bold text-dark">
                  {editingFaq ? 'Edit FAQ Q&A' : 'Create Chatbot FAQ'}
                </h4>
                <button onClick={() => setShowFaqModal(false)} className="btn-close "></button>
              </div>

              <form onSubmit={handleFaqSubmit}>
                <div className="row g-3">
                  <div className="col-12">
                    <label className="form-label text-muted small">Category</label>
                    <input
                      type="text"
                      value={faqForm.category}
                      onChange={(e) => setFaqForm({ ...faqForm, category: e.target.value })}
                      placeholder="e.g. Fees, Placements, Courses"
                      className="form-control"
                      required
                    />
                  </div>
                  <div className="col-12">
                    <label className="form-label text-muted small">Question Prompt</label>
                    <input
                      type="text"
                      value={faqForm.question}
                      onChange={(e) => setFaqForm({ ...faqForm, question: e.target.value })}
                      placeholder="e.g. What is the intake capacity for MCA?"
                      className="form-control"
                      required
                    />
                  </div>
                  <div className="col-12">
                    <label className="form-label text-muted small">Answer Text</label>
                    <textarea
                      rows="4"
                      value={faqForm.answer}
                      onChange={(e) => setFaqForm({ ...faqForm, answer: e.target.value })}
                      placeholder="Enter details answers that chatbot will reference..."
                      className="form-control"
                      required
                    ></textarea>
                  </div>
                </div>

                <div className="d-flex gap-2 mt-4">
                  <button type="button" onClick={() => setShowFaqModal(false)} className="btn btn-outline-glass flex-grow-1">Cancel</button>
                  <button type="submit" className="btn btn-emerald flex-grow-1">Save FAQ</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
