import React, { useState, useRef, useEffect } from 'react';
import { TtsVoice, TtsChunkOutput, TtsMode, TtsSpeakerConfig } from '../types';
import { TTS_CHUNK_CHARACTER_LIMIT, voiceOptions } from '../constants';
import Spinner from './Spinner';
import * as geminiService from '../services/geminiService';


interface TtsTabProps {
    text: string;
    setText: (text: string) => void;
    voice: TtsVoice;
    setVoice: (voice: TtsVoice) => void;
    readingStyle: string;
    setReadingStyle: (style: string) => void;
    chunks: string[];
    setChunks: (chunks: string[]) => void;
    ttsChunkOutputs: TtsChunkOutput[] | null;
    isGenerating: boolean;
    onGenerate: () => void;
    onMergeAndDownload: () => void;
    ttsMode: TtsMode;
    setTtsMode: (mode: TtsMode) => void;
    ttsSpeakers: TtsSpeakerConfig[];
    setTtsSpeakers: React.Dispatch<React.SetStateAction<TtsSpeakerConfig[]>>;
    ttsDialogueOutput: TtsChunkOutput | null;
}

const splitTextIntoChunks = (text: string, limit: number): string[] => {
    if (!text) return [];
    if (text.length <= limit) {
        return [text];
    }

    const chunks = [];
    let currentPos = 0;

    while (currentPos < text.length) {
        let end = Math.min(currentPos + limit, text.length);

        if (end < text.length) {
            // Try to find a natural break point (sentence or paragraph)
            let lastPeriod = text.lastIndexOf('.', end);
            let lastQuestion = text.lastIndexOf('?', end);
            let lastExclamation = text.lastIndexOf('!', end);
            let lastNewline = text.lastIndexOf('\n', end);

            let splitPos = Math.max(lastPeriod, lastQuestion, lastExclamation, lastNewline);

            // If a good split point is found within a reasonable range from the end
            if (splitPos > currentPos && splitPos > end - 500) {
                end = splitPos + 1;
            }
        }

        chunks.push(text.substring(currentPos, end).trim());
        currentPos = end;
    }

    return chunks.filter(chunk => chunk.length > 0);
};

// --- Audio Helper Functions (copied from App.tsx to be self-contained) ---
const decodeBase64ToUint8Array = (base64: string): Uint8Array => {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
};

const createWavBlobFromPcm = (pcmBytes: Uint8Array): Blob => {
    const sampleRate = 24000;
    const numChannels = 1;
    const bitsPerSample = 16;
    const dataSize = pcmBytes.length;
    const buffer = new ArrayBuffer(44 + dataSize);
    const view = new DataView(buffer);

    const writeString = (offset: number, str: string) => {
        for (let i = 0; i < str.length; i++) {
            view.setUint8(offset + i, str.charCodeAt(i));
        }
    };

    // RIFF chunk descriptor
    writeString(0, 'RIFF');
    view.setUint32(4, 36 + dataSize, true);
    writeString(8, 'WAVE');
    
    // "fmt " sub-chunk
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numChannels * (bitsPerSample / 8), true);
    view.setUint16(32, numChannels * (bitsPerSample / 8), true);
    view.setUint16(34, bitsPerSample, true);
    
    // "data" sub-chunk
    writeString(36, 'data');
    view.setUint32(40, dataSize, true);
    
    // Write PCM data
    for (let i = 0; i < dataSize; i++) {
        view.setUint8(44 + i, pcmBytes[i]);
    }

    return new Blob([view], { type: 'audio/wav' });
};


const TtsTab: React.FC<TtsTabProps> = ({ 
    text, setText, voice, setVoice, readingStyle, setReadingStyle, 
    chunks, setChunks, ttsChunkOutputs, isGenerating, onGenerate, onMergeAndDownload,
    ttsMode, setTtsMode, ttsSpeakers, setTtsSpeakers, ttsDialogueOutput
}) => {
    const [currentlyPlaying, setCurrentlyPlaying] = useState<number | null>(null);
    const audioRefs = useRef<Map<number, HTMLAudioElement>>(new Map());
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [isVoiceSelectorOpen, setIsVoiceSelectorOpen] = useState(false);
    const [previewingVoice, setPreviewingVoice] = useState<TtsVoice | null>(null);
    const [previewError, setPreviewError] = useState<string | null>(null);
    const previewAudioRef = useRef<HTMLAudioElement | null>(null);
    const voiceSelectorRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Stop playback if chunks are re-processed
        if (currentlyPlaying !== null) {
            const audioEl = audioRefs.current.get(currentlyPlaying);
            if (audioEl) {
                audioEl.pause();
            }
            setCurrentlyPlaying(null);
        }
    }, [chunks]);
    
     // Close voice selector when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (voiceSelectorRef.current && !voiceSelectorRef.current.contains(event.target as Node)) {
                setIsVoiceSelectorOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleProcessText = () => {
        const newChunks = splitTextIntoChunks(text, TTS_CHUNK_CHARACTER_LIMIT);
        setChunks(newChunks);
    };

    const handleChunkChange = (index: number, newText: string) => {
        const newChunks = [...chunks];
        newChunks[index] = newText;
        setChunks(newChunks);
    };

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.type !== 'text/plain') {
            alert('Vui lòng chỉ tải lên file văn bản (.txt).');
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            setText(event.target?.result as string);
        };
        reader.readAsText(file);
        
        // Reset the input value to allow uploading the same file again
        e.target.value = '';
    };

    const playChunk = (playlistIndex: number, playlist: TtsChunkOutput[]) => {
        if (playlistIndex >= playlist.length) {
            setCurrentlyPlaying(null);
            return;
        }

        const output = playlist[playlistIndex];
        const audioEl = audioRefs.current.get(output.chunkIndex);

        if (audioEl) {
            setCurrentlyPlaying(output.chunkIndex);
            audioEl.currentTime = 0;
            audioEl.onended = () => playChunk(playlistIndex + 1, playlist);
            audioEl.play().catch(e => {
                console.error(`Playback failed for chunk ${output.chunkIndex}`, e);
                playChunk(playlistIndex + 1, playlist); // Skip to next on error
            });
        } else {
            playChunk(playlistIndex + 1, playlist); // Skip if audio element not found
        }
    };

    const handlePlayAll = () => {
        if (!ttsChunkOutputs || ttsChunkOutputs.length === 0) return;

        if (currentlyPlaying !== null) {
            const audioEl = audioRefs.current.get(currentlyPlaying);
            if (audioEl) {
                audioEl.pause();
                audioEl.currentTime = 0;
            }
            setCurrentlyPlaying(null);
        } else {
            const playlist = [...ttsChunkOutputs]
                .filter(o => !!o.url) // Filter for successful outputs
                .sort((a, b) => a.chunkIndex - b.chunkIndex);
            if (playlist.length > 0) {
                playChunk(0, playlist);
            }
        }
    };

    const handleDownloadAll = () => {
        if (!ttsChunkOutputs) return;
        ttsChunkOutputs
            .filter(output => output.url) // Only download successful chunks
            .forEach((output, index) => {
            setTimeout(() => {
                const link = document.createElement('a');
                link.href = output.url!;
                link.download = `pidtap-studio-tts-part-${output.chunkIndex + 1}.wav`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }, index * 300);
        });
    };

    const handlePreviewVoice = async (e: React.MouseEvent, voiceId: TtsVoice, sampleText: string) => {
        e.stopPropagation();
        if (previewingVoice) return; // Don't allow multiple previews at once

        if (previewAudioRef.current) {
            previewAudioRef.current.pause();
        }

        setPreviewingVoice(voiceId);
        setPreviewError(null);

        try {
            const audioBase64 = await geminiService.generateSpeech(sampleText, voiceId, '');
            const pcmBytes = decodeBase64ToUint8Array(audioBase64);
            const blob = createWavBlobFromPcm(pcmBytes);
            const url = URL.createObjectURL(blob);
            const audio = new Audio(url);
            previewAudioRef.current = audio;

            audio.onended = () => {
                setPreviewingVoice(null);
                URL.revokeObjectURL(url); // Clean up
            };
            audio.onerror = () => {
                setPreviewError('Lỗi khi phát âm thanh.');
                setPreviewingVoice(null);
                URL.revokeObjectURL(url);
            }
            audio.play();

        } catch (err: any) {
            console.error("Preview error:", err);
            setPreviewError('Không thể tạo bản xem trước.');
            setPreviewingVoice(null);
        }
    };

    const handleSelectVoice = (voiceId: TtsVoice) => {
        setVoice(voiceId);
        setIsVoiceSelectorOpen(false);
    };
    
    const handleSpeakerChange = (index: number, field: keyof TtsSpeakerConfig, value: string) => {
        setTtsSpeakers(prev => {
            const newSpeakers = [...prev];
            newSpeakers[index] = { ...newSpeakers[index], [field]: value };
            return newSpeakers;
        });
    };
    
    const addSpeaker = () => {
        if (ttsSpeakers.length >= 10) return;
        setTtsSpeakers(prev => [...prev, { name: `Người ${prev.length + 1}`, voice: 'Kore', style: '' }]);
    };
    
    const removeSpeaker = (indexToRemove: number) => {
        if (ttsSpeakers.length <= 2) return;
        setTtsSpeakers(prev => prev.filter((_, index) => index !== indexToRemove));
    };

    const hasSuccessfulChunks = ttsChunkOutputs?.some(o => !!o.url) || false;
    const selectedVoiceName = voiceOptions.find(opt => opt.id === voice)?.name || voice;

    return (
        <div className="space-y-6">
            <div className="flex bg-slate-800/70 border border-slate-700 rounded-lg p-1 w-full max-w-sm">
                <button 
                    className={`w-1/2 py-2 text-sm font-semibold rounded-md transition-all ${ttsMode === 'single' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-700/60'}`}
                    onClick={() => setTtsMode('single')}
                    aria-pressed={ttsMode === 'single'}
                >
                    <i className="fa-solid fa-user mr-2"></i> Một giọng đọc
                </button>
                <button 
                    className={`w-1/2 py-2 text-sm font-semibold rounded-md transition-all ${ttsMode === 'dialogue' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-700/60'}`}
                    onClick={() => setTtsMode('dialogue')}
                    aria-pressed={ttsMode === 'dialogue'}
                >
                    <i className="fa-solid fa-users mr-2"></i> Hội thoại
                </button>
            </div>

            {ttsMode === 'single' ? (
                <div className="animate-fade-in space-y-6">
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label htmlFor="tts-text-input" className="block text-sm font-medium text-slate-300">
                                <i className="fa-solid fa-file-audio mr-2 text-indigo-400"></i>
                                1. Nhập văn bản hoặc tải file lên:
                            </label>
                            <button
                                onClick={handleUploadClick}
                                disabled={isGenerating}
                                className="px-3 py-1.5 bg-slate-700 text-white text-xs font-semibold rounded-md hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                            >
                                <i className="fa-solid fa-upload"></i>
                                Tải File (.txt)
                            </button>
                            <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" accept=".txt" />
                        </div>
                        <textarea 
                            id="tts-text-input" 
                            rows={10} 
                            className="w-full bg-slate-900/50 border border-slate-600 rounded-lg px-4 py-2 text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition disabled:opacity-60 disabled:cursor-not-allowed"
                            placeholder="Nhập kịch bản, lời thoại, hoặc bất kỳ văn bản nào bạn muốn AI đọc..."
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            disabled={isGenerating}
                        ></textarea>
                    </div>
                    <div>
                        <label htmlFor="tts-voice-selector-button" className="block text-sm font-medium text-slate-300 mb-2">
                            <i className="fa-solid fa-venus-mars mr-2 text-indigo-400"></i>
                            2. Chọn giọng đọc:
                        </label>
                        <div ref={voiceSelectorRef} className="relative w-full max-w-xs">
                            <button
                                id="tts-voice-selector-button"
                                onClick={() => setIsVoiceSelectorOpen(!isVoiceSelectorOpen)}
                                disabled={isGenerating}
                                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-3 text-left text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition disabled:opacity-60 disabled:cursor-not-allowed flex justify-between items-center"
                            >
                                <span>{selectedVoiceName}</span>
                                <i className={`fa-solid fa-chevron-down transition-transform ${isVoiceSelectorOpen ? 'rotate-180' : ''}`}></i>
                            </button>
                            {isVoiceSelectorOpen && (
                                <div className="absolute z-20 top-full mt-2 w-full max-h-80 overflow-y-auto bg-slate-800 border border-slate-600 rounded-lg shadow-xl p-2 space-y-1">
                                    {previewError && <p className="text-xs text-red-400 p-2">{previewError}</p>}
                                    {voiceOptions.map(opt => (
                                        <div
                                            key={opt.id}
                                            onClick={() => handleSelectVoice(opt.id)}
                                            className={`w-full flex justify-between items-center p-3 rounded-md cursor-pointer transition-colors ${voice === opt.id ? 'bg-indigo-600/50' : 'hover:bg-slate-700/80'}`}
                                        >
                                            <div className="flex-grow pr-2">
                                                <h4 className={`font-semibold ${voice === opt.id ? 'text-white' : 'text-slate-200'}`}>{opt.name}</h4>
                                                <p className="text-xs text-slate-400">{opt.description}</p>
                                            </div>
                                            <button
                                                onClick={(e) => handlePreviewVoice(e, opt.id, opt.sampleText)}
                                                disabled={!!previewingVoice}
                                                title="Nghe thử"
                                                className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-slate-700 hover:bg-indigo-500 rounded-full transition-colors text-slate-300 hover:text-white disabled:bg-slate-600 disabled:cursor-not-allowed"
                                            >
                                                {previewingVoice === opt.id ? <Spinner /> : <i className="fa-solid fa-play"></i>}
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                    <div>
                        <label htmlFor="tts-style-input" className="block text-sm font-medium text-slate-300 mb-2">
                            <i className="fa-solid fa-masks-theater mr-2 text-indigo-400"></i>
                            3. Nhập phong cách đọc (tùy chọn):
                        </label>
                        <textarea 
                            id="tts-style-input" 
                            rows={2} 
                            className="w-full bg-slate-900/50 border border-slate-600 rounded-lg px-4 py-2 text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition disabled:opacity-60 disabled:cursor-not-allowed"
                            placeholder="Ví dụ: vui vẻ, năng lượng, trầm buồn, hùng hồn, thì thầm..."
                            value={readingStyle}
                            onChange={(e) => setReadingStyle(e.target.value)}
                            disabled={isGenerating}
                        ></textarea>
                    </div>
                    <div className="mt-6 pt-6 border-t border-slate-700 flex flex-col sm:flex-row justify-end items-center gap-4">
                        <p className="text-sm text-slate-400 flex-grow mr-auto">
                            {chunks.length > 0 
                                ? `Đã chia thành ${chunks.length} đoạn. Sẵn sàng để tạo âm thanh.`
                                : 'Sau khi nhập văn bản, nhấn "Xử lý" để chuẩn bị.'
                            }
                        </p>
                        <button
                            onClick={handleProcessText}
                            disabled={!text || isGenerating}
                            className="w-full sm:w-auto px-6 py-3 bg-slate-700 text-white font-semibold rounded-lg hover:bg-slate-600 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                        >
                            <i className="fa-solid fa-scissors"></i>
                            <span>Xử lý văn bản</span>
                        </button>
                        <button
                            onClick={onGenerate}
                            disabled={chunks.length === 0 || isGenerating}
                            className={`w-full sm:w-auto px-8 py-3 text-white font-bold rounded-xl shadow-lg transition-all duration-300 flex items-center justify-center gap-2.5 text-lg transform hover:-translate-y-0.5 ${isGenerating ? 'gen-button-loading cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/30 hover:shadow-indigo-500/40'} ${(chunks.length === 0 || isGenerating) ? 'bg-slate-600 hover:bg-slate-600 shadow-none cursor-not-allowed opacity-60' : ''}`}
                        >
                            {isGenerating ? <><i className="fa-solid fa-spinner fa-spin"></i><span>Đang tạo...</span></> : <><i className="fa-solid fa-microphone-lines"></i><span>Tạo Âm thanh</span></>}
                        </button>
                    </div>
                    {chunks.length > 0 && (
                        <div className="space-y-4 pt-6 border-t border-slate-700 animate-fade-in">
                            <div className="flex flex-wrap justify-between items-center gap-4">
                                <h3 className="text-lg font-bold text-white">Các đoạn văn bản (Chunks)</h3>
                                <div className="flex items-center flex-wrap gap-3">
                                    <button onClick={handlePlayAll} disabled={!hasSuccessfulChunks || isGenerating} className="px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 disabled:bg-slate-600 disabled:cursor-not-allowed">
                                        <i className={`fa-solid ${currentlyPlaying !== null ? 'fa-stop' : 'fa-play'}`}></i>
                                        <span>{currentlyPlaying !== null ? 'Dừng' : 'Phát tất cả'}</span>
                                    </button>
                                    <button onClick={handleDownloadAll} disabled={!hasSuccessfulChunks || isGenerating} className="px-4 py-2 bg-slate-700 text-white text-sm font-semibold rounded-lg hover:bg-slate-600 transition-colors flex items-center gap-2 disabled:bg-slate-600 disabled:cursor-not-allowed">
                                        <i className="fa-solid fa-download"></i>
                                        <span>Tải riêng lẻ</span>
                                    </button>
                                    <button onClick={onMergeAndDownload} disabled={!hasSuccessfulChunks || isGenerating} className="px-4 py-2 bg-green-600 text-white text-sm font-bold rounded-lg hover:bg-green-500 transition-colors flex items-center gap-2 disabled:bg-slate-600 disabled:cursor-not-allowed">
                                        <i className="fa-solid fa-file-zipper"></i>
                                        <span>Gộp & Tải 1 File (WAV)</span>
                                    </button>
                                </div>
                            </div>

                            {chunks.map((chunk, index) => {
                                const audioOutput = ttsChunkOutputs?.find(o => o.chunkIndex === index);
                                const isChunkGenerating = isGenerating && (!ttsChunkOutputs || ttsChunkOutputs.length <= index);
                                const isPlaying = currentlyPlaying === index;
                                
                                return (
                                    <div key={index} className={`bg-slate-900/50 p-4 rounded-lg border-2 transition-colors ${isPlaying ? 'border-indigo-500' : 'border-slate-700'}`}>
                                        <div className="flex justify-between items-center mb-2">
                                            <label htmlFor={`chunk-input-${index}`} className="font-semibold text-slate-300">Đoạn {index + 1}</label>
                                            <span className="text-xs text-slate-500">{chunk.length} / {TTS_CHUNK_CHARACTER_LIMIT} ký tự</span>
                                        </div>
                                        <textarea
                                            id={`chunk-input-${index}`}
                                            rows={5}
                                            value={chunk}
                                            onChange={(e) => handleChunkChange(index, e.target.value)}
                                            disabled={isGenerating}
                                            className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none transition disabled:opacity-60 disabled:cursor-not-allowed"
                                        />
                                        <div className="mt-3">
                                            {audioOutput?.url ? (
                                                <audio
                                                    ref={el => { if (el) audioRefs.current.set(index, el); else audioRefs.current.delete(index); }}
                                                    controls src={audioOutput.url} className="w-full h-10"
                                                    onPlay={() => setCurrentlyPlaying(index)}
                                                    onPause={() => setCurrentlyPlaying(p => p === index ? null : p)}
                                                    onEnded={() => setCurrentlyPlaying(p => p === index ? null : p)}
                                                />
                                            ) : audioOutput?.error ? (
                                                <div className="text-sm text-red-400 p-2 bg-red-500/10 rounded-md border border-red-500/20">
                                                    <i className="fa-solid fa-triangle-exclamation mr-2"></i>
                                                    <strong>Lỗi:</strong> {audioOutput.error}
                                                </div>
                                            ) : isGenerating && ttsChunkOutputs?.find(o => o.chunkIndex === index) === undefined ? (
                                                <div className="flex items-center gap-3 text-sm text-indigo-300"> <Spinner /> <span>Đang tạo âm thanh...</span> </div>
                                            ) : (
                                                <div className="text-sm text-slate-500 italic">Chưa có âm thanh.</div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            ) : (
                <div className="animate-fade-in space-y-6">
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="block text-sm font-medium text-slate-300">
                                <i className="fa-solid fa-users-gear mr-2 text-indigo-400"></i>
                                1. Cấu hình người nói (Tối thiểu 2, tối đa 10):
                            </label>
                            <button onClick={addSpeaker} disabled={isGenerating || ttsSpeakers.length >= 10} className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-semibold rounded-md hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2">
                                <i className="fa-solid fa-plus"></i> Thêm
                            </button>
                        </div>
                        <div className="space-y-4">
                            {ttsSpeakers.map((speaker, index) => (
                                <div key={index} className="flex-grow space-y-3 bg-slate-900/50 p-4 rounded-lg border border-slate-700">
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="text"
                                            value={speaker.name}
                                            onChange={(e) => handleSpeakerChange(index, 'name', e.target.value)}
                                            placeholder={`Tên người nói ${index + 1}`}
                                            className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition"
                                            disabled={isGenerating}
                                        />
                                        <button onClick={() => removeSpeaker(index)} disabled={isGenerating || ttsSpeakers.length <= 2} className="px-3 py-2 bg-red-600/20 text-red-300 rounded-md hover:bg-red-500/40 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                                            <i className="fa-solid fa-trash-can"></i>
                                        </button>
                                    </div>
                                    <select
                                        value={speaker.voice}
                                        onChange={(e) => handleSpeakerChange(index, 'voice', e.target.value)}
                                        className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition"
                                        disabled={isGenerating}
                                    >
                                        {voiceOptions.map(opt => <option key={opt.id} value={opt.id}>{opt.name} - {opt.description.split('.')[0]}</option>)}
                                    </select>
                                    <input
                                        type="text"
                                        value={speaker.style}
                                        onChange={(e) => handleSpeakerChange(index, 'style', e.target.value)}
                                        placeholder={`Phong cách đọc (ví dụ: vui vẻ, trầm buồn)`}
                                        className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition text-sm"
                                        disabled={isGenerating}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label htmlFor="tts-text-input-multi" className="block text-sm font-medium text-slate-300">
                                <i className="fa-solid fa-file-audio mr-2 text-indigo-400"></i>
                                2. Nhập kịch bản hội thoại:
                            </label>
                             <button
                                onClick={handleUploadClick}
                                disabled={isGenerating}
                                className="px-3 py-1.5 bg-slate-700 text-white text-xs font-semibold rounded-md hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                            >
                                <i className="fa-solid fa-upload"></i>
                                Tải File (.txt)
                            </button>
                            <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" accept=".txt" />
                        </div>
                        <textarea 
                            id="tts-text-input-multi"
                            rows={10}
                            placeholder={`Định dạng:\nTên: Lời thoại...\n\nVí dụ:\n${ttsSpeakers[0]?.name || 'Tên 1'}: Chào bạn, bạn khỏe không?\n${ttsSpeakers[1]?.name || 'Tên 2'}: Tôi khỏe, cảm ơn bạn.`}
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            disabled={isGenerating}
                            className="w-full bg-slate-900/50 border border-slate-600 rounded-lg px-4 py-2 text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition disabled:opacity-60 disabled:cursor-not-allowed"
                        />
                    </div>
                    <div className="mt-6 pt-6 border-t border-slate-700 flex flex-col sm:flex-row justify-end items-center gap-4">
                        <button
                            onClick={onGenerate}
                            disabled={!text || isGenerating || ttsSpeakers.length < 2}
                            className={`w-full sm:w-auto px-8 py-3 text-white font-bold rounded-xl shadow-lg transition-all duration-300 flex items-center justify-center gap-2.5 text-lg transform hover:-translate-y-0.5 ${isGenerating ? 'gen-button-loading cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/30 hover:shadow-indigo-500/40'} ${(!text || isGenerating || ttsSpeakers.length < 2) ? 'bg-slate-600 hover:bg-slate-600 shadow-none cursor-not-allowed opacity-60' : ''}`}
                        >
                            {isGenerating ? <><i className="fa-solid fa-spinner fa-spin"></i><span>Đang tạo...</span></> : <><i className="fa-solid fa-microphone-lines"></i><span>Tạo Âm thanh</span></>}
                        </button>
                    </div>
                    {ttsDialogueOutput && (
                        <div className="space-y-4 pt-6 border-t border-slate-700 animate-fade-in">
                            <h3 className="text-lg font-bold text-white">Kết quả Hội thoại</h3>
                            <div className="bg-slate-900/50 p-4 rounded-lg border-2 border-slate-700">
                                {ttsDialogueOutput.url ? (
                                    <audio controls src={ttsDialogueOutput.url} className="w-full h-10" />
                                ) : ttsDialogueOutput.error ? (
                                    <div className="text-sm text-red-400 p-2 bg-red-500/10 rounded-md border border-red-500/20">
                                        <i className="fa-solid fa-triangle-exclamation mr-2"></i>
                                        <strong>Lỗi:</strong> {ttsDialogueOutput.error}
                                    </div>
                                ) : null}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default TtsTab;