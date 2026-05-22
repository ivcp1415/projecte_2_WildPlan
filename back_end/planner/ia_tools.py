import json
from .models import Ruta, Material, Menjar, Motxilla, MotxillaMaterial, MotxillaMenjar, Planificacio


def get_ruta_info(ruta_id: int) -> dict:
    """Returns technical data about a route as a clean dict for the AI agent."""
    try:
        ruta = Ruta.objects.get(id=ruta_id)
    except Ruta.DoesNotExist:
        return {"error": f"Ruta {ruta_id} no trobada"}

    return {
        "nom": ruta.nom,
        "modalitat": ruta.modalitat,
        "dificultat": ruta.dificultat,
        "distancia_km": float(ruta.distancia) if ruta.distancia else None,
        "desnivell_positiu_m": ruta.desnivell_positiu,
        "desnivell_negatiu_m": ruta.desnivell_negatiu,
        "temps_estimat_h": float(ruta.temps_estimat) if ruta.temps_estimat else None,
        "num_nodes": ruta.nodes.count(),
    }


def add_item_to_planificacio(
    planificacio_id: int,
    nom: str,
    tipus: str,
    quantitat: int = 1,
    pes: float = None,
    preu: float = None,
    calories: int = None,
) -> dict:
    """Adds a material or menjar to the motxilla linked to a planificació.
    Creates the motxilla if none exists yet. Creates the catalog item if not found."""
    try:
        planificacio = Planificacio.objects.select_related('motxilla', 'usuari').get(id=planificacio_id)
    except Planificacio.DoesNotExist:
        return {"ok": False, "error": f"Planificació {planificacio_id} no trobada"}

    motxilla = planificacio.motxilla
    if motxilla is None:
        motxilla = Motxilla.objects.create(
            usuari=planificacio.usuari,
            nom=f"Motxilla - {planificacio.titol}",
        )
        planificacio.motxilla = motxilla
        planificacio.save(update_fields=['motxilla'])

    if tipus == "material":
        item = Material.objects.filter(nom__iexact=nom).first()
        if not item:
            item = Material.objects.create(nom=nom, pes=pes, preu=preu)
        else:
            # Update pes/preu if the AI provides better estimates
            updated = False
            if pes is not None and item.pes is None:
                item.pes = pes
                updated = True
            if preu is not None and item.preu is None:
                item.preu = preu
                updated = True
            if updated:
                item.save()
        MotxillaMaterial.objects.update_or_create(
            motxilla=motxilla,
            material=item,
            defaults={"quantitat": quantitat},
        )
        return {"ok": True, "tipus": "material", "nom": item.nom, "quantitat": quantitat, "pes_g": float(item.pes or 0), "preu_eur": float(item.preu or 0)}

    elif tipus == "menjar":
        item = Menjar.objects.filter(nom__iexact=nom).first()
        if not item:
            item = Menjar.objects.create(nom=nom, pes=pes, preu=preu, calories=calories)
        else:
            updated = False
            if pes is not None and item.pes is None:
                item.pes = pes
                updated = True
            if preu is not None and item.preu is None:
                item.preu = preu
                updated = True
            if calories is not None and item.calories is None:
                item.calories = calories
                updated = True
            if updated:
                item.save()
        MotxillaMenjar.objects.update_or_create(
            motxilla=motxilla,
            menjar=item,
            defaults={"quantitat": quantitat},
        )
        return {"ok": True, "tipus": "menjar", "nom": item.nom, "quantitat": quantitat, "pes_g": float(item.pes or 0), "preu_eur": float(item.preu or 0), "calories": item.calories or 0}

    return {"ok": False, "error": f"Tipus '{tipus}' no vàlid. Ha de ser 'material' o 'menjar'"}


DRAFT_TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "add_item_to_draft",
            "description": (
                "Afegeix un material o menjar a l'esborrany temporal de la motxilla de l'usuari. "
                "Usa aquesta eina de forma proactiva i autònoma quan les dades de la ruta indiquin "
                "que l'usuari necessita equipament específic. Els ítems es desaran quan es desi la ruta."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "nom": {
                        "type": "string",
                        "description": "Nom del material o menjar",
                    },
                    "tipus": {
                        "type": "string",
                        "enum": ["material", "menjar"],
                        "description": "Tipus d'ítem: 'material' per a equipament, 'menjar' per a aliments",
                    },
                    "quantitat": {
                        "type": "integer",
                        "description": "Quantitat de l'ítem",
                    },
                    "pes": {
                        "type": "number",
                        "description": "Pes unitari en grams. Estima un valor realista.",
                    },
                    "preu": {
                        "type": "number",
                        "description": "Preu unitari en EUR. Estima un valor realista.",
                    },
                    "calories": {
                        "type": "integer",
                        "description": "Calories per unitat. OBLIGATORI per a tipus 'menjar'.",
                    },
                },
                "required": ["nom", "tipus", "quantitat", "pes", "preu"],
            },
        },
    },
]

# OpenAI-compatible tool schemas (works with OpenAI, Groq, Ollama, Together AI, etc.)
TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "get_ruta_info",
            "description": (
                "Obté les dades tècniques d'una ruta: distància, desnivell positiu/negatiu, "
                "dificultat, modalitat i temps estimat. Crida aquesta eina SEMPRE al principi "
                "per entendre les característiques de l'itinerari abans de fer cap recomanació."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "ruta_id": {
                        "type": "integer",
                        "description": "ID de la ruta a consultar",
                    }
                },
                "required": ["ruta_id"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "add_item_to_planificacio",
            "description": (
                "Afegeix un material o menjar a la motxilla de la planificació. "
                "Usa aquesta eina de forma proactiva i autònoma quan les dades de la ruta "
                "indiquin que l'usuari necessita equipament específic, sense esperar confirmació."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "planificacio_id": {
                        "type": "integer",
                        "description": "ID de la planificació a la qual afegir l'ítem",
                    },
                    "nom": {
                        "type": "string",
                        "description": "Nom del material o menjar (e.g. 'Bastons de trekking', 'Barretes energètiques')",
                    },
                    "tipus": {
                        "type": "string",
                        "enum": ["material", "menjar"],
                        "description": "Tipus d'ítem: 'material' per a equipament, 'menjar' per a aliments",
                    },
                    "quantitat": {
                        "type": "integer",
                        "description": "Quantitat de l'ítem a afegir",
                    },
                    "pes": {
                        "type": "number",
                        "description": "Pes unitari en grams. OBLIGATORI: estima un valor realista basat en equipament estàndard de senderisme (p.ex. bastó de trekking ~250g, barra energètica ~50g).",
                    },
                    "preu": {
                        "type": "number",
                        "description": "Preu unitari en EUR. OBLIGATORI: estima un valor realista de mercat (p.ex. bastó de trekking ~30€, barra energètica ~1.5€).",
                    },
                    "calories": {
                        "type": "integer",
                        "description": "Calories per unitat. OBLIGATORI per a tipus 'menjar'. Estima un valor realista (p.ex. barra energètica ~200 kcal, fruita seca ~150 kcal per porció).",
                    },
                },
                "required": ["planificacio_id", "nom", "tipus", "quantitat", "pes", "preu"],
            },
        },
    },
]
