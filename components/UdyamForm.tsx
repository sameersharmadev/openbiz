'use client';
import React, { useState, useCallback } from 'react';
import { FormStep, FormField } from '../types/form';
import formSchema from '../data/form-schema-simple.json';

interface PinCodeData {
  pincode: string;
  city: string;
  state: string;
  district: string;
}

interface PostOffice {
  Name: string;
  State: string;
  District: string;
}

interface PinCodeApiResponse {
  Status: string;
  PostOffice: PostOffice[];
}

type FormValue = string | number | boolean;

const UdyamForm: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<Record<string, FormValue>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [registrationId, setRegistrationId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [pinCodeSuggestions, setPinCodeSuggestions] = useState<PinCodeData[]>([]);
  const [isLoadingPinCode, setIsLoadingPinCode] = useState(false);

  const steps: FormStep[] = formSchema.steps as FormStep[];

  const fetchPinCodeData = useCallback(async (pincode: string) => {
    if (pincode.length !== 6) {
      setPinCodeSuggestions([]);
      return;
    }

    setIsLoadingPinCode(true);
    try {
      const response = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
      const data: PinCodeApiResponse[] = await response.json();
      
      if (data && data[0] && data[0].Status === 'Success') {
        const suggestions = data[0].PostOffice.map((office: PostOffice) => ({
          pincode: pincode,
          city: office.Name,
          state: office.State,
          district: office.District
        }));
        setPinCodeSuggestions(suggestions);
        
        if (suggestions.length === 1) {
          const suggestion = suggestions[0];
          setFormData(prev => ({
            ...prev,
            city: suggestion.city,
            state: suggestion.state,
            district: suggestion.district
          }));
        }
      } else {
        setPinCodeSuggestions([]);
        setErrors(prev => ({ ...prev, pincode: 'Invalid PIN code' }));
      }
    } catch (error) {
      console.error('PIN code lookup error:', error);
      setPinCodeSuggestions([]);
      setErrors(prev => ({ ...prev, pincode: 'Failed to fetch PIN code data' }));
    } finally {
      setIsLoadingPinCode(false);
    }
  }, []);

  const validateField = (field: FormField, value: FormValue): string | null => {
    if (field.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
      return field.validation?.required || `${field.label} is required`;
    }

    if (field.pattern && value) {
      const regex = new RegExp(field.pattern);
      if (!regex.test(String(value))) {
        return field.validation?.pattern || 'Invalid format';
      }
    }

    if (field.maxLength && value && String(value).length > field.maxLength) {
      return field.validation?.maxLength || `Maximum ${field.maxLength} characters allowed`;
    }

    return null;
  };

  const handleInputChange = (fieldId: string, value: FormValue) => {
    setFormData(prev => ({ ...prev, [fieldId]: value }));
    
    setErrors(prev => ({ ...prev, [fieldId]: '' }));
    
    if (fieldId === 'pincode' && typeof value === 'string') {
      const cleanPinCode = value.replace(/\D/g, '');
      if (cleanPinCode !== value) {
        setFormData(prev => ({ ...prev, [fieldId]: cleanPinCode }));
        value = cleanPinCode;
      }
      
      if (cleanPinCode.length === 6) {
        fetchPinCodeData(cleanPinCode);
      } else {
        setPinCodeSuggestions([]);
      }
    }
    
    const currentStepData = steps[currentStep];
    const field = currentStepData.fields.find(f => f.id === fieldId);
    if (field) {
      const error = validateField(field, value);
      setErrors(prev => ({ ...prev, [fieldId]: error || '' }));
    }
  };

  const handlePinCodeSuggestionClick = (suggestion: PinCodeData) => {
    setFormData(prev => ({
      ...prev,
      city: suggestion.city,
      state: suggestion.state,
      district: suggestion.district
    }));
    setPinCodeSuggestions([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const currentStepData = steps[currentStep];
    const stepErrors: Record<string, string> = {};
    
    currentStepData.fields.forEach(field => {
      const error = validateField(field, formData[field.id]);
      if (error) {
        stepErrors[field.id] = error;
      }
    });

    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      const submitData = {
        step: currentStep + 1,
        data: {
          ...formData,
          ...(registrationId && { registrationId })
        }
      };

      const response = await fetch('/api/submit-step', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData)
      });

      const result = await response.json();

      if (response.ok) {
        if (result.registrationId) {
          setRegistrationId(result.registrationId);
        }

        if (currentStep < steps.length - 1) {
          setCurrentStep(prev => prev + 1);
          setErrors({});
        } else {
          setIsCompleted(true);
        }
      } else {
        setErrors({ submit: result.error || 'Submission failed' });
      }
    } catch (error) {
      console.error('Submission error:', error);
      setErrors({ submit: 'Network error. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoBack = () => {
    setIsCompleted(false);
    setCurrentStep(0);
    setFormData({});
    setRegistrationId(null);
    setErrors({});
    setPinCodeSuggestions([]);
  };

  const renderField = (field: FormField, index: number) => {
    switch (field.type) {
      case 'text':
        return (
          <div className="mb-5 relative" key={field.id}>
            <label 
              htmlFor={field.id} 
              className="block mb-2 text-sm font-semibold text-gray-700"
            >
              {index + 1}. {field.label}
            </label>
            <input
              type="text"
              id={field.id}
              name={field.name}
              className={`w-full px-3 py-2 text-sm text-gray-900 bg-white border rounded-md shadow-sm transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors[field.id] 
                  ? 'border-red-500 bg-red-50' 
                  : 'border-gray-300 hover:border-gray-400'
              } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
              placeholder={field.placeholder}
              maxLength={field.maxLength}
              value={String(formData[field.id] || '')}
              onChange={(e) => handleInputChange(field.id, e.target.value)}
              disabled={isSubmitting}
              autoComplete={field.autoComplete || 'off'}
              tabIndex={field.tabIndex}
              style={{ 
                color: '#111827',
                backgroundColor: '#ffffff'
              }}
            />
            
            {/* PIN Code Loading Indicator */}
            {field.id === 'pincode' && isLoadingPinCode && (
              <div className="absolute right-3 top-9 flex items-center">
                <svg className="animate-spin h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
            )}
            
            {/* PIN Code Suggestions */}
            {field.id === 'pincode' && pinCodeSuggestions.length > 1 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto">
                {pinCodeSuggestions.map((suggestion, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className="w-full px-3 py-2 text-left text-sm hover:bg-blue-50 focus:bg-blue-50 focus:outline-none border-b border-gray-100 last:border-b-0"
                    onClick={() => handlePinCodeSuggestionClick(suggestion)}
                  >
                    <div className="font-medium text-gray-900">{suggestion.city}</div>
                    <div className="text-xs text-gray-600">{suggestion.district}, {suggestion.state}</div>
                  </button>
                ))}
              </div>
            )}
            
            {errors[field.id] && (
              <div className="mt-1 text-xs text-red-600">{errors[field.id]}</div>
            )}
          </div>
        );

      case 'select':
        return (
          <div className="mb-5" key={field.id}>
            <label 
              htmlFor={field.id} 
              className="block mb-2 text-sm font-semibold text-gray-700"
            >
              {index + 1}. {field.label}
            </label>
            <select
              id={field.id}
              name={field.name}
              className={`w-full px-3 py-2 text-sm text-gray-900 bg-white border rounded-md shadow-sm transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors[field.id] 
                  ? 'border-red-500 bg-red-50' 
                  : 'border-gray-300 hover:border-gray-400'
              } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
              value={String(formData[field.id] || '')}
              onChange={(e) => handleInputChange(field.id, e.target.value)}
              disabled={isSubmitting}
              tabIndex={field.tabIndex}
              style={{ 
                color: '#111827',
                backgroundColor: '#ffffff'
              }}
            >
              <option value="" style={{ color: '#6b7280' }}>
                {field.placeholder || 'Select...'}
              </option>
              {field.options?.map(option => (
                <option 
                  key={option.value} 
                  value={option.value}
                  style={{ color: '#111827' }}
                >
                  {option.text}
                </option>
              ))}
            </select>
            {errors[field.id] && (
              <div className="mt-1 text-xs text-red-600">{errors[field.id]}</div>
            )}
          </div>
        );

      case 'checkbox':
        return null;

      default:
        return null;
    }
  };

  const ProgressTracker = () => (
    <div className="max-w-6xl mx-auto px-4 mb-6">
      <div className="flex items-center justify-center space-x-8">
        {steps.map((step, index) => (
          <React.Fragment key={step.id}>
            <div className="flex items-center space-x-2">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-colors duration-200 ${
                index < currentStep 
                  ? 'bg-green-600 text-white' 
                  : index === currentStep
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-300 text-gray-600'
              }`}>
                {index < currentStep ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  index + 1
                )}
              </div>
              <span className={`text-sm font-medium ${
                index <= currentStep ? 'text-gray-900' : 'text-gray-500'
              }`}>
                {step.title}
              </span>
            </div>
            
            {index < steps.length - 1 && (
              <div className={`w-12 h-0.5 transition-colors duration-200 ${
                index < currentStep ? 'bg-green-600' : 'bg-gray-300'
              }`}></div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );

  // Success page
  if (isCompleted) {
    return (
      <div className="mx-auto bg-gray-50 min-h-screen">
        <div className="w-full mb-12 text-center bg-white">
          <h2 className="text-xl md:text-2xl bg-[#f2f6f9] py-4 text-[#241b63] leading-relaxed">
            UDYAM REGISTRATION FORM - Registration Complete
          </h2>
        </div>

        <div className="max-w-4xl mx-auto bg-white rounded-sm overflow-hidden my-5">
          <div className="p-8 text-center">
            <div className="mb-8">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">
                Registration Submitted Successfully!
              </h3>
              
              <p className="text-gray-600 mb-6 leading-relaxed">
                Your Udyam registration application has been submitted and is being processed. 
                You will receive a confirmation email shortly.
              </p>

              {registrationId && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6 max-w-md mx-auto">
                  <p className="text-sm text-gray-600 mb-2">Registration ID:</p>
                  <p className="text-xl font-mono font-semibold text-gray-900 break-all">
                    {registrationId}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    Please save this ID for future reference
                  </p>
                </div>
              )}
            </div>

            <button
              onClick={handleGoBack}
              className="inline-flex items-center px-6 py-3 text-sm font-medium text-white bg-blue-600 border border-blue-600 rounded-md hover:bg-blue-700 hover:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-150"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Submit New Registration
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentStepData = steps[currentStep];
  const regularFields = currentStepData.fields.filter(field => field.type !== 'checkbox');
  const checkboxFields = currentStepData.fields.filter(field => field.type === 'checkbox');

  return (
    <div className="mx-auto bg-gray-50 min-h-screen">
      {/* Main Title */}
      <div className="w-full mb-12 text-center bg-white">
        <h2 className="px-4 text-xl text-left md:text-center md:text-2xl bg-[#f2f6f9] py-4 text-[#241b63] leading-relaxed">
          UDYAM REGISTRATION FORM - For New Enterprise who are not Registered yet as MSME
        </h2>
      </div>

      {/* Progress Tracker */}
      <ProgressTracker />

      {/* Form Card */}
      <div className="max-w-6xl px-4 mx-auto bg-white rounded-sm overflow-hidden my-5">
        {/* Card Header */}
        <div className="bg-blue-600 text-white px-5 py-3">
          <h3 className="text-lg m-0">
            {currentStepData.title}
          </h3>
        </div>

        {/* Card Body */}
        <div className="p-8">
          <form onSubmit={handleSubmit}>
            {/* Form Fields Grid - Only regular fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {regularFields.map((field, index) => (
                <div key={field.id} className="w-full">
                  {renderField(field, index)}
                </div>
              ))}
            </div>

            {/* Info Text for Step 1 */}
            {currentStep === 0 && (
              <div className="mb-6">
                <ul className="space-y-1 pl-8 text-sm text-black list-disc list-inside">
                  <li>Aadhaar number shall be required for Udyam Registration.</li>
                  <li className="leading-relaxed">
                    The Aadhaar number shall be of the proprietor in the case of a proprietorship firm, of the managing partner in the case of a partnership firm and of a karta in the case of a Hindu Undivided Family (HUF).
                  </li>
                  <li className="leading-relaxed">
                    In case of a Company or a Limited Liability Partnership or a Cooperative Society or a Society or a Trust, the organisation or its authorised signatory shall provide its GSTIN(As per applicability of CGST Act 2017 and as notified by the ministry of MSME{' '}
                    <a href="#" className="text-blue-600 underline hover:text-blue-800">
                      vide S.O. 1055(E) dated 05th March 2021
                    </a>
                    ) and PAN along with its Aadhaar number.
                  </li>
                </ul>
              </div>
            )}

            {/* Checkbox Fields - Full width below bullet points */}
            {checkboxFields.length > 0 && (
              <div className="mb-6">
                {checkboxFields.map(field => (
                  <div key={field.id} className="flex items-start mb-4">
                    <input
                      type="checkbox"
                      id={field.id}
                      name={field.name}
                      className="w-3 h-3 mt-1 mr-3 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 flex-shrink-0"
                      checked={Boolean(formData[field.id])}
                      onChange={(e) => handleInputChange(field.id, e.target.checked)}
                      disabled={isSubmitting}
                      tabIndex={field.tabIndex}
                    />
                    <div className="flex-1">
                      <label 
                        htmlFor={field.id} 
                        className="text-xs leading-relaxed text-gray-700 cursor-pointer block"
                      >
                        {field.label}
                      </label>
                      {errors[field.id] && (
                        <div className="mt-1 text-xs text-red-600">{errors[field.id]}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {/* Error Message */}
            {errors.submit && (
              <div className="mb-5 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md" role="alert">
                {errors.submit}
              </div>
            )}
            
            {/* Form Actions */}
            <div className="mt-6 pt-5 border-t border-gray-200">
              {currentStepData.buttons.map(button => (
                <button
                  key={button.id}
                  type={button.type as 'submit' | 'button'}
                  className={`inline-block px-4 py-2 text-sm font-normal text-center text-white bg-blue-600 border border-blue-600 rounded-md cursor-pointer transition-all duration-150 hover:bg-blue-700 hover:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                    isSubmitting ? 'opacity-65 cursor-not-allowed' : ''
                  }`}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Processing...' : button.text}
                </button>
              ))}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UdyamForm;