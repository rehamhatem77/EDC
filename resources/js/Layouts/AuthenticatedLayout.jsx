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
            <header className="fixed top-0 z-50 flex h-16 w-full items-center justify-between border-b border-white/10 bg-[#1a202c]/60 px-6 backdrop-blur-2xl shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
                <div className="flex items-center gap-8">
                    <Link
                        href={route('dashboard')}
                        className="text-xl font-black tracking-widest uppercase"
                    >
                        EDC
                    </Link>

                    <nav className="hidden items-center gap-6 md:flex">
                        <Link
                            href={route('dashboard')}
                            className="rounded-lg px-3 py-2 text-sm font-bold uppercase text-slate-400 transition hover:bg-white/5"
                        >
                            Dashboard
                        </Link>

                        <Link
                            href={route('dashboard', { view: 'schedule' })}
                            className={`px-3 py-2 text-sm font-bold uppercase transition ${
                                isScheduleView
                                    ? 'border-b-2 border-blue-500 text-blue-400'
                                    : 'rounded-lg text-slate-400 hover:bg-white/5'
                            }`}
                        >
                            Weekly Schedule
                        </Link>

                        <Link
                            href={route('dashboard', { view: 'rig' })}
                            className={`px-3 py-2 text-sm font-bold uppercase transition ${
                                isRigView
                                    ? 'border-b-2 border-blue-500 text-blue-400'
                                    : 'rounded-lg text-slate-400 hover:bg-white/5'
                            }`}
                        >
                            Rig Locations
                        </Link>
                    </nav>
                </div>

                <div className="flex items-center gap-4">
                    <div className="hidden items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-2 md:flex">
                        <span className="material-symbols-outlined text-sm text-blue-500">
                            search
                        </span>
                        <input
                            type="text"
                            placeholder="Quick Search..."
                            className="w-48 border-none bg-transparent text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-0"
                        />
                    </div>

                    {/* <Dropdown>
                        <Dropdown.Trigger>
                            <span className="inline-flex rounded-md">
                                <button
                                    type="button"
                                    className="inline-flex items-center rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
                                >
                                    EDC

                                    <svg
                                        className="ms-2 h-4 w-4"
                                        xmlns="http://www.w3.org/2000/svg"
                                        viewBox="0 0 20 20"
                                        fill="currentColor"
                                    >
                                        <path
                                            fillRule="evenodd"
                                            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                                            clipRule="evenodd"
                                        />
                                    </svg>
                                </button>
                            </span>
                        </Dropdown.Trigger>

                        <Dropdown.Content>
                            <Dropdown.Link>
                                Profile
                            </Dropdown.Link>

                            <Dropdown.Link
                                method="post"
                                as="button"
                            >
                                Log Out
                            </Dropdown.Link>
                        </Dropdown.Content>
                    </Dropdown> */}

                    {/* Mobile Menu Button */}
                    {/* <button
                        onClick={() =>
                            setShowingNavigationDropdown(
                                !showingNavigationDropdown,
                            )
                        }
                        className="rounded-md p-2 text-gray-400 hover:bg-white/5 md:hidden"
                    >
                        <svg
                            className="h-6 w-6"
                            stroke="currentColor"
                            fill="none"
                            viewBox="0 0 24 24"
                        >
                            <path
                                className={
                                    !showingNavigationDropdown
                                        ? 'inline-flex'
                                        : 'hidden'
                                }
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M4 6h16M4 12h16M4 18h16"
                            />
                            <path
                                className={
                                    showingNavigationDropdown
                                        ? 'inline-flex'
                                        : 'hidden'
                                }
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M6 18L18 6M6 6l12 12"
                            />
                        </svg>
                    </button> */}
                </div>
            </header>

            <div className="flex pt-16">
                {/* Sidebar */}
                <aside className="hidden min-h-screen w-50 shrink-0 border-r border-white/10 bg-[#121417] py-6 shadow-2xl md:flex md:flex-col">
                    <div className="mb-8 px-6">
                        <h2 className="text-lg font-bold uppercase tracking-wider">
                            EDC Operations
                        </h2>
                        <p className="text-xs uppercase tracking-widest text-blue-500">
                            Sector 7-Alpha
                        </p>
                    </div>

                    <nav className="space-y-2 px-4">
                        <Link
                            href={route('dashboard')}
                            className="flex items-center rounded-lg px-4 py-3 text-sm text-slate-400 transition hover:bg-white/5 hover:text-white"
                        >
                            Dashboard
                        </Link>

                        <Link
                            href={route('dashboard', { view: 'schedule' })}
                            className={`flex items-center rounded-lg px-4 py-3 text-sm transition ${
                                isScheduleView
                                    ? 'border-l-4 border-blue-500 bg-blue-600/10 font-bold text-blue-400'
                                    : 'text-slate-400 hover:bg-white/5 hover:text-white'
                            }`}
                        >
                            Weekly Schedule
                        </Link>

                        <Link
                            href={route('dashboard', { view: 'rig' })}
                            className={`flex items-center rounded-lg px-4 py-3 text-sm transition ${
                                isRigView
                                    ? 'border-l-4 border-blue-500 bg-blue-600/10 font-bold text-blue-400'
                                    : 'text-slate-400 hover:bg-white/5 hover:text-white'
                            }`}
                        >
                            Rig Locations
                        </Link>

                        <Link
                            href="#"
                            className="flex items-center rounded-lg px-4 py-3 text-sm text-slate-400 transition hover:bg-white/5 hover:text-white"
                        >
                            Reports & Alerts
                        </Link>

                        <Link
                            href="#"
                            className="flex items-center rounded-lg px-4 py-3 text-sm text-slate-400 transition hover:bg-white/5 hover:text-white"
                        >
                            Settings
                        </Link>
                    </nav>
                </aside>

                {/* Main Content */}
                <main className="flex-1 p-6">
                    {children}
                </main>
            </div>
        </div>
    );
}