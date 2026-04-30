import Dropdown from '@/Components/Dropdown';
import { Link, usePage } from '@inertiajs/react';
import { useState } from 'react';

export default function AuthenticatedLayout({ children }) {
    const [showingNavigationDropdown, setShowingNavigationDropdown] =
        useState(false);
    const { url } = usePage();
    const query = url.split('?')[1] || '';
    const params = new URLSearchParams(query);
    const isRigView = params.get('view') === 'rig';
    const isScheduleView = !isRigView;

    return (
        <div className="min-h-screen bg-[#141313] text-white">
            {/* Top Header */}
          <header className="fixed top-0 z-50 flex h-16 w-full items-center justify-between border-b border-white/10 bg-[#1a202c]/60 px-6 backdrop-blur-2xl">
    <h1 className="text-lg font-bold tracking-widest">EDC Dashboard</h1>

    {/* Right side will be injected from page */}
    <div id="header-widget1"></div>
<div id="header-widget2"></div>

</header>

            <div className="pt-16">
               
                {/* Main Content */}
                <main className="flex-1 p-6">
                    {children}
                </main>
            </div>
        </div>
    );
}