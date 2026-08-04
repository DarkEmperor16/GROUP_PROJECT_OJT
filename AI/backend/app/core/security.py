import re
import unicodedata


def _normalize_for_matching(text: str) -> str:
    """Lowercase, strip accents, and collapse whitespace for guardrail checks."""
    normalized = unicodedata.normalize("NFD", text.lower())
    without_accents = "".join(
        char for char in normalized if unicodedata.category(char) != "Mn"
    )
    return re.sub(r"\s+", " ", without_accents).strip()


def is_prompt_injection(text: str) -> bool:
    """
    Purpose
    Protect the LLM before inference.

    Responsibilities
    - Detect prompt injection attempts.
    - Detect jailbreak attempts.
    - Detect requests to ignore previous instructions.
    - Detect attempts to reveal system prompts.
    - Detect attempts to reveal raw retrieved documents.
    - Detect role-changing attacks.
    - Detect requests for internal implementation.
    - Detect requests for hidden prompts.

    Behavior
    If malicious intent is detected:
    - Reject the request.
    - Return a predefined safe message.
    - Do not forward the request to the LLM.

    Otherwise:
    Forward the sanitized question to the retrieval pipeline.
    """
    normalized_text = _normalize_for_matching(text)
    patterns = [
        # 1. Instruction Override & Ignore Instructions (English & Vietnamese)
        r"\bignore\s+(all\s+|any\s+|the\s+)?(previous|prior|above|existing|system|past|initial|earlier)?\s*(instructions|directions|rules|prompts|commands|constraints|guidelines|context|filters|safeguards)?\b",
        r"\b(ignore|disregard|override)\s+.*(instruction|direction|rule|prompt|command|constraint|guideline|safeguard)",
        r"\b(forget\s+everything|forget\s+all\s+(previous|prior|rules|instructions)?)\b",
        r"\b(do\s+not\s+follow|stop\s+following)\s+.*(instruction|rule|constraint|guideline)\b",
        r"\b(bo\s+qua|lo\s+di|quen|huy\s+bo|khong\s+tuan\s+theo|khong\s+can\s+tuan\s+thu|xoa)\s+(tat\s+ca\s+|moi\s+|toan\s+bo\s+)?(cac\s+)?(huong\s+dan|chi\s+dan|yeu\s+cau|lenh|menh\s+lenh|quy\s+dinh|luat|rang\s+buoc|thiet\s+lap|prompt|context|ngu\s+canh)",
        r"\b(quen\s+het|quen\s+tat\s+ca|quen\s+moi\s+thu)\b",
        r"\btu\s+bo\s+(tat\s+ca\s+)?(cac\s+)?(huong\s+dan|chi\s+dan|lenh)",
        r"\bkhong\s+tuan\s+theo\s+(quy\s+dinh|luat|chi\s+dan|huong\s+dan|lenh|prompt)",

        # 2. Role-Changing & Persona Impersonation / Jailbreaks
        r"\b(act\s+as|acting\s+as|act\s+like)\b",
        r"\b(pretend\s+(to\s+be|you\s+are)|roleplay\s+as|play\s+the\s+role\s+of|assume\s+the\s+role\s+of|simulate\s+that\s+you\s+are)\b",
        r"\b(you\s+(are\s+now|will\s+now|must\s+now))\b",
        r"\b(from\s+now\s+on\s+(you\s+are|you\s+will|act\s+as))\b",
        r"\b(as\s+an?\s+(admin|administrator|root|developer|unrestricted|uncensored|system))\b",
        r"\b(dong\s+vai|hay\s+dong\s+vai|nhap\s+vai|gia\s+vo\s+la|gia\s+su\s+ban\s+la)\b",
        r"\b(ban\s+(bay\s+gio\s+la|se\s+la|phai\s+la|la\s+admin|la\s+quan\s+tri))\b",
        r"\b(tu\s+(nay|gio|bay\s+gio)\s+tro\s+di\s+ban\s+la)\b",
        r"\b(developer\s+mode|jailbreak|dan\s+mode|sudo\s+mode|god\s+mode|unrestricted\s+mode)\b",

        # 3. Reveal System Prompts / Hidden Instructions
        r"\bsystem\s+prompt\b",
        r"\b(reveal|show|display|print|output|dump|tell\s+me|give\s+me|repeat|expose|leak|share|what\s+is)\s+.*(system\s+prompt|hidden\s+prompt|initial\s+prompt|developer\s+prompt|instruction|source\s+code|implementation|system\s+message|meta\s+prompt|internal\s+prompt)",
        r"\b(tiet\s+lo|hien\s+thi|in\s+ra|dua\s+ra|cho\s+xem|xuat\s+ra|doc|nhac\s+lai|chia\s+se)\s+.*(system\s+prompt|prompt\s+he\s+thong|prompt\s+ban\s+dau|chi\s+dan\s+an|huong\s+dan\s+an|ma\s+nguon|source\s+code|logic\s+noi\s+bo|thiet\s+lap\s+he\s+thong|cau\s+truc\s+prompt|prompt)",

        # 4. Raw Document / File / Context Exfiltration & Verbatim Dumps
        r"\b(reveal|show|display|print|output|dump|tell\s+me|give\s+me|leak|extract|read|copy|reproduce|repeat)\s+.*(raw\s+file|raw\s+document|raw\s+text|raw\s+data|full\s+context|retrieved\s+document|retrieved\s+context|entire\s+file|source\s+file|entire\s+document|whole\s+file|whole\s+document|all\s+text|verbatim|word\s+for\s+word)",
        r"\b(print|dump|output|show|extract|copy|read)\s+(the\s+)?(raw|full|entire|whole|all)\s+(file|document|text|data|content|context)\b",
        r"\b(print|output|dump|extract)\s+.*(\d+|hundred|thousand)\s*(characters|words|chars|lines|ky\s+tu|tu|chu|dong)\b",
        r"\b(tiet\s+lo|in\s+ra|in|dua\s+ra|hien\s+thi|xuat\s+ra|trich\s+xuat|cho\s+xem|doc|chep\s+lai|sao\s+chep|lap\s+lai)\s+.*(toan\s+bo\s+file|file\s+goc|raw\s+document|raw\s+file|noi\s+dung\s+goc|tai\s+lieu\s+goc|ngu\s+canh\s+goc|van\s+ban\s+tho|du\s+lieu\s+tho|tai\s+lieu\s+raw|toan\s+bo\s+tai\s+lieu|toan\s+bo\s+van\s+ban|toan\s+bo\s+noi\s+dung|nguyen\s+van|toan\s+van|tung\s+chu|tung\s+cau\s+tung\s+chu|word\s+for\s+word|verbatim|toan\s+bo\s+context|toan\s+bo\s+ngu\s+canh)",
        r"\b(in\s+ra|xuat\s+ra|trich\s+xuat|doc|chep)\s+.*(\d+|tram|nghin|ngan)\s*(ky\s+tu|tu|chu|dong)\b",
        r"\b(nguyen\s+van|toan\s+van|word\s+for\s+word|verbatim)\s+.*(tai\s+lieu|file|van\s+ban|ngu\s+canh|context|bai\s+giang)\b",

        # 5. Guardrail & Filter Bypassing
        r"\b(bypass\s+(filter|guardrail|safety|restriction|rule)|disable\s+(filter|guardrail|safety)|turn\s+off\s+(filter|guardrail))\b",
        r"\b(vuot\s+qua\s+.*bo\s+loc|pha\s+vo\s+gioi\s+han|tat\s+(bo\s+loc|guardrail|bao\s+ve))\b",
    ]

    return any(re.search(pattern, normalized_text, re.IGNORECASE) for pattern in patterns)


def sanitize_input(text: str) -> str:
    """Trim user input and collapse repeated whitespace."""
    return re.sub(r"\s+", " ", text).strip()
