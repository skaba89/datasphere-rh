#!/usr/bin/env python3
"""
DataSphere RH Guinée — Cahier des charges SIRH premium SaaS multi-tenant
Génère le PDF complet (body + cover merge) via ReportLab + Playwright.
"""
import os
import sys
import hashlib

PDF_SKILL_DIR = "/home/z/my-project/skills/pdf"
sys.path.insert(0, os.path.join(PDF_SKILL_DIR, "scripts"))

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import inch, mm
from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT, TA_JUSTIFY
from reportlab.lib.styles import ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase.pdfmetrics import registerFontFamily
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, PageBreak, Table, TableStyle,
    Image, KeepTogether, CondPageBreak, HRFlowable, ListFlowable, ListItem,
)
from reportlab.platypus.tableofcontents import TableOfContents
from PIL import Image as PILImage

# ━━ Fonts ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FONT_DIR = "/usr/share/fonts"
pdfmetrics.registerFont(TTFont('NotoSerifSC', f'{FONT_DIR}/truetype/noto-serif-sc/NotoSerifSC-Regular.ttf'))
pdfmetrics.registerFont(TTFont('NotoSerifSC-Bold', f'{FONT_DIR}/truetype/noto-serif-sc/NotoSerifSC-Bold.ttf'))
pdfmetrics.registerFont(TTFont('SarasaMonoSC', f'{FONT_DIR}/truetype/chinese/SarasaMonoSC-Regular.ttf'))
pdfmetrics.registerFont(TTFont('FreeSerif', f'{FONT_DIR}/truetype/freefont/FreeSerif.ttf'))
pdfmetrics.registerFont(TTFont('FreeSerif-Bold', f'{FONT_DIR}/truetype/freefont/FreeSerifBold.ttf'))
pdfmetrics.registerFont(TTFont('FreeSerif-Italic', f'{FONT_DIR}/truetype/freefont/FreeSerifItalic.ttf'))
pdfmetrics.registerFont(TTFont('FreeSerif-BoldItalic', f'{FONT_DIR}/truetype/freefont/FreeSerifBoldItalic.ttf'))
registerFontFamily('NotoSerifSC', normal='NotoSerifSC', bold='NotoSerifSC-Bold')
registerFontFamily('FreeSerif', normal='FreeSerif', bold='FreeSerif-Bold',
                   italic='FreeSerif-Italic', boldItalic='FreeSerif-BoldItalic')

from pdf import install_font_fallback
install_font_fallback()

# ━━ Palette ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PAGE_BG       = colors.HexColor('#f3f4f5')
SECTION_BG    = colors.HexColor('#e7e8e9')
CARD_BG       = colors.HexColor('#eaedee')
TABLE_STRIPE  = colors.HexColor('#eff0f1')
HEADER_FILL   = colors.HexColor('#435862')
BORDER        = colors.HexColor('#abbec8')
ICON          = colors.HexColor('#3d7590')
ACCENT        = colors.HexColor('#27698a')
ACCENT_2      = colors.HexColor('#b94659')
TEXT_PRIMARY  = colors.HexColor('#202224')
TEXT_MUTED    = colors.HexColor('#747a7e')
SEM_SUCCESS   = colors.HexColor('#478e5e')
SEM_WARNING   = colors.HexColor('#96783c')

# ━━ Layout ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PAGE_W, PAGE_H = A4
LEFT_M, RIGHT_M = 22 * mm, 22 * mm
TOP_M, BOTTOM_M = 24 * mm, 22 * mm
AVAIL_W = PAGE_W - LEFT_M - RIGHT_M
AVAIL_H = PAGE_H - TOP_M - BOTTOM_M

# ━━ Styles ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BODY_FONT = 'FreeSerif'
BODY_BOLD = 'FreeSerif-Bold'
BODY_ITAL = 'FreeSerif-Italic'
MONO_FONT = 'SarasaMonoSC'

style_h1 = ParagraphStyle('H1', fontName=BODY_BOLD, fontSize=20, leading=26,
    textColor=HEADER_FILL, spaceBefore=18, spaceAfter=10, alignment=TA_LEFT)
style_h2 = ParagraphStyle('H2', fontName=BODY_BOLD, fontSize=14.5, leading=20,
    textColor=ACCENT, spaceBefore=14, spaceAfter=6, alignment=TA_LEFT)
style_h3 = ParagraphStyle('H3', fontName=BODY_BOLD, fontSize=12, leading=16,
    textColor=TEXT_PRIMARY, spaceBefore=10, spaceAfter=4, alignment=TA_LEFT)
style_body = ParagraphStyle('Body', fontName=BODY_FONT, fontSize=10.5, leading=16,
    textColor=TEXT_PRIMARY, spaceAfter=6, alignment=TA_JUSTIFY)
style_body_left = ParagraphStyle('BodyLeft', fontName=BODY_FONT, fontSize=10.5, leading=16,
    textColor=TEXT_PRIMARY, spaceAfter=6, alignment=TA_LEFT)
style_lead = ParagraphStyle('Lead', fontName=BODY_ITAL, fontSize=11.5, leading=17,
    textColor=TEXT_MUTED, spaceBefore=4, spaceAfter=10, alignment=TA_LEFT)
style_bullet = ParagraphStyle('Bullet', fontName=BODY_FONT, fontSize=10.5, leading=15,
    textColor=TEXT_PRIMARY, leftIndent=16, bulletIndent=4, spaceAfter=1, alignment=TA_LEFT)
style_caption = ParagraphStyle('Caption', fontName=BODY_ITAL, fontSize=9, leading=12,
    textColor=TEXT_MUTED, alignment=TA_CENTER, spaceBefore=4, spaceAfter=14)
style_th = ParagraphStyle('TblH', fontName=BODY_BOLD, fontSize=9.5, leading=12,
    textColor=colors.white, alignment=TA_CENTER)
style_td = ParagraphStyle('TblC', fontName=BODY_FONT, fontSize=9, leading=12,
    textColor=TEXT_PRIMARY, alignment=TA_LEFT)
style_td_b = ParagraphStyle('TblCB', fontName=BODY_BOLD, fontSize=9, leading=12,
    textColor=TEXT_PRIMARY, alignment=TA_LEFT)
style_code = ParagraphStyle('Code', fontName=MONO_FONT, fontSize=8.5, leading=12,
    textColor=TEXT_PRIMARY, alignment=TA_LEFT, backColor=CARD_BG,
    leftIndent=8, rightIndent=8, spaceBefore=4, spaceAfter=10)
style_callout_label = ParagraphStyle('CalloutLabel', fontName=BODY_FONT, fontSize=9,
    leading=12, textColor=TEXT_MUTED, alignment=TA_CENTER)
style_toc0 = ParagraphStyle('TOC0', fontName=BODY_BOLD, fontSize=11, leading=18,
    leftIndent=0, textColor=TEXT_PRIMARY)
style_toc1 = ParagraphStyle('TOC1', fontName=BODY_FONT, fontSize=10, leading=15,
    leftIndent=20, textColor=TEXT_MUTED)

# ━━ TOC Template ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
class TocDocTemplate(SimpleDocTemplate):
    def afterFlowable(self, flowable):
        if hasattr(flowable, 'bookmark_name'):
            level = getattr(flowable, 'bookmark_level', 0)
            text = getattr(flowable, 'bookmark_text', '')
            key = getattr(flowable, 'bookmark_key', '')
            self.notify('TOCEntry', (level, text, self.page, key))


def add_heading(text, style, level=0):
    key = 'h_' + hashlib.md5(text.encode()).hexdigest()[:8]
    p = Paragraph(f'<a name="{key}"/>{text}', style)
    p.bookmark_name = key
    p.bookmark_level = level
    p.bookmark_text = text
    p.bookmark_key = key
    return p


def chap(num, title, story):
    """H1 chapter with number."""
    story.append(CondPageBreak(AVAIL_H * 0.20))
    full = f"{num}. {title}"
    story.append(add_heading(full, style_h1, level=0))
    story.append(HRFlowable(width="35%", color=ACCENT, thickness=1.5,
                            spaceBefore=2, spaceAfter=14, hAlign='LEFT'))


def sec(title, story):
    """H2 section."""
    story.append(add_heading(title, style_h2, level=1))


def sub(title, story):
    """H3 subsection."""
    story.append(add_heading(title, style_h3, level=2))


def body(text, story, justify=True):
    style = style_body if justify else style_body_left
    story.append(Paragraph(text, style))


def lead(text, story):
    story.append(Paragraph(text, style_lead))


def bullets(items, story):
    flow = ListFlowable(
        [ListItem(Paragraph(item, style_bullet), leftIndent=16, value='•') for item in items],
        bulletType='bullet', start='•')
    story.append(flow)
    story.append(Spacer(1, 6))


def callouts(items, story):
    """items = [(value, label, color), ...]"""
    cells = []
    for v, l, c in items:
        val_style = ParagraphStyle('CBV', fontName=BODY_BOLD, fontSize=20, leading=24,
            textColor=c, alignment=TA_CENTER)
        cell = Table(
            [[Paragraph(f'<b>{v}</b>', val_style)],
             [Paragraph(l, style_callout_label)]],
            colWidths=[(AVAIL_W - 24) / len(items)])
        cell.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), CARD_BG),
            ('BOX', (0, 0), (-1, -1), 1, c),
            ('LINEBEFORE', (0, 0), (0, -1), 3, c),
            ('TOPPADDING', (0, 0), (-1, -1), 12),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE')]))
        cells.append(cell)
    row = Table([cells], colWidths=[(AVAIL_W - 24) / len(items)] * len(items), hAlign='CENTER')
    row.setStyle(TableStyle([
        ('LEFTPADDING', (0, 0), (-1, -1), 4),
        ('RIGHTPADDING', (0, 0), (-1, -1), 4)]))
    story.append(KeepTogether(row))
    story.append(Spacer(1, 14))


def tbl(headers, rows, ratios=None, story=None, cell_style=None):
    if ratios is None:
        ratios = [1.0 / len(headers)] * len(headers)
    col_widths = [r * AVAIL_W * 0.96 for r in ratios]
    c_style = cell_style or style_td
    data = [[Paragraph(f'<b>{h}</b>', style_th) for h in headers]]
    for row in rows:
        cells = []
        for c in row:
            if isinstance(c, Paragraph):
                cells.append(c)
            else:
                cells.append(Paragraph(str(c), c_style))
        data.append(cells)
    t = Table(data, colWidths=col_widths, hAlign='CENTER', repeatRows=1)
    style = [
        ('BACKGROUND', (0, 0), (-1, 0), HEADER_FILL),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('GRID', (0, 0), (-1, -1), 0.4, BORDER)]
    for i in range(1, len(data)):
        bg = colors.white if i % 2 == 1 else TABLE_STRIPE
        style.append(('BACKGROUND', (0, i), (-1, i), bg))
    t.setStyle(TableStyle(style))
    if story is not None:
        story.append(Spacer(1, 8))
        story.append(t)
        story.append(Spacer(1, 12))
    return t


def img(path, story, max_w=None, max_h=None, caption=None):
    if max_w is None: max_w = AVAIL_W * 0.95
    if max_h is None: max_h = AVAIL_H * 0.55
    pil = PILImage.open(path)
    ow, oh = pil.size
    rw = max_w / ow if ow > max_w else 1.0
    rh = max_h / oh if oh > max_h else 1.0
    r = min(rw, rh)
    story.append(Spacer(1, 8))
    story.append(Image(path, width=ow * r, height=oh * r, hAlign='CENTER'))
    if caption:
        story.append(Paragraph(caption, style_caption))


def code(text, story):
    safe = text.replace('<', '<').replace('>', '>')
    formatted = '<br/>'.join(safe.split('\n'))
    p = Paragraph(formatted, style_code)
    t = Table([[p]], colWidths=[AVAIL_W * 0.95], hAlign='CENTER')
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), CARD_BG),
        ('LINEBEFORE', (0, 0), (0, -1), 2, ACCENT),
        ('LEFTPADDING', (0, 0), (-1, -1), 10),
        ('RIGHTPADDING', (0, 0), (-1, -1), 10),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8)]))
    story.append(Spacer(1, 4))
    story.append(t)
    story.append(Spacer(1, 10))


def on_page(canv, doc):
    canv.saveState()
    canv.setFont(BODY_FONT, 8)
    canv.setFillColor(TEXT_MUTED)
    canv.drawString(LEFT_M, PAGE_H - 14 * mm,
                    'DataSphere RH Guinée — Cahier des charges SIRH premium')
    canv.setStrokeColor(BORDER)
    canv.setLineWidth(0.5)
    canv.line(LEFT_M, PAGE_H - 16 * mm, PAGE_W - RIGHT_M, PAGE_H - 16 * mm)
    canv.line(LEFT_M, 14 * mm, PAGE_W - RIGHT_M, 14 * mm)
    canv.setFont(BODY_FONT, 8)
    canv.setFillColor(TEXT_MUTED)
    canv.drawString(LEFT_M, 10 * mm, 'DataSphere RH Guinée · Conakry · 2026')
    canv.drawRightString(PAGE_W - RIGHT_M, 10 * mm, f'Page {canv.getPageNumber() + 1}')
    canv.restoreState()


# ━━ Story builder ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
def build_story():
    s = []

    # TOC
    toc = TableOfContents()
    toc.levelStyles = [style_toc0, style_toc1]
    s.append(Paragraph('<b>Table des matières</b>',
                       ParagraphStyle('TOCTitle', fontName=BODY_BOLD, fontSize=22,
                                      leading=28, textColor=HEADER_FILL, spaceAfter=20)))
    s.append(HRFlowable(width="100%", color=ACCENT, thickness=1.5, spaceAfter=18))
    s.append(toc)
    s.append(PageBreak())

    # ============== CHAPITRE 1 ==============
    chap('1', 'Résumé exécutif & Synthèse projet', s)
    lead("DataSphere RH Guinée est un SIRH premium SaaS multi-tenant conçu spécifiquement "
         "pour le marché guinéen, destiné aux PME, ONG, banques, cliniques, écoles, sociétés "
         "minières, BTP et administrations publiques. Le projet vise à combler l'absence d'une "
         "solution RH moderne, conforme au cadre réglementaire local (CNSS, RTS, versement "
         "forfaitaire), et accessible via un abonnement mensuel par employé.", s)

    body("<b>Vision.</b> Devenir d'ici 36 mois la plateforme RH de référence en Guinée, "
         "avec une cible de 150 entreprises clientes et plus de 15 000 employés gérés. "
         "DataSphere RH Guinée se positionne comme une alternative premium, locale et "
         "abordable aux solutions internationales (Sage, Cegid) qui restent inadaptées aux "
         "spécificités réglementaires guinéennes et au pouvoir d'achat des PME locales. "
         "La plateforme se distingue par sa capacité à gérer simultanément plusieurs sociétés "
         "filiales au sein d'un même tenant, à générer des bulletins de paie PDF conformes "
         "à la réglementation CNSS en vigueur, et à offrir une audit trail complet pour "
         "répondre aux exigences de conformité fiscale et sociale.", s)

    body("<b>Marché cible.</b> La Guinée compte environ 5 000 PME formelles, 200 ONG "
         "internationales, 15 banques et établissements financiers, 80 cliniques privées, "
         "300 écoles privées et 50 sociétés minières et BTP — soit un marché total addressable "
         "d'environ 6 000 organisations employant collectivement plus de 250 000 salariés. "
         "Le taux de pénétration cible sur 3 ans est de 2,5 %, soit 150 clients payants "
         "représentant un revenu annuel récurrent (ARR) d'environ 1,8 milliard GNF "
         "(environ 200 000 USD).", s)

    sec('1.1 Livrables du document', s)
    body("Ce document constitue le cahier des charges complet et la feuille de route "
         "technique et commerciale de DataSphere RH Guinée. Il est structuré en dix "
         "livrables principaux couvrant l'ensemble des dimensions du projet : "
         "fonctionnelles, techniques, réglementaires et business. Chaque livrable est "
         "conçu pour être autonome et utilisable par les différentes parties prenantes "
         "(équipe produit, équipe technique, direction, investisseurs, partenaires "
         "réglementaires). Les dix livrables attendus sont détaillés ci-dessous.", s)

    tbl(['#', 'Livrable', 'Contenu'], [
        ['1', 'Cahier des charges complet', 'Spécifications fonctionnelles exhaustives des 18 modules'],
        ['2', 'Modèle de données PostgreSQL', 'Schéma SQL DDL complet, 25+ tables, relations'],
        ['3', 'Architecture technique', 'Stack, diagramme multi-tenant, scaling, sécurité'],
        ['4', 'Règles métiers détaillées', 'CNSS, RTS, VF, congés, contrats, préavis'],
        ['5', 'Liste des écrans frontend', '60+ écrans classés par module et rôle'],
        ['6', 'API REST complète', '80+ endpoints, convention, auth, pagination'],
        ['7', 'Backlog MVP en sprints', '8 sprints de 2 semaines, user stories'],
        ['8', 'Prompts de génération', '10 prompts modulaires pour Cursor/Claude/Lovable'],
        ['9', 'Plan de commercialisation', 'Pricing, canaux, roadmap clients, concurrence'],
        ['10', 'Critères SaaS premium 9,5/10', '50 critères notés sur 5 dimensions'],
    ], ratios=[0.06, 0.32, 0.62], story=s)

    sec('1.2 Indicateurs clés de succès', s)
    body("Le succès de DataSphere RH Guinée sera mesuré sur cinq dimensions complémentaires : "
         "adoption marché, qualité produit, performance technique, conformité réglementaire, "
         "et viabilité économique. Les cibles ci-dessous sont calibrées sur un horizon de "
         "24 mois et serviront de tableau de bord trimestriel pour le comité de pilotage.", s)

    callouts([
        ('50', 'Clients an 1', ACCENT),
        ('1 500', 'Employés gérés', ACCENT_2),
        ('9.5/10', 'Score SaaS', SEM_SUCCESS),
        ('< 3%', 'Churn cible', SEM_WARNING),
    ], s)

    body("Au-delà de ces métriques quantitatives, trois indicateurs qualitatifs seront "
         "suivis avec une attention particulière : (1) le NPS (Net Promoter Score) auprès "
         "des administrateurs RH, cible supérieure ou égale à 50 ; (2) le taux de complétude "
         "des déclarations CNSS générées via la plateforme, cible 100 % ; et (3) le temps "
         "moyen de génération d'un cycle de paie mensuel, cible inférieure à 30 minutes "
         "pour 500 employés. Ces indicateurs seront consolidés dans un dashboard exécutif "
         "mensuel et présentés lors du comité de pilotage trimestriel.", s)

    # ============== CHAPITRE 2 ==============
    chap('2', 'Contexte guinéen & Cadre réglementaire', s)
    lead("La conception d'un SIRH premium pour la Guinée nécessite une compréhension "
         "approfondie du cadre réglementaire social et fiscal en vigueur. Ce chapitre "
         "synthétise les obligations légales que DataSphere RH Guinée doit couvrir de "
         "manière native et paramétrable.", s)

    sec('2.1 Code du travail et institutions guinéennes', s)
    body("Le Code du travail guinéen (Loi L/2014/072/AN du 10 janvier 2014, modifiée) "
         "régit les relations employeurs-salariés et définit les principales obligations "
         "sociales. Les institutions clés intervenant dans le périmètre RH sont : la "
         "Caisse Nationale de Sécurité Sociale (CNSS Guinée) qui collecte les cotisations "
         "sociales et verse les prestations (maladie, maternité, accidents du travail, "
         "vieillesse) ; la Direction Générale des Impôts (DGI) pour la retenue à la source "
         "de l'impôt sur le revenu (RTS) ; et l'Inspection du Travail qui contrôle la "
         "conformité aux dispositions légales. DataSphere RH Guinée intégrera nativement "
         "les taux, plafonds et règles de ces trois institutions, avec une couche de "
         "paramétrage permettant d'absorber les évolutions réglementaires sans nécessiter "
         "de mise à jour du code applicatif.", s)

    sec('2.2 Cotisations sociales — CNSS Guinée', s)
    body("La CNSS Guinée applique une répartition employeur/salarié dont les taux sont "
         "fixés par décret et susceptibles d'évolution. Le tableau ci-dessous présente "
         "les taux en vigueur à la date de rédaction, qui serviront de valeurs par défaut "
         "dans la configuration initiale de chaque tenant, modifiables par l'administrateur "
         "entreprise en cas de changement réglementaire.", s)

    tbl(['Cotisation', 'Taux', 'Plafond / assiette', 'Charge', 'Périodicité'], [
        ['CNSS — part salarié', '5%', 'Plafonnée à 8 × SMIG mensuel', 'Salarié', 'Mensuel'],
        ['CNSS — part employeur', '8%', 'Plafonnée à 8 × SMIG mensuel', 'Employeur', 'Mensuel'],
        ['RTS (Impôt sur salaire)', '1% à 5%', 'Barème progressif paramétrable', 'Salarié', 'Mensuel'],
        ['Versement forfaitaire', '4% à 6%', "Selon secteur d'activité", 'Employeur', 'Mensuel'],
        ["Taxe d'apprentissage", '1%', 'Formation professionnelle', 'Employeur', 'Annuel'],
        ['Taxe formation pro.', '3%', 'Développement des compétences', 'Employeur', 'Annuel'],
        ['Accident du travail', '1% à 5%', 'Selon risque professionnel', 'Employeur', 'Mensuel'],
        ['Assurance maladie', 'Variable', 'Selon mutuelle conventionnée', 'Salarié', 'Mensuel'],
    ], ratios=[0.22, 0.13, 0.30, 0.13, 0.22], story=s)

    body("Le SMIG (Salaire Minimum Interprofessionnel Garanti) en Guinée s'établit à "
         "environ 580 000 GNF mensuels en 2024, valeur qui sert d'assiette de référence "
         "pour le calcul du plafond CNSS (8 × SMIG = 4 640 000 GNF). DataSphere RH Guinée "
         "permettra de configurer ces paramètres au niveau du tenant, avec un mécanisme "
         "de versionning permettant de conserver l'historique des taux applicables pour "
         "chaque période de paie passée — garantissant ainsi la traçabilité exigée par "
         "l'inspection du travail et la CNSS.", s)

    sec('2.3 Types de contrats et congés', s)
    body("Le droit du travail guinéen reconnaît plusieurs types de contrats de travail "
         "que DataSphere RH Guinée gérera nativement : CDI (Contrat à Durée Indéterminée), "
         "CDD (Contrat à Durée Déterminée) avec motif obligatoire et durée maximale de "
         "24 mois renouvelables une fois, contrat de stage (limité à 6 mois, indemnité "
         "de stage spécifique), contrat de prestation (relation B2B, hors périmètre "
         "paie salarié), et contrat d'expatrié (avec exonérations et avantages spécifiques).", s)

    body("En matière de congés, le droit guinéen prévoit 30 jours calendaires de congés "
         "payés par an (soit 2,5 jours par mois travaillé), 14 semaines de congé de "
         "maternité (portées à 26 semaines en cas de complications ou de naissances "
         "multiples), 3 semaines de congé de paternité, et un congé maladie indemnisé "
         "par la CNSS après un délai de carence de 3 jours. La plateforme gérera "
         "l'ensemble de ces congés avec un workflow de validation multi-niveaux, le "
         "calcul automatique des soldes, et la génération des attestations de reprise.", s)

    sec('2.4 Devise et multi-devises', s)
    body("La devise officielle est le Franc Guinéen (GNF, code ISO 4217 : GNF). "
         "Cependant, certaines entreprises (notamment les ONG, les sociétés minières "
         "et les expatriés) paient tout ou partie de leurs salariés en devises étrangères "
         "(USD, EUR). DataSphere RH Guinée supportera nativement le multi-devises avec "
         "un taux de change configurable par période, une devise de référence (GNF) "
         "pour les déclarations réglementaires, et la possibilité d'éditer des bulletins "
         "de paie dans la devise du contrat. Les conversions seront tracées dans l'audit "
         "trail avec le taux applicable à la date de paie.", s)

    # ============== CHAPITRE 3 ==============
    chap('3', 'Cahier des charges fonctionnel complet', s)
    lead("Le périmètre fonctionnel de DataSphere RH Guinée est organisé en 18 modules "
         "regroupés en deux familles : 10 modules MVP (Minimum Viable Product) constituant "
         "le socle commercialisable, et 8 modules premium différenciateurs pour la "
         "monétisation additionnelle et la rétention client.", s)

    sec('3.1 Modules MVP (10 modules)', s)
    body("Les dix modules MVP constituent le cœur du produit et seront livrés sur "
         "un cycle de 16 semaines (8 sprints de 2 semaines). Chaque module est conçu "
         "pour être utilisable de manière autonome, mais leur valeur maximale réside "
         "dans leur intégration cohérente au sein d'un tenant unique. La priorisation "
         "MoSCoW (Must/Should/Could/Won't) indique le niveau d'obligation pour la "
         "première version commercialisable.", s)

    tbl(['#', 'Module', 'Priorité', 'Fonctionnalités clés'], [
        ['1', 'Authentification & rôles', 'Must', 'JWT+refresh, 2FA TOTP, 6 rôles RBAC, SSO entreprise'],
        ['2', 'Gestion entreprises clientes', 'Must', 'Multi-tenant, filiales, NIF/RC, configuration CNSS'],
        ['3', 'Gestion employés', 'Must', 'Fiche complète, matricule, photo, documents liés'],
        ['4', 'Contrats & documents RH', 'Must', 'CDI/CDD/stage/prestataire/expatrié, avenants, upload'],
        ['5', 'Congés & absences', 'Must', 'Workflow validation, soldes, calendrier, attestations'],
        ['6', 'Paie guinéenne paramétrable', 'Must', 'CNSS, RTS, VF, primes, HS, avantages en nature'],
        ['7', 'Bulletins PDF', 'Must', 'Génération vectorielle, signature, archivage MinIO'],
        ['8', 'Tableaux de bord RH', 'Should', 'KPIs temps réel, graphiques, filtres multi-dimensions'],
        ['9', 'Export Excel/PDF', 'Should', 'Exports paramétrables, modèles personnalisables'],
        ['10', "Journal d'audit", 'Must', 'Trail immuable, qui/quoi/quand, diff JSONB, export'],
    ], ratios=[0.05, 0.25, 0.10, 0.60], story=s)

    sec('3.2 Modules premium (8 modules)', s)
    body("Les huit modules premium constituent les leviers de monétisation additionnelle "
         "et de différenciation concurrentielle. Ils seront développés dans une seconde "
         "phase (post-MVP) et commercialisés sous forme d'add-ons optionnels ou intégrés "
         "aux offres Business et Enterprise. Chaque module premium répond à un besoin "
         "spécifique identifié sur le marché guinéen et justifie un surcoût de l'abonnement.", s)

    tbl(['#', 'Module premium', 'Fonctionnalités clés'], [
        ['11', 'Recrutement & onboarding', 'Pipeline candidats, offres, entretiens, e-signature contrats'],
        ['12', 'Portail employé', 'Self-service : congés, bulletins, documents, profil'],
        ['13', 'Signature électronique interne', 'Signature PDF horodatée, trace cryptographique'],
        ['14', 'Coffre-fort RH', 'Archivage chiffré, classification, rétention légale'],
        ['15', 'Notifications WhatsApp/SMS/email', 'Templates multilingues, déclencheurs, opt-in'],
        ['16', 'Application mobile employé', 'iOS + Android, mode hors-ligne, push notifications'],
        ['17', 'IA RH (contrats, lettres, attestations)', 'Génération LLM, prompts métier, garde-fous'],
        ['18', 'Reporting direction générale', 'Dashboards exécutifs, exports Board, benchmarking'],
    ], ratios=[0.06, 0.30, 0.64], story=s)

    sec('3.3 Rôles et matrice de permissions', s)
    body("Six rôles standards sont définis dans le système, configurables par l'administrateur "
         "entreprise selon l'organigramme. Chaque rôle dispose d'un ensemble de permissions "
         "par module (lecture, écriture, validation, suppression, export) géré via un système "
         "RBAC (Role-Based Access Control) granulaire. La matrice complète est consultable "
         "et modifiable par le Super Admin et l'Admin Entreprise.", s)

    tbl(['Rôle', 'Périmètre', 'Permissions principales'], [
        ['Super Admin', 'Gestion plateforme, tous tenants, support', 'Tous droits, audit, configuration globale'],
        ['Admin Entreprise', 'Configuration tenant, utilisateurs, paramètres', 'Tous droits sur son tenant, pas de cross-tenant'],
        ['RH', 'Gestion employés, contrats, paie, congés', 'Lecture/écriture RH, pas de config système'],
        ['Manager', 'Validation congés, équipe, évaluations', 'Lecture équipe, validation congés, lecture paie'],
        ['Comptable', 'Paie, déclarations, exports', 'Lecture/écriture paie, lecture employés, exports'],
        ['Employé', 'Portail self-service', 'Lecture propre profil, demande congés, lecture bulletins'],
    ], ratios=[0.18, 0.35, 0.47], story=s)

    body("La matrice RACI complète ci-dessous formalise les responsabilités de chaque "
         "rôle sur les processus métiers critiques. Cette matrice sert de référence "
         "pour la configuration initiale des permissions et sera personnalisable par "
         "chaque tenant selon son organigramme spécifique. Les lettres R/A/C/I "
         "désignent respectivement Responsable, Approbateur, Consulté et Informé.", s)

    img('/home/z/my-project/scripts/diagrams_png/raci_matrix.png', s,
        max_w=AVAIL_W * 0.98, max_h=AVAIL_H * 0.60,
        caption='Figure 1 — Matrice RACI des rôles SIRH DataSphere RH Guinée')

    # ============== CHAPITRE 4 ==============
    chap('4', 'Architecture technique', s)
    lead("L'architecture de DataSphere RH Guinée est conçue pour répondre à quatre "
         "exigences structurantes : multi-tenance stricte (isolation des données entre "
         "entreprises clientes), scalabilité horizontale (croissance jusqu'à 150+ clients "
         "sans réécriture), sécurité de niveau bancaire (chiffrement, audit, RBAC), et "
         "évolutivité réglementaire (paramétrage sans code des taux et plafonds).", s)

    sec("4.1 Vue d'ensemble de la stack", s)
    body("La stack technologique retenue privilégie la maturité, la documentation "
         "abondante, la communauté active et la compatibilité avec les compétences "
         "disponibles sur le marché guinéen et ouest-africain. Le choix de Next.js "
         "pour le frontend, NestJS pour le backend et PostgreSQL pour la persistance "
         "garantit une courbe d'apprentissage raisonnable et une maintenance long terme "
         "maîtrisée. L'ensemble est conteneurisé via Docker pour faciliter le déploiement "
         "tant en local (Docker Compose) qu'en production (Kubernetes managé).", s)

    tbl(['Couche', 'Technologie', 'Rôle / contraintes'], [
        ['Frontend Web', 'Next.js 14 + React 18 + TypeScript 5', 'App Router, Server Components, i18n FR/EN'],
        ['Frontend Mobile', 'React Native (Expo)', 'iOS + Android, mode offline, push notifications'],
        ['UI / Design', 'Tailwind CSS 3 + shadcn/ui + Radix', 'Composants accessibles WCAG 2.1 AA'],
        ['Backend API', 'NestJS 10 + TypeScript', 'Architecture modulaire, DI, decorators'],
        ['ORM', 'Prisma 5', 'Type-safe, migrations versionnées, multi-schema'],
        ['Base de données', 'PostgreSQL 16', 'Multi-tenant schema-per-tenant, réplication'],
        ['Cache / Files', 'Redis 7', 'Sessions, cache, BullMQ workers'],
        ['Stockage documents', 'MinIO (S3-compatible)', 'Chiffrement serveur, lifecycle, presigned URLs'],
        ['Auth', 'JWT + refresh + 2FA TOTP', 'Rotation tokens, blacklist Redis'],
        ['Notifications', 'Twilio (WhatsApp/SMS) + SendGrid (email)', 'Templates, opt-in, retries'],
        ['Observabilité', 'Sentry + Grafana + Prometheus + Loki', 'Logs, métriques, traces, alerting'],
        ['CI/CD', 'GitHub Actions + Docker + Helm', 'Tests, build, déploiement Kubernetes'],
        ['Hébergement cible', 'AWS Afrique du Sud (af-south-1) ou OVHcloud', 'Latence < 80ms depuis Conakry'],
    ], ratios=[0.18, 0.32, 0.50], story=s)

    sec("4.2 Diagramme d'architecture multi-tenant", s)
    body("L'architecture repose sur une séparation nette entre la couche de présentation "
         "(Next.js frontend + React Native mobile), la couche d'API Gateway (Cloudflare "
         "+ Nginx avec WAF intégré), les microservices métiers (Auth, Core RH, Paie, Audit) "
         "et la couche de persistance (PostgreSQL multi-tenant + Redis cache + MinIO documents). "
         "Cette séparation permet une scalabilité indépendante de chaque service selon la charge, "
         "tout en maintenant une cohérence fonctionnelle via des contrats d'API stricts.", s)

    img('/home/z/my-project/scripts/diagrams_png/architecture.png', s,
        max_w=AVAIL_W * 0.98, max_h=AVAIL_H * 0.65,
        caption='Figure 2 — Architecture technique multi-tenant DataSphere RH Guinée')

    sec('4.3 Stratégie multi-tenant', s)
    body("Le modèle multi-tenant retenu est le <b>schema-per-tenant</b> dans PostgreSQL : "
         "chaque entreprise cliente dispose de son propre schéma de base de données, "
         "totalement isolé des autres tenants. Cette approche offre un excellent compromis "
         "entre isolation des données (sécurité, conformité RGPD-like, facilité de "
         "réversibilité) et coûts d'infrastructure (un seul cluster PostgreSQL pour "
         "tous les tenants). Une table <font name='SarasaMonoSC'>tenants</font> dans un schéma public commun "
         "recense tous les tenants et leurs métadonnées (plan, statut, configuration CNSS).", s)

    body("Au niveau applicatif, un middleware NestJS identifie le tenant à chaque "
         "requête via (1) le sous-domaine (acme.datasphererh.gn), (2) un header "
         "HTTP <font name='SarasaMonoSC'>X-Tenant-ID</font>, ou (3) le claim JWT <font name='SarasaMonoSC'>tenant_id</font>. "
         "Le middleware positionne dynamiquement la connexion Prisma sur le schéma "
         "correspondant, garantissant qu'aucune donnée cross-tenant ne puisse fuiter. "
         "Un test automatisé vérifie cette isolation à chaque déploiement (test "
         "d'intrusion cross-tenant doit échouer).", s)

    code("""-- Schéma public commun
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    plan VARCHAR(50) NOT NULL DEFAULT 'starter',
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'
);

-- Pour chaque nouveau tenant, créer un schéma dédié
CREATE SCHEMA tenant_acme;
-- Toutes les tables du tenant sont créées dans ce schéma
CREATE TABLE tenant_acme.companies (...);
CREATE TABLE tenant_acme.employees (...);""", s)

    sec('4.4 Sécurité et conformité', s)
    body("La sécurité est traitée comme une exigence transverse à toutes les couches "
         "de la stack. Au niveau transport, TLS 1.3 obligatoire avec HSTS et certificats "
         "Let's Encrypt renouvelés automatiquement. Au niveau authentification, JWT "
         "(15 min de durée de vie) + refresh token (7 jours, rotation à chaque usage, "
         "blacklist Redis en cas de révocation) + 2FA TOTP optionnel mais obligatoire "
         "pour les rôles Admin et Super Admin. Au niveau données, chiffrement at-rest "
         "AES-256 sur PostgreSQL (via pgcrypto pour les colonnes sensibles) et sur "
         "MinIO (SSE-S3), chiffrement in-transit systématique.", s)

    body("L'audit trail immuable journalise chaque action utilisateur avec horodatage "
         "UTC, adresse IP, user-agent, identité (user_id + tenant_id), entité concernée "
         "(type + ID) et diff JSONB avant/après. Les logs sont stockés dans une table "
         "PostgreSQL dédiée par tenant, append-only (pas de UPDATE ni DELETE au niveau "
         "application), avec rétention légale de 10 ans. Un export horodaté et signé "
         "est disponible pour les audits de conformité (CNSS, inspection du travail, "
         "commissaires aux comptes).", s)

    body("La conformité au RGPD européen est assurée pour les filiales d'ONG et "
         "d'entreprises internationales : droit à l'oubli (anonymisation réversible "
         "via mapping séparé), portabilité des données (export JSON complet en un clic), "
         "registre des traitements automatiquement généré, et consentement explicite "
         "pour les notifications WhatsApp/SMS.", s)

    # ============== CHAPITRE 5 ==============
    chap('5', 'Modèle de données PostgreSQL', s)
    lead("Le modèle de données de DataSphere RH Guinée comprend 25+ tables principales "
         "organisées par domaine fonctionnel (identité, RH, paie, documents, audit). "
         "Toutes les tables portent un champ tenant_id (UUID) et sont créées dans le "
         "schéma dédié au tenant, garantissant l'isolation.", s)

    sec('5.1 Diagramme entité-relation', s)
    body("Le diagramme ci-dessous présente les entités principales et leurs relations. "
         "Pour des raisons de lisibilité, seules les 12 entités cardinales sont "
         "représentées ; le schéma complet comprend également les tables de référence "
         "(postes, services, grades, types de congés), les tables de jonction "
         "(user_roles, employee_documents) et les tables d'historique (contract_history, "
         "payslip_history).", s)

    img('/home/z/my-project/scripts/diagrams_png/er_model.png', s,
        max_w=AVAIL_W * 0.98, max_h=AVAIL_H * 0.65,
        caption='Figure 3 — Modèle entité-relation des 12 entités principales')

    sec('5.2 Schéma SQL DDL — entités principales', s)
    body("Le script SQL ci-dessous présente la définition des tables principales du "
         "schéma tenant. Les index recommandés, contraintes d'intégrité et triggers "
         "d'audit sont inclus. L'ensemble est géré via migrations Prisma versionnées, "
         "permettant un rollback propre en cas d'incident.", s)

    code("""-- ============================================================
-- Schéma: tenant_{slug}  (créé dynamiquement à l'onboarding)
-- ============================================================

CREATE TABLE tenant_{slug}.companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id),
    raison_sociale VARCHAR(255) NOT NULL,
    sigle VARCHAR(50),
    nif VARCHAR(50) UNIQUE,
    rc VARCHAR(50) UNIQUE,
    cnss_numero VARCHAR(50) UNIQUE,
    adresse TEXT,
    ville VARCHAR(100),
    telephone VARCHAR(30),
    email VARCHAR(255),
    devise_principale CHAR(3) DEFAULT 'GNF',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE tenant_{slug}.employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    company_id UUID NOT NULL REFERENCES tenant_{slug}.companies(id),
    matricule VARCHAR(50) NOT NULL,
    nom VARCHAR(100) NOT NULL,
    prenoms VARCHAR(200) NOT NULL,
    date_naissance DATE,
    lieu_naissance VARCHAR(150),
    nationalite CHAR(2) DEFAULT 'GN',
    cnss_numero VARCHAR(50) UNIQUE,
    nir VARCHAR(50),
    sexe CHAR(1) CHECK (sexe IN ('M','F')),
    situation_familiale VARCHAR(30),
    nombre_enfants INT DEFAULT 0,
    adresse TEXT,
    telephone VARCHAR(30),
    email VARCHAR(255),
    photo_url TEXT,
    date_embauche DATE NOT NULL,
    date_sortie DATE,
    motif_sortie VARCHAR(100),
    statut VARCHAR(20) DEFAULT 'actif',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, matricule),
    UNIQUE(tenant_id, cnss_numero)
);
CREATE INDEX idx_employees_company ON tenant_{slug}.employees(company_id);
CREATE INDEX idx_employees_statut ON tenant_{slug}.employees(statut);""", s)

    code("""CREATE TABLE tenant_{slug}.contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES tenant_{slug}.employees(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN
        ('CDI','CDD','STAGE','PRESTATAIRE','EXPATRIE','APPRENTI')),
    date_debut DATE NOT NULL,
    date_fin DATE,
    poste VARCHAR(150) NOT NULL,
    service_id UUID,
    salaire_base DECIMAL(14,2) NOT NULL,
    devise CHAR(3) DEFAULT 'GNF',
    periodicite VARCHAR(20) DEFAULT 'MENSUEL',
    motif_cdd TEXT,
    preavis_jours INT DEFAULT 30,
    clauses JSONB DEFAULT '{}',
    avenant_parent UUID REFERENCES tenant_{slug}.contracts(id),
    status VARCHAR(20) DEFAULT 'ACTIF',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_contracts_employee ON tenant_{slug}.contracts(employee_id);
CREATE INDEX idx_contracts_type ON tenant_{slug}.contracts(type);

CREATE TABLE tenant_{slug}.cnss_params (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    taux_cnss_salarie DECIMAL(5,4) DEFAULT 0.0500,
    taux_cnss_employeur DECIMAL(5,4) DEFAULT 0.0800,
    plafond_cnss DECIMAL(14,2) DEFAULT 4640000,
    smig DECIMAL(14,2) DEFAULT 580000,
    taux_rts DECIMAL(5,4) DEFAULT 0.0100,
    taux_versement_forfaitaire DECIMAL(5,4) DEFAULT 0.0400,
    taux_taxe_apprentissage DECIMAL(5,4) DEFAULT 0.0100,
    taux_formation_pro DECIMAL(5,4) DEFAULT 0.0300,
    periodicite VARCHAR(20) DEFAULT 'MENSUEL',
    date_effet DATE NOT NULL,
    date_fin DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE tenant_{slug}.payroll_periods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    mois INT NOT NULL CHECK (mois BETWEEN 1 AND 12),
    annee INT NOT NULL,
    libelle VARCHAR(100),
    date_debut DATE NOT NULL,
    date_fin DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'OUVERTE',
    locked_at TIMESTAMPTZ,
    locked_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, mois, annee)
);""", s)

    code("""CREATE TABLE tenant_{slug}.payslips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    employee_id UUID NOT NULL REFERENCES tenant_{slug}.employees(id),
    period_id UUID NOT NULL REFERENCES tenant_{slug}.payroll_periods(id),
    contract_id UUID NOT NULL REFERENCES tenant_{slug}.contracts(id),
    salaire_base DECIMAL(14,2) NOT NULL,
    primes JSONB DEFAULT '[]',
    heures_supplementaires JSONB DEFAULT '[]',
    avantages_nature JSONB DEFAULT '[]',
    salaire_brut DECIMAL(14,2) NOT NULL,
    salaire_brut_imposable DECIMAL(14,2) NOT NULL,
    cnss_salarie DECIMAL(14,2) NOT NULL,
    cnss_employeur DECIMAL(14,2) NOT NULL,
    rts DECIMAL(14,2) NOT NULL,
    versement_forfaitaire DECIMAL(14,2) NOT NULL,
    taxe_apprentissage DECIMAL(14,2) NOT NULL,
    formation_pro DECIMAL(14,2) NOT NULL,
    retenues_diverses JSONB DEFAULT '[]',
    net_a_payer DECIMAL(14,2) NOT NULL,
    pdf_key TEXT,
    pdf_generated_at TIMESTAMPTZ,
    signature_hash VARCHAR(64),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, employee_id, period_id)
);
CREATE INDEX idx_payslips_period ON tenant_{slug}.payslips(period_id);

CREATE TABLE tenant_{slug}.audit_logs (
    id BIGSERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL,
    user_id UUID,
    action VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID,
    diff JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_audit_tenant_date ON tenant_{slug}.audit_logs(tenant_id, created_at DESC);
CREATE INDEX idx_audit_entity ON tenant_{slug}.audit_logs(entity_type, entity_id);

-- Trigger d'audit automatique sur UPDATE/DELETE
CREATE OR REPLACE FUNCTION tenant_{slug}.audit_trigger_fn()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO tenant_{slug}.audit_logs
        (tenant_id, user_id, action, entity_type, entity_id, diff)
    VALUES (current_setting('app.tenant_id', true)::uuid,
            current_setting('app.user_id', true)::uuid,
            TG_OP, TG_TABLE_NAME, COALESCE(NEW.id, OLD.id),
            jsonb_build_object('before', to_jsonb(OLD), 'after', to_jsonb(NEW)));
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;""", s)

    sec('5.3 Index recommandés et optimisations', s)
    body("Pour supporter la montée en charge (cible : 150 tenants × 100 employés "
         "moyenne = 15 000 employés, 180 000 bulletins/an), les index suivants sont "
         "obligatoires. De plus, une stratégie de partitionnement par année des tables "
         "payslips et audit_logs sera mise en place dès la deuxième année pour "
         "maintenir des performances constantes.", s)

    bullets([
        "Index composites sur (tenant_id, statut, date_embauche) pour les recherches d'employés filtrées",
        "Index GIN sur les colonnes JSONB primes, retenues_diverses pour les requêtes sur critères",
        "Index partiel WHERE date_fin IS NULL sur contracts pour récupérer les contrats actifs",
        "Partitionnement RANGE par created_at sur payslips et audit_logs (partition mensuelle)",
        "Materialized view mv_employee_summary refreshée nightly pour les dashboards",
        "VACUUM ANALYZE automatique via pg_cron hebdomadaire",
    ], s)

    # ============== CHAPITRE 6 ==============
    chap('6', 'Règles métiers détaillées — Paie guinéenne', s)
    lead("Le moteur de paie de DataSphere RH Guinée implémente l'ensemble des règles "
         "réglementaires guinéennes (CNSS, RTS, versement forfaitaire, taxes employeur) "
         "avec une couche de paramétrage par tenant permettant d'absorber les évolutions "
         "réglementaires sans modification du code applicatif.", s)

    sec('6.1 Workflow de calcul de paie', s)
    body("Le calcul d'un bulletin de paie suit un processus en huit étapes strictement "
         "séquencées. Chaque étape produit un résultat intermédiaire tracé dans la table "
         "payslips (colonnes dédiées ou JSONB), permettant une auditabilité fine et un "
         "re-calcul ultérieur en cas de modification rétroactive d'un paramètre. Le "
         "workflow est conçu pour être idempotent : un même calcul exécuté deux fois "
         "avec les mêmes entrées produit strictement le même résultat (principe "
         "essentiel pour la conformité réglementaire).", s)

    img('/home/z/my-project/scripts/diagrams_png/workflow_paie.png', s,
        max_w=AVAIL_W * 0.98, max_h=AVAIL_H * 0.85,
        caption='Figure 4 — Workflow de calcul de paie guinéenne (8 étapes)')

    sec('6.2 Formules de calcul détaillées', s)
    body("Chaque formule de calcul est implémentée comme une fonction TypeScript pure "
         "dans le service Paie, testée unitairement avec un jeu de données de référence "
         "couvrant les cas nominaux et les cas limites (plafond CNSS atteint, salaire "
         "inférieur au SMIG, heures supplémentaires multi-majorations, etc.). Les "
         "formules sont documentées ci-dessous dans leur forme mathématique, prêtes "
         "à être implémentées et auditées par un commissaire aux comptes.", s)

    sub('6.2.1 Salaire brut et brut imposable', s)
    code("""BRUT = SALAIRE_BASE
        + SOMME(primes.imposable)
        + SOMME(heures_supp.montant_majoré)
        + SOMME(avantages_nature.valeur)
        - SOMME(absences_non_payées)

BRUT_IMPOSABLE = BRUT - SOMME(indemnités_exonérées)
// Indemnités exonérées : indemnités de transport, indemnités de représentation
// dans la limite fixée par arrêté ministériel""", s)

    sub('6.2.2 Cotisations CNSS', s)
    code("""// Plafond CNSS = 8 × SMIG mensuel
PLAFOND_CNSS = 8 × smig  // ex: 8 × 580 000 = 4 640 000 GNF

ASSIETTE_CNSS = MIN(BRUT_IMPOSABLE, PLAFOND_CNSS)

CNSS_SALARIE  = ASSIETTE_CNSS × taux_cnss_salarie    // 5% par défaut
CNSS_EMPLOYEUR = ASSIETTE_CNSS × taux_cnss_employeur  // 8% par défaut

// Au-delà du plafond, aucune cotisation n'est due""", s)

    sub("6.2.3 RTS (Retenue à la source de l'impôt sur salaire)", s)
    code("""RTS = BRUT_IMPOSABLE × taux_rts
// taux_rts paramétrable par tenant (1% par défaut)
// Pour les expatriés non-résidents, barème progressif spécifique""", s)

    sub('6.2.4 Charges patronales (versement forfaitaire et taxes)', s)
    code("""VERSEMENT_FORFAITAIRE = BRUT_IMPOSABLE × taux_vf        // 4% par défaut
TAXE_APPRENTISSAGE    = BRUT_IMPOSABLE × taux_apprentissage // 1% par défaut
FORMATION_PRO         = BRUT_IMPOSABLE × taux_formation_pro // 3% par défaut

TOTAL_CHARGES_PATRONALES = CNSS_EMPLOYEUR
                          + VERSEMENT_FORFAITAIRE
                          + TAXE_APPRENTISSAGE
                          + FORMATION_PRO
                          + ACCIDENT_TRAVAIL   // 1% à 5% selon risque

COUT_TOTAL_EMPLOYEUR = BRUT + TOTAL_CHARGES_PATRONALES""", s)

    sub('6.2.5 Net à payer', s)
    code("""NET_A_PAYER = BRUT_IMPOSABLE
              - CNSS_SALARIE
              - RTS
              - SOMME(avances_sur_salaires)
              - SOMME(retenues_diverses)
              + SOMME(indemnités_non_imposables)  // transport, repas""", s)

    sec('6.3 Heures supplémentaires — majorations', s)
    body("Les heures supplémentaires sont majorées selon le jour et l'horaire d'exécution. "
         "Le barème ci-dessous sert de configuration par défaut, modifiable par tenant "
         "selon les conventions collectives applicables. Le cumul des majorations est "
         "autorisé (par exemple une heure supplémentaire de nuit le dimanche bénéficie "
         "d'une majoration combinée de 125 % du taux horaire de base).", s)

    tbl(["Type d'heures supplémentaires", 'Majoration', 'Condition'], [
        ['Heures supplémentaires en semaine (8 premières)', '25%', 'Au-delà de 40h/semaine'],
        ['Heures supplémentaires en semaine (au-delà de 8)', '50%', 'Heures 9 à 12'],
        ['Heures supplémentaires de nuit (22h-6h)', '50%', 'Majoration cumulative'],
        ['Heures supplémentaires le dimanche', '75%', 'Pourcentage du taux horaire de base'],
        ['Heures supplémentaires jour férié légal', '100%', 'Doublement du taux horaire'],
    ], ratios=[0.50, 0.18, 0.32], story=s)

    sec('6.4 Exemple chiffré complet', s)
    body("Pour illustrer le moteur de paie, voici un exemple complet pour un employé "
         "cadre en CDI, salaire de base 3 000 000 GNF, avec 5 heures supplémentaires "
         "en semaine (taux horaire = 3 000 000 / 173,33 = 17 308 GNF), prime de "
         "rendement 200 000 GNF, indemnité de transport 100 000 GNF (non imposable), "
         "avantage en nature logement 300 000 GNF. L'exemple montre le déroulé complet "
         "des huit étapes du workflow avec les montants intermédiaires et le résultat "
         "final du net à payer ainsi que le coût total employeur.", s)

    tbl(['Rubrique', 'Montant (GNF)', 'Détail'], [
        ['Salaire de base', '3 000 000', '—'],
        ['Heures supp. (5 × 17 308 × 1,25)', '108 175', '5 HS × taux × 1,25'],
        ['Prime de rendement', '200 000', 'Imposable'],
        ['Avantage en nature (logement)', '300 000', 'Imposable'],
        ['Indemnité transport (non imposable)', '100 000', 'Exonérée'],
        ['<b>Salaire brut</b>', '<b>3 708 175</b>', '<b>—</b>'],
        ['Salaire brut imposable', '3 608 175', 'Brut - 100 000 (transport)'],
        ['CNSS salarié (5%)', '180 409', '5% de 3 608 175 (sous plafond)'],
        ['CNSS employeur (8%)', '288 654', '8% de 3 608 175'],
        ['RTS (1%)', '36 082', '1% de 3 608 175'],
        ['Versement forfaitaire (4%)', '144 327', '4% de 3 608 175 (employeur)'],
        ['Taxe apprentissage (1%)', '36 082', '1% (employeur)'],
        ['Formation pro (3%)', '108 245', '3% (employeur)'],
        ['<b>Net à payer</b>', '<b>3 391 684</b>', '<b>Brut imp. - CNSS - RTS</b>'],
        ['Coût total employeur', '4 185 883', 'Brut + charges patronales'],
    ], ratios=[0.38, 0.22, 0.40], story=s, cell_style=style_td_b)

    # ============== CHAPITRE 7 ==============
    chap('7', 'Règles métiers — Congés, absences, contrats', s)
    lead("Au-delà de la paie, DataSphere RH Guinée gère l'ensemble du cycle de vie "
         "RH de l'employé : contrats, congés, absences, maladie, maternité, et "
         "documents administratifs associés.", s)

    sec('7.1 Types de congés et droits', s)
    body("Le droit guinéen prévoit plusieurs types de congés avec des règles spécifiques "
         "en termes d'acquisition, de prise, d'indemnisation et de report. La plateforme "
         "gérera nativement ces congés avec calcul automatique des soldes, workflow de "
         "validation multi-niveaux, et génération des attestations nécessaires. Chaque "
         "type de congé dispose d'un compteur de solde indépendant, mis à jour en temps "
         "réel selon les acquisitions (mensuelles pour les congés payés, par événement "
         "pour les congés spéciaux) et les consommations.", s)

    tbl(['Type de congé', 'Durée légale', 'Acquisition', 'Reportable', 'Précisions'], [
        ['Congés payés annuels', '30 jours calendaires/an', '2,5 j/mois', 'Oui', 'Sur 12 mois'],
        ['Congé maladie (CNSS)', 'Selon durée (max 26 sem)', 'Indemnisé CNSS', 'Oui', 'Carence 3 jours'],
        ['Congé maternité', '14 semaines', '100% du salaire', 'Non', '6 sem avant / 8 sem après'],
        ['Maternité multiple', '26 semaines', '100% du salaire', 'Non', 'Grossesse multiple / complications'],
        ['Congé paternité', '3 semaines', '100% du salaire', 'Non', 'Continu, dans les 3 mois'],
        ['Congé mariage', '3 jours', 'Payé', 'Oui', "Mariage de l'employé"],
        ['Congé décès proche', '3 jours', 'Payé', 'Oui', 'Conjoint, enfant, parent'],
        ['Congé circonstance', '1 à 3 jours', 'Payé', 'Oui', 'Baptême, communion, etc.'],
        ['Congé sans solde', 'Négocié', 'Non payé', 'Non', 'Accord employeur requis'],
    ], ratios=[0.20, 0.18, 0.18, 0.12, 0.32], story=s)

    sec('7.2 Workflow de validation des congés', s)
    body("Le workflow de validation des congés est configurable par tenant et par type "
         "de congé. Le workflow par défaut comprend trois niveaux : (1) soumission par "
         "l'employé via le portail self-service ou par le RH, (2) validation par le "
         "manager direct, (3) validation finale par le RH pour vérification du solde "
         "et génération de l'attestation. Les notifications sont envoyées à chaque "
         "étape via les canaux configurés (email, WhatsApp, SMS).", s)

    body("En cas de refus, l'employé est notifié avec motif obligatoire et peut soumettre "
         "une demande modifiée. Les congés maladie et maternité échappent au workflow "
         "standard : ils sont saisis directement par le RH sur présentation d'un certificat "
         "médical, et déclenchent automatiquement la déclaration CNSS correspondante. "
         "Le solde de congés est mis à jour en temps réel et consultable par l'employé "
         "à tout moment sur son portail. Le calendrier d'équipe permet au manager "
         "d'anticiper les absences et d'arbitrer les conflits de planning.", s)

    sec('7.3 Types de contrats et gestion', s)
    body("Chaque type de contrat a des règles spécifiques en termes de durée maximale, "
         "préavis, indemnité de fin de contrat, et obligations déclaratives. La plateforme "
         "gérera automatiquement ces spécificités avec des alertes proactive (fin de CDD "
         "approchant, fin de période d'essai, renouvellement d'avenant à prévoir). Ces "
         "alertes sont envoyées au RH et au manager 30 jours avant l'échéance, permettant "
         "une gestion préventive plutôt que curative des fins de contrat.", s)

    tbl(['Type contrat', 'Durée', 'Préavis', 'Indemnités de fin'], [
        ['CDI', 'Indéterminée', '30 à 90 jours selon ancienneté', 'Indemnité licenciement'],
        ['CDD', '24 mois max (renouvel. 1×)', 'Selon clause contractuelle', 'Indemnité de précarité 6%'],
        ['Stage', '6 mois max', 'Sans préavis', 'Indemnité de stage (min 60% SMIG)'],
        ['Prestataire', 'Selon contrat commercial', 'Selon clause', 'Hors paie salarié (facture)'],
        ['Expatrié', 'Selon contrat + titre de séjour', 'Selon clause', 'Avantages spécifiques'],
        ['Apprentissage', '1 à 2 ans', 'Sans préavis', 'Indemnité progressive (50-70% SMIC)'],
    ], ratios=[0.18, 0.27, 0.25, 0.30], story=s)

    sec('7.4 Indemnités de licenciement et départ', s)
    body("Le calcul des indemnités de fin de contrat suit les dispositions du Code du "
         "travail guinéen et des conventions collectives sectorielles. La plateforme "
         "automatisera ces calculs avec un simulateur permettant à l'employeur d'évaluer "
         "le coût d'un départ avant décision. Les indemnités sont générées dans un "
         "document de solde de tout compte PDF, signé électroniquement par les deux "
         "parties et archivé dans le coffre-fort RH.", s)

    body("Le barème par défaut pour les indemnités de licenciement (hors faute lourde) "
         "est : 1/4 de mois par année d'ancienneté pour les 5 premières années, 1/3 de "
         "mois par année au-delà, avec un minimum légal de 1 mois de salaire. Les "
         "indemnités de fin de CDD (précarité) sont de 6% du salaire brut total versé "
         "sur la durée du contrat. Ces taux sont paramétrables par tenant pour absorber "
         "les évolutions réglementaires et les conventions collectives spécifiques.", s)

    # ============== CHAPITRE 8 ==============
    chap('8', 'Liste détaillée des écrans frontend', s)
    lead("L'interface de DataSphere RH Guinée comprend 60+ écrans répartis par module "
         "et par rôle utilisateur. Chaque écran est conçu selon les principes du design "
         "système shadcn/ui avec une grille responsive 12 colonnes, un mode sombre "
         "optionnel, et une conformité WCAG 2.1 AA.", s)

    sec('8.1 Module Authentification & rôles', s)
    tbl(['Route', 'Écran', 'Rôle', 'Description'], [
        ['/login', 'Connexion', 'Tous', 'Email + password + 2FA'],
        ['/login/2fa', 'Vérification 2FA', 'Tous', 'Code TOTP 6 chiffres'],
        ['/password/reset', 'Mot de passe oublié', 'Tous', 'Email reset token'],
        ['/password/change', 'Changer mot de passe', 'Tous connectés', 'Rotation 90 jours'],
        ['/register', 'Création compte admin', 'Super Admin', 'Onboarding premier tenant'],
        ['/mfa/setup', 'Configuration 2FA', 'Admin/RH', 'QR code + codes de secours'],
        ['/logout', 'Déconnexion', 'Tous', 'Révocation refresh tokens'],
    ], ratios=[0.25, 0.22, 0.18, 0.35], story=s)

    sec('8.2 Module Gestion entreprises & multi-tenant', s)
    tbl(['Route', 'Écran', 'Rôle', 'Description'], [
        ['/admin/tenants', 'Liste tenants', 'Super Admin', 'Pagination, filtres, stats'],
        ['/admin/tenants/new', 'Création tenant', 'Super Admin', 'Wizard 4 étapes'],
        ['/admin/tenants/:id', 'Fiche tenant', 'Super Admin', 'Métriques, facturation'],
        ['/admin/tenants/:id/edit', 'Édition tenant', 'Super Admin', 'Plan, statut, modules'],
        ['/admin/companies', 'Liste sociétés', 'Admin entreprise', 'Filiales d\'un tenant'],
        ['/admin/companies/new', 'Création société', 'Admin entreprise', 'NIF, RC, CNSS'],
        ['/admin/companies/:id', 'Fiche société', 'Admin entreprise', 'Organigramme, effectif'],
        ['/admin/settings', 'Paramètres généraux', 'Admin entreprise', 'Devise, langues, logo'],
        ['/admin/cnss-params', 'Paramètres CNSS', 'Admin entreprise', 'Taux, plafonds, SMIG'],
        ['/admin/users', 'Liste utilisateurs', 'Admin entreprise', 'Avec rôles et statuts'],
        ['/admin/users/new', 'Création utilisateur', 'Admin entreprise', 'Email, rôle, tenant'],
        ['/admin/roles', 'Gestion rôles', 'Admin entreprise', 'RBAC matrice permissions'],
    ], ratios=[0.30, 0.22, 0.18, 0.30], story=s)

    sec('8.3 Module Employés', s)
    tbl(['Route', 'Écran', 'Rôle', 'Description'], [
        ['/employees', 'Liste employés', 'RH/Admin/Manager', 'Recherche, filtres, export'],
        ['/employees/new', 'Nouvel employé', 'RH', 'Wizard 5 étapes (identification, contrat, etc.)'],
        ['/employees/:id', 'Fiche employé', 'RH/Manager/Employé', 'Onglets : info, contrat, paie, congés, documents'],
        ['/employees/:id/edit', 'Édition employé', 'RH', 'Tous champs modifiables'],
        ['/employees/:id/contracts', 'Contrats employé', 'RH', 'Historique + avenants'],
        ['/employees/:id/documents', 'Documents employé', 'RH', 'Upload, classification, sign'],
        ['/employees/:id/payslips', 'Bulletins de paie', 'RH/Comptable/Employé', 'Historique + PDF'],
        ['/employees/:id/leaves', 'Congés employé', 'RH/Manager', 'Historique + soldes'],
        ['/employees/:id/timeline', 'Chronologie RH', 'RH', 'Audit trail visuel'],
        ['/employees/import', 'Import en masse', 'RH', 'CSV/Excel avec mapping'],
    ], ratios=[0.28, 0.22, 0.22, 0.28], story=s)

    sec('8.4 Module Congés & absences', s)
    tbl(['Route', 'Écran', 'Rôle', 'Description'], [
        ['/leaves', 'Liste demandes congés', 'RH/Manager', 'Filtres par statut/type/employé'],
        ['/leaves/new', 'Nouvelle demande', 'Employé/RH', 'Type, dates, motif, justificatif'],
        ['/leaves/:id', 'Détail demande', 'Tous', 'Workflow validation, commentaires'],
        ['/leaves/calendar', 'Calendrier congés', 'RH/Manager', 'Vue équipe, gantt'],
        ['/leaves/balances', 'Soldes congés', 'RH/Employé', 'Par type, par période'],
        ['/leaves/holidays', 'Jours fériés', 'RH', 'Calendrier guinéen éditable'],
        ['/leaves/policies', 'Politiques congés', 'RH/Admin', 'Règles par type de congé'],
    ], ratios=[0.25, 0.22, 0.20, 0.33], story=s)

    sec('8.5 Module Paie & bulletins', s)
    tbl(['Route', 'Écran', 'Rôle', 'Description'], [
        ['/payroll/periods', 'Périodes de paie', 'Comptable/RH', 'Liste avec statut (ouverte/cloturée)'],
        ['/payroll/periods/new', 'Ouverture période', 'Comptable', 'Mois, année, société'],
        ['/payroll/periods/:id', 'Détail période', 'Comptable', 'Employés inclus, calcul'],
        ['/payroll/periods/:id/run', 'Lancement calcul', 'Comptable', 'Confirmation + progress'],
        ['/payroll/periods/:id/review', 'Revue paie', 'Comptable/RH', 'Anomalies, ajustements'],
        ['/payroll/periods/:id/lock', 'Clôture période', 'Comptable', 'Verrouillage définitif'],
        ['/payroll/payslips/:id', 'Bulletin détaillé', 'Comptable/Employé', 'Rubriques + PDF'],
        ['/payroll/payslips/:id/pdf', 'Bulletin PDF', 'Tous', 'Téléchargement vectoriel'],
        ['/payroll/declarations', 'Déclarations CNSS', 'Comptable', 'Génération trimestrielle'],
        ['/payroll/elements', 'Éléments variables', 'RH/Comptable', 'Primes, HS, absences'],
        ['/payroll/exports', 'Exports comptables', 'Comptable', 'Excel, CSV, formats Sage/Cegid'],
    ], ratios=[0.30, 0.22, 0.20, 0.28], story=s)

    sec('8.6 Module Tableaux de bord & audit', s)
    tbl(['Route', 'Écran', 'Rôle', 'Description'], [
        ['/dashboard', 'Dashboard RH', 'RH/Admin', 'KPIs effectif, turn-over, congés'],
        ['/dashboard/dg', 'Dashboard Direction', 'DG/Admin', 'Synthèse financière, headcount'],
        ['/dashboard/employee', 'Portail employé', 'Employé', 'Mes infos, congés, bulletins'],
        ['/audit', "Journal d'audit", 'Super Admin/RH', 'Recherche, filtres, export'],
        ['/audit/:id', 'Détail audit log', 'Super Admin', 'Diff before/after'],
        ['/reports', 'Rapports', 'RH/Comptable', 'Catalogue rapports paramétrables'],
        ['/reports/builder', 'Créateur rapport', 'RH', 'Drag-drop colonnes, filtres'],
    ], ratios=[0.22, 0.22, 0.20, 0.36], story=s)

    # ============== CHAPITRE 9 ==============
    chap('9', 'API REST complète', s)
    lead("L'API REST de DataSphere RH Guinée suit les conventions OpenAPI 3.1, est "
         "versionnée via préfixe /api/v1, et utilise JWT Bearer pour l'authentification. "
         "Toutes les réponses sont au format JSON avec une envelope standardisée "
         "{data, meta, error}.", s)

    sec('9.1 Conventions et standards', s)
    bullets([
        "<b>Authentification :</b> Header Authorization: Bearer jwt + header X-Tenant-ID",
        "<b>Versioning :</b> Préfixe /api/v1, backward compatibility garantie 24 mois",
        "<b>Pagination :</b> ?page=1&limit=20 + headers X-Total-Count, X-Page-Count",
        "<b>Filtrage :</b> ?filter[status]=actif&filter[company_id]=uuid (RFC style)",
        "<b>Tri :</b> ?sort=-created_at,name (- pour descendant)",
        "<b>Inclusion :</b> ?include=company,contracts pour éviter le N+1",
        "<b>Rate limiting :</b> 100 req/min/user, 1000 req/min/tenant — header X-RateLimit-Remaining",
        "<b>Erreurs :</b> Format RFC 7807 Problem Details avec code, title, detail, instance",
        "<b>Idempotence :</b> Header Idempotency-Key pour POST/PUT (24h)",
        "<b>Webhooks :</b> Sortants (paie.cloturee, conge.valide, etc.) signés HMAC-SHA256",
    ], s)

    sec('9.2 Endpoints Authentification', s)
    tbl(['Méthode', 'Endpoint', 'Description', 'Auth'], [
        ['POST', '/api/v1/auth/login', 'Connexion', 'Public'],
        ['POST', '/api/v1/auth/refresh', 'Refresh token', 'Authentifié'],
        ['POST', '/api/v1/auth/logout', 'Déconnexion', 'Authentifié'],
        ['GET', '/api/v1/auth/me', 'Profil courant', 'Authentifié'],
        ['POST', '/api/v1/auth/2fa/setup', 'Configurer 2FA', 'Authentifié'],
        ['POST', '/api/v1/auth/2fa/verify', 'Vérifier 2FA', 'Authentifié'],
        ['POST', '/api/v1/auth/password/forgot', 'Mot de passe oublié', 'Public'],
        ['POST', '/api/v1/auth/password/reset', 'Réinitialiser mot de passe', 'Public'],
    ], ratios=[0.10, 0.36, 0.34, 0.20], story=s)

    sec('9.3 Endpoints Tenants & companies', s)
    tbl(['Méthode', 'Endpoint', 'Description', 'Rôle'], [
        ['GET', '/api/v1/tenants', 'Liste tenants', 'Super Admin'],
        ['POST', '/api/v1/tenants', 'Créer tenant', 'Super Admin'],
        ['GET', '/api/v1/tenants/:id', 'Détail tenant', 'Super Admin'],
        ['PATCH', '/api/v1/tenants/:id', 'Modifier tenant', 'Super Admin'],
        ['DELETE', '/api/v1/tenants/:id', 'Supprimer tenant', 'Super Admin'],
        ['GET', '/api/v1/companies', 'Liste sociétés', 'Admin entreprise'],
        ['POST', '/api/v1/companies', 'Créer société', 'Admin entreprise'],
        ['GET', '/api/v1/companies/:id', 'Détail société', 'Admin/RH'],
        ['PATCH', '/api/v1/companies/:id', 'Modifier société', 'Admin entreprise'],
        ['GET', '/api/v1/cnss-params', 'Paramètres CNSS', 'RH/Comptable'],
        ['PUT', '/api/v1/cnss-params', 'Mettre à jour CNSS', 'Admin entreprise'],
    ], ratios=[0.10, 0.35, 0.35, 0.20], story=s)

    sec('9.4 Endpoints Employés', s)
    tbl(['Méthode', 'Endpoint', 'Description', 'Rôle'], [
        ['GET', '/api/v1/employees', 'Liste paginée', 'RH/Manager'],
        ['POST', '/api/v1/employees', 'Créer employé', 'RH'],
        ['GET', '/api/v1/employees/:id', 'Détail employé', 'RH/Manager/Employé'],
        ['PATCH', '/api/v1/employees/:id', 'Modifier employé', 'RH'],
        ['DELETE', '/api/v1/employees/:id', 'Supprimer/anonymiser', 'Admin entreprise'],
        ['GET', '/api/v1/employees/:id/contracts', 'Contrats', 'RH'],
        ['POST', '/api/v1/employees/:id/contracts', 'Ajouter contrat', 'RH'],
        ['GET', '/api/v1/employees/:id/payslips', 'Bulletins', 'RH/Employé'],
        ['GET', '/api/v1/employees/:id/documents', 'Documents', 'RH'],
        ['POST', '/api/v1/employees/:id/documents', 'Upload document', 'RH'],
        ['GET', '/api/v1/employees/export', 'Export Excel/CSV', 'RH'],
    ], ratios=[0.10, 0.36, 0.34, 0.20], story=s)

    sec('9.5 Endpoints Congés & absences', s)
    tbl(['Méthode', 'Endpoint', 'Description', 'Rôle'], [
        ['GET', '/api/v1/leaves', 'Liste demandes', 'RH/Manager/Employé'],
        ['POST', '/api/v1/leaves', 'Nouvelle demande', 'Employé/RH'],
        ['GET', '/api/v1/leaves/:id', 'Détail demande', 'RH/Manager/Employé'],
        ['POST', '/api/v1/leaves/:id/approve', 'Approuver', 'Manager'],
        ['POST', '/api/v1/leaves/:id/reject', 'Rejeter', 'Manager/RH'],
        ['GET', '/api/v1/leaves/balances/:employeeId', 'Soldes', 'RH/Employé'],
        ['GET', '/api/v1/leaves/calendar', 'Calendrier équipe', 'Manager/RH'],
        ['GET', '/api/v1/leaves/policies', 'Politiques', 'RH'],
        ['PUT', '/api/v1/leaves/policies/:id', 'Modifier politique', 'Admin entreprise'],
    ], ratios=[0.10, 0.38, 0.32, 0.20], story=s)

    sec('9.6 Endpoints Paie', s)
    tbl(['Méthode', 'Endpoint', 'Description', 'Rôle'], [
        ['GET', '/api/v1/payroll/periods', 'Liste périodes', 'Comptable/RH'],
        ['POST', '/api/v1/payroll/periods', 'Ouvrir période', 'Comptable'],
        ['GET', '/api/v1/payroll/periods/:id', 'Détail période', 'Comptable/RH'],
        ['POST', '/api/v1/payroll/periods/:id/run', 'Lancer calcul', 'Comptable'],
        ['POST', '/api/v1/payroll/periods/:id/lock', 'Clôturer', 'Comptable'],
        ['GET', '/api/v1/payroll/payslips', 'Liste bulletins', 'Comptable/RH'],
        ['GET', '/api/v1/payroll/payslips/:id', 'Détail bulletin', 'Comptable/Employé'],
        ['GET', '/api/v1/payroll/payslips/:id/pdf', 'Bulletin PDF', 'Comptable/Employé'],
        ['GET', '/api/v1/payroll/declarations/cnss', 'Déclaration CNSS', 'Comptable'],
        ['POST', '/api/v1/payroll/elements', 'Élément variable', 'RH/Comptable'],
        ['GET', '/api/v1/payroll/exports', 'Exports', 'Comptable'],
    ], ratios=[0.10, 0.40, 0.30, 0.20], story=s)

    sec('9.7 Endpoints Audit & reporting', s)
    tbl(['Méthode', 'Endpoint', 'Description', 'Rôle'], [
        ['GET', '/api/v1/audit', 'Journal audit', 'Super Admin/RH'],
        ['GET', '/api/v1/audit/:id', 'Détail log', 'Super Admin'],
        ['GET', '/api/v1/audit/export', 'Export audit', 'Super Admin'],
        ['GET', '/api/v1/reports', 'Catalogue rapports', 'RH/Comptable'],
        ['POST', '/api/v1/reports/generate', 'Générer rapport', 'RH/Comptable'],
        ['GET', '/api/v1/reports/:id/download', 'Télécharger', 'RH/Comptable'],
        ['GET', '/api/v1/dashboard/hr', 'Dashboard RH', 'RH/Admin'],
        ['GET', '/api/v1/dashboard/dg', 'Dashboard DG', 'DG/Admin'],
    ], ratios=[0.10, 0.36, 0.34, 0.20], story=s)

    sec('9.8 Exemple de schéma OpenAPI', s)
    code("""openapi: 3.1.0
info:
  title: DataSphere RH Guinée API
  version: 1.0.0
  description: SIRH premium SaaS multi-tenant pour la Guinée
servers:
  - url: https://api.datasphererh.gn/api/v1
    description: Production
components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
paths:
  /employees:
    get:
      summary: Liste paginée des employés
      security:
        - bearerAuth: []
      parameters:
        - name: page
          in: query
          schema: { type: integer, default: 1 }
        - name: limit
          in: query
          schema: { type: integer, default: 20, maximum: 100 }
        - name: filter[status]
          in: query
          schema: { type: string, enum: [actif, suspendu, sorti] }
      responses:
        '200':
          description: Liste paginée
          content:
            application/json:
              schema:
                type: object
                properties:
                  data:
                    type: array
                    items: { $ref: '#/components/schemas/Employee' }
                  meta:
                    type: object
                    properties:
                      total: { type: integer }
                      page: { type: integer }
                      limit: { type: integer }""", s)

    # ============== CHAPITRE 10 ==============
    chap('10', 'Backlog MVP en sprints', s)
    lead("Le MVP de DataSphere RH Guinée sera livré en 8 sprints de 2 semaines "
         "(16 semaines), suivis de 8 sprints premium de 2 semaines chacun pour les "
         "modules additionnels. La roadmap ci-dessous présente la planification détaillée.", s)

    img('/home/z/my-project/scripts/diagrams_png/roadmap_sprints.png', s,
        max_w=AVAIL_W * 0.98, max_h=AVAIL_H * 0.55,
        caption='Figure 5 — Roadmap MVP (8 sprints) et modules premium (8 sprints)')

    sec('10.1 Sprint 1 — Authentification & multi-tenant', s)
    body("Le premier sprint pose les fondations techniques du SaaS : infrastructure "
         "multi-tenant, authentification JWT avec refresh et 2FA, gestion des rôles "
         "RBAC, et création de tenants. À la fin de ce sprint, il est possible de "
         "créer un compte super admin, un nouveau tenant, et un utilisateur admin "
         "entreprise avec 2FA actif. C'est le socle technique sur lequel tous les "
         "modules suivants s'appuieront.", s)

    tbl(['ID', 'User Story', 'Story Points', 'Priorité'], [
        ['US-001', 'En tant que Super Admin, je crée un tenant', '5', 'Must'],
        ['US-002', "En tant qu'Admin, je m'inscris avec email + password", '3', 'Must'],
        ['US-003', "En tant qu'utilisateur, je configure le 2FA TOTP", '5', 'Must'],
        ['US-004', "En tant qu'utilisateur, je me connecte avec refresh token", '5', 'Must'],
        ['US-005', "En tant qu'Admin, j'attribue des rôles RBAC", '5', 'Must'],
        ['US-006', "En tant que système, j'isole les schémas PostgreSQL", '8', 'Must'],
        ['US-007', "En tant qu'Admin, je reset mon mot de passe", '3', 'Should'],
    ], ratios=[0.10, 0.55, 0.15, 0.20], story=s)

    sec('10.2 Sprint 2 — Entreprises & employés', s)
    body("Le sprint 2 construit le cœur du référentiel RH : gestion des sociétés "
         "(filiales d'un tenant), création et gestion des fiches employés avec photo, "
         "matricule, informations CNSS, et import en masse via Excel. Ce sprint "
         "introduit également le design system shadcn/ui qui sera utilisé sur toute "
         "l'application, garantissant cohérence visuelle et accessibilité. À l'issue "
         "de ce sprint, le système est capable de gérer un référentiel RH complet "
         "pour une entreprise, préfigurant les modules paie et congés à venir.", s)

    tbl(['ID', 'User Story', 'Story Points', 'Priorité'], [
        ['US-010', 'Admin : créer une société (NIF, RC, CNSS)', '5', 'Must'],
        ['US-011', 'RH : créer un employé (wizard 5 étapes)', '8', 'Must'],
        ['US-012', 'RH : liste paginée des employés avec recherche', '5', 'Must'],
        ['US-013', 'RH : upload photo employé (MinIO)', '3', 'Must'],
        ['US-014', 'RH : import Excel en masse avec mapping', '8', 'Should'],
        ['US-015', 'Employé : consultation de ma fiche', '3', 'Should'],
    ], ratios=[0.10, 0.55, 0.15, 0.20], story=s)

    sec('10.3 Sprints 3 à 8 — Synthèse', s)
    tbl(['Sprint', 'Thème', 'Livrables clés'], [
        ['S3', 'Contrats & documents RH', 'CDI/CDD/stage/prestataire/expatrié, avenants, upload documents, classification'],
        ['S4', 'Congés & absences', 'Workflow validation 3 niveaux, soldes, calendrier équipe, jours fériés GN'],
        ['S5', 'Paie CNSS paramétrable', 'Moteur de calcul 8 étapes, paramètres CNSS/RTS/VF par tenant, éléments variables'],
        ['S6', 'Bulletins PDF', 'Génération vectorielle, signature, archivage MinIO, déclaration CNSS trimestrielle'],
        ['S7', 'Dashboards & exports', 'KPIs RH/DG/Employé, exports Excel/PDF paramétrables, rapports périodiques'],
        ['S8', 'Audit & déploiement', 'Audit trail immuable, tests E2E, déploiement Kubernetes, documentation'],
    ], ratios=[0.10, 0.25, 0.65], story=s)

    sec('10.4 Sprints premium (post-MVP)', s)
    body("Après livraison du MVP en semaine 16, huit sprints premium de 2 semaines "
         "chacun (16 semaines supplémentaires) déploient les modules différenciateurs. "
         "Ces sprints sont commercialisés sous forme d'add-ons optionnels, intégrés "
         "aux offres Business et Enterprise, ou vendus séparément aux clients Starter "
         "souhaitant upgrader. Cette planification permet une sortie commerciale du "
         "MVP dès la semaine 17, avec enrichissement progressif sur 8 mois. Les "
         "modules premium sont prioritaires selon leur impact commercial : recrutement "
         "et portail employé (engagement utilisateur), puis notifications WhatsApp "
         "(rétention), puis mobile (accessibilité), puis IA (différenciation).", s)

    # ============== CHAPITRE 11 ==============
    chap('11', 'Prompts de génération modulaires', s)
    lead("Ce chapitre fournit 10 prompts prêts à l'emploi pour générer le projet "
         "DataSphere RH Guinée via Cursor, Claude Code, ou Lovable. Chaque prompt "
         "est autonome et ciblé sur un module spécifique, mais s'inscrit dans une "
         "cohérence globale.", s)

    sec('11.1 Prompt Master — Initialisation projet', s)
    body("Ce prompt est à exécuter en premier. Il crée la structure de base du "
         "monorepo, configure le multi-tenant, et pose les fondations techniques "
         "communes à tous les modules suivants. Les prompts modulaires peuvent ensuite "
         "être exécutés en parallèle ou en séquence selon les dépendances identifiées.", s)

    code("""# PROJET: DataSphere RH Guinée — SIRH premium SaaS multi-tenant

## CONTEXTE
Tu crées un SIRH premium SaaS pour le marché guinéen (CNSS, RTS, versement
forfaitaire). Architecture multi-tenant (schema-per-tenant PostgreSQL).

## STACK OBLIGATOIRE
- Monorepo: Turborepo + pnpm workspaces
- Frontend: Next.js 14 (App Router) + TypeScript 5 + Tailwind 3 + shadcn/ui
- Backend: NestJS 10 + TypeScript + Prisma 5
- DB: PostgreSQL 16 (schema-per-tenant)
- Cache: Redis 7
- Storage: MinIO (S3-compatible)
- Auth: JWT (15min) + refresh (7j, rotation) + 2FA TOTP
- Tests: Vitest (unit) + Playwright (E2E)
- Docker Compose pour dev local

## LIVRABLES ATTENDUS
1. Structure monorepo: /apps/web (Next.js), /apps/api (NestJS),
   /packages/ui (shadcn), /packages/types (shared), /packages/db (Prisma)
2. docker-compose.yml avec Postgres, Redis, MinIO
3. Middleware multi-tenant NestJS (sous-domaine + header + JWT claim)
4. Système d'auth complet: login, refresh, 2FA, reset password
5. Schéma Prisma avec 25+ tables (tenants, companies, employees, contracts,
   cnss_params, payroll_periods, payslips, audit_logs...)
6. Design system Tailwind + shadcn configuré (FR/EN, dark mode)
7. README détaillé + scripts de démarrage

## CONTRAINTES
- TypeScript strict (no implicit any)
- Toutes les réponses API au format {data, meta, error}
- Toutes les entités avec tenant_id UUID
- Audit trail immuable sur chaque mutation
- Tests E2E pour les flows critiques (login, paie, bulletin)
- Conformité WCAG 2.1 AA

Commence par générer la structure complète puis itère module par module.""", s)

    sec('11.2 Prompt Module Auth & RBAC', s)
    code("""# MODULE: Authentification & RBAC

Dans le monorepo DataSphere RH Guinée, implémente le module Auth complet.

## FONCTIONNALITÉS
1. POST /api/v1/auth/login (email, password, 2FA optionnel)
2. POST /api/v1/auth/refresh (rotation du refresh token, blacklist ancien)
3. POST /api/v1/auth/logout (révocation refresh)
4. POST /api/v1/auth/2fa/setup (QR code TOTP)
5. POST /api/v1/auth/2fa/verify (validation code 6 chiffres)
6. POST /api/v1/auth/password/forgot + /reset (email reset token, expiry 1h)
7. GET /api/v1/auth/me (profil + permissions)
8. 6 rôles RBAC: super_admin, admin_entreprise, rh, manager, comptable, employé
9. Guards NestJS: @Roles() decorator + JwtAuthGuard + TenantGuard
10. Refresh token stocké hashé en Redis (rotation + détection de réutilisation)

## SÉCURITÉ
- Bcrypt (cost 12) pour password hashing
- JWT signé HS256, claims: {sub, tenant_id, role, permissions[]}
- Rate limiting: 5 login/min/IP (Redis)
- Lock compte après 5 échecs (unlock par admin)
- 2FA obligatoire pour super_admin et admin_entreprise

## TESTS
- Unit tests: AuthService, JwtStrategy, RolesGuard
- E2E: flow complet login → 2FA → refresh → logout → reuse détecté

Génère le code complet NestJS + tests + documentation.""", s)

    sec('11.3 Prompt Module Employés', s)
    code("""# MODULE: Gestion des Employés

Implémente le module Employés complet dans /apps/api/src/employees.

## ENTITÉS PRISMA
- employees: id, tenant_id, company_id, matricule, nom, prenoms,
  cnss_numero, date_naissance, sexe, situation_familiale, nombre_enfants,
  adresse, telephone, email, photo_url, date_embauche, date_sortie, statut
- Index: (tenant_id, matricule) UNIQUE, (tenant_id, cnss_numero) UNIQUE
- employee_documents: id, employee_id, type, file_key (MinIO), uploaded_at

## ENDPOINTS
- GET /employees (pagination, filter[statut], filter[company_id], include)
- POST /employees (wizard 5 étapes, validation Zod)
- GET /employees/:id (avec relations optionnelles)
- PATCH /employees/:id (audit trail automatique)
- DELETE /employees/:id (soft delete + anonymisation RGPD)
- POST /employees/:id/documents (upload MinIO presigned URL)
- GET /employees/export (Excel + CSV avec mapping colonnes)
- POST /employees/import (CSV/Excel en masse, dry-run + commit)

## FRONTEND (Next.js App Router)
- /employees: DataTable shadcn avec colonnes triables, filtres, pagination
- /employees/new: wizard 5 étapes (identification, contrat, paie, documents, confirmation)
- /employees/[id]: tabs (info, contrats, paie, congés, documents, audit)
- /employees/import: drag-drop Excel + mapping + preview + commit

## UPLOAD MINIO
- Presigned URL (validité 15 min)
- Limitation: 10 Mo, types image/pdf
- Antivirus scan async (ClamAV)
- Stockage chiffré SSE-S3

Génère backend + frontend + tests E2E.""", s)

    sec('11.4 Prompt Module Paie CNSS', s)
    code("""# MODULE: Paie Guinéenne Paramétrable

Module critique: moteur de calcul de paie conforme CNSS Guinée.

## ENTITÉS PRISMA
- cnss_params: id, tenant_id, taux_cnss_salarie (0.05), taux_cnss_employeur (0.08),
  plafond_cnss (8 × smig), smig (580000), taux_rts (0.01),
  taux_versement_forfaitaire (0.04), taux_taxe_apprentissage (0.01),
  taux_formation_pro (0.03), periodicite, date_effet, date_fin
- payroll_periods: id, tenant_id, mois, annee, statut (OUVERTE/CALCULEE/VALIDEE/CLOTUREE)
- payslips: id, employee_id, period_id, toutes les rubriques

## WORKFLOW CALCUL (8 étapes)
1. Collecte éléments variables (primes, HS, absences)
2. Brut imposable = base + primes + HS + avantages - indemnités_exon
3. CNSS salarié = MIN(brut_imp, plafond) × 5%
4. CNSS employeur = MIN(brut_imp, plafond) × 8%
5. RTS = brut_imp × 1%
6. Versement forfaitaire + taxes employeur
7. Net = brut_imp - CNSS_sal - RTS - retenues
8. Génération PDF + déclaration CNSS trimestrielle

## HEURES SUPPLÉMENTAIRES
- Semaine 8 premières HS: +25%
- Semaine au-delà: +50%
- Nuit (22h-6h): +50%
- Dimanche: +75%
- Jour férié: +100%
(cumulable, paramétrable par tenant)

## CRITIQUE
- Idempotence: même input → même output (hash de contrôle)
- Audit: chaque calcul journalisé avec hash du snapshot des params
- Verrouillage: une période clôturée ne peut plus être recalculée
- Tests: 50 cas de test couvrant tous les plafonds et évolutions

Génère backend + tests + simulateur frontend.""", s)

    sec('11.5 Prompt Module Bulletins PDF', s)
    code("""# MODULE: Génération Bulletins de Paie PDF

Implémente la génération de bulletins PDF vectoriels pour DataSphere RH Guinée.

## EXIGENCES
- Format A4 portrait, vectoriel (texte sélectionnable)
- Conformité légale GN: toutes les rubriques obligatoires
- Bilingue FR/EN (toggle par employé)
- Logo entreprise en header
- Signature électronique interne (hash SHA-256 + horodatage)
- Archivage MinIO avec lifecycle 10 ans
- Mode hors-ligne (pré-génération batch)

## STACK
- puppeteer + HTML/CSS pour le rendu (vectoriel via page.pdf())
- Handlebars pour le templating
- MinIO SDK pour le stockage
- BullMQ (Redis) pour la file de génération asynchrone

## TEMPLATE HTML
- Header: logo + raison sociale + NIF/RC/CNSS
- Body: matricule, nom, poste, période, toutes les rubriques
  (brut, cotisations détaillées, net, charges patronales)
- Footer: signature électronique + QR code de vérification
- Format: tableau structuré, alignement GNF

## ENDPOINTS
- POST /api/v1/payroll/periods/:id/payslips/generate (batch async)
- GET /api/v1/payroll/payslips/:id/pdf (téléchargement)
- GET /api/v1/payroll/payslips/:id/verify (vérification signature)

## ARCHIVAGE
- Bucket MinIO: payslips/{tenant_id}/{period_id}/{employee_id}.pdf
- Chiffrement SSE-S3
- Lifecycle: transition vers archive après 12 mois, suppression après 10 ans
- Métadonnées: employee_id, period_id, generated_at, signature_hash

Génère service complet + template + tests.""", s)

    sec('11.6 Synthèse des 10 prompts', s)
    body("Les 10 prompts modulaires sont conçus pour être exécutés séquentiellement "
         "ou en parallèle selon les dépendances. Le tableau ci-dessous récapitule "
         "l'ordre recommandé et les dépendances entre prompts. Chaque prompt peut "
         "être ré-exécuté en cas d'itération, la cohérence étant garantie par les "
         "types partagés dans le monorepo.", s)

    tbl(['#', 'Prompt', 'Dépend de', 'Livrable'], [
        ['1', 'Master — Initialisation', 'Aucune', 'Crée monorepo + multi-tenant + auth'],
        ['2', 'Auth & RBAC', '#1', 'JWT, refresh, 2FA, 6 rôles'],
        ['3', 'Employés', '#1, #2', 'Fiches, import, documents MinIO'],
        ['4', 'Contrats & documents', '#3', 'CDI/CDD/stage, avenants'],
        ['5', 'Congés & absences', '#3', 'Workflow validation, soldes'],
        ['6', 'Paie CNSS', '#3, #4', 'Moteur 8 étapes, paramétrable'],
        ['7', 'Bulletins PDF', '#6', 'Génération vectorielle, archivage'],
        ['8', 'Dashboards & exports', '#3 à #7', 'KPIs, exports Excel/PDF'],
        ['9', 'Audit trail', '#1', 'Logs immuables, diff JSONB'],
        ['10', 'Déploiement K8s', '#1 à #9', 'Docker, Helm, CI/CD'],
    ], ratios=[0.05, 0.25, 0.20, 0.50], story=s)

    # ============== CHAPITRE 12 ==============
    chap('12', 'Plan de commercialisation en Guinée', s)
    lead("Ce chapitre définit la stratégie go-to-market de DataSphere RH Guinée : "
         "analyse de marché, modèle de pricing, canaux de distribution, roadmap "
         "commerciale sur 36 mois, et positionnement face à la concurrence locale "
         "et internationale.", s)

    sec('12.1 Analyse du marché guinéen', s)
    body("Le marché guinéen du SIRH est largement sous-équipé : moins de 10 % des "
         "entreprises formelles disposent d'une solution RH digitale dédiée, et parmi "
         "celles-ci, la majorité utilise Excel ou des solutions internationales (Sage, "
         "Cegid) mal adaptées aux spécificités réglementaires locales. Le marché total "
         "addressable (TAM) est estimé à 6 000 organisations formelles employant "
         "collectivement plus de 250 000 salariés, dont environ 2 000 organisations "
         "(80 000 salariés) constituent le marché serviceable (SAM) immédiat.", s)

    tbl(['Segment', 'Nb organisations', 'Employés', 'Potentiel SIRH'], [
        ['PME formelles (10-250 employés)', '5 000', '120 000', 'Très élevé'],
        ['ONG internationales et locales', '200', '8 000', 'Élevé (multi-projets)'],
        ['Banques et établissements financiers', '15', '5 000', 'Moyen (exigeant)'],
        ['Cliniques privées et hôpitaux', '80', '6 000', 'Élevé (gardes, astreintes)'],
        ['Écoles privées et universités', '300', '12 000', 'Très élevé (vacataires)'],
        ['Sociétés minières et BTP', '50', '35 000', 'Moyen (gros volumes)'],
        ['Administrations et agences étatiques', '50', '40 000', 'Faible (marchés publics)'],
    ], ratios=[0.42, 0.18, 0.15, 0.25], story=s)

    sec('12.2 Modèle de pricing par employé', s)
    body("Le modèle de pricing retenu est un abonnement mensuel par employé actif, "
         "avec trois offres tiered (Starter, Business, Enterprise) et des add-ons "
         "pour les modules premium. Les prix sont libellés en GNF avec une option "
         "USD pour les ONG et expatriés. La grille est calibrée pour être accessible "
         "aux PME guinéennes tout en garantissant une marge brute supérieure à 70 %.", s)

    tbl(['Offre', 'Prix', 'Cible', 'Inclus'], [
        ['Starter', '5 000 GNF / employé / mois', '1-50 employés',
         'MVP complet, support email, 1 société, audit trail'],
        ['Business', '8 000 GNF / employé / mois', '50-500 employés',
         'Starter + 5 modules premium, support prioritaire, multi-sociétés, SLA 99,5%'],
        ['Enterprise', '12 000 GNF / employé / mois', '500+ employés',
         'Business + tous modules premium, SSO, SLA 99,9%, on-premise option, support dédié'],
        ['Add-on IA RH', '+2 000 GNF / employé / mois', 'Toutes offres',
         'Génération contrats, lettres, attestations par LLM'],
        ['Add-on Mobile', '+1 500 GNF / employé / mois', 'Toutes offres',
         'Application mobile iOS + Android, mode offline'],
    ], ratios=[0.18, 0.25, 0.20, 0.37], story=s)

    body("Cette grille tarifaire se compare favorablement aux solutions internationales "
         "(Sage Paie & RH débute à environ 25 000 GNF/employé/mois, Cegid à 30 000) "
         "tout en offrant une conformité CNSS native et un support local en français. "
         "Pour les PME de moins de 10 employés, une offre spéciale 'Micro' à 3 000 GNF "
         "avec MVP limité sera disponible pour réduire la barrière à l'entrée. La "
         "facturation est mensuelle, trimestrielle ou annuelle (avec remise 10 % en "
         "annuel), payable par virement bancaire, Orange Money, ou carte bancaire.", s)

    sec('12.3 Canaux de distribution', s)
    body("La stratégie de distribution combine quatre canaux complémentaires couvrant "
         "les segments PME, ONG, et grandes entreprises. Chaque canal a sa propre "
         "métrique de performance et son propre cycle de vente, permettant une "
         "couverture exhaustive du marché guinéen avec une efficacité commerciale "
         "optimale. L'objectif est de maintenir un coût d'acquisition client (CAC) "
         "inférieur à 500 000 GNF tout au long de la phase de croissance, garantissant "
         "un payback inférieur à 12 mois.", s)

    tbl(['Canal', 'Mécanique', 'Cible', 'Cycle vente', 'CAC estimé'], [
        ['Démarchage direct PME', 'Commerciaux internes, salons RH, chambres de commerce',
         'PME 10-100 employés', '6-12 mois', '500 000 GNF'],
        ['Partenariat cabinets comptables', 'Cabinets CAC, référencement commission 15%',
         'Tous segments', '3-6 mois', '200 000 GNF, volume élevé'],
        ['Alliances ONG et bailleurs', 'USAID, GIZ, PNUD, agences ONU',
         'ONG et projets', '6-18 mois', 'CAC élevé, LTV très élevé'],
        ['Salons et événements RH', 'Salon RH Afrique, AVCB, conférences minières',
         'Tous segments', 'Évènementiel', 'Notoriété + leads'],
        ['Digital (SEO/SEM, LinkedIn)', 'Site web optimisé, campagnes Google Ads, LinkedIn',
         'PME tech-savvy', '1-3 mois', '300 000 GNF, scaling'],
    ], ratios=[0.22, 0.28, 0.15, 0.13, 0.22], story=s)

    sec('12.4 Roadmap clients et projections', s)
    body("La roadmap commerciale sur 36 mois vise 150 clients payants représentant "
         "environ 15 000 employés gérés et un ARR (Annual Recurring Revenue) de "
         "1,8 milliard GNF (~200 000 USD). Les trois premières phases (Pilote, "
         "Croissance, Scale) ont chacune leurs propres objectifs et investissements. "
         "Cette séquence permet de valider le produit-marché avant la phase de scale, "
         "réduisant le risque de croissance prématurée.", s)

    tbl(['Phase', 'Période', 'Objectif clients', 'Employés gérés', 'Revenu cible'], [
        ['Phase 1 — Pilote', 'Mois 1-6', '3 clients gratuits + 7 payants', '500', 'Validation produit'],
        ['Phase 2 — Croissance', 'Mois 7-18', '50 clients payants', '5 000', 'ARR 600M GNF'],
        ['Phase 3 — Scale', 'Mois 19-36', '150 clients payants', '15 000', 'ARR 1,8Mrd GNF'],
    ], ratios=[0.20, 0.15, 0.25, 0.20, 0.20], story=s)

    body("La phase pilote est critique : trois clients pilotes gratuits seront "
         "sélectionnés parmi des PME, une ONG et une clinique, pour valider le "
         "produit en conditions réelles et générer les premiers témoignages clients. "
         "En échange de la gratuité pendant 6 mois, ces clients s'engagent à fournir "
         "un retour détaillé, des références, et des études de cas publiables. Cette "
         "stratégie permet d'amorcer la croissance organique avec du matériel "
         "commercial crédible dès le mois 7. Les sept clients payants additionnels "
         "de la phase pilote seront acquis via les cabinets comptables partenaires, "
         "avec une commission de 15 % sur la première année de revenu.", s)

    sec('12.5 Concurrence et positionnement', s)
    body("Le paysage concurrentiel guinéen se compose de trois catégories : (1) les "
         "solutions internationales (Sage Paie & RH, Cegid, SAP SuccessFactors) "
         "qui dominent les grandes entreprises mais restent coûteuses et mal adaptées "
         "à la CNSS locale ; (2) les solutions régionales ouest-africaines (notamment "
         "des éditeurs ivoiriens et sénégalais) avec une présence limitée en Guinée ; "
         "(3) les solutions locales artisanales développées par des cabinets "
         "informatiques, généralement en Excel ou Access, sans multi-tenant ni "
         "véritable conformité réglementaire.", s)

    tbl(['Concurrent', 'Catégorie', 'Prix', 'Conformité CNSS', 'Cible'], [
        ['Sage Paie & RH', 'International', '25 000+ GNF', 'Faible (CNSS)', 'Banques, grandes entreprises'],
        ['Cegid HR', 'International', '30 000+ GNF', 'Faible (CNSS)', 'Multi-nationales'],
        ['SAP SuccessFactors', 'International', '50 000+ GNF', 'Nulle (CNSS)', 'Très grandes entreprises'],
        ['Solutions ivoiriennes/sénégalaises', 'Régional', '8 000-15 000 GNF', 'Partielle', 'PME régionales'],
        ['Cabinets locaux Excel', 'Local artisanal', 'Gratuit - 2 000 GNF', 'Manuelle', 'TPE/PME non formelles'],
        ['<b>DataSphere RH Guinée</b>', '<b>Local premium SaaS</b>', '<b>5 000-12 000 GNF</b>', '<b>Native, paramétrable</b>', '<b>Tous segments</b>'],
    ], ratios=[0.22, 0.18, 0.17, 0.20, 0.23], story=s, cell_style=style_td_b)

    sec('12.6 Conformité légale et réglementaire', s)
    body("DataSphere RH Guinée s'engage à respecter l'ensemble des obligations légales "
         "guinéennes applicables aux services numériques : déclaration à l'Agence de "
         "Régulation des Télécommunications (ART), conformité à la loi guinéenne sur "
         "la protection des données personnelles (Loi L/2017/037/AN), hébergement "
         "prioritaire en Afrique de l'Ouest pour réduire la latence et faciliter "
         "l'audit par les autorités locales. La plateforme maintient un registre des "
         "traitements automatiquement généré, conforme aux exigences RGPD pour les "
         "filiales d'organisations européennes (ONG, banques internationales).", s)

    body("Sur le plan fiscal, DataSphere RH Guinée sera immatriculée comme société "
         "guinéenne (SARL ou SA) afin d'émettre des factures conformes TTC avec TVA "
         "applicable (taux normal 18 % en Guinée). La société bénéficiera du régime "
         "favorable des entreprises innovantes si éligible (exonération partielle "
         "d'impôt sur les bénéfices pendant 5 ans). Un accompagnement juridique "
         "spécialisé sera mobilisé pour la rédaction des CGU, CGV, et politique de "
         "protection des données, ainsi que pour les conventions de partenariat avec "
         "les cabinets compt distributeurs.", s)

    # ============== CHAPITRE 13 ==============
    chap('13', 'Critères pour atteindre un niveau SaaS premium 9,5/10', s)
    lead("L'objectif de qualité produit est fixé à 9,5/10 selon une grille d'évaluation "
         "couvrant cinq dimensions : expérience utilisateur, sécurité, scalabilité, "
         "fiabilité, et viabilité business. Ce chapitre détaille les 50 critères "
         "notés et les actions concrètes pour atteindre le score cible.", s)

    sec('13.1 Grille d\'évaluation 5 dimensions', s)
    body("Chacune des cinq dimensions est notée sur 10 points, avec une pondération "
         "égale (20 % chacune) pour obtenir le score global. Le seuil de 9,5/10 "
         "exige l'excellence sur les cinq dimensions simultanément, ce qui constitue "
         "un standard de niveau Stripe, Linear, ou Notion — les références du SaaS "
         "premium mondial. Le tableau ci-dessous présente les critères détaillés par "
         "dimension avec leur pondération interne.", s)

    sub('13.1.1 Dimension 1 — Expérience utilisateur (UX/UI)', s)
    tbl(['Critère', 'Standard attendu', 'Poids /10'], [
        ['Design system cohérent', 'shadcn/ui + Radix, tokens design, dark mode', '1,5'],
        ['Responsive mobile-first', 'Breakpoints Tailwind, PWA installable', '1,0'],
        ['Accessibilité WCAG 2.1 AA', 'Audit axe-core, navigation clavier, ARIA', '1,5'],
        ['Performance frontend', 'Lighthouse > 90, Core Web Vitals < 2,5s LCP', '1,5'],
        ['i18n FR/EN', 'Traductions natives, détection locale', '1,0'],
        ['Onboarding utilisateur', 'Tooltips, checklists, vidéo intégrée', '1,0'],
        ['Micro-interactions', 'Loading states, toasts, transitions', '1,0'],
        ['Erreurs et récupération', 'Messages clairs, suggestions, undo', '1,5'],
    ], ratios=[0.32, 0.53, 0.15], story=s)

    sub('13.1.2 Dimension 2 — Sécurité', s)
    tbl(['Critère', 'Standard attendu', 'Poids /10'], [
        ['Chiffrement at-rest + in-transit', 'AES-256 + TLS 1.3, HSTS', '1,5'],
        ['Auth multi-facteur', '2FA TOTP obligatoire Admin, optionnel autre', '1,0'],
        ['RBAC granulaire', '6 rôles + permissions par module/action', '1,5'],
        ['Audit trail immuable', 'Append-only, hash chaîné, rétention 10 ans', '1,5'],
        ["Tests d'intrusion annuels", 'Pentests externes, bug bounty', '1,0'],
        ['Conformité RGPD + locales', 'Registre traitements, droit oubli', '1,5'],
        ['Backup et recovery', 'Quotidien, RPO 24h, RTO 4h, DR testé', '1,0'],
        ['Secrets management', 'Vault, rotation, zero hardcode', '1,0'],
    ], ratios=[0.32, 0.53, 0.15], story=s)

    sub('13.1.3 Dimension 3 — Scalabilité', s)
    tbl(['Critère', 'Standard attendu', 'Poids /10'], [
        ['Architecture multi-tenant', 'Schema-per-tenant, 1000+ tenants', '1,5'],
        ['Stateless services', 'K8s HPA, 0 downtime deploy', '1,0'],
        ['Cache Redis', 'Sessions, cache DB, file workers', '1,0'],
        ['DB partitioning', 'Range par mois sur payslips/audit', '1,5'],
        ['CDN + edge caching', 'Cloudflare, images WebP/AVIF', '1,0'],
        ['API rate limiting', '100 req/min/user, 1000/min/tenant', '1,0'],
        ['Workers asynchrones', 'BullMQ + Redis, retries, dead-letter', '1,5'],
        ['Observabilité', 'Logs, métriques, traces, alerting Grafana', '1,0'],
    ], ratios=[0.32, 0.53, 0.15], story=s)

    sub('13.1.4 Dimension 4 — Fiabilité', s)
    tbl(['Critère', 'Standard attendu', 'Poids /10'], [
        ['SLA 99,9%', 'Mesuré mensuellement, crédits si breach', '2,0'],
        ['Tests automatisés', '> 80% coverage, E2E Playwright', '1,5'],
        ['CI/CD complet', 'GitHub Actions, tests + scan security', '1,5'],
        ['Monitoring proactif', 'Healthchecks, alerting PagerDuty', '1,5'],
        ['Disaster recovery', 'Testé trimestriellement, failover < 4h', '1,5'],
        ['Rollback rapide', 'Database migrations reversibles', '1,0'],
        ['Feature flags', 'LaunchDarkly, déploiement progressif', '1,0'],
    ], ratios=[0.32, 0.53, 0.15], story=s)

    sub('13.1.5 Dimension 5 — Viabilité business', s)
    tbl(['Critère', 'Standard attendu', 'Poids /10'], [
        ['MRR growth', '> 10%/mois en phase croissance', '1,5'],
        ['Churn annuel', '< 3%, analyse churn mensuelle', '1,5'],
        ['NPS', '> 50, survey trimestrielle', '1,5'],
        ['CAC payback', '< 12 mois', '1,5'],
        ['Net revenue retention', '> 110% (expansion)', '1,5'],
        ['Gross margin', '> 70% (coût infrastructure < 30%)', '1,5'],
        ['Support response time', '< 4h business, < 1h critique', '1,0'],
    ], ratios=[0.32, 0.53, 0.15], story=s)

    sec("13.2 Plan d'amélioration continue", s)
    body("L'atteinte du score 9,5/10 n'est pas un état figé mais un processus "
         "d'amélioration continue piloté par un comité qualité trimestriel. Trois "
         "leviers principaux sont activés en parallèle : (1) un programme de "
         "tests automatisés exhaustifs couvrant 80 % du code (unit, integration, "
         "E2E), (2) un programme de recueil continu du feedback utilisateur via "
         "NPS trimestriel, interviews mensuelles, et analytics produit, (3) un "
         "programme de sécurité avec pentests annuels, bug bounty continu, et "
         "veille CVE sur l'ensemble des dépendances.", s)

    body("Le comité qualité trimestriel est composé du CTO, du Product Owner, du "
         "Responsable Sécurité, et d'un représentant client. Il examine les métriques "
         "des cinq dimensions, identifie les axes en dessous du seuil, et arbitre "
         "les investissements correctifs. Un dashboard temps réel consolidant ces "
         "métriques est accessible à toute l'équipe, garantissant la transparence "
         "et l'engagement collectif vers l'objectif 9,5/10. Chaque trimestre, un "
         "rapport qualité est présenté au board et partagé avec les clients majeurs "
         "afin de matérialiser l'engagement qualité de la plateforme.", s)

    # ============== CHAPITRE 14 ==============
    chap('14', 'Conclusion & Prochaines étapes', s)
    lead("DataSphere RH Guinée se positionne comme une opportunité stratégique "
         "unique pour combler le déficit de solutions RH premium adaptées au "
         "contexte guinéen, avec un potentiel commercial de 1,8 milliard GNF "
         "d'ARR à 36 mois.", s)

    sec('14.1 Synthèse des livrables', s)
    body("Ce document a présenté l'ensemble des dix livrables attendus : cahier "
         "des charges fonctionnel complet, modèle de données PostgreSQL, architecture "
         "technique multi-tenant, règles métiers détaillées de la paie guinéenne "
         "(CNSS, RTS, versement forfaitaire), liste des 60+ écrans frontend, API "
         "REST complète avec 80+ endpoints, backlog MVP en 8 sprints, prompts de "
         "génération modulaires pour Cursor/Claude/Lovable, plan de commercialisation "
         "sur 36 mois, et grille d'évaluation 9,5/10 sur 50 critères. Chaque livrable "
         "est conçu pour être directement actionnable par les équipes produit, "
         "technique, et commerciale.", s)

    sec('14.2 Recommandations et prochaines étapes', s)
    body("Trois recommandations prioritaires conditionnent le succès du projet. "
         "Premièrement, constituer dès le mois 1 une équipe pluridisciplinaire "
         "comprenant au minimum un Tech Lead full-stack, deux développeurs seniors "
         "(un frontend Next.js, un backend NestJS), un Product Owner avec expertise "
         "RH guinéenne, et un commercial avec réseau PME. Deuxièmement, valider "
         "juridiquement les paramètres CNSS, RTS, et versement forfaitaire auprès "
         "d'un cabinet juridique guinéen avant le démarrage du sprint 5 (Paie). "
         "Troisièmement, signer trois clients pilotes avant la fin du sprint 4 "
         "pour démarrer la validation produit en conditions réelles dès le sprint 5.", s)

    body("Le démarrage effectif du développement peut intervenir dès validation de "
         "ce cahier des charges, avec un objectif de mise en production du MVP "
         "à 16 semaines (S8), une sortie commerciale à 18 semaines (S9), et un "
         "déploiement des modules premium sur 32 semaines supplémentaires (jusqu'à "
         "la semaine 48). Le plan d'investissement initial recommandé est de "
         "150 000 USD pour couvrir les 6 premiers mois (équipe + infrastructure + "
         "marketing), avec un break-even attendu au mois 18. Une levée de fonds "
         "Série A de 500 000 USD peut être envisagée au mois 12 pour accélérer "
         "la phase de scale.", s)

    sec('14.3 Parcours employé complet', s)
    body("Pour rappel de la cohérence du système, le parcours complet d'un employé "
         "dans DataSphere RH Guinée couvre l'ensemble du cycle de vie RH, du "
         "recrutement au départ, en passant par l'onboarding, la vie active avec "
         "gestion des congés et absences, et la paie mensuelle. Chaque étape "
         "bénéficie de l'audit trail complet et génère les documents administratifs "
         "réglementaires requis.", s)

    img('/home/z/my-project/scripts/diagrams_png/user_journey.png', s,
        max_w=AVAIL_W * 0.98, max_h=AVAIL_H * 0.40,
        caption='Figure 6 — Parcours employé complet dans DataSphere RH Guinée')

    return s


def main():
    output_body = "/home/z/my-project/scripts/body.pdf"
    output_cover = "/home/z/my-project/scripts/cover.pdf"
    output_final = "/home/z/my-project/download/DataSphere_RH_Guinee_Cahier_des_charges.pdf"

    os.makedirs(os.path.dirname(output_final), exist_ok=True)

    doc = TocDocTemplate(
        output_body,
        pagesize=A4,
        leftMargin=LEFT_M, rightMargin=RIGHT_M,
        topMargin=TOP_M, bottomMargin=BOTTOM_M,
        title="DataSphere RH Guinée — Cahier des charges SIRH premium SaaS",
        author="Z.ai",
        creator="Z.ai",
        subject="SIRH premium SaaS multi-tenant pour la Guinée"
    )
    story = build_story()
    print("Building body PDF...")
    doc.multiBuild(story, onFirstPage=on_page, onLaterPages=on_page)
    print(f"  -> {output_body}")

    print("Merging cover + body...")
    from pypdf import PdfReader, PdfWriter
    A4_W, A4_H = 595.28, 841.89

    def normalize_page(page):
        box = page.mediabox
        w, h = float(box.width), float(box.height)
        if abs(w - A4_W) > 2 or abs(h - A4_H) > 2:
            page.scale_to(A4_W, A4_H)
        return page

    writer = PdfWriter()
    cover_page = PdfReader(output_cover).pages[0]
    writer.add_page(normalize_page(cover_page))
    for page in PdfReader(output_body).pages:
        writer.add_page(normalize_page(page))
    writer.add_metadata({
        '/Title': 'DataSphere RH Guinée — Cahier des charges SIRH premium SaaS',
        '/Author': 'Z.ai',
        '/Creator': 'Z.ai',
        '/Subject': 'SIRH premium SaaS multi-tenant pour la Guinée',
    })
    with open(output_final, 'wb') as f:
        writer.write(f)
    print(f"  -> {output_final}")
    print(f"Total pages: {len(PdfReader(output_final).pages)}")


if __name__ == "__main__":
    main()
