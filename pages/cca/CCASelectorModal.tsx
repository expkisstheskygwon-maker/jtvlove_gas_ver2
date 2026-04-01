
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiService } from '../../services/apiService';
import { CCA } from '../../types';

interface CCASelectorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (ccaId: string) => void;
}

const CCASelectorModal: React.FC<CCASelectorModalProps> = ({ isOpen, onClose, onSelect }) => {
    const [ccas, setCcas] = useState<CCA[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (isOpen) {
            fetchCCAs();
        }
    }, [isOpen]);

    const fetchCCAs = async () => {
        setIsLoading(true);
        try {
            // Fetch all CCAs ( Super Admin should see all )
            const data = await apiService.getSuperCCAs();
            setCcas(data);
        } catch (error) {
            console.error('Failed to fetch CCAs:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const filteredCCAs = (ccas || []).filter(cca => {
        const matchName = (cca?.name || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchVenue = (cca?.venueName || '').toLowerCase().includes(searchTerm.toLowerCase());
        return matchName || matchVenue;
    });

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="bg-white dark:bg-zinc-900 w-full max-w-xl rounded-[2.5rem] shadow-2xl border border-white/10 overflow-hidden flex flex-col max-h-[80vh]"
                    >
                        <div className="p-8 pb-0">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h2 className="text-2xl font-black tracking-tighter">CCA Portal Mode Login</h2>
                                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mt-1">Please select a staff member to login as.</p>
                                </div>
                                <button onClick={onClose} className="size-10 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center text-gray-500 hover:bg-red-500 hover:text-white transition-all">
                                    <span className="material-symbols-outlined">close</span>
                                </button>
                            </div>

                            <div className="relative mb-6">
                                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">search</span>
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Search by name or venue..."
                                    className="w-full bg-gray-50 dark:bg-zinc-800 border-none rounded-2xl py-4 pl-12 pr-4 text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                                />
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-8 pt-0 space-y-3">
                            {isLoading ? (
                                <div className="flex flex-col items-center justify-center py-20 gap-4">
                                    <div className="size-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                                    <p className="text-[10px] font-black text-gray-500 uppercase">Loading staff list...</p>
                                </div>
                            ) : filteredCCAs.length > 0 ? (
                                filteredCCAs.map(cca => (
                                    <button
                                        key={cca.id}
                                        onClick={() => onSelect(cca.id)}
                                        className="w-full flex items-center justify-between p-5 bg-zinc-50 dark:bg-white/5 rounded-[1.5rem] border border-transparent hover:border-primary/30 hover:bg-white dark:hover:bg-zinc-800 group transition-all"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="size-12 rounded-xl overflow-hidden bg-zinc-200 dark:bg-zinc-700">
                                                <img src={cca.image} className="size-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                            </div>
                                            <div className="text-left">
                                                <div className="flex items-center gap-2">
                                                    <p className="font-black text-sm">{cca.name}</p>
                                                    <span className="px-2 py-0.5 bg-primary/10 text-primary text-[8px] font-black rounded-full uppercase">{cca.grade || 'PRO'}</span>
                                                </div>
                                                <p className="text-[10px] font-bold text-gray-500 flex items-center gap-1">
                                                    <span className="material-symbols-outlined text-[10px]">apartment</span>
                                                    {cca.venueName || 'No Affiliation'}
                                                </p>
                                            </div>
                                        </div>
                                        <span className="material-symbols-outlined text-primary opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all">arrow_forward</span>
                                    </button>
                                ))
                            ) : (
                                <div className="text-center py-20">
                                    <span className="material-symbols-outlined text-4xl text-gray-300 mb-2">search_off</span>
                                    <p className="text-[10px] font-black text-gray-500 uppercase">No search results.</p>
                                </div>
                            )}
                        </div>

                        <div className="p-8 bg-zinc-50 dark:bg-white/3 border-t border-white/5">
                            <p className="text-[9px] font-bold text-gray-400 leading-relaxed">
                                <span className="text-red-500">* Note:</span> Logging into CCA Portal with Super Admin privileges. Schedule changes and gallery modifications are applied in real-time.
                            </p>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default CCASelectorModal;
