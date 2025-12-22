import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Trash2,
    Edit2,
    PlusCircle,
    ArrowLeft,
    Save,
    X,
    Database,
    AlertCircle,
    Loader2
} from 'lucide-react';
import { db } from '../../firebaseConfig';
import {
    doc,
    getDoc,
    updateDoc,
    serverTimestamp
} from 'firebase/firestore';

const EditQuestion = ({ categoryId, onBack }) => {
    const [categoryData, setCategoryData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState(null);

    // Form for adding new entry
    const [newDef, setNewDef] = useState('');
    const [newAns, setNewAns] = useState('');

    // Modal for editing entry
    const [editingEntry, setEditingEntry] = useState(null); // { id, definition, answer }
    const [editDef, setEditDef] = useState('');
    const [editAns, setEditAns] = useState('');

    useEffect(() => {
        fetchCategoryData();
    }, [categoryId]);

    const fetchCategoryData = async () => {
        setLoading(true);
        setError(null);
        try {
            const docRef = doc(db, 'question-data', categoryId);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                const data = docSnap.data();
                // Map existing questions to include IDs if they don't have them
                const sanitizedQuestions = (data.questions || []).map((q, idx) => ({
                    ...q,
                    id: q.id || `${Date.now()}-${idx}`
                }));
                setCategoryData({ ...data, questions: sanitizedQuestions });
            } else {
                setError("Category document not found in database.");
            }
        } catch (err) {
            console.error("Error fetching category:", err);
            setError("Failed to load category data.");
        } finally {
            setLoading(false);
        }
    };

    const handleAddEntry = async (e) => {
        e.preventDefault();
        if (!newDef.trim() || !newAns.trim()) return;

        setActionLoading(true);
        try {
            const newEntry = {
                id: Date.now().toString(),
                definition: newDef.trim(),
                answer: newAns.trim().toUpperCase()
            };

            const updatedQuestions = [...(categoryData.questions || []), newEntry];
            const docRef = doc(db, 'question-data', categoryId);

            // We also update the top-level definition/answer for backward compatibility 
            // with the game engine which might still look for a single featured item.
            await updateDoc(docRef, {
                questions: updatedQuestions,
                definition: updatedQuestions[0]?.definition || "",
                answer: updatedQuestions[0]?.answer || "",
                updatedAt: serverTimestamp()
            });

            setCategoryData(prev => ({ ...prev, questions: updatedQuestions }));
            setNewDef('');
            setNewAns('');
        } catch (err) {
            console.error("Error adding entry:", err);
            setError("Failed to add entry.");
        } finally {
            setActionLoading(false);
        }
    };

    const handleDeleteEntry = async (entryId) => {
        if (!window.confirm("Are you sure you want to delete this entry?")) return;

        setActionLoading(true);
        try {
            const updatedQuestions = (categoryData.questions || []).filter(e => e.id !== entryId);
            const docRef = doc(db, 'question-data', categoryId);

            await updateDoc(docRef, {
                questions: updatedQuestions,
                definition: updatedQuestions[0]?.definition || "",
                answer: updatedQuestions[0]?.answer || "",
                updatedAt: serverTimestamp()
            });

            setCategoryData(prev => ({ ...prev, questions: updatedQuestions }));
        } catch (err) {
            console.error("Error deleting entry:", err);
            setError("Failed to delete entry.");
        } finally {
            setActionLoading(false);
        }
    };

    const handleOpenEdit = (entry) => {
        setEditingEntry(entry);
        setEditDef(entry.definition);
        setEditAns(entry.answer);
    };

    const handleUpdateEntry = async () => {
        if (!editDef.trim() || !editAns.trim()) return;

        setActionLoading(true);
        try {
            const updatedQuestions = (categoryData.questions || []).map(e =>
                e.id === editingEntry.id
                    ? { ...e, definition: editDef.trim(), answer: editAns.trim().toUpperCase() }
                    : e
            );

            const docRef = doc(db, 'question-data', categoryId);
            await updateDoc(docRef, {
                questions: updatedQuestions,
                definition: updatedQuestions[0]?.definition || "",
                answer: updatedQuestions[0]?.answer || "",
                updatedAt: serverTimestamp()
            });

            setCategoryData(prev => ({ ...prev, questions: updatedQuestions }));
            setEditingEntry(null);
        } catch (err) {
            console.error("Error updating entry:", err);
            setError("Failed to update entry.");
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-96">
                <Loader2 className="w-12 h-12 text-cyan-400 animate-spin mb-4" />
                <p className="text-white/60 font-bold italic">Loading mathematical data...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <motion.button
                    whileHover={{ scale: 1.1, x: -5 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={onBack}
                    className="bg-white/10 p-3 rounded-2xl border-2 border-white/20 hover:bg-white/20 text-white transition-all shadow-lg"
                >
                    <ArrowLeft className="w-6 h-6" />
                </motion.button>
                <div>
                    <h2 className="text-white/40 text-sm font-bold uppercase tracking-widest mb-1">
                        Admin / Game Content / Edit
                    </h2>
                    <h1 className="text-4xl font-black text-white tracking-tight drop-shadow-md">
                        {categoryData?.categoryName || "Category Editor"}
                    </h1>
                </div>
            </div>

            {error && (
                <div className="bg-red-500/20 border border-red-500/50 p-4 rounded-2xl flex items-center gap-3 text-red-200 shadow-lg">
                    <AlertCircle className="w-6 h-6 shrink-0" />
                    <p className="font-medium">{error}</p>
                    <button onClick={() => setError(null)} className="ml-auto hover:text-white">
                        <X className="w-5 h-5" />
                    </button>
                </div>
            )}

            {/* Add Entry Card */}
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/10 backdrop-blur-md border border-white/20 rounded-[2rem] p-8 shadow-2xl"
            >
                <div className="flex items-center gap-3 mb-6">
                    <div className="bg-emerald-500/20 p-2 rounded-xl border border-emerald-500/30">
                        <PlusCircle className="w-6 h-6 text-emerald-400" />
                    </div>
                    <h3 className="text-xl font-bold text-white">Add New Definition</h3>
                </div>

                <form onSubmit={handleAddEntry} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    <div className="lg:col-span-12">
                        <label className="block text-xs font-black text-cyan-200 uppercase mb-2 tracking-widest">Question Definition</label>
                        <textarea
                            value={newDef}
                            onChange={(e) => setNewDef(e.target.value)}
                            placeholder="Enter the mathematical definition or rule..."
                            className="w-full bg-black/20 border-2 border-white/10 rounded-2xl p-4 text-white placeholder-white/20 focus:border-cyan-400/50 focus:bg-black/40 outline-none transition-all resize-none h-24"
                            disabled={actionLoading}
                        />
                    </div>
                    <div className="lg:col-span-8">
                        <label className="block text-xs font-black text-cyan-200 uppercase mb-2 tracking-widest">Correct Answer</label>
                        <input
                            type="text"
                            value={newAns}
                            onChange={(e) => setNewAns(e.target.value)}
                            placeholder="EXPECTED ANSWER"
                            className="w-full bg-black/20 border-2 border-white/10 rounded-xl p-4 text-white placeholder-white/20 focus:border-cyan-400/50 focus:bg-black/40 outline-none transition-all font-mono uppercase tracking-widest"
                            disabled={actionLoading}
                        />
                    </div>
                    <div className="lg:col-span-4 flex items-end">
                        <button
                            type="submit"
                            disabled={actionLoading || !newDef.trim() || !newAns.trim()}
                            className="w-full p-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-black shadow-xl shadow-emerald-900/20 flex items-center justify-center gap-2 transition-all transform active:scale-95"
                        >
                            {actionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                            SAVE ENTRY
                        </button>
                    </div>
                </form>
            </motion.div>

            {/* List Section */}
            <div className="space-y-6">
                <div className="flex items-center justify-between px-2">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <Database className="w-5 h-5 text-cyan-400" />
                        Stored Definitions
                    </h3>
                    <span className="bg-white/10 px-3 py-1 rounded-full text-[10px] font-black uppercase text-white/40 tracking-widest">
                        Total Items: {categoryData?.questions?.length || 0}
                    </span>
                </div>

                <div className="grid grid-cols-1 gap-4">
                    <AnimatePresence>
                        {(categoryData?.questions || []).map((entry, index) => (
                            <motion.div
                                key={entry.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ delay: index * 0.05 }}
                                className="group relative bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl p-6 transition-all hover:border-cyan-500/30 overflow-hidden"
                            >
                                {/* Index Badge */}
                                <div className="absolute top-0 left-0 bg-white/10 px-3 py-1 rounded-br-2xl border-r border-b border-white/10 group-hover:bg-cyan-500/20 group-hover:border-cyan-500/30 transition-all">
                                    <span className="text-[10px] font-black text-white/40 group-hover:text-cyan-300 tracking-tighter">#{index + 1}</span>
                                </div>

                                <div className="flex justify-between items-start gap-12 mt-2">
                                    <div className="space-y-3 flex-1">
                                        <p className="text-white/80 leading-relaxed font-medium">
                                            {entry.definition}
                                        </p>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-black text-cyan-400/60 uppercase tracking-widest">ANSWER:</span>
                                            <code className="text-sm font-black text-white bg-cyan-500/10 px-3 py-1 rounded-xl border border-cyan-500/20 uppercase tracking-wider shadow-sm">
                                                {entry.answer}
                                            </code>
                                        </div>
                                    </div>

                                    {/* Hover Actions */}
                                    <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all duration-300">
                                        <motion.button
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.9 }}
                                            onClick={() => handleOpenEdit(entry)}
                                            className="p-3 bg-blue-500 hover:bg-blue-400 text-white rounded-xl transition-all shadow-lg shadow-blue-900/40 border border-blue-400/50"
                                            title="Edit Item"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </motion.button>
                                        <motion.button
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.9 }}
                                            onClick={() => handleDeleteEntry(entry.id)}
                                            className="p-3 bg-red-500 hover:bg-red-400 text-white rounded-xl transition-all shadow-lg shadow-red-900/40 border border-red-400/50"
                                            title="Delete Item"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </motion.button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {(!categoryData?.questions || categoryData.questions.length === 0) && (
                        <div className="bg-white/5 border-2 border-dashed border-white/10 rounded-3xl p-12 text-center text-white/20">
                            <AlertCircle className="w-12 h-12 mx-auto mb-4" />
                            <p className="text-xl font-bold italic tracking-wide">No definitions stored for this category yet.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal for Editing */}
            <AnimatePresence>
                {editingEntry && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="bg-[#023e8a] border-2 border-white/20 p-8 rounded-[2rem] shadow-2xl max-w-2xl w-full"
                        >
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-3">
                                    <Edit2 className="w-6 h-6 text-cyan-300" />
                                    <h2 className="text-2xl font-black text-white">Edit Definition</h2>
                                </div>
                                <button
                                    onClick={() => setEditingEntry(null)}
                                    className="p-2 hover:bg-white/10 rounded-full transition-colors"
                                >
                                    <X className="w-6 h-6 text-white/50" />
                                </button>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <label className="block text-xs font-black text-cyan-200 uppercase mb-2 tracking-widest">Definition</label>
                                    <textarea
                                        value={editDef}
                                        onChange={(e) => setEditDef(e.target.value)}
                                        className="w-full bg-black/20 border-2 border-white/10 rounded-2xl p-4 text-white focus:border-cyan-400/50 outline-none transition-all h-32 resize-none"
                                        disabled={actionLoading}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-cyan-200 uppercase mb-2 tracking-widest">Correct Answer</label>
                                    <input
                                        type="text"
                                        value={editAns}
                                        onChange={(e) => setEditAns(e.target.value)}
                                        className="w-full bg-black/20 border-2 border-white/10 rounded-xl p-4 text-white focus:border-cyan-400/50 outline-none transition-all font-mono uppercase tracking-widest"
                                        disabled={actionLoading}
                                    />
                                </div>

                                <div className="flex gap-4 pt-4">
                                    <button
                                        onClick={() => setEditingEntry(null)}
                                        className="flex-1 p-4 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold transition-all"
                                        disabled={actionLoading}
                                    >
                                        CANCEL
                                    </button>
                                    <button
                                        onClick={handleUpdateEntry}
                                        disabled={actionLoading || !editDef.trim() || !editAns.trim()}
                                        className="flex-1 p-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl font-black shadow-xl shadow-cyan-900/20 flex items-center justify-center gap-2 transition-all"
                                    >
                                        {actionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                        UPDATE ITEM
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default EditQuestion;
