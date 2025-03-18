import { useState, useEffect } from 'react';
import { Modal } from 'antd';
import { useSelector } from 'react-redux';
import { selectFullName, selectEmail } from '../../../redux/selectors/userSelector';
import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer, toast, Flip } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

interface OpenSSLButtonProps {
  onAdd: () => void; 
}

const OpenSSLButton: React.FC<OpenSSLButtonProps> = ({ onAdd }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [formData, setFormData] = useState({
    country: '',
    state: '',
    location: '',
    organization: '',
    challenge_password: '',
    countryCode: '',
    username: '',
    email: '',
    openssl_name:'',
  });
  const [countries, setCountries] = useState<{ name: string; code: string }[]>([]);
  const [filteredCountries, setFilteredCountries] = useState<{ name: string; code: string }[]>([]);
  const [buttonDisable, setButtonDisable] = useState<boolean>(false);

  const fullName = useSelector(selectFullName);
  const email = useSelector(selectEmail);

  useEffect(() => {
    // Pre-fill username and email
    setFormData((prev) => ({
      ...prev,
      username: fullName,
      email: email
    }));

    async function fetchCountries() {
      try {
        const response = await fetch('https://restcountries.com/v3.1/all?fields=name,cca2');
        const data = await response.json();
        const countryData = data
          .map((country: any) => ({ name: country.name.common, code: country.cca2 }))
          .sort((a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name));
        setCountries(countryData);
        setFilteredCountries(countryData);
      } catch (error) {
        toast.error('Error fetching countries!', { transition: Flip });
      }
    }

    fetchCountries();
  }, [fullName, email]);


  const showModal = () => {
    setModalVisible(true);
  };
  const clearDataFields = () =>{
       setFormData({
      country: '',
      state: '',
      location: '',
      organization: '',
      challenge_password: '',
      countryCode: '',
      username: fullName,
      email: email,
      openssl_name:'',
    });
  }
  const closeModal = () => {
    setModalVisible(false);
    clearDataFields();
  };
  const handleSave= async()=>{
    setButtonDisable(true);
    console.log(formData)
    try {
      const response = await fetch('/api/method/esign_app.api.genrate_and_store_keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();
      console.log(result);
      if (result.message.status < 300) {
        toast.success('OpenSSL created Successfully', {
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
        onAdd();
        setModalVisible(false);
        setButtonDisable(false);
        clearDataFields();
      } else {
        toast.error('Error while creating OpenSSL', {
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
        setButtonDisable(true);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('An error occurred while saving the templete');
    }
    setButtonDisable(false);
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'challenge_password') {
        // Validate Challenge Password: At least 1 uppercase, 1 digit, no special symbols
        const validPassword = /^[A-Za-z0-9]*$/;
        if (!validPassword.test(value)) return;
      }

    setFormData((prev) => ({ ...prev, [name]: value }));

    // Auto-update countryCode when country changes
    if (name === 'country') {
      const selectedCountry = countries.find((c) => c.name === value);
      setFormData((prev) => ({ ...prev, countryCode: selectedCountry ? selectedCountry.code : '' }));
    }
  };



  return (
    <>
      <div>
        <button
          className="bg-[#283C42] text-white px-4 py-2 rounded border-2 border-transparent hover:border-[#283C42] hover:bg-white hover:text-[#283C42] transition-colors duration-300"
          onClick={showModal}
        >
          Add OpenSSL
        </button>
      </div>
      <Modal
        title="Add Template"
        open={modalVisible}
        onCancel={closeModal}
        footer={[
          <div key="footer-buttons" className="flex gap-2">
            <button
              disabled={buttonDisable}
              key="save-button"
              className="bg-[#283C42] text-white px-4 py-2 rounded border-2 border-transparent hover:border-[#283C42] hover:bg-white hover:text-[#283C42] transition-colors duration-300"
              onClick={handleSave}
            >
              Save
            </button>
            <button
              key="cancel-button"
              className="bg-[#283C42] text-white px-4 py-2 rounded border-2 border-transparent hover:border-[#ca2424] hover:bg-white hover:text-[#ca2424] transition-colors duration-300"
              onClick={closeModal}
            >
              Cancel
            </button>
          </div>
        ]}
      >
        <div className="mt-4 space-y-4">
        <div className='flex space-x-4'>
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">Country</label>
            <select
              name="country"
              value={formData.country}
              onChange={handleChange}
              className="bg-[#d1e0e4] text-gray-700 focus:outline-none focus:shadow-outline border border-gray-300 rounded py-2 px-4 block w-full appearance-none"
            >
              <option value="">Select Country</option>
              {filteredCountries.map((country) => (
                <option key={country.code} value={country.name}>{country.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">Country Code</label>
            <input
              type="text"
              name="countryCode"
              value={formData.countryCode}
              readOnly
              className="bg-gray-200 text-gray-700 focus:outline-none focus:shadow-outline border border-gray-300 rounded py-2 px-4 block w-full appearance-none"
            />
          </div>  
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">OpenSSL Name</label>
            <input
              type="text"
              name="openssl_name"
              value={formData.openssl_name}
              onChange={handleChange}
              className="bg-[#d1e0e4] text-gray-700 focus:outline-none focus:shadow-outline border border-gray-300 rounded py-2 px-4 block w-full appearance-none"
            />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">State/Province</label>
            <input
              type="text"
              name="state"
              value={formData.state}
              onChange={handleChange}
              className="bg-[#d1e0e4] text-gray-700 focus:outline-none focus:shadow-outline border border-gray-300 rounded py-2 px-4 block w-full appearance-none"
            />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">Location</label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              className="bg-[#d1e0e4] text-gray-700 focus:outline-none focus:shadow-outline border border-gray-300 rounded py-2 px-4 block w-full appearance-none"
            />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">Organization</label>
            <input
              type="text"
              name="organization"
              value={formData.organization}
              onChange={handleChange}
              className="bg-[#d1e0e4] text-gray-700 focus:outline-none focus:shadow-outline border border-gray-300 rounded py-2 px-4 block w-full appearance-none"
            />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">Challenge Password</label>
              <input
              type="text"
              name="challenge_password"
              value={formData.challenge_password}
              onChange={handleChange}
              placeholder="Ex. Pass123"
              className="bg-[#d1e0e4] text-gray-700 focus:outline-none focus:shadow-outline border border-gray-300 rounded py-2 px-4 block w-full appearance-none"
            />
          </div>
        
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">Username</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              readOnly
              className="bg-gray-200 text-gray-700 focus:outline-none focus:shadow-outline border border-gray-300 rounded py-2 px-4 block w-full appearance-none"
            />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">Email</label>
            <input
              type="text"
              name="email"
              value={formData.email}
              readOnly
              className="bg-gray-200 text-gray-700 focus:outline-none focus:shadow-outline border border-gray-300 rounded py-2 px-4 block w-full appearance-none"
            />
          </div>
        </div>
      </Modal>
      <ToastContainer limit={1} />
    </>
  );
}

export default OpenSSLButton;
