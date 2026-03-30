import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate } from 'react-router-dom';
import { apiService } from '../../services/apiService';
import { Venue } from '../../types';

const CCAApply: React.FC = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [venues, setVenues] = useState<Venue[]>([]);

    useEffect(() => {
        const fetchVenues = async () => {
            try {
                const data = await apiService.getVenues();
                setVenues(data);
            } catch (error) {
                console.error("Failed to load venues", error);
            }
        };
        fetchVenues();
    }, []);

    // Form State
    const [formData, setFormData] = useState({
        // 필수 및 기본 정보
        realName: '',
        nickname: '',
        age: '',
        phone: '',
        bodySize: '', // 신체 사이즈
        
        // 상세 및 매력 포인트
        languages: [] as string[],
        experience: '',
        introduction: '',
        
        // 사진
        photo: null as File | null,
        photoPreview: '',
        
        // 근무/취업 상태 옵션
        venueOption: 'registered' as 'registered' | 'unregistered' | 'unemployed',
        registeredVenueId: '',
        unregisteredVenueName: ''
    });

    const handleNext = (e: React.FormEvent) => {
        e.preventDefault();
        setStep(prev => prev + 1);
    };

    const handlePrev = () => {
        setStep(prev => prev - 1);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleLanguageToggle = (lang: string) => {
        setFormData(prev => ({
            ...prev,
            languages: prev.languages.includes(lang)
                ? prev.languages.filter(l => l !== lang)
                : [...prev.languages, lang]
        }));
    };

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({ ...prev, photo: file, photoPreview: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        
        try {
            let imageUrl = '';
            if (formData.photo) {
                const uploadedUrl = await apiService.uploadImage(formData.photo);
                if (uploadedUrl) imageUrl = uploadedUrl;
            }

            let finalVenueId = 'pool';
            let finalSpecialNotes = `[입사 지원서]\n신체사이즈/체형: ${formData.bodySize}\n자기소개: ${formData.introduction}`;

            if (formData.venueOption === 'registered' && formData.registeredVenueId) {
                finalVenueId = formData.registeredVenueId;
            } else if (formData.venueOption === 'unregistered') {
                finalSpecialNotes += `\n희망(근무 중인) 업소명(미등록): ${formData.unregisteredVenueName}`;
            }

            const ccaData = {
                name: formData.realName,
                nickname: formData.nickname || formData.realName,
                realNameFirst: formData.realName,
                phone: formData.phone,
                birthday: formData.age ? `${new Date().getFullYear() - parseInt(formData.age) + 1}-01-01` : '', // rough estimate
                languages: formData.languages,
                experienceHistory: [formData.experience],
                specialNotes: finalSpecialNotes,
                image: imageUrl,
                venueId: finalVenueId,
                status: 'applicant',
                grade: 'NEW',
                isNew: true,
                password: '1234' // default temporary password
            };

            const result = await apiService.createCCA(ccaData);
            if (result.success) {
                setIsSuccess(true);
            } else {
                alert(result.error || '지원서 접수에 실패했습니다. 잠시 후 다시 시도해주세요.');
            }
        } catch (error) {
            console.error('Submit error:', error);
            alert('오류가 발생했습니다. 잠시 후 다시 시도해 주세요.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isSuccess) {
        return (
            <div className="min-h-screen bg-[#faf9f6] dark:bg-[#0f0e0b] flex flex-col items-center justify-center p-4 animate-fade-in font-display">
                <div className="max-w-md w-full bg-white dark:bg-zinc-900 rounded-[3rem] p-10 text-center shadow-2xl border border-primary/10">
                    <div className="size-24 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-8 animate-bounce">
                        <span className="material-symbols-outlined text-5xl text-emerald-500">check_circle</span>
                    </div>
                    <h2 className="text-3xl font-extrabold mb-4">지원 완료!</h2>
                    <p className="text-zinc-500 font-medium leading-relaxed mb-8">
                        파트너 등록 신청이 성공적으로 접수되었습니다. <br />
                        담당 업소(또는 본사)에서 24시간 내에 연락드릴 예정입니다.
                    </p>
                    <Link to="/" className="block w-full py-4 bg-primary text-[#1b180d] rounded-2xl font-black uppercase text-sm tracking-widest shadow-xl hover:scale-105 transition-transform">
                        메인으로 돌아가기
                    </Link>
                </div>
            </div>
        );
    }

    // Step Validation for the 'Next' button
    const isStep1Valid = formData.realName.trim() !== '' && formData.age.trim() !== '' && formData.phone.trim() !== '' && formData.bodySize.trim() !== '';
    const isStep3Valid = formData.photoPreview !== '';
    const isStep4Valid = 
        (formData.venueOption === 'registered' && formData.registeredVenueId !== '') ||
        (formData.venueOption === 'unregistered' && formData.unregisteredVenueName.trim() !== '') ||
        formData.venueOption === 'unemployed';

    return (
        <div className="min-h-screen bg-[#faf9f6] dark:bg-zinc-950 font-display flex flex-col items-center justify-center p-4 sm:p-8">
            <Helmet>
                <title>CCA 파트너 지원 | JTV STAR</title>
            </Helmet>

            <div className="w-full max-w-2xl relative">
                {/* Back button */}
                <Link to="/cca-portal/welcome" className="absolute -top-16 left-0 flex items-center gap-2 text-zinc-500 hover:text-primary transition-colors font-bold text-sm">
                    <span className="material-symbols-outlined">arrow_back</span>
                    소개 페이지로
                </Link>

                <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] shadow-2xl border border-primary/5 p-8 md:p-12 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-primary/5 rounded-full blur-[80px] pointer-events-none transition-all"></div>

                    {/* Progress Indicator */}
                    <div className="mb-12 relative z-10">
                        <div className="flex justify-between mb-4">
                            <span className="text-[10px] font-black uppercase tracking-widest text-primary">Step {step} of 4</span>
                            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                                {step === 1 ? '필수 기본 정보' : step === 2 ? '상세 이력' : step === 3 ? '프로필 사진' : '취업 및 소속 상태'}
                            </span>
                        </div>
                        <div className="flex gap-2">
                            {[1, 2, 3, 4].map(idx => (
                                <div key={idx} className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${step >= idx ? 'bg-primary shadow-[0_0_10px_rgba(255,215,0,0.5)]' : 'bg-zinc-200 dark:bg-zinc-800'}`}></div>
                            ))}
                        </div>
                    </div>

                    <form onSubmit={step === 4 ? handleSubmit : handleNext} className="relative z-10 min-h-[300px] flex flex-col">
                        
                        {/* STEP 1: Basic Info */}
                        {step === 1 && (
                            <div className="space-y-6 animate-fade-in flex-1">
                                <h2 className="text-3xl font-extrabold mb-8 tracking-tight">기본 정보 입력 <span className="text-primary text-4xl leading-none">.</span></h2>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-4">본명 (실명) <span className="text-red-500">*</span></label>
                                        <input 
                                            type="text" 
                                            name="realName" 
                                            required 
                                            value={formData.realName} 
                                            onChange={handleChange}
                                            placeholder="홍길동" 
                                            className="w-full bg-zinc-50 dark:bg-zinc-800 border-zinc-100 dark:border-transparent rounded-2xl py-4 px-6 text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-4">활동 닉네임</label>
                                        <input 
                                            type="text" 
                                            name="nickname" 
                                            value={formData.nickname} 
                                            onChange={handleChange}
                                            placeholder="사이트에 노출될 이름" 
                                            className="w-full bg-zinc-50 dark:bg-zinc-800 border-zinc-100 dark:border-transparent rounded-2xl py-4 px-6 text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-4">연락처 (핸드폰) <span className="text-red-500">*</span></label>
                                    <input 
                                        type="tel" 
                                        name="phone" 
                                        required 
                                        value={formData.phone} 
                                        onChange={handleChange}
                                        placeholder="010-1234-5678" 
                                        className="w-full bg-zinc-50 dark:bg-zinc-800 border-zinc-100 dark:border-transparent rounded-2xl py-4 px-6 text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-4">나이 (Age) <span className="text-red-500">*</span></label>
                                        <input 
                                            type="number" 
                                            name="age" 
                                            min="18" 
                                            max="50"
                                            required 
                                            value={formData.age} 
                                            onChange={handleChange}
                                            placeholder="만 나이 입력" 
                                            className="w-full bg-zinc-50 dark:bg-zinc-800 border-zinc-100 dark:border-transparent rounded-2xl py-4 px-6 text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-4">신체 사이즈 <span className="text-red-500">*</span></label>
                                        <input 
                                            type="text" 
                                            name="bodySize" 
                                            required 
                                            value={formData.bodySize} 
                                            onChange={handleChange}
                                            placeholder="예: 165cm / 44사이즈" 
                                            className="w-full bg-zinc-50 dark:bg-zinc-800 border-zinc-100 dark:border-transparent rounded-2xl py-4 px-6 text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* STEP 2: Details */}
                        {step === 2 && (
                            <div className="space-y-6 animate-fade-in flex-1">
                                <h2 className="text-3xl font-extrabold mb-8 tracking-tight">상세 프로필 <span className="text-primary text-4xl leading-none">.</span></h2>
                                
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-4">구사 가능한 언어 (다중 선택)</label>
                                    <div className="flex flex-wrap gap-3">
                                        {['한국어', '영어', '일본어', '따갈로그'].map(lang => (
                                            <button
                                                type="button"
                                                key={lang}
                                                onClick={() => handleLanguageToggle(lang)}
                                                className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all border ${formData.languages.includes(lang) ? 'bg-primary/10 border-primary text-primary shadow-sm' : 'bg-zinc-50 dark:bg-zinc-800 border-transparent text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-700'}`}
                                            >
                                                {lang}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-2 mt-4">
                                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-4">근무 경력 확인</label>
                                    <select 
                                        name="experience"
                                        value={formData.experience}
                                        onChange={handleChange}
                                        required
                                        className="w-full bg-zinc-50 dark:bg-zinc-800 border-zinc-100 dark:border-transparent rounded-2xl py-4 px-6 text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                                    >
                                        <option value="">선택해주세요</option>
                                        <option value="초보 (신입)">처음입니다 (신입)</option>
                                        <option value="1년 미만">1년 미만</option>
                                        <option value="1~3년">1~3년</option>
                                        <option value="3년 이상 (에이스)">3년 이상 (경력직)</option>
                                    </select>
                                </div>
                                <div className="space-y-2 mt-4">
                                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-4">나의 매력 포인트 (자기소개)</label>
                                    <textarea 
                                        name="introduction" 
                                        required 
                                        value={formData.introduction} 
                                        onChange={handleChange}
                                        placeholder="고객들에게 어필할 나만의 매력과 장점을 적어주세요!" 
                                        className="w-full bg-zinc-50 dark:bg-zinc-800 border-zinc-100 dark:border-transparent rounded-2xl py-4 px-6 text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all outline-none resize-none h-24"
                                    ></textarea>
                                </div>
                            </div>
                        )}

                        {/* STEP 3: Photo Upload */}
                        {step === 3 && (
                            <div className="space-y-6 animate-fade-in flex-1">
                                <h2 className="text-3xl font-extrabold mb-8 tracking-tight">얼굴 프로필 사진 <span className="text-red-500">*</span><span className="text-primary text-4xl leading-none">.</span></h2>
                                
                                <label className="block border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-[2rem] p-1 overflow-hidden flex flex-col items-center justify-center text-center hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer group h-64 relative">
                                    <input type="file" className="hidden" accept="image/*" onChange={handlePhotoChange} />
                                    
                                    {formData.photoPreview ? (
                                        <img src={formData.photoPreview} alt="Preview" className="w-full h-full object-cover rounded-[1.8rem]" />
                                    ) : (
                                        <div className="p-8">
                                            <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mx-auto mb-4 group-hover:scale-110 transition-transform">
                                                <span className="material-symbols-outlined text-3xl">add_a_photo</span>
                                            </div>
                                            <p className="font-bold text-lg mb-2">본인을 잘 나타내는 사진 선택</p>
                                            <p className="text-xs text-zinc-400 font-medium">최대 5MB, JPG/PNG 지원</p>
                                        </div>
                                    )}
                                    {formData.photoPreview && (
                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-[1.8rem]">
                                            <span className="text-white font-bold bg-black/40 px-4 py-2 rounded-xl backdrop-blur-sm">사진 변경하기</span>
                                        </div>
                                    )}
                                </label>
                                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest text-center mt-4">제출하신 사진은 사이트 내 본인 프로필의 메인 화면에 반영됩니다.</p>
                            </div>
                        )}

                        {/* STEP 4: Employment & Venue Status */}
                        {step === 4 && (
                            <div className="space-y-6 animate-fade-in flex-1">
                                <h2 className="text-3xl font-extrabold mb-8 tracking-tight">취업 및 소속 상태 <span className="text-red-500">*</span><span className="text-primary text-4xl leading-none">.</span></h2>
                                
                                <div className="space-y-4">
                                    {/* Option 1: Registered Venue */}
                                    <label className={`block cursor-pointer border-2 rounded-2xl p-5 transition-all ${formData.venueOption === 'registered' ? 'border-primary bg-primary/5 shadow-xl shadow-primary/10' : 'border-zinc-200 dark:border-zinc-800 hover:border-primary/30'}`}>
                                        <div className="flex items-start gap-4">
                                            <input 
                                                type="radio" 
                                                name="venueOption" 
                                                value="registered" 
                                                checked={formData.venueOption === 'registered'}
                                                onChange={handleChange}
                                                className="w-5 h-5 accent-primary mt-1 flex-shrink-0" 
                                            />
                                            <div className="flex-1 w-full">
                                                <p className="font-black text-lg text-zinc-900 dark:text-white">JTV STAR 등록 업체 근무 중</p>
                                                <p className="text-xs text-zinc-500 font-medium mt-1 mb-3">현재 사이트에 등록되어 관리 중인 업소에서 일하고 있다면 선택해주세요.</p>
                                                
                                                {formData.venueOption === 'registered' && (
                                                    <select 
                                                        name="registeredVenueId"
                                                        value={formData.registeredVenueId}
                                                        onChange={handleChange}
                                                        className="w-full bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 rounded-xl py-3 px-4 text-sm font-bold outline-none border focus:border-primary/50 transition-colors"
                                                    >
                                                        <option value="">소속 업체를 선택하세요</option>
                                                        {venues.map(v => (
                                                            <option key={v.id} value={v.id}>{v.name}</option>
                                                        ))}
                                                    </select>
                                                )}
                                            </div>
                                        </div>
                                    </label>

                                    {/* Option 2: Unregistered Venue */}
                                    <label className={`block cursor-pointer border-2 rounded-2xl p-5 transition-all ${formData.venueOption === 'unregistered' ? 'border-primary bg-primary/5 shadow-xl shadow-primary/10' : 'border-zinc-200 dark:border-zinc-800 hover:border-primary/30'}`}>
                                        <div className="flex items-start gap-4">
                                            <input 
                                                type="radio" 
                                                name="venueOption" 
                                                value="unregistered" 
                                                checked={formData.venueOption === 'unregistered'}
                                                onChange={handleChange}
                                                className="w-5 h-5 accent-primary mt-1 flex-shrink-0" 
                                            />
                                            <div className="flex-1 w-full">
                                                <p className="font-black text-lg text-zinc-900 dark:text-white">미등록 업체 근무 중</p>
                                                <p className="text-xs text-zinc-500 font-medium mt-1 mb-3">근무 중인 업소가 목록에 없을 경우 직접 입력해 주시면 관리자가 확인 후 등록해 드립니다.</p>
                                                
                                                {formData.venueOption === 'unregistered' && (
                                                    <input 
                                                        type="text"
                                                        name="unregisteredVenueName"
                                                        value={formData.unregisteredVenueName}
                                                        onChange={handleChange}
                                                        placeholder="예: 클럽 시크릿 (마카티)"
                                                        className="w-full bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 rounded-xl py-3 px-4 text-sm font-bold outline-none border focus:border-primary/50 transition-colors"
                                                    />
                                                )}
                                            </div>
                                        </div>
                                    </label>

                                    {/* Option 3: Unemployed / Pool */}
                                    <label className={`block cursor-pointer border-2 rounded-2xl p-5 transition-all ${formData.venueOption === 'unemployed' ? 'border-primary bg-primary/5 shadow-xl shadow-primary/10' : 'border-zinc-200 dark:border-zinc-800 hover:border-primary/30'}`}>
                                        <div className="flex items-start gap-4">
                                            <input 
                                                type="radio" 
                                                name="venueOption" 
                                                value="unemployed" 
                                                checked={formData.venueOption === 'unemployed'}
                                                onChange={handleChange}
                                                className="w-5 h-5 accent-primary mt-1 flex-shrink-0" 
                                            />
                                            <div className="flex-1 w-full">
                                                <p className="font-black text-lg text-zinc-900 dark:text-white">미취업 (구직 중 / 인재풀 등록)</p>
                                                <p className="text-xs text-zinc-500 font-medium mt-1">이력서를 공개하여 JTV STAR 제휴 업소 관리자들의 스카웃(면접 제안)을 기다립니다.</p>
                                            </div>
                                        </div>
                                    </label>
                                </div>
                            </div>
                        )}

                        {/* Navigation Buttons */}
                        <div className="flex gap-4 mt-12 pt-6 border-t border-zinc-100 dark:border-zinc-800/50">
                            {step > 1 && (
                                <button type="button" onClick={handlePrev} className="px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                                    이전으로
                                </button>
                            )}
                            
                            <button 
                                type="submit" 
                                disabled={
                                    isSubmitting || 
                                    (step === 1 && !isStep1Valid) ||
                                    (step === 3 && !isStep3Valid) ||
                                    (step === 4 && !isStep4Valid)
                                }
                                className="ml-auto px-10 py-4 bg-primary text-[#1b180d] rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 min-w-[140px] disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? (
                                    <span className="material-symbols-outlined animate-spin">cyclone</span>
                                ) : step === 4 ? (
                                    '지원서 제출하기'
                                ) : (
                                    <>다음 단계 <span className="material-symbols-outlined text-sm">arrow_forward</span></>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default CCAApply;
