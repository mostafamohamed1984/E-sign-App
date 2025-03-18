import { Modal } from "antd";
import { useState, useEffect } from "react";
import { ToastContainer, toast ,Flip } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useNavigate } from 'react-router-dom';
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { Select } from "antd";

interface SendDocProps {
  owner_email: string;
  assigned_user: string[];
  template_tite: string;
  document_title: string;
  setTarget: React.Dispatch<React.SetStateAction<HTMLElement | null>>;
  onClickSaveDoc: () => void;
}
interface EmailEntry {
  email: string;
  status: string;
}


function SendDoc({ owner_email, assigned_user, template_tite, document_title , setTarget , onClickSaveDoc }: SendDocProps) {
  const [visible, setVisible] = useState<boolean>(false);
  const [emails, setEmails] = useState<Record<number, EmailEntry>>({});
  const [newEmail, setNewEmail] = useState<string>("");
  const [mailTitle, setMailTitle] = useState<string>(`${document_title}-(${template_tite})`);
  const [mailBody, setMailBody] = useState<string>("");
  const [checked, setChecked] = useState<number>(1);
  const [isFormValid, setIsFormValid] = useState<boolean>(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [templates, setTemplates] = useState<{ name: string }[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState<boolean>(true);

  useEffect(() => {
    if (mailTitle && mailBody && Object.keys(emails).length > 0) {
      setIsFormValid(true);
    } else {
      setIsFormValid(false);
    }
  }, [newEmail, mailTitle, mailBody, emails]);

  const navigate = useNavigate();

  useEffect(() => {
    const formattedEmails: Record<number, EmailEntry> = assigned_user.reduce((acc, email, index) => {
      acc[index] = { email, status: "unseen" };
      return acc;
    }, {} as Record<number, EmailEntry>);

    setEmails(formattedEmails);
  }, [assigned_user]);


  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const response = await fetch("/api/resource/Email Template?fields=[\"name\"]");
        if (!response.ok) throw new Error("Failed to fetch email templates");
        const result = await response.json();
        setTemplates(result.data);
      } catch (error) {
        console.error("Error fetching email templates:", error);
      } finally {
        setLoadingTemplates(false);
      }
    };
    fetchTemplates();
  }, []);

  const handleMailTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMailTitle(e.target.value);
  };
  const handleMailBodyChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMailBody(e.target.value);
  };
 const addEmail = () => {
    if (newEmail && !Object.values(emails).some(e => e.email === newEmail)) {
      const newIndex = Object.keys(emails).length;
      setEmails({ ...emails, [newIndex]: { email: newEmail, status: 'unseen' } });
      setNewEmail('');
    }
  };

  const FetchEmailTemplate = async () => {
    try {
      const response = await fetch("/api/method/frappe.email.doctype.email_template.email_template.get_email_template", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ template_name: selectedTemplate, doc: {} }),
      });

      if (!response.ok) throw new Error("Failed to fetch email template");

      const data = await response.json();
      setMailTitle(data.message.subject);
      setMailBody(data.message.message);
    } catch (error) {
      console.error("Error fetching email template:", error);
    }
  };

  const removeEmail = (emailToRemove: string) => {
    const updatedEmails = Object.keys(emails)
      .filter(key => emails[parseInt(key)].email !== emailToRemove)
      .reduce((acc, key, index) => {
        acc[index] = emails[parseInt(key)];
        return acc;
      }, {} as { [key: number]: { email: string; status: string } });

    setEmails(updatedEmails);
  };
  const sendDialogHandle = () => {
    
    setTarget(null);
    setVisible(true);
  };
  
    const sendMail = async () => {
      setVisible(false)

      
      const DocumentObj = {
        to: JSON.stringify(emails , null , 2) ,
        subject: mailTitle,
        body: mailBody,
        document_name: document_title,
        user_mail: owner_email,
        isChecked: checked,
      };
      // // console.log(DocumentObj);
      try {
        const response = await fetch('/api/method/esign_app.api.send_document_data', {
          method: 'POST', 
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(DocumentObj),
        });
        const result = await response.json();
        // // console.log(result);
        if (result.message.status < 300) {
          onClickSaveDoc()
          toast.success('Document Assigned Successfully', {
            position: "top-right",
            autoClose: 500,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
            theme: "dark",
            transition: Flip,
          });
          setTimeout(() => {
            navigate('/documents');
          }, 2000);
        } else {
          toast.error('Error While Sending Document...', {
            position: "top-right",
            autoClose: 500,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
            theme: "dark",
            transition: Flip,
          });
        }
      } catch (error) {
        toast.error('Server Error, Please Try Again...', {
          position: "top-right",
          autoClose: 500,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "dark",
          transition: Flip,
        });
      }
    };


  return (
    <>
      <button 
        className="bg-[#283C42] text-white px-4 py-2 rounded border-2 border-transparent hover:border-[#283C42] hover:bg-white hover:text-[#283C42] transition-colors duration-300"
        onClick={sendDialogHandle}
      >
        Send Document
      </button>   

      <Modal
        title="Send Document"
        open={visible}
        onCancel={() => setVisible(false)}
        footer={null}
        width={"60vh"}
      >
        <div className="bg-[#283C42] text-white p-6 rounded-md shadow-md max-w-lg mx-auto">
          <div className="mb-4">
            <label className="block text-xs font-semibold mb-1">From:</label>
            <input
              type="email"
              value={owner_email}
              disabled
              className="w-full px-3 py-2 rounded bg-gray-300 text-gray-700 cursor-not-allowed text-xs"
            />
          </div>

          <div className="mb-4">
            <label className="block text-xs font-semibold mb-1">To:</label>
            <div className="flex space-x-2">
              <input
                type="email"
                placeholder="Add email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="w-full px-3 py-2 rounded bg-white text-black text-xs"
              />
              <button
                type="button"
                onClick={addEmail}
                className="bg-[#283C42] text-white px-3 py-2 rounded text-xs font-semibold"
              >
                Add
              </button>
            </div>
            <div className="mt-2 max-h-24 overflow-y-auto">
              <ul>
                {Object.keys(emails).map(key => (
                  <li
                    key={key}
                    className="flex justify-between items-center bg-white text-black text-xs px-3 py-2 rounded mb-1"
                  >
                    <span>{emails[parseInt(key)].email}</span>
                    <button
                      type="button"
                      onClick={() => removeEmail(emails[parseInt(key)].email)}
                      className="text-red-500 text-xs font-semibold"
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mb-4">
            {/* <label className="block text-xs font-semibold mb-1">Email Template:</label>
            <div className="flex space-x-2">
              <input
                type="text"
                placeholder="Search Email Template..."
                // value={newEmail}
                // onChange={(e) => setNewEmail(e.target.value)}
                className="w-full px-3 py-2 rounded bg-white text-black text-xs"
              />
              <button
                type="button"
                onClick={FetchEmailTemplate}
                className="bg-[#283C42] text-white px-3 py-2 rounded text-xs font-semibold"
              >
                Use
              </button>
            </div> */}
          <label className="text-xs font-semibold mb-1">Select Template:</label>
         <div className="flex items-center gap-2 w-full">
         <Select
            showSearch
            value={selectedTemplate}
            onChange={(value: string) => setSelectedTemplate(value)}
            filterOption={(input, option) => 
              option ? option.label.toLowerCase().includes(input.toLowerCase()) : false
            }
            options={templates.map((template) => ({
              label: template.name,
              value: template.name,
            }))}
            className="flex-1"
          />

            <button
              type="button"
              onClick={FetchEmailTemplate}
              className="bg-white text-[#283C42] px-4 py-2 rounded text-xs"
            >
              Load Template
            </button>
          </div>

          </div>

          <div className="mb-4">
            <label className="block text-xs font-semibold mb-1">Title:</label>
            {/* <input
              type="text"
              value={mailTitle}
              onChange={handleMailTitleChange}
              className="w-full px-3 py-2 rounded bg-white text-black text-xs"
            /> */}
            <input type="text" value={mailTitle} onChange={(e) => setMailTitle(e.target.value)} className="w-full px-3 py-2 bg-white text-black text-xs" />
          </div>

          <div className="mb-4">
            <label className="block text-xs font-semibold mb-1">Description:</label>
            {/* <textarea
              onChange={handleMailBodyChange}
              rows={6}
              className="w-full px-3 py-2 rounded bg-white text-black text-xs"
                       /> */}
                <div className="bg-white text-black p-2 rounded">
                  <ReactQuill theme="snow" value={mailBody} onChange={setMailBody} />
                </div>

          </div>

          <div className="flex items-center justify-between">
            {/* <div className="flex items-center">
              <input
                type="checkbox"
                className="form-checkbox text-[#283C42] rounded"
                checked={checked === 1}
                onChange={handleCheckboxChange}
              />
              <label className="ml-2 text-xs">Freeze</label>
            </div> */}
            <button
              type="submit"
              onClick={sendMail}
              className={`bg-white text-[#283C42] px-4 py-2 rounded-md font-semibold text-xs ${!isFormValid? 'cursor-not-allowed' : 'cursor-pointer'}`}
              disabled={!isFormValid}
            >
              Send
            </button>
          </div>
        </div>
      </Modal>

    </>
  );
}

export default SendDoc;
