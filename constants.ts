// FIX: Import both Branch and TechOptions types to correctly type the constants.
import { Branch, TechOptions, TtsVoice } from './types';

export const TTS_CHUNK_CHARACTER_LIMIT = 2500;

export const branchTranslations: Record<Branch, string> = {
    modern_human: 'Con người Hiện đại',
    prehistoric_human: 'Con người Tiền sử',
    modern_creature: 'Sinh vật Hiện đại',
    prehistoric_creature: 'Sinh vật Tiền sử',
    landscape_scene: 'Cảnh quan / Bối cảnh'
};

// FIX: Use the imported TechOptions type directly instead of a dynamic import.
export const techOptionLabels: Record<keyof TechOptions, string> = {
    style: 'Phong cách',
    layout: 'Bố cục',
    angle: 'Góc máy',
    quality: 'Chất lượng'
};

export const promptConfig = {
    common: {
        art_style: "e.g., photorealistic, cinematic, anime, watercolor, impressionistic",
        lighting: "e.g., soft morning light, dramatic chiaroscuro, neon glow, golden hour",
        color_palette: "e.g., vibrant and saturated, monochrome, pastel, earthy tones",
        camera_shot: "e.g., wide-angle, macro, aerial view, dutch angle, portrait",
        composition: "e.g., rule of thirds, leading lines, symmetrical, minimalist",
        detail_level: "e.g., hyper-detailed, intricate, simple, abstract",
        negative_prompt_suggestions: "e.g., ugly, deformed, blurry, bad anatomy, extra limbs"
    },
    modern_human: {
        character_concept: "e.g., cyberpunk hacker, elegant queen, gritty detective, futuristic soldier",
        clothing_style: "e.g., high-fashion couture, tactical gear, vintage streetwear, formal suit",
        facial_expression: "e.g., determined, serene, melancholic, joyful",
        setting: "e.g., neon-lit city street, opulent throne room, abandoned warehouse, high-tech lab"
    },
    prehistoric_human: {
        character_concept: "e.g., wise shaman, fierce hunter, tribal chieftain, young gatherer",
        clothing_materials: "e.g., animal hides, woven fibers, bone ornaments, leather straps",
        tools_weapons: "e.g., stone-tipped spear, obsidian knife, bow and arrow, ceremonial staff",
        environment: "e.g., lush jungle, icy tundra, savanna plains, cave dwelling with fire"
    },
    modern_creature: {
        creature_concept: "e.g., bio-mechanical dragon, ethereal forest spirit, robotic wolf, colossal city leviathan",
        key_features: "e.g., glowing eyes, metallic feathers, crystalline scales, integrated weaponry",
        abilities: "e.g., breathes plasma, camouflages with light, controls technology, telekinetic powers",
        habitat: "e.g., post-apocalyptic city ruins, enchanted digital forest, deep-sea trench, orbital station"
    },
    prehistoric_creature: {
        creature_concept: "e.g., tyrannosaurus rex with feathers, saber-toothed tiger, woolly mammoth, velociraptor pack",
        physical_attributes: "e.g., massive size, sharp claws, powerful jaws, thick fur, vibrant plumage",
        behavior: "e.g., hunting, grazing, migrating, defending territory",
        environment: "e.g., primordial swamp, volcanic landscape, dense fern forest, vast grasslands"
    },
    landscape_scene: {
        scene_concept: "e.g., floating sky islands, futuristic underwater city, enchanted alien forest, volcanic wasteland",
        key_elements: "e.g., strange flora and fauna, towering crystal structures, ancient ruins, cascading waterfalls",
        time_of_day: "e.g., twin-sun sunset, bioluminescent night, perpetual twilight, stormy afternoon",
        mood_atmosphere: "e.g., mysterious and awe-inspiring, peaceful and serene, dangerous and foreboding, vibrant and full of life"
    }
};

export const techOptionsData = {
    style: ["Mặc định", "Cinematic", "Photorealistic", "Anime", "Fantasy Art", "Cyberpunk", "Vintage"],
    layout: ["Mặc định", "Portrait", "Landscape", "Close-up", "Wide Shot"],
    angle: ["Mặc định", "Eye-level", "High-angle", "Low-angle", "Dutch Angle"],
    quality: ["Mặc định", "Hyper-detailed", "8K", "Sharp focus", "Intricate details"]
};

export const techOptionsTranslations: { [key: string]: string } = {
    "Cinematic": "Điện ảnh",
    "Photorealistic": "Chân thực",
    "Anime": "Anime / Hoạt hình",
    "Fantasy Art": "Nghệ thuật Giả tưởng",
    "Cyberpunk": "Viễn tưởng Cyberpunk",
    "Vintage": "Cổ điển",
    "Portrait": "Chân dung",
    "Landscape": "Phong cảnh",
    "Close-up": "Cận cảnh",
    "Wide Shot": "Toàn cảnh",
    "Eye-level": "Ngang tầm mắt",
    "High-angle": "Góc cao",
    "Low-angle": "Góc thấp",
    "Dutch Angle": "Góc nghiêng",
    "Hyper-detailed": "Siêu chi tiết",
    "Sharp focus": "Lấy nét sắc sảo",
    "Intricate details": "Chi tiết phức tạp"
};

export const storyboardLanguages = [
    { code: 'vi', name: 'Tiếng Việt' },
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Español (Spanish)' },
    { code: 'fr', name: 'Français (French)' },
    { code: 'de', name: 'Deutsch (German)' },
    { code: 'it', name: 'Italiano (Italian)' },
    { code: 'pt', name: 'Português (Portuguese)' },
    { code: 'ru', name: 'Русский (Russian)' },
    { code: 'ja', name: '日本語 (Japanese)' },
    { code: 'ko', name: '한국어 (Korean)' },
    { code: 'zh-CN', name: '中文 (Simplified Chinese)' },
    { code: 'zh-TW', name: '中文 (Traditional Chinese)' },
    { code: 'ar', name: 'العربية (Arabic)' },
    { code: 'hi', name: 'हिन्दी (Hindi)' },
    { code: 'id', name: 'Bahasa Indonesia' },
    { code: 'th', name: 'ไทย (Thai)' },
    { code: 'nl', name: 'Nederlands (Dutch)' },
    { code: 'sv', name: 'Svenska (Swedish)' },
    { code: 'da', name: 'Dansk (Danish)' },
    { code: 'fi', name: 'Suomi (Finnish)' },
    { code: 'no', name: 'Norsk (Norwegian)' },
    { code: 'pl', name: 'Polski (Polish)' },
    { code: 'tr', name: 'Türkçe (Turkish)' },
    { code: 'uk', name: 'Українська (Ukrainian)' },
    { code: 'el', name: 'Ελληνικά (Greek)' },
    { code: 'cs', name: 'Čeština (Czech)' },
    { code: 'hu', name: 'Magyar (Hungarian)' },
    { code: 'ro', name: 'Română (Romanian)' },
    { code: 'ms', name: 'Bahasa Melayu (Malay)' },
    { code: 'he', name: 'עברית (Hebrew)' },
];

export const voiceOptions: { id: TtsVoice; name: string; description: string, sampleText: string }[] = [
    { id: 'Achernar', name: 'Achernar', description: 'Giọng nam trẻ, rõ ràng, năng động. Thích hợp cho quảng cáo, thông báo.', sampleText: 'Xin chào, đây là bản xem trước giọng nói của Pidtap Studio.' },
    { id: 'Achird', name: 'Achird', description: 'Giọng nam trẻ, thân thiện, tươi sáng. Phù hợp cho hướng dẫn, podcast.', sampleText: 'Xin chào, đây là bản xem trước giọng nói của Pidtap Studio.' },
    { id: 'Algenib', name: 'Algenib', description: 'Giọng nam trung niên, uy tín, đĩnh đạc. Lý tưởng cho phim tài liệu.', sampleText: 'Xin chào, đây là bản xem trước giọng nói của Pidtap Studio.' },
    { id: 'Algieba', name: 'Algieba', description: 'Giọng nữ trung niên, sang trọng, nhẹ nhàng. Phù hợp cho sách nói.', sampleText: 'Xin chào, đây là bản xem trước giọng nói của Pidtap Studio.' },
    { id: 'Alnilam', name: 'Alnilam', description: 'Giọng nam trầm, mạnh mẽ, có sức nặng. Thích hợp cho trailer phim.', sampleText: 'Xin chào, đây là bản xem trước giọng nói của Pidtap Studio.' },
    { id: 'Aoede', name: 'Aoede', description: 'Giọng nữ cao, trong trẻo, như ca hát. Phù hợp cho truyện cổ tích.', sampleText: 'Xin chào, đây là bản xem trước giọng nói của Pidtap Studio.' },
    { id: 'Autonoe', name: 'Autonoe', description: 'Giọng nữ trầm, quyến rũ, bí ẩn. Thích hợp cho kể chuyện kinh dị.', sampleText: 'Xin chào, đây là bản xem trước giọng nói của Pidtap Studio.' },
    { id: 'Callirrhoe', name: 'Callirrhoe', description: 'Giọng nữ thanh lịch, chuyên nghiệp. Lý tưởng cho tổng đài doanh nghiệp.', sampleText: 'Xin chào, đây là bản xem trước giọng nói của Pidtap Studio.' },
    { id: 'Charon', name: 'Charon', description: 'Giọng nam lớn tuổi, uyên bác, trầm ngâm. Phù hợp cho vai người kể chuyện.', sampleText: 'Xin chào, đây là bản xem trước giọng nói của Pidtap Studio.' },
    { id: 'Despina', name: 'Despina', description: 'Giọng nữ trẻ, tinh nghịch, hoạt bát. Thích hợp cho nội dung giải trí.', sampleText: 'Xin chào, đây là bản xem trước giọng nói của Pidtap Studio.' },
    { id: 'Enceladus', name: 'Enceladus', description: 'Giọng nam robot, điện tử. Lý tưởng cho khoa học viễn tưởng, trợ lý ảo.', sampleText: 'Xin chào, đây là bản xem trước giọng nói của Pidtap Studio.' },
    { id: 'Erinome', name: 'Erinome', description: 'Giọng nữ ma mị, thì thầm. Phù hợp cho không khí huyền bí, ma quái.', sampleText: 'Xin chào, đây là bản xem trước giọng nói của Pidtap Studio.' },
    { id: 'Fenrir', name: 'Fenrir', description: 'Giọng nam gầm gừ, dữ tợn. Thích hợp cho nhân vật quái vật, game.', sampleText: 'Xin chào, đây là bản xem trước giọng nói của Pidtap Studio.' },
    { id: 'Gacrux', name: 'Gacrux', description: 'Giọng nam trung niên, điềm tĩnh, đáng tin cậy. Phù hợp cho tin tức.', sampleText: 'Xin chào, đây là bản xem trước giọng nói của Pidtap Studio.' },
    { id: 'Iapetus', name: 'Iapetus', description: 'Giọng nam khổng lồ, vang vọng, sử thi. Lý tưởng cho tường thuật game.', sampleText: 'Xin chào, đây là bản xem trước giọng nói của Pidtap Studio.' },
    { id: 'Kore', name: 'Kore', description: 'Giọng nữ trẻ, ngọt ngào, dịu dàng. Phù hợp cho nội dung lãng mạn.', sampleText: 'Xin chào, đây là bản xem trước giọng nói của Pidtap Studio.' },
    { id: 'Laomedeia', name: 'Laomedeia', description: 'Giọng nữ hoàng gia, quyền quý. Thích hợp cho nhân vật vương giả.', sampleText: 'Xin chào, đây là bản xem trước giọng nói của Pidtap Studio.' },
    { id: 'Leda', name: 'Leda', description: 'Giọng nữ trưởng thành, ấm áp, như người mẹ. Phù hợp cho kể chuyện cho bé.', sampleText: 'Xin chào, đây là bản xem trước giọng nói của Pidtap Studio.' },
    { id: 'Orus', name: 'Orus', description: 'Giọng nam anh hùng, dõng dạc, quả quyết. Thích hợp cho game hành động.', sampleText: 'Xin chào, đây là bản xem trước giọng nói của Pidtap Studio.' },
    { id: 'Puck', name: 'Puck', description: 'Giọng nữ tinh nghịch, lanh lợi, cao. Phù hợp cho nhân vật hoạt hình, yêu tinh.', sampleText: 'Xin chào, đây là bản xem trước giọng nói của Pidtap Studio.' },
    { id: 'Pulcherrima', name: 'Pulcherrima', description: 'Giọng nữ duyên dáng, tinh tế. Lý tưởng cho hướng dẫn nghệ thuật.', sampleText: 'Xin chào, đây là bản xem trước giọng nói của Pidtap Studio.' },
    { id: 'Rasalgethi', name: 'Rasalgethi', description: 'Giọng nam già, khàn, mệt mỏi. Phù hợp cho nhân vật lão làng.', sampleText: 'Xin chào, đây là bản xem trước giọng nói của Pidtap Studio.' },
    { id: 'Sadachbia', name: 'Sadachbia', description: 'Giọng nữ buồn bã, u sầu. Thích hợp cho đọc thơ, tự sự bi kịch.', sampleText: 'Xin chào, đây là bản xem trước giọng nói của Pidtap Studio.' },
    { id: 'Sadaltager', name: 'Sadaltager', description: 'Giọng nữ căng thẳng, gấp gáp. Phù hợp cho cảnh hành động, tường thuật thể thao.', sampleText: 'Xin chào, đây là bản xem trước giọng nói của Pidtap Studio.' },
    { id: 'Schedar', name: 'Schedar', description: 'Giọng nữ lãnh đạo, mạnh mẽ, quyết đoán. Thích hợp cho nữ tướng.', sampleText: 'Xin chào, đây là bản xem trước giọng nói của Pidtap Studio.' },
    { id: 'Sulafat', name: 'Sulafat', description: 'Giọng nam hiền triết, chậm rãi, sâu sắc. Phù hợp cho bài giảng triết học.', sampleText: 'Xin chào, đây là bản xem trước giọng nói của Pidtap Studio.' },
    { id: 'Umbriel', name: 'Umbriel', description: 'Giọng nam u ám, ma quái. Thích hợp cho nhân vật phản diện, truyện kinh dị.', sampleText: 'Xin chào, đây là bản xem trước giọng nói của Pidtap Studio.' },
    { id: 'Vindemiatrix', name: 'Vindemiatrix', description: 'Giọng nữ phù thủy, sắc sảo. Phù hợp cho nhân vật phản diện.', sampleText: 'Xin chào, đây là bản xem trước giọng nói của Pidtap Studio.' },
    { id: 'Zephyr', name: 'Zephyr', description: 'Giọng nam nhẹ nhàng, lãng tử. Phù hợp cho đọc thơ, quảng cáo lãng mạn.', sampleText: 'Xin chào, đây là bản xem trước giọng nói của Pidtap Studio.' },
    { id: 'Zubenelgenubi', name: 'Zubenelgenubi', description: 'Giọng ngoài hành tinh, kỳ lạ. Thích hợp cho khoa học viễn tưởng.', sampleText: 'Xin chào, đây là bản xem trước giọng nói của Pidtap Studio.' },
];