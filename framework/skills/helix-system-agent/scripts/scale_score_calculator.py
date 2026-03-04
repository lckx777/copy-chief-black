#!/usr/bin/env python3
"""
HELIX System - Scale Score Calculator v2

Calcula Score de Escala para competidores baseado em:
- Ads ativos apontando para mesma URL (peso 2x)
- Ads ativos com mesmo video (peso 1.75x)
- Dias rodando (peso 0.1x)

Uso:
    python3 scale_score_calculator.py input.json output.yaml

Input: JSON do dataset Apify (facebook-ads-library)
Output: YAML com competidores rankeados
"""

import json
import yaml
import sys
from datetime import datetime
from urllib.parse import urlparse, parse_qs
from collections import defaultdict

def normalize_url(url):
    """Remove tracking params e normaliza URL para agrupamento."""
    if not url:
        return ""
    
    try:
        parsed = urlparse(url)
        
        # Remove tracking params
        tracking_params = ['fbclid', 'utm_source', 'utm_medium', 'utm_campaign', 
                         'utm_content', 'utm_term', 'ref', 'src', 'sck']
        
        query = parse_qs(parsed.query)
        clean_query = {k: v for k, v in query.items() if k.lower() not in tracking_params}
        
        # Normaliza
        netloc = parsed.netloc.lower().replace('www.', '')
        path = parsed.path.rstrip('/')
        
        return f"{netloc}{path}"
    except:
        return url

def calculate_scale_scores(ads_data):
    """
    Agrupa ads por anunciante e calcula scale score.
    
    Fórmula: (ads_mesma_url × 2) + (ads_mesmo_video × 1.75) + (dias_ativo × 0.1)
    """
    # Agrupar por página/anunciante
    advertisers = defaultdict(lambda: {
        'ads': [],
        'urls': defaultdict(int),
        'videos': defaultdict(int),
        'page_name': '',
        'page_id': '',
        'oldest_date': None
    })
    
    today = datetime.now()
    
    for ad in ads_data:
        page_id = ad.get('pageId', ad.get('page_id', ''))
        page_name = ad.get('pageName', ad.get('page_name', ''))
        
        if not page_id:
            continue
            
        adv = advertisers[page_id]
        adv['page_name'] = page_name
        adv['page_id'] = page_id
        adv['ads'].append(ad)
        
        # Extrair URL do snapshot
        snapshot = ad.get('snapshot', {})
        link_url = snapshot.get('link_url', ad.get('link_url', ''))
        video_url = snapshot.get('video_url', ad.get('video_url', ''))
        
        # Normalizar e contar URLs
        if link_url:
            normalized = normalize_url(link_url)
            adv['urls'][normalized] += 1
        
        # Contar videos
        if video_url:
            adv['videos'][video_url] += 1
        
        # Track oldest date
        start_date_str = ad.get('startDate', ad.get('start_date', ''))
        if start_date_str:
            try:
                start_date = datetime.fromisoformat(start_date_str.replace('Z', '+00:00'))
                if adv['oldest_date'] is None or start_date < adv['oldest_date']:
                    adv['oldest_date'] = start_date
            except:
                pass
    
    # Calcular scores
    results = []
    
    for page_id, data in advertisers.items():
        ads_same_url = max(data['urls'].values()) if data['urls'] else 0
        ads_same_video = max(data['videos'].values()) if data['videos'] else 0
        
        if data['oldest_date']:
            days_running = (today - data['oldest_date'].replace(tzinfo=None)).days
        else:
            days_running = 0
        
        # Fórmula de Scale Score
        scale_score = (ads_same_url * 2) + (ads_same_video * 1.75) + (days_running * 0.1)
        
        # Top URL e Video
        top_url = max(data['urls'].items(), key=lambda x: x[1])[0] if data['urls'] else ''
        top_video = max(data['videos'].items(), key=lambda x: x[1])[0] if data['videos'] else ''
        
        results.append({
            'page_name': data['page_name'],
            'page_id': data['page_id'],
            'scale_score': round(scale_score, 2),
            'ads_same_url': ads_same_url,
            'ads_same_video': ads_same_video,
            'days_running': days_running,
            'total_ads': len(data['ads']),
            'top_url': top_url,
            'top_video_url': top_video,
            'unique_urls': len(data['urls']),
            'unique_videos': len(data['videos'])
        })
    
    # Ordenar por scale_score DESC
    results.sort(key=lambda x: x['scale_score'], reverse=True)
    
    # Adicionar rank
    for i, r in enumerate(results, 1):
        r['rank'] = i
    
    return results

def main():
    if len(sys.argv) < 2:
        print("Uso: python3 scale_score_calculator.py input.json [output.yaml]")
        print("\nInput: JSON do dataset Apify")
        print("Output: YAML com competidores rankeados (default: stdout)")
        sys.exit(1)
    
    input_file = sys.argv[1]
    output_file = sys.argv[2] if len(sys.argv) > 2 else None
    
    # Carregar dados
    with open(input_file, 'r', encoding='utf-8') as f:
        ads_data = json.load(f)
    
    # Calcular scores
    results = calculate_scale_scores(ads_data)
    
    # Preparar output
    output = {
        'meta': {
            'phase': '02_mineracao_scoring',
            'timestamp': datetime.now().isoformat(),
            'total_ads_processados': len(ads_data),
            'total_anunciantes': len(results)
        },
        'competidores_rankeados': results
    }
    
    # Output
    yaml_output = yaml.dump(output, allow_unicode=True, default_flow_style=False, sort_keys=False)
    
    if output_file:
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(yaml_output)
        print(f"✅ Output salvo em: {output_file}")
        print(f"📊 {len(results)} competidores rankeados")
        print(f"\n🔥 Top 5 por Scale Score:")
        for r in results[:5]:
            print(f"   {r['rank']}. {r['page_name']} - Score: {r['scale_score']} (URL×{r['ads_same_url']}, Video×{r['ads_same_video']}, {r['days_running']}d)")
    else:
        print(yaml_output)

if __name__ == '__main__':
    main()
