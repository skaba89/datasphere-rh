#!/usr/bin/env python3
"""Capture chaque diagramme du fichier HTML en PNG individuel via Playwright."""
import asyncio
import os
from playwright.async_api import async_playwright

DIAGRAMS = [
    ("architecture", 1),
    ("er_model", 2),
    ("workflow_paie", 3),
    ("raci_matrix", 4),
    ("roadmap_sprints", 5),
    ("user_journey", 6),
]

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
HTML_PATH = os.path.join(SCRIPT_DIR, "diagrams.html")
OUTPUT_DIR = os.path.join(SCRIPT_DIR, "diagrams_png")
os.makedirs(OUTPUT_DIR, exist_ok=True)


async def capture_all():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        context = await browser.new_context(viewport={"width": 1500, "height": 1200},
                                              device_scale_factor=2)
        page = await context.new_page()
        await page.goto(f"file://{HTML_PATH}")
        await page.wait_for_load_state("networkidle")
        # Charger Inter
        await page.wait_for_timeout(1500)

        # Sélectionner chaque .diagram
        diagram_elements = await page.query_selector_all(".diagram")
        print(f"Found {len(diagram_elements)} diagrams")

        for idx, (name, _) in enumerate(DIAGRAMS):
            el = diagram_elements[idx]
            out_path = os.path.join(OUTPUT_DIR, f"{name}.png")
            await el.screenshot(path=out_path, omit_background=False)
            print(f"  -> {out_path}")

        await browser.close()


if __name__ == "__main__":
    asyncio.run(capture_all())
