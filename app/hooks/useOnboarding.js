import { useState } from 'react';
import { db, storage } from '../lib/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { DEFAULT_HOURS } from '../constants';

export function useOnboarding(user, showToast, setOwnerStep, ownerStep) {
  const [ownerBusinessName, setOwnerBusinessName] = useState('');
  const [ownerCity, setOwnerCity] = useState('');
  const [ownerCuisineType, setOwnerCuisineType] = useState('');
  const [verifyFiles, setVerifyFiles] = useState([]);
  const [businessLicenseFile, setBusinessLicenseFile] = useState(null);
  const [healthPermitFile, setHealthPermitFile] = useState(null);
  const [halalCertFile, setHalalCertFile] = useState(null);
  const [certifyingBody, setCertifyingBody] = useState('');
  const [certNumber, setCertNumber] = useState('');
  const [certExpiry, setCertExpiry] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [mapsUrl, setMapsUrl] = useState('');
  const [confirmOwnership, setConfirmOwnership] = useState(false);
  const [verifyError, setVerifyError] = useState('');
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [coverPhotoFile, setCoverPhotoFile] = useState(null);
  const [coverPhotoPreview, setCoverPhotoPreview] = useState(null);
  const [hoursInput, setHoursInput] = useState(DEFAULT_HOURS);

  function handleVerifyFiles(e) {
    const files = Array.from(e.target.files);
    const MAX_SIZE = 5 * 1024 * 1024;
    const allowed = files.filter(f => f.type.startsWith('image/') || f.type === 'application/pdf');
    if (allowed.length !== files.length) { setVerifyError('Only JPG, PNG, and PDF files are accepted.'); return; }
    const oversized = allowed.find(f => f.size > MAX_SIZE);
    if (oversized) { setVerifyError(`"${oversized.name}" exceeds the 5MB limit.`); return; }
    setVerifyError('');
    setVerifyFiles(allowed.slice(0, 5));
  }

  function handleSingleFile(e, setter) {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      setVerifyError('Only JPG, PNG, and PDF files are accepted.'); return;
    }
    if (file.size > 5 * 1024 * 1024) { setVerifyError(`"${file.name}" exceeds the 5MB limit.`); return; }
    setVerifyError('');
    setter(file);
  }

  async function submitVerification() {
    setVerifyError('');
    const imageFiles = verifyFiles.filter(f => f.type.startsWith('image/'));
    const pdfFiles = verifyFiles.filter(f => f.type === 'application/pdf');
    if (pdfFiles.length === 0 && imageFiles.length < 2) {
      setVerifyError('Upload at least one PDF or at least two images as proof.'); return;
    }
    if (!businessLicenseFile) { setVerifyError('Business License is required.'); return; }
    if (!healthPermitFile) { setVerifyError('Health Permit / Food Safety Certificate is required.'); return; }
    if (!halalCertFile) { setVerifyError('Halal Certification Certificate is required.'); return; }
    if (!certifyingBody) { setVerifyError('Please select a certifying body.'); return; }
    if (!certNumber.trim()) { setVerifyError('Certification Number is required.'); return; }
    if (!certExpiry) { setVerifyError('Certificate Expiry Date is required.'); return; }
    if (!confirmOwnership) { setVerifyError('You must confirm ownership before submitting.'); return; }

    setVerifyLoading(true);
    try {
      const proofUrls = [];
      for (const file of verifyFiles) {
        const r = storageRef(storage, `verification_proofs/${user.uid}/${file.name}`);
        await uploadBytes(r, file);
        proofUrls.push(await getDownloadURL(r));
      }
      const blRef = storageRef(storage, `verification_proofs/${user.uid}/business_license/${businessLicenseFile.name}`);
      await uploadBytes(blRef, businessLicenseFile);
      const businessLicenseUrl = await getDownloadURL(blRef);

      const hpRef = storageRef(storage, `verification_proofs/${user.uid}/health_permit/${healthPermitFile.name}`);
      await uploadBytes(hpRef, healthPermitFile);
      const healthPermitUrl = await getDownloadURL(hpRef);

      const hcRef = storageRef(storage, `verification_proofs/${user.uid}/halal_certificate/${halalCertFile.name}`);
      await uploadBytes(hcRef, halalCertFile);
      const halalCertificateUrl = await getDownloadURL(hcRef);

      await setDoc(doc(db, 'verification_requests', user.uid), {
        userId: user.uid,
        userName: user.displayName || '',
        userEmail: user.email || '',
        businessName: ownerBusinessName.trim(),
        ownerCity: ownerCity.trim(),
        cuisineType: ownerCuisineType,
        proofs: proofUrls,
        businessLicenseUrl,
        healthPermitUrl,
        halalCertificateUrl,
        certifyingBody,
        certificationNumber: certNumber.trim(),
        certExpiryDate: certExpiry,
        websiteUrl: websiteUrl.trim() || null,
        mapsUrl: mapsUrl.trim() || null,
        status: 'pending',
        createdAt: serverTimestamp(),
      });
      setOwnerStep('subscription');
      showToast('Verification submitted!');
      setVerifyFiles([]);
      setBusinessLicenseFile(null);
      setHealthPermitFile(null);
      setHalalCertFile(null);
      setCertifyingBody('');
      setCertNumber('');
      setCertExpiry('');
      setWebsiteUrl('');
      setMapsUrl('');
      setConfirmOwnership(false);
    } catch (e) {
      setVerifyError('Upload failed. Please try again.');
      showToast('Upload failed. Please try again.', 'error');
    }
    setVerifyLoading(false);
  }

  return {
    ownerBusinessName, setOwnerBusinessName,
    ownerCity, setOwnerCity,
    ownerCuisineType, setOwnerCuisineType,
    verifyFiles, businessLicenseFile, setBusinessLicenseFile,
    healthPermitFile, setHealthPermitFile,
    halalCertFile, setHalalCertFile,
    certifyingBody, setCertifyingBody,
    certNumber, setCertNumber,
    certExpiry, setCertExpiry,
    websiteUrl, setWebsiteUrl,
    mapsUrl, setMapsUrl,
    confirmOwnership, setConfirmOwnership,
    verifyError, setVerifyError,
    verifyLoading,
    coverPhotoFile, setCoverPhotoFile,
    coverPhotoPreview, setCoverPhotoPreview,
    hoursInput, setHoursInput,
    handleVerifyFiles, handleSingleFile,
    submitVerification,
  };
}
