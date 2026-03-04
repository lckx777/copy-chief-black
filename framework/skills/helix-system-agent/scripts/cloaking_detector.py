#!/usr/bin/env python3
"""
HELIX System - Cloaking Detection v2

Detecta sinais de cloaking em landing pages comparando:
- Conteúdo fetchado vs copy do anúncio
- Presença de scripts de fingerprinting
- Patterns de redirect suspeitos

Uso:
    python3 cloaking_detector.py <url> [--ad-copy "texto do anúncio"]
    
Output: JSON com análise de cloaking
"""

import subprocess
import re
import sys
import json
from urllib.parse import urlparse

# Sinais de fingerprinting no HTML
FINGERPRINT_PATTERNS = [
    r'canvas.*?getContext',
    r'webgl',
    r'WebGLRenderingContext',
    r'navigator\.webdriver',
    r'navigator\.plugins',
    r'navigator\.languages',
    r'screen\.width',
    r'screen\.height',
    r'battery',
    r'getBattery',
    r'AudioContext',
    r'getTimezoneOffset',
    r'fingerprint',
    r'fp\.js',
    r'fpjs',
    r'cloaker',
    r'thewhiterabbit',
    r'hideclick',
    r'keitaro',
    r'cloakerly'
]

# Padrões de redirect suspeitos
REDIRECT_PATTERNS = [
    r'meta.*?refresh',
    r'window\.location',
    r'document\.location',
    r'location\.href\s*=',
    r'location\.replace',
    r'http-equiv=["\']refresh',
    r'setTimeout.*?redirect',
    r'setTimeout.*?location'
]

# Checkouts BR conhecidos
CHECKOUT_PATTERNS = {
    'hotmart': r'(checkout\.hotmart|pay\.hotmart)',
    'kiwify': r'pay\.kiwify',
    'monetizze': r'app\.monetizze',
    'eduzz': r'checkout\.eduzz',
    'cakto': r'pay\.cakto'
}

def fetch_url(url, user_agent='mobile'):
    """Fetch URL com diferentes user agents."""
    
    ua_mobile = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15"
    ua_googlebot = "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)"
    ua_desktop = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
    
    uas = {
        'mobile': ua_mobile,
        'googlebot': ua_googlebot,
        'desktop': ua_desktop
    }
    
    try:
        result = subprocess.run(
            ['curl', '-sL', url, '--max-time', '15', '-A', uas.get(user_agent, ua_mobile)],
            capture_output=True,
            text=True,
            timeout=20
        )
        return result.stdout
    except:
        return ""

def get_redirects(url):
    """Captura chain de redirects."""
    try:
        result = subprocess.run(
            ['curl', '-sIL', url, '--max-time', '10'],
            capture_output=True,
            text=True,
            timeout=15
        )
        locations = re.findall(r'location:\s*(.+)', result.stdout, re.IGNORECASE)
        return [loc.strip() for loc in locations]
    except:
        return []

def detect_fingerprinting(html):
    """Detecta scripts de fingerprinting."""
    found = []
    html_lower = html.lower()
    
    for pattern in FINGERPRINT_PATTERNS:
        if re.search(pattern, html_lower):
            found.append(pattern)
    
    return found

def detect_redirects(html):
    """Detecta padrões de redirect no HTML."""
    found = []
    
    for pattern in REDIRECT_PATTERNS:
        if re.search(pattern, html, re.IGNORECASE):
            found.append(pattern)
    
    return found

def detect_checkout(html):
    """Detecta plataforma de checkout."""
    html_lower = html.lower()
    
    for platform, pattern in CHECKOUT_PATTERNS.items():
        if re.search(pattern, html_lower):
            return platform
    
    return None

def calculate_text_similarity(text1, text2):
    """Calcula similaridade simples entre dois textos."""
    if not text1 or not text2:
        return 0.0
    
    # Normaliza
    words1 = set(re.findall(r'\w+', text1.lower()))
    words2 = set(re.findall(r'\w+', text2.lower()))
    
    if not words1 or not words2:
        return 0.0
    
    intersection = words1 & words2
    union = words1 | words2
    
    return len(intersection) / len(union)

def extract_visible_text(html):
    """Extrai texto visível do HTML (simplificado)."""
    # Remove scripts e styles
    html = re.sub(r'<script[^>]*>.*?</script>', '', html, flags=re.DOTALL | re.IGNORECASE)
    html = re.sub(r'<style[^>]*>.*?</style>', '', html, flags=re.DOTALL | re.IGNORECASE)
    # Remove tags
    text = re.sub(r'<[^>]+>', ' ', html)
    # Normaliza espaços
    text = re.sub(r'\s+', ' ', text)
    return text.strip()

def analyze_cloaking(url, ad_copy=None):
    """Análise completa de cloaking."""
    
    results = {
        'url': url,
        'cloaking_detected': False,
        'confidence': 0.0,
        'evidence': [],
        'fingerprint_scripts': [],
        'redirect_patterns': [],
        'redirect_chain': [],
        'checkout_platform': None,
        'content_analysis': {},
        'recommendation': ''
    }
    
    # 1. Fetch com diferentes UAs
    html_mobile = fetch_url(url, 'mobile')
    html_googlebot = fetch_url(url, 'googlebot')
    
    if not html_mobile:
        results['evidence'].append('fetch_failed')
        results['cloaking_detected'] = True
        results['confidence'] = 0.5
        results['recommendation'] = 'URL inacessível - possível bloqueio de datacenter IP'
        return results
    
    # 2. Detectar fingerprinting
    fp_scripts = detect_fingerprinting(html_mobile)
    results['fingerprint_scripts'] = fp_scripts
    if fp_scripts:
        results['evidence'].append('fingerprint_scripts_found')
    
    # 3. Detectar redirects no HTML
    redirect_patterns = detect_redirects(html_mobile)
    results['redirect_patterns'] = redirect_patterns
    if redirect_patterns:
        results['evidence'].append('redirect_patterns_found')
    
    # 4. Capturar chain de redirects
    redirect_chain = get_redirects(url)
    results['redirect_chain'] = redirect_chain
    if len(redirect_chain) > 2:
        results['evidence'].append('multiple_redirects')
    
    # 5. Comparar mobile vs googlebot
    if html_googlebot:
        text_mobile = extract_visible_text(html_mobile)
        text_googlebot = extract_visible_text(html_googlebot)
        similarity = calculate_text_similarity(text_mobile, text_googlebot)
        
        results['content_analysis']['mobile_vs_googlebot'] = {
            'similarity': round(similarity, 2),
            'different': similarity < 0.7
        }
        
        if similarity < 0.3:
            results['evidence'].append('content_mismatch_severe')
        elif similarity < 0.7:
            results['evidence'].append('content_mismatch_moderate')
    
    # 6. Comparar com ad copy (se fornecido)
    if ad_copy:
        text_mobile = extract_visible_text(html_mobile)
        ad_similarity = calculate_text_similarity(text_mobile, ad_copy)
        
        results['content_analysis']['vs_ad_copy'] = {
            'similarity': round(ad_similarity, 2),
            'matches': ad_similarity > 0.3
        }
        
        if ad_similarity < 0.2:
            results['evidence'].append('ad_copy_not_found')
    
    # 7. Detectar checkout
    results['checkout_platform'] = detect_checkout(html_mobile)
    
    # 8. Calcular score final
    evidence_weights = {
        'fetch_failed': 0.5,
        'fingerprint_scripts_found': 0.3,
        'redirect_patterns_found': 0.2,
        'multiple_redirects': 0.2,
        'content_mismatch_severe': 0.5,
        'content_mismatch_moderate': 0.3,
        'ad_copy_not_found': 0.4
    }
    
    confidence = sum(evidence_weights.get(e, 0.1) for e in results['evidence'])
    confidence = min(confidence, 1.0)
    results['confidence'] = round(confidence, 2)
    
    # 9. Determinar se é cloaking
    results['cloaking_detected'] = confidence >= 0.5 or 'content_mismatch_severe' in results['evidence']
    
    # 10. Recomendação
    if results['cloaking_detected']:
        if confidence >= 0.8:
            results['recommendation'] = 'Cloaking altamente provável. Usar anti-detect browser + residential proxy BR para bypass.'
        elif confidence >= 0.5:
            results['recommendation'] = 'Cloaking provável. Tentar anti-detect browser ou extrair dados do anúncio diretamente.'
        else:
            results['recommendation'] = 'Possível cloaking. Verificar manualmente com dispositivo mobile real.'
    else:
        results['recommendation'] = 'Sem sinais claros de cloaking. Prosseguir com extração normal.'
    
    return results

def main():
    if len(sys.argv) < 2:
        print("Uso: python3 cloaking_detector.py <url> [--ad-copy \"texto do anúncio\"]")
        print("\nExemplo:")
        print("  python3 cloaking_detector.py https://oferta.com/vsl")
        print("  python3 cloaking_detector.py https://oferta.com/vsl --ad-copy \"Descubra o método...\"")
        sys.exit(1)
    
    url = sys.argv[1]
    ad_copy = None
    
    if '--ad-copy' in sys.argv:
        idx = sys.argv.index('--ad-copy')
        if idx + 1 < len(sys.argv):
            ad_copy = sys.argv[idx + 1]
    
    print(f"🔍 Analisando: {url}")
    if ad_copy:
        print(f"📝 Comparando com ad copy fornecido")
    print()
    
    results = analyze_cloaking(url, ad_copy)
    
    # Output
    if results['cloaking_detected']:
        print(f"⚠️  CLOAKING DETECTADO (confiança: {results['confidence']:.0%})")
    else:
        print(f"✅ Sem cloaking aparente (confiança: {1-results['confidence']:.0%})")
    
    print(f"\n📋 Evidências: {', '.join(results['evidence']) or 'Nenhuma'}")
    
    if results['fingerprint_scripts']:
        print(f"🔐 Scripts de fingerprinting: {len(results['fingerprint_scripts'])} encontrados")
    
    if results['redirect_chain']:
        print(f"↪️  Redirects: {' → '.join(results['redirect_chain'][:3])}")
    
    if results['checkout_platform']:
        print(f"💳 Checkout detectado: {results['checkout_platform']}")
    
    print(f"\n💡 Recomendação: {results['recommendation']}")
    
    # JSON completo para processamento
    print(f"\n--- JSON Output ---")
    print(json.dumps(results, indent=2, ensure_ascii=False))

if __name__ == '__main__':
    main()
