import React, { useState } from 'react';
import { Send, CheckCircle2, User, Phone, Mail, MessageSquare, ArrowRight, ShieldCheck } from 'lucide-react';

export default function StudentPortal({ apiUrl }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile_number: '',
    previous_college: '',
    city_village_area: '',
    pincode: '',
    course_of_interest: 'MBA' // Default selected value
  });

  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpInput, setOtpInput] = useState('');
  const [otpError, setOtpError] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [assignedOfficer, setAssignedOfficer] = useState(null);
  const [submissionSuccess, setSubmissionSuccess] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmitTrigger = (e) => {
    e.preventDefault();
    setOtpError('');
    setOtpInput('');
    setShowOtpModal(true); // Open OTP dialog
  };

  const handleOtpVerify = async () => {
    // Simulated OTP verification
    if (otpInput.length !== 4) {
      setOtpError('Please enter a valid 4-digit verification code.');
      return;
    }

    // Pass OTP step, start API call to backend
    setShowOtpModal(false);
    setIsSubmitting(true);

    try {
      const response = await fetch(`${apiUrl || 'http://127.0.0.1:8000'}/api/enquiry/submit/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      // --- DYNAMIC ERROR HANDLING ---
      if (!response.ok) {
        if (response.status === 400) {
          const errorData = await response.json();
          console.log("Validation Errors:", errorData);

          // Check if it's the duplicate constraint error we added
          const isDuplicate = JSON.stringify(errorData).toLowerCase().includes('unique');
          if (isDuplicate) {
            alert("You have already submitted an enquiry with this email and phone number!");
            return;
          }

          // If it's a different validation error (like course choices, missing fields), format it nicely
          let errorMessages = [];
          for (const [field, errors] of Object.entries(errorData)) {
            const fieldName = field.replace(/_/g, ' ').toUpperCase();
            const msg = Array.isArray(errors) ? errors[0] : errors;
            errorMessages.push(`${fieldName}: ${msg}`);
          }

          alert("Please fix the following validation errors:\n\n" + errorMessages.join('\n'));
          return; // Stop execution, don't show success screen
        }
        throw new Error('Failed to register inquiry');
      }
      // ----------------------------------------

      // If successful, read the allocated officer data
      const data = await response.json();
      setAssignedOfficer(data.assigned_officer_detail);
      setSubmissionSuccess(true);

    } catch (error) {
      console.error(error);
      alert('Error submitting inquiry. Please make sure the backend server is running.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setFormData({
      name: '',
      email: '',
      mobile_number: '',
      previous_college: '',
      city_village_area: '',
      pincode: '',
      course_of_interest: 'MBA'
    });
    setAssignedOfficer(null);
    setSubmissionSuccess(false);
  };

  // Generate direct wa.me link
  const getWhatsAppLink = (officer) => {
    if (!officer || !officer.phone_number) return '#';
    let phone = officer.phone_number.replace(/[^0-9+]/g, '');
    if (!phone.startsWith('+')) {
      if (phone.length === 10) phone = '91' + phone;
    } else {
      phone = phone.replace('+', '');
    }

    const message = encodeURIComponent(
      `Hi ${officer.first_name || officer.username},\nI have submitted an admission inquiry for ${formData.course_of_interest} on the KBPIMSR Enquiry Management System. Please guide me regarding the admission process.`
    );
    return `https://wa.me/${phone}?text=${message}`;
  };

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-lg-8">

          {/* Header section */}
          <div className="text-center mb-5 animate-fade-in-up">
            <h5 className="text-warning fw-bold uppercase tracking-wider mb-2">ADMISSIONS 2026-27</h5>
            <h1 className="display-5 fw-bold gradient-text-gold mb-3">KBPIMSR Satara</h1>
            <p className="text-muted fs-5 mx-auto" style={{ maxWidth: '600px' }}>
              Karmaveer Bhaurao Patil Institute of Management Studies and Research.
              Submit your enquiry below to get instantly allocated to an Admission Officer.
            </p>
          </div>

          {!submissionSuccess ? (
            /* Enquiry Form Card */
            <div className="glass-panel p-4 p-md-5 animate-fade-in-up shadow">
              <div className="d-flex align-items-center gap-3 mb-4">
                <div
                  className="d-flex align-items-center justify-content-center"
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    backgroundColor: 'rgba(245, 158, 11, 0.1)',
                    color: 'var(--color-gold)'
                  }}
                >
                  <Send size={24} />
                </div>
                <div>
                  <h3 className="m-0 text-dark fw-bold">Admission Enquiry Form</h3>
                  <p className="text-muted m-0 small">Please fill out all fields correctly.</p>
                </div>
              </div>

              <form onSubmit={handleSubmitTrigger}>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label text-muted small">Full Name</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="e.g. Rahul Patil"
                      className="form-control"
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label text-muted small">Course of Interest</label>
                    <select
                      name="course_of_interest"
                      value={formData.course_of_interest}
                      onChange={handleInputChange}
                      className="form-select"
                      required
                    >
                      {/* FIX: Values here now exactly match the Django Backend expectations */}
                      <option value="MBA">MBA - Master of Business Administration</option>
                      <option value="BSc Computer Science">BSc - BSc. Computer Science</option>
                      <option value="BBA">BBA - Bachelor of Business Administration</option>
                      <option value="BCA">BCA - Bachelor of Computer Applications</option>
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label text-muted small">Mobile Number</label>
                    <input
                      type="tel"
                      name="mobile_number"
                      value={formData.mobile_number}
                      onChange={handleInputChange}
                      placeholder="e.g. +91 9876543210"
                      className="form-control"
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label text-muted small">Email Address</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="e.g. rahul@example.com"
                      className="form-control"
                      required
                    />
                  </div>
                  <div className="col-12">
                    <label className="form-label text-muted small">Previous School / College Attended</label>
                    <input
                      type="text"
                      name="previous_college"
                      value={formData.previous_college}
                      onChange={handleInputChange}
                      placeholder="e.g. LBS College, Satara"
                      className="form-control"
                      required
                    />
                  </div>
                  <div className="col-md-8">
                    <label className="form-label text-muted small">City / Village / Area</label>
                    <input
                      type="text"
                      name="city_village_area"
                      value={formData.city_village_area}
                      onChange={handleInputChange}
                      placeholder="e.g. Satara City"
                      className="form-control"
                      required
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label text-muted small">Pincode</label>
                    <input
                      type="text"
                      name="pincode"
                      value={formData.pincode}
                      onChange={handleInputChange}
                      placeholder="e.g. 415001"
                      className="form-control"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn btn-gold w-100 mt-4 d-flex align-items-center justify-content-center gap-2"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Admission Enquiry'}
                  <ArrowRight size={18} />
                </button>
              </form>
            </div>
          ) : (

            /* Allocation Success Page */
            <div className="glass-panel p-4 p-md-5 text-center animate-fade-in-up shadow">
              <div className="d-flex justify-content-center mb-4">
                <div
                  className="d-flex align-items-center justify-content-center"
                  style={{
                    width: '72px',
                    height: '72px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    color: 'var(--color-emerald)'
                  }}
                >
                  <CheckCircle2 size={40} />
                </div>
              </div>

              <h2 className="gradient-text-gold fw-bold mb-2">Enquiry Submitted Successfully!</h2>
              <p className="text-muted mb-5">
                Thank you, <strong>{formData.name}</strong>. Your enquiry has been registered and our algorithm has allocated an Admission Officer to guide you.
              </p>

              {/* Assigned Officer Card */}
              <div
                className="mx-auto text-start p-4 mb-4"
                style={{
                  maxWidth: '500px',
                  borderRadius: '16px',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.08)'
                }}
              >
                <div className="d-flex align-items-center justify-content-between mb-3 border-bottom border-dark pb-2">
                  <span className="text-warning fw-bold small">YOUR ASSIGNED ADMISSION OFFICER</span>
                  <span className="badge bg-success">Online</span>
                </div>

                {assignedOfficer ? (
                  <>
                    <h4 className="text-dark fw-bold mb-3 d-flex align-items-center gap-2">
                      <User size={20} className="text-success" />
                      {assignedOfficer.first_name} {assignedOfficer.last_name}
                    </h4>

                    <div className="d-flex flex-column gap-2 mb-4 text-muted small">
                      <div className="d-flex align-items-center gap-2">
                        <Phone size={14} />
                        <span>Phone: {assignedOfficer.phone_number || '+91 02162-230011'}</span>
                      </div>
                      <div className="d-flex align-items-center gap-2">
                        <Mail size={14} />
                        <span>Email: {assignedOfficer.email}</span>
                      </div>
                    </div>

                    <div className="row g-2">
                      <div className="col-sm-6">
                        <a
                          href={getWhatsAppLink(assignedOfficer)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-emerald w-100 d-flex align-items-center justify-content-center gap-2 py-2"
                        >
                          <MessageSquare size={16} />
                          WhatsApp
                        </a>
                      </div>
                      <div className="col-sm-6">
                        <a
                          href={`tel:${assignedOfficer.phone_number}`}
                          className="btn btn-outline-glass w-100 d-flex align-items-center justify-content-center gap-2 py-2"
                        >
                          <Phone size={16} />
                          Call Direct
                        </a>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-3">
                    <p className="text-danger m-0">No Officer assigned currently. An admin will contact you shortly.</p>
                  </div>
                )}
              </div>

              <button
                onClick={handleReset}
                className="btn btn-outline-glass mt-3"
              >
                Submit Another Inquiry
              </button>
            </div>
          )}

        </div>
      </div>

      {/* Simulated OTP Modal */}
      {showOtpModal && (
        <div
          className="modal show d-block"
          tabIndex="-1"
          style={{
            backgroundColor: 'rgba(2, 6, 17, 0.85)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1060
          }}
        >
          <div className="modal-dialog modal-dialog-centered" style={{ width: '400px' }}>
            <div
              className="modal-content glass-panel border border-light border-opacity-10 text-dark"
              style={{ padding: '2rem' }}
            >
              <div className="text-center mb-4">
                <div
                  className="d-inline-flex align-items-center justify-content-center mb-3"
                  style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(245, 158, 11, 0.1)',
                    color: 'var(--color-gold)'
                  }}
                >
                  <ShieldCheck size={32} />
                </div>
                <h4 className="modal-title fw-bold">Verification Required</h4>
                <p className="text-muted small mt-1">
                  We have sent a verification code to your contact details. Please enter the OTP to submit your form.
                </p>
              </div>

              <div className="mb-3">
                <input
                  type="text"
                  maxLength="4"
                  value={otpInput}
                  onChange={(e) => setOtpInput(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="Enter 4-digit OTP (use 1234)"
                  className="form-control text-center fs-4 fw-bold letter-spacing-lg"
                  style={{ letterSpacing: '0.5rem' }}
                />
                {otpError && <p className="text-danger small mt-2 m-0 text-center">{otpError}</p>}
                <div className="text-center mt-2">
                  <span className="text-muted small">Demo tip: Enter <strong>1234</strong></span>
                </div>
              </div>

              <div className="d-flex gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => setShowOtpModal(false)}
                  className="btn btn-outline-glass flex-grow-1"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleOtpVerify}
                  className="btn btn-gold flex-grow-1"
                >
                  Verify & Submit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}