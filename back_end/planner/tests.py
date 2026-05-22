"""
Tests d'integració per a l'API REST de Wild Planner.

Cobreixen:
  - Autenticació (registre, login, credencials incorrectes)
  - Permisos per rol (només el propietari pot editar/eliminar)
  - CRUD de rutes, materials, menjars, motxilles i planificacions
  - Recuperació de detalls (perfil d'usuari, ruta amb comentaris)

Executar amb:  python manage.py test planner
"""

from django.urls import reverse
from django.contrib.auth.hashers import make_password
from rest_framework import status
from rest_framework.test import APITestCase, APIClient

from .models import (
    Usuari, Ruta, Material, Menjar, Motxilla, Planificacio,
)
from .services import generate_token


# ============================================================
# UTILITATS COMUNES
# ============================================================
def make_user(username="alex", password="Test1234!", rol="usuari", email=None):
    """Crea un usuari amb la contrasenya ja hashejada (com fa el RegistreSerializer)."""
    return Usuari.objects.create(
        username=username,
        email=email or f"{username}@test.com",
        password=make_password(password),
        rol=rol,
    )


def auth_headers(user):
    """Construeix la capçalera Authorization Bearer que espera RolePermission."""
    token = generate_token(user)
    return {"HTTP_AUTHORIZATION": f"Bearer {token}"}


# ============================================================
# 1. AUTENTICACIÓ
# ============================================================
class AutenticacioTests(APITestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = make_user(username="alex", password="Test1234!")

    def test_registre_crea_usuari_correctament(self):
        url = reverse("registre_persona")
        payload = {
            "username": "nou_usuari",
            "email": "nou@test.com",
            "password": "Segura123!",
            "biografia": "Hola món",
        }
        response = self.client.post(url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(Usuari.objects.filter(username="nou_usuari").exists())

    def test_registre_falla_amb_dades_invalides(self):
        url = reverse("registre_persona")
        response = self.client.post(url, {"username": "x"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_login_credencials_correctes_retorna_token(self):
        url = reverse("login")
        response = self.client.post(
            url, {"username": "alex", "password": "Test1234!"}, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("token", response.data)
        self.assertEqual(response.data["username"], "alex")

    def test_login_credencials_incorrectes_retorna_401(self):
        url = reverse("login")
        response = self.client.post(
            url, {"username": "alex", "password": "incorrecta"}, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


# ============================================================
# 2. PERFIL D'USUARI
# ============================================================
class PerfilUsuariTests(APITestCase):
    def setUp(self):
        self.user = make_user(username="alex")
        self.other = make_user(username="maria")

    def test_retrieve_perfil_propi(self):
        url = reverse("perfil-usuari", kwargs={"pk": self.user.id})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["username"], "alex")

    def test_retrieve_perfil_inexistent_retorna_404(self):
        url = reverse("perfil-usuari", kwargs={"pk": 9999})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_update_perfil_propi(self):
        url = reverse("update_usuari", kwargs={"pk": self.user.id})
        payload = {
            "username": "alex",
            "email": "alex@test.com",
            "biografia": "Nova bio",
        }
        response = self.client.put(
            url, payload, format="json", **auth_headers(self.user)
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertEqual(self.user.biografia, "Nova bio")

    def test_no_pots_editar_perfil_d_un_altre(self):
        url = reverse("update_usuari", kwargs={"pk": self.other.id})
        response = self.client.put(
            url,
            {"username": "maria", "email": "maria@test.com"},
            format="json",
            **auth_headers(self.user),
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


# ============================================================
# 3. RUTES — CRUD I PERMISOS
# ============================================================
class RutesTests(APITestCase):
    def setUp(self):
        self.user = make_user(username="alex")
        self.other = make_user(username="maria")
        self.ruta = Ruta.objects.create(
            nom="Camí dels Bons Homes",
            descripcio="Ruta de prova",
            modalitat="senderisme",
            dificultat="moderada",
            usuari=self.user,
        )

    def test_list_rutes_public(self):
        url = reverse("llistat-rutes")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data), 1)

    def test_retrieve_ruta_inclou_comentaris_i_valoracions(self):
        url = reverse("detall-ruta", kwargs={"pk": self.ruta.id})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("ruta", response.data)
        self.assertIn("comentaris", response.data)
        self.assertIn("valoracions", response.data)

    def test_retrieve_ruta_inexistent_retorna_404(self):
        url = reverse("detall-ruta", kwargs={"pk": 9999})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_crear_ruta_autenticat(self):
        url = reverse("crear_rutes")
        payload = {
            "nom": "Pic del Carlit",
            "descripcio": "Ascensió clàssica",
            "modalitat": "alpinisme",
            "dificultat": "dificil",
            "nodes": [
                {"latitud": 42.5683, "longitud": 1.9258, "altitud": 1800},
                {"latitud": 42.5712, "longitud": 1.9314, "altitud": 2921},
            ],
            "trams": [
                {"distancia": 5200, "desnivell_positiu": 1121, "desnivell_negatiu": 0}
            ],
        }
        response = self.client.post(
            url, payload, format="json", **auth_headers(self.user)
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["total_nodes"], 2)

    def test_crear_ruta_sense_token_no_permes(self):
        url = reverse("crear_rutes")
        response = self.client.post(url, {"nom": "X"}, format="json")
        # RolePermission permet GET sense token però bloca POST
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_no_pots_editar_ruta_d_un_altre(self):
        url = reverse("editar-meta-ruta", kwargs={"pk": self.ruta.id})
        response = self.client.patch(
            url, {"nom": "Hackejada"}, format="json", **auth_headers(self.other)
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_editar_meta_de_la_propia_ruta(self):
        url = reverse("editar-meta-ruta", kwargs={"pk": self.ruta.id})
        response = self.client.patch(
            url,
            {"nom": "Nou nom", "dificultat": "facil"},
            format="json",
            **auth_headers(self.user),
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.ruta.refresh_from_db()
        self.assertEqual(self.ruta.nom, "Nou nom")
        self.assertEqual(self.ruta.dificultat, "facil")

    def test_eliminar_propia_ruta(self):
        url = reverse("eliminar-ruta", kwargs={"pk": self.ruta.id})
        response = self.client.delete(url, **auth_headers(self.user))
        self.assertIn(
            response.status_code,
            [status.HTTP_200_OK, status.HTTP_204_NO_CONTENT],
        )
        self.assertFalse(Ruta.objects.filter(id=self.ruta.id).exists())


# ============================================================
# 4. CATÀLEG: MATERIALS I MENJARS
# ============================================================
class CatalegTests(APITestCase):
    def setUp(self):
        self.user = make_user(username="alex")
        Material.objects.create(nom="Tenda", pes=2200, preu=180)
        Menjar.objects.create(nom="Barreta energètica", pes=40, calories=180)

    def test_list_materials_public(self):
        url = reverse("list-materials")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    def test_crear_material_autenticat(self):
        url = reverse("crear-material")
        payload = {"nom": "Sac de dormir", "pes": 900, "preu": 120}
        response = self.client.post(
            url, payload, format="json", **auth_headers(self.user)
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(Material.objects.filter(nom="Sac de dormir").exists())

    def test_list_menjars_public(self):
        url = reverse("list-menjars")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)


# ============================================================
# 5. MOTXILLA I PLANIFICACIÓ
# ============================================================
class MotxillaIPlanificacioTests(APITestCase):
    def setUp(self):
        self.user = make_user(username="alex")
        self.ruta = Ruta.objects.create(
            nom="GR-11", modalitat="senderisme", dificultat="moderada",
            usuari=self.user,
        )

    def test_crear_motxilla(self):
        url = reverse("crear-motxilla")
        response = self.client.post(
            url,
            {"nom": "Motxilla d'estiu", "pes_base": 8.5},
            format="json",
            **auth_headers(self.user),
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(Motxilla.objects.filter(nom="Motxilla d'estiu").exists())

    def test_list_motxilles_d_un_usuari(self):
        Motxilla.objects.create(usuari=self.user, nom="Motxilla bàsica", pes_base=5)
        url = reverse("list-motxilles-usuari", kwargs={"pk": self.user.id})
        response = self.client.get(url, **auth_headers(self.user))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    def test_crear_i_recuperar_planificacio(self):
        # Crear
        url_create = reverse("crear-planificacio")
        response = self.client.post(
            url_create,
            {
                "titol": "Cap de setmana al Pirineu",
                "ruta": self.ruta.id,
                "data_inici": "2026-06-01",
                "data_fi": "2026-06-02",
            },
            format="json",
            **auth_headers(self.user),
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        plan_id = response.data["id"]

        # Recuperar
        url_get = reverse("retrieve-planificacio", kwargs={"pk": plan_id})
        response = self.client.get(url_get, **auth_headers(self.user))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["titol"], "Cap de setmana al Pirineu")
