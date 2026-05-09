"""
LC Sistema — Gerador de Relatório Diagnóstico PDF
Uso: python gerar_relatorio.py '<json_data>' output.pdf
"""

import sys
import json
from datetime import datetime
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.colors import HexColor, white, black
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    HRFlowable, PageBreak, KeepTogether
)
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT

# ── Paleta LC Saúde ──────────────────────────────────────────────────────────
AZUL       = HexColor('#1B3A5C')
AZUL_MED   = HexColor('#2E6DA4')
AZUL_CLARO = HexColor('#D6E4F0')
VERDE      = HexColor('#166534')
VERDE_BG   = HexColor('#DCFCE7')
AMARELO    = HexColor('#92400E')
AMARELO_BG = HexColor('#FEF3C7')
VERMELHO   = HexColor('#991B1B')
VERMELHO_BG= HexColor('#FEE2E2')
CINZA      = HexColor('#6B7280')
CINZA_CLARO= HexColor('#F9FAFB')
CINZA_BORDA= HexColor('#E5E7EB')

W, H = A4

# ── Estilos ───────────────────────────────────────────────────────────────────
def estilos():
    base = getSampleStyleSheet()
    return {
        'titulo': ParagraphStyle('titulo', fontSize=22, textColor=AZUL,
            fontName='Helvetica-Bold', spaceAfter=4, alignment=TA_LEFT),
        'subtitulo': ParagraphStyle('subtitulo', fontSize=13, textColor=AZUL_MED,
            fontName='Helvetica-Bold', spaceAfter=2, alignment=TA_LEFT),
        'secao': ParagraphStyle('secao', fontSize=11, textColor=white,
            fontName='Helvetica-Bold', spaceAfter=0, spaceBefore=0,
            leftIndent=8, alignment=TA_LEFT),
        'normal': ParagraphStyle('normal', fontSize=9, textColor=HexColor('#374151'),
            fontName='Helvetica', spaceAfter=3, leading=13),
        'small': ParagraphStyle('small', fontSize=8, textColor=CINZA,
            fontName='Helvetica', spaceAfter=2, leading=11),
        'bold': ParagraphStyle('bold', fontSize=9, textColor=HexColor('#111827'),
            fontName='Helvetica-Bold', spaceAfter=2),
        'label': ParagraphStyle('label', fontSize=8, textColor=CINZA,
            fontName='Helvetica', spaceAfter=1),
        'valor': ParagraphStyle('valor', fontSize=10, textColor=AZUL,
            fontName='Helvetica-Bold', spaceAfter=2),
        'nc_critica': ParagraphStyle('nc_critica', fontSize=8, textColor=VERMELHO,
            fontName='Helvetica-Bold'),
        'nc_importante': ParagraphStyle('nc_importante', fontSize=8, textColor=AMARELO,
            fontName='Helvetica-Bold'),
        'nc_moderada': ParagraphStyle('nc_moderada', fontSize=8, textColor=HexColor('#854D0E'),
            fontName='Helvetica-Bold'),
        'rodape': ParagraphStyle('rodape', fontSize=7, textColor=CINZA,
            fontName='Helvetica', alignment=TA_CENTER),
    }

# ── Helpers ───────────────────────────────────────────────────────────────────
def cabecalho_secao(titulo, st):
    tbl = Table([[Paragraph(titulo.upper(), st['secao'])]], colWidths=[W - 4*cm])
    tbl.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), AZUL),
        ('TOPPADDING',    (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('LEFTPADDING',   (0,0), (-1,-1), 10),
        ('ROUNDEDCORNERS', [4, 4, 4, 4]),
    ]))
    return tbl

def badge(texto, bg, fg):
    style = ParagraphStyle('b', fontSize=7, textColor=fg,
        fontName='Helvetica-Bold', alignment=TA_CENTER)
    tbl = Table([[Paragraph(texto, style)]], colWidths=[None])
    tbl.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), bg),
        ('TOPPADDING',    (0,0), (-1,-1), 2),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2),
        ('LEFTPADDING',   (0,0), (-1,-1), 6),
        ('RIGHTPADDING',  (0,0), (-1,-1), 6),
        ('ROUNDEDCORNERS', [10, 10, 10, 10]),
    ]))
    return tbl

def cor_score(score):
    if score >= 85: return VERDE, VERDE_BG, 'CONFORME'
    if score >= 60: return AMARELO, AMARELO_BG, 'PARCIAL'
    return VERMELHO, VERMELHO_BG, 'NÃO CONFORME'

def cor_nc(nivel):
    if nivel == 'NC_III': return VERMELHO, VERMELHO_BG
    if nivel == 'NC_II':  return AMARELO, AMARELO_BG
    return HexColor('#92400E'), HexColor('#FEF3C7')

# ── Gerador principal ─────────────────────────────────────────────────────────
def gerar(dados: dict, caminho_saida: str):
    documento = SimpleDocTemplate(
        caminho_saida,
        pagesize=A4,
        leftMargin=2*cm, rightMargin=2*cm,
        topMargin=2.5*cm, bottomMargin=2*cm,
        title='Relatório Diagnóstico LC Saúde',
        author='LC Saúde Consultoria',
    )

    st = estilos()
    story = []
    col = W - 4*cm  # largura útil

    # ── CAPA ──────────────────────────────────────────────────────────────────
    story.append(Spacer(1, 1.5*cm))

    # Logo / marca LC Saúde
    tbl_logo = Table([[
        Paragraph('<b>LC</b>', ParagraphStyle('logo', fontSize=28, textColor=white,
            fontName='Helvetica-Bold', alignment=TA_CENTER)),
        Paragraph('LC Saúde<br/>Consultoria em Nefrologia', ParagraphStyle('lognome',
            fontSize=11, textColor=AZUL, fontName='Helvetica-Bold',
            leftIndent=8, leading=15)),
    ]], colWidths=[1.2*cm, col - 1.2*cm])
    tbl_logo.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (0,0), AZUL),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING', (0,0), (0,0), 8),
        ('BOTTOMPADDING', (0,0), (0,0), 8),
        ('LEFTPADDING', (0,0), (0,0), 10),
        ('RIGHTPADDING', (0,0), (0,0), 10),
    ]))
    story.append(tbl_logo)
    story.append(Spacer(1, 0.8*cm))

    story.append(Paragraph('Relatório Diagnóstico', ParagraphStyle('capa_t',
        fontSize=26, textColor=AZUL, fontName='Helvetica-Bold', spaceAfter=4)))
    story.append(Paragraph(dados.get('cliente_nome', ''), ParagraphStyle('capa_c',
        fontSize=16, textColor=AZUL_MED, fontName='Helvetica-Bold', spaceAfter=2)))

    periodo = dados.get('periodo_diagnostico', '')
    story.append(Paragraph(f'Período: {periodo}', ParagraphStyle('capa_p',
        fontSize=10, textColor=CINZA, fontName='Helvetica', spaceAfter=8)))

    story.append(HRFlowable(width=col, thickness=2, color=AZUL_MED, spaceAfter=16))

    # Sumário de scores na capa
    scores = dados.get('scores_resumo', {})
    itens_capa = []
    for label, chave in [
        ('Conformidade regulatória', 'score_nc'),
        ('Avaliação documental',     'score_documental'),
        ('Desempenho financeiro',    'score_financeiro'),
    ]:
        val = scores.get(chave)
        if val is None: continue
        fg, bg, classif = cor_score(val)
        itens_capa.append([
            Paragraph(label, st['label']),
            Paragraph(f'{val:.0f}%', ParagraphStyle('cv', fontSize=20, textColor=fg,
                fontName='Helvetica-Bold', alignment=TA_RIGHT)),
            badge(classif, bg, fg),
        ])

    if itens_capa:
        tbl_s = Table(itens_capa, colWidths=[col*0.5, col*0.2, col*0.3])
        tbl_s.setStyle(TableStyle([
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ('ROWBACKGROUNDS', (0,0), (-1,-1), [CINZA_CLARO, white]),
            ('TOPPADDING',    (0,0), (-1,-1), 8),
            ('BOTTOMPADDING', (0,0), (-1,-1), 8),
            ('LEFTPADDING',   (0,0), (-1,-1), 10),
            ('LINEBELOW', (0,0), (-1,-2), 0.3, CINZA_BORDA),
            ('ROUNDEDCORNERS', [6, 6, 6, 6]),
            ('BOX', (0,0), (-1,-1), 0.5, CINZA_BORDA),
        ]))
        story.append(tbl_s)

    data_geracao = datetime.now().strftime('%d/%m/%Y às %H:%M')
    story.append(Spacer(1, 0.6*cm))
    story.append(Paragraph(f'Gerado em {data_geracao} — Confidencial', st['small']))
    story.append(PageBreak())

    # ── 1. IDENTIFICAÇÃO DO SERVIÇO ───────────────────────────────────────────
    story.append(cabecalho_secao('1. Identificação do Serviço', st))
    story.append(Spacer(1, 0.3*cm))

    ident = dados.get('identificacao', {})
    campos_id = [
        ('Razão social',         ident.get('razao_social', '—')),
        ('CNPJ',                 ident.get('cnpj', '—')),
        ('CNES',                 ident.get('cnes', '—')),
        ('Endereço',             ident.get('endereco', '—')),
        ('Licença sanitária',    ident.get('licenca', '—')),
        ('Natureza do serviço',  ident.get('natureza', '—')),
        ('Responsável técnico',  ident.get('responsavel_tecnico', '—')),
        ('Período diagnóstico',  ident.get('periodo', '—')),
    ]

    rows_id = []
    for i in range(0, len(campos_id), 2):
        row = []
        for label, valor in campos_id[i:i+2]:
            row.append(Paragraph(f'<b>{label}</b><br/>{valor}', st['normal']))
        if len(row) == 1: row.append('')
        rows_id.append(row)

    tbl_id = Table(rows_id, colWidths=[col/2, col/2])
    tbl_id.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('TOPPADDING',    (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('LEFTPADDING',   (0,0), (-1,-1), 8),
        ('ROWBACKGROUNDS', (0,0), (-1,-1), [CINZA_CLARO, white]),
        ('LINEBELOW', (0,0), (-1,-2), 0.3, CINZA_BORDA),
        ('BOX', (0,0), (-1,-1), 0.5, CINZA_BORDA),
    ]))
    story.append(tbl_id)
    story.append(Spacer(1, 0.5*cm))

    # ── 2. RESULTADO DO QUESTIONÁRIO M2 ───────────────────────────────────────
    story.append(cabecalho_secao('2. Resultado do Questionário M2', st))
    story.append(Spacer(1, 0.3*cm))

    blocos = dados.get('blocos_questionario', [])
    if blocos:
        rows_b = [[
            Paragraph('<b>Bloco</b>', st['bold']),
            Paragraph('<b>Título</b>', st['bold']),
            Paragraph('<b>Respondidas</b>', st['bold']),
            Paragraph('<b>Completude</b>', st['bold']),
        ]]
        for bloco in blocos:
            pct = bloco.get('pct_completo', 0)
            fg, bg, _ = cor_score(pct)
            rows_b.append([
                Paragraph(bloco.get('codigo', ''), st['normal']),
                Paragraph(bloco.get('titulo', ''), st['normal']),
                Paragraph(f"{bloco.get('respondidas', 0)}/{bloco.get('total', 0)}", st['normal']),
                Paragraph(f'{pct:.0f}%', ParagraphStyle('pct', fontSize=9,
                    textColor=fg, fontName='Helvetica-Bold')),
            ])
        tbl_b = Table(rows_b, colWidths=[col*0.1, col*0.55, col*0.18, col*0.17])
        tbl_b.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), AZUL_CLARO),
            ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ('ROWBACKGROUNDS', (0,1), (-1,-1), [white, CINZA_CLARO]),
            ('TOPPADDING',    (0,0), (-1,-1), 5),
            ('BOTTOMPADDING', (0,0), (-1,-1), 5),
            ('LEFTPADDING',   (0,0), (-1,-1), 6),
            ('LINEBELOW', (0,0), (-1,-1), 0.3, CINZA_BORDA),
            ('BOX', (0,0), (-1,-1), 0.5, CINZA_BORDA),
        ]))
        story.append(tbl_b)
    else:
        story.append(Paragraph('Questionário não iniciado ou sem dados.', st['small']))
    story.append(Spacer(1, 0.5*cm))

    # ── 3. NÃO CONFORMIDADES (Motor M11) ──────────────────────────────────────
    story.append(cabecalho_secao('3. Não Conformidades Regulatórias (Motor M11)', st))
    story.append(Spacer(1, 0.3*cm))

    ncs = dados.get('nao_conformidades', [])
    resumo_nc = dados.get('resumo_nc', {})

    # Cards de resumo NC
    cards_nc = [
        (str(resumo_nc.get('total', 0)),    'Total',        AZUL,     AZUL_CLARO),
        (str(resumo_nc.get('criticas', 0)), 'NC III — Críticas',  VERMELHO, VERMELHO_BG),
        (str(resumo_nc.get('importantes', 0)), 'NC II — Importantes', AMARELO, AMARELO_BG),
        (str(resumo_nc.get('moderadas', 0)), 'NC I — Moderadas', HexColor('#92400E'), HexColor('#FEF3C7')),
    ]
    row_cards = []
    for val, lab, fg, bg in cards_nc:
        cell = Table([[
            Paragraph(val, ParagraphStyle('cv2', fontSize=22, textColor=fg,
                fontName='Helvetica-Bold', alignment=TA_CENTER)),
            Paragraph(lab, ParagraphStyle('cl', fontSize=7, textColor=fg,
                fontName='Helvetica', alignment=TA_CENTER, leading=10)),
        ]], colWidths=[None])
        cell.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), bg),
            ('TOPPADDING',    (0,0), (-1,-1), 8),
            ('BOTTOMPADDING', (0,0), (-1,-1), 8),
            ('BOX', (0,0), (-1,-1), 0.5, fg),
            ('ROUNDEDCORNERS', [6, 6, 6, 6]),
        ]))
        row_cards.append(cell)
    tbl_cards = Table([row_cards], colWidths=[col/4]*4)
    tbl_cards.setStyle(TableStyle([
        ('LEFTPADDING',  (0,0), (-1,-1), 4),
        ('RIGHTPADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(tbl_cards)
    story.append(Spacer(1, 0.4*cm))

    if ncs:
        rows_nc = [[
            Paragraph('<b>Nível</b>', st['bold']),
            Paragraph('<b>Domínio</b>', st['bold']),
            Paragraph('<b>Descrição</b>', st['bold']),
            Paragraph('<b>Prazo</b>', st['bold']),
            Paragraph('<b>Responsáveis</b>', st['bold']),
            Paragraph('<b>Status</b>', st['bold']),
        ]]
        for nc in ncs:
            nivel = nc.get('nivel', '')
            fg_nc, bg_nc = cor_nc(nivel)
            prazo = nc.get('prazo_limite', '')
            if prazo:
                try:
                    prazo = datetime.fromisoformat(prazo[:10]).strftime('%d/%m/%Y')
                except: pass
            rows_nc.append([
                Paragraph(nivel.replace('_', ' '), ParagraphStyle('ncn', fontSize=8,
                    textColor=fg_nc, fontName='Helvetica-Bold')),
                Paragraph(nc.get('dominio', ''), st['small']),
                Paragraph(nc.get('descricao', '')[:120] + ('...' if len(nc.get('descricao','')) > 120 else ''), st['small']),
                Paragraph(prazo, st['small']),
                Paragraph(nc.get('status', '').replace('_', ' '), st['small']),
            ])
        tbl_nc = Table(rows_nc, colWidths=[col*0.1, col*0.12, col*0.52, col*0.13, col*0.13])
        tbl_nc.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), AZUL_CLARO),
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
            ('ROWBACKGROUNDS', (0,1), (-1,-1), [white, CINZA_CLARO]),
            ('TOPPADDING',    (0,0), (-1,-1), 4),
            ('BOTTOMPADDING', (0,0), (-1,-1), 4),
            ('LEFTPADDING',   (0,0), (-1,-1), 4),
            ('LINEBELOW', (0,0), (-1,-1), 0.3, CINZA_BORDA),
            ('BOX', (0,0), (-1,-1), 0.5, CINZA_BORDA),
        ]))
        story.append(tbl_nc)
    else:
        story.append(Paragraph('Nenhuma não conformidade registrada.', st['small']))
    story.append(Spacer(1, 0.5*cm))

    # ── 4. SCORE DOCUMENTAL ───────────────────────────────────────────────────
    story.append(cabecalho_secao('4. Avaliação Documental', st))
    story.append(Spacer(1, 0.3*cm))

    docs_aval = dados.get('documentos_avaliados', [])
    if docs_aval:
        rows_doc = [[
            Paragraph('<b>Documento</b>', st['bold']),
            Paragraph('<b>Tipo</b>', st['bold']),
            Paragraph('<b>Score</b>', st['bold']),
            Paragraph('<b>Classificação</b>', st['bold']),
        ]]
        for doc in docs_aval:
            score = doc.get('score_final', 0)
            fg_d, bg_d, classif_d = cor_score(score)
            rows_doc.append([
                Paragraph(doc.get('titulo', doc.get('nome_documento', '')), st['small']),
                Paragraph(doc.get('tipo', ''), st['small']),
                Paragraph(f'{score:.0f}%', ParagraphStyle('ds', fontSize=9,
                    textColor=fg_d, fontName='Helvetica-Bold')),
                badge(classif_d, bg_d, fg_d),
            ])
        tbl_doc = Table(rows_doc, colWidths=[col*0.52, col*0.15, col*0.13, col*0.20])
        tbl_doc.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), AZUL_CLARO),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ('ROWBACKGROUNDS', (0,1), (-1,-1), [white, CINZA_CLARO]),
            ('TOPPADDING',    (0,0), (-1,-1), 4),
            ('BOTTOMPADDING', (0,0), (-1,-1), 4),
            ('LEFTPADDING',   (0,0), (-1,-1), 6),
            ('LINEBELOW', (0,0), (-1,-1), 0.3, CINZA_BORDA),
            ('BOX', (0,0), (-1,-1), 0.5, CINZA_BORDA),
        ]))
        story.append(tbl_doc)
    else:
        story.append(Paragraph('Nenhum documento avaliado ainda.', st['small']))
    story.append(Spacer(1, 0.5*cm))

    # ── 5. INDICADORES FINANCEIROS ────────────────────────────────────────────
    financeiro = dados.get('indicadores_financeiros')
    if financeiro:
        story.append(cabecalho_secao('5. Indicadores Financeiros', st))
        story.append(Spacer(1, 0.3*cm))

        indicadores = [
            ('Faturamento bruto',        financeiro.get('faturamento_bruto'),        'R$'),
            ('Taxa de glosa',            financeiro.get('taxa_glosa'),               '%'),
            ('Taxa de ocupação',         financeiro.get('taxa_ocupacao'),            '%'),
            ('Custo por sessão',         financeiro.get('custo_por_sessao'),         'R$'),
            ('Margem operacional',       financeiro.get('margem_percentual'),        '%'),
            ('Sessões realizadas',       financeiro.get('sessoes_realizadas'),       ''),
            ('Custo insumos/sessão',     financeiro.get('custo_insumos_por_sessao'), 'R$'),
            ('Folha sobre receita',      financeiro.get('folha_sobre_receita'),      '%'),
        ]

        rows_fin = []
        for i in range(0, len(indicadores), 2):
            row = []
            for label, val, unidade in indicadores[i:i+2]:
                if val is None:
                    row.append(Paragraph(f'<b>{label}</b><br/>—', st['normal']))
                    continue
                if unidade == 'R$':
                    val_str = f'R$ {float(val):,.2f}'.replace(',', 'X').replace('.', ',').replace('X', '.')
                elif unidade == '%':
                    val_str = f'{float(val):.1f}%'
                else:
                    val_str = str(val)
                row.append(Paragraph(f'<b>{label}</b><br/>{val_str}', st['normal']))
            if len(row) == 1: row.append('')
            rows_fin.append(row)

        tbl_fin = Table(rows_fin, colWidths=[col/2, col/2])
        tbl_fin.setStyle(TableStyle([
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
            ('TOPPADDING',    (0,0), (-1,-1), 6),
            ('BOTTOMPADDING', (0,0), (-1,-1), 6),
            ('LEFTPADDING',   (0,0), (-1,-1), 8),
            ('ROWBACKGROUNDS', (0,0), (-1,-1), [CINZA_CLARO, white]),
            ('LINEBELOW', (0,0), (-1,-2), 0.3, CINZA_BORDA),
            ('BOX', (0,0), (-1,-1), 0.5, CINZA_BORDA),
        ]))
        story.append(tbl_fin)
        story.append(Spacer(1, 0.5*cm))

    # ── 6. PLANO DE AÇÃO (Matriz GUT) ────────────────────────────────────────
    story.append(cabecalho_secao('6. Plano de Ação Priorizado (Matriz GUT)', st))
    story.append(Spacer(1, 0.3*cm))

    acoes = dados.get('plano_acao', [])
    if acoes:
        rows_ac = [[
            Paragraph('<b>Prioridade</b>', st['bold']),
            Paragraph('<b>Problema / Ação</b>', st['bold']),
            Paragraph('<b>Origem</b>', st['bold']),
            Paragraph('<b>Prazo</b>', st['bold']),
            Paragraph('<b>Responsáveis</b>', st['bold']),
            Paragraph('<b>Status</b>', st['bold']),
        ]]
        for i, acao in enumerate(acoes[:30], 1):  # max 30 ações
            prioridade = acao.get('prioridade', '')
            fg_ac = VERMELHO if prioridade == 'CRITICA' else \
                    AMARELO if prioridade == 'ALTA' else CINZA
            prazo_ac = acao.get('prazo', '')
            if prazo_ac:
                try:
                    prazo_ac = datetime.fromisoformat(prazo_ac[:10]).strftime('%d/%m/%Y')
                except: pass
            rows_ac.append([
                Paragraph(f'#{i} {prioridade}', ParagraphStyle('acp', fontSize=8,
                    textColor=fg_ac, fontName='Helvetica-Bold')),
                Paragraph(acao.get('titulo', ''), st['small']),
                Paragraph(acao.get('origem', '').replace('_', ' '), st['small']),
                Paragraph(prazo_ac, st['small']),
                Paragraph(', '.join([a.capitalize() for a in acao.get('agentes', [])]) or '—', st['small']),
                Paragraph(acao.get('status', '').replace('_', ' '), st['small']),
            ])
        tbl_ac = Table(rows_ac, colWidths=[col*0.12, col*0.35, col*0.12, col*0.12, col*0.15, col*0.14])
        tbl_ac.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), AZUL_CLARO),
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
            ('ROWBACKGROUNDS', (0,1), (-1,-1), [white, CINZA_CLARO]),
            ('TOPPADDING',    (0,0), (-1,-1), 4),
            ('BOTTOMPADDING', (0,0), (-1,-1), 4),
            ('LEFTPADDING',   (0,0), (-1,-1), 4),
            ('LINEBELOW', (0,0), (-1,-1), 0.3, CINZA_BORDA),
            ('BOX', (0,0), (-1,-1), 0.5, CINZA_BORDA),
        ]))
        story.append(tbl_ac)
    else:
        story.append(Paragraph('Nenhuma ação registrada.', st['small']))

    story.append(Spacer(1, 1*cm))
    story.append(HRFlowable(width=col, thickness=1, color=CINZA_BORDA))
    story.append(Spacer(1, 0.2*cm))
    story.append(Paragraph(
        f'LC Saúde Consultoria em Nefrologia — Relatório gerado em {data_geracao} — Documento confidencial',
        st['rodape']
    ))

    documento.build(story)
    print(f'PDF gerado: {caminho_saida}')

if __name__ == '__main__':
    dados_teste = {
        'cliente_nome': 'Hospital Dilson Godinho',
        'periodo_diagnostico': 'Março a Agosto 2026',
        'scores_resumo': {
            'score_nc': 42,
            'score_documental': 68,
            'score_financeiro': 59,
        },
        'identificacao': {
            'razao_social': 'Hospital Dilson Godinho',
            'cnpj': '00.991.591/0001-06',
            'cnes': '2126915',
            'endereco': 'Montes Claros, MG',
            'licenca': 'Vigente',
            'natureza': 'Hospital Geral com Serviço de Nefrologia',
            'responsavel_tecnico': 'Dr. Helder Leone Alves de Carvalho',
            'periodo': 'Março a Agosto 2026',
        },
        'blocos_questionario': [
            {'codigo': 'B0', 'titulo': 'Identificação do Serviço', 'respondidas': 9, 'total': 9, 'pct_completo': 100},
            {'codigo': 'B1', 'titulo': 'Mapeamento do Espaço Físico', 'respondidas': 30, 'total': 38, 'pct_completo': 79},
            {'codigo': 'B2', 'titulo': 'Capacidade Operacional', 'respondidas': 45, 'total': 74, 'pct_completo': 61},
            {'codigo': 'B3', 'titulo': 'Recursos Humanos', 'respondidas': 37, 'total': 37, 'pct_completo': 100},
            {'codigo': 'B4', 'titulo': 'Estrutura Físico-Funcional', 'respondidas': 10, 'total': 17, 'pct_completo': 59},
        ],
        'resumo_nc': {'total': 12, 'criticas': 5, 'importantes': 4, 'moderadas': 3},
        'nao_conformidades': [
            {'nivel': 'NC_III', 'dominio': 'ESTRUTURA', 'descricao': 'Ausência de sala exclusiva para pacientes HBsAg positivo — risco crítico de transmissão cruzada.', 'prazo_limite': '2026-05-24', 'status': 'ABERTA'},
            {'nivel': 'NC_III', 'dominio': 'RH', 'descricao': 'Proporção técnico/paciente abaixo do mínimo legal (1:4 por turno) — risco direto à segurança nas sessões.', 'prazo_limite': '2026-05-24', 'status': 'ABERTA'},
            {'nivel': 'NC_II',  'dominio': 'PROCESSOS', 'descricao': 'MPOP desatualizado — exigência explícita da RDC 11/2014.', 'prazo_limite': '2026-06-08', 'status': 'EM_ANDAMENTO'},
            {'nivel': 'NC_I',   'dominio': 'FATURAMENTO', 'descricao': 'Ausência de auditoria prévia das APACs — principal causa de glosas evitáveis.', 'prazo_limite': '2026-07-08', 'status': 'ABERTA'},
        ],
        'documentos_avaliados': [
            {'titulo': 'Manual de Procedimentos Operacionais Padrão (MPOP)', 'tipo': 'POP', 'score_final': 45},
            {'titulo': 'Checklist pré-diálise', 'tipo': 'Checklist', 'score_final': 88},
            {'titulo': 'Protocolo de Anticoagulação', 'tipo': 'Protocolo', 'score_final': 72},
        ],
        'indicadores_financeiros': {
            'faturamento_bruto': 285000,
            'taxa_glosa': 8.3,
            'taxa_ocupacao': 76.4,
            'custo_por_sessao': 312,
            'margem_percentual': 11.2,
            'sessoes_realizadas': 840,
            'custo_insumos_por_sessao': 142,
            'folha_sobre_receita': 34.1,
        },
        'plano_acao': [
            {'prioridade': 'CRITICA', 'titulo': 'Adequar proporção técnico/paciente conforme RDC 11/2014', 'origem': 'NC_REGULATORIA', 'prazo': '2026-05-24', 'agentes': ['GESTAO', 'ENFERMAGEM'], 'status': 'PENDENTE'},
            {'prioridade': 'CRITICA', 'titulo': 'Implantar sala exclusiva para HBsAg positivo', 'origem': 'NC_REGULATORIA', 'prazo': '2026-05-24', 'agentes': ['ADMINISTRATIVO', 'GESTAO'], 'status': 'PENDENTE'},
            {'prioridade': 'ALTA', 'titulo': 'Atualizar e assinar MPOP com todos os RTs', 'origem': 'DOCUMENTAL', 'prazo': '2026-06-08', 'agentes': ['QUALIDADE', 'MEDICO', 'ENFERMAGEM'], 'status': 'EM_ANDAMENTO'},
            {'prioridade': 'ALTA', 'titulo': 'Implantar auditoria prévia de APACs', 'origem': 'FINANCEIRA', 'prazo': '2026-06-30', 'agentes': ['ADMINISTRATIVO', 'TI'], 'status': 'PENDENTE'},
        ],
    }
    gerar(dados_teste, '/mnt/user-data/outputs/relatorio_diagnostico_teste.pdf')
