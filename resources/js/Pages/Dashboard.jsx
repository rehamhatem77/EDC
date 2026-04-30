import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, usePage } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'edc-weekly-schedule-demo-v3';
const WEATHER_LATITUDE = 29.3759;
const WEATHER_LONGITUDE = 47.9774;
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'];
const RIG_REGIONS = ['Saudi Arabia', 'Abu Rudies Rigs'];
const SLOT_COUNT = 6;
const RIG_SLOT_COUNT = 12;
const RIG_SLOT_COLUMNS = 6;
const COLOR_OPTIONS = [
    { key: 'offshore', label: 'Offshore', value: '#16a34a' },
    { key: 'work-over', label: 'Work Over', value: '#2563eb' },
    { key: 'land', label: 'Land', value: '#dc2626' },
];
const DAY_TEMPERATURES = {
    Sunday: '18°C',
    Monday: '19°C',
    Tuesday: '20°C',
    Wednesday: '18°C',
    Thursday: '17°C',
};

function getWeatherLabel(code) {
    if (code === 0) {
        return { label: 'Clear', icon: '☀️' };
    }
    if ([1, 2, 3].includes(code)) {
        return { label: 'Partly cloudy', icon: '⛅' };
    }
    if ([45, 48].includes(code)) {
        return { label: 'Foggy', icon: '🌫️' };
    }
    if ([51, 53, 55, 56, 57].includes(code)) {
        return { label: 'Drizzle', icon: '🌦️' };
    }
    if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) {
        return { label: 'Rain', icon: '🌧️' };
    }
    if ([71, 73, 75, 77, 85, 86].includes(code)) {
        return { label: 'Snow', icon: '❄️' };
    }
    if ([95, 96, 99].includes(code)) {
        return { label: 'Thunderstorm', icon: '⛈️' };
    }
    return { label: 'Weather update', icon: '☁️' };
}

function getCurrentIsoWeek() {
    const date = new Date();
    const utcDate = new Date(
        Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
    );
    const dayNumber = utcDate.getUTCDay() || 7;
    utcDate.setUTCDate(utcDate.getUTCDate() + 4 - dayNumber);
    const yearStart = new Date(Date.UTC(utcDate.getUTCFullYear(), 0, 1));
    const weekNumber = Math.ceil(((utcDate - yearStart) / 86400000 + 1) / 7);
    return `${utcDate.getUTCFullYear()}-W${String(weekNumber).padStart(2, '0')}`;
}

function getSundayToThursdayForWeek(isoWeek) {
    const match = /^(\d{4})-W(\d{2})$/.exec(isoWeek || '');
    if (!match) {
        return DAYS.map((dayName) => ({
            dayName,
            dateLabel: '',
            temperature: DAY_TEMPERATURES[dayName],
        }));
    }

    const year = Number(match[1]);
    const week = Number(match[2]);
    const jan4 = new Date(Date.UTC(year, 0, 4));
    const jan4Day = jan4.getUTCDay() || 7;
    const mondayWeek1 = new Date(jan4);
    mondayWeek1.setUTCDate(jan4.getUTCDate() - jan4Day + 1);

    const monday = new Date(mondayWeek1);
    monday.setUTCDate(mondayWeek1.getUTCDate() + (week - 1) * 7);

    const sunday = new Date(monday);
    sunday.setUTCDate(monday.getUTCDate() - 1);

    return DAYS.map((dayName, index) => {
        const date = new Date(sunday);
        date.setUTCDate(sunday.getUTCDate() + index);
        return {
            dayName,
            dateLabel: date.toLocaleDateString([], { month: 'short', day: '2-digit' }),
            temperature: DAY_TEMPERATURES[dayName],
        };
    });
}

export default function Dashboard() {
    const { url } = usePage();
    const [time, setTime] = useState(new Date());
    const [selectedWeek, setSelectedWeek] = useState(getCurrentIsoWeek());
    const [scheduleByWeek, setScheduleByWeek] = useState({});
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [activeCell, setActiveCell] = useState({ day: DAYS[0], slot: 1 });
    const [note, setNote] = useState('');
    const [selectedColor, setSelectedColor] = useState(COLOR_OPTIONS[1].value);
    const [nextSlotsCount, setNextSlotsCount] = useState(0);
    const [liveWeather, setLiveWeather] = useState({
        temperature: '--°C',
        humidity: '--%',
        condition: 'Loading',
        icon: '☁️',
    });

    useEffect(() => {
        try {
            const rawData = localStorage.getItem(STORAGE_KEY);
            if (!rawData) {
                return;
            }

            const parsedData = JSON.parse(rawData);
            if (parsedData && typeof parsedData === 'object') {
                setScheduleByWeek(parsedData);
            }
        } catch (error) {
            console.error('Failed to read schedule from localStorage:', error);
        }
    }, []);

    useEffect(() => {
        const interval = setInterval(() => {
            setTime(new Date());
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const controller = new AbortController();

        async function fetchWeather() {
            try {
                const response = await fetch(
                    `https://api.open-meteo.com/v1/forecast?latitude=${WEATHER_LATITUDE}&longitude=${WEATHER_LONGITUDE}&current=temperature_2m,relative_humidity_2m,weather_code&timezone=auto`,
                    { signal: controller.signal },
                );
                if (!response.ok) {
                    throw new Error(`Weather API failed: ${response.status}`);
                }

                const data = await response.json();
                const current = data?.current;
                if (!current) {
                    return;
                }

                const weatherMeta = getWeatherLabel(current.weather_code);
                setLiveWeather({
                    temperature: `${Math.round(current.temperature_2m)}°C`,
                    humidity: `${Math.round(current.relative_humidity_2m)}%`,
                    condition: weatherMeta.label,
                    icon: weatherMeta.icon,
                });
            } catch (error) {
                if (error.name !== 'AbortError') {
                    console.error('Failed to fetch live weather', error);
                }
            }
        }

        fetchWeather();
        const refresh = setInterval(fetchWeather, 15 * 60 * 1000);

        return () => {
            controller.abort();
            clearInterval(refresh);
        };
    }, []);

    const formattedTime = time.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    });

    const formattedDate = time.toLocaleDateString([], {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    const weekData = scheduleByWeek[selectedWeek] || {};
    const dayInfo = useMemo(
        () => getSundayToThursdayForWeek(selectedWeek),
        [selectedWeek],
    );
    const operationalWindow = `${dayInfo[0]?.dateLabel || ''} — ${dayInfo[dayInfo.length - 1]?.dateLabel || ''}`;
    const activeView = useMemo(() => {
        const query = url.split('?')[1] || '';
        const params = new URLSearchParams(query);
        return params.get('view') === 'rig' ? 'rig' : 'schedule';
    }, [url]);

    const saveToLocalStorage = (nextState) => {
        setScheduleByWeek(nextState);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
    };

    const openSlotModal = (day, slot) => {
        const existing = weekData[day]?.[slot];
        setActiveCell({ day, slot });
        setNote(existing?.note || '');
        setSelectedColor(existing?.bgColor || COLOR_OPTIONS[1].value);
        setNextSlotsCount(0);
        setIsModalOpen(true);
    };

    const handleSaveSlot = () => {
        const trimmedNote = note.trim();
        if (!trimmedNote) {
            return;
        }

        const maxNextSlots = SLOT_COUNT - activeCell.slot;
        const safeNextSlots = Math.min(
            Math.max(0, Number(nextSlotsCount) || 0),
            maxNextSlots,
        );
        const groupId = `${Date.now()}-${activeCell.day}-${activeCell.slot}`;

        const nextState = structuredClone(scheduleByWeek);
        if (!nextState[selectedWeek]) {
            nextState[selectedWeek] = {};
        }

        if (!nextState[selectedWeek][activeCell.day]) {
            nextState[selectedWeek][activeCell.day] = {};
        }

        for (
            let slot = activeCell.slot;
            slot <= activeCell.slot + safeNextSlots;
            slot += 1
        ) {
            nextState[selectedWeek][activeCell.day][slot] = {
                note: trimmedNote,
                bgColor: selectedColor,
                slotNumber: slot,
                groupId,
            };
        }

        saveToLocalStorage(nextState);
        setIsModalOpen(false);
    };

   const handleClearSlot = () => {
    const nextState = structuredClone(scheduleByWeek);
    const weekRecord = nextState[selectedWeek];
    const dayRecord = weekRecord?.[activeCell.day];

    if (!dayRecord?.[activeCell.slot]) {
        return;
    }


    delete dayRecord[activeCell.slot];

   
    if (Object.keys(dayRecord).length === 0) {
        delete weekRecord[activeCell.day];
    }
    if (Object.keys(weekRecord).length === 0) {
        delete nextState[selectedWeek];
    }

    saveToLocalStorage(nextState);
    setIsModalOpen(false);
};

    return (
        <AuthenticatedLayout>
            <Head title="Dashboard" />

            <div className="flex flex-col gap-6">
                <div className="flex items-end justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-white">
                            Supply Truck Weekly Scheduale
                        </h1>
                        <p className="mt-1 text-sm text-slate-400">
                            Operational window: {operationalWindow}
                        </p>
                    </div>

                    <div className="flex items-end gap-3">
                        <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-2">
                            <div className="grid grid-cols-3 gap-4 text-xs">
                                <div className="flex items-center justify-center gap-2 whitespace-nowrap">
                                    <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                                    Offshore
                                </div>
                                <div className="flex items-center justify-center gap-2 whitespace-nowrap">
                                    <span className="h-2 w-2 rounded-full bg-blue-500"></span>
                                    Work Over
                                </div>
                                <div className="flex items-center justify-center gap-2 whitespace-nowrap">
                                    <span className="h-2 w-2 rounded-full bg-red-500"></span>
                                    Land
                                </div>
                            </div>
                        </div>

                        <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                            <label className="mb-1 block text-xs text-slate-400">
                                Select week
                            </label>
                            <input
                                type="week"
                                value={selectedWeek}
                                onChange={(event) =>
                                    setSelectedWeek(event.target.value)
                                }
                                className="rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white focus:outline-none"
                            />
                        </div>
                    </div>
                </div>

                <div className="flex gap-6">
                    <div className="flex-1 rounded-2xl border border-white/10 bg-[#1a202c]/50 p-6">
                        <h2 className="mb-6 text-xl font-semibold text-white">
                            {activeView === 'rig'
                                ? 'Rig Locations Board'
                                : 'Weekly Schedule Board'}
                        </h2>

                        {activeView === 'rig' ? (
                            <div className="overflow-x-auto">
                                <div className="mb-4 grid min-w-[600px] grid-cols-7 gap-2">
                                    <div className="text-xs font-bold text-slate-400">
                                        REGION / SLOT
                                    </div>
                                    {Array.from({ length: RIG_SLOT_COLUMNS }, (_, index) => (
                                        <div
                                            key={`rig-head-${index + 1}`}
                                            className="text-center text-xs font-bold text-slate-500"
                                        >
                                            SLOT {String(index + 1).padStart(2, '0')}
                                        </div>
                                    ))}
                                </div>
                                <div className="space-y-3 min-w-[600px]">
                                    {RIG_REGIONS.map((region) => (
                                        <div
                                            key={region}
                                            className="grid grid-cols-7 gap-2"
                                        >
                                            <div className="row-span-2 rounded-lg border border-white/10 bg-[#0f172a] p-3 flex items-center justify-center text-center">
                                                <div className="text-sm font-bold text-white">
                                                    {region}
                                                </div>
                                            </div>
                                            {Array.from(
                                                { length: RIG_SLOT_COLUMNS },
                                                (_, index) => (
                                                    <div
                                                        key={`${region}-top-${index + 1}`}
                                                        className="h-20 bg-[#0b1220] border border-white/5 rounded-lg flex items-center justify-center text-slate-600"
                                                    >
                                                        <div className="text-center">
                                                            <div className="text-[11px] font-bold text-slate-500">
                                                                SLOT {String(index + 1).padStart(2, '0')}
                                                            </div>
                                                            <span className="text-2xl">+</span>
                                                        </div>
                                                    </div>
                                                ),
                                            )}
                                            {Array.from(
                                                { length: RIG_SLOT_COLUMNS },
                                                (_, index) => (
                                                    <div
                                                        key={`${region}-bottom-${index + 1}`}
                                                        className="h-20 bg-[#0b1220] border border-white/5 rounded-lg flex items-center justify-center text-slate-600"
                                                    >
                                                        <div className="text-center">
                                                            <div className="text-[11px] font-bold text-slate-500">
                                                                SLOT {String(index + 1 + RIG_SLOT_COLUMNS).padStart(2, '0')}
                                                            </div>
                                                            <span className="text-2xl">+</span>
                                                        </div>
                                                    </div>
                                                ),
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <div className="mb-4 grid min-w-[600px] grid-cols-7 gap-2">
                                    <div className="text-xs font-bold text-slate-400">
                                        DAY / SLOT
                                    </div>

                                    {Array.from({ length: SLOT_COUNT }, (_, index) => (
                                        <div
                                            key={index + 1}
                                            className="text-center text-xs font-bold text-slate-500"
                                        >
                                            SLOT {String(index + 1).padStart(2, '0')}
                                        </div>
                                    ))}
                                </div>

                                <div className="space-y-3 min-w-[600px]">
                                    {dayInfo.map((day) => (
                                        <div
                                            key={day.dayName}
                                            className="grid grid-cols-7 gap-2"
                                        >
                                            <div className="rounded-lg border border-white/10 bg-[#0f172a] p-3">
                                                <div className="text-sm font-bold text-white">
                                                    {day.dayName}
                                                </div>
                                                <div className="text-[11px] text-slate-400">
                                                    {day.dateLabel}
                                                </div>
                                                <div className="text-[11px] text-slate-500">
                                                    {day.temperature}
                                                </div>
                                            </div>

                                            {Array.from(
                                                { length: SLOT_COUNT },
                                                (_, index) => {
                                                    const slot = index + 1;
                                                    const item = weekData[day.dayName]?.[slot];

                                                    if (!item) {
                                                        return (
                                                            <button
                                                                type="button"
                                                                key={`${day.dayName}-${slot}`}
                                                                onClick={() =>
                                                                    openSlotModal(
                                                                        day.dayName,
                                                                        slot,
                                                                    )
                                                                }
                                                                className="h-20 bg-[#0b1220] border border-white/5 rounded-lg flex items-center justify-center text-slate-600 hover:bg-white/5 transition"
                                                            >
                                                                <span className="text-2xl">+</span>
                                                            </button>
                                                        );
                                                    }

                                                    return (
                                                        <button
                                                            type="button"
                                                            key={`${day.dayName}-${slot}`}
                                                            onClick={() =>
                                                                openSlotModal(
                                                                    day.dayName,
                                                                    slot,
                                                                )
                                                            }
                                                            className="h-20 rounded-lg border border-white/10 p-2 text-[10px] flex flex-col justify-center transition hover:scale-[1.02] hover:shadow-[0_0_12px_rgba(59,130,246,0.2)]"
                                                            style={{
                                                                backgroundColor: item.bgColor,
                                                            }}
                                                        >
                                                            <div className="font-bold truncate">
                                                                Slot {slot}
                                                            </div>
                                                            <div className="text-[9px] opacity-80 mt-1 line-clamp-2">
                                                                {item.note}
                                                            </div>
                                                        </button>
                                                    );
                                                },
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="w-80 space-y-6">
                        <div className="rounded-2xl border border-white/10 bg-[#1a202c]/50 p-6">
                            <div className="flex flex-col items-center text-center">
                                <div className="text-3xl font-bold text-white font-mono">
                                    {formattedTime}
                                </div>

                                <div className="mt-2 text-[11px] tracking-widest text-slate-400 uppercase">
                                    {formattedDate}
                                </div>
                            </div>

                            <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-4">
                                <div className="flex items-center gap-3">
                                    <div className="text-blue-400 text-2xl">
                                        {liveWeather.icon}
                                    </div>
                                    <div>
                                        <div className="text-xl font-bold text-white">
                                            {liveWeather.temperature}
                                        </div>
                                        <div className="text-[10px] text-slate-400 uppercase">
                                            {liveWeather.condition}
                                        </div>
                                    </div>
                                </div>

                                <div className="text-right">
                                    <div className="text-[10px] text-slate-400 uppercase">
                                        Humidity
                                    </div>
                                    <div className="text-sm text-white font-mono">
                                        {liveWeather.humidity}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-white/10 bg-[#1a202c]/50 p-6">
                            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-300">
                                Tips To Use
                            </h3>
                            <div className="space-y-2 text-sm text-slate-300">
                                <p>Click any empty slot (+) to add a schedule note.</p>
                                <p>Choose the color: Offshore, Work Over, or Land.</p>
                                <p>Set number of next slots to fill second, third, and more.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-4">
                    <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#111827] p-6">
                        <h3 className="mb-1 text-lg font-bold text-white">
                            Edit Slot
                        </h3>
                        <p className="mb-4 text-xs text-slate-400">
                            {selectedWeek} | {activeCell.day} | Slot {activeCell.slot}
                        </p>

                        <label className="mb-1 block text-xs text-slate-400">
                            Note
                        </label>
                        <textarea
                            value={note}
                            onChange={(event) => setNote(event.target.value)}
                            placeholder="Write schedule note..."
                            className="h-24 w-full rounded-lg border border-white/10 bg-white/5 p-3 text-sm text-white placeholder:text-slate-500 focus:outline-none"
                        />

                        <label className="mb-2 mt-4 block text-xs text-slate-400">
                            Background color
                        </label>
                        <div className="space-y-2">
                            {COLOR_OPTIONS.map((option) => (
                                <label
                                    key={option.key}
                                    className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
                                        selectedColor === option.value
                                            ? 'border-white/30 bg-white/10 text-white'
                                            : 'border-white/10 bg-white/5 text-slate-300'
                                    }`}
                                >
                                    <input
                                        type="radio"
                                        name="slot-color"
                                        value={option.value}
                                        checked={selectedColor === option.value}
                                        onChange={(event) =>
                                            setSelectedColor(event.target.value)
                                        }
                                    />
                                    <span
                                        className="h-3 w-3 rounded-full"
                                        style={{ backgroundColor: option.value }}
                                    />
                                    {option.label}
                                </label>
                            ))}
                        </div>

                        <label className="mb-1 mt-4 block text-xs text-slate-400">
                            Number of next slots
                        </label>
                        <select
                            value={nextSlotsCount}
                            onChange={(event) =>
                                setNextSlotsCount(Number(event.target.value))
                            }
                            className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white focus:outline-none"
                        >
                            {Array.from(
                                { length: SLOT_COUNT - activeCell.slot + 1 },
                                (_, idx) => (
                                    <option key={idx} value={idx}>
                                        {idx}
                                    </option>
                                ),
                            )}
                        </select>

                        <p className="mt-2 text-xs text-slate-400">
                            Example: 2 means current slot + next 2 slots.
                        </p>

                        <div className="mt-6 flex gap-2">
                            <button
                                type="button"
                                onClick={() => setIsModalOpen(false)}
                                className="flex-1 rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm font-semibold text-white hover:bg-white/10"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleClearSlot}
                                className="flex-1 rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm font-semibold text-white hover:bg-white/10"
                            >
                                Clear slot
                            </button>
                            <button
                                type="button"
                                onClick={handleSaveSlot}
                                className="flex-1 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-500"
                            >
                                Save slot
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}