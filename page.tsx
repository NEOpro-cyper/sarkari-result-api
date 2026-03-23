'use client';

import { useState, useEffect, useCallback } from 'react';
import type { HomePageData, ApiResponse } from '@/types';

// Default data to show while loading or on error
const defaultData: HomePageData = {
  navigation: [
    { label: 'Home', href: '/' },
    { label: 'Latest Jobs', href: '/latestjobs.php' },
    { label: 'Results', href: '/results.php' },
    { label: 'Admit Card', href: '/admitcard.php' },
    { label: 'Answer Key', href: '/answerkey.php' },
    { label: 'Syllabus', href: '/syllabus.php' },
    { label: 'Search', href: '/search.php' },
    { label: 'Contact Us', href: '/contact.php' },
  ],
  marquees: [
    { id: '1', text: 'Important: Apply for SSC CGL 2024 before last date', href: '#', isImportant: true },
    { id: '2', text: 'UPSC Civil Services 2024 Result Declared', href: '#', isImportant: true },
    { id: '3', text: 'IBPS PO 2024 Notification Released', href: '#' },
  ],
  latestJobs: [
    { id: '1', title: 'SSC CGL 2024 Recruitment - Apply Online', href: '#', postDate: '25/12/2024' },
    { id: '2', title: 'UPSC Civil Services 2024 - Apply Online', href: '#', postDate: '24/12/2024' },
    { id: '3', title: 'IBPS PO 2024 Recruitment - 4455 Posts', href: '#', postDate: '23/12/2024' },
    { id: '4', title: 'Railway RRB NTPC 2024 - Apply Online', href: '#', postDate: '22/12/2024' },
    { id: '5', title: 'SBI Clerk 2024 Recruitment - 8773 Posts', href: '#', postDate: '21/12/2024' },
  ],
  results: [
    { id: '1', title: 'SSC CGL 2023 Final Result', href: '#', postDate: '25/12/2024' },
    { id: '2', title: 'UPSC IES/ISS 2024 Result', href: '#', postDate: '24/12/2024' },
    { id: '3', title: 'RRB Group D 2024 Result', href: '#', postDate: '23/12/2024' },
    { id: '4', title: 'IBPS Clerk 2024 Result', href: '#', postDate: '22/12/2024' },
  ],
  admitCards: [
    { id: '1', title: 'SSC CGL 2024 Admit Card', href: '#', postDate: '25/12/2024' },
    { id: '2', title: 'UPSC NDA 2024 Admit Card', href: '#', postDate: '24/12/2024' },
    { id: '3', title: 'RRB NTPC 2024 Admit Card', href: '#', postDate: '23/12/2024' },
  ],
  answerKeys: [
    { id: '1', title: 'SSC CGL 2024 Answer Key', href: '#', postDate: '25/12/2024' },
    { id: '2', title: 'UPSC CDS 2024 Answer Key', href: '#', postDate: '24/12/2024' },
    { id: '3', title: 'RRB Group D 2024 Answer Key', href: '#', postDate: '23/12/2024' },
  ],
  syllabus: [
    { id: '1', title: 'SSC CGL 2024 Syllabus', href: '#', postDate: '25/12/2024' },
    { id: '2', title: 'UPSC Civil Services Syllabus', href: '#', postDate: '24/12/2024' },
    { id: '3', title: 'IBPS PO Syllabus 2024', href: '#', postDate: '23/12/2024' },
  ],
  admissions: [
    { id: '1', title: 'JEE Main 2024 Registration', href: '#', postDate: '25/12/2024' },
    { id: '2', title: 'NEET 2024 Application Form', href: '#', postDate: '24/12/2024' },
    { id: '3', title: 'CAT 2024 Registration', href: '#', postDate: '23/12/2024' },
  ],
  importantLinks: [
    { id: '1', title: 'SSC Official Website', href: 'https://ssc.nic.in' },
    { id: '2', title: 'UPSC Online', href: 'https://upsconline.nic.in' },
    { id: '3', title: 'Railway Recruitment', href: 'https://rrcb.gov.in' },
  ],
  lastUpdated: new Date().toISOString(),
};

// Section component for displaying content tables
function Section({
  title,
  bgColor,
  items,
  showDate = true,
}: {
  title: string;
  bgColor: string;
  items: Array<{ title: string; href: string; postDate?: string; isImportant?: boolean }>;
  showDate?: boolean;
}) {
  return (
    <div className="bg-white border border-gray-300 mb-4">
      <div
        className="section-header"
        style={{ backgroundColor: bgColor }}
      >
        {title}
      </div>
      <table className="sarkari-table">
        <tbody>
          {items.length === 0 ? (
            <tr>
              <td className="text-center py-4 text-gray-500">No data available</td>
            </tr>
          ) : (
            items.map((item, index) => (
              <tr key={index} className="fade-in" style={{ animationDelay: `${index * 0.05}s` }}>
                <td style={{ width: '85%' }}>
                  <a href={item.href} target="_blank" rel="noopener noreferrer">
                    {item.title}
                  </a>
                  {item.isImportant && <span className="important-badge">Important</span>}
                </td>
                {showDate && (
                  <td className="date-badge text-right" style={{ width: '15%' }}>
                    {item.postDate || ''}
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

// Marquee component
function MarqueeSection({ items }: { items: Array<{ text: string; href?: string }> }) {
  return (
    <div className="bg-yellow-50 border-y border-yellow-200 py-2 px-4 mb-2">
      <div className="marquee-container">
        <div className="marquee-content">
          {items.map((item, index) => (
            <span key={index} className="mx-8">
              {item.href ? (
                <a href={item.href} className="font-semibold text-red-700 hover:text-red-900">
                  {item.text}
                </a>
              ) : (
                <span className="font-semibold text-red-700">{item.text}</span>
              )}
              {index < items.length - 1 && <span className="mx-4">|</span>}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// Main component
export default function SarkariResultClone() {
  const [data, setData] = useState<HomePageData>(defaultData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/scrape/home');
      const result: ApiResponse<HomePageData> = await response.json();

      if (result.success && result.data) {
        // Merge with default data to ensure we have content
        setData({
          navigation: result.data.navigation.length > 0 ? result.data.navigation : defaultData.navigation,
          marquees: result.data.marquees.length > 0 ? result.data.marquees : defaultData.marquees,
          latestJobs: result.data.latestJobs.length > 0 ? result.data.latestJobs : defaultData.latestJobs,
          results: result.data.results.length > 0 ? result.data.results : defaultData.results,
          admitCards: result.data.admitCards.length > 0 ? result.data.admitCards : defaultData.admitCards,
          answerKeys: result.data.answerKeys.length > 0 ? result.data.answerKeys : defaultData.answerKeys,
          syllabus: result.data.syllabus.length > 0 ? result.data.syllabus : defaultData.syllabus,
          admissions: result.data.admissions.length > 0 ? result.data.admissions : defaultData.admissions,
          importantLinks: result.data.importantLinks.length > 0 ? result.data.importantLinks : defaultData.importantLinks,
          lastUpdated: result.data.lastUpdated,
        });
        setError(null);
      } else {
        // Use default data on error
        setError(result.error || 'Using sample data');
        setData(defaultData);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to fetch live data. Showing sample data.');
      setData(defaultData);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="w-full" style={{ backgroundColor: '#ab183d' }}>
        <div className="max-w-5xl mx-auto py-4 px-4">
          {/* Logo Section */}
          <div className="flex flex-col items-center justify-center">
            <img
              src="/sarkari-logo.png"
              alt="Sarkari Result"
              className="h-24 md:h-32 w-auto object-contain"
              onError={(e) => {
                // Fallback if image fails to load
                e.currentTarget.style.display = 'none';
              }}
            />
            <h1 className="text-white text-xl md:text-2xl font-bold tracking-wide mt-2">
              SARKARI RESULT
            </h1>
            <p className="text-white text-sm md:text-base mt-1">
              WWW.SARKARIRESULT.COM
            </p>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="w-full sticky top-0 z-50" style={{ backgroundColor: '#1a1a2e' }}>
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-wrap items-center justify-center">
            {data.navigation.map((item, index) => (
              <a
                key={index}
                href={item.href}
                className="nav-link"
                target={item.href.startsWith('http') ? '_blank' : undefined}
                rel={item.href.startsWith('http') ? 'noopener noreferrer' : undefined}
              >
                {item.label}
              </a>
            ))}
          </div>
        </div>
      </nav>

      {/* Marquee Sections */}
      {data.marquees.length > 0 && (
        <MarqueeSection items={data.marquees} />
      )}

      {/* Loading Indicator */}
      {loading && (
        <div className="flex justify-center items-center py-4">
          <div className="loading-spinner"></div>
          <span className="ml-3 text-gray-600">Loading latest updates...</span>
        </div>
      )}

      {/* Error Message */}
      {error && !loading && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 mx-4 my-2 max-w-5xl lg:mx-auto">
          <p className="text-sm text-yellow-700">
            <strong>Note:</strong> {error}
          </p>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 py-4">
        {/* First Row - Latest Jobs & Results */}
        <div className="content-grid">
          <Section
            title="Latest Jobs"
            bgColor="#cc0000"
            items={data.latestJobs}
          />
          <Section
            title="Results"
            bgColor="#006600"
            items={data.results}
          />
        </div>

        {/* Second Row - Admit Card & Answer Key */}
        <div className="content-grid">
          <Section
            title="Admit Card"
            bgColor="#ff6600"
            items={data.admitCards}
          />
          <Section
            title="Answer Key"
            bgColor="#660066"
            items={data.answerKeys}
          />
        </div>

        {/* Third Row - Syllabus & Admission */}
        <div className="content-grid">
          <Section
            title="Syllabus"
            bgColor="#0066cc"
            items={data.syllabus}
          />
          <Section
            title="Admission"
            bgColor="#cc6600"
            items={data.admissions}
          />
        </div>

        {/* Important Links Section */}
        {data.importantLinks.length > 0 && (
          <div className="bg-white border border-gray-300 mt-4">
            <div
              className="section-header"
              style={{ backgroundColor: '#ab183d' }}
            >
              Important Links
            </div>
            <div className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {data.importantLinks.map((link, index) => (
                  <a
                    key={index}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-3 bg-gray-50 border border-gray-200 rounded hover:bg-gray-100 transition-colors"
                  >
                    {link.title}
                  </a>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Last Updated */}
        <div className="text-center py-4 text-sm text-gray-500">
          Last Updated: {new Date(data.lastUpdated).toLocaleString('en-IN')}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-100 border-t border-gray-300 mt-8">
        <div className="max-w-5xl mx-auto px-4 py-6">
          {/* Footer Links */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div>
              <h3 className="font-bold text-gray-800 mb-2 text-sm">Quick Links</h3>
              <ul className="space-y-1">
                <li><a href="#" className="footer-link">Home</a></li>
                <li><a href="#" className="footer-link">About Us</a></li>
                <li><a href="#" className="footer-link">Contact Us</a></li>
                <li><a href="#" className="footer-link">Privacy Policy</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-gray-800 mb-2 text-sm">Job Categories</h3>
              <ul className="space-y-1">
                <li><a href="#" className="footer-link">Central Govt Jobs</a></li>
                <li><a href="#" className="footer-link">State Govt Jobs</a></li>
                <li><a href="#" className="footer-link">Bank Jobs</a></li>
                <li><a href="#" className="footer-link">Railway Jobs</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-gray-800 mb-2 text-sm">Popular Exams</h3>
              <ul className="space-y-1">
                <li><a href="#" className="footer-link">SSC Exams</a></li>
                <li><a href="#" className="footer-link">UPSC Exams</a></li>
                <li><a href="#" className="footer-link">IBPS Exams</a></li>
                <li><a href="#" className="footer-link">State PSC</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-gray-800 mb-2 text-sm">Resources</h3>
              <ul className="space-y-1">
                <li><a href="#" className="footer-link">Admit Card</a></li>
                <li><a href="#" className="footer-link">Results</a></li>
                <li><a href="#" className="footer-link">Answer Keys</a></li>
                <li><a href="#" className="footer-link">Syllabus</a></li>
              </ul>
            </div>
          </div>

          {/* Disclaimer */}
          <div className="text-center border-t border-gray-300 pt-4">
            <p className="text-xs text-gray-600 mb-2">
              Disclaimer: This website is for informational purposes only. We are not responsible for any incorrect information.
            </p>
            <p className="text-xs text-gray-500">
              © {new Date().getFullYear()} Sarkari Result Clone. All Rights Reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
