'use client';
import { useState, useEffect, useRef } from 'react';

import { useToast } from './hooks/useToast';
import { useAuth } from './hooks/useAuth';
import { useSubscription } from './hooks/useSubscription';
import { useFavourites } from './hooks/useFavourites';
import { useRestaurants } from './hooks/useRestaurants';
import { useReviews } from './hooks/useReviews';
import { useOnboarding } from './hooks/useOnboarding';
import { useSearch } from './hooks/useSearch';

import OwnerOnboarding from './components/OwnerOnboarding';
import OwnerDashboard from './components/OwnerDashboard';
import PricingView from './components/PricingView';
import RestaurantDetailView from './components/RestaurantDetailView';
import HomeView from './components/HomeView';
import { useOwnerDashboard } from './hooks/useOwnerDashboard';
import { useNotifications } from './hooks/useNotifications';

export default function Home() {
  const [view, setView] = useState('home');
  const [ownerStep, setOwnerStep] = useState(null);
  const autoResumeDisabled = useRef(false);
  const [pendingOwnerDashboard, setPendingOwnerDashboard] = useState(false);

  const { toasts, showToast } = useToast();

  const {
    user, userRole, setUserRole,
    onboardingComplete,
    pendingOwnerSubmit, setPendingOwnerSubmit,
    confirmSwitchRole, setConfirmSwitchRole,
    handleLogin, handleLogout, completeOnboarding,
  } = useAuth(showToast);

  const {
    subscription, loadingSub, upgradingToPro, cancellingSubscription,
    fetchSubscription,
    isSubscribed, isPro, handleSubscribe, handleUpgrade, handleCancel,
  } = useSubscription(user, handleLogin, showToast);

  const { favourites, fetchFavourites, toggleFavourite } = useFavourites(user, handleLogin);

  const {
    restaurants, loadingRestaurants, reviewStats, setReviewStats,
    selected, setSelected,
    recentlyViewed, setRecentlyViewed,
    addingRestaurant, setAddingRestaurant,
    newRestName, setNewRestName,
    newRestLocation, setNewRestLocation,
    newCertNumber, setNewCertNumber,
    fetchRestaurants, fetchAllReviewStats,
    openRestaurant, addRestaurant,
    topRated, recentRestaurants,
  } = useRestaurants(user, setView, showToast);

  const {
    reviews, setReviews,
    reviewText, setReviewText,
    rating, setRating,
    photo, photoPreview,
    submitting,
    aiSummary, setAiSummary, loadingSummary,
    advancedSummary, setAdvancedSummary, loadingAdvanced,
    certVisible, setCertVisible,
    familyFriendly, setFamilyFriendly,
    replyingTo, setReplyingTo,
    replyText, setReplyText,
    submittingReply,
    isListening, speechSupported,
    handlePhotoChange, toggleListening,
    submitReview, submitReply, submitReport,
    generateSummary, generateAdvancedSummary,
    shareRestaurant, getAnalytics, ratingCount,
  } = useReviews(user, selected, showToast, setReviewStats);

  const onboarding = useOnboarding(user, showToast, setOwnerStep, ownerStep, setUserRole);
  const ownerDashboard = useOwnerDashboard(showToast);
  const { notifications, unreadCount, markAllRead } = useNotifications(user);

  const {
    search, setSearch,
    cuisineFilter, setCuisineFilter,
    cityFilter, setCityFilter,
    openNowFilter, setOpenNowFilter,
    sortBy, setSortBy,
    showAllCuisines, setShowAllCuisines,
    showSuggestions, setShowSuggestions,
    highlightedIdx, setHighlightedIdx,
    showInstallBanner, setShowInstallBanner,
    deferredPrompt, setDeferredPrompt,
    searchContainerRef,
    cities, sortedFiltered, suggestions,
    handleSuggestionSelect,
  } = useSearch(restaurants, reviewStats, favourites);

  // Bootstrap: load restaurants + review stats on mount
  useEffect(() => { fetchRestaurants(); fetchAllReviewStats(); }, []);

  // Auto-resume returning owners who haven't completed onboarding.
  // Skipped when the user explicitly signed in via the header button or
  // navigated home from onboarding — in those cases autoResumeDisabled is set.
  useEffect(() => {
    if (autoResumeDisabled.current) return;
    if (user && userRole === 'owner' && !onboardingComplete && ownerStep === null) {
      setOwnerStep(1);
    }
  }, [user, userRole, onboardingComplete]);

  // Restore recently viewed from localStorage
  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('halalspot_recent') || '[]');
      setRecentlyViewed(stored);
    } catch (e) {}
  }, []);

  // Service worker registration
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
  }, []);

  // Wire auth state to subscription + favourites fetches
  useEffect(() => {
    if (user) {
      fetchSubscription(user.uid);
      fetchFavourites(user.uid);
    }
  }, [user?.uid]);

  // After onboarding submission, skip PostOnboardingSubscription and go straight to dashboard
  useEffect(() => {
    if (ownerStep !== 'subscription' || !user) return;
    completeOnboarding();
    ownerDashboard.fetchDashboardData(user.uid);
    setView('owner-dashboard');
    setOwnerStep(null);
  }, [ownerStep, user]);

  // Redirect to dashboard after "Already listed? Sign in" button triggers sign-in
  useEffect(() => {
    if (!pendingOwnerDashboard || !user || !userRole) return;
    setPendingOwnerDashboard(false);
    if (userRole !== 'owner') {
      showToast('No owner account found for this Google account.', 'error');
      return;
    }
    autoResumeDisabled.current = true;
    ownerDashboard.fetchDashboardData(user.uid);
    setView('owner-dashboard');
  }, [pendingOwnerDashboard, user, userRole]);

  // Header "Sign in with Google" — customer intent, must not trigger owner onboarding
  function handleHeaderLogin() {
    autoResumeDisabled.current = true;
    handleLogin();
  }

  // "← Home" inside OwnerOnboarding — user chose to exit, suppress auto-resume
  function handleOnboardingHome() {
    autoResumeDisabled.current = true;
    setOwnerStep(null);
  }

  // "Already listed? Sign in" button — signs in then redirects to dashboard
  function handleOwnerSignIn() {
    if (user) {
      if (userRole === 'owner') {
        autoResumeDisabled.current = true;
        ownerDashboard.fetchDashboardData(user.uid);
        setView('owner-dashboard');
      } else {
        showToast("This account isn't registered as an owner.", 'error');
      }
      return;
    }
    autoResumeDisabled.current = true;
    setPendingOwnerDashboard(true);
    handleLogin();
  }

  // "Add another restaurant" from owner dashboard — re-enters onboarding flow
  function handleAddRestaurant() {
    setOwnerStep(1);
  }

  function handleShowPricing() {
    if (!user) return handleLogin();
    setView('pricing');
  }

  function handleSignInToSubmit() {
    setPendingOwnerSubmit(true);
    handleLogin();
  }

  // ─── OWNER ONBOARDING ────────────────────────────────────────────────────
  if (ownerStep !== null && ownerStep !== 'subscription') {
    return (
      <OwnerOnboarding
        ownerStep={ownerStep}
        setOwnerStep={setOwnerStep}
        onHome={handleOnboardingHome}
        user={user}
        handleSignInToSubmit={handleSignInToSubmit}
        verifyError={onboarding.verifyError}
        setVerifyError={onboarding.setVerifyError}
        ownerBusinessName={onboarding.ownerBusinessName}
        setOwnerBusinessName={onboarding.setOwnerBusinessName}
        ownerCity={onboarding.ownerCity}
        setOwnerCity={onboarding.setOwnerCity}
        ownerCuisineType={onboarding.ownerCuisineType}
        setOwnerCuisineType={onboarding.setOwnerCuisineType}
        certifyingBody={onboarding.certifyingBody}
        setCertifyingBody={onboarding.setCertifyingBody}
        certNumber={onboarding.certNumber}
        setCertNumber={onboarding.setCertNumber}
        certExpiry={onboarding.certExpiry}
        setCertExpiry={onboarding.setCertExpiry}
        halalCertFile={onboarding.halalCertFile}
        setHalalCertFile={onboarding.setHalalCertFile}
        businessLicenseFile={onboarding.businessLicenseFile}
        setBusinessLicenseFile={onboarding.setBusinessLicenseFile}
        healthPermitFile={onboarding.healthPermitFile}
        setHealthPermitFile={onboarding.setHealthPermitFile}
        verifyFiles={onboarding.verifyFiles}
        websiteUrl={onboarding.websiteUrl}
        setWebsiteUrl={onboarding.setWebsiteUrl}
        mapsUrl={onboarding.mapsUrl}
        setMapsUrl={onboarding.setMapsUrl}
        confirmOwnership={onboarding.confirmOwnership}
        setConfirmOwnership={onboarding.setConfirmOwnership}
        verifyLoading={onboarding.verifyLoading}
        submitVerification={onboarding.submitVerification}
        handleSingleFile={onboarding.handleSingleFile}
        handleVerifyFiles={onboarding.handleVerifyFiles}
      />
    );
  }

  // ─── OWNER DASHBOARD ─────────────────────────────────────────────────────────
  if (view === 'owner-dashboard' && user && userRole === 'owner') {
    return (
      <OwnerDashboard
        user={user}
        toasts={toasts}
        subscription={subscription}
        isSubscribed={isSubscribed}
        isPro={isPro}
        verificationRequest={ownerDashboard.verificationRequest}
        linkedRestaurant={ownerDashboard.linkedRestaurant}
        dashboardReviews={ownerDashboard.dashboardReviews}
        loadingDashboard={ownerDashboard.loadingDashboard}
        savingProfile={ownerDashboard.savingProfile}
        editDescription={ownerDashboard.editDescription}
        setEditDescription={ownerDashboard.setEditDescription}
        editHours={ownerDashboard.editHours}
        setEditHours={ownerDashboard.setEditHours}
        editWebsiteUrl={ownerDashboard.editWebsiteUrl}
        setEditWebsiteUrl={ownerDashboard.setEditWebsiteUrl}
        editMapsUrl={ownerDashboard.editMapsUrl}
        setEditMapsUrl={ownerDashboard.setEditMapsUrl}
        coverImagePreview={ownerDashboard.coverImagePreview}
        handleCoverChange={ownerDashboard.handleCoverChange}
        saveProfile={ownerDashboard.saveProfile}
        analyticsStats={ownerDashboard.analyticsStats}
        handleLogout={handleLogout}
        setView={setView}
        handleSubscribe={handleSubscribe}
        handleUpgrade={handleUpgrade}
        handleCancel={handleCancel}
        loadingSub={loadingSub}
        upgradingToPro={upgradingToPro}
        cancellingSubscription={cancellingSubscription}
        notifications={notifications}
        unreadCount={unreadCount}
        markAllRead={markAllRead}
        allLinkedRestaurants={ownerDashboard.allLinkedRestaurants}
        activeIndex={ownerDashboard.activeIndex}
        onSwitchRestaurant={ownerDashboard.switchRestaurant}
        onAddRestaurant={handleAddRestaurant}
      />
    );
  }

  // ─── PRICING VIEW ─────────────────────────────────────────────────────────
  if (view === 'pricing') {
    return (
      <PricingView
        setView={setView}
        handleSubscribe={handleSubscribe}
        loadingSub={loadingSub}
      />
    );
  }

  // ─── RESTAURANT DETAIL VIEW ───────────────────────────────────────────────
  if (view === 'restaurant' && selected) {
    return (
      <RestaurantDetailView
        selected={selected}
        setSelected={setSelected}
        toasts={toasts}
        user={user}
        handleLogin={handleLogin}
        handleLogout={handleLogout}
        setView={setView}
        userRole={userRole}
        isSubscribed={isSubscribed}
        isPro={isPro}
        reviews={reviews}
        reviewText={reviewText}
        setReviewText={setReviewText}
        rating={rating}
        setRating={setRating}
        photo={photo}
        photoPreview={photoPreview}
        submitting={submitting}
        aiSummary={aiSummary}
        loadingSummary={loadingSummary}
        advancedSummary={advancedSummary}
        loadingAdvanced={loadingAdvanced}
        certVisible={certVisible}
        setCertVisible={setCertVisible}
        familyFriendly={familyFriendly}
        setFamilyFriendly={setFamilyFriendly}
        replyingTo={replyingTo}
        setReplyingTo={setReplyingTo}
        replyText={replyText}
        setReplyText={setReplyText}
        submittingReply={submittingReply}
        isListening={isListening}
        speechSupported={speechSupported}
        handlePhotoChange={handlePhotoChange}
        toggleListening={toggleListening}
        submitReview={submitReview}
        submitReply={submitReply}
        submitReport={submitReport}
        generateSummary={generateSummary}
        generateAdvancedSummary={generateAdvancedSummary}
        shareRestaurant={shareRestaurant}
        getAnalytics={getAnalytics}
        ratingCount={ratingCount}
      />
    );
  }

  // ─── HOME VIEW ────────────────────────────────────────────────────────────
  return (
    <HomeView
      user={user}
      userRole={userRole}
      handleLogin={handleHeaderLogin}
      handleLogout={handleLogout}
      onStartOwnerOnboarding={() => setOwnerStep(1)}
      onOwnerSignIn={handleOwnerSignIn}
      view={view}
      setView={setView}
      selected={selected}
      setSelected={setSelected}
      toasts={toasts}
      restaurants={restaurants}
      loadingRestaurants={loadingRestaurants}
      reviewStats={reviewStats}
      topRated={topRated}
      recentRestaurants={recentRestaurants}
      openRestaurant={rest => openRestaurant(rest, setReviews, setAiSummary, setAdvancedSummary)}
      favourites={favourites}
      toggleFavourite={toggleFavourite}
      search={search}
      setSearch={setSearch}
      cuisineFilter={cuisineFilter}
      setCuisineFilter={setCuisineFilter}
      cityFilter={cityFilter}
      setCityFilter={setCityFilter}
      openNowFilter={openNowFilter}
      setOpenNowFilter={setOpenNowFilter}
      sortBy={sortBy}
      setSortBy={setSortBy}
      showAllCuisines={showAllCuisines}
      setShowAllCuisines={setShowAllCuisines}
      showSuggestions={showSuggestions}
      setShowSuggestions={setShowSuggestions}
      highlightedIdx={highlightedIdx}
      setHighlightedIdx={setHighlightedIdx}
      searchContainerRef={searchContainerRef}
      cities={cities}
      sortedFiltered={sortedFiltered}
      suggestions={suggestions}
      handleSuggestionSelect={handleSuggestionSelect}
      showInstallBanner={showInstallBanner}
      setShowInstallBanner={setShowInstallBanner}
      deferredPrompt={deferredPrompt}
      setDeferredPrompt={setDeferredPrompt}
    />
  );
}
