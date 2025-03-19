import React, { useState } from 'react';
import { Modal } from 'antd';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { toast } from "react-toastify";

interface ConfirmRejectModalProps {
  visible: boolean;
  name: string;
  owner_name: string;
  message: string;
  module: string;
  onCancel: () => void;
  onConfirm: (name: string, reason: string) => void; 
}


const RejectDoc: React.FC<ConfirmRejectModalProps> = ({ visible, onCancel, onConfirm, name,owner_name, message, module }) => {
  const [mailBody, setMailBody] = useState('');
  
  
  async function ConfirmData(name: string, reason: string) {
    // Remove HTML tags
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = reason;
    const plainText = tempDiv.textContent || tempDiv.innerText || "";
  
    const minAlphabets = plainText.replace(/[^a-zA-Z]/g, "").length >= 5;
  
    if (!minAlphabets) {
      toast.error("Reason must contain at least 5 alphabetic characters.");//(CHANGE TO 15 LATER)
      return;
    }
  
    console.log(name, plainText);
    const documentObj = {
        document_title: name,
        document_reason: reason,
        document_owner: owner_name,
      };

    try {
        // Make API request
        const response = await fetch('/api/method/esign_app.api.reject_final_document', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(documentObj),
        });
    
        const result = await response.json();
        console.log(JSON.stringify(result))
        if (result.message.status === 200) {
          toast.success(result.message);
          onConfirm(name, plainText);
          setMailBody('')
        } else {
          throw new Error(result.message);
        }
      } catch (error) {
        console.error("Error rejecting document:", error);
        toast.error("Failed to reject document. Please try again.");
      }   
  }
  return (
    <Modal
      title=""
      visible={visible}
      onCancel={onCancel}
      footer={null}
      width={'fit-content'}
      className="confirm-delete-modal"
    >
      <div className="confirm-delete-card min-w-[40vw] p-6">
        <div className="confirm-delete-header">
          <div className="confirm-delete-image">
            <svg aria-hidden="true" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <div className="confirm-delete-content">
            <span className="confirm-delete-title">{module}</span>
            <p className="confirm-delete-message">{message}</p>
          </div>
        </div>

        {/* Reason Input with Spacing */}
        <div className="reject-reason-input" style={{ marginTop: '16px', marginBottom: '16px' }}>
          <label style={{ fontWeight: 'bold', marginBottom: '8px', display: 'block' }}>Reason for Rejection:</label>
          <ReactQuill theme="snow" value={mailBody} onChange={setMailBody} />
        </div>

        <button 
          className="confirm-delete-desactivate" 
          type="button" 
          onClick={() => ConfirmData(name, mailBody)}
          disabled={!mailBody.trim()} 
          style={{ marginTop: '12px' }}
        >
          Confirm
        </button>
        <button className="confirm-delete-cancel" type="button" onClick={onCancel} style={{ marginTop: '8px' }}>
          Cancel
        </button>
      </div>
    </Modal>
  );
};

export default RejectDoc;
