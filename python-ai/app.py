from fastapi import FastAPI
from pydantic import BaseModel
from transformers import pipeline
from underthesea import word_tokenize
import re

app = FastAPI(title="Movie Review Analysis Service")

sentiment_pipe = pipeline(
    "text-classification",
    model="wonrax/phobert-base-vietnamese-sentiment",
    tokenizer="wonrax/phobert-base-vietnamese-sentiment"
)

class ReviewAnalysisRequest(BaseModel):
    text: str
    language: str = "vi"

def normalize_sentiment(label: str, score: float) -> tuple[float, str]:
    label_upper = label.upper()

    if "POS" in label_upper or "POSITIVE" in label_upper:
        return score, "POSITIVE"

    if "NEG" in label_upper or "NEGATIVE" in label_upper:
        return -score, "NEGATIVE"

    return 0.0, "NEUTRAL"

ASPECT_KEYWORDS = {
    "STORY": [
        "cốt truyện", "kịch bản", "nội dung", "plot", "twist",
        "logic", "cao trào", "cái kết", "ending", "bất ngờ"
    ],
    "ACTING": [
        "diễn xuất", "diễn viên", "nhân vật", "vai diễn",
        "chemistry", "nam chính", "nữ chính"
    ],
    "VISUAL": [
        "hình ảnh", "màu phim", "kỹ xảo", "cgi", "quay phim",
        "góc máy", "visual", "đồ họa"
    ],
    "MUSIC": [
        "nhạc", "nhạc nền", "ost", "soundtrack", "âm thanh",
        "bài hát", "music"
    ],
    "PACING": [
        "nhịp phim", "dài dòng", "chậm", "lê thê", "cuốn",
        "nhanh", "kéo dài", "tempo"
    ],
    "EMOTION": [
        "cảm động", "xúc động", "sợ", "ám ảnh", "hài",
        "buồn", "vui", "căng thẳng", "rùng rợn"
    ],
    "ENTERTAINMENT": [
        "giải trí", "đáng xem", "cuốn", "hay", "đỉnh",
        "xuất sắc", "tệ", "chán", "dở", "phí thời gian"
    ]
}

NEGATIVE_WORDS = [
    "tệ", "chán", "dở", "lê thê", "phí thời gian",
    "thất vọng", "nhạt", "khó hiểu", "kém"
]

POSITIVE_WORDS = [
    "hay", "đỉnh", "xuất sắc", "cuốn", "tốt",
    "ấn tượng", "đáng xem", "tuyệt", "thích"
]

def extract_aspects(text: str) -> dict:
    lower_text = text.lower()
    aspects = {}

    global_sign = 0
    for w in POSITIVE_WORDS:
        if w in lower_text:
            global_sign += 1

    for w in NEGATIVE_WORDS:
        if w in lower_text:
            global_sign -= 1

    if global_sign > 0:
        base_value = 0.7
    elif global_sign < 0:
        base_value = -0.7
    else:
        base_value = 0.4

    for aspect, keywords in ASPECT_KEYWORDS.items():
        count = sum(1 for kw in keywords if kw in lower_text)

        if count == 0:
            aspects[aspect] = 0.0
        else:
            aspects[aspect] = max(-1.0, min(1.0, base_value + 0.1 * min(count, 3)))

    return aspects

def extract_keywords(text: str) -> list[str]:
    lower_text = text.lower()
    found = []

    for keywords in ASPECT_KEYWORDS.values():
        for kw in keywords:
            if kw in lower_text:
                found.append(kw)

    if found:
        return sorted(list(set(found)))[:20]

    tokens = word_tokenize(text, format="text")
    cleaned = re.sub(r"[^\w\s]", " ", tokens.lower())
    words = [w for w in cleaned.split() if len(w) >= 3]

    return sorted(list(set(words)))[:20]

@app.post("/review-analysis")
def analyze_review(request: ReviewAnalysisRequest):
    text = request.text.strip()

    if not text:
        return {
            "sentimentScore": 0.0,
            "sentimentLabel": "NEUTRAL",
            "keywords": [],
            "aspects": {}
        }

    result = sentiment_pipe(text[:512])[0]

    sentiment_score, sentiment_label = normalize_sentiment(
        result["label"],
        float(result["score"])
    )

    aspects = extract_aspects(text)
    keywords = extract_keywords(text)

    return {
        "sentimentScore": sentiment_score,
        "sentimentLabel": sentiment_label,
        "keywords": keywords,
        "aspects": aspects
    }